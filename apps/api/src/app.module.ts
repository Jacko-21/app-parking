import { Module } from "@nestjs/common";

import { AuthModule } from "./modules/auth/auth.module";
import { BookingModule } from "./modules/booking/booking.module";
import { ConfigurationModule } from "./modules/configuration/configuration.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DatabaseModule } from "./modules/database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { IncidentModule } from "./modules/incident/incident.module";
import { ParkingModule } from "./modules/parking/parking.module";
import { ReservationModule } from "./modules/reservation/reservation.module";
import { RgpdModule } from "./modules/rgpd/rgpd.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    HealthModule,
    ParkingModule,
    ReservationModule,
    ConfigurationModule,
    SubscriptionModule,
    IncidentModule,
    BookingModule,
    RgpdModule,
    DashboardModule,
  ],
})
export class AppModule {}
