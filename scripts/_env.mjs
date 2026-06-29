import { config } from "dotenv";
import { Client, TablesDB, Teams, Users } from "node-appwrite";

config();

export const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
export const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
export const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "ewomp_db";
export const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error(
    "Missing Appwrite config. Make sure .env has VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, VITE_APPWRITE_DATABASE_ID and APPWRITE_API_KEY (server API key, never exposed to the browser)."
  );
  process.exit(1);
}

export const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
export const tablesDB = new TablesDB(client);
export const teams = new Teams(client);
export const users = new Users(client);
export const ADMIN_TEAM_ID = "admins";
export const HR_TEAM_ID = "hr";
export const EMPLOYEE_TEAM_ID = "employees";

export function args() {
  const out = {};
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = process.argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

/** Swallows "already exists" (409) errors so setup scripts are safe to re-run. */
export async function ignoreIfExists(promise, label) {
  try {
    return await promise;
  } catch (err) {
    if (err?.code === 409) {
      console.log(`  • ${label} already exists, skipping`);
      return null;
    }
    throw err;
  }
}
