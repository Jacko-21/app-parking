import { Module } from "@nestjs/common";

import { BookingService } from "./booking.service";
import { PublicBookingController } from "./public-booking.controller";

@Module({
  controllers: [PublicBookingController],
  providers: [BookingService],
})
export class BookingModule {}
