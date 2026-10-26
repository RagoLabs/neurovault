import { format, formatDistanceStrict, isValid, parseISO } from 'date-fns'
import { demoToday } from '@/config/demo'

export function parseDate(iso: string | undefined | null): Date | null {
  if (!iso) return null
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : parseISO(iso)
  return isValid(d) ? d : null
}

export function fmtDate(iso: string | undefined | null, pattern = 'dd MMM yyyy'): string {
  const d = parseDate(iso)
  return d ? format(d, pattern) : '—'
}

export function fmtDateTime(iso: string | undefined | null): string {
  const d = parseDate(iso)
  return d ? format(d, 'dd MMM yyyy, HH:mm') : '—'
}

export function fmtRelative(iso: string | undefined | null): string {
  const d = parseDate(iso)
  if (!d) return '—'
  const today = demoToday()
  const dist = formatDistanceStrict(d, today, { addSuffix: true })
  return dist
}

export function fmtTime(t: string | undefined): string {
  return t ?? '—'
}

export function titleCase(s: string): string {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

export function fullName(p: { firstName: string; lastName: string } | undefined) {
  return p ? `${p.firstName} ${p.lastName}` : 'Unknown patient'
}

export function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function pluralize(n: number, word: string, plural = `${word}s`) {
  return `${n} ${n === 1 ? word : plural}`
}

export function truncate(s: string, n = 80) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}
