import type { DashboardDailyPoint } from "../lib/api";
import { formatCurrencyFromCents } from "../lib/labels";

type DailyRevenueChartProps = {
  points: DashboardDailyPoint[];
  currency: string;
};

export function DailyRevenueChart({ points, currency }: DailyRevenueChartProps) {
  const maxRevenue = Math.max(1, ...points.map((point) => point.revenueInCents));

  if (points.length === 0) {
    return <p className="text-sm text-muted">Pas encore de données.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>0</span>
        <span>Max : {formatCurrencyFromCents(maxRevenue, currency)}</span>
      </div>
      <div className="mt-2 flex h-40 items-end gap-1" role="img" aria-label="Chiffre d'affaires par jour">
        {points.map((point) => {
          const ratio = point.revenueInCents / maxRevenue;
          const heightPct = point.revenueInCents > 0 ? Math.max(4, Math.round(ratio * 100)) : 0;
          return (
            <div
              key={point.date}
              className="flex h-full flex-1 flex-col justify-end"
              title={`${point.date} : ${formatCurrencyFromCents(point.revenueInCents, currency)} (${point.reservationCount} réservation(s))`}
            >
              <div
                className="w-full rounded-t bg-brand"
                style={{ height: `${heightPct}%` }}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-1">
        {points.map((point) => (
          <span key={point.date} className="flex-1 text-center text-[10px] text-muted">
            {point.date.slice(8, 10)}
          </span>
        ))}
      </div>
    </div>
  );
}
