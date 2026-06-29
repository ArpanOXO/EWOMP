// Central place for IDs and small lookup tables used across the app.

export const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT as string;
export const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID as string;
export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID as string;
export const CREATE_EMPLOYEE_FUNCTION_ID = "6a4150650003e01ac151";
// REPLACE_ME: after creating+deploying the "recompute-permissions" function in the
// Appwrite console, paste its real Function ID here (see the Overview tab) — it will
// NOT be the literal string "recompute-permissions", the same way CREATE_EMPLOYEE_FUNCTION_ID
// above isn't the literal string "create-employee".
export const RECOMPUTE_PERMISSIONS_FUNCTION_ID = "recompute-permissions";
// Leave requests also go through the function above (action: "createLeaveRequest") —
// Appwrite's Free plan caps a project at 2 Functions, and this one + create-employee
// already use both slots. See functions/recompute-permissions/src/main.js.

// Table IDs inside the EWOMP database. Keep these in sync with scripts/appwrite-setup.mjs.
export const TABLES = {
  departments: "departments",
  employees: "employees",
  leaveRequests: "leaveRequests",
  auditLogs: "auditLogs",
} as const;

// The single Appwrite Team that grants blanket (table-level) admin access.
export const ADMIN_TEAM_ID = "admins";

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  hr: "HR Manager",
  employee: "Employee",
};

export const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  on_leave: "On leave",
  inactive: "Inactive",
  terminated: "Terminated",
};

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual",
  sick: "Sick",
  casual: "Casual",
  unpaid: "Unpaid",
};

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

// Deterministic, named palette for department tags — avoids a random hash producing
// muddy or clashing colors, and keeps the same department visually consistent everywhere.
export const DEPARTMENT_PALETTE = [
  "#2F6F4E", // ledger green
  "#2F5F8F", // ink blue
  "#C9851C", // amber
  "#7A4FA3", // plum
  "#B3392C", // brick
  "#1F8A8C", // teal
  "#A6692B", // ochre
  "#5B5FBF", // indigo
];

export function colorForDepartment(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DEPARTMENT_PALETTE.length;
  return DEPARTMENT_PALETTE[index];
}