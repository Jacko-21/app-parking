import { Body, Controller, Headers, Post } from "@nestjs/common";

import { TenantContextService } from "../tenant/tenant-context.service";
import { type CreateManualReservationDto } from "./dto/create-manual-reservation.dto";
import { ReservationService, type CreatedManualReservation } from "./reservation.service";

@Controller("reservations")
export class ReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  createManualReservation(
    @Headers("x-tenant-id") tenantIdHeader: string | string[] | undefined,
    @Body() body: CreateManualReservationDto,
  ): Promise<CreatedManualReservation> {
    const context = this.tenantContextService.resolveFromDevHeader(tenantIdHeader);
    return this.reservationService.createManualReservation(context, body);
  }
}
