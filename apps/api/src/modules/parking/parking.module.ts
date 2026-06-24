import { Module } from "@nestjs/common";

import { ParkingController } from "./parking.controller";
import { ParkingService } from "./parking.service";
import { PublicParkingController } from "./public-parking.controller";

@Module({
  controllers: [ParkingController, PublicParkingController],
  providers: [ParkingService],
})
export class ParkingModule {}
