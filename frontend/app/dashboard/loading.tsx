import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
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