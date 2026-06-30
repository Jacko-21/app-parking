import { badgeClass, type BadgeTone } from "../lib/labels";

type StatusPillProps = {
  label: string;
  tone: BadgeTone;
};

export function StatusPill({ label, tone }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${badgeClass(tone)}`}
    >
      {label}
    </span>
  );
}
