import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { asTenantId, type TenantContext } from "@bingoz/domain";

import { type PrismaService } from "../database/prisma.service";
import { RgpdService } from "./rgpd.service";

function createContext(): TenantContext {
  return { tenantId: asTenantId("tenant_1"), userId: "user_1", roles: ["admin"] };
}

describe("RgpdService", () => {
  it("anonymise les plaques expirées et journalise l'opération", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 3 });
    const auditCreate = vi.fn().mockResolvedValue({ id: "audit_1" });
    const prisma = {
      vehicle: { updateMany },
      auditLog: { create: auditCreate },
    } as unknown as PrismaService;
    const service = new RgpdService(prisma);

    const result = await service.anonymizeExpiredVehicles(createContext());

    expect(result).toEqual({ anonymized: 3 });
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: expect.objectContaining({ tenantId: "tenant_1", anonymizedAt: null }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ plateNumber: "ANONYMISEE" }),
      }),
    );
    expect(auditCreate).toHaveBeenCalledOnce();
  });

  it("refuse l'export d'un client d'un autre tenant", async () => {
    const prisma = {
      customer: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const service = new RgpdService(prisma);

    await expect(service.exportCustomerData(createContext(), "customer_x")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("anonymise un client et ses plaques (effacement)", async () => {
    const tx = {
      vehicle: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
      customer: { update: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    const prisma = {
      customer: { findFirst: vi.fn().mockResolvedValue({ id: "customer_1" }) },
      $transaction: vi.fn((callback: (transaction: typeof tx) => unknown) => Promise.resolve(callback(tx))),
    } as unknown as PrismaService;
    const service = new RgpdService(prisma);

    const result = await service.eraseCustomerData(createContext(), "customer_1");

    expect(result).toEqual({ id: "customer_1", anonymizedVehicles: 2 });
    expect(tx.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "customer_1" },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ firstName: null, lastName: null }),
      }),
    );
  });
});
