import { functions } from "./appwrite";
import { RECOMPUTE_PERMISSIONS_FUNCTION_ID } from "./constants";

/**
 * Calls the server-side `recompute-permissions` Appwrite Function, which re-applies
 * row permissions for every employee + leave request row in a department.
 *
 * This has to go through a Function (running with an API key) rather than a plain
 * `tablesDB.updateRow(...)` call from the browser: Appwrite only allows a client
 * session to attach permissions for roles that session itself holds (its own user id,
 * `any`, `users`, or teams it belongs to). It will reject any attempt to grant
 * `user:<someoneElseId>` access — which is exactly what's needed here, since an HR
 * roster is a list of *other* people's user IDs. Only a server-side API key can do that.
 */
export async function recomputePermissionsRemote(departmentId: string, hrUserIds: string[]): Promise<void> {
  const execution = await functions.createExecution({
    functionId: RECOMPUTE_PERMISSIONS_FUNCTION_ID,
    body: JSON.stringify({ action: "recomputeDepartmentPermissions", departmentId, hrUserIds }),
    async: false,
  });

  let payload: unknown = null;
  try {
    payload = execution.responseBody ? JSON.parse(execution.responseBody) : null;
  } catch {
    throw new Error("Permissions function returned an invalid response.");
  }

  if (execution.responseStatusCode >= 400) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "Failed to update permissions.";
    throw new Error(message);
  }
}