import { useMemo } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Spinner } from "../components/ui/Spinner";
import { AdminDashboard } from "../components/dashboard/AdminDashboard";
import { HrDashboard } from "../components/dashboard/HrDashboard";
import { EmployeeDashboard } from "../components/dashboard/EmployeeDashboard";
import { useEmployees } from "../hooks/useEmployees";
import { useDepartments } from "../hooks/useDepartments";
import { useLeaveRequests } from "../hooks/useLeaveRequests";
import { useAuthStore, isAdmin as checkIsAdmin, isHr as checkIsHr } from "../store/authStore";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const admin = checkIsAdmin(user);
  const hr = checkIsHr(user);

  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: departments, isLoading: loadingDepartments } = useDepartments();
  const { data: leaveRequests, isLoading: loadingLeave } = useLeaveRequests();

  const managedDeptIds = useMemo(
    () => (departments ?? []).filter((d) => user && d.hrUserIds.includes(user.userId)).map((d) => d.$id),
    [departments, user]
  );

  const isLoading = loadingEmployees || loadingDepartments || loadingLeave;

  const greeting = `Welcome back, ${user?.name?.split(" ")[0] ?? "there"}`;

  return (
    <DashboardLayout title="Dashboard" subtitle={greeting}>
      {isLoading || !employees || !departments || !leaveRequests ? (
        <Spinner label="Loading your dashboard…" />
      ) : admin ? (
        <AdminDashboard employees={employees} departments={departments} leaveRequests={leaveRequests} />
      ) : hr ? (
        <HrDashboard employees={employees} departments={departments} leaveRequests={leaveRequests} managedDeptIds={managedDeptIds} />
      ) : user?.employee ? (
        <EmployeeDashboard
          employee={user.employee}
          department={departments.find((d) => d.$id === user.employee?.departmentId)}
          myRequests={leaveRequests.filter((r) => r.employeeUserId === user.userId)}
        />
      ) : null}
    </DashboardLayout>
  );
}
