import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-(--color-canvas)">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {actions && <div className="mb-5 flex flex-wrap items-center justify-end gap-2">{actions}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
