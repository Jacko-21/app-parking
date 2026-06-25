import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import type { TenantContext } from "@bingoz/domain";

import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { ConfigurationService } from "./configuration.service";
import {
  type CreateOfferDto,
  type CreateParkingDto,
  type CreatePriceRuleDto,
  type CreateSpaceDto,
  type CreateZoneDto,
  type PublishParkingDto,
  type UpdateParkingDto,
  type UpdateSpaceDto,
} from "./dto/configuration.dto";

@Roles("admin", "gestionnaire")
@Controller("config")
export class ConfigurationController {
  constructor(private readonly configuration: ConfigurationService) {}

  @Post("parkings")
  createParking(@CurrentTenant() context: TenantContext, @Body() body: CreateParkingDto) {
    return this.configuration.createParking(context, body);
  }

  @Patch("parkings/:parkingId")
  updateParking(
    @CurrentTenant() context: TenantContext,
    @Param("parkingId") parkingId: string,
    @Body() body: UpdateParkingDto,
  ) {
    return this.configuration.updateParking(context, parkingId, body);
  }

  @Post("parkings/:parkingId/publish")
  publishParking(
    @CurrentTenant() context: TenantContext,
    @Param("parkingId") parkingId: string,
    @Body() body: PublishParkingDto,
  ) {
    return this.configuration.setParkingPublication(context, parkingId, body);
  }

  @Get("parkings/:parkingId")
  getParkingDetail(@CurrentTenant() context: TenantContext, @Param("parkingId") parkingId: string) {
    return this.configuration.getParkingDetail(context, parkingId);
  }

  @Post("parkings/:parkingId/zones")
  createZone(
    @CurrentTenant() context: TenantContext,
    @Param("parkingId") parkingId: string,
    @Body() body: CreateZoneDto,
  ) {
    return this.configuration.createZone(context, parkingId, body);
  }

  @Delete("zones/:zoneId")
  deleteZone(@CurrentTenant() context: TenantContext, @Param("zoneId") zoneId: string) {
    return this.configuration.deleteZone(context, zoneId);
  }

  @Post("parkings/:parkingId/spaces")
  createSpace(
    @CurrentTenant() context: TenantContext,
    @Param("parkingId") parkingId: string,
    @Body() body: CreateSpaceDto,
  ) {
    return this.configuration.createSpace(context, parkingId, body);
  }

  @Patch("spaces/:spaceId")
  updateSpace(
    @CurrentTenant() context: TenantContext,
    @Param("spaceId") spaceId: string,
    @Body() body: UpdateSpaceDto,
  ) {
    return this.configuration.updateSpace(context, spaceId, body);
  }

  @Delete("spaces/:spaceId")
  deleteSpace(@CurrentTenant() context: TenantContext, @Param("spaceId") spaceId: string) {
    return this.configuration.deleteSpace(context, spaceId);
  }

  @Post("parkings/:parkingId/offers")
  createOffer(
    @CurrentTenant() context: TenantContext,
    @Param("parkingId") parkingId: string,
    @Body() body: CreateOfferDto,
  ) {
    return this.configuration.createOffer(context, parkingId, body);
  }

  @Delete("offers/:offerId")
  deleteOffer(@CurrentTenant() context: TenantContext, @Param("offerId") offerId: string) {
    return this.configuration.deleteOffer(context, offerId);
  }

  @Post("offers/:offerId/price-rules")
  createPriceRule(
    @CurrentTenant() context: TenantContext,
    @Param("offerId") offerId: string,
    @Body() body: CreatePriceRuleDto,
  ) {
    return this.configuration.createPriceRule(context, offerId, body);
  }

  @Delete("price-rules/:priceRuleId")
  deletePriceRule(@CurrentTenant() context: TenantContext, @Param("priceRuleId") priceRuleId: string) {
    return this.configuration.deletePriceRule(context, priceRuleId);
  }
}
