import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import type { TenantContext } from "@bingoz/domain";

import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { SubscriptionService } from "./subscription.service";
import {
  type CreateSubscriptionDto,
  type ListSubscriptionsDto,
  type UpdateSubscriptionDto,
} from "./dto/subscription.dto";

@Roles("admin", "gestionnaire")
@Controller("subscriptions")
export class SubscriptionController {
  constructor(private readonly subscriptions: SubscriptionService) {}

  @Post()
  create(@CurrentTenant() context: TenantContext, @Body() body: CreateSubscriptionDto) {
    return this.subscriptions.createSubscription(context, body);
  }

  @Get()
  list(@CurrentTenant() context: TenantContext, @Query() query: ListSubscriptionsDto) {
    return this.subscriptions.listSubscriptions(context, query);
  }

  @Patch(":subscriptionId")
  update(
    @CurrentTenant() context: TenantContext,
    @Param("subscriptionId") subscriptionId: string,
    @Body() body: UpdateSubscriptionDto,
  ) {
    return this.subscriptions.updateSubscription(context, subscriptionId, body);
  }

  @Delete(":subscriptionId")
  remove(@CurrentTenant() context: TenantContext, @Param("subscriptionId") subscriptionId: string) {
    return this.subscriptions.deleteSubscription(context, subscriptionId);
  }
}
