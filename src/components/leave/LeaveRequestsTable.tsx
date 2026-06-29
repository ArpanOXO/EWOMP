import { Check, X as XIcon, XCircle } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from "../../lib/constants";
import type { LeaveRequest } from "../../types";

const statusTone: Record<string, "amber" | "accent" | "danger" | "neutral"> = {
  pending: "amber",
  approved: "accent",
  rejected: "danger",
  cancelled: "neutral",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function LeaveRequestsTable({
  requests,
  showEmployeeColumn,
  canReview,
  canCancel,
  onApprove,
  onReject,
  onCancel,
}: {
  requests: LeaveRequest[];
  showEmployeeColumn: boolean;
  canReview: (r: LeaveRequest) => boolean;
  canCancel: (r: LeaveRequest) => boolean;
  onApprove: (r: LeaveRequest) => void;
  onReject: (r: LeaveRequest) => void;
  onCancel: (r: LeaveRequest) => void;
}) {
  if (requests.length === 0) {
    return <p className="py-10 text-center text-sm text-(--color-muted)">No leave requests to show.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-(--color-border-soft) text-xs uppercase tracking-wide text-(--color-faint)">
            {showEmployeeColumn && <th className="py-2.5 pr-4 font-medium">Employee</th>}
            <th className="py-2.5 pr-4 font-medium">Type</th>
            <th className="py-2.5 pr-4 font-medium">Dates</th>
            <th className="py-2.5 pr-4 font-medium">Days</th>
            <th className="py-2.5 pr-4 font-medium">Reason</th>
            <th className="py-2.5 pr-4 font-medium">Status</th>
            <th className="py-2.5 pr-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.$id} className="border-b border-(--color-border-soft) last:border-0">
              {showEmployeeColumn && <td className="py-3 pr-4 font-medium text-(--color-text)">{r.employeeName}</td>}
              <td className="py-3 pr-4 text-(--color-text)">{LEAVE_TYPE_LABELS[r.leaveType]}</td>
              <td className="py-3 pr-4 text-(--color-muted)">
                {formatDate(r.startDate)} – {formatDate(r.endDate)}
              </td>
              <td className="py-3 pr-4 font-(family-name:--font-mono) text-(--color-text)">{r.days}</td>
              <td className="max-w-[220px] truncate py-3 pr-4 text-(--color-muted)" title={r.reason}>
                {r.reason}
              </td>
              <td className="py-3 pr-4">
                <Badge tone={statusTone[r.status]}>{LEAVE_STATUS_LABELS[r.status]}</Badge>
                {r.status !== "pending" && r.reviewerName && (
                  <p className="mt-0.5 text-xs text-(--color-faint)">by {r.reviewerName}</p>
                )}
              </td>
              <td className="py-3 pr-2 text-right">
                <div className="flex justify-end gap-1.5">
                  {canReview(r) && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => onApprove(r)}>
                        <Check size={14} /> Approve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onReject(r)}>
                        <XIcon size={14} /> Reject
                      </Button>
                    </>
                  )}
                  {canCancel(r) && (
                    <Button size="sm" variant="ghost" onClick={() => onCancel(r)}>
                      <XCircle size={14} /> Cancel
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
