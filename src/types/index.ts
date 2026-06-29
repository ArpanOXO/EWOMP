// Domain types for EWOMP (Enterprise Workforce & Organization Management Platform)

export type Role = "admin" | "hr" | "employee";

export type EmploymentStatus = "active" | "on_leave" | "inactive" | "terminated";

export type LeaveType = "annual" | "sick" | "casual" | "unpaid";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

/** Row shape in the `departments` table */
export interface Department {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  code: string;
  description?: string;
  /** Appwrite Auth user IDs of the HR staff allowed to manage this department's employees */
  hrUserIds: string[];
  /** employees.$id of the person who manages this department, optional */
  managerEmployeeId?: string;
  color: string;
}

export type DepartmentInput = Omit<Department, "$id" | "$createdAt" | "$updatedAt">;

/** Row shape in the `employees` table. One row per Appwrite Auth user (admin, hr, or employee). */
export interface Employee {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  role: Role;
  departmentId: string;
  designation: string;
  dateOfJoining: string;
  employmentStatus: EmploymentStatus;
  salary: number;
  managerId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  leaveAnnualTotal: number;
  leaveAnnualUsed: number;
  leaveSickTotal: number;
  leaveSickUsed: number;
  leaveCasualTotal: number;
  leaveCasualUsed: number;
}

export type EmployeeInput = Omit<
  Employee,
  "$id" | "$createdAt" | "$updatedAt" | "userId" | "employeeCode"
>;

/** Row shape in the `leaveRequests` table */
export interface LeaveRequest {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  employeeId: string;
  employeeUserId: string;
  employeeName: string;
  departmentId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewerName?: string;
  reviewNote?: string;
}

export type LeaveRequestInput = Omit<
  LeaveRequest,
  "$id" | "$createdAt" | "$updatedAt" | "status" | "reviewedBy" | "reviewerName" | "reviewNote"
>;

/** Row shape in the `auditLogs` table */
export interface AuditLog {
  $id: string;
  $createdAt: string;
  action: string;
  performedByUserId: string;
  performedByName: string;
  targetType: "employee" | "department" | "leaveRequest" | "auth";
  targetId: string;
  details: string;
}

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  employee: Employee | null;
}
