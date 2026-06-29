export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-(--color-muted)">
      <span className="h-7 w-7 rounded-full border-2 border-(--color-border) border-t-(--color-accent) animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
