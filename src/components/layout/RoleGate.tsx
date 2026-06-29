import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import type { Role } from "../../types";

export function RoleGate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const role = useAuthStore((s) => s.user?.employee?.role);
  if (!role || !allow.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
