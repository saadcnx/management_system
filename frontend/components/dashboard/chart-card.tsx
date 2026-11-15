export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl p-4 h-full">
      <h3 className="text-base font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}