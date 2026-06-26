import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AccessCredentialType, PaymentStatus, Prisma, ReservationStatus } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import {
  computeFiscalArchiveUntil,
  computeVehicleRetentionUntil,
  DEFAULT_VEHICLE_RETENTION_DAYS,
  getCapacityAvailability,
  quoteStaticPrice,
  type ExistingReservation,
} from "@bingoz/domain";
import type { z } from "zod";

import { PrismaService } from "../database/prisma.service";
import {
  createPublicReservationSchema,
  type CreatePublicReservationDto,
} from "./dto/booking.dto";

const BLOCKING_RESERVATION_STATUSES = [
  ReservationStatus.pending_payment,
  ReservationStatus.confirmed,
  ReservationStatus.completed,
];

const CLOSED_RESERVATION_STATUSES: ReadonlyArray<ReservationStatus> = [
  ReservationStatus.cancelled,
  ReservationStatus.expired,
];

export type PublicReservationCreated = {
  reservationId: string;
  paymentId: string;
  amountInCents: number;
  currency: string;
  status: ReservationStatus;
};

export type PublicPaymentConfirmed = {
  status: ReservationStatus;
  accessCode: string;
  accessCredentialType: AccessCredentialType;
  expiresAt: Date;
  invoiceNumber: string;
};

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async createPublicReservation(
    slug: string,
    input: CreatePublicReservationDto,
  ): Promise<PublicReservationCreated> {
    const dto = this.parse(createPublicReservationSchema, input);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException("La fin de réservation doit être après le début.");
    }

    const parking = await this.prisma.parking.findUnique({
      where: { slug },
      select: { id: true, tenantId: true, isPublished: true },
    });

    if (!parking || !parking.isPublished) {
      throw new NotFoundException("Parking public introuvable.");
    }

    const offer = await this.prisma.offer.findFirst({
      where: { tenantId: parking.tenantId, parkingId: parking.id, id: dto.offerId, isActive: true },
      select: {
        id: true,
        priceRules: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { id: true, label: true, unit: true, amountInCents: true },
        },
      },
    });

    const priceRule = offer?.priceRules[0];
    if (!offer || !priceRule) {
      throw new NotFoundException("Offre active introuvable pour ce parking.");
    }

    const [activeSpaceCount, overlapping] = await Promise.all([
      this.prisma.space.count({
        where: { tenantId: parking.tenantId, parkingId: parking.id, isActive: true },
      }),
      this.prisma.reservation.findMany({
        where: {
          tenantId: parking.tenantId,
          parkingId: parking.id,
          status: { in: BLOCKING_RESERVATION_STATUSES },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
        select: { id: true, status: true, startsAt: true, endsAt: true },
      }),
    ]);

    const availability = getCapacityAvailability(
      { startsAt, endsAt },
      overlapping.map(
        (reservation): ExistingReservation => ({
          id: reservation.id,
          status: reservation.status,
          startsAt: reservation.startsAt,
          endsAt: reservation.endsAt,
        }),
      ),
      activeSpaceCount,
    );

    if (!availability.available) {
      throw new ConflictException("Plus aucune place disponible sur ce créneau.");
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
      ? await this.resolveVehicleRetentionDays(parking.tenantId)
      : DEFAULT_VEHICLE_RETENTION_DAYS;

    const created = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { tenantId_email: { tenantId: parking.tenantId, email: dto.customer.email } },
        update: this.buildCustomerName(dto.customer),
        create: {
          tenantId: parking.tenantId,
          email: dto.customer.email,
          ...this.buildCustomerName(dto.customer),
        },
        select: { id: true },
      });

      if (dto.vehicle) {
        await this.recordVehicle(tx, parking.tenantId, customer.id, dto.vehicle, endsAt, vehicleRetentionDays);
      }

      const reservation = await tx.reservation.create({
        data: {
          tenantId: parking.tenantId,
          parkingId: parking.id,
          offerId: offer.id,
          customerId: customer.id,
          startsAt,
          endsAt,
          status: ReservationStatus.pending_payment,
          amountInCents: quote.amountInCents,
          currency: quote.currency,
        },
        select: { id: true, status: true },
      });

      const payment = await tx.payment.create({
        data: {
          tenantId: parking.tenantId,
          reservationId: reservation.id,
          status: PaymentStatus.pending,
          amountInCents: quote.amountInCents,
          currency: quote.currency,
        },
        select: { id: true },
      });

      return { reservation, payment };
    });

    return {
      reservationId: created.reservation.id,
      paymentId: created.payment.id,
      amountInCents: quote.amountInCents,
      currency: quote.currency,
      status: created.reservation.status,
    };
  }

  /**
   * Confirmation de paiement *mock*. En production, ce sera un webhook Stripe
   * signé ; ici l'identifiant de paiement (cuid non devinable) tient lieu de
   * secret pour le prototype.
   */
  async confirmPayment(paymentId: string): Promise<PublicPaymentConfirmed> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        tenantId: true,
        reservationId: true,
        status: true,
        amountInCents: true,
        currency: true,
        reservation: { select: { status: true, endsAt: true } },
      },
    });

    if (!payment) {
      throw new NotFoundException("Paiement introuvable.");
    }

    if (payment.status === PaymentStatus.paid) {
      throw new ConflictException("Paiement déjà confirmé.");
    }

    if (CLOSED_RESERVATION_STATUSES.includes(payment.reservation.status)) {
      throw new ConflictException("Réservation clôturée : paiement impossible.");
    }

    const now = new Date();
    const accessCode = randomBytes(5).toString("hex").toUpperCase();
    const valueHash = createHash("sha256").update(accessCode).digest("hex");
    const invoiceNumber = `INV-${now.getUTCFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const expiresAt = payment.reservation.endsAt;

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.paid, paidAt: now },
      });

      await tx.reservation.update({
        where: { id: payment.reservationId },
        data: { status: ReservationStatus.confirmed },
      });

      const invoice = await tx.invoice.create({
        data: {
          tenantId: payment.tenantId,
          reservationId: payment.reservationId,
          invoiceNumber,
          amountInCents: payment.amountInCents,
          currency: payment.currency,
          archiveUntil: computeFiscalArchiveUntil(now),
        },
        select: { invoiceNumber: true },
      });

      const credential = await tx.accessCredential.create({
        data: {
          tenantId: payment.tenantId,
          reservationId: payment.reservationId,
          type: AccessCredentialType.access_code,
          valueHash,
          expiresAt,
        },
        select: { type: true },
      });

      return { invoice, credential };
    });

    return {
      status: ReservationStatus.confirmed,
      accessCode,
      accessCredentialType: result.credential.type,
      expiresAt,
      invoiceNumber: result.invoice.invoiceNumber,
    };
  }

  private async recordVehicle(
    tx: Prisma.TransactionClient,
    tenantId: string,
    customerId: string,
    vehicle: { plateNumber: string; countryCode?: string | undefined; label?: string | undefined },
    endsAt: Date,
    retentionDays: number,
  ): Promise<void> {
    const data: Prisma.VehicleUncheckedCreateInput = {
      tenantId,
      customerId,
      plateNumber: vehicle.plateNumber.toUpperCase(),
      countryCode: (vehicle.countryCode ?? "FR").toUpperCase(),
      retentionUntil: computeVehicleRetentionUntil(endsAt, retentionDays),
    };
    if (vehicle.label !== undefined) data.label = vehicle.label;

    const created = await tx.vehicle.create({ data, select: { id: true } });

    await tx.auditLog.create({
      data: {
        tenantId,
        action: "vehicle.plate_recorded_for_public_reservation",
        resourceType: "Vehicle",
        resourceId: created.id,
        metadata: {
          retention: `Plaque conservée ${retentionDays} jours après la fin de réservation.`,
        },
      },
    });
  }

  private async resolveVehicleRetentionDays(tenantId: string): Promise<number> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { vehicleRetentionDays: true },
    });
    return tenant?.vehicleRetentionDays ?? DEFAULT_VEHICLE_RETENTION_DAYS;
  }

  private buildCustomerName(customer: {
    firstName?: string | undefined;
    lastName?: string | undefined;
  }): { firstName?: string; lastName?: string } {
    const name: { firstName?: string; lastName?: string } = {};
    if (customer.firstName !== undefined) name.firstName = customer.firstName;
    if (customer.lastName !== undefined) name.lastName = customer.lastName;
    return name;
  }

  private parse<Output>(schema: z.ZodType<Output>, input: unknown): Output {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return parsed.data;
  }
}
