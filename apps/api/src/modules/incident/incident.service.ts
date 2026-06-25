import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { TenantContext } from "@bingoz/domain";
import type { z } from "zod";

import { PrismaService } from "../database/prisma.service";
import {
  createIncidentSchema,
  listIncidentsSchema,
  updateIncidentSchema,
  type CreateIncidentDto,
  type ListIncidentsDto,
  type UpdateIncidentDto,
} from "./dto/incident.dto";

@Injectable()
export class IncidentService {
  constructor(private readonly prisma: PrismaService) {}

  async createIncident(context: TenantContext, input: CreateIncidentDto) {
    const dto = this.parse(createIncidentSchema, input);
    await this.requireParking(context, dto.parkingId);

    const data: Prisma.IncidentUncheckedCreateInput = {
      tenantId: context.tenantId,
      parkingId: dto.parkingId,
      title: dto.title,
    };
    if (dto.description !== undefined) data.description = dto.description;

    return this.prisma.incident.create({ data, select: this.incidentSelect });
  }

  async listIncidents(context: TenantContext, input: ListIncidentsDto) {
    const dto = this.parse(listIncidentsSchema, input);
    await this.requireParking(context, dto.parkingId);

    const where: Prisma.IncidentWhereInput = {
      tenantId: context.tenantId,
      parkingId: dto.parkingId,
    };
    if (dto.status !== undefined) where.status = dto.status;

    return this.prisma.incident.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: this.incidentSelect,
    });
  }

  async updateIncident(context: TenantContext, incidentId: string, input: UpdateIncidentDto) {
    await this.requireIncident(context, incidentId);
    const dto = this.parse(updateIncidentSchema, input);

    const data: Prisma.IncidentUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.incident.update({
      where: { id: incidentId },
      data,
      select: this.incidentSelect,
    });
  }

  private readonly incidentSelect = {
    id: true,
    title: true,
    description: true,
    status: true,
    createdAt: true,
  } satisfies Prisma.IncidentSelect;

  private async requireParking(context: TenantContext, parkingId: string): Promise<void> {
    const parking = await this.prisma.parking.findFirst({
      where: { id: parkingId, tenantId: context.tenantId },
      select: { id: true },
    });
    if (!parking) {
      throw new NotFoundException("Parking introuvable pour ce tenant.");
    }
  }

  private async requireIncident(context: TenantContext, incidentId: string): Promise<void> {
    const incident = await this.prisma.incident.findFirst({
      where: { id: incidentId, tenantId: context.tenantId },
      select: { id: true },
    });
    if (!incident) {
      throw new NotFoundException("Incident introuvable pour ce tenant.");
    }
  }

  private parse<Output>(schema: z.ZodType<Output>, input: unknown): Output {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return parsed.data;
  }
}
