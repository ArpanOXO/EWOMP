import { Card } from "../ui/Card";
import { LEAVE_TYPE_LABELS } from "../../lib/constants";
import type { Employee } from "../../types";

function Row({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const remaining = Math.max(0, total - used);
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-(--color-text)">{label}</span>
        <span className="text-(--color-muted)">
          <span className="font-(family-name:--font-mono) text-(--color-text)">{remaining}</span> / {total} days left
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-(--color-border-soft)">
        <div
          className="h-full rounded-full bg-(--color-accent) transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function LeaveBalanceCard({ employee }: { employee: Employee }) {
  return (
    <Card className="p-5">
      <p className="font-(family-name:--font-display) text-base font-semibold text-(--color-text)">Leave balance</p>
      <div className="mt-4 space-y-4">
        <Row label={LEAVE_TYPE_LABELS.annual} used={employee.leaveAnnualUsed} total={employee.leaveAnnualTotal} />
        <Row label={LEAVE_TYPE_LABELS.sick} used={employee.leaveSickUsed} total={employee.leaveSickTotal} />
        <Row label={LEAVE_TYPE_LABELS.casual} used={employee.leaveCasualUsed} total={employee.leaveCasualTotal} />
      </div>
    </Card>
  );
}
