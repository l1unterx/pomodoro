export default function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4 shadow-lg shadow-black/20">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}
