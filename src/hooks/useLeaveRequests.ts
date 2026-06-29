import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Query } from "appwrite";
import { functions, tablesDB } from "../lib/appwrite";
import { APPWRITE_DATABASE_ID, RECOMPUTE_PERMISSIONS_FUNCTION_ID, TABLES } from "../lib/constants";
import type { Employee, LeaveRequest, LeaveRequestInput, LeaveStatus, LeaveType } from "../types";

const LEAVE_KEY = ["leaveRequests"] as const;

export function useLeaveRequests() {
  return useQuery({
    queryKey: LEAVE_KEY,
    queryFn: async () => {
      const res = await tablesDB.listRows({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.leaveRequests,
        queries: [Query.orderDesc("$createdAt"), Query.limit(500)],
      });
      return res.rows as unknown as LeaveRequest[];
    },
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    // Goes through the recompute-permissions Function (action: "createLeaveRequest"),
    // running with an API key, rather than tablesDB.createRow directly: the row needs to
    // grant the department's HR manager(s) — other specific people's user IDs — read/update
    // access, and a plain employee session can only grant permissions for roles it itself
    // holds, not for someone else's user ID.
    mutationFn: async ({ input }: { input: LeaveRequestInput }) => {
      const execution = await functions.createExecution({
        functionId: RECOMPUTE_PERMISSIONS_FUNCTION_ID,
        body: JSON.stringify({ action: "createLeaveRequest", input }),
        async: false,
      });

      let payload: unknown = null;
      try {
        payload = execution.responseBody ? JSON.parse(execution.responseBody) : null;
      } catch {
        throw new Error("Leave request function returned an invalid response.");
      }

      if (execution.responseStatusCode >= 400) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "Failed to create leave request.";
        throw new Error(message);
      }

      if (!payload || typeof payload !== "object" || !("leaveRequest" in payload)) {
        throw new Error("Leave request function did not return the created row.");
      }

      return (payload as { leaveRequest: LeaveRequest }).leaveRequest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LEAVE_KEY }),
  });
}

interface ReviewLeaveArgs {
  id: string;
  status: "approved" | "rejected";
  reviewedBy: string;
  reviewerName: string;
  reviewNote?: string;
  /** When approving, also bump the employee's used-leave counter. */
  employee?: Employee;
  leaveType?: LeaveType;
  days?: number;
}

export function useReviewLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: ReviewLeaveArgs) => {
      const row = await tablesDB.updateRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.leaveRequests,
        rowId: args.id,
        data: {
          status: args.status,
          reviewedBy: args.reviewedBy,
          reviewerName: args.reviewerName,
          reviewNote: args.reviewNote ?? "",
        },
      });

      if (args.status === "approved" && args.employee && args.leaveType && args.days) {
        const field = `leave${args.leaveType[0].toUpperCase()}${args.leaveType.slice(1)}Used` as keyof Employee;
        const currentUsed = Number(args.employee[field] ?? 0);
        await tablesDB.updateRow({
          databaseId: APPWRITE_DATABASE_ID,
          tableId: TABLES.employees,
          rowId: args.employee.$id,
          data: { [field]: currentUsed + args.days },
        });
        qc.invalidateQueries({ queryKey: ["employees"] });
      }

      return row as unknown as LeaveRequest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LEAVE_KEY }),
  });
}

export function useCancelLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      tablesDB.updateRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.leaveRequests,
        rowId: id,
        data: { status: "cancelled" as LeaveStatus },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEAVE_KEY }),
  });
}