import { useMemo, useState } from "react";
import { Building2, Pencil, Plus, Trash2, Users as UsersIcon } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { DepartmentForm } from "../components/departments/DepartmentForm";
import { useCreateDepartment, useDeleteDepartment, useDepartments, useUpdateDepartment } from "../hooks/useDepartments";
import { useEmployees } from "../hooks/useEmployees";
import type { Department, DepartmentInput } from "../types";

export function DepartmentsPage() {
  const { data: departments, isLoading } = useDepartments();
  const { data: employees } = useEmployees();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | undefined>(undefined);
  const [deleting, setDeleting] = useState<Department | null>(null);

  const hrCandidates = useMemo(() => (employees ?? []).filter((e) => e.role === "hr"), [employees]);
  const managerCandidates = useMemo(() => employees ?? [], [employees]);
  const countByDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of employees ?? []) map.set(e.departmentId, (map.get(e.departmentId) ?? 0) + 1);
    return map;
  }, [employees]);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(d: Department) {
    setEditing(d);
    setFormOpen(true);
  }

  async function handleSubmit(input: DepartmentInput) {
    if (editing) {
      await updateDept.mutateAsync({ id: editing.$id, input });
    } else {
      await createDept.mutateAsync(input);
    }
    setFormOpen(false);
  }

  async function handleDelete() {
    if (!deleting) return;
    await deleteDept.mutateAsync(deleting.$id);
    setDeleting(null);
  }

  return (
    <DashboardLayout
      title="Departments"
      subtitle="Org structure, department leads, and which HR staff manage each team"
      actions={
        <Button onClick={openCreate}>
          <Plus size={16} /> New department
        </Button>
      }
    >
      {isLoading ? (
        <Spinner label="Loading departments…" />
      ) : !departments || departments.length === 0 ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title="No departments yet"
          description="Create your first department to start organizing employees."
          action={<Button onClick={openCreate}>Create department</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => {
            const manager = managerCandidates.find((m) => m.$id === d.managerEmployeeId);
            const hrNames = hrCandidates.filter((h) => d.hrUserIds.includes(h.userId));
            return (
              <Card key={d.$id} className="ledger-tab p-5 pl-6" style={{ "--dept-color": d.color } as React.CSSProperties}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-(family-name:--font-display) text-base font-semibold text-(--color-text)">{d.name}</p>
                    <p className="font-(family-name:--font-mono) text-xs text-(--color-faint)">{d.code}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(d)} className="rounded-md p-1.5 text-(--color-muted) hover:bg-(--color-border-soft) hover:text-(--color-text)" aria-label="Edit department">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleting(d)} className="rounded-md p-1.5 text-(--color-muted) hover:bg-(--color-danger-soft) hover:text-(--color-danger)" aria-label="Delete department">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {d.description && <p className="mt-3 text-sm text-(--color-muted)">{d.description}</p>}

                <div className="mt-4 flex items-center gap-1.5 text-sm text-(--color-text)">
                  <UsersIcon size={14} className="text-(--color-faint)" />
                  {countByDept.get(d.$id) ?? 0} employee{(countByDept.get(d.$id) ?? 0) === 1 ? "" : "s"}
                </div>

                {manager && <p className="mt-1.5 text-sm text-(--color-muted)">Managed by {manager.fullName}</p>}

                <div className="mt-3 border-t border-(--color-border-soft) pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-(--color-faint)">HR coverage</p>
                  {hrNames.length === 0 ? (
                    <p className="mt-1 text-sm text-(--color-muted)">No HR assigned yet</p>
                  ) : (
                    <p className="mt-1 text-sm text-(--color-text)">{hrNames.map((h) => h.fullName).join(", ")}</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : "New department"}
        description="HR staff you assign here get read & write access to this department's employee records."
      >
        <DepartmentForm
          department={editing}
          hrCandidates={hrCandidates}
          managerCandidates={managerCandidates}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmit}
          submitting={createDept.isPending || updateDept.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete department?"
        description={`This removes "${deleting?.name}" permanently. Employees already assigned to it will keep their record but lose their department link — reassign them first if that matters.`}
        confirmLabel="Delete department"
        loading={deleteDept.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </DashboardLayout>
  );
}
