import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, CalendarClock, DollarSign, Users } from "lucide-react";
import { StatCard } from "../ui/StatCard";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { LEAVE_TYPE_LABELS } from "../../lib/constants";
import type { Department, Employee, LeaveRequest } from "../../types";

export function AdminDashboard({
  employees,
  departments,
  leaveRequests,
}: {
  employees: Employee[];
  departments: Department[];
  leaveRequests: LeaveRequest[];
}) {
  const pending = leaveRequests.filter((r) => r.status === "pending");
  const monthlyPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const activeCount = employees.filter((e) => e.employmentStatus === "active").length;

  const deptChartData = useMemo(
    () =>
      departments.map((d) => ({
        name: d.code,
        count: employees.filter((e) => e.departmentId === d.$id).length,
        color: d.color,
      })),
    [departments, employees]
  );

  const recentLeave = leaveRequests.slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total employees" value={employees.length} hint={`${activeCount} active`} icon={<Users size={18} />} />
        <StatCard label="Departments" value={departments.length} icon={<Building2 size={18} />} tone="accent" />
        <StatCard label="Pending leave" value={pending.length} hint="Awaiting review" icon={<CalendarClock size={18} />} tone="amber" />
        <StatCard label="Monthly payroll" value={`$${monthlyPayroll.toLocaleString()}`} icon={<DollarSign size={18} />} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <p className="font-(family-name:--font-display) text-base font-semibold text-(--color-text)">Headcount by department</p>
          </CardHeader>
          <CardBody>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={deptChartData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E6EC" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5B6577" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#5B6577" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #E2E6EC", fontSize: 13 }}
                    formatter={(value) => [`${Number(value ?? 0)} employee${Number(value) === 1 ? "" : "s"}`, ""]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#2F6F4E" maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-(family-name:--font-display) text-base font-semibold text-(--color-text)">Recent leave activity</p>
          </CardHeader>
          <CardBody>
            {recentLeave.length === 0 ? (
              <p className="text-sm text-(--color-muted)">No leave requests yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentLeave.map((r) => (
                  <li key={r.$id} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium text-(--color-text)">{r.employeeName}</p>
                      <p className="text-(--color-muted)">
                        {LEAVE_TYPE_LABELS[r.leaveType]} · {r.days} day{r.days === 1 ? "" : "s"}
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
    </div>
  );
}
