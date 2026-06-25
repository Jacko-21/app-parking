import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { asTenantId, type TenantContext } from "@bingoz/domain";

import { type PrismaService } from "../database/prisma.service";
import { IncidentService } from "./incident.service";

function createContext(): TenantContext {
  return { tenantId: asTenantId("tenant_1"), userId: "user_1", roles: ["agent"] };
}

describe("IncidentService", () => {
  it("refuse de créer un incident sur un parking d'un autre tenant", async () => {
    const prisma = {
      parking: { findFirst: vi.fn().mockResolvedValue(null) },
      incident: { create: vi.fn() },
    } as unknown as PrismaService;
    const service = new IncidentService(prisma);

    await expect(
      service.createIncident(createContext(), { parkingId: "parking_autre", title: "Barrière HS" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("crée un incident rattaché au tenant", async () => {
    const create = vi.fn().mockResolvedValue({ id: "incident_1" });
    const prisma = {
      parking: { findFirst: vi.fn().mockResolvedValue({ id: "parking_1" }) },
      incident: { create },
    } as unknown as PrismaService;
    const service = new IncidentService(prisma);

    await service.createIncident(createContext(), {
      parkingId: "parking_1",
      title: "Barrière bloquée",
      description: "Niveau -2",
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ tenantId: "tenant_1", parkingId: "parking_1" }),
      }),
    );
  });

  it("refuse de mettre à jour un incident inexistant pour le tenant", async () => {
    const prisma = {
      incident: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() },
    } as unknown as PrismaService;
    const service = new IncidentService(prisma);

    await expect(
      service.updateIncident(createContext(), "incident_x", { status: "resolved" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
