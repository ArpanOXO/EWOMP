import { Account, Client, Functions, TablesDB, Teams } from "appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "./constants";

export const client = new Client();

if (APPWRITE_ENDPOINT && APPWRITE_PROJECT_ID) {
  client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
}

export const account = new Account(client);
export const functions = new Functions(client);
export const tablesDB = new TablesDB(client);
export const teams = new Teams(client);

/** True once VITE_APPWRITE_* env vars have been filled in. Used to show a setup banner instead of crashing. */
export const isAppwriteConfigured = Boolean(APPWRITE_ENDPOINT && APPWRITE_PROJECT_ID);
