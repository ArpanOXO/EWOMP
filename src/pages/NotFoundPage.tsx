import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-(--color-canvas) px-4 text-center">
      <p className="font-(family-name:--font-display) text-5xl font-semibold text-(--color-ink)">404</p>
      <p className="text-(--color-muted)">This page doesn't exist in EWOMP.</p>
      <Link to="/" className="mt-3 text-sm font-medium text-(--color-accent-strong) hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
