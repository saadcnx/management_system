const CHART_BG = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

export function HorizontalBars({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>;
  }
  return (
    <div className="space-y-4">
      {data.map((d, i) => {
        const pct = (d.value / total) * 100;
        return (
          <div key={d.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{d.label}</span>
              <span className="font-medium tabular-nums">{d.value}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${CHART_BG[i % CHART_BG.length]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}