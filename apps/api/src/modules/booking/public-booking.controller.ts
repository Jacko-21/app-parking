import { Body, Controller, Param, Post } from "@nestjs/common";

import { Public } from "../auth/decorators/public.decorator";
import { BookingService } from "./booking.service";
import { type CreatePublicReservationDto } from "./dto/booking.dto";

@Public()
@Controller("public")
export class PublicBookingController {
  constructor(private readonly booking: BookingService) {}

  @Post("parkings/:slug/reservations")
  createReservation(@Param("slug") slug: string, @Body() body: CreatePublicReservationDto) {
    return this.booking.createPublicReservation(slug, body);
  }

  @Post("payments/:paymentId/confirm")
  confirmPayment(@Param("paymentId") paymentId: string) {
    return this.booking.confirmPayment(paymentId);
  }
}
