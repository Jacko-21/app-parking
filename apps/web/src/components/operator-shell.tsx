import {
  AlertTriangle,
  CalendarDays,
  LayoutDashboard,
  type LucideIcon,
  ParkingCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export type OperatorSection = "dashboard" | "reservations" | "subscriptions" | "incidents";

type NavItem = {
  key: OperatorSection;
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { key: "reservations", label: "Réservations", href: "/exploitation/reservations", icon: CalendarDays },
  { key: "subscriptions", label: "Abonnés", href: "/exploitation/abonnes", icon: Users },
  { key: "incidents", label: "Incidents", href: "/exploitation/incidents", icon: AlertTriangle },
];

type OperatorShellProps = {
  active: OperatorSection;
  subtitle?: string;
  children: ReactNode;
};

export function OperatorShell({ active, subtitle, children }: OperatorShellProps) {
  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white">
              <ParkingCircle aria-hidden="true" size={22} />
            </span>
            <span>
              <span className="block text-base font-semibold text-ink">Bingo&apos;z Parking</span>
              <span className="block text-sm text-muted">{subtitle ?? "Console exploitant"}</span>
            </span>
          </Link>
          <Link className="text-sm font-medium text-muted hover:text-ink" href="/login">
            Connexion
          </Link>
        </div>
        <nav
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-px"
          aria-label="Navigation exploitant"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === active;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium ${
                  isActive
                    ? "border-brand text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                <Icon aria-hidden="true" size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </main>
  );
}
