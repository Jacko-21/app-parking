import { Module } from "@nestjs/common";

import { DatabaseModule } from "./modules/database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { ParkingModule } from "./modules/parking/parking.module";
import { ReservationModule } from "./modules/reservation/reservation.module";
import { TenantContextModule } from "./modules/tenant/tenant-context.module";

@Module({
  imports: [DatabaseModule, TenantContextModule, HealthModule, ParkingModule, ReservationModule],
})
export class AppModule {}
