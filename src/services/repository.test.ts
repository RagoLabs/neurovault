import { describe, it, expect, beforeEach } from 'vitest'
import { useDemoStore } from '@/stores/demoStore'
import { createPatient, createSurgicalCase, createFollowup, updateFollowup, resetDemoData, finalizeOperativeReport, amendOperativeReport, saveOperativeReport } from './repository'
import { getDashboardStats, getSurgicalActivity, getProcedureDistribution } from './stats'
import { globalSearch } from './search'

const memoryStorage: Record<string, string> = {}
;(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (k: string) => memoryStorage[k] ?? null,
  setItem: (k: string, v: string) => { memoryStorage[k] = v },
  removeItem: (k: string) => { delete memoryStorage[k] },
  clear: () => { Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]) },
  key: () => null,
  length: 0,
} as Storage

describe('demo repository', () => {
  beforeEach(() => resetDemoData())

  it('registers a patient and adds them to the directory with the next number', () => {
    const before = useDemoStore.getState().data.patients.length
    const p = createPatient({ firstName: 'Test', lastName: 'Patient', dateOfBirth: '1990-01-01', sex: 'female', phone: '+255 700 000 000', address: 'Dar es Salaam', emergencyContact: { name: 'A', relationship: 'Spouse', phone: '+255' }, medicalHistory: [], previousSurgeries: [], medications: [], allergies: [], comorbidities: [], hospitalId: 'hosp-001', primaryDiagnosis: 'Test' })
    const after = useDemoStore.getState().data.patients
    expect(after.length).toBe(before + 1)
    expect(p.patientNumber).toBe('NV-0046')
    expect(after.find((x) => x.id === p.id)).toBeTruthy()
  })

  it('creates a surgical case linked to a patient and links back to the consultation', () => {
    const c = createSurgicalCase({ patientId: 'pt-001', consultationId: 'cons-101', type: 'spine', procedureCategory: 'spine', diagnosis: 'Test', indication: '', findings: '', plannedProcedure: 'Test procedure', hospitalId: 'hosp-001', surgeonRole: 'primary', priority: 'elective', status: 'planned', preopConsiderations: '' })
    expect(c.caseNumber).toMatch(/^NSC-2026-\d{3}$/)
    const cons = useDemoStore.getState().data.consultations.find((k) => k.id === 'cons-101')
    expect(cons?.caseId).toBe(c.id)
  })

  it('records and completes a follow-up, and the dashboard reflects it', () => {
    const statsBefore = getDashboardStats(useDemoStore.getState().data)
    const f = createFollowup({ patientId: 'pt-002', caseId: useDemoStore.getState().data.cases.find((c) => c.patientId === 'pt-002')!.id, date: '2026-11-10', time: '09:00', visitType: 'routine', status: 'scheduled', hospitalId: 'hosp-002' })
    const statsMid = getDashboardStats(useDemoStore.getState().data)
    expect(statsMid.upcomingFollowUps).toBe(statsBefore.upcomingFollowUps + 1)
    updateFollowup(f.id, { status: 'completed', outcome: 'improved' })
    const statsAfter = getDashboardStats(useDemoStore.getState().data)
    expect(statsAfter.upcomingFollowUps).toBe(statsBefore.upcomingFollowUps)
  })

  it('finalizes a report and preserves history through amendments', () => {
    const r = useDemoStore.getState().data.operativeReports.find((x) => x.status === 'draft')!
    finalizeOperativeReport(r.id)
    let now = useDemoStore.getState().data.operativeReports.find((x) => x.id === r.id)!
    expect(now.status).toBe('finalized')
    amendOperativeReport(r.id, { reason: 'Typo', changes: 'Corrected EBL', author: 'Test' }, { estimatedBloodLossMl: 999 })
    now = useDemoStore.getState().data.operativeReports.find((x) => x.id === r.id)!
    expect(now.status).toBe('amended')
    expect(now.version).toBe(2)
    expect(now.amendments.length).toBe(1)
    expect(now.estimatedBloodLossMl).toBe(999)
    const saved = saveOperativeReport({ ...now, id: undefined, caseId: 'case-001', status: 'draft' })
    expect(saved.id).not.toBe(now.id)
  })

  it('reset restores the original dataset', () => {
    createPatient({ firstName: 'Temp', lastName: 'Person', dateOfBirth: '1990-01-01', sex: 'male', phone: '', address: '', emergencyContact: { name: '', relationship: '', phone: '' }, medicalHistory: [], previousSurgeries: [], medications: [], allergies: [], comorbidities: [], hospitalId: 'hosp-001', primaryDiagnosis: '' })
    resetDemoData()
    expect(useDemoStore.getState().data.patients.length).toBe(45)
  })

  it('dashboard statistics match the underlying records', () => {
    const d = useDemoStore.getState().data
    const stats = getDashboardStats(d)
    const completed = d.cases.filter((c) => c.status === 'completed')
    expect(stats.totalProcedures).toBe(completed.length)
    expect(stats.brainSurgeries + stats.spinalSurgeries + stats.neurovascular + stats.other).toBe(completed.length)
    const dist = getProcedureDistribution(d.cases)
    expect(dist.reduce((a, b) => a + b.value, 0)).toBe(completed.length)
    const yearly = getSurgicalActivity(d.cases, '12m')
    expect(yearly.length).toBe(12)
    expect(yearly.reduce((a, b) => a + b.total, 0)).toBe(completed.filter((c) => c.surgeryDate! >= '2025-11-01').length)
  })

  it('global search finds patients, cases and consultations', () => {
    const d = useDemoStore.getState().data
    const r = globalSearch(d, 'kessy')
    expect(r.some((x) => x.kind === 'patient')).toBe(true)
    expect(globalSearch(d, 'microdiscectomy').some((x) => x.kind === 'procedure')).toBe(true)
    expect(globalSearch(d, 'NSC-2026-004').length).toBeGreaterThan(0)
  })
})
