import { Controller, Get } from "@nestjs/common";
import type { TenantContext } from "@bingoz/domain";

import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { ParkingService, type ParkingSummary } from "./parking.service";

@Controller("parkings")
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  @Get()
  listParkings(@CurrentTenant() context: TenantContext): Promise<ParkingSummary[]> {
    return this.parkingService.listParkings(context);
  }
}
