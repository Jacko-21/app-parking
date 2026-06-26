import { describe, expect, it, vi } from "vitest";
import { asTenantId, type TenantContext } from "@bingoz/domain";

import { type PrismaService } from "../database/prisma.service";
import { ReservationService } from "./reservation.service";

function createContext(): TenantContext {
  return {
    tenantId: asTenantId("tenant_1"),
    userId: "user_1",
    roles: ["admin"],
  };
}

describe("ReservationService", () => {
  it("crée une réservation manuelle et journalise la plaque si elle est fournie", async () => {
    const tx = {
      customer: {
        upsert: vi.fn().mockResolvedValue({
          id: "customer_1",
        }),
      },
      vehicle: {
        create: vi.fn().mockResolvedValue({
          id: "vehicle_1",
        }),
      },
      reservation: {
        create: vi.fn().mockResolvedValue({
          id: "reservation_1",
          status: "confirmed",
          amountInCents: 1050,
          currency: "EUR",
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit_1" }),
      },
    };
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({ vehicleRetentionDays: 90 }),
      },
      parking: {
        findFirst: vi.fn().mockResolvedValue({ id: "parking_1" }),
      },
      offer: {
        findFirst: vi.fn().mockResolvedValue({
          id: "offer_1",
          priceRules: [
            {
              id: "rule_1",
              label: "Tarif horaire",
              unit: "hour",
              amountInCents: 350,
            },
          ],
        }),
      },
      space: {
        count: vi.fn().mockResolvedValue(2),
      },
      reservation: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn((callback: (transaction: typeof tx) => unknown) => Promise.resolve(callback(tx))),
    } as unknown as PrismaService;
    const service = new ReservationService(prisma);

    const reservation = await service.createManualReservation(createContext(), {
      parkingId: "parking_1",
      offerId: "offer_1",
      startsAt: "2026-05-10T14:00:00.000Z",
      endsAt: "2026-05-10T17:00:00.000Z",
      customer: {
        email: "camille@example.test",
        firstName: "Camille",
      },
      vehicle: {
        plateNumber: "ab-123-cd",
        countryCode: "fr",
      },
    });

    expect(reservation).toEqual({
      id: "reservation_1",
      status: "confirmed",
      amountInCents: 1050,
      currency: "EUR",
      customerId: "customer_1",
      vehicleId: "vehicle_1",
    });
    expect(tx.vehicle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          tenantId: "tenant_1",
          plateNumber: "AB-123-CD",
          countryCode: "FR",
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          action: "vehicle.plate_recorded_for_manual_reservation",
          resourceId: "vehicle_1",
        }),
      }),
    );
  });
});
