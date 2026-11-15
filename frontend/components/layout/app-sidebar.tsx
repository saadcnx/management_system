"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FlaskConical, UserCog, Users, X, TestTube, ClipboardList } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"
import { NavUser } from "./nav-user"

const NAV: Record<string, { label: string; href: string; icon: any }[]> = {
  SUPER_ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Labs", href: "/dashboard/labs", icon: FlaskConical },
  ],
  LAB_ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Staff", href: "/dashboard/staff", icon: UserCog },
    { label: "Patients", href: "/dashboard/patients", icon: Users },
    { label: "Tests", href: "/dashboard/tests", icon: TestTube },
    { label: "Orders", href: "/dashboard/orders", icon: ClipboardList },
  ],
  DOCTOR: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Patients", href: "/dashboard/patients", icon: Users },
    { label: "Orders", href: "/dashboard/orders", icon: ClipboardList },
  ],
  RECEPTIONIST: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Patients", href: "/dashboard/patients", icon: Users },
    { label: "Orders", href: "/dashboard/orders", icon: ClipboardList },
  ],
}

function Logo({ showLabel = true }: { showLabel?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-md bg-brand flex items-center justify-center text-white font-semibold text-xs shrink-0">
        LM
      </div>
      {showLabel && <span className="font-semibold text-sm">LMS</span>}
    </div>
  )
}

function NavList({
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  items: { label: string; href: string; icon: any }[]
  pathname: string
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              isActive ? "bg-sidebar-accent text-sidebar-foreground" : "hover:bg-sidebar-accent/50",
              collapsed && "justify-center px-0"
            )}
          >
            {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-brand" />}
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const user = useUser()
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar()

  const items = user ? NAV[user.role] || [] : []

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-screen sticky top-0 transition-[width] duration-150 ease-out shrink-0",
          collapsed ? "w-14" : "w-64"
        )}
      >
        <div
          className={cn(
            "h-14 flex items-center border-b border-sidebar-border px-3 shrink-0",
            collapsed ? "justify-center" : "px-4"
          )}
        >
          <Logo showLabel={!collapsed} />
        </div>
        {user && <NavList items={items} pathname={pathname} collapsed={collapsed} />}
        {user && (
          <div className="border-t border-sidebar-border p-2">
            <NavUser user={user} collapsed={collapsed} />
          </div>
        )}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded hover:bg-sidebar-accent"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {user && (
              <NavList
                items={items}
                pathname={pathname}
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
              />
            )}
            {user && (
              <div className="border-t border-sidebar-border p-2">
                <NavUser user={user} collapsed={false} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}