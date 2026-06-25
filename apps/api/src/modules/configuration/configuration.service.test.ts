import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { asTenantId, type TenantContext } from "@bingoz/domain";

import { type PrismaService } from "../database/prisma.service";
import { ConfigurationService } from "./configuration.service";

function createContext(): TenantContext {
  return { tenantId: asTenantId("tenant_1"), userId: "user_1", roles: ["admin"] };
}

describe("ConfigurationService", () => {
  it("crée un parking rattaché au tenant courant", async () => {
    const create = vi.fn().mockResolvedValue({ id: "parking_1" });
    const prisma = { parking: { create } } as unknown as PrismaService;
    const service = new ConfigurationService(prisma);

    await service.createParking(createContext(), {
      name: "Parking Beaugrenelle",
      slug: "beaugrenelle",
      address: "12 rue Linois",
      city: "Paris",
      postalCode: "75015",
      countryCode: "FR",
      timezone: "Europe/Paris",
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ tenantId: "tenant_1", slug: "beaugrenelle" }),
      }),
    );
  });

  it("refuse de créer une zone sur un parking d'un autre tenant", async () => {
    const prisma = {
      parking: { findFirst: vi.fn().mockResolvedValue(null) },
      zone: { create: vi.fn() },
    } as unknown as PrismaService;
    const service = new ConfigurationService(prisma);

    await expect(
      service.createZone(createContext(), "parking_autre", { name: "Niveau -1" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("refuse une place dont la zone appartient à un autre parking", async () => {
    const prisma = {
      parking: { findFirst: vi.fn().mockResolvedValue({ id: "parking_1" }) },
      zone: { findFirst: vi.fn().mockResolvedValue({ id: "zone_1", parkingId: "parking_autre" }) },
      space: { create: vi.fn() },
    } as unknown as PrismaService;
    const service = new ConfigurationService(prisma);

    await expect(
      service.createSpace(createContext(), "parking_1", { label: "A-12", type: "mixed", zoneId: "zone_1" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("refuse un tarif sur une offre d'un autre tenant", async () => {
    const prisma = {
      offer: { findFirst: vi.fn().mockResolvedValue(null) },
      priceRule: { create: vi.fn() },
    } as unknown as PrismaService;
    const service = new ConfigurationService(prisma);

    await expect(
      service.createPriceRule(createContext(), "offer_autre", {
        label: "Horaire",
        unit: "hour",
        amountInCents: 350,
        currency: "EUR",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
