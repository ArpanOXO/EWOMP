import { CalendarClock, TreePalm, Users } from "lucide-react";
import { StatCard } from "../ui/StatCard";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { LEAVE_TYPE_LABELS } from "../../lib/constants";
import type { Department, Employee, LeaveRequest } from "../../types";

export function HrDashboard({
  employees,
  departments,
  leaveRequests,
  managedDeptIds,
}: {
  employees: Employee[];
  departments: Department[];
  leaveRequests: LeaveRequest[];
  managedDeptIds: string[];
}) {
  const managed = employees.filter((e) => e.role === "employee" && managedDeptIds.includes(e.departmentId));
  const pending = leaveRequests.filter((r) => r.status === "pending" && managedDeptIds.includes(r.departmentId));
  const onLeaveToday = managed.filter((e) => e.employmentStatus === "on_leave").length;
  const managedDepts = departments.filter((d) => managedDeptIds.includes(d.$id));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Employees you manage" value={managed.length} icon={<Users size={18} />} />
        <StatCard label="Pending approvals" value={pending.length} icon={<CalendarClock size={18} />} tone="amber" />
        <StatCard label="Currently on leave" value={onLeaveToday} icon={<TreePalm size={18} />} tone="accent" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="font-(family-name:--font-display) text-base font-semibold text-(--color-text)">Your departments</p>
          </CardHeader>
          <CardBody>
            {managedDepts.length === 0 ? (
              <p className="text-sm text-(--color-muted)">No department assigned yet — ask an administrator to add you as HR coverage.</p>
            ) : (
              <ul className="space-y-3">
                {managedDepts.map((d) => (
                  <li key={d.$id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-(--color-text)">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="text-(--color-muted)">
                      {employees.filter((e) => e.departmentId === d.$id).length} employees
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-(family-name:--font-display) text-base font-semibold text-(--color-text)">Awaiting your review</p>
          </CardHeader>
          <CardBody>
            {pending.length === 0 ? (
              <p className="text-sm text-(--color-muted)">Nothing pending — you're all caught up.</p>
            ) : (
              <ul className="space-y-3">
                {pending.slice(0, 6).map((r) => (
                  <li key={r.$id} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium text-(--color-text)">{r.employeeName}</p>
                      <p className="text-(--color-muted)">
                        {LEAVE_TYPE_LABELS[r.leaveType]} · {r.days} day{r.days === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Badge tone="amber">Pending</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
