import { useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { EmployeeGrid } from "../components/employees/EmployeeGrid";
import { EmployeeForm } from "../components/employees/EmployeeForm";
import { useCreateEmployee, useDeleteEmployee, useEmployees, useUpdateEmployee } from "../hooks/useEmployees";
import { useDepartments } from "../hooks/useDepartments";
import { useAuthStore, isAdmin as checkIsAdmin } from "../store/authStore";
import { logAction } from "../lib/audit";
import type { Employee, EmployeeInput, Role } from "../types";

export function EmployeesPage() {
  const user = useAuthStore((s) => s.user);
  const admin = checkIsAdmin(user);

  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: departments, isLoading: loadingDepartments } = useDepartments();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | undefined>(undefined);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  const myManagedDeptIds = useMemo(
    () => (departments ?? []).filter((d) => user && d.hrUserIds.includes(user.userId)).map((d) => d.$id),
    [departments, user]
  );

  const allowedRoles: Role[] = admin ? ["admin", "hr", "employee"] : ["employee"];
  const allowedDepartmentIds = admin ? undefined : myManagedDeptIds;

  const filtered = useMemo(() => {
    const list = employees ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
    );
  }, [employees, search]);

  function canEdit(e: Employee): boolean {
    if (!user) return false;
    if (e.userId === user.userId) return false; // self-edits happen on the Profile page
    if (admin) return true;
    return e.role === "employee" && myManagedDeptIds.includes(e.departmentId);
  }

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(e: Employee) {
    setEditing(e);
    setFormOpen(true);
  }

  async function handleCreate(input: EmployeeInput, password: string) {
    const department = (departments ?? []).find((d) => d.$id === input.departmentId);
    if (!department) return;
    const created = await createEmployee.mutateAsync({ input, password, department });
    if (user) {
      await logAction({
        action: "employee.create",
        performedByUserId: user.userId,
        performedByName: user.name,
        targetType: "employee",
        targetId: created.$id,
        details: `Created ${created.fullName} (${created.role}) in ${department.name}`,
      });
    }
    setFormOpen(false);
  }

  async function handleEdit(data: Partial<EmployeeInput>, departmentChanged: boolean) {
    if (!editing) return;
    const newDept = departmentChanged ? (departments ?? []).find((d) => d.$id === data.departmentId) : undefined;
    await updateEmployee.mutateAsync({
      id: editing.$id,
      data,
      newDepartmentId: newDept?.$id,
      newDepartmentHrUserIds: newDept?.hrUserIds,
    });
    if (user) {
      await logAction({
        action: "employee.update",
        performedByUserId: user.userId,
        performedByName: user.name,
        targetType: "employee",
        targetId: editing.$id,
        details: `Updated ${editing.fullName}`,
      });
    }
    setFormOpen(false);
  }

  async function handleDelete() {
    if (!deleting || !user) return;
    await deleteEmployee.mutateAsync(deleting.$id);
    await logAction({
      action: "employee.delete",
      performedByUserId: user.userId,
      performedByName: user.name,
      targetType: "employee",
      targetId: deleting.$id,
      details: `Removed ${deleting.fullName}`,
    });
    setDeleting(null);
  }

  const isLoading = loadingEmployees || loadingDepartments;

  return (
    <DashboardLayout
      title="Employees"
      subtitle={admin ? "Full directory — every department" : "Employees in the departments you manage"}
      actions={
        <>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-faint)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, code…"
              className="h-10 w-56 rounded-md border border-(--color-border) bg-white pl-9 pr-3 text-sm focus:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/15"
            />
          </div>
          <Button onClick={openCreate} disabled={!admin && myManagedDeptIds.length === 0}>
            <Plus size={16} /> Add employee
          </Button>
        </>
      }
    >
      {isLoading ? (
        <Spinner label="Loading employees…" />
      ) : !admin && myManagedDeptIds.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No department assigned yet"
          description="An administrator hasn't assigned you to manage any department. Ask them to add you as HR coverage on a department."
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={28} />} title="No employees found" description="Try a different search, or add the first employee." />
      ) : (
        <EmployeeGrid
          employees={filtered}
          departments={departments ?? []}
          canEdit={canEdit}
          onEdit={openEdit}
          onDelete={setDeleting}
        />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.fullName}` : "Add employee"}
        width="xl"
      >
        <EmployeeForm
          mode={editing ? "edit" : "create"}
          employee={editing}
          departments={departments ?? []}
          allowedRoles={allowedRoles}
          allowedDepartmentIds={allowedDepartmentIds}
          managerCandidates={employees ?? []}
          onCancel={() => setFormOpen(false)}
          submitting={createEmployee.isPending || updateEmployee.isPending}
          onSubmitCreate={handleCreate}
          onSubmitEdit={handleEdit}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Remove employee?"
        description={`This deletes ${deleting?.fullName}'s employee record and revokes their access immediately. Their login will remain registered but unable to reach any data — run scripts/delete-auth-user.mjs if you also want to purge the login itself.`}
        confirmLabel="Remove employee"
        loading={deleteEmployee.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </DashboardLayout>
  );
}