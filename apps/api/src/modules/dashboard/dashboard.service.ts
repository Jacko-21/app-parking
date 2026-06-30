import { Injectable } from "@nestjs/common";
import { ReservationStatus } from "@prisma/client";
import { summarizeDashboard, type DashboardSummary, type TenantContext } from "@bingoz/domain";

import { PrismaService } from "../database/prisma.service";

const BLOCKING_RESERVATION_STATUSES = [
  ReservationStatus.pending_payment,
  ReservationStatus.confirmed,
  ReservationStatus.completed,
];

const DASHBOARD_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantDashboard(context: TenantContext): Promise<DashboardSummary> {
    const now = new Date();
    const since = new Date(now.getTime() - DASHBOARD_WINDOW_DAYS * DAY_MS);

    const [parkingCount, publishedParkingCount, activeSpaces, activeReservations, reservations] =
      await Promise.all([
        this.prisma.parking.count({ where: { tenantId: context.tenantId } }),
        this.prisma.parking.count({ where: { tenantId: context.tenantId, isPublished: true } }),
        this.prisma.space.count({ where: { tenantId: context.tenantId, isActive: true } }),
        this.prisma.reservation.count({
          where: {
            tenantId: context.tenantId,
            status: { in: BLOCKING_RESERVATION_STATUSES },
            endsAt: { gt: now },
          },
        }),
        this.prisma.reservation.findMany({
          where: { tenantId: context.tenantId, createdAt: { gte: since } },
          orderBy: { createdAt: "asc" },
          select: { status: true, amountInCents: true, currency: true, createdAt: true },
        }),
      ]);

    return summarizeDashboard({
      now,
      reservations,
      occupancy: { activeSpaces, activeReservations },
      parkingCount,
      publishedParkingCount,
    });
  }
}
