import type { ReactNode } from "react";
import clsx from "clsx";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "accent" | "amber" | "danger";
}

const toneClasses = {
  default: "text-(--color-text)",
  accent: "text-(--color-accent-strong)",
  amber: "text-(--color-amber)",
  danger: "text-(--color-danger)",
};

export function StatCard({ label, value, hint, icon, tone = "default" }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-(--color-faint)">{label}</p>
        {icon && <div className="text-(--color-faint)">{icon}</div>}
      </div>
      <p className={clsx("mt-2 font-(family-name:--font-display) text-3xl font-semibold", toneClasses[tone])}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-(--color-muted)">{hint}</p>}
    </Card>
  );
}
