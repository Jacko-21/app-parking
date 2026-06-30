import { describe, expect, it, vi } from "vitest";
import { asTenantId, type TenantContext } from "@bingoz/domain";

import { type PrismaService } from "../database/prisma.service";
import { DashboardService } from "./dashboard.service";

function createContext(): TenantContext {
  return { tenantId: asTenantId("tenant_1"), userId: "user_1", roles: ["gestionnaire"] };
}

describe("DashboardService", () => {
  it("agrège le CA des réservations confirmées et filtre sur le tenant", async () => {
    const parkingCount = vi.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(2);
    const findMany = vi.fn().mockResolvedValue([
      { status: "confirmed", amountInCents: 1500, currency: "EUR", createdAt: new Date() },
      { status: "cancelled", amountInCents: 9999, currency: "EUR", createdAt: new Date() },
    ]);
    const prisma = {
      parking: { count: parkingCount },
      space: { count: vi.fn().mockResolvedValue(20) },
      reservation: { count: vi.fn().mockResolvedValue(8), findMany },
    } as unknown as PrismaService;

    const service = new DashboardService(prisma);
    const summary = await service.getTenantDashboard(createContext());

    // La réservation annulée est exclue du chiffre d'affaires.
    expect(summary.revenue.last30DaysInCents).toBe(1500);
    expect(summary.parkings).toEqual({ total: 3, published: 2 });
    expect(summary.occupancy).toEqual({ activeSpaces: 20, activeReservations: 8, rate: 8 / 20 });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: expect.objectContaining({ tenantId: "tenant_1" }),
      }),
    );
  });
});
