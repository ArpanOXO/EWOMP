/**
 * Permanently deletes an Appwrite Auth login (not just the employees row).
 *
 * The app's "Remove employee" action only deletes the employees table row
 * (so access is revoked immediately); it can't delete the underlying Auth
 * account because that requires a server API key, which the browser never
 * has. Run this afterwards if you also want the login itself gone for good.
 *
 * Usage: npm run appwrite:delete-user -- --email jane@company.com
 */
import { Query } from "node-appwrite";
import { args, users } from "./_env.mjs";

async function main() {
  const { email, userId } = args();
  if (!email && !userId) {
    console.error("Usage: npm run appwrite:delete-user -- --email jane@company.com   (or --userId <id>)");
    process.exit(1);
  }

  let targetId = userId;
  if (!targetId) {
    const match = await users.list({ queries: [Query.equal("email", email), Query.limit(1)] });
    if (!match.users[0]) {
      console.error(`No Appwrite user found with email ${email}`);
      process.exit(1);
    }
    targetId = match.users[0].$id;
  }

  await users.delete({ userId: targetId });
  console.log(`Deleted Appwrite Auth user ${targetId}.`);
}

main().catch((err) => {
  console.error("\nFailed:", err.message ?? err);
  process.exit(1);
});
