import type { DemoDataset, SurgicalCase, ProcedureCategory } from '@/types'
import { demoToday } from '@/config/demo'
import { deriveFollowUpStatus, toIso } from '@/utils/clinical'
import { addMonths, eachDayOfInterval, eachMonthOfInterval, format, startOfMonth, subDays, subMonths } from 'date-fns'

export interface DashboardStats {
  totalPatients: number
  activePatients: number
  totalProcedures: number
  brainSurgeries: number
  spinalSurgeries: number
  neurovascular: number
  other: number
  proceduresThisMonth: number
  proceduresLastMonth: number
  activePostop: number
  upcomingFollowUps: number
  overdueFollowUps: number
  todayFollowUps: number
  scheduledCases: number
  draftReports: number
  newPatientsThisMonth: number
}

export const completedCases = (cases: SurgicalCase[]) => cases.filter((c) => c.status === 'completed')

export function getDashboardStats(d: DemoDataset, today: Date = demoToday()): DashboardStats {
  const todayIso = toIso(today)
  const monthStart = toIso(startOfMonth(today))
  const lastMonthStart = toIso(startOfMonth(subMonths(today, 1)))
  const completed = completedCases(d.cases)
  const byCat = (cat: ProcedureCategory) => completed.filter((c) => c.procedureCategory === cat).length
  const dischargedCaseIds = new Set(d.postopNotes.filter((n) => n.dischargeStatus !== 'inpatient').map((n) => n.caseId))
  const activePostop = completed.filter((c) => c.surgeryDate! >= toIso(subDays(today, 42)) && !dischargedCaseIds.has(c.id) || (c.surgeryDate! >= toIso(subDays(today, 14)))).length
  const derived = d.followUps.map((f) => deriveFollowUpStatus(f, today))
  return {
    totalPatients: d.patients.length,
    activePatients: d.patients.filter((p) => p.status === 'active').length,
    totalProcedures: completed.length,
    brainSurgeries: byCat('brain'),
    spinalSurgeries: byCat('spine'),
    neurovascular: byCat('neurovascular'),
    other: byCat('other'),
    proceduresThisMonth: completed.filter((c) => c.surgeryDate! >= monthStart && c.surgeryDate! <= todayIso).length,
    proceduresLastMonth: completed.filter((c) => c.surgeryDate! >= lastMonthStart && c.surgeryDate! < monthStart).length,
    activePostop,
    upcomingFollowUps: derived.filter((s) => s === 'scheduled' || s === 'today').length,
    overdueFollowUps: derived.filter((s) => s === 'overdue').length,
    todayFollowUps: derived.filter((s) => s === 'today').length,
    scheduledCases: d.cases.filter((c) => c.status === 'scheduled').length,
    draftReports: d.operativeReports.filter((r) => r.status === 'draft').length,
    newPatientsThisMonth: d.patients.filter((p) => p.registeredAt >= monthStart).length,
  }
}

export type ActivityRange = '7d' | '30d' | '6m' | '12m'

export interface ActivityPoint {
  label: string
  key: string
  brain: number
  spine: number
  total: number
}

/** Surgeries over time, split brain vs spine, derived from completed cases. */
export function getSurgicalActivity(cases: SurgicalCase[], range: ActivityRange, today: Date = demoToday()): ActivityPoint[] {
  const completed = completedCases(cases)
  const isSpine = (c: SurgicalCase) => c.type === 'spine'
  if (range === '7d' || range === '30d') {
    const days = range === '7d' ? 7 : 30
    const interval = eachDayOfInterval({ start: subDays(today, days - 1), end: today })
    return interval.map((day) => {
      const key = toIso(day)
      const inDay = completed.filter((c) => c.surgeryDate === key)
      return { key, label: format(day, days === 7 ? 'EEE d' : 'd MMM'), brain: inDay.filter((c) => !isSpine(c)).length, spine: inDay.filter(isSpine).length, total: inDay.length }
    })
  }
  const months = range === '6m' ? 6 : 12
  const interval = eachMonthOfInterval({ start: startOfMonth(subMonths(today, months - 1)), end: startOfMonth(today) })
  return interval.map((m) => {
    const key = format(m, 'yyyy-MM')
    const next = format(addMonths(m, 1), 'yyyy-MM')
    const inMonth = completed.filter((c) => c.surgeryDate!.slice(0, 7) >= key && c.surgeryDate!.slice(0, 7) < next)
    return { key, label: format(m, 'MMM yy'), brain: inMonth.filter((c) => !isSpine(c)).length, spine: inMonth.filter(isSpine).length, total: inMonth.length }
  })
}

export function getProcedureDistribution(cases: SurgicalCase[]) {
  const completed = completedCases(cases)
  const count = (cat: ProcedureCategory) => completed.filter((c) => c.procedureCategory === cat).length
  return [
    { key: 'brain', name: 'Brain surgeries', value: count('brain'), color: 'var(--chart-brain)' },
    { key: 'spine', name: 'Spinal surgeries', value: count('spine'), color: 'var(--chart-spine)' },
    { key: 'neurovascular', name: 'Neurovascular', value: count('neurovascular'), color: 'var(--chart-vascular)' },
    { key: 'other', name: 'Other neurosurgical', value: count('other'), color: 'var(--chart-other)' },
  ]
}
