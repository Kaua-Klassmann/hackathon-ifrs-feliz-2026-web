import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(value: string) {
  const source = value.includes("@") ? value.slice(0, value.indexOf("@")) : value

  const parts = source
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}
