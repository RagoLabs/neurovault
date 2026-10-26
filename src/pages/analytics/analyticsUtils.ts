import type { DemoDataset, SurgicalCase } from '@/types'
import { deriveFollowUpStatus } from '@/utils/clinical'

export interface AnalyticsFilters {
  from: string
  to: string
  hospitalId: string
  caseType: string
  procedure: string
  diagnosis: string
  outcome: string
}

export const defaultFilters = (): AnalyticsFilters => ({ from: '2025-11-01', to: '2026-10-26', hospitalId: 'all', caseType: 'all', procedure: '', diagnosis: '', outcome: 'all' })

export function filterCases(cases: SurgicalCase[], f: AnalyticsFilters) {
  return cases.filter((c) => {
    const date = c.surgeryDate ?? c.plannedDate ?? c.createdAt
    if (date < f.from || date > f.to) return false
    if (f.hospitalId !== 'all' && c.hospitalId !== f.hospitalId) return false
    if (f.caseType !== 'all' && c.type !== f.caseType) return false
    if (f.procedure && !c.plannedProcedure.toLowerCase().includes(f.procedure.toLowerCase())) return false
    if (f.diagnosis && !c.diagnosis.toLowerCase().includes(f.diagnosis.toLowerCase())) return false
    if (f.outcome !== 'all' && (c.outcome ?? 'unknown') !== f.outcome) return false
    return true
  })
}

/**
 * Statistic definitions (displayed to the user):
 * - Operations: cases with status 'completed' in range.
 * - Complication rate: completed cases with ≥1 documented complication ÷ completed cases.
 * - Reoperations: completed cases flagged as reoperation of a prior case.
 * - Follow-up completion: completed follow-ups ÷ (completed + missed + overdue) follow-ups for cases in range.
 */
export function computeOutcomes(d: DemoDataset, cases: SurgicalCase[]) {
  const completed = cases.filter((c) => c.status === 'completed')
  const ids = new Set(completed.map((c) => c.id))
  const withComp = completed.filter((c) => c.complications.length > 0)
  const reops = completed.filter((c) => c.reoperation)
  const fus = d.followUps.filter((f) => ids.has(f.caseId)).map((f) => deriveFollowUpStatus(f))
  const fuDone = fus.filter((s) => s === 'completed').length
  const fuDue = fus.filter((s) => s === 'completed' || s === 'missed' || s === 'overdue').length
  const outcomes = (['improved', 'stable', 'deteriorated', 'deceased', 'unknown'] as const).map((o) => ({ label: o, value: completed.filter((c) => (c.outcome ?? 'unknown') === o).length }))
  const bySeverity = (['minor', 'moderate', 'major'] as const).map((s) => ({ label: s, value: completed.flatMap((c) => c.complications).filter((k) => k.severity === s).length }))
  const assessments = d.assessments.filter((a) => ids.has(a.caseId))
  const kpsByType = ['preoperative', 'immediate-postoperative', 'outpatient-follow-up'].map((t) => { const vals = assessments.filter((a) => a.type === t && a.kps !== null && a.kps !== undefined).map((a) => a.kps as number); return { label: t === 'preoperative' ? 'Pre-op' : t === 'immediate-postoperative' ? 'Post-op' : 'Follow-up', kps: vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length) : null, n: vals.length } })
  const odiByType = ['preoperative', 'outpatient-follow-up'].map((t) => { const vals = assessments.filter((a) => a.type === t && a.odiScore !== null && a.odiScore !== undefined).map((a) => a.odiScore as number); return { label: t === 'preoperative' ? 'Pre-op' : 'Follow-up', odi: vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length) : null, n: vals.length } })
  return { completed: completed.length, withComplications: withComp.length, complicationRate: completed.length ? withComp.length / completed.length : null, reoperations: reops.length, fuDone, fuDue, fuRate: fuDue ? fuDone / fuDue : null, outcomes, bySeverity, kpsByType, odiByType, assessmentsDocumented: assessments.length }
}
