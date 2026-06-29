import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-(--color-canvas) px-4 text-center">
      <ShieldAlert className="text-(--color-amber)" size={36} />
      <p className="mt-2 font-(family-name:--font-display) text-2xl font-semibold text-(--color-ink)">
        You don't have access to this page
      </p>
      <p className="max-w-sm text-sm text-(--color-muted)">
        Your role doesn't include this section. If you think that's wrong, ask an administrator to check your
        permissions.
      </p>
      <Link to="/" className="mt-3 text-sm font-medium text-(--color-accent-strong) hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
