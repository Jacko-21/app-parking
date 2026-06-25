import { ConflictException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { asTenantId, type TenantContext } from "@bingoz/domain";

import { type PrismaService } from "../database/prisma.service";
import { ReservationService } from "./reservation.service";

function createContext(): TenantContext {
  return { tenantId: asTenantId("tenant_1"), userId: "user_1", roles: ["gestionnaire"] };
}

describe("ReservationService — gestion", () => {
  it("annule une réservation active et enregistre le motif", async () => {
    const update = vi.fn().mockResolvedValue({
      id: "reservation_1",
      status: "cancelled",
      cancellationReason: "Client absent",
    });
    const prisma = {
      reservation: {
        findFirst: vi.fn().mockResolvedValue({ id: "reservation_1", status: "confirmed" }),
        update,
      },
    } as unknown as PrismaService;
    const service = new ReservationService(prisma);

    const result = await service.cancelReservation(createContext(), "reservation_1", {
      reason: "Client absent",
    });

    expect(result.status).toBe("cancelled");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "reservation_1" },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ status: "cancelled", cancellationReason: "Client absent" }),
      }),
    );
  });

  it("refuse d'annuler une réservation déjà clôturée", async () => {
    const prisma = {
      reservation: {
        findFirst: vi.fn().mockResolvedValue({ id: "reservation_1", status: "completed" }),
        update: vi.fn(),
      },
    } as unknown as PrismaService;
    const service = new ReservationService(prisma);

    await expect(
      service.cancelReservation(createContext(), "reservation_1", {}),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("renvoie une 404 si la réservation n'appartient pas au tenant", async () => {
    const prisma = {
      reservation: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() },
    } as unknown as PrismaService;
    const service = new ReservationService(prisma);

    await expect(
      service.cancelReservation(createContext(), "reservation_x", {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
