import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  return value.replace('T', ' ').slice(0, 16)
}

export function formatRelative(value?: string | null): string {
  if (!value) return '—'
  const t = new Date(value.replace(' ', 'T')).getTime()
  if (Number.isNaN(t)) return formatDateTime(value)
  const diff = Date.now() - t
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return min + ' 分钟前'
  const hour = Math.floor(min / 60)
  if (hour < 24) return hour + ' 小时前'
  const day = Math.floor(hour / 24)
  if (day < 7) return day + ' 天前'
  return value.slice(0, 10)
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

export function initialsOf(name: string): string {
  if (!name) return '?'
  const trimmed = name.trim()
  return trimmed.slice(0, trimmed.length > 2 ? 1 : 2)
}

export function debounce<T extends (...args: never[]) => void>(fn: T, wait = 250) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const wrapped = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
  wrapped.cancel = () => { if (timer) clearTimeout(timer) }
  return wrapped
}
