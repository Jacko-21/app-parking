import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { asTenantId, type TenantContext } from "@bingoz/domain";

import { type PrismaService } from "../database/prisma.service";
import { ParkingService } from "./parking.service";

function createContext(): TenantContext {
  return {
    tenantId: asTenantId("tenant_1"),
    userId: "user_1",
    roles: ["admin"],
  };
}

describe("ParkingService", () => {
  it("liste les parkings en filtrant par tenant", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "parking_1",
        slug: "republique",
        name: "Parking République",
        city: "Paris",
        isPublished: true,
      },
    ]);
    const prisma = {
      parking: {
        findMany,
      },
      space: {
        count: vi.fn().mockResolvedValue(4),
      },
      reservation: {
        count: vi.fn().mockResolvedValue(2),
      },
    } as unknown as PrismaService;
    const service = new ParkingService(prisma);

    const parkings = await service.listParkings(createContext());

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: "tenant_1",
        },
      }),
    );
    expect(parkings).toEqual([
      {
        id: "parking_1",
        slug: "republique",
        name: "Parking République",
        city: "Paris",
        isPublished: true,
        activeSpaces: 4,
        activeReservations: 2,
        occupancyRate: 0.5,
      },
    ]);
  });

  it("refuse un parking public non publié", async () => {
    const prisma = {
      parking: {
        findUnique: vi.fn().mockResolvedValue({
          id: "parking_1",
          isPublished: false,
        }),
      },
    } as unknown as PrismaService;
    const service = new ParkingService(prisma);

    await expect(service.getPublicParking("republique")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("calcule un devis public avec disponibilité", async () => {
    const prisma = {
      parking: {
        findUnique: vi.fn().mockResolvedValue({
          id: "parking_1",
          tenantId: "tenant_1",
          isPublished: true,
        }),
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
        findMany: vi.fn().mockResolvedValue([
          {
            id: "reservation_1",
            status: "confirmed",
            startsAt: new Date("2026-05-10T14:00:00.000Z"),
            endsAt: new Date("2026-05-10T15:00:00.000Z"),
          },
        ]),
      },
    } as unknown as PrismaService;
    const service = new ParkingService(prisma);

    const quote = await service.quotePublicReservation("republique", {
      offerId: "offer_1",
      startsAt: "2026-05-10T14:00:00.000Z",
      endsAt: "2026-05-10T17:00:00.000Z",
    });

    expect(quote).toEqual({
      parkingId: "parking_1",
      offerId: "offer_1",
      amountInCents: 1050,
      currency: "EUR",
      billableUnits: 3,
      available: true,
      remainingSpaces: 1,
    });
  });
});
