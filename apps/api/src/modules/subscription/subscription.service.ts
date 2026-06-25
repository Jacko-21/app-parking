import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { TenantContext } from "@bingoz/domain";
import type { z } from "zod";

import { PrismaService } from "../database/prisma.service";
import {
  createSubscriptionSchema,
  listSubscriptionsSchema,
  updateSubscriptionSchema,
  type CreateSubscriptionDto,
  type ListSubscriptionsDto,
  type UpdateSubscriptionDto,
} from "./dto/subscription.dto";

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubscription(context: TenantContext, input: CreateSubscriptionDto) {
    const dto = this.parse(createSubscriptionSchema, input);
    await this.requireParking(context, dto.parkingId);

    const startsAt = new Date(dto.startsAt);
    const endsAt = dto.endsAt !== undefined ? new Date(dto.endsAt) : null;
    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException("La fin d'abonnement doit être postérieure au début.");
    }

    const customer = await this.prisma.customer.upsert({
      where: { tenantId_email: { tenantId: context.tenantId, email: dto.customer.email } },
      update: this.buildCustomerName(dto),
      create: { tenantId: context.tenantId, email: dto.customer.email, ...this.buildCustomerName(dto) },
      select: { id: true },
    });

    const data: Prisma.SubscriptionUncheckedCreateInput = {
      tenantId: context.tenantId,
      parkingId: dto.parkingId,
      customerId: customer.id,
      startsAt,
    };
    if (endsAt) {
      data.endsAt = endsAt;
    }

    return this.prisma.subscription.create({ data, select: this.subscriptionSelect });
  }

  async listSubscriptions(context: TenantContext, input: ListSubscriptionsDto) {
    const dto = this.parse(listSubscriptionsSchema, input);
    await this.requireParking(context, dto.parkingId);

    return this.prisma.subscription.findMany({
      where: { tenantId: context.tenantId, parkingId: dto.parkingId },
      orderBy: { startsAt: "desc" },
      select: this.subscriptionSelect,
    });
  }

  async updateSubscription(context: TenantContext, subscriptionId: string, input: UpdateSubscriptionDto) {
    await this.requireSubscription(context, subscriptionId);
    const dto = this.parse(updateSubscriptionSchema, input);

    const data: Prisma.SubscriptionUpdateInput = {};
    if (dto.endsAt !== undefined) data.endsAt = new Date(dto.endsAt);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data,
      select: this.subscriptionSelect,
    });
  }

  async deleteSubscription(context: TenantContext, subscriptionId: string): Promise<{ id: string }> {
    await this.requireSubscription(context, subscriptionId);
    await this.prisma.subscription.delete({ where: { id: subscriptionId } });
    return { id: subscriptionId };
  }

  private readonly subscriptionSelect = {
    id: true,
    startsAt: true,
    endsAt: true,
    isActive: true,
    customer: { select: { id: true, email: true, firstName: true, lastName: true } },
  } satisfies Prisma.SubscriptionSelect;

  private buildCustomerName(dto: CreateSubscriptionDto): { firstName?: string; lastName?: string } {
    const name: { firstName?: string; lastName?: string } = {};
    if (dto.customer.firstName !== undefined) name.firstName = dto.customer.firstName;
    if (dto.customer.lastName !== undefined) name.lastName = dto.customer.lastName;
    return name;
  }

  private async requireParking(context: TenantContext, parkingId: string): Promise<void> {
    const parking = await this.prisma.parking.findFirst({
      where: { id: parkingId, tenantId: context.tenantId },
      select: { id: true },
    });
    if (!parking) {
      throw new NotFoundException("Parking introuvable pour ce tenant.");
    }
  }

  private async requireSubscription(context: TenantContext, subscriptionId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId: context.tenantId },
      select: { id: true },
    });
    if (!subscription) {
      throw new NotFoundException("Abonnement introuvable pour ce tenant.");
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
