import { NavLink } from "react-router-dom";
import { Building2, CalendarDays, LayoutDashboard, UserCircle, Users, X } from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { ROLE_LABELS } from "../../lib/constants";
import type { Role } from "../../types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "hr", "employee"] },
  { to: "/employees", label: "Employees", icon: Users, roles: ["admin", "hr"] },
  { to: "/departments", label: "Departments", icon: Building2, roles: ["admin"] },
  { to: "/leave", label: "Leave", icon: CalendarDays, roles: ["admin", "hr", "employee"] },
  { to: "/profile", label: "My profile", icon: UserCircle, roles: ["admin", "hr", "employee"] },
];

export function Sidebar() {
  const role = useAuthStore((s) => s.user?.employee?.role);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const closeSidebar = useUiStore((s) => s.closeSidebar);

  const items = NAV_ITEMS.filter((item) => !role || item.roles.includes(role));

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={closeSidebar} aria-hidden="true" />
      )}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-(--color-ink) text-white transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-accent) font-(family-name:--font-display) text-sm font-semibold">
              E
            </span>
            <div>
              <p className="font-(family-name:--font-display) text-[15px] font-semibold leading-none">EWOMP</p>
              <p className="text-[11px] leading-none text-white/50 mt-0.5">Workforce platform</p>
            </div>
          </div>
          <button className="text-white/60 hover:text-white lg:hidden" onClick={closeSidebar} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              end={to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-(--color-ink-line) px-5 py-4">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Signed in as</p>
          <p className="mt-1 text-sm font-medium text-white/85">{role ? ROLE_LABELS[role] : "—"}</p>
        </div>
      </aside>
    </>
  );
}
