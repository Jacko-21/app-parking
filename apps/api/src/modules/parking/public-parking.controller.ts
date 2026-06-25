import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { Public } from "../auth/decorators/public.decorator";
import { type QuoteReservationDto } from "./dto/quote-reservation.dto";
import { ParkingService, type PublicReservationQuote } from "./parking.service";

@Public()
@Controller("public/parkings")
export class PublicParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  @Get(":slug")
  getPublicParking(@Param("slug") slug: string) {
    return this.parkingService.getPublicParking(slug);
  }

  @Post(":slug/quote")
  quotePublicReservation(
    @Param("slug") slug: string,
    @Body() body: QuoteReservationDto,
  ): Promise<PublicReservationQuote> {
    return this.parkingService.quotePublicReservation(slug, body);
  }
}
