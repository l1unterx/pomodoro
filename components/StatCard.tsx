export default function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-2 shadow-lg shadow-black/20 backdrop-blur-xl sm:rounded-3xl sm:p-4">
      <span className="truncate text-base font-bold sm:text-2xl">{value}</span>
      <span className="text-[9px] uppercase tracking-wide text-muted sm:text-xs">{label}</span>
    </div>
  );
}
