import clsx from "clsx";

type Tone = "neutral" | "accent" | "amber" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-(--color-border-soft) text-(--color-muted)",
  accent: "bg-(--color-accent-soft) text-(--color-accent-strong)",
  amber: "bg-(--color-amber-soft) text-(--color-amber)",
  danger: "bg-(--color-danger-soft) text-(--color-danger)",
  info: "bg-(--color-info-soft) text-(--color-info)",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}
