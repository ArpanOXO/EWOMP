import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { TextField, TextareaField } from "../ui/FormField";
import { Button } from "../ui/Button";
import type { Department, DepartmentInput, Employee } from "../../types";
import { colorForDepartment } from "../../lib/constants";

const schema = yup.object({
  name: yup.string().required("Department name is required"),
  code: yup
    .string()
    .required("A short code is required")
    .matches(/^[A-Za-z0-9-]+$/, "Use letters, numbers and dashes only"),
  description: yup.string().optional().default(""),
  hrUserIds: yup.array(yup.string().required()).default([]),
  managerEmployeeId: yup.string().optional().default(""),
  color: yup.string().optional().default(""),
});

type FormValues = yup.InferType<typeof schema>;

export function DepartmentForm({
  department,
  hrCandidates,
  managerCandidates,
  onSubmit,
  onCancel,
  submitting,
}: {
  department?: Department;
  hrCandidates: Employee[];
  managerCandidates: Employee[];
  onSubmit: (values: DepartmentInput) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: department
      ? {
          name: department.name,
          code: department.code,
          description: department.description ?? "",
          hrUserIds: department.hrUserIds,
          managerEmployeeId: department.managerEmployeeId ?? "",
          color: department.color,
        }
      : { name: "", code: "", description: "", hrUserIds: [], managerEmployeeId: "", color: "" },
  });

  function submit(values: FormValues) {
    onSubmit({
      name: values.name,
      code: values.code.toUpperCase(),
      description: values.description,
      hrUserIds: values.hrUserIds,
      managerEmployeeId: values.managerEmployeeId || undefined,
      color: values.color || colorForDepartment(values.code.toUpperCase()),
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Department name" placeholder="Engineering" error={errors.name?.message} required {...register("name")} />
        <TextField
          label="Short code"
          placeholder="ENG"
          hint="Used in employee codes & badges"
          error={errors.code?.message}
          required
          {...register("code")}
          style={{ textTransform: "uppercase" }}
        />
      </div>

      <TextareaField label="Description" placeholder="What this department is responsible for" error={errors.description?.message} {...register("description")} />

      <Controller
        control={control}
        name="hrUserIds"
        render={({ field }) => (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-(--color-text)">HR staff who manage this department</span>
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-(--color-border) p-2.5">
              {hrCandidates.length === 0 && (
                <p className="px-1 py-2 text-sm text-(--color-muted)">
                  No HR accounts yet — add one from the Employees page first, then come back to assign them here.
                </p>
              )}
              {hrCandidates.map((hr) => {
                const checked = field.value?.includes(hr.userId);
                return (
                  <label key={hr.userId} className="flex items-center gap-2.5 rounded px-1.5 py-1.5 hover:bg-(--color-border-soft)">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...(field.value ?? []), hr.userId]
                          : (field.value ?? []).filter((id) => id !== hr.userId);
                        field.onChange(next);
                      }}
                      className="h-4 w-4 rounded border-(--color-border) text-(--color-accent) focus:ring-(--color-accent)"
                    />
                    <span className="text-sm text-(--color-text)">{hr.fullName}</span>
                    <span className="text-xs text-(--color-faint)">{hr.email}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-(--color-text)">Department manager (optional)</span>
        <select
          {...register("managerEmployeeId")}
          className="w-full rounded-md border border-(--color-border) bg-white px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/15"
        >
          <option value="">No manager assigned</option>
          {managerCandidates.map((m) => (
            <option key={m.$id} value={m.$id}>
              {m.fullName} — {m.designation}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {department ? "Save changes" : "Create department"}
        </Button>
      </div>
    </form>
  );
}
