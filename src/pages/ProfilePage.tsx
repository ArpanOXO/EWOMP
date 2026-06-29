import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { TextField } from "../components/ui/FormField";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/authStore";
import { useUpdateEmployee } from "../hooks/useEmployees";
import { useDepartments } from "../hooks/useDepartments";
import { account } from "../lib/appwrite";
import { ROLE_LABELS, EMPLOYMENT_STATUS_LABELS, LEAVE_TYPE_LABELS } from "../lib/constants";

const profileSchema = yup.object({
  phone: yup.string().optional().default(""),
  address: yup.string().optional().default(""),
  emergencyContactName: yup.string().optional().default(""),
  emergencyContactPhone: yup.string().optional().default(""),
});
type ProfileValues = yup.InferType<typeof profileSchema>;

const passwordSchema = yup.object({
  currentPassword: yup.string().required("Enter your current password"),
  newPassword: yup.string().min(8, "At least 8 characters").required("Choose a new password"),
});
type PasswordValues = yup.InferType<typeof passwordSchema>;

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const refreshEmployee = useAuthStore((s) => s.refreshEmployee);
  const employee = user?.employee;
  const { data: departments } = useDepartments();
  const updateEmployee = useUpdateEmployee();
  const department = departments?.find((d) => d.$id === employee?.departmentId);

  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: savingProfile },
  } = useForm<ProfileValues>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      phone: employee?.phone ?? "",
      address: employee?.address ?? "",
      emergencyContactName: employee?.emergencyContactName ?? "",
      emergencyContactPhone: employee?.emergencyContactPhone ?? "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: savingPassword },
  } = useForm<PasswordValues>({ resolver: yupResolver(passwordSchema) });

  async function onSaveProfile(values: ProfileValues) {
    if (!employee) return;
    setSavedMsg(null);
    await updateEmployee.mutateAsync({ id: employee.$id, data: values });
    await refreshEmployee();
    setSavedMsg("Saved.");
  }

  async function onChangePassword(values: PasswordValues) {
    setPwMsg(null);
    try {
      await account.updatePassword({ password: values.newPassword, oldPassword: values.currentPassword });
      setPwMsg({ type: "success", text: "Password updated." });
      resetPassword();
    } catch (err) {
      setPwMsg({ type: "error", text: err instanceof Error ? err.message : "Couldn't update your password." });
    }
  }

  if (!employee) {
    return (
      <DashboardLayout title="My profile">
        <p className="text-(--color-muted)">No employee record is linked to your account yet.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My profile" subtitle="Your record — only an administrator or your HR team can change the fields below">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1 p-5">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-accent-soft) font-(family-name:--font-display) text-xl font-semibold text-(--color-accent-strong)">
              {employee.fullName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <p className="mt-3 font-(family-name:--font-display) text-lg font-semibold text-(--color-text)">{employee.fullName}</p>
            <p className="text-sm text-(--color-muted)">{employee.designation}</p>
            <div className="mt-2 flex gap-1.5">
              <Badge tone="accent">{ROLE_LABELS[employee.role]}</Badge>
              <Badge tone="neutral">{EMPLOYMENT_STATUS_LABELS[employee.employmentStatus]}</Badge>
            </div>
          </div>

          <div className="mt-5 space-y-2.5 border-t border-(--color-border-soft) pt-4 text-sm">
            <div className="flex justify-between"><span className="text-(--color-muted)">Employee code</span><span className="font-(family-name:--font-mono) text-(--color-text)">{employee.employeeCode}</span></div>
            <div className="flex justify-between"><span className="text-(--color-muted)">Department</span><span className="text-(--color-text)">{department?.name ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-(--color-muted)">Email</span><span className="text-(--color-text)">{employee.email}</span></div>
            <div className="flex justify-between"><span className="text-(--color-muted)">Joined</span><span className="text-(--color-text)">{new Date(employee.dateOfJoining).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-(--color-muted)">Monthly salary</span><span className="font-(family-name:--font-mono) text-(--color-text)">${employee.salary.toLocaleString()}</span></div>
          </div>

          <div className="mt-4 border-t border-(--color-border-soft) pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-(--color-faint)">Leave balance</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-(--color-muted)">{LEAVE_TYPE_LABELS.annual}</span><span className="text-(--color-text)">{employee.leaveAnnualTotal - employee.leaveAnnualUsed} / {employee.leaveAnnualTotal}</span></div>
              <div className="flex justify-between"><span className="text-(--color-muted)">{LEAVE_TYPE_LABELS.sick}</span><span className="text-(--color-text)">{employee.leaveSickTotal - employee.leaveSickUsed} / {employee.leaveSickTotal}</span></div>
              <div className="flex justify-between"><span className="text-(--color-muted)">{LEAVE_TYPE_LABELS.casual}</span><span className="text-(--color-text)">{employee.leaveCasualTotal - employee.leaveCasualUsed} / {employee.leaveCasualTotal}</span></div>
            </div>
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <p className="font-(family-name:--font-display) text-base font-semibold text-(--color-text)">Contact details</p>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField label="Phone" error={profileErrors.phone?.message} {...registerProfile("phone")} />
                  <TextField label="Emergency contact name" error={profileErrors.emergencyContactName?.message} {...registerProfile("emergencyContactName")} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField label="Address" error={profileErrors.address?.message} {...registerProfile("address")} />
                  <TextField label="Emergency contact phone" error={profileErrors.emergencyContactPhone?.message} {...registerProfile("emergencyContactPhone")} />
                </div>
                <div className="flex items-center gap-3">
                  <Button type="submit" loading={savingProfile}>Save changes</Button>
                  {savedMsg && <span className="text-sm text-(--color-accent-strong)">{savedMsg}</span>}
                </div>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <p className="font-(family-name:--font-display) text-base font-semibold text-(--color-text)">Change password</p>
            </CardHeader>
            <CardBody>
              <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField label="Current password" type="password" error={passwordErrors.currentPassword?.message} {...registerPassword("currentPassword")} />
                  <TextField label="New password" type="password" error={passwordErrors.newPassword?.message} {...registerPassword("newPassword")} />
                </div>
                <div className="flex items-center gap-3">
                  <Button type="submit" variant="secondary" loading={savingPassword}>Update password</Button>
                  {pwMsg && (
                    <span className={pwMsg.type === "success" ? "text-sm text-(--color-accent-strong)" : "text-sm text-(--color-danger)"}>
                      {pwMsg.text}
                    </span>
                  )}
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
