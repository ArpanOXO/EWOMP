import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-(--color-border) bg-(--color-surface)/95 px-4 py-3.5 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-(--color-muted) hover:bg-(--color-border-soft) lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="font-(family-name:--font-display) text-lg font-semibold text-(--color-text) sm:text-xl">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-(--color-muted)">{subtitle}</p>}
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 hover:bg-(--color-border-soft)"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-accent-soft) text-xs font-semibold text-(--color-accent-strong)">
            {initials}
          </span>
          <span className="hidden text-sm font-medium text-(--color-text) sm:inline">{user?.name}</span>
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-(--color-border) bg-white py-1 shadow-lg">
              <div className="px-3 py-2 border-b border-(--color-border-soft)">
                <p className="truncate text-sm font-medium text-(--color-text)">{user?.name}</p>
                <p className="truncate text-xs text-(--color-muted)">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--color-danger) hover:bg-(--color-danger-soft)"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
