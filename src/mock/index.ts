import type { ClinicalDocument, DemoDataset } from '@/types'
import { patients } from './patients'
import { cases, operativeReports, postopNotes, dischargeSummaries } from './surgeries'
import { consultations, assessments, imaging, noteTemplates } from './clinical'
import { hospitals, followUps, notifications } from './scheduling'

// ---------------------------------------------------------------------------
// Generated documents — derived from the clinical records so the Documents
// module reflects the same data source as the rest of the application.
// ---------------------------------------------------------------------------

function kb(text: string) {
  return Math.round(text.length * 1.6)
}

const documents: ClinicalDocument[] = []

operativeReports
  .filter((r) => r.status !== 'draft')
  .forEach((r) => {
    const c = cases.find((x) => x.id === r.caseId)!
    const text = `OPERATIVE REPORT\n${c.caseNumber}\nProcedure: ${r.procedurePerformed}\nApproach: ${r.approach}\n\nFindings:\n${r.operativeFindings}\n\nDescription:\n${r.procedureDescription}`
    documents.push({
      id: `doc-opr-${r.id}`, patientId: c.patientId, caseId: c.id, category: 'operative',
      title: `Operative report — ${c.caseNumber}`, fileName: `${c.caseNumber}-operative-report.pdf`, mimeType: 'application/pdf',
      sizeBytes: kb(text), createdAt: r.finalizedAt ?? r.createdAt, source: 'generated', description: r.procedurePerformed, textContent: text,
    })
  })

dischargeSummaries.forEach((d) => {
  const c = cases.find((x) => x.id === d.caseId)!
  const text = `DISCHARGE SUMMARY\n${c.caseNumber}\nAdmitted ${d.admissionDate} — Discharged ${d.dischargeDate}\n\nDiagnosis: ${d.finalDiagnosis}\nProcedure: ${d.procedure}\n\nHospital course:\n${d.hospitalCourse}\n\nMedications:\n${d.medications}\n\nInstructions:\n${d.instructions}\n\nFollow-up:\n${d.followUpPlan}`
  documents.push({
    id: `doc-dis-${d.id}`, patientId: d.patientId, caseId: d.caseId, category: 'discharge',
    title: `Discharge summary — ${c.caseNumber}`, fileName: `${c.caseNumber}-discharge-summary.pdf`, mimeType: 'application/pdf',
    sizeBytes: kb(text), createdAt: `${d.dischargeDate}T12:00:00`, source: 'generated', description: d.procedure, textContent: text,
  })
})

imaging.forEach((im) => {
  const text = `${im.modality.toUpperCase()} REPORT — ${im.region}\nStudy date: ${im.studyDate}\n\nFindings:\n${im.findings}\n\nImpression:\n${im.impression}`
  documents.push({
    id: `doc-img-${im.id}`, patientId: im.patientId, caseId: im.caseId, category: im.modality === 'Laboratory' ? 'laboratory' : 'imaging',
    title: `${im.modality} — ${im.region}`, fileName: `${im.id}-${im.modality.replace(/\s+/g, '-').toLowerCase()}-report.pdf`, mimeType: 'application/pdf',
    sizeBytes: kb(text), createdAt: `${im.studyDate}T15:30:00`, source: 'external', description: im.impression, textContent: text,
  })
})

consultations
  .filter((k) => k.status === 'completed')
  .slice(0, 24)
  .forEach((k) => {
    const text = `CONSULTATION NOTE\nDate: ${k.date}\n\nChief complaint: ${k.chiefComplaint}\n\nHistory:\n${k.historyOfPresentingIllness}\n\nExamination:\n${k.examinationFindings}\n\nWorking diagnosis: ${k.workingDiagnosis}\n\nPlan:\n${k.managementPlan}`
    documents.push({
      id: `doc-cons-${k.id}`, patientId: k.patientId, caseId: k.caseId, category: 'consultation',
      title: `Consultation note — ${k.date}`, fileName: `${k.id}-consultation.pdf`, mimeType: 'application/pdf',
      sizeBytes: kb(text), createdAt: `${k.date}T17:00:00`, source: 'generated', description: k.workingDiagnosis, textContent: text,
    })
  })

followUps
  .filter((f) => f.status === 'completed')
  .slice(0, 12)
  .forEach((f) => {
    const text = `FOLLOW-UP REPORT\nDate: ${f.date}\n\nSymptoms: ${f.symptoms}\nNeurological examination: ${f.neuroExam}\nWound: ${f.woundAssessment}\nFunctional recovery: ${f.functionalRecovery}\nOutcome: ${f.outcome}\n\nPlan: ${f.plan}`
    documents.push({
      id: `doc-fu-${f.id}`, patientId: f.patientId, caseId: f.caseId, category: 'follow-up',
      title: `Follow-up report — ${f.date}`, fileName: `${f.id}-follow-up.pdf`, mimeType: 'application/pdf',
      sizeBytes: kb(text), createdAt: `${f.date}T16:00:00`, source: 'generated', description: f.visitType, textContent: text,
    })
  })

documents.push({
  id: 'doc-other-001', patientId: 'pt-001', caseId: cases.find((c) => c.patientId === 'pt-001')!.id, category: 'other',
  title: 'Neuropsychology baseline — pre-awake craniotomy', fileName: 'neuropsych-baseline-NV-0001.pdf', mimeType: 'application/pdf',
  sizeBytes: 184_320, createdAt: '2026-02-04T10:00:00', source: 'external', description: 'Language and executive function baseline for awake mapping.',
  textContent: 'NEUROPSYCHOLOGY BASELINE\nLanguage: naming 58/60, verbal fluency within normal limits.\nExecutive: Trail-making B 72 s (average).\nMemory: within normal limits.\nSuitable for awake craniotomy with intraoperative language tasks.',
})

export const initialDataset: DemoDataset = {
  patients,
  hospitals,
  cases,
  consultations,
  assessments,
  imaging,
  operativeReports,
  postopNotes,
  dischargeSummaries,
  followUps,
  documents,
  notifications,
  noteTemplates,
}

/** Returns a deep copy so store mutations never touch the pristine dataset. */
export function cloneInitialDataset(): DemoDataset {
  return structuredClone(initialDataset)
}

/** Internal consistency checks used by tests and the settings page. */
export function validateDataset(d: DemoDataset): string[] {
  const errors: string[] = []
  const pid = new Set(d.patients.map((p) => p.id))
  const cid = new Set(d.cases.map((c) => c.id))
  const hid = new Set(d.hospitals.map((h) => h.id))
  const dup = (arr: { id: string }[], label: string) => {
    const seen = new Set<string>()
    arr.forEach((x) => {
      if (seen.has(x.id)) errors.push(`${label}: duplicate id ${x.id}`)
      seen.add(x.id)
    })
  }
  dup(d.patients, 'patients'); dup(d.cases, 'cases'); dup(d.consultations, 'consultations'); dup(d.assessments, 'assessments'); dup(d.imaging, 'imaging'); dup(d.operativeReports, 'operativeReports'); dup(d.postopNotes, 'postopNotes'); dup(d.followUps, 'followUps'); dup(d.documents, 'documents')
  d.patients.forEach((p) => { if (!hid.has(p.hospitalId)) errors.push(`patient ${p.id}: unknown hospital ${p.hospitalId}`) })
  d.cases.forEach((c) => {
    if (!pid.has(c.patientId)) errors.push(`case ${c.id}: unknown patient ${c.patientId}`)
    if (!hid.has(c.hospitalId)) errors.push(`case ${c.id}: unknown hospital ${c.hospitalId}`)
    if (c.status === 'completed' && !c.surgeryDate) errors.push(`case ${c.id}: completed without surgeryDate`)
    if (c.status !== 'completed' && c.surgeryDate) errors.push(`case ${c.id}: surgeryDate on non-completed case`)
    if (c.type === 'brain' && !c.brain) errors.push(`case ${c.id}: brain case without brain details`)
    if (c.type === 'spine' && !c.spine) errors.push(`case ${c.id}: spine case without spine details`)
    if (c.reoperationOfCaseId && !cid.has(c.reoperationOfCaseId)) errors.push(`case ${c.id}: unknown reoperation source`)
  })
  d.consultations.forEach((k) => {
    if (!pid.has(k.patientId)) errors.push(`consultation ${k.id}: unknown patient`)
    if (k.caseId && !cid.has(k.caseId)) errors.push(`consultation ${k.id}: unknown case ${k.caseId}`)
  })
  d.assessments.forEach((a) => {
    if (!pid.has(a.patientId)) errors.push(`assessment ${a.id}: unknown patient`)
    if (!cid.has(a.caseId)) errors.push(`assessment ${a.id}: unknown case`)
    const c = d.cases.find((x) => x.id === a.caseId)
    if (c && c.patientId !== a.patientId) errors.push(`assessment ${a.id}: patient/case mismatch`)
  })
  d.operativeReports.forEach((r) => {
    const c = d.cases.find((x) => x.id === r.caseId)
    if (!c) errors.push(`report ${r.id}: unknown case`)
    else if (c.status === 'cancelled' && r.status !== 'draft') errors.push(`report ${r.id}: finalized report on cancelled case`)
  })
  d.postopNotes.forEach((n) => {
    const c = d.cases.find((x) => x.id === n.caseId)
    if (!c) errors.push(`postop note ${n.id}: unknown case`)
    else if (c.surgeryDate && n.date < c.surgeryDate) errors.push(`postop note ${n.id}: dated before surgery`)
  })
  d.followUps.forEach((f) => {
    const c = d.cases.find((x) => x.id === f.caseId)
    if (!pid.has(f.patientId)) errors.push(`follow-up ${f.id}: unknown patient`)
    if (!c) errors.push(`follow-up ${f.id}: unknown case`)
    else {
      if (c.patientId !== f.patientId) errors.push(`follow-up ${f.id}: patient/case mismatch`)
      if (c.surgeryDate && f.date < c.surgeryDate) errors.push(`follow-up ${f.id}: dated before surgery`)
    }
  })
  d.imaging.forEach((i) => {
    if (!pid.has(i.patientId)) errors.push(`imaging ${i.id}: unknown patient`)
    if (i.caseId && !cid.has(i.caseId)) errors.push(`imaging ${i.id}: unknown case`)
    if (!hid.has(i.facilityId)) errors.push(`imaging ${i.id}: unknown facility`)
  })
  d.documents.forEach((doc) => {
    if (doc.patientId && !pid.has(doc.patientId)) errors.push(`document ${doc.id}: unknown patient`)
    if (doc.caseId && !cid.has(doc.caseId)) errors.push(`document ${doc.id}: unknown case`)
  })
  return errors
}

export { patients, hospitals, cases, consultations, assessments, imaging, operativeReports, postopNotes, dischargeSummaries, followUps, documents, notifications, noteTemplates }
