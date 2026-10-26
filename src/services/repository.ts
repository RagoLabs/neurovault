/**
 * Service layer. Components use these functions / hooks instead of touching
 * the store or the mock arrays directly, so the data source can later be
 * swapped for real API calls.
 */
import { useShallow } from 'zustand/react/shallow'
import { useDemoStore } from '@/stores/demoStore'
import type {
  AppNotification,
  ClinicalDocument,
  Consultation,
  DischargeSummary,
  FollowUp,
  Hospital,
  ImagingRecord,
  NeuroAssessment,
  OperativeReport,
  Patient,
  PostopNote,
  SurgicalCase,
  DemoDataset,
} from '@/types'
import { newId, nextSequence } from './ids'
import { demoToday } from '@/config/demo'
import { toIso } from '@/utils/clinical'

const state = () => useDemoStore.getState()

// ---- generic hooks --------------------------------------------------------

export function useCollection<K extends keyof DemoDataset>(key: K): DemoDataset[K] {
  return useDemoStore((s) => s.data[key])
}

export function useDataset(): DemoDataset {
  return useDemoStore((s) => s.data)
}

export function useRecord<K extends keyof DemoDataset>(key: K, id: string | undefined): DemoDataset[K][number] | undefined {
  return useDemoStore((s) => (id ? (s.data[key] as { id: string }[]).find((x) => x.id === id) : undefined)) as DemoDataset[K][number] | undefined
}

export function useWhere<K extends keyof DemoDataset>(key: K, predicate: (item: DemoDataset[K][number]) => boolean): DemoDataset[K] {
  return useDemoStore(useShallow((s) => (s.data[key] as DemoDataset[K][number][]).filter(predicate))) as DemoDataset[K]
}

// ---- Patients -------------------------------------------------------------

export const getPatients = () => state().data.patients
export const getPatientById = (id: string) => state().data.patients.find((p) => p.id === id)
export function createPatient(data: Omit<Patient, 'id' | 'patientNumber' | 'registeredAt' | 'status'> & Partial<Pick<Patient, 'status'>>): Patient {
  const seq = nextSequence(state().data.patients.map((p) => p.patientNumber), /NV-(\d+)/)
  const patient: Patient = {
    ...data,
    id: newId('pt'),
    patientNumber: `NV-${String(seq).padStart(4, '0')}`,
    registeredAt: toIso(demoToday()),
    status: data.status ?? 'active',
  }
  state().upsert('patients', patient)
  return patient
}
export const updatePatient = (id: string, changes: Partial<Patient>) => state().patch('patients', id, changes)

// ---- Hospitals ------------------------------------------------------------

export const getHospitals = () => state().data.hospitals
export const getHospitalById = (id: string) => state().data.hospitals.find((h) => h.id === id)
export function saveHospital(h: Omit<Hospital, 'id'> & { id?: string }): Hospital {
  const hospital: Hospital = { ...h, id: h.id ?? newId('hosp') }
  state().upsert('hospitals', hospital)
  return hospital
}

// ---- Cases ----------------------------------------------------------------

export const getSurgicalCases = () => state().data.cases
export const getSurgicalCaseById = (id: string) => state().data.cases.find((c) => c.id === id)
export function createSurgicalCase(data: Omit<SurgicalCase, 'id' | 'caseNumber' | 'createdAt' | 'complications'> & Partial<Pick<SurgicalCase, 'complications'>>): SurgicalCase {
  const year = demoToday().getFullYear()
  const seq = nextSequence(state().data.cases.map((c) => c.caseNumber), /NSC-\d{4}-(\d+)/)
  const c: SurgicalCase = {
    ...data,
    id: newId('case'),
    caseNumber: `NSC-${year}-${String(seq).padStart(3, '0')}`,
    createdAt: toIso(demoToday()),
    complications: data.complications ?? [],
  }
  state().upsert('cases', c)
  if (c.consultationId) state().patch('consultations', c.consultationId, { caseId: c.id })
  return c
}
export const updateSurgicalCase = (id: string, changes: Partial<SurgicalCase>) => state().patch('cases', id, changes)

// ---- Consultations --------------------------------------------------------

export const getConsultations = () => state().data.consultations
export const getConsultationById = (id: string) => state().data.consultations.find((c) => c.id === id)
export function saveConsultation(data: Omit<Consultation, 'id'> & { id?: string }): Consultation {
  const c: Consultation = { ...data, id: data.id ?? newId('cons') }
  state().upsert('consultations', c)
  return c
}

// ---- Assessments ----------------------------------------------------------

export const getAssessments = () => state().data.assessments
export function saveAssessment(data: Omit<NeuroAssessment, 'id'> & { id?: string }): NeuroAssessment {
  const a: NeuroAssessment = { ...data, id: data.id ?? newId('nas') }
  state().upsert('assessments', a)
  return a
}

// ---- Imaging --------------------------------------------------------------

export const getImaging = () => state().data.imaging
export function saveImaging(data: Omit<ImagingRecord, 'id'> & { id?: string }): ImagingRecord {
  const r: ImagingRecord = { ...data, id: data.id ?? newId('img') }
  state().upsert('imaging', r)
  return r
}

// ---- Operative reports ----------------------------------------------------

export const getOperativeReports = () => state().data.operativeReports
export const getOperativeReportByCase = (caseId: string) => state().data.operativeReports.find((r) => r.caseId === caseId)
export function saveOperativeReport(data: Omit<OperativeReport, 'id'> & { id?: string }): OperativeReport {
  const r: OperativeReport = { ...data, id: data.id ?? newId('opr'), updatedAt: new Date().toISOString() }
  state().upsert('operativeReports', r)
  return r
}
export function finalizeOperativeReport(id: string) {
  const now = new Date().toISOString()
  state().patch('operativeReports', id, { status: 'finalized', finalizedAt: now, updatedAt: now })
}
export function amendOperativeReport(id: string, amendment: { reason: string; changes: string; author: string }, newValues: Partial<OperativeReport>) {
  const r = state().data.operativeReports.find((x) => x.id === id)
  if (!r) return
  const now = new Date().toISOString()
  state().patch('operativeReports', id, {
    ...newValues,
    status: 'amended',
    version: r.version + 1,
    updatedAt: now,
    amendments: [...r.amendments, { id: newId('amend'), date: now, ...amendment }],
  })
}

// ---- Postoperative --------------------------------------------------------

export const getPostopNotes = () => state().data.postopNotes
export function savePostopNote(data: Omit<PostopNote, 'id'> & { id?: string }): PostopNote {
  const n: PostopNote = { ...data, id: data.id ?? newId('pon') }
  state().upsert('postopNotes', n)
  return n
}
export function saveDischargeSummary(data: Omit<DischargeSummary, 'id'> & { id?: string }): DischargeSummary {
  const d: DischargeSummary = { ...data, id: data.id ?? newId('dis') }
  state().upsert('dischargeSummaries', d)
  return d
}

// ---- Follow-ups -----------------------------------------------------------

export const getFollowups = () => state().data.followUps
export function createFollowup(data: Omit<FollowUp, 'id'> & { id?: string }): FollowUp {
  const f: FollowUp = { ...data, id: data.id ?? newId('fu') }
  state().upsert('followUps', f)
  return f
}
export const updateFollowup = (id: string, changes: Partial<FollowUp>) => state().patch('followUps', id, changes)

// ---- Documents ------------------------------------------------------------

export const getDocuments = () => state().data.documents
export function saveDocument(data: Omit<ClinicalDocument, 'id'> & { id?: string }): ClinicalDocument {
  const d: ClinicalDocument = { ...data, id: data.id ?? newId('doc') }
  state().upsert('documents', d)
  return d
}
export const deleteDocument = (id: string) => state().remove('documents', id)

// ---- Notifications --------------------------------------------------------

export const markNotificationRead = (id: string) => state().patch('notifications', id, { read: true })
export const markAllNotificationsRead = () => state().data.notifications.forEach((n) => state().patch('notifications', n.id, { read: true }))
export function pushNotification(n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
  state().upsert('notifications', { ...n, id: newId('ntf'), createdAt: new Date().toISOString(), read: false })
}

// ---- Demo management ------------------------------------------------------

export const resetDemoData = () => state().resetDemo()
