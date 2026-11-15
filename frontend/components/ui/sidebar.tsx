"use client"
import { createContext, useContext, useEffect, useState } from "react"

type SidebarContextType = {
  collapsed: boolean
  toggle: () => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider")
  return ctx
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const saved = document.cookie.split('; ').find(r => r.startsWith('sidebar-collapsed='))
    if (saved) setCollapsed(saved.split('=')[1] === '1')
  }, [])

  const updateCollapsed = (v: boolean) => {
    setCollapsed(v)
    document.cookie = `sidebar-collapsed=${v ? '1' : '0'}; path=/; max-age=${60 * 60 * 24 * 365}`
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setCollapsed(prev => {
          const next = !prev
          document.cookie = `sidebar-collapsed=${next ? '1' : '0'}; path=/; max-age=${60 * 60 * 24 * 365}`
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => updateCollapsed(!collapsed), mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}