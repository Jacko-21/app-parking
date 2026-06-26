import { ConflictException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { type PrismaService } from "../database/prisma.service";
import { BookingService } from "./booking.service";

const reservationInput = {
  offerId: "offer_1",
  startsAt: "2026-07-01T10:00:00.000Z",
  endsAt: "2026-07-01T13:00:00.000Z",
  customer: { email: "auto@demo.test" },
};

describe("BookingService", () => {
  it("refuse une réservation sur un parking non publié", async () => {
    const prisma = {
      parking: { findUnique: vi.fn().mockResolvedValue({ id: "p1", tenantId: "t1", isPublished: false }) },
    } as unknown as PrismaService;
    const service = new BookingService(prisma);

    await expect(service.createPublicReservation("beaugrenelle", reservationInput)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("refuse une réservation quand la capacité est saturée", async () => {
    const prisma = {
      parking: { findUnique: vi.fn().mockResolvedValue({ id: "p1", tenantId: "t1", isPublished: true }) },
      offer: {
        findFirst: vi.fn().mockResolvedValue({
          id: "offer_1",
          priceRules: [{ id: "r1", label: "Horaire", unit: "hour", amountInCents: 350 }],
        }),
      },
      space: { count: vi.fn().mockResolvedValue(1) },
      reservation: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "res_existant",
            status: "confirmed",
            startsAt: new Date("2026-07-01T10:00:00.000Z"),
            endsAt: new Date("2026-07-01T12:00:00.000Z"),
          },
        ]),
      },
    } as unknown as PrismaService;
    const service = new BookingService(prisma);

    await expect(service.createPublicReservation("beaugrenelle", reservationInput)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("confirme un paiement : facture + code d'accès + réservation confirmée", async () => {
    const tx = {
      payment: { update: vi.fn().mockResolvedValue({}) },
      reservation: { update: vi.fn().mockResolvedValue({}) },
      invoice: { create: vi.fn().mockResolvedValue({ invoiceNumber: "INV-TEST" }) },
      accessCredential: { create: vi.fn().mockResolvedValue({ type: "access_code" }) },
    };
    const prisma = {
      payment: {
        findUnique: vi.fn().mockResolvedValue({
          id: "pay_1",
          tenantId: "t1",
          reservationId: "res_1",
          status: "pending",
          amountInCents: 1050,
          currency: "EUR",
          reservation: { status: "pending_payment", endsAt: new Date("2026-07-01T13:00:00.000Z") },
        }),
      },
      $transaction: vi.fn((callback: (transaction: typeof tx) => unknown) => Promise.resolve(callback(tx))),
    } as unknown as PrismaService;
    const service = new BookingService(prisma);

    const result = await service.confirmPayment("pay_1");

    expect(result.status).toBe("confirmed");
    expect(result.invoiceNumber).toBe("INV-TEST");
    expect(result.accessCode).toHaveLength(10);
    expect(tx.invoice.create).toHaveBeenCalledOnce();
    expect(tx.accessCredential.create).toHaveBeenCalledOnce();
  });

  it("refuse de confirmer un paiement déjà réglé", async () => {
    const prisma = {
      payment: {
        findUnique: vi.fn().mockResolvedValue({
          id: "pay_1",
          tenantId: "t1",
          reservationId: "res_1",
          status: "paid",
          amountInCents: 1050,
          currency: "EUR",
          reservation: { status: "confirmed", endsAt: new Date("2026-07-01T13:00:00.000Z") },
        }),
      },
    } as unknown as PrismaService;
    const service = new BookingService(prisma);

    await expect(service.confirmPayment("pay_1")).rejects.toBeInstanceOf(ConflictException);
  });
});
