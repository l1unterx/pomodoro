export default function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border border-foreground p-4">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}
