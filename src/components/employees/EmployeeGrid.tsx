import { useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { themeQuartz } from "ag-grid-community";
import type { ColDef } from "ag-grid-community";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "../ui/Badge";
import { EMPLOYMENT_STATUS_LABELS, ROLE_LABELS } from "../../lib/constants";
import type { Department, Employee } from "../../types";

const gridTheme = themeQuartz.withParams({
  accentColor: "#2F6F4E",
  backgroundColor: "#FFFFFF",
  foregroundColor: "#1A2333",
  headerBackgroundColor: "#F3F5F8",
  headerTextColor: "#5B6577",
  borderColor: "#E2E6EC",
  oddRowBackgroundColor: "#FAFBFC",
  rowHoverColor: "#F0F5F2",
  fontFamily: "Inter, -apple-system, sans-serif",
  headerFontWeight: 600,
  spacing: 8,
  wrapperBorderRadius: 12,
});

const statusTone: Record<string, "accent" | "amber" | "neutral" | "danger"> = {
  active: "accent",
  on_leave: "amber",
  inactive: "neutral",
  terminated: "danger",
};

export function EmployeeGrid({
  employees,
  departments,
  canEdit,
  onEdit,
  onDelete,
}: {
  employees: Employee[];
  departments: Department[];
  canEdit: (e: Employee) => boolean;
  onEdit: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}) {
  const gridRef = useRef<AgGridReact>(null);
  const deptById = useMemo(() => new Map(departments.map((d) => [d.$id, d])), [departments]);

  const columnDefs = useMemo<ColDef<Employee>[]>(
    () => [
      {
        headerName: "Code",
        field: "employeeCode",
        width: 130,
        cellClass: "font-mono text-xs text-(--color-faint)",
        pinned: "left",
      },
      {
        headerName: "Name",
        field: "fullName",
        flex: 1.3,
        minWidth: 180,
        cellRenderer: (p: { data: Employee }) => (
          <div className="flex flex-col py-1 leading-tight">
            <span className="font-medium text-(--color-text)">{p.data.fullName}</span>
            <span className="text-xs text-(--color-faint)">{p.data.email}</span>
          </div>
        ),
      },
      {
        headerName: "Department",
        field: "departmentId",
        flex: 1,
        minWidth: 150,
        cellRenderer: (p: { value: string }) => {
          const dept = deptById.get(p.value);
          if (!dept) return <span className="text-(--color-faint)">—</span>;
          return (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: dept.color }} />
              {dept.name}
            </span>
          );
        },
      },
      { headerName: "Designation", field: "designation", flex: 1, minWidth: 150 },
      {
        headerName: "Role",
        field: "role",
        width: 130,
        valueFormatter: (p) => ROLE_LABELS[p.value as string] ?? p.value,
      },
      {
        headerName: "Status",
        field: "employmentStatus",
        width: 140,
        cellRenderer: (p: { value: Employee["employmentStatus"] }) => (
          <Badge tone={statusTone[p.value] ?? "neutral"}>{EMPLOYMENT_STATUS_LABELS[p.value] ?? p.value}</Badge>
        ),
      },
      {
        headerName: "Salary",
        field: "salary",
        width: 130,
        valueFormatter: (p) => `$${Number(p.value ?? 0).toLocaleString()}`,
        cellClass: "font-mono text-xs",
      },
      {
        headerName: "",
        colId: "actions",
        width: 90,
        pinned: "right",
        sortable: false,
        filter: false,
        cellRenderer: (p: { data: Employee }) => {
          if (!canEdit(p.data)) return null;
          return (
            <div className="flex h-full items-center gap-1">
              <button
                onClick={() => onEdit(p.data)}
                className="rounded-md p-1.5 text-(--color-muted) hover:bg-(--color-border-soft) hover:text-(--color-text)"
                aria-label={`Edit ${p.data.fullName}`}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(p.data)}
                className="rounded-md p-1.5 text-(--color-muted) hover:bg-(--color-danger-soft) hover:text-(--color-danger)"
                aria-label={`Remove ${p.data.fullName}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        },
      },
    ],
    [deptById, canEdit, onEdit, onDelete]
  );

  return (
    <div style={{ height: "min(70vh, 640px)", width: "100%" }}>
      <AgGridReact
        ref={gridRef}
        theme={gridTheme}
        rowData={employees}
        columnDefs={columnDefs}
        getRowId={(p) => p.data.$id}
        rowHeight={52}
        headerHeight={40}
        pagination
        paginationPageSize={20}
        paginationPageSizeSelector={[10, 20, 50, 100]}
        animateRows
      />
    </div>
  );
}
