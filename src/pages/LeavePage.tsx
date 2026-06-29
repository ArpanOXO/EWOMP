import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { LeaveBalanceCard } from "../components/leave/LeaveBalanceCard";
import { LeaveRequestForm } from "../components/leave/LeaveRequestForm";
import { LeaveRequestsTable } from "../components/leave/LeaveRequestsTable";
import { useCancelLeaveRequest, useCreateLeaveRequest, useLeaveRequests, useReviewLeaveRequest } from "../hooks/useLeaveRequests";
import { useDepartments } from "../hooks/useDepartments";
import { useEmployees } from "../hooks/useEmployees";
import { useAuthStore, isAdmin as checkIsAdmin, isHr as checkIsHr } from "../store/authStore";
import { logAction } from "../lib/audit";
import type { LeaveRequest, LeaveType } from "../types";

export function LeavePage() {
  const user = useAuthStore((s) => s.user);
  const employee = user?.employee;
  const admin = checkIsAdmin(user);
  const hr = checkIsHr(user);

  const { data: requests, isLoading: loadingRequests } = useLeaveRequests();
  const { data: departments } = useDepartments();
  const { data: employees } = useEmployees();
  const createRequest = useCreateLeaveRequest();
  const reviewRequest = useReviewLeaveRequest();
  const cancelRequest = useCancelLeaveRequest();

  const [formOpen, setFormOpen] = useState(false);

  const myManagedDeptIds = useMemo(
    () => (departments ?? []).filter((d) => user && d.hrUserIds.includes(user.userId)).map((d) => d.$id),
    [departments, user]
  );

  const visibleRequests = useMemo(() => requests ?? [], [requests]);

  const pendingCount = visibleRequests.filter((r) => r.status === "pending").length;

  function canReview(r: LeaveRequest): boolean {
    if (r.status !== "pending") return false;
    if (admin) return true;
    if (hr) return myManagedDeptIds.includes(r.departmentId);
    return false;
  }

  function canCancel(r: LeaveRequest): boolean {
    return r.status === "pending" && r.employeeUserId === user?.userId;
  }

  async function handleApply(values: { leaveType: LeaveType; startDate: string; endDate: string; days: number; reason: string }) {
    if (!employee || !user) return;
    await createRequest.mutateAsync({
      input: {
        employeeId: employee.$id,
        employeeUserId: employee.userId,
        employeeName: employee.fullName,
        departmentId: employee.departmentId,
        ...values,
      },
    });
    await logAction({
      action: "leave.request",
      performedByUserId: user.userId,
      performedByName: user.name,
      targetType: "leaveRequest",
      targetId: employee.$id,
      details: `Requested ${values.days} day(s) of ${values.leaveType} leave`,
    });
    setFormOpen(false);
  }

  async function handleApprove(r: LeaveRequest) {
    if (!user) return;
    const emp = (employees ?? []).find((e) => e.$id === r.employeeId);
    await reviewRequest.mutateAsync({
      id: r.$id,
      status: "approved",
      reviewedBy: user.userId,
      reviewerName: user.name,
      employee: emp,
      leaveType: r.leaveType,
      days: r.days,
    });
    await logAction({
      action: "leave.approve",
      performedByUserId: user.userId,
      performedByName: user.name,
      targetType: "leaveRequest",
      targetId: r.$id,
      details: `Approved ${r.days} day(s) of ${r.leaveType} leave for ${r.employeeName}`,
    });
  }

  async function handleReject(r: LeaveRequest) {
    if (!user) return;
    await reviewRequest.mutateAsync({ id: r.$id, status: "rejected", reviewedBy: user.userId, reviewerName: user.name });
    await logAction({
      action: "leave.reject",
      performedByUserId: user.userId,
      performedByName: user.name,
      targetType: "leaveRequest",
      targetId: r.$id,
      details: `Rejected leave request for ${r.employeeName}`,
    });
  }

  async function handleCancel(r: LeaveRequest) {
    await cancelRequest.mutateAsync(r.$id);
  }

  return (
    <DashboardLayout
      title="Leave"
      subtitle={admin || hr ? "Review and approve time-off requests" : "Apply for leave and track your balance"}
      actions={
        !admin && !hr ? (
          <Button onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Request leave
          </Button>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {employee && (
          <div className="lg:col-span-1">
            <LeaveBalanceCard employee={employee} />
          </div>
        )}

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <p className="font-(family-name:--font-display) text-base font-semibold text-(--color-text)">
                {admin || hr ? "Requests" : "Your requests"}
              </p>
              {(admin || hr) && pendingCount > 0 && (
                <span className="rounded-full bg-(--color-amber-soft) px-2.5 py-0.5 text-xs font-medium text-(--color-amber)">
                  {pendingCount} pending
                </span>
              )}
            </CardHeader>
            <CardBody>
              {loadingRequests ? (
                <Spinner label="Loading leave requests…" />
              ) : (
                <LeaveRequestsTable
                  requests={visibleRequests}
                  showEmployeeColumn={admin || hr}
                  canReview={canReview}
                  canCancel={canCancel}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onCancel={handleCancel}
                />
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {employee && (
        <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Request leave">
          <LeaveRequestForm employee={employee} onCancel={() => setFormOpen(false)} onSubmit={handleApply} submitting={createRequest.isPending} />
        </Modal>
      )}
    </DashboardLayout>
  );
}