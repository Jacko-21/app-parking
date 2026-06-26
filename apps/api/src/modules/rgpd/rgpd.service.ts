import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { TenantContext } from "@bingoz/domain";

import { PrismaService } from "../database/prisma.service";
import { updateRetentionSchema, type UpdateRetentionDto } from "./dto/retention.dto";

const VEHICLE_PLATE_TOMBSTONE = "ANONYMISEE";

@Injectable()
export class RgpdService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Anonymise les plaques dont la durée de conservation est expirée
   * (retentionUntil < maintenant et pas encore anonymisées). Honore l'échéance
   * de rétention exigée par le RGPD (architecture.md § RGPD).
   */
  async anonymizeExpiredVehicles(context: TenantContext): Promise<{ anonymized: number }> {
    const now = new Date();

    const result = await this.prisma.vehicle.updateMany({
      where: {
        tenantId: context.tenantId,
        anonymizedAt: null,
        retentionUntil: { lt: now },
      },
      data: { plateNumber: VEHICLE_PLATE_TOMBSTONE, anonymizedAt: now },
    });

    if (result.count > 0) {
      await this.prisma.auditLog.create({
        data: {
          tenantId: context.tenantId,
          actorUserId: context.userId,
          action: "rgpd.vehicles_anonymized",
          resourceType: "Vehicle",
          resourceId: "batch",
          metadata: { count: result.count },
        },
      });
    }

    return { anonymized: result.count };
  }

  /** Droit d'accès : export des données personnelles d'un client (accès journalisé). */
  async exportCustomerData(context: TenantContext, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId: context.tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        vehicles: {
          select: {
            id: true,
            plateNumber: true,
            countryCode: true,
            label: true,
            retentionUntil: true,
            anonymizedAt: true,
          },
        },
        reservations: {
          select: { id: true, startsAt: true, endsAt: true, status: true, amountInCents: true, currency: true },
        },
        subscriptions: { select: { id: true, startsAt: true, endsAt: true, isActive: true } },
      },
    });

    if (!customer) {
      throw new NotFoundException("Client introuvable pour ce tenant.");
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "rgpd.customer_data_exported",
        resourceType: "Customer",
        resourceId: customerId,
        metadata: { vehicleCount: customer.vehicles.length },
      },
    });

    return customer;
  }

  /**
   * Droit à l'effacement : anonymise le client et ses plaques. On n'efface pas
   * les réservations/factures (conservation fiscale 10 ans) ; on neutralise les
   * données personnelles.
   */
  async eraseCustomerData(
    context: TenantContext,
    customerId: string,
  ): Promise<{ id: string; anonymizedVehicles: number }> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId: context.tenantId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException("Client introuvable pour ce tenant.");
    }

    const now = new Date();
    const tombstoneEmail = `anonymized+${customerId}@bingoz.invalid`;

    const anonymizedVehicles = await this.prisma.$transaction(async (tx) => {
      const vehicles = await tx.vehicle.updateMany({
        where: { tenantId: context.tenantId, customerId, anonymizedAt: null },
        data: { plateNumber: VEHICLE_PLATE_TOMBSTONE, anonymizedAt: now },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: { email: tombstoneEmail, firstName: null, lastName: null },
      });

      await tx.auditLog.create({
        data: {
          tenantId: context.tenantId,
          actorUserId: context.userId,
          action: "rgpd.customer_erased",
          resourceType: "Customer",
          resourceId: customerId,
          metadata: { anonymizedVehicles: vehicles.count },
        },
      });

      return vehicles.count;
    });

    return { id: customerId, anonymizedVehicles };
  }

  /** Configure la durée de conservation des plaques pour le tenant. */
  async setVehicleRetentionDays(
    context: TenantContext,
    input: UpdateRetentionDto,
  ): Promise<{ vehicleRetentionDays: number }> {
    const parsed = updateRetentionSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    return this.prisma.tenant.update({
      where: { id: context.tenantId },
      data: { vehicleRetentionDays: parsed.data.vehicleRetentionDays },
      select: { vehicleRetentionDays: true },
    });
  }
}
