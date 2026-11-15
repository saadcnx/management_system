"use client"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const PALETTES = [
  { id: "navy", label: "Navy", colors: ["#071739", "#4B6382", "#A68868"] },
  { id: "cream", label: "Cream", colors: ["#1E4035", "#C8412B", "#F4EDDC"] },
]

export function PaletteSwitcher() {
  const [palette, setPalette] = useState("navy")

  useEffect(() => {
    const p = localStorage.getItem("palette") || "navy"
    setPalette(p)
  }, [])

  const set = (p: string) => {
    setPalette(p)
    localStorage.setItem("palette", p)
    document.documentElement.setAttribute("data-palette", p)
  }

  return (
    <div className="p-2">
      <p className="text-[11px] font-medium text-muted-foreground mb-2 px-1">Palette</p>
      <div className="space-y-1">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            onClick={() => set(p.id)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors",
              palette === p.id && "bg-muted"
            )}
          >
            <div className="flex gap-0.5">
              {p.colors.map((c) => (
                <span key={c} className="w-3 h-3 rounded-full border" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span>{p.label}</span>
            {palette === p.id && <span className="ml-auto text-[10px] text-muted-foreground">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}