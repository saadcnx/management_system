"use client"
import { Button } from "@/components/ui/button"

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="bg-destructive/10 border border-destructive/30 text-foreground p-6 rounded-xl max-w-md w-full space-y-3">
        <h2 className="text-base font-semibold text-destructive">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <Button onClick={reset} size="sm">Retry</Button>
      </div>
    </div>
  )
}