import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { TextField, SelectField, TextareaField } from "../ui/FormField";
import { Button } from "../ui/Button";
import { ROLE_LABELS, EMPLOYMENT_STATUS_LABELS } from "../../lib/constants";
import type { Department, Employee, EmployeeInput, Role } from "../../types";

const baseSchema = {
  fullName: yup.string().required("Full name is required"),
  email: yup.string().email("Enter a valid email").required("Email is required"),
  phone: yup.string().optional().default(""),
  address: yup.string().optional().default(""),
  role: yup.mixed<Role>().oneOf(["admin", "hr", "employee"]).required(),
  departmentId: yup.string().required("Choose a department"),
  designation: yup.string().required("Job title is required"),
  dateOfJoining: yup.string().required("Date of joining is required"),
  employmentStatus: yup
    .mixed<Employee["employmentStatus"]>()
    .oneOf(["active", "on_leave", "inactive", "terminated"])
    .required(),
  salary: yup.number().typeError("Enter a number").min(0, "Can't be negative").required("Salary is required"),
  managerId: yup.string().optional().default(""),
  emergencyContactName: yup.string().optional().default(""),
  emergencyContactPhone: yup.string().optional().default(""),
  leaveAnnualTotal: yup.number().typeError("Enter a number").min(0).default(18),
  leaveSickTotal: yup.number().typeError("Enter a number").min(0).default(10),
  leaveCasualTotal: yup.number().typeError("Enter a number").min(0).default(8),
};

const createSchema = yup.object({
  ...baseSchema,
  password: yup.string().min(8, "At least 8 characters").required("Set a temporary password"),
});

const editSchema = yup.object(baseSchema);

interface EmployeeFormProps {
  mode: "create" | "edit";
  employee?: Employee;
  departments: Department[];
  /** When the current user is HR, only these roles/departments are selectable. */
  allowedRoles: Role[];
  allowedDepartmentIds?: string[];
  managerCandidates: Employee[];
  onCancel: () => void;
  submitting?: boolean;
  onSubmitCreate?: (input: EmployeeInput, password: string) => void;
  onSubmitEdit?: (data: Partial<EmployeeInput>, departmentChanged: boolean) => void;
}

export function EmployeeForm({
  mode,
  employee,
  departments,
  allowedRoles,
  allowedDepartmentIds,
  managerCandidates,
  onCancel,
  submitting,
  onSubmitCreate,
  onSubmitEdit,
}: EmployeeFormProps) {
  const schema = mode === "create" ? createSchema : editSchema;
  type FormValues = yup.InferType<typeof createSchema>;

  const visibleDepartments = useMemo(
    () => (allowedDepartmentIds ? departments.filter((d) => allowedDepartmentIds.includes(d.$id)) : departments),
    [departments, allowedDepartmentIds]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as never,
    defaultValues: employee
      ? {
          fullName: employee.fullName,
          email: employee.email,
          phone: employee.phone ?? "",
          address: employee.address ?? "",
          role: employee.role,
          departmentId: employee.departmentId,
          designation: employee.designation,
          dateOfJoining: employee.dateOfJoining?.slice(0, 10),
          employmentStatus: employee.employmentStatus,
          salary: employee.salary,
          managerId: employee.managerId ?? "",
          emergencyContactName: employee.emergencyContactName ?? "",
          emergencyContactPhone: employee.emergencyContactPhone ?? "",
          leaveAnnualTotal: employee.leaveAnnualTotal,
          leaveSickTotal: employee.leaveSickTotal,
          leaveCasualTotal: employee.leaveCasualTotal,
          password: "",
        }
      : {
          fullName: "",
          email: "",
          phone: "",
          address: "",
          role: allowedRoles[0] ?? "employee",
          departmentId: visibleDepartments[0]?.$id ?? "",
          designation: "",
          dateOfJoining: new Date().toISOString().slice(0, 10),
          employmentStatus: "active",
          salary: 0,
          managerId: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          leaveAnnualTotal: 18,
          leaveSickTotal: 10,
          leaveCasualTotal: 8,
          password: "",
        },
  });

  function submit(values: FormValues) {
    const { password, ...rest } = values;
    const data: Partial<EmployeeInput> = {
      ...rest,
      phone: rest.phone || undefined,
      address: rest.address || undefined,
      managerId: rest.managerId || undefined,
      emergencyContactName: rest.emergencyContactName || undefined,
      emergencyContactPhone: rest.emergencyContactPhone || undefined,
      leaveAnnualUsed: employee?.leaveAnnualUsed ?? 0,
      leaveSickUsed: employee?.leaveSickUsed ?? 0,
      leaveCasualUsed: employee?.leaveCasualUsed ?? 0,
    };
    if (mode === "create") {
      onSubmitCreate?.(data as EmployeeInput, password);
    } else {
      onSubmitEdit?.(data, employee?.departmentId !== rest.departmentId);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Full name" error={errors.fullName?.message} required {...register("fullName")} />
        <TextField label="Email" type="email" error={errors.email?.message} required disabled={mode === "edit"} {...register("email")} />
      </div>

      {mode === "create" && (
        <TextField
          label="Temporary password"
          type="password"
          hint="They can change this after their first sign-in"
          error={(errors as Record<string, { message?: string }>).password?.message}
          required
          {...register("password" as never)}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Phone" error={errors.phone?.message} {...register("phone")} />
        <TextField label="Designation / job title" error={errors.designation?.message} required {...register("designation")} />
      </div>

      <TextareaField label="Address" error={errors.address?.message} {...register("address")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectField label="Role" error={errors.role?.message} required {...register("role")} disabled={allowedRoles.length === 1}>
          {allowedRoles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Department" error={errors.departmentId?.message} required {...register("departmentId")}>
          {visibleDepartments.map((d) => (
            <option key={d.$id} value={d.$id}>
              {d.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Employment status" error={errors.employmentStatus?.message} required {...register("employmentStatus")}>
          {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Date of joining" type="date" error={errors.dateOfJoining?.message} required {...register("dateOfJoining")} />
        <TextField label="Monthly salary" type="number" step="0.01" error={errors.salary?.message} required {...register("salary")} />
      </div>

      <SelectField label="Reports to (optional)" {...register("managerId")}>
        <option value="">No manager set</option>
        {managerCandidates
          .filter((m) => m.$id !== employee?.$id)
          .map((m) => (
            <option key={m.$id} value={m.$id}>
              {m.fullName} — {m.designation}
            </option>
          ))}
      </SelectField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Emergency contact name" {...register("emergencyContactName")} />
        <TextField label="Emergency contact phone" {...register("emergencyContactPhone")} />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-(--color-text)">Annual leave allowance (days/year)</p>
        <div className="grid grid-cols-3 gap-4">
          <TextField label="Annual" type="number" {...register("leaveAnnualTotal")} />
          <TextField label="Sick" type="number" {...register("leaveSickTotal")} />
          <TextField label="Casual" type="number" {...register("leaveCasualTotal")} />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-(--color-border-soft) pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === "create" ? "Add employee" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
