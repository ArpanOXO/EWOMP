import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-(--color-border) bg-(--color-surface) px-6 py-14 text-center">
      {icon && <div className="text-(--color-faint)">{icon}</div>}
      <div>
        <p className="font-medium text-(--color-text)">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-(--color-muted)">{description}</p>}
      </div>
      {action}
    </div>
  );
}
