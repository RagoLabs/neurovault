import type { FollowUp, GCSComponents, MotorPower, SurgicalCase, Patient, ClinicalOutcome } from '@/types'
import { differenceInYears } from 'date-fns'
import { demoToday } from '@/config/demo'

/**
 * Glasgow Coma Scale. Returns the numeric total only when all three
 * components are testable; otherwise returns a labelled partial score so a
 * non-testable component is never silently scored as 1.
 */
export function computeGcs(g: GCSComponents | undefined): { total: number | null; label: string; complete: boolean } {
  if (!g) return { total: null, label: 'Not recorded', complete: false }
  const parts = [
    ['E', g.eye, 4],
    ['V', g.verbal, 5],
    ['M', g.motor, 6],
  ] as const
  for (const [, v, max] of parts) {
    if (v !== null && (v < 1 || v > max || !Number.isInteger(v))) return { total: null, label: 'Invalid component', complete: false }
  }
  const complete = parts.every(([, v]) => v !== null)
  const testable = parts.filter(([, v]) => v !== null)
  const sum = testable.reduce((s, [, v]) => s + (v as number), 0)
  const comps = parts.map(([k, v]) => `${k}${v === null ? 'NT' : v}`).join(' ')
  if (complete) return { total: sum, label: `${sum} (${comps})`, complete: true }
  return { total: null, label: `${sum}T (${comps})`, complete: false }
}

export function gcsSeverity(total: number | null): 'severe' | 'moderate' | 'mild' | 'unknown' {
  if (total === null) return 'unknown'
  if (total <= 8) return 'severe'
  if (total <= 12) return 'moderate'
  return 'mild'
}

export function patientAge(p: Pick<Patient, 'dateOfBirth'>, at: Date = demoToday()): number {
  return differenceInYears(at, new Date(`${p.dateOfBirth}T00:00:00`))
}

export function motorTotal(m: MotorPower): { sum: number; max: number; tested: number } {
  const vals = [m.rightUpper, m.leftUpper, m.rightLower, m.leftLower]
  const tested = vals.filter((v): v is number => v !== null)
  return { sum: tested.reduce((a, b) => a + b, 0), max: tested.length * 5, tested: tested.length }
}

export function motorDelta(a: MotorPower, b: MotorPower): number | null {
  const keys: (keyof MotorPower)[] = ['rightUpper', 'leftUpper', 'rightLower', 'leftLower']
  let d = 0
  let any = false
  for (const k of keys) {
    if (a[k] === null || b[k] === null) continue
    d += (b[k] as number) - (a[k] as number)
    any = true
  }
  return any ? d : null
}

export type DerivedFollowUpStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled' | 'overdue' | 'today'

export function deriveFollowUpStatus(f: FollowUp, today: Date = demoToday()): DerivedFollowUpStatus {
  const todayIso = toIso(today)
  if (f.status === 'scheduled') {
    if (f.date < todayIso) return 'overdue'
    if (f.date === todayIso) return 'today'
  }
  return f.status
}

export function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type CaseFollowUpStatus = 'up-to-date' | 'due' | 'overdue' | 'missed' | 'none' | 'completed'

export function caseFollowUpStatus(c: SurgicalCase, followUps: FollowUp[], today: Date = demoToday()): CaseFollowUpStatus {
  const own = followUps.filter((f) => f.caseId === c.id)
  if (c.status !== 'completed') return 'none'
  if (!own.length) return 'none'
  const derived = own.map((f) => deriveFollowUpStatus(f, today))
  if (derived.includes('overdue')) return 'overdue'
  if (derived.includes('missed') && !derived.includes('scheduled') && !derived.includes('today')) return 'missed'
  if (derived.includes('scheduled') || derived.includes('today')) return 'due'
  if (derived.every((d) => d === 'completed' || d === 'cancelled')) return 'completed'
  return 'up-to-date'
}

export const outcomeLabel: Record<ClinicalOutcome, string> = {
  improved: 'Improved',
  stable: 'Stable',
  deteriorated: 'Deteriorated',
  deceased: 'Deceased',
  unknown: 'Unknown / not recorded',
}

/** Oswestry Disability Index: 10 sections scored 0–5. Returns percentage. */
export function computeOdi(sectionScores: (number | null)[]): number | null {
  const answered = sectionScores.filter((s): s is number => s !== null)
  if (answered.length === 0) return null
  const total = answered.reduce((a, b) => a + b, 0)
  return Math.round((total / (answered.length * 5)) * 100)
}

export function odiCategory(odi: number | null): string {
  if (odi === null) return 'Not recorded'
  if (odi <= 20) return 'Minimal disability'
  if (odi <= 40) return 'Moderate disability'
  if (odi <= 60) return 'Severe disability'
  if (odi <= 80) return 'Crippled'
  return 'Bed-bound / exaggerating'
}
