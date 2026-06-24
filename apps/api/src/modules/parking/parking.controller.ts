import { Controller, Get, Headers } from "@nestjs/common";

import { TenantContextService } from "../tenant/tenant-context.service";
import { ParkingService, type ParkingSummary } from "./parking.service";

@Controller("parkings")
export class ParkingController {
  constructor(
    private readonly parkingService: ParkingService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get()
  listParkings(@Headers("x-tenant-id") tenantIdHeader: string | string[] | undefined): Promise<ParkingSummary[]> {
    const context = this.tenantContextService.resolveFromDevHeader(tenantIdHeader);
    return this.parkingService.listParkings(context);
  }
}
