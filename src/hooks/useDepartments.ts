import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ID, Query } from "appwrite";
import { tablesDB } from "../lib/appwrite";
import { APPWRITE_DATABASE_ID, TABLES, colorForDepartment } from "../lib/constants";
import { departmentTablePermissions } from "../lib/permissions";
import { recomputePermissionsRemote } from "../lib/recomputePermissions";
import type { Department, DepartmentInput } from "../types";

const DEPARTMENTS_KEY = ["departments"] as const;

export function useDepartments() {
  return useQuery({
    queryKey: DEPARTMENTS_KEY,
    queryFn: async () => {
      const res = await tablesDB.listRows({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.departments,
        queries: [Query.orderAsc("name"), Query.limit(200)],
      });
      return res.rows as unknown as Department[];
    },
  });
}

/**
 * Re-applies row permissions for every employee row and leave request that belongs to a
 * department, so the department's current hrUserIds roster controls who can read/write
 * them. Called automatically after a department's HR assignment changes.
 *
 * Delegates to the `recompute-permissions` Appwrite Function (see functions/recompute-permissions)
 * because setting `user:<hrId>` permissions for users other than yourself requires an
 * API key — a plain client session can only grant permissions for roles it itself holds.
 */
export async function recomputeDepartmentPermissions(departmentId: string, hrUserIds: string[]) {
  await recomputePermissionsRemote(departmentId, hrUserIds);
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DepartmentInput) => {
      const row = await tablesDB.createRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.departments,
        rowId: ID.unique(),
        data: { ...input, color: input.color || colorForDepartment(input.code) },
        permissions: departmentTablePermissions(),
      });
      return row as unknown as Department;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DEPARTMENTS_KEY }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<DepartmentInput> }) => {
      const row = await tablesDB.updateRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.departments,
        rowId: id,
        data: input,
      });
      if (input.hrUserIds) {
        await recomputeDepartmentPermissions(id, input.hrUserIds);
      }
      return row as unknown as Department;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEPARTMENTS_KEY });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      tablesDB.deleteRow({ databaseId: APPWRITE_DATABASE_ID, tableId: TABLES.departments, rowId: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEPARTMENTS_KEY }),
  });
}