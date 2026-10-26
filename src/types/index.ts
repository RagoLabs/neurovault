// ---------------------------------------------------------------------------
// NeuroVault domain model — all records are fictional demonstration data.
// ---------------------------------------------------------------------------

export type ID = string
export type ISODate = string // 'YYYY-MM-DD'
export type ISODateTime = string // ISO 8601

export type Sex = 'male' | 'female'
export type PatientStatus = 'active' | 'inactive'

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
}

export interface Patient {
  id: ID
  patientNumber: string // e.g. NV-0001
  firstName: string
  lastName: string
  dateOfBirth: ISODate
  sex: Sex
  phone: string
  email?: string
  address: string
  emergencyContact: EmergencyContact
  medicalHistory: string[]
  previousSurgeries: string[]
  medications: string[]
  allergies: string[]
  comorbidities: string[]
  hospitalId: ID
  mrn?: string
  status: PatientStatus
  registeredAt: ISODate
  primaryDiagnosis: string
  notes?: string
}

export interface Hospital {
  id: ID
  name: string
  shortName: string
  location: string
  city: string
  phone: string
  email: string
  type: 'teaching' | 'private' | 'regional' | 'specialist'
  theatres: number
  notes?: string
}

// ----- Cases ---------------------------------------------------------------

export type CaseType = 'brain' | 'spine' | 'combined'
export type ProcedureCategory = 'brain' | 'spine' | 'neurovascular' | 'other'
export type CaseStatus = 'planned' | 'scheduled' | 'completed' | 'postponed' | 'cancelled'
export type Priority = 'elective' | 'urgent' | 'emergency'
export type SurgeonRole = 'primary' | 'assistant' | 'supervising'
export type Laterality = 'left' | 'right' | 'bilateral' | 'midline' | 'not-applicable'

export type BrainCategory =
  | 'tumor'
  | 'trauma'
  | 'hemorrhage'
  | 'hydrocephalus'
  | 'aneurysm'
  | 'avm'
  | 'other'

export type BrainRegion =
  | 'frontal'
  | 'temporal'
  | 'parietal'
  | 'occipital'
  | 'cerebellum'
  | 'brainstem'
  | 'ventricular'
  | 'sellar'
  | 'skull-base'

export type SpineCategory =
  | 'disc-herniation'
  | 'stenosis'
  | 'trauma'
  | 'tumor'
  | 'cord-compression'
  | 'degenerative'
  | 'deformity'
  | 'infection'

export type SpineRegion = 'cervical' | 'thoracic' | 'lumbar' | 'sacral' | 'craniovertebral'

export interface GCSComponents {
  /** null = not testable (e.g. intubated, swollen eyes). */
  eye: number | null
  verbal: number | null
  motor: number | null
}

export interface PupilExam {
  size: number // mm
  reaction: 'brisk' | 'sluggish' | 'fixed' | 'not-assessable'
}

export interface MotorPower {
  rightUpper: number | null
  leftUpper: number | null
  rightLower: number | null
  leftLower: number | null
}

export interface BrainCaseDetails {
  category: BrainCategory
  region: BrainRegion
  laterality: Laterality
  lesionLocation: string
  lesionSizeMm?: number
  symptoms: string[]
  imagingFindings: string
  gcs?: GCSComponents
  pupils?: { left: PupilExam; right: PupilExam }
  cranialNerves?: string
  motorDeficit?: string
  sensoryDeficit?: string
  approach: string
  grading?: { system: string; value: string }[]
}

export interface SpineCaseDetails {
  category: SpineCategory
  region: SpineRegion
  levels: string[]
  laterality: Laterality
  symptoms: string[]
  motor?: MotorPower
  sensory?: string
  reflexes?: string
  bowelBladder?: string
  painScore?: number
  functionalLimitation?: string
  imagingFindings: string
  approach: string
  instrumentation?: string
  odiScore?: number
  asiaGrade?: 'A' | 'B' | 'C' | 'D' | 'E' | 'not-assessed'
}

export interface Complication {
  id: ID
  date: ISODate
  description: string
  severity: 'minor' | 'moderate' | 'major'
  management: string
  resolved: boolean
}

export type ClinicalOutcome = 'improved' | 'stable' | 'deteriorated' | 'deceased' | 'unknown'

export interface SurgicalCase {
  id: ID
  caseNumber: string // NSC-2026-001
  patientId: ID
  consultationId?: ID
  type: CaseType
  procedureCategory: ProcedureCategory
  diagnosis: string
  indication: string
  findings: string
  plannedProcedure: string
  hospitalId: ID
  surgeonRole: SurgeonRole
  priority: Priority
  status: CaseStatus
  plannedDate?: ISODate
  surgeryDate?: ISODate
  durationMinutes?: number
  createdAt: ISODate
  preopConsiderations: string
  brain?: BrainCaseDetails
  spine?: SpineCaseDetails
  complications: Complication[]
  outcome?: ClinicalOutcome
  reoperation?: boolean
  reoperationOfCaseId?: ID
  statusNote?: string
}

// ----- Consultations -------------------------------------------------------

export type ConsultationStatus = 'draft' | 'completed'

export interface Consultation {
  id: ID
  patientId: ID
  date: ISODate
  status: ConsultationStatus
  chiefComplaint: string
  historyOfPresentingIllness: string
  relevantMedicalHistory: string
  examinationFindings: string
  workingDiagnosis: string
  differentialDiagnosis: string
  investigationsRequested: string
  investigationFindings: string
  managementPlan: string
  followUpRecommendations: string
  caseId?: ID
  templateId?: ID
  hospitalId: ID
}

export interface NoteTemplate {
  id: ID
  name: string
  domain: 'brain' | 'spine' | 'general'
  fields: Partial<
    Pick<
      Consultation,
      | 'chiefComplaint'
      | 'historyOfPresentingIllness'
      | 'examinationFindings'
      | 'investigationsRequested'
      | 'managementPlan'
      | 'followUpRecommendations'
    >
  >
}

// ----- Assessments ---------------------------------------------------------

export type AssessmentType =
  | 'preoperative'
  | 'immediate-postoperative'
  | 'inpatient-postoperative'
  | 'outpatient-follow-up'
  | 'other'

export interface NeuroAssessment {
  id: ID
  patientId: ID
  caseId: ID
  date: ISODate
  type: AssessmentType
  domain: 'brain' | 'spine'
  gcs?: GCSComponents
  pupils?: { left: PupilExam; right: PupilExam }
  cranialNerves?: string
  motor: MotorPower
  sensory?: string
  reflexes?: string
  deficits: string[]
  painScore?: number | null
  odiScore?: number | null
  functionalStatus?: string
  bowelBladder?: string
  spinalLevel?: string
  mrs?: number | null // modified Rankin Scale 0-6
  kps?: number | null // Karnofsky 0-100
  asiaGrade?: 'A' | 'B' | 'C' | 'D' | 'E' | 'not-assessed'
  notes: string
  assessedBy: string
}

// ----- Imaging -------------------------------------------------------------

export type ImagingModality =
  | 'MRI Brain'
  | 'MRI Spine'
  | 'CT Brain'
  | 'CT Spine'
  | 'X-ray'
  | 'Angiography'
  | 'Laboratory'

export interface ImagingRecord {
  id: ID
  patientId: ID
  caseId?: ID
  modality: ImagingModality
  region: string
  studyDate: ISODate
  findings: string
  impression: string
  facilityId: ID
  imageKey?: string
  contrast?: boolean
  status: 'reported' | 'pending' | 'reviewed'
}

// ----- Operative reports ---------------------------------------------------

export type ReportStatus = 'draft' | 'finalized' | 'amended'

export interface ReportAmendment {
  id: ID
  date: ISODateTime
  author: string
  reason: string
  changes: string
}

export interface OperativeReport {
  id: ID
  caseId: ID
  status: ReportStatus
  version: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
  finalizedAt?: ISODateTime
  amendments: ReportAmendment[]
  team: {
    primarySurgeon: string
    assistants: string[]
    anaesthetist: string
    surgeonRole: SurgeonRole
  }
  preopDiagnosis: string
  postopDiagnosis: string
  procedurePerformed: string
  approach: string
  operativeFindings: string
  procedureDescription: string
  intraopMonitoring: string
  estimatedBloodLossMl: number | null
  specimens: string
  implants: string
  intraopComplications: string
  immediatePostopCondition: string
  postopPlan: string
  anaesthesiaType: string
  durationMinutes: number | null
}

// ----- Postoperative -------------------------------------------------------

export type DischargeStatus = 'inpatient' | 'discharged' | 'transferred' | 'deceased'

export interface PostopNote {
  id: ID
  caseId: ID
  patientId: ID
  date: ISODate
  postopDay: number
  neuroFindings: string
  clinicalCondition: 'stable' | 'improving' | 'concern' | 'critical'
  painScore: number | null
  woundStatus: 'clean-dry' | 'serous-ooze' | 'erythema' | 'dehiscence' | 'infected' | 'not-assessed'
  observations: string
  complications: string
  plan: string
  dischargeStatus: DischargeStatus
  author: string
}

export interface DischargeSummary {
  id: ID
  caseId: ID
  patientId: ID
  dischargeDate: ISODate
  admissionDate: ISODate
  finalDiagnosis: string
  procedure: string
  hospitalCourse: string
  conditionAtDischarge: string
  medications: string
  instructions: string
  followUpPlan: string
  author: string
}

// ----- Follow-ups ----------------------------------------------------------

export type FollowUpStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled'
export type VisitType = 'postoperative-review' | 'wound-check' | 'imaging-review' | 'routine' | 'urgent'

export interface FollowUp {
  id: ID
  patientId: ID
  caseId: ID
  date: ISODate
  time: string // HH:mm
  visitType: VisitType
  status: FollowUpStatus
  hospitalId: ID
  symptoms?: string
  neuroExam?: string
  painScore?: number | null
  woundAssessment?: string
  functionalRecovery?: string
  imagingReview?: string
  complications?: string
  outcome?: ClinicalOutcome
  plan?: string
  nextFollowUpDate?: ISODate
  requiresFurtherAssessment?: boolean
  notes?: string
}

// ----- Documents -----------------------------------------------------------

export type DocumentCategory =
  | 'consultation'
  | 'operative'
  | 'discharge'
  | 'imaging'
  | 'laboratory'
  | 'follow-up'
  | 'other'

export interface ClinicalDocument {
  id: ID
  patientId?: ID
  caseId?: ID
  category: DocumentCategory
  title: string
  fileName: string
  mimeType: string
  sizeBytes: number
  createdAt: ISODateTime
  source: 'generated' | 'uploaded' | 'external'
  description?: string
  /** Data URL for demo uploads (in-memory only unless persisted). */
  dataUrl?: string
  /** Pre-rendered text content for generated documents. */
  textContent?: string
}

// ----- Scheduling ----------------------------------------------------------

export interface AppNotification {
  id: ID
  title: string
  message: string
  createdAt: ISODateTime
  type: 'info' | 'warning' | 'success' | 'danger'
  read: boolean
  link?: string
}

export interface CalendarEvent {
  id: ID
  kind: 'surgery' | 'follow-up' | 'consultation' | 'other'
  date: ISODate
  time?: string
  title: string
  subtitle?: string
  refId: ID
  patientId?: ID
  hospitalId?: ID
  status: string
  link: string
}

// ----- Settings ------------------------------------------------------------

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  density: 'comfortable' | 'compact'
  dateFormat: 'dd MMM yyyy' | 'yyyy-MM-dd' | 'dd/MM/yyyy'
  defaultHospitalId: ID
  defaultCaseType: CaseType
  notifications: {
    overdueFollowUps: boolean
    upcomingSurgery: boolean
    draftReports: boolean
    dailyDigest: boolean
  }
  reducedMotion: boolean
  showDemoBanner: boolean
}

export interface DemoDataset {
  patients: Patient[]
  hospitals: Hospital[]
  cases: SurgicalCase[]
  consultations: Consultation[]
  assessments: NeuroAssessment[]
  imaging: ImagingRecord[]
  operativeReports: OperativeReport[]
  postopNotes: PostopNote[]
  dischargeSummaries: DischargeSummary[]
  followUps: FollowUp[]
  documents: ClinicalDocument[]
  notifications: AppNotification[]
  noteTemplates: NoteTemplate[]
}
