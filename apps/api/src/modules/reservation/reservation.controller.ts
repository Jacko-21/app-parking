import { Body, Controller, Post } from "@nestjs/common";
import type { TenantContext } from "@bingoz/domain";

import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { type CreateManualReservationDto } from "./dto/create-manual-reservation.dto";
import { ReservationService, type CreatedManualReservation } from "./reservation.service";

@Controller("reservations")
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Roles("admin", "gestionnaire")
  @Post()
  createManualReservation(
    @CurrentTenant() context: TenantContext,
    @Body() body: CreateManualReservationDto,
  ): Promise<CreatedManualReservation> {
    return this.reservationService.createManualReservation(context, body);
  }
}
