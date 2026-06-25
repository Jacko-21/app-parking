import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import type { TenantContext } from "@bingoz/domain";

import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { type CreateManualReservationDto } from "./dto/create-manual-reservation.dto";
import {
  type CancelReservationDto,
  type ListReservationsDto,
} from "./dto/manage-reservation.dto";
import { ReservationService, type CreatedManualReservation } from "./reservation.service";

@Controller("reservations")
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get()
  listReservations(@CurrentTenant() context: TenantContext, @Query() query: ListReservationsDto) {
    return this.reservationService.listReservations(context, query);
  }

  @Get(":reservationId")
  getReservation(
    @CurrentTenant() context: TenantContext,
    @Param("reservationId") reservationId: string,
  ) {
    return this.reservationService.getReservation(context, reservationId);
  }

  @Roles("admin", "gestionnaire")
  @Post()
  createManualReservation(
    @CurrentTenant() context: TenantContext,
    @Body() body: CreateManualReservationDto,
  ): Promise<CreatedManualReservation> {
    return this.reservationService.createManualReservation(context, body);
  }

  @Roles("admin", "gestionnaire")
  @Post(":reservationId/cancel")
  cancelReservation(
    @CurrentTenant() context: TenantContext,
    @Param("reservationId") reservationId: string,
    @Body() body: CancelReservationDto,
  ) {
    return this.reservationService.cancelReservation(context, reservationId, body);
  }
}
