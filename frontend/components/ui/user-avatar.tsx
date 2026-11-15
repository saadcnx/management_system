import { cn } from "@/lib/utils"

const AVATAR_TINTS = [
  "bg-chart-1/15 text-chart-1",
  "bg-chart-2/15 text-chart-2",
  "bg-chart-3/15 text-chart-3",
  "bg-success/15 text-success",
  "bg-brand/15 text-brand",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function UserAvatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const tint = AVATAR_TINTS[hashName(name) % AVATAR_TINTS.length];
  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-medium shrink-0", tint, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {getInitials(name)}
    </div>
  );
}