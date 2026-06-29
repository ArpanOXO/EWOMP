import { create } from "zustand";
import { Query } from "appwrite";
import { account, tablesDB } from "../lib/appwrite";
import { APPWRITE_DATABASE_ID, TABLES } from "../lib/constants";
import type { AuthUser, Employee } from "../types";

interface AuthState {
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshEmployee: () => Promise<void>;
}

async function fetchEmployeeForUser(userId: string): Promise<Employee | null> {
  const res = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.employees,
    queries: [Query.equal("userId", userId), Query.limit(1)],
  });
  return (res.rows[0] as unknown as Employee) ?? null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "idle",
  user: null,
  error: null,

  bootstrap: async () => {
    set({ status: "loading", error: null });
    try {
      const acc = await account.get();
      const employee = await fetchEmployeeForUser(acc.$id);
      set({
        status: "authenticated",
        user: { userId: acc.$id, name: acc.name, email: acc.email, employee },
      });
    } catch {
      set({ status: "unauthenticated", user: null });
    }
  },

  login: async (email: string, password: string) => {
    set({ status: "loading", error: null });
    try {
      await account.createEmailPasswordSession({ email, password });
      const acc = await account.get();
      const employee = await fetchEmployeeForUser(acc.$id);
      if (!employee) {
        await account.deleteSession({ sessionId: "current" });
        set({
          status: "unauthenticated",
          user: null,
          error:
            "Your login works, but no employee profile is linked to this account yet. Ask an administrator to finish setting up your record.",
        });
        return;
      }
      set({
        status: "authenticated",
        user: { userId: acc.$id, name: acc.name, email: acc.email, employee },
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't sign in. Check your email and password.";
      set({ status: "unauthenticated", user: null, error: message });
      throw err;
    }
  },

  logout: async () => {
    try {
      await account.deleteSession({ sessionId: "current" });
    } finally {
      set({ status: "unauthenticated", user: null, error: null });
    }
  },

  refreshEmployee: async () => {
    const current = get().user;
    if (!current) return;
    const employee = await fetchEmployeeForUser(current.userId);
    set({ user: { ...current, employee } });
  },
}));

// ── Role helpers (pure functions, easy to unit test) ──────────────────────────

export function isAdmin(user: AuthUser | null): boolean {
  return user?.employee?.role === "admin";
}

export function isHr(user: AuthUser | null): boolean {
  return user?.employee?.role === "hr";
}

export function canManageDepartments(user: AuthUser | null): boolean {
  return isAdmin(user);
}

/** Admin can manage anyone. HR can manage employees (not other HR/Admins) inside a department they're assigned to. */
export function canManageEmployeeRecord(
  user: AuthUser | null,
  targetRole: string,
  hrUserIdsForDept: string[]
): boolean {
  if (isAdmin(user)) return true;
  if (!isHr(user) || !user?.employee) return false;
  if (targetRole !== "employee") return false;
  return hrUserIdsForDept.includes(user.employee.userId);
}

export function isSelf(user: AuthUser | null, employeeUserId: string): boolean {
  return user?.userId === employeeUserId;
}
