import { Client, ID, Query, Permission, Role, TablesDB, Users } from "node-appwrite";

const TABLES = {
  departments: "departments",
  employees: "employees",
  leaveRequests: "leaveRequests",
};

function env(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function httpError(message, code) {
  return Object.assign(new Error(message), { code });
}

function employeePermissions(selfUserId, hrUserIds) {
  const perms = [Permission.read(Role.user(selfUserId)), Permission.update(Role.user(selfUserId))];

  for (const hrId of hrUserIds) {
    perms.push(
      Permission.read(Role.user(hrId)),
      Permission.update(Role.user(hrId)),
      Permission.delete(Role.user(hrId))
    );
  }

  return perms;
}

function leaveRequestPermissions(selfUserId, hrUserIds) {
  const perms = [Permission.read(Role.user(selfUserId)), Permission.update(Role.user(selfUserId))];

  for (const hrId of hrUserIds) {
    perms.push(Permission.read(Role.user(hrId)), Permission.update(Role.user(hrId)));
  }

  return perms;
}

function parseBody(req) {
  if (req.bodyJson && typeof req.bodyJson === "object") {
    return req.bodyJson;
  }

  const raw = req.bodyText || req.body || "{}";
  return JSON.parse(raw);
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw httpError(`${label} is required.`, 400);
  }

  return value.trim();
}

function requireNumber(value, label) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw httpError(`${label} is required.`, 400);
  }

  return value;
}

async function userIsInAnyTeam(users, userId, teamIds) {
  const memberships = await users.listMemberships({
    userId,
    queries: [Query.limit(100)],
  });

  return memberships.memberships.some((membership) => teamIds.includes(membership.teamId));
}

// Re-applies row permissions for every employee row and leave request that belongs to a
// department, so the department's current hrUserIds roster controls who can read/write
// them. Only Admins/HR may trigger this.
async function recomputeDepartmentPermissions({ tablesDB, users, callerUserId, adminTeamId, hrTeamId, databaseId, body, log }) {
  const allowed = await userIsInAnyTeam(users, callerUserId, [adminTeamId, hrTeamId]);
  if (!allowed) {
    throw httpError("You are not allowed to update permissions.", 403);
  }

  const departmentId = requireString(body.departmentId, "departmentId");
  const hrUserIds = Array.isArray(body.hrUserIds) ? body.hrUserIds.filter((id) => typeof id === "string") : [];

  const employeesRes = await tablesDB.listRows({
    databaseId,
    tableId: TABLES.employees,
    queries: [Query.equal("departmentId", departmentId), Query.limit(500)],
  });

  await Promise.all(
    employeesRes.rows.map((emp) =>
      tablesDB.updateRow({
        databaseId,
        tableId: TABLES.employees,
        rowId: emp.$id,
        data: {},
        permissions: employeePermissions(emp.userId, hrUserIds),
      })
    )
  );

  const leaveRes = await tablesDB.listRows({
    databaseId,
    tableId: TABLES.leaveRequests,
    queries: [Query.equal("departmentId", departmentId), Query.limit(500)],
  });

  await Promise.all(
    leaveRes.rows.map((lr) =>
      tablesDB.updateRow({
        databaseId,
        tableId: TABLES.leaveRequests,
        rowId: lr.$id,
        data: {},
        permissions: leaveRequestPermissions(lr.employeeUserId, hrUserIds),
      })
    )
  );

  log(
    `Recomputed permissions for department ${departmentId}: ${employeesRes.rows.length} employee row(s), ${leaveRes.rows.length} leave request row(s).`
  );

  return {
    ok: true,
    employeesUpdated: employeesRes.rows.length,
    leaveRequestsUpdated: leaveRes.rows.length,
  };
}

// Creates a leave request row with the correct permissions attached. Any signed-in
// employee may call this (they're filing their own leave) — the check here is just
// that they can only file for themselves, not on someone else's behalf.
async function createLeaveRequest({ tablesDB, callerUserId, databaseId, body, log }) {
  const { input } = body;

  if (!input || typeof input !== "object") {
    throw httpError("Leave request input is required.", 400);
  }

  const employeeId = requireString(input.employeeId, "employeeId");
  const employeeUserId = requireString(input.employeeUserId, "employeeUserId");
  const employeeName = requireString(input.employeeName, "employeeName");
  const departmentId = requireString(input.departmentId, "departmentId");
  const leaveType = requireString(input.leaveType, "leaveType");
  const startDate = requireString(input.startDate, "startDate");
  const endDate = requireString(input.endDate, "endDate");
  const days = requireNumber(input.days, "days");
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";

  if (employeeUserId !== callerUserId) {
    throw httpError("You can only submit leave requests for yourself.", 403);
  }

  // Look up the department's current HR roster server-side rather than trusting a
  // client-supplied list, so it can't be tampered with and is always up to date.
  const department = await tablesDB.getRow({
    databaseId,
    tableId: TABLES.departments,
    rowId: departmentId,
  });

  const row = await tablesDB.createRow({
    databaseId,
    tableId: TABLES.leaveRequests,
    rowId: ID.unique(),
    data: {
      employeeId,
      employeeUserId,
      employeeName,
      departmentId,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
      status: "pending",
    },
    permissions: leaveRequestPermissions(employeeUserId, department.hrUserIds ?? []),
  });

  log(`Created leave request ${row.$id} for employee ${employeeUserId}`);

  return { ok: true, leaveRequest: row };
}

// Both jobs below need an API key because they grant *other people* (an HR roster)
// permission on a row — something a plain client session can never do for roles it
// doesn't itself hold. They're combined into one Function because the Appwrite Free
// plan caps a project at 2 Functions, and this project already has `create-employee`
// alongside this one. Each action below enforces its own access rule internally,
// since the two need different access rules (recompute = Admin/HR only, leave
// request = any signed-in employee, for themselves only).
export default async ({ req, res, log, error }) => {
  try {
    const endpoint = env("APPWRITE_ENDPOINT");
    const projectId = env("APPWRITE_PROJECT_ID");
    const apiKey = env("APPWRITE_API_KEY");
    const databaseId = env("APPWRITE_DATABASE_ID");
    const adminTeamId = env("ADMIN_TEAM_ID", "admins");
    const hrTeamId = env("HR_TEAM_ID", "hr");

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

    const users = new Users(client);
    const tablesDB = new TablesDB(client);

    const callerUserId = req.headers["x-appwrite-user-id"] || req.headers["X-Appwrite-User-Id"];

    if (!callerUserId) {
      return res.json({ error: "You must be signed in." }, 401);
    }

    const body = parseBody(req);
    const action = requireString(body.action, "action");

    let result;
    if (action === "recomputeDepartmentPermissions") {
      result = await recomputeDepartmentPermissions({
        tablesDB,
        users,
        callerUserId,
        adminTeamId,
        hrTeamId,
        databaseId,
        body,
        log,
      });
    } else if (action === "createLeaveRequest") {
      result = await createLeaveRequest({ tablesDB, callerUserId, databaseId, body, log });
    } else {
      return res.json({ error: `Unknown action: ${action}` }, 400);
    }

    return res.json(result);
  } catch (err) {
    error(err?.message ?? String(err));
    return res.json(
      { error: err?.message ?? "Failed." },
      err?.code && Number.isInteger(err.code) ? err.code : 500
    );
  }
};