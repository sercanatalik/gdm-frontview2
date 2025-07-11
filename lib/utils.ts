import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBasePath(): string {
  return process.env.NODE_ENV === 'production' ? '/gdm-frontview' : '/gdm-frontview'
}

export function apiPath(path: string): string {
  return `${getBasePath()}${path}`
}

export function assetPath(path: string): string {
  return `${getBasePath()}${path}`
}
