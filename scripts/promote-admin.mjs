/**
 * Adds an EXISTING user (already an HR or Employee in EWOMP) to the `admins`
 * Team, instantly and without an email invite — only possible from the server.
 * Pair this with editing their employees.role to "admin" from the Admin UI,
 * or pass --setRole to have this script do that too.
 *
 * Usage: npm run appwrite:promote-admin -- --email jane@company.com [--setRole]
 */
import { Query } from "node-appwrite";
import { ADMIN_TEAM_ID, DATABASE_ID, args, tablesDB, teams, users } from "./_env.mjs";

async function main() {
  const { email, setRole } = args();
  if (!email) {
    console.error("Usage: npm run appwrite:promote-admin -- --email jane@company.com [--setRole]");
    process.exit(1);
  }

  const match = await users.list({ queries: [Query.equal("email", email), Query.limit(1)] });
  const user = match.users[0];
  if (!user) {
    console.error(`No Appwrite user found with email ${email}`);
    process.exit(1);
  }

  console.log(`Adding ${email} to the "${ADMIN_TEAM_ID}" team…`);
  await teams.createMembership({ teamId: ADMIN_TEAM_ID, userId: user.$id, roles: ["owner"], url: "https://appwrite.io/" });

  if (setRole) {
    const employees = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: "employees",
      queries: [Query.equal("userId", user.$id), Query.limit(1)],
    });
    const emp = employees.rows[0];
    if (emp) {
      await tablesDB.updateRow({ databaseId: DATABASE_ID, tableId: "employees", rowId: emp.$id, data: { role: "admin" } });
      console.log("Updated their employees.role to admin.");
    } else {
      console.warn("No employees row found for this user — skipped updating role.");
    }
  }

  console.log(`\nDone. ${email} now has administrator access.`);
}

main().catch((err) => {
  console.error("\nFailed:", err.message ?? err);
  process.exit(1);
});
