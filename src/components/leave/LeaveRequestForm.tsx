import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { SelectField, TextField, TextareaField } from "../ui/FormField";
import { Button } from "../ui/Button";
import { LEAVE_TYPE_LABELS } from "../../lib/constants";
import type { Employee, LeaveType } from "../../types";

const schema = yup.object({
  leaveType: yup.mixed<LeaveType>().oneOf(["annual", "sick", "casual", "unpaid"]).required(),
  startDate: yup.string().required("Pick a start date"),
  endDate: yup
    .string()
    .required("Pick an end date")
    .test("range", "End date can't be before the start date", function (value) {
      return !value || !this.parent.startDate || value >= this.parent.startDate;
    }),
  reason: yup.string().required("A short reason helps approvals go faster").min(5, "Add a bit more detail"),
});

type FormValues = yup.InferType<typeof schema>;

function remainingFor(employee: Employee, type: LeaveType): number | null {
  if (type === "unpaid") return null;
  if (type === "annual") return employee.leaveAnnualTotal - employee.leaveAnnualUsed;
  if (type === "sick") return employee.leaveSickTotal - employee.leaveSickUsed;
  return employee.leaveCasualTotal - employee.leaveCasualUsed;
}

function daysBetween(start: string, end: string): number {
  const d1 = new Date(start);
  const d2 = new Date(end);
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000) + 1;
}

export function LeaveRequestForm({
  employee,
  onSubmit,
  onCancel,
  submitting,
}: {
  employee: Employee;
  onSubmit: (values: { leaveType: LeaveType; startDate: string; endDate: string; days: number; reason: string }) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [balanceWarning, setBalanceWarning] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { leaveType: "annual", startDate: "", endDate: "", reason: "" },
  });

  const leaveType = watch("leaveType");
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const days = useMemo(
    () => (startDate && endDate && endDate >= startDate ? daysBetween(startDate, endDate) : 0),
    [startDate, endDate]
  );
  const remaining = remainingFor(employee, leaveType);

  function submit(values: FormValues) {
    const computedDays = daysBetween(values.startDate, values.endDate);
    if (remaining !== null && computedDays > remaining) {
      setBalanceWarning(
        `You only have ${remaining} ${LEAVE_TYPE_LABELS[values.leaveType].toLowerCase()} day(s) left — this request needs ${computedDays}.`
      );
      return;
    }
    setBalanceWarning(null);
    onSubmit({ ...values, days: computedDays });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <SelectField label="Leave type" error={errors.leaveType?.message} {...register("leaveType")}>
        {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Start date" type="date" error={errors.startDate?.message} required {...register("startDate")} />
        <TextField label="End date" type="date" error={errors.endDate?.message} required {...register("endDate")} />
      </div>

      {days > 0 && (
        <p className="text-sm text-(--color-muted)">
          That's <span className="font-medium text-(--color-text)">{days}</span> day{days === 1 ? "" : "s"}
          {remaining !== null && (
            <>
              {" "}
              — you have <span className="font-medium text-(--color-text)">{remaining}</span> remaining
            </>
          )}
          .
        </p>
      )}

      <TextareaField label="Reason" placeholder="Briefly describe why you're requesting this leave" error={errors.reason?.message} required {...register("reason")} />

      {balanceWarning && (
        <p className="rounded-md bg-(--color-amber-soft) px-3 py-2 text-sm text-(--color-amber)">{balanceWarning}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Submit request
        </Button>
      </div>
    </form>
  );
}
