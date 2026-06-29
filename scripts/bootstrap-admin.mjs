/**
 * Creates the very first Administrator account for a fresh EWOMP install.
 * After this, every other person (HR or Employee) is created from inside
 * the app by an Admin — this script only exists to break the chicken-and-egg
 * problem of "you need an Admin to create accounts, but there isn't one yet".
 *
 * Usage:
 *   npm run appwrite:bootstrap-admin -- --name "Jane Doe" --email jane@company.com --password "Temp1234!"
 *
 * Run `npm run appwrite:setup` first.
 */
import { ID, Query } from "node-appwrite";
import { ADMIN_TEAM_ID, DATABASE_ID, args, tablesDB, teams, users } from "./_env.mjs";

async function ensureGeneralDepartment(departmentName) {
  const existing = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: "departments",
    queries: [Query.equal("name", departmentName), Query.limit(1)],
  });
  if (existing.rows[0]) return existing.rows[0];

  return tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: "departments",
    rowId: ID.unique(),
    data: { name: departmentName, code: "GEN", description: "Default department created by the bootstrap script.", hrUserIds: [], color: "#2F6F4E" },
  });
}

function genEmployeeCode() {
  const time = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `EWP-${time}${rand}`;
}

async function main() {
  const { name, email, password, department = "General" } = args();
  if (!name || !email || !password) {
    console.error('Usage: npm run appwrite:bootstrap-admin -- --name "Jane Doe" --email jane@company.com --password "Temp1234!"');
    process.exit(1);
  }

  console.log(`Creating admin account for ${email}…`);
  const user = await users.create({ userId: ID.unique(), email, password, name });

  console.log(`Adding ${email} to the "${ADMIN_TEAM_ID}" team…`);
  await teams.createMembership({ teamId: ADMIN_TEAM_ID, userId: user.$id, roles: ["owner"], url: "https://appwrite.io/" });

  console.log(`Ensuring department "${department}" exists…`);
  const dept = await ensureGeneralDepartment(department);

  console.log("Creating the employee record…");
  await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: "employees",
    rowId: ID.unique(),
    data: {
      userId: user.$id,
      employeeCode: genEmployeeCode(),
      fullName: name,
      email,
      role: "admin",
      departmentId: dept.$id,
      designation: "Administrator",
      dateOfJoining: new Date().toISOString(),
      employmentStatus: "active",
      salary: 0,
      leaveAnnualTotal: 18,
      leaveAnnualUsed: 0,
      leaveSickTotal: 10,
      leaveSickUsed: 0,
      leaveCasualTotal: 8,
      leaveCasualUsed: 0,
    },
  });

  console.log(`\nDone. Sign in to EWOMP with:\n  Email: ${email}\n  Password: (the one you set)`);
}

main().catch((err) => {
  console.error("\nBootstrap failed:", err.message ?? err);
  process.exit(1);
});
