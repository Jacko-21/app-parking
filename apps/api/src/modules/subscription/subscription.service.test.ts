import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { asTenantId, type TenantContext } from "@bingoz/domain";

import { type PrismaService } from "../database/prisma.service";
import { SubscriptionService } from "./subscription.service";

function createContext(): TenantContext {
  return { tenantId: asTenantId("tenant_1"), userId: "user_1", roles: ["gestionnaire"] };
}

const baseInput = {
  parkingId: "parking_1",
  customer: { email: "abonne@demo.test" },
  startsAt: "2026-07-01T00:00:00.000Z",
};

describe("SubscriptionService", () => {
  it("refuse un abonnement sur un parking d'un autre tenant", async () => {
    const prisma = {
      parking: { findFirst: vi.fn().mockResolvedValue(null) },
      customer: { upsert: vi.fn() },
      subscription: { create: vi.fn() },
    } as unknown as PrismaService;
    const service = new SubscriptionService(prisma);

    await expect(service.createSubscription(createContext(), baseInput)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("refuse une fin d'abonnement antérieure au début", async () => {
    const prisma = {
      parking: { findFirst: vi.fn().mockResolvedValue({ id: "parking_1" }) },
      customer: { upsert: vi.fn() },
      subscription: { create: vi.fn() },
    } as unknown as PrismaService;
    const service = new SubscriptionService(prisma);

    await expect(
      service.createSubscription(createContext(), {
        ...baseInput,
        endsAt: "2026-06-01T00:00:00.000Z",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("crée un abonnement rattaché au tenant et au client", async () => {
    const create = vi.fn().mockResolvedValue({ id: "subscription_1" });
    const prisma = {
      parking: { findFirst: vi.fn().mockResolvedValue({ id: "parking_1" }) },
      customer: { upsert: vi.fn().mockResolvedValue({ id: "customer_1" }) },
      subscription: { create },
    } as unknown as PrismaService;
    const service = new SubscriptionService(prisma);

    await service.createSubscription(createContext(), baseInput);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ tenantId: "tenant_1", customerId: "customer_1" }),
      }),
    );
  });
});
