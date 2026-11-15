export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-[28px] font-semibold tabular-nums mt-2 leading-none">{value}</p>
    </div>
  );
}