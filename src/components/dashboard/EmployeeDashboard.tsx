import { Briefcase, Building2, CalendarClock, DollarSign } from "lucide-react";
import { StatCard } from "../ui/StatCard";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { LeaveBalanceCard } from "../leave/LeaveBalanceCard";
import { EMPLOYMENT_STATUS_LABELS, LEAVE_TYPE_LABELS } from "../../lib/constants";
import type { Department, Employee, LeaveRequest } from "../../types";

export function EmployeeDashboard({
  employee,
  department,
  myRequests,
}: {
  employee: Employee;
  department?: Department;
  myRequests: LeaveRequest[];
}) {
  const totalRemaining =
    employee.leaveAnnualTotal -
    employee.leaveAnnualUsed +
    (employee.leaveSickTotal - employee.leaveSickUsed) +
    (employee.leaveCasualTotal - employee.leaveCasualUsed);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Department" value={department?.name ?? "—"} icon={<Building2 size={18} />} />
        <StatCard label="Designation" value={employee.designation} icon={<Briefcase size={18} />} />
        <StatCard label="Monthly salary" value={`$${employee.salary.toLocaleString()}`} icon={<DollarSign size={18} />} tone="accent" />
        <StatCard label="Leave days left" value={totalRemaining} icon={<CalendarClock size={18} />} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <LeaveBalanceCard employee={employee} />
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <p className="font-(family-name:--font-display) text-base font-semibold text-(--color-text)">Your recent leave requests</p>
          </CardHeader>
          <CardBody>
            {myRequests.length === 0 ? (
              <p className="text-sm text-(--color-muted)">You haven't requested any leave yet.</p>
            ) : (
              <ul className="space-y-3">
                {myRequests.slice(0, 6).map((r) => (
                  <li key={r.$id} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium text-(--color-text)">
                        {LEAVE_TYPE_LABELS[r.leaveType]} · {r.days} day{r.days === 1 ? "" : "s"}
                      </p>
                      <p className="text-(--color-muted)">
                        {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge tone={r.status === "pending" ? "amber" : r.status === "approved" ? "accent" : "danger"}>
                      {r.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-(--color-faint)">Employment status</p>
        <div className="mt-2">
          <Badge tone="accent">{EMPLOYMENT_STATUS_LABELS[employee.employmentStatus]}</Badge>
        </div>
      </Card>
    </div>
  );
}
