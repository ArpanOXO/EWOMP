// import { Permission, Role } from "appwrite";
// import { ADMIN_TEAM_ID } from "./constants";

// /**
//  * Row-level security model
//  * ─────────────────────────
//  * Table-level (collection) default permissions already grant the `admins` Appwrite
//  * Team full CRUD on every table — that covers Admins everywhere and never needs to be
//  * recomputed. On top of that, individual rows get extra grants for the specific people
//  * who should reach them even though they are not Admins:
//  *
//  *  - an employee can always read + update their OWN row
//  *  - the HR user(s) assigned to a department (department.hrUserIds) can read + update +
//  *    delete any employee row / leave request that belongs to that department
//  *
//  * Whenever a department's hrUserIds list changes, call recomputeDepartmentPermissions()
//  * (see hooks/useDepartments.ts) so every employee/leave row in that department picks up
//  * the new HR roster.
//  *
//  * Known limitation: Appwrite permissions are per-row, not per-field, so an employee who
//  * has "update" on their own row could in principle call the API directly to change a
//  * field the UI hides from them (like salary). The UI never exposes that control, and a
//  * production system would add an Appwrite Function to validate field-level writes
//  * server-side — documented in README.md under "Security model & its limits".
//  */

// export function employeePermissions(selfUserId: string, hrUserIds: string[]): string[] {
//   const perms = [Permission.read(Role.user(selfUserId)), Permission.update(Role.user(selfUserId))];
//   for (const hrId of hrUserIds) {
//     perms.push(
//       Permission.read(Role.user(hrId)),
//       Permission.update(Role.user(hrId)),
//       Permission.delete(Role.user(hrId))
//     );
//   }
//   return perms;
// }

// export function leaveRequestPermissions(selfUserId: string, hrUserIds: string[]): string[] {
//   const perms = [Permission.read(Role.user(selfUserId)), Permission.update(Role.user(selfUserId))];
//   for (const hrId of hrUserIds) {
//     perms.push(Permission.read(Role.user(hrId)), Permission.update(Role.user(hrId)));
//   }
//   return perms;
// }

// export function departmentTablePermissions(): string[] {
//   return [
//     // Every signed-in person can read department names (an employee needs to see
//     // their own department; HR needs to see the full list to know what they manage).
//     Permission.read(Role.users()),
//     Permission.create(Role.team(ADMIN_TEAM_ID)),
//     Permission.update(Role.team(ADMIN_TEAM_ID)),
//     Permission.delete(Role.team(ADMIN_TEAM_ID)),
//   ];
// }

import { Permission, Role } from "appwrite";
import { ADMIN_TEAM_ID } from "./constants";

/**
 * Row-level security model
 * ─────────────────────────
 * Table-level permissions control who can CREATE rows.
 * Row-level permissions control who can READ/UPDATE/DELETE existing rows.
 */

export function employeePermissions(
  selfUserId: string,
  hrUserIds: string[]
): string[] {
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

export function leaveRequestPermissions(
  selfUserId: string,
  hrUserIds: string[]
): string[] {
  const perms = [
    Permission.read(Role.user(selfUserId)),
    Permission.update(Role.user(selfUserId)),
  ];

  for (const hrId of hrUserIds) {
    perms.push(
      Permission.read(Role.user(hrId)),
      Permission.update(Role.user(hrId))
    );
  }

  return perms;
}

export function departmentTablePermissions(): string[] {
  return [
    // Everyone can read departments
    Permission.read(Role.users()),

    // Admins can update/delete department rows
    Permission.write(Role.team(ADMIN_TEAM_ID)),
  ];
}