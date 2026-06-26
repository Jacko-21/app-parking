import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ReservationStatus, type Prisma } from "@prisma/client";
import {
  computeVehicleRetentionUntil,
  DEFAULT_VEHICLE_RETENTION_DAYS,
  getCapacityAvailability,
  quoteStaticPrice,
  type ExistingReservation,
  type TenantContext,
} from "@bingoz/domain";
import type { z } from "zod";

import { PrismaService } from "../database/prisma.service";
import {
  type CreateManualReservationDto,
  createManualReservationSchema,
} from "./dto/create-manual-reservation.dto";
import {
  cancelReservationSchema,
  listReservationsSchema,
  type CancelReservationDto,
  type ListReservationsDto,
} from "./dto/manage-reservation.dto";

const NON_CANCELLABLE_STATUSES: ReadonlyArray<ReservationStatus> = [
  ReservationStatus.cancelled,
  ReservationStatus.expired,
  ReservationStatus.completed,
];

const BLOCKING_RESERVATION_STATUSES = [
  ReservationStatus.pending_payment,
  ReservationStatus.confirmed,
  ReservationStatus.completed,
];

export type CreatedManualReservation = {
  id: string;
  status: string;
  amountInCents: number;
  currency: string;
  customerId: string;
  vehicleId: string | null;
};

type CustomerNameData = {
  firstName?: string;
  lastName?: string;
};

@Injectable()
export class ReservationService {
  constructor(private readonly prisma: PrismaService) {}

  async createManualReservation(
    context: TenantContext,
    input: CreateManualReservationDto,
  ): Promise<CreatedManualReservation> {
    const dto = this.parseCreateManualReservation(input);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException("La fin de réservation doit être après le début.");
    }

    const parking = await this.prisma.parking.findFirst({
      where: {
        tenantId: context.tenantId,
        id: dto.parkingId,
      },
      select: {
        id: true,
      },
    });

    if (!parking) {
      throw new NotFoundException("Parking introuvable pour ce tenant.");
    }

    const offer = await this.prisma.offer.findFirst({
      where: {
        tenantId: context.tenantId,
        parkingId: dto.parkingId,
        id: dto.offerId,
        isActive: true,
      },
      select: {
        id: true,
        priceRules: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
          select: {
            id: true,
            label: true,
            unit: true,
            amountInCents: true,
          },
        },
      },
    });

    const priceRule = offer?.priceRules[0];

    if (!offer || !priceRule) {
      throw new NotFoundException("Offre active introuvable pour ce parking.");
    }

    const [activeSpaceCount, overlappingReservations] = await Promise.all([
      this.prisma.space.count({
        where: {
          tenantId: context.tenantId,
          parkingId: dto.parkingId,
          isActive: true,
        },
      }),
      this.prisma.reservation.findMany({
        where: {
          tenantId: context.tenantId,
          parkingId: dto.parkingId,
          status: {
            in: BLOCKING_RESERVATION_STATUSES,
          },
          startsAt: {
            lt: endsAt,
          },
          endsAt: {
            gt: startsAt,
          },
        },
        select: {
          id: true,
          status: true,
          startsAt: true,
          endsAt: true,
        },
      }),
    ]);

    const availability = getCapacityAvailability(
      { startsAt, endsAt },
      overlappingReservations.map((reservation): ExistingReservation => {
        return {
          id: reservation.id,
          status: reservation.status,
          startsAt: reservation.startsAt,
          endsAt: reservation.endsAt,
        };
      }),
      activeSpaceCount,
    );

    if (!availability.available) {
      throw new ConflictException("Aucune place disponible sur ce créneau.");
    }

    const quote = quoteStaticPrice({
      startsAt,
      endsAt,
      rule: {
        id: priceRule.id,
        label: priceRule.label,
        unit: priceRule.unit,
        amountInCents: priceRule.amountInCents,
      },
    });

    const vehicleRetentionDays = dto.vehicle
      ? await this.resolveVehicleRetentionDays(context.tenantId)
      : DEFAULT_VEHICLE_RETENTION_DAYS;

    const result = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: {
          tenantId_email: {
            tenantId: context.tenantId,
            email: dto.customer.email,
          },
        },
        update: this.buildCustomerNameData(dto),
        create: {
          tenantId: context.tenantId,
          email: dto.customer.email,
          ...this.buildCustomerNameData(dto),
        },
      });

      const vehicle = dto.vehicle
        ? await tx.vehicle.create({
            data: {
              tenantId: context.tenantId,
              customerId: customer.id,
              plateNumber: dto.vehicle.plateNumber.toUpperCase(),
              countryCode: dto.vehicle.countryCode.toUpperCase(),
              ...this.buildVehicleLabelData(dto.vehicle.label),
              retentionUntil: computeVehicleRetentionUntil(endsAt, vehicleRetentionDays),
            },
          })
        : null;

      const reservation = await tx.reservation.create({
        data: {
          tenantId: context.tenantId,
          parkingId: dto.parkingId,
          offerId: dto.offerId,
          customerId: customer.id,
          startsAt,
          endsAt,
          status: ReservationStatus.confirmed,
          amountInCents: quote.amountInCents,
          currency: quote.currency,
        },
      });

      if (vehicle) {
        await this.logVehicleAccess(tx, context, vehicle.id, reservation.id);
      }

      return {
        reservation,
        customer,
        vehicle,
      };
    });

    return {
      id: result.reservation.id,
      status: result.reservation.status,
      amountInCents: result.reservation.amountInCents,
      currency: result.reservation.currency,
      customerId: result.customer.id,
      vehicleId: result.vehicle?.id ?? null,
    };
  }

  async listReservations(context: TenantContext, input: ListReservationsDto) {
    const dto = this.parse(listReservationsSchema, input);

    const where: Prisma.ReservationWhereInput = {
      tenantId: context.tenantId,
      parkingId: dto.parkingId,
    };
    if (dto.status !== undefined) {
      where.status = dto.status;
    }
    const startsAt: Prisma.DateTimeFilter = {};
    if (dto.from !== undefined) startsAt.gte = new Date(dto.from);
    if (dto.to !== undefined) startsAt.lte = new Date(dto.to);
    if (dto.from !== undefined || dto.to !== undefined) {
      where.startsAt = startsAt;
    }

    return this.prisma.reservation.findMany({
      where,
      orderBy: { startsAt: "asc" },
      select: this.reservationListSelect,
    });
  }

  async getReservation(context: TenantContext, reservationId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, tenantId: context.tenantId },
      select: {
        ...this.reservationListSelect,
        payments: {
          orderBy: { createdAt: "asc" },
          select: { id: true, status: true, amountInCents: true, currency: true, paidAt: true },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException("Réservation introuvable pour ce tenant.");
    }

    return reservation;
  }

  async cancelReservation(context: TenantContext, reservationId: string, input: CancelReservationDto) {
    const dto = this.parse(cancelReservationSchema, input);

    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, tenantId: context.tenantId },
      select: { id: true, status: true },
    });

    if (!reservation) {
      throw new NotFoundException("Réservation introuvable pour ce tenant.");
    }

    if (NON_CANCELLABLE_STATUSES.includes(reservation.status)) {
      throw new ConflictException("Réservation déjà clôturée : annulation impossible.");
    }

    const data: Prisma.ReservationUpdateInput = { status: ReservationStatus.cancelled };
    if (dto.reason !== undefined) {
      data.cancellationReason = dto.reason;
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data,
      select: { id: true, status: true, cancellationReason: true },
    });
  }

  private readonly reservationListSelect = {
    id: true,
    status: true,
    startsAt: true,
    endsAt: true,
    amountInCents: true,
    currency: true,
    customer: { select: { id: true, email: true, firstName: true, lastName: true } },
    offer: { select: { id: true, name: true, type: true } },
  } satisfies Prisma.ReservationSelect;

  private parse<Output>(schema: z.ZodType<Output>, input: unknown): Output {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private parseCreateManualReservation(input: CreateManualReservationDto): CreateManualReservationDto {
    const parsed = createManualReservationSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    return parsed.data;
  }

  private buildCustomerNameData(dto: CreateManualReservationDto): CustomerNameData {
    const data: CustomerNameData = {};

    if (dto.customer.firstName) {
      data.firstName = dto.customer.firstName;
    }

    if (dto.customer.lastName) {
      data.lastName = dto.customer.lastName;
    }

    return data;
  }

  private async resolveVehicleRetentionDays(tenantId: string): Promise<number> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { vehicleRetentionDays: true },
    });
    return tenant?.vehicleRetentionDays ?? DEFAULT_VEHICLE_RETENTION_DAYS;
  }

  private buildVehicleLabelData(label: string | undefined): { label?: string } {
    return label ? { label } : {};
  }

  private async logVehicleAccess(
    tx: Prisma.TransactionClient,
    context: TenantContext,
    vehicleId: string,
    reservationId: string,
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "vehicle.plate_recorded_for_manual_reservation",
        resourceType: "Vehicle",
        resourceId: vehicleId,
        metadata: {
          reservationId,
          retention: "Plaque conservée 3 mois après la fin de réservation au stade MVP.",
        },
      },
    });
  }
}
