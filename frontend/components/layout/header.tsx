"use client"
import { Menu, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { ThemeToggle } from "./theme-toggle"
import { Breadcrumbs } from "./breadcrumbs"

export function Header() {
  const { toggle, setMobileOpen } = useSidebar()
  return (
    <header className="h-14 border-b sticky top-0 bg-background/80 backdrop-blur z-30 flex items-center px-4 gap-3">
      <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={toggle} aria-label="Toggle sidebar">
        <PanelLeft className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu className="h-4 w-4" />
      </Button>
      <Breadcrumbs />
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  )
}