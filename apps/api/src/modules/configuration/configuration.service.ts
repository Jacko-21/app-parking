import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { TenantContext } from "@bingoz/domain";
import type { z } from "zod";

import { PrismaService } from "../database/prisma.service";
import {
  createOfferSchema,
  createParkingSchema,
  createPriceRuleSchema,
  createSpaceSchema,
  createZoneSchema,
  publishParkingSchema,
  updateParkingSchema,
  updateSpaceSchema,
  type CreateOfferDto,
  type CreateParkingDto,
  type CreatePriceRuleDto,
  type CreateSpaceDto,
  type CreateZoneDto,
  type PublishParkingDto,
  type UpdateParkingDto,
  type UpdateSpaceDto,
} from "./dto/configuration.dto";

@Injectable()
export class ConfigurationService {
  constructor(private readonly prisma: PrismaService) {}

  async createParking(context: TenantContext, input: CreateParkingDto) {
    const dto = this.parse(createParkingSchema, input);

    try {
      return await this.prisma.parking.create({
        data: {
          tenantId: context.tenantId,
          name: dto.name,
          slug: dto.slug,
          address: dto.address,
          city: dto.city,
          postalCode: dto.postalCode,
          countryCode: dto.countryCode ?? "FR",
          timezone: dto.timezone ?? "Europe/Paris",
        },
        select: this.parkingSelect,
      });
    } catch (error) {
      throw this.translateUniqueViolation(error, "Un parking avec ce slug existe déjà.");
    }
  }

  async updateParking(context: TenantContext, parkingId: string, input: UpdateParkingDto) {
    await this.requireParking(context, parkingId);
    const dto = this.parse(updateParkingSchema, input);

    const data: Prisma.ParkingUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode;
    if (dto.countryCode !== undefined) data.countryCode = dto.countryCode;
    if (dto.timezone !== undefined) data.timezone = dto.timezone;

    return this.prisma.parking.update({
      where: { id: parkingId },
      data,
      select: this.parkingSelect,
    });
  }

  async setParkingPublication(context: TenantContext, parkingId: string, input: PublishParkingDto) {
    await this.requireParking(context, parkingId);
    const dto = this.parse(publishParkingSchema, input);

    return this.prisma.parking.update({
      where: { id: parkingId },
      data: { isPublished: dto.isPublished },
      select: this.parkingSelect,
    });
  }

  async getParkingDetail(context: TenantContext, parkingId: string) {
    await this.requireParking(context, parkingId);

    return this.prisma.parking.findUniqueOrThrow({
      where: { id: parkingId },
      select: {
        ...this.parkingSelect,
        zones: { orderBy: { createdAt: "asc" }, select: { id: true, name: true } },
        spaces: {
          orderBy: { createdAt: "asc" },
          select: { id: true, label: true, type: true, isActive: true, zoneId: true },
        },
        offers: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            isActive: true,
            priceRules: {
              orderBy: { createdAt: "asc" },
              select: { id: true, label: true, unit: true, amountInCents: true, currency: true },
            },
          },
        },
      },
    });
  }

  async createZone(context: TenantContext, parkingId: string, input: CreateZoneDto) {
    await this.requireParking(context, parkingId);
    const dto = this.parse(createZoneSchema, input);

    return this.prisma.zone.create({
      data: { tenantId: context.tenantId, parkingId, name: dto.name },
      select: { id: true, name: true },
    });
  }

  async deleteZone(context: TenantContext, zoneId: string): Promise<{ id: string }> {
    await this.requireZone(context, zoneId);
    await this.prisma.zone.delete({ where: { id: zoneId } });
    return { id: zoneId };
  }

  async createSpace(context: TenantContext, parkingId: string, input: CreateSpaceDto) {
    await this.requireParking(context, parkingId);
    const dto = this.parse(createSpaceSchema, input);

    if (dto.zoneId !== undefined) {
      await this.requireZone(context, dto.zoneId, parkingId);
    }

    const data: Prisma.SpaceUncheckedCreateInput = {
      tenantId: context.tenantId,
      parkingId,
      label: dto.label,
      type: dto.type ?? "mixed",
    };
    if (dto.zoneId !== undefined) data.zoneId = dto.zoneId;

    try {
      return await this.prisma.space.create({
        data,
        select: { id: true, label: true, type: true, isActive: true, zoneId: true },
      });
    } catch (error) {
      throw this.translateUniqueViolation(error, "Une place avec ce libellé existe déjà sur ce parking.");
    }
  }

  async updateSpace(context: TenantContext, spaceId: string, input: UpdateSpaceDto) {
    await this.requireSpace(context, spaceId);
    const dto = this.parse(updateSpaceSchema, input);

    const data: Prisma.SpaceUpdateInput = {};
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.space.update({
      where: { id: spaceId },
      data,
      select: { id: true, label: true, type: true, isActive: true, zoneId: true },
    });
  }

  async deleteSpace(context: TenantContext, spaceId: string): Promise<{ id: string }> {
    await this.requireSpace(context, spaceId);
    await this.prisma.space.delete({ where: { id: spaceId } });
    return { id: spaceId };
  }

  async createOffer(context: TenantContext, parkingId: string, input: CreateOfferDto) {
    await this.requireParking(context, parkingId);
    const dto = this.parse(createOfferSchema, input);

    const data: Prisma.OfferUncheckedCreateInput = {
      tenantId: context.tenantId,
      parkingId,
      name: dto.name,
      type: dto.type,
    };
    if (dto.description !== undefined) data.description = dto.description;

    return this.prisma.offer.create({
      data,
      select: { id: true, name: true, type: true, description: true, isActive: true },
    });
  }

  async deleteOffer(context: TenantContext, offerId: string): Promise<{ id: string }> {
    await this.requireOffer(context, offerId);
    await this.prisma.offer.delete({ where: { id: offerId } });
    return { id: offerId };
  }

  async createPriceRule(context: TenantContext, offerId: string, input: CreatePriceRuleDto) {
    await this.requireOffer(context, offerId);
    const dto = this.parse(createPriceRuleSchema, input);

    return this.prisma.priceRule.create({
      data: {
        tenantId: context.tenantId,
        offerId,
        label: dto.label,
        unit: dto.unit,
        amountInCents: dto.amountInCents,
        currency: dto.currency ?? "EUR",
      },
      select: { id: true, label: true, unit: true, amountInCents: true, currency: true },
    });
  }

  async deletePriceRule(context: TenantContext, priceRuleId: string): Promise<{ id: string }> {
    const rule = await this.prisma.priceRule.findFirst({
      where: { id: priceRuleId, tenantId: context.tenantId },
      select: { id: true },
    });
    if (!rule) {
      throw new NotFoundException("Tarif introuvable pour ce tenant.");
    }
    await this.prisma.priceRule.delete({ where: { id: priceRuleId } });
    return { id: priceRuleId };
  }

  private readonly parkingSelect = {
    id: true,
    slug: true,
    name: true,
    address: true,
    city: true,
    postalCode: true,
    countryCode: true,
    timezone: true,
    isPublished: true,
  } satisfies Prisma.ParkingSelect;

  private async requireParking(context: TenantContext, parkingId: string): Promise<void> {
    const parking = await this.prisma.parking.findFirst({
      where: { id: parkingId, tenantId: context.tenantId },
      select: { id: true },
    });
    if (!parking) {
      throw new NotFoundException("Parking introuvable pour ce tenant.");
    }
  }

  private async requireZone(
    context: TenantContext,
    zoneId: string,
    expectedParkingId?: string,
  ): Promise<void> {
    const zone = await this.prisma.zone.findFirst({
      where: { id: zoneId, tenantId: context.tenantId },
      select: { id: true, parkingId: true },
    });
    if (!zone || (expectedParkingId !== undefined && zone.parkingId !== expectedParkingId)) {
      throw new NotFoundException("Zone introuvable pour ce parking.");
    }
  }

  private async requireSpace(context: TenantContext, spaceId: string): Promise<void> {
    const space = await this.prisma.space.findFirst({
      where: { id: spaceId, tenantId: context.tenantId },
      select: { id: true },
    });
    if (!space) {
      throw new NotFoundException("Place introuvable pour ce tenant.");
    }
  }

  private async requireOffer(context: TenantContext, offerId: string): Promise<void> {
    const offer = await this.prisma.offer.findFirst({
      where: { id: offerId, tenantId: context.tenantId },
      select: { id: true },
    });
    if (!offer) {
      throw new NotFoundException("Offre introuvable pour ce tenant.");
    }
  }

  private parse<Output>(schema: z.ZodType<Output>, input: unknown): Output {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private translateUniqueViolation(error: unknown, message: string): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new ConflictException(message);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
