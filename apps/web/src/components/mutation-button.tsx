"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import { useActionState } from "react";

import { IDLE_STATE, type ActionState } from "../lib/action-state";

type Variant = "neutral" | "danger" | "primary";

const VARIANT_CLASS: Record<Variant, string> = {
  neutral: "border border-border text-ink hover:bg-surface",
  danger: "border border-border text-red-600 hover:bg-red-50",
  primary: "bg-brand text-white hover:opacity-90",
};

type MutationButtonProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  label: string;
  confirmMessage?: string;
  variant?: Variant;
  icon?: LucideIcon;
};

export function MutationButton({
  action,
  fields,
  label,
  confirmMessage,
  variant = "neutral",
  icon: Icon,
}: MutationButtonProps) {
  const [state, formAction, isPending] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        disabled={isPending}
        onClick={(event) => {
          if (confirmMessage && !window.confirm(confirmMessage)) {
            event.preventDefault();
          }
        }}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASS[variant]}`}
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="animate-spin" size={14} />
        ) : Icon ? (
          <Icon aria-hidden="true" size={14} />
        ) : null}
        {label}
      </button>
      {state.status === "error" ? (
        <span className="text-xs text-red-600">{state.message}</span>
      ) : null}
    </form>
  );
}
