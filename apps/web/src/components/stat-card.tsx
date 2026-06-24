import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, detail, icon: Icon }: StatCardProps) {
  return (
    <article className="rounded-lg border border-border bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-brand">
          <Icon aria-hidden="true" size={20} />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">{detail}</p>
    </article>
  );
}
