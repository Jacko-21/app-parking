import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import type { TenantContext } from "@bingoz/domain";

import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { type UpdateRetentionDto } from "./dto/retention.dto";
import { RgpdService } from "./rgpd.service";

@Roles("admin")
@Controller("rgpd")
export class RgpdController {
  constructor(private readonly rgpd: RgpdService) {}

  @Put("retention")
  setRetention(@CurrentTenant() context: TenantContext, @Body() body: UpdateRetentionDto) {
    return this.rgpd.setVehicleRetentionDays(context, body);
  }

  @Post("anonymize-expired")
  anonymizeExpired(@CurrentTenant() context: TenantContext) {
    return this.rgpd.anonymizeExpiredVehicles(context);
  }

  @Get("customers/:customerId/export")
  exportCustomer(@CurrentTenant() context: TenantContext, @Param("customerId") customerId: string) {
    return this.rgpd.exportCustomerData(context, customerId);
  }

  @Post("customers/:customerId/erase")
  eraseCustomer(@CurrentTenant() context: TenantContext, @Param("customerId") customerId: string) {
    return this.rgpd.eraseCustomerData(context, customerId);
  }
}
