# EWOMP — Enterprise Workforce & Organization Management Platform

A role-based employee management system built with **React + TypeScript + Vite**,
**Zustand** for state, **Appwrite** as the backend, **AG Grid** for data tables,
**React Hook Form + Yup** for forms, and **TanStack Query** for server-state.

Three logins, three different access levels:

| Role | Employees | Departments | Leave | Own profile |
|---|---|---|---|---|
| **Admin** | Full CRUD, any department | Full CRUD | Approve/reject anyone's | View + edit contact info |
| **HR** | Add/edit/remove *employees* — only within the department(s) they're assigned to manage | Read-only | Approve/reject within their department(s) | View + edit contact info |
| **Employee** | Read-only (their own record only) | Read-only (own department) | Apply, view own history, cancel pending | View + edit contact info |

---

## 1. How the security model works

This is the part that matters most, so it's worth being explicit about it.

Appwrite enforces access **at the database level**, not just by hiding buttons in the
UI. The trick used here:

- A single Appwrite **Team** called `admins` is granted blanket read/write on every
  table. Anyone in that team is an Admin, everywhere, automatically.
- Every `departments` row has an `hrUserIds` field — the Appwrite user IDs of the HR
  staff who manage that department.
- Every `employees` row (and `leaveRequests` row) gets **row-level permissions** set
  at creation time: the employee themself (read + update their own row) and the
  `hrUserIds` of their department (read + update + delete). Nobody else can even
  fetch that row — it's not a client-side filter, the Appwrite API simply won't
  return rows you don't have permission for.
- Whenever a department's `hrUserIds` list changes, the app re-applies permissions to
  every employee/leave row in that department (`recomputeDepartmentPermissions` in
  `src/hooks/useDepartments.ts`), so HR coverage changes take effect immediately.

Because of this, pages like the Employees grid don't need to manually filter "show
only employees from my department" — calling `listRows` already only returns what
the signed-in user is allowed to see.

**Known limitation:** Appwrite permissions are per-*row*, not per-*field*. An
employee who has update access to their own row could, in principle, call the API
directly to change a field the UI never exposes to them (like their own salary). The
UI never offers that control, but a production system would add an **Appwrite
Function** to validate field-level writes server-side before this should be trusted
with real payroll data. The same applies to HR and the `role`/`salary` fields on the
employees they manage.

---

## 2. Project structure

```
src/
  lib/            Appwrite client, constants, permission helpers, audit logging
  store/          Zustand stores (auth session, UI state)
  hooks/          TanStack Query hooks — all reads/writes to Appwrite go through these
  types/          Shared TypeScript types (Employee, Department, LeaveRequest…)
  components/
    layout/       Sidebar, Topbar, route guards
    ui/           Buttons, cards, modals, form fields — small design system
    employees/    AG Grid + form for employee CRUD
    departments/  Department cards + form
    leave/        Leave balance, request form, approvals table
    dashboard/    Per-role dashboard widgets
  pages/          One file per route
scripts/          One-time Appwrite project setup (see below)
```

---

## 3. Setting up Appwrite

You need an Appwrite Cloud project (or self-hosted instance) — [appwrite.io](https://appwrite.io).

1. **Create a project** in the Appwrite console and note its Project ID and region
   endpoint (e.g. `https://fra.cloud.appwrite.io/v1`).
2. **Create a server API key**: Project Settings → API Keys → add a key with
   these scopes:

   ```text
   users.read
   users.write
   databases.read
   databases.write
   teams.read
   teams.write
   ```

   This key is used by local setup scripts and by the `create-employee` Appwrite
   Function. It must never be put in an `.env` variable prefixed `VITE_`, since
   anything `VITE_`-prefixed gets bundled into the browser app.
3. **Add a Web platform** in the Appwrite console (Project Settings → Platforms) and
   register `http://localhost:5173` (and your real domain once deployed) as an
   allowed hostname, or Appwrite will reject requests from your app's origin.
4. Copy `.env.example` to `.env` and fill in:

   ```
   VITE_APPWRITE_ENDPOINT=https://<region>.cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=<your project id>
   VITE_APPWRITE_DATABASE_ID=ewomp_db
   APPWRITE_API_KEY=<the server key from step 2>
   ```

5. **Create the schema** (idempotent — safe to re-run):

   ```bash
   npm install
   npm run appwrite:setup
   ```

   This creates the `ewomp_db` database, the `admins`, `hr`, and `employees` Teams,
   and the four tables
   (`departments`, `employees`, `leaveRequests`, `auditLogs`) with all columns,
   indexes, and table-level permissions.

6. **Create the employee-creation Function** in the Appwrite console:

   - Go to **Functions** -> **Create Function**.
   - Name it `create-employee`.
   - Set the Function ID to `create-employee`.
   - Choose the latest Node.js runtime available, preferably Node.js 22.
   - Set **Execute access** to the `admins` and `hr` teams.
   - Add these environment variables:

   ```text
   APPWRITE_ENDPOINT=https://<region>.cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=<your project id>
   APPWRITE_API_KEY=<the server key from step 2>
   APPWRITE_DATABASE_ID=ewomp_db
   ADMIN_TEAM_ID=admins
   HR_TEAM_ID=hr
   EMPLOYEE_TEAM_ID=employees
   ```

   Then deploy the code in `functions/create-employee` with:

   - Root directory: `functions/create-employee`
   - Entrypoint: `src/main.js`
   - Install command: `npm install`

   This Function creates the Appwrite Auth user, adds them to the right team, creates
   the `employees` row, and returns that row to the app.

7. **Create your first Administrator** (there's no public sign-up by design — every
   other account is created from inside the app by an Admin):

   ```bash
   npm run appwrite:bootstrap-admin -- --name "Jane Doe" --email jane@company.com --password "Temp1234!"
   ```

8. **Run the app**:

   ```bash
   npm run dev
   ```

   Sign in with the email/password from step 7. From there, use **Departments** to
   create your org structure (assigning HR coverage per department), then
   **Employees** to add HR and Employee accounts.

### Other utility scripts

| Script | What it does |
|---|---|
| `npm run appwrite:promote-admin -- --email x@y.com [--setRole]` | Adds an *existing* user to the `admins` team (and optionally flips their `employees.role` to `admin`) — for promoting someone without recreating their account. |
| `npm run appwrite:delete-user -- --email x@y.com` | Permanently deletes an Appwrite Auth login. The in-app "Remove employee" action only deletes the `employees` row (instant access revocation); the underlying login is left registered but unable to reach any data unless you also run this. |

---

## 4. Local development

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check + production build
npm run lint        # oxlint
```

---

## 5. Design notes

The UI leans into the "personnel ledger" idea rather than a generic SaaS dashboard:
a deep ink-navy sidebar, a warm ledger-green accent, monospaced employee codes, and
a colored "ledger tab" on department cards and grid rows so each department reads as
a distinct, consistent color throughout the app.

## 6. Things intentionally left out of v1

- **Field-level write enforcement** (see the security section above) — would need an
  Appwrite Function.
- **File storage / document attachments**, **search across all entities**, and
  **real-time updates** from the original spec are not wired up yet; the data layer
  (TanStack Query + Appwrite) is structured so they can be added without restructuring
  existing code — Appwrite's Realtime channels and Storage buckets are first-class
  and slot in alongside the existing `tablesDB` calls.
- **Payslip history / payroll runs** — only a single current `salary` figure per
  employee is tracked, not a payroll ledger over time.
# EWOMP
