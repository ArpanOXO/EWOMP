import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Query } from "appwrite";
import { functions, tablesDB } from "../lib/appwrite";
import {
  APPWRITE_DATABASE_ID,
  CREATE_EMPLOYEE_FUNCTION_ID,
  TABLES,
} from "../lib/constants";
import { recomputePermissionsRemote } from "../lib/recomputePermissions";
import type { Department, Employee, EmployeeInput } from "../types";

const EMPLOYEES_KEY = ["employees"] as const;

export function useEmployees() {
  return useQuery({
    queryKey: EMPLOYEES_KEY,
    queryFn: async () => {
      const res = await tablesDB.listRows({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.employees,
        queries: [Query.orderAsc("fullName"), Query.limit(500)],
      });

      return res.rows as unknown as Employee[];
    },
  });
}

interface CreateEmployeeArgs {
  input: EmployeeInput;
  password: string;
  department: Department;
}

export function useCreateEmployee() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ input, password }: CreateEmployeeArgs) => {
      const execution = await functions.createExecution({
        functionId: CREATE_EMPLOYEE_FUNCTION_ID,
        body: JSON.stringify({ input, password }),
        async: false,
      });

      let payload: unknown = null;
      try {
        payload = execution.responseBody ? JSON.parse(execution.responseBody) : null;
      } catch {
        throw new Error("Employee function returned an invalid response.");
      }

      if (execution.responseStatusCode >= 400) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Failed to create employee.";
        throw new Error(message);
      }

      if (
        !payload ||
        typeof payload !== "object" ||
        !("employee" in payload)
      ) {
        throw new Error("Employee function did not return the created row.");
      }

      return payload.employee as Employee;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMPLOYEES_KEY });
    },
  });
}

interface UpdateEmployeeArgs {
  id: string;
  data: Partial<EmployeeInput>;
  /** Pass both when the employee's department is changing, so their row's permissions
   *  move with them to the new department's HR roster. */
  newDepartmentId?: string;
  newDepartmentHrUserIds?: string[];
}

export function useUpdateEmployee() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, newDepartmentId, newDepartmentHrUserIds }: UpdateEmployeeArgs) => {
      const row = await tablesDB.updateRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.employees,
        rowId: id,
        data,
      });

      // Setting permissions for *other* users (the new department's HR roster) can't be
      // done from this browser session — only a server-side API key can grant access on
      // someone else's behalf. So this is a separate call to the recompute-permissions
      // Function, after the row's own data has already been saved successfully.
      if (newDepartmentId && newDepartmentHrUserIds) {
        await recomputePermissionsRemote(newDepartmentId, newDepartmentHrUserIds);
      }

      return row as unknown as Employee;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMPLOYEES_KEY });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      tablesDB.deleteRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.employees,
        rowId: id,
      }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMPLOYEES_KEY });
    },
  });
}