"use client"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <div className="contents print:hidden"><AppSidebar /></div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="contents print:hidden"><Header /></div>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}