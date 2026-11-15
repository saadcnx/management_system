"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DashboardBarChart } from "@/components/dashboard/bar-chart";
import { HorizontalBars } from "@/components/dashboard/horizontal-bars";
import { RecentPatients } from "@/components/dashboard/recent-patients";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardResponse {
  stats: { label: string; value: number }[];
  barChart: { title: string; data: { label: string; value: number }[] };
  breakdown: { title: string; data: { label: string; value: number }[] } | null;
  recentPatients: any[] | null;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get("/api/dashboard/stats"),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1280px] mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-[340px] rounded-xl" />
          <Skeleton className="h-[340px] rounded-xl" />
        </div>
      </div>
    );
  }

  const payload = data?.data as DashboardResponse | undefined;
  if (!payload) return null;

  return (
    <div className="p-6 space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">An overview of your lab activity.</p>
      </div>

      <div className={`grid grid-cols-1 ${payload.stats.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4`}>
        {payload.stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title={payload.barChart.title}>
            {payload.barChart.data.every((d) => d.value === 0) ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No data yet</p>
            ) : (
              <DashboardBarChart data={payload.barChart.data} />
            )}
          </ChartCard>
        </div>
        {payload.breakdown && (
          <ChartCard title={payload.breakdown.title}>
            <HorizontalBars data={payload.breakdown.data} />
          </ChartCard>
        )}
      </div>

      {payload.recentPatients && <RecentPatients patients={payload.recentPatients} />}
    </div>
  );
}