import { Module } from "@nestjs/common";

import { AuthModule } from "./modules/auth/auth.module";
import { ConfigurationModule } from "./modules/configuration/configuration.module";
import { DatabaseModule } from "./modules/database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { ParkingModule } from "./modules/parking/parking.module";
import { ReservationModule } from "./modules/reservation/reservation.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    HealthModule,
    ParkingModule,
    ReservationModule,
    ConfigurationModule,
  ],
})
export class AppModule {}
