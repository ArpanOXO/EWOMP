/**
 * One-time (idempotent) Appwrite project setup for EWOMP.
 * Creates: the database, the `admins` Team, and the departments / employees /
 * leaveRequests / auditLogs tables with their columns, indexes and permissions.
 *
 * Usage:  npm run appwrite:setup
 * Requires .env with VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID,
 * VITE_APPWRITE_DATABASE_ID and APPWRITE_API_KEY (a server API key with
 * databases.write + teams.write scopes — create one under
 * Project Settings → API keys in the Appwrite console).
 */
import { Permission, Role } from "node-appwrite";
import {
  ADMIN_TEAM_ID,
  DATABASE_ID,
  EMPLOYEE_TEAM_ID,
  HR_TEAM_ID,
  ignoreIfExists,
  tablesDB,
  teams,
} from "./_env.mjs";

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createColumns(tableId, columns) {
  for (const col of columns) {
    const base = { databaseId: DATABASE_ID, tableId, key: col.key, required: !!col.required };
    try {
      switch (col.type) {
        case "string":
          await tablesDB.createStringColumn({ ...base, size: col.size ?? 255, default: col.default, array: col.array ?? false });
          break;
        case "email":
          await tablesDB.createEmailColumn({ ...base, default: col.default, array: col.array ?? false });
          break;
        case "enum":
          await tablesDB.createEnumColumn({ ...base, elements: col.elements, default: col.default, array: col.array ?? false });
          break;
        case "integer":
          await tablesDB.createIntegerColumn({ ...base, min: col.min, max: col.max, default: col.default, array: col.array ?? false });
          break;
        case "float":
          await tablesDB.createFloatColumn({ ...base, min: col.min, max: col.max, default: col.default, array: col.array ?? false });
          break;
        case "datetime":
          await tablesDB.createDatetimeColumn({ ...base, default: col.default, array: col.array ?? false });
          break;
        case "boolean":
          await tablesDB.createBooleanColumn({ ...base, default: col.default, array: col.array ?? false });
          break;
        default:
          throw new Error(`Unknown column type ${col.type}`);
      }
      console.log(`    + column ${col.key}`);
    } catch (err) {
      if (err?.code === 409) {
        console.log(`    • column ${col.key} already exists, skipping`);
      } else {
        throw err;
      }
    }
    // Appwrite needs a brief moment to finish provisioning a column before the next call.
    await wait(250);
  }
}

async function createIndexes(tableId, indexes) {
  for (const idx of indexes) {
    try {
      await tablesDB.createIndex({ databaseId: DATABASE_ID, tableId, key: idx.key, type: idx.type, columns: idx.columns });
      console.log(`    + index ${idx.key}`);
    } catch (err) {
      if (err?.code === 409) {
        console.log(`    • index ${idx.key} already exists, skipping`);
      } else {
        throw err;
      }
    }
    await wait(250);
  }
}

async function main() {
  console.log(`Setting up Appwrite database "${DATABASE_ID}"…\n`);

  await ignoreIfExists(tablesDB.create({ databaseId: DATABASE_ID, name: "EWOMP" }), "database");
  await ignoreIfExists(teams.create({ teamId: ADMIN_TEAM_ID, name: "Administrators" }), "admins team");
  await ignoreIfExists(teams.create({ teamId: HR_TEAM_ID, name: "HR" }), "hr team");
  await ignoreIfExists(teams.create({ teamId: EMPLOYEE_TEAM_ID, name: "Employees" }), "employees team");

  const adminPerms = [
    Permission.read(Role.team(ADMIN_TEAM_ID)),
    Permission.create(Role.team(ADMIN_TEAM_ID)),
    Permission.update(Role.team(ADMIN_TEAM_ID)),
    Permission.delete(Role.team(ADMIN_TEAM_ID)),
  ];

  // ── departments ────────────────────────────────────────────────────────
  console.log("\n• Table: departments");
  await ignoreIfExists(
    tablesDB.createTable({
      databaseId: DATABASE_ID,
      tableId: "departments",
      name: "Departments",
      permissions: [Permission.read(Role.users()), ...adminPerms],
      rowSecurity: false,
    }),
    "departments table"
  );
  await createColumns("departments", [
    { key: "name", type: "string", size: 200, required: true },
    { key: "code", type: "string", size: 20, required: true },
    { key: "description", type: "string", size: 2000, required: false },
    { key: "hrUserIds", type: "string", size: 64, required: false, array: true },
    { key: "managerEmployeeId", type: "string", size: 64, required: false },
    { key: "color", type: "string", size: 20, required: false },
  ]);
  await createIndexes("departments", [
    { key: "idx_code", type: "unique", columns: ["code"] },
    { key: "idx_name", type: "key", columns: ["name"] },
  ]);

  // ── employees ──────────────────────────────────────────────────────────
  console.log("\n• Table: employees");
  await ignoreIfExists(
    tablesDB.createTable({
      databaseId: DATABASE_ID,
      tableId: "employees",
      name: "Employees",
      permissions: adminPerms,
      rowSecurity: true, // lets individual rows grant extra access to the employee themself + their HR
    }),
    "employees table"
  );
  await createColumns("employees", [
    { key: "userId", type: "string", size: 64, required: true },
    { key: "employeeCode", type: "string", size: 30, required: true },
    { key: "fullName", type: "string", size: 200, required: true },
    { key: "email", type: "email", required: true },
    { key: "phone", type: "string", size: 30, required: false },
    { key: "address", type: "string", size: 500, required: false },
    { key: "role", type: "enum", elements: ["admin", "hr", "employee"], required: true },
    { key: "departmentId", type: "string", size: 64, required: true },
    { key: "designation", type: "string", size: 150, required: true },
    { key: "dateOfJoining", type: "datetime", required: true },
    { key: "employmentStatus", type: "enum", elements: ["active", "on_leave", "inactive", "terminated"], required: true, default: "active" },
    { key: "salary", type: "float", required: true, min: 0 },
    { key: "managerId", type: "string", size: 64, required: false },
    { key: "emergencyContactName", type: "string", size: 200, required: false },
    { key: "emergencyContactPhone", type: "string", size: 30, required: false },
    { key: "leaveAnnualTotal", type: "integer", required: false, default: 18, min: 0 },
    { key: "leaveAnnualUsed", type: "integer", required: false, default: 0, min: 0 },
    { key: "leaveSickTotal", type: "integer", required: false, default: 10, min: 0 },
    { key: "leaveSickUsed", type: "integer", required: false, default: 0, min: 0 },
    { key: "leaveCasualTotal", type: "integer", required: false, default: 8, min: 0 },
    { key: "leaveCasualUsed", type: "integer", required: false, default: 0, min: 0 },
  ]);
  await createIndexes("employees", [
    { key: "idx_userId", type: "unique", columns: ["userId"] },
    { key: "idx_employeeCode", type: "unique", columns: ["employeeCode"] },
    { key: "idx_email", type: "unique", columns: ["email"] },
    { key: "idx_departmentId", type: "key", columns: ["departmentId"] },
    { key: "idx_role", type: "key", columns: ["role"] },
  ]);

  // ── leaveRequests ──────────────────────────────────────────────────────
  console.log("\n• Table: leaveRequests");
  await ignoreIfExists(
    tablesDB.createTable({
      databaseId: DATABASE_ID,
      tableId: "leaveRequests",
      name: "Leave Requests",
      // Any signed-in employee can file their own request; admins manage everything;
      // row-level grants (set by the app) give the right HR read/update access too.
      permissions: [Permission.create(Role.users()), ...adminPerms],
      rowSecurity: true,
    }),
    "leaveRequests table"
  );
  await createColumns("leaveRequests", [
    { key: "employeeId", type: "string", size: 64, required: true },
    { key: "employeeUserId", type: "string", size: 64, required: true },
    { key: "employeeName", type: "string", size: 200, required: true },
    { key: "departmentId", type: "string", size: 64, required: true },
    { key: "leaveType", type: "enum", elements: ["annual", "sick", "casual", "unpaid"], required: true },
    { key: "startDate", type: "datetime", required: true },
    { key: "endDate", type: "datetime", required: true },
    { key: "days", type: "integer", required: true, min: 1 },
    { key: "reason", type: "string", size: 1000, required: true },
    { key: "status", type: "enum", elements: ["pending", "approved", "rejected", "cancelled"], required: true, default: "pending" },
    { key: "reviewedBy", type: "string", size: 64, required: false },
    { key: "reviewerName", type: "string", size: 200, required: false },
    { key: "reviewNote", type: "string", size: 1000, required: false },
  ]);
  await createIndexes("leaveRequests", [
    { key: "idx_departmentId", type: "key", columns: ["departmentId"] },
    { key: "idx_employeeUserId", type: "key", columns: ["employeeUserId"] },
    { key: "idx_status", type: "key", columns: ["status"] },
  ]);

  // ── auditLogs ──────────────────────────────────────────────────────────
  console.log("\n• Table: auditLogs");
  await ignoreIfExists(
    tablesDB.createTable({
      databaseId: DATABASE_ID,
      tableId: "auditLogs",
      name: "Audit Logs",
      permissions: [Permission.create(Role.users()), ...adminPerms],
      rowSecurity: true,
    }),
    "auditLogs table"
  );
  await createColumns("auditLogs", [
    { key: "action", type: "string", size: 100, required: true },
    { key: "performedByUserId", type: "string", size: 64, required: true },
    { key: "performedByName", type: "string", size: 200, required: true },
    { key: "targetType", type: "enum", elements: ["employee", "department", "leaveRequest", "auth"], required: true },
    { key: "targetId", type: "string", size: 64, required: true },
    { key: "details", type: "string", size: 2000, required: false },
  ]);
  await createIndexes("auditLogs", [{ key: "idx_targetType", type: "key", columns: ["targetType"] }]);

  console.log("\nDone. Next: npm run appwrite:bootstrap-admin -- --name \"Your Name\" --email you@company.com --password \"Temp1234!\"");
}

main().catch((err) => {
  console.error("\nSetup failed:", err.message ?? err);
  process.exit(1);
});
