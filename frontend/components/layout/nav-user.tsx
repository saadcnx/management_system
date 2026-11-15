"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, ChevronDown } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { UserAvatar } from "@/components/ui/user-avatar"
import { PaletteSwitcher } from "./palette-switcher"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  LAB_ADMIN: "Lab Admin",
  DOCTOR: "Doctor",
  RECEPTIONIST: "Receptionist",
}

export function NavUser({ user, collapsed }: { user: any; collapsed: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const logout = async () => {
    await api.post("/api/auth/logout", {})
    queryClient.clear()
    router.push("/login")
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent transition-colors text-left",
          collapsed && "justify-center"
        )}
      >
        <UserAvatar name={user.name} size={28} />
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-[11px] text-sidebar-foreground/70 truncate">
                {ROLE_LABELS[user.role] || user.role}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover text-popover-foreground border rounded-md shadow-md overflow-hidden z-50 min-w-[200px]">
          <PaletteSwitcher />
          <div className="border-t">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}