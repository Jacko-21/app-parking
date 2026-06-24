import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { type QuoteReservationDto } from "./dto/quote-reservation.dto";
import { ParkingService, type PublicReservationQuote } from "./parking.service";

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
