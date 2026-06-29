import { ID, Permission, Role } from "appwrite";
import { tablesDB } from "./appwrite";
import { ADMIN_TEAM_ID, APPWRITE_DATABASE_ID, TABLES } from "./constants";

interface LogActionInput {
  action: string;
  performedByUserId: string;
  performedByName: string;
  targetType: "employee" | "department" | "leaveRequest" | "auth";
  targetId: string;
  details?: string;
}

/** Writes a row to `auditLogs`. Failures are swallowed (logging should never block a user action). */
export async function logAction(input: LogActionInput): Promise<void> {
  try {
    await tablesDB.createRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.auditLogs,
      rowId: ID.unique(),
      data: {
        action: input.action,
        performedByUserId: input.performedByUserId,
        performedByName: input.performedByName,
        targetType: input.targetType,
        targetId: input.targetId,
        details: input.details ?? "",
      },
      permissions: [
        Permission.read(Role.team(ADMIN_TEAM_ID)),
        Permission.read(Role.user(input.performedByUserId)),
      ],
    });
  } catch (err) {
    console.warn("audit log write failed", err);
  }
}
