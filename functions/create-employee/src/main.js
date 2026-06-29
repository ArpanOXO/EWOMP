import {
  Client,
  ID,
  Permission,
  Query,
  Role,
  TablesDB,
  Teams,
  Users,
} from "node-appwrite";

const TABLES = {
  departments: "departments",
  employees: "employees",
};

function env(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function genEmployeeCode() {
  const time = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `EWP-${time}${rand}`;
}

function employeePermissions(selfUserId, hrUserIds) {
  const perms = [
    Permission.read(Role.user(selfUserId)),
    Permission.update(Role.user(selfUserId)),
  ];

  for (const hrId of hrUserIds) {
    perms.push(
      Permission.read(Role.user(hrId)),
      Permission.update(Role.user(hrId)),
      Permission.delete(Role.user(hrId))
    );
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
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

async function userIsInAnyTeam(users, userId, teamIds) {
  const memberships = await users.listMemberships({
    userId,
    queries: [Query.limit(100)],
  });

  return memberships.memberships.some((membership) =>
    teamIds.includes(membership.teamId)
  );
}

export default async ({ req, res, log, error }) => {
  try {
    const endpoint = env("APPWRITE_ENDPOINT");
    const projectId = env("APPWRITE_PROJECT_ID");
    const apiKey = env("APPWRITE_API_KEY");
    const databaseId = env("APPWRITE_DATABASE_ID");
    const adminTeamId = env("ADMIN_TEAM_ID", "admins");
    const hrTeamId = env("HR_TEAM_ID", "hr");
    const employeeTeamId = env("EMPLOYEE_TEAM_ID", "employees");

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const users = new Users(client);
    const teams = new Teams(client);
    const tablesDB = new TablesDB(client);

    const callerUserId =
      req.headers["x-appwrite-user-id"] || req.headers["X-Appwrite-User-Id"];

    if (!callerUserId) {
      return res.json({ error: "You must be signed in." }, 401);
    }

    const allowed = await userIsInAnyTeam(users, callerUserId, [
      adminTeamId,
      hrTeamId,
    ]);

    if (!allowed) {
      return res.json({ error: "You are not allowed to create employees." }, 403);
    }

    const { input, password } = parseBody(req);

    if (!input || typeof input !== "object") {
      return res.json({ error: "Employee input is required." }, 400);
    }

    const email = requireString(input.email, "Email");
    const fullName = requireString(input.fullName, "Full name");
    const role = requireString(input.role, "Role");
    const departmentId = requireString(input.departmentId, "Department");
    const temporaryPassword = requireString(password, "Temporary password");

    if (!["admin", "hr", "employee"].includes(role)) {
      return res.json({ error: "Role must be admin, hr, or employee." }, 400);
    }

    if (temporaryPassword.length < 8) {
      return res.json(
        { error: "Temporary password must be at least 8 characters." },
        400
      );
    }

    const department = await tablesDB.getRow({
      databaseId,
      tableId: TABLES.departments,
      rowId: departmentId,
    });

    const authUser = await users.create({
      userId: ID.unique(),
      email,
      password: temporaryPassword,
      name: fullName,
    });

    const teamIdByRole = {
      admin: adminTeamId,
      hr: hrTeamId,
      employee: employeeTeamId,
    };

    await teams.createMembership({
      teamId: teamIdByRole[role],
      userId: authUser.$id,
      roles: [role],
      url: "https://appwrite.io/",
    });

    const employee = await tablesDB.createRow({
      databaseId,
      tableId: TABLES.employees,
      rowId: ID.unique(),
      data: {
        ...input,
        email,
        fullName,
        role,
        departmentId,
        userId: authUser.$id,
        employeeCode: genEmployeeCode(),
      },
      permissions: employeePermissions(authUser.$id, department.hrUserIds ?? []),
    });

    log(`Created employee ${employee.$id} for auth user ${authUser.$id}`);

    return res.json({ ok: true, employee });
  } catch (err) {
    error(err?.message ?? String(err));
    return res.json(
      { error: err?.message ?? "Failed to create employee." },
      err?.code && Number.isInteger(err.code) ? err.code : 500
    );
  }
};
