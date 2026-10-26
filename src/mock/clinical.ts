import type { Consultation, ImagingRecord, NeuroAssessment, NoteTemplate, MotorPower, AssessmentType } from '@/types'
import { surgeon } from '@/config/surgeon'
import { cases } from './surgeries'
import { addDays, createRng, pad } from './seed'

// ---------------------------------------------------------------------------
// Consultations — one per surgical case (the consultation that initiated it),
// plus a handful of stand-alone consultations that have not become cases.
// ---------------------------------------------------------------------------

function seedIndexOf(caseId: string) {
  const c = cases.find((x) => x.id === caseId)!
  return Number(c.consultationId!.slice(5)) - 1
}

export const consultations: Consultation[] = cases.map((c) => {
  const seedIdx = seedIndexOf(c.id)
  const isBrain = c.type !== 'spine'
  const d = c.brain ?? c.spine!
  const examination = isBrain
    ? `GCS ${c.brain!.gcs ? gcsLabel(c.brain!.gcs) : '15'}. Pupils: L ${c.brain!.pupils?.left.size ?? 3} mm ${c.brain!.pupils?.left.reaction ?? 'brisk'}, R ${c.brain!.pupils?.right.size ?? 3} mm ${c.brain!.pupils?.right.reaction ?? 'brisk'}. Cranial nerves: ${c.brain!.cranialNerves ?? 'intact'}. Motor: ${c.brain!.motorDeficit ?? 'no deficit'}. Sensory: ${c.brain!.sensoryDeficit ?? 'no deficit'}.`
    : `Gait: ${c.spine!.functionalLimitation ?? 'normal'}. Motor: RUL ${c.spine!.motor?.rightUpper ?? 5}/5, LUL ${c.spine!.motor?.leftUpper ?? 5}/5, RLL ${c.spine!.motor?.rightLower ?? 5}/5, LLL ${c.spine!.motor?.leftLower ?? 5}/5. Sensory: ${c.spine!.sensory ?? 'intact'}. Reflexes: ${c.spine!.reflexes ?? 'normal'}. Bowel/bladder: ${c.spine!.bowelBladder ?? 'normal'}. Pain ${c.spine!.painScore ?? 0}/10.`
  return {
    id: `cons-${pad(seedIdx + 1)}`,
    patientId: c.patientId,
    date: c.createdAt,
    status: 'completed',
    chiefComplaint: d.symptoms[0] ?? c.diagnosis,
    historyOfPresentingIllness: c.indication,
    relevantMedicalHistory: c.preopConsiderations,
    examinationFindings: examination,
    workingDiagnosis: c.diagnosis,
    differentialDiagnosis: differentialFor(c.diagnosis, isBrain),
    investigationsRequested: isBrain ? 'MRI brain with contrast; CT head; routine bloods, group and save' : 'MRI spine; standing radiographs (flexion/extension where indicated); routine bloods',
    investigationFindings: d.imagingFindings,
    managementPlan: `${c.priority === 'emergency' ? 'Emergency' : c.priority === 'urgent' ? 'Urgent' : 'Elective'} surgery recommended: ${c.plannedProcedure}. Risks, benefits and alternatives discussed; written information provided. ${c.preopConsiderations}`,
    followUpRecommendations: c.status === 'completed' ? 'Review at 2 weeks post-operatively for wound check, then 6 weeks with imaging where indicated.' : 'Pre-admission review one week before surgery; contact clinic if symptoms progress.',
    caseId: c.id,
    hospitalId: c.hospitalId,
    templateId: isBrain ? 'tpl-brain-tumour' : 'tpl-spine-radiculopathy',
  }
})

function gcsLabel(g: { eye: number | null; verbal: number | null; motor: number | null }) {
  const parts = [g.eye, g.verbal, g.motor]
  if (parts.some((p) => p === null)) return `E${g.eye ?? 'NT'} V${g.verbal ?? 'NT'} M${g.motor ?? 'NT'} (component not testable)`
  return `${(g.eye ?? 0) + (g.verbal ?? 0) + (g.motor ?? 0)} (E${g.eye} V${g.verbal} M${g.motor})`
}

function differentialFor(dx: string, isBrain: boolean) {
  const l = dx.toLowerCase()
  if (l.includes('glioma') || l.includes('glioblastoma')) return 'High-grade glioma; metastasis; lymphoma; tumefactive demyelination'
  if (l.includes('meningioma')) return 'Dural metastasis; haemangiopericytoma; lymphoma'
  if (l.includes('schwannoma')) return 'CPA meningioma; epidermoid; facial schwannoma'
  if (l.includes('aneurysm')) return 'Infundibulum; vessel loop; dissecting aneurysm'
  if (l.includes('subdural')) return 'Subdural hygroma; empyema; cerebral atrophy'
  if (l.includes('hydrocephalus')) return 'Alzheimer disease; vascular dementia; Parkinsonism'
  if (l.includes('disc')) return 'Foraminal stenosis; synovial cyst; piriformis syndrome; peripheral neuropathy'
  if (l.includes('stenosis') || l.includes('claudication')) return 'Vascular claudication; hip osteoarthritis; peripheral neuropathy'
  if (l.includes('myelopathy') || l.includes('compression')) return 'Motor neurone disease; multiple sclerosis; B12 deficiency; tumour'
  if (l.includes('abscess')) return 'Discitis; metastasis; epidural haematoma'
  return isBrain ? 'Other intracranial space-occupying lesion' : 'Other degenerative spinal pathology'
}

// Stand-alone consultations (no case yet) — some drafts.
const standalone: Consultation[] = [
  {
    id: 'cons-101', patientId: 'pt-007', date: '2026-09-29', status: 'completed', hospitalId: 'hosp-004',
    chiefComplaint: 'Recurrent low back pain', historyOfPresentingIllness: 'Ten months after L3–L5 laminectomy, new mechanical back pain without leg symptoms. No red flags.',
    relevantMedicalHistory: 'Laminectomy November 2025. No comorbidity.', examinationFindings: 'Full power, normal sensation, reflexes symmetrical. Pain on extension.',
    workingDiagnosis: 'Mechanical low back pain post-decompression', differentialDiagnosis: 'Facet arthropathy; adjacent segment disease; early instability',
    investigationsRequested: 'Standing flexion-extension radiographs', investigationFindings: 'Awaited', managementPlan: 'Physiotherapy core programme; analgesia review; radiographs.', followUpRecommendations: 'Review with radiographs in 6 weeks.',
  },
  {
    id: 'cons-102', patientId: 'pt-027', date: '2026-10-21', status: 'draft', hospitalId: 'hosp-002',
    chiefComplaint: 'Headache review after foramen magnum decompression', historyOfPresentingIllness: 'Valsalva headaches resolved. Mild occipital tenderness. Syrinx reassessment due.',
    relevantMedicalHistory: 'Foramen magnum decompression June 2026.', examinationFindings: 'Grip improved to 5/5 bilaterally. Sensory level improving.', workingDiagnosis: 'Satisfactory recovery, Chiari I decompression', differentialDiagnosis: '',
    investigationsRequested: 'MRI craniocervical junction', investigationFindings: '', managementPlan: '', followUpRecommendations: '',
  },
  {
    id: 'cons-103', patientId: 'pt-035', date: '2026-10-23', status: 'draft', hospitalId: 'hosp-002',
    chiefComplaint: 'New right leg pain', historyOfPresentingIllness: 'Five months after left L4/L5 microdiscectomy, new right-sided L5 pain for 3 weeks.',
    relevantMedicalHistory: 'Type 2 diabetes.', examinationFindings: 'Right EHL 4/5; straight leg raise positive 40° on the right.', workingDiagnosis: 'Suspected contralateral L4/L5 disc herniation', differentialDiagnosis: 'Recurrent herniation; foraminal stenosis',
    investigationsRequested: 'MRI lumbar spine', investigationFindings: '', managementPlan: '', followUpRecommendations: '',
  },
  {
    id: 'cons-104', patientId: 'pt-016', date: '2026-10-14', status: 'completed', hospitalId: 'hosp-004',
    chiefComplaint: 'Seven-month review after L4/L5 TLIF', historyOfPresentingIllness: 'Back pain much improved; walking unlimited. No leg symptoms.',
    relevantMedicalHistory: 'Osteoporosis on alendronate.', examinationFindings: 'Full power; wound well healed; no tenderness.', workingDiagnosis: 'Satisfactory fusion progress L4/L5', differentialDiagnosis: '',
    investigationsRequested: 'CT lumbar spine at 12 months', investigationFindings: 'Upright radiographs: implants in position, no loosening.', managementPlan: 'Continue bone health treatment; graded return to gardening.', followUpRecommendations: 'Review at 12 months with CT.',
  },
]
consultations.push(...standalone)

export const noteTemplates: NoteTemplate[] = [
  {
    id: 'tpl-brain-tumour', name: 'Brain tumour — new referral', domain: 'brain',
    fields: {
      chiefComplaint: 'Headache / seizure / focal deficit (edit)',
      historyOfPresentingIllness: 'Onset, duration and progression of symptoms. Seizure semiology. Features of raised intracranial pressure. Functional status (KPS).',
      examinationFindings: 'GCS __ (E_ V_ M_). Pupils equal and reactive. Cranial nerves II–XII intact. Power 5/5 in all limbs. No pronator drift. Gait normal.',
      investigationsRequested: 'MRI brain with contrast (including DTI/fMRI where near eloquent cortex); CT head; routine bloods; group and save.',
      managementPlan: 'Neuro-oncology MDT discussion. Discuss surgical options including biopsy vs resection. Steroids and antiepileptic as indicated.',
      followUpRecommendations: 'Review after MDT with imaging.',
    },
  },
  {
    id: 'tpl-spine-radiculopathy', name: 'Lumbar radiculopathy', domain: 'spine',
    fields: {
      chiefComplaint: 'Leg pain radiating below the knee',
      historyOfPresentingIllness: 'Duration of radicular pain, distribution, aggravating/relieving factors, response to conservative treatment, red flags (bladder/bowel, saddle anaesthesia, progressive weakness).',
      examinationFindings: 'Gait. Straight leg raise R __° L __°. Power by myotome. Sensation by dermatome. Reflexes knee/ankle. Perianal sensation and anal tone where indicated.',
      investigationsRequested: 'MRI lumbar spine; standing radiographs if instability suspected.',
      managementPlan: 'Conservative management for 6–12 weeks unless progressive deficit. Discuss microdiscectomy if concordant imaging and failed conservative care.',
      followUpRecommendations: 'Review in 6 weeks with MRI.',
    },
  },
  {
    id: 'tpl-spine-myelopathy', name: 'Cervical myelopathy', domain: 'spine',
    fields: {
      chiefComplaint: 'Hand clumsiness and gait imbalance',
      historyOfPresentingIllness: 'Progression over months; fine motor tasks; falls; Lhermitte sign; bladder symptoms. mJOA score.',
      examinationFindings: 'Hyperreflexia, Hoffmann sign, clonus, plantar responses, tandem gait, grip-release test, finger escape sign.',
      investigationsRequested: 'MRI cervical spine; CT if ossification suspected; flexion-extension radiographs.',
      managementPlan: 'Surgical decompression recommended for moderate-severe myelopathy. Anterior vs posterior approach based on alignment and levels.',
      followUpRecommendations: 'Review at 6 weeks and 6 months with mJOA.',
    },
  },
  {
    id: 'tpl-head-injury', name: 'Head injury review', domain: 'brain',
    fields: {
      chiefComplaint: 'Head injury',
      historyOfPresentingIllness: 'Mechanism, loss of consciousness, amnesia, vomiting, seizure, anticoagulation.',
      examinationFindings: 'GCS, pupils, external signs of skull base fracture, focal deficit, cervical spine.',
      investigationsRequested: 'CT head; CT cervical spine as indicated.',
      managementPlan: 'Observation vs surgical intervention per CT findings. Reverse anticoagulation where appropriate.',
      followUpRecommendations: 'Head injury advice sheet; clinic review in 4 weeks.',
    },
  },
  {
    id: 'tpl-general-followup', name: 'General follow-up note', domain: 'general',
    fields: {
      chiefComplaint: 'Routine post-operative review',
      examinationFindings: 'Wound. Neurological examination compared with pre-operative baseline.',
      managementPlan: 'Continue recovery plan.',
      followUpRecommendations: 'As per protocol.',
    },
  },
]

// ---------------------------------------------------------------------------
// Neurological assessments — preoperative baseline for every case with
// clinical detail, postoperative assessments for completed cases and
// follow-up assessments for selected journeys.
// ---------------------------------------------------------------------------

export const assessments: NeuroAssessment[] = []

function mkMotor(m: MotorPower | undefined, delta: number, cap = 5): MotorPower {
  const f = (v: number | null | undefined) => (v === null || v === undefined ? null : Math.min(cap, Math.max(0, v + delta)))
  return { rightUpper: f(m?.rightUpper ?? 5), leftUpper: f(m?.leftUpper ?? 5), rightLower: f(m?.rightLower ?? 5), leftLower: f(m?.leftLower ?? 5) }
}

const brainMotorFromDeficit = (deficit?: string): MotorPower => {
  const d = (deficit ?? '').toLowerCase()
  if (d.includes('left hemipleg')) return { rightUpper: 5, leftUpper: 1, rightLower: 5, leftLower: 2 }
  if (d.includes('left hemipar')) return { rightUpper: 5, leftUpper: 3, rightLower: 5, leftLower: 3 }
  if (d.includes('right hemipar')) return { rightUpper: 3, leftUpper: 5, rightLower: 3, leftLower: 5 }
  if (d.includes('left arm') || d.includes('left drift')) return { rightUpper: 5, leftUpper: 4, rightLower: 5, leftLower: 5 }
  if (d.includes('right drift') || d.includes('right pronator')) return { rightUpper: 4, leftUpper: 5, rightLower: 5, leftLower: 5 }
  if (d.includes('right leg')) return { rightUpper: 5, leftUpper: 5, rightLower: 4, leftLower: 5 }
  if (d.includes('right 4/5')) return { rightUpper: 4, leftUpper: 5, rightLower: 4, leftLower: 5 }
  if (d.includes('hand')) return { rightUpper: 4, leftUpper: 4, rightLower: 5, leftLower: 5 }
  return { rightUpper: 5, leftUpper: 5, rightLower: 5, leftLower: 5 }
}

let assessmentCounter = 0
function pushAssessment(a: Omit<NeuroAssessment, 'id' | 'assessedBy'>) {
  assessmentCounter += 1
  assessments.push({ id: `nas-${pad(assessmentCounter)}`, assessedBy: surgeon.fullName, ...a })
}

cases.forEach((c) => {
  const seedIdx = seedIndexOf(c.id)
  const rng = createRng(3000 + seedIdx)
  const isBrain = c.type !== 'spine'
  const domain: 'brain' | 'spine' = isBrain ? 'brain' : 'spine'
  const baseMotor = isBrain ? brainMotorFromDeficit(c.brain!.motorDeficit) : c.spine!.motor ?? { rightUpper: 5, leftUpper: 5, rightLower: 5, leftLower: 5 }
  const preDate = c.status === 'completed' ? addDays(c.surgeryDate!, c.priority === 'emergency' ? 0 : -1) : c.createdAt
  const mrsPre = isBrain ? (c.priority === 'emergency' ? 5 : c.brain!.motorDeficit && c.brain!.motorDeficit !== 'None' ? 2 : 1) : null

  // Preoperative baseline
  pushAssessment({
    patientId: c.patientId, caseId: c.id, date: preDate, type: 'preoperative', domain,
    gcs: isBrain ? c.brain!.gcs : undefined,
    pupils: isBrain ? c.brain!.pupils : undefined,
    cranialNerves: isBrain ? c.brain!.cranialNerves : undefined,
    motor: baseMotor,
    sensory: isBrain ? c.brain!.sensoryDeficit : c.spine!.sensory,
    reflexes: isBrain ? undefined : c.spine!.reflexes,
    deficits: isBrain ? [c.brain!.motorDeficit, c.brain!.sensoryDeficit].filter((x): x is string => !!x && x !== 'None' && x !== 'Not assessable') : c.spine!.symptoms.slice(0, 2),
    painScore: isBrain ? null : c.spine!.painScore ?? null,
    odiScore: isBrain ? null : c.spine!.odiScore ?? null,
    functionalStatus: isBrain ? undefined : c.spine!.functionalLimitation,
    bowelBladder: isBrain ? undefined : c.spine!.bowelBladder,
    spinalLevel: isBrain ? undefined : c.spine!.levels.join(', '),
    mrs: mrsPre,
    kps: isBrain ? (c.priority === 'emergency' ? 30 : 80 + Math.floor(rng() * 2) * 10) : null,
    asiaGrade: isBrain ? undefined : c.spine!.asiaGrade,
    notes: `Preoperative baseline for ${c.plannedProcedure}.`,
  })

  if (c.status !== 'completed') return

  const improves = c.outcome === 'improved'
  const worse = c.outcome === 'deteriorated'

  // Immediate postoperative
  const postDate = addDays(c.surgeryDate!, 1)
  if (postDate <= '2026-10-26') {
    pushAssessment({
      patientId: c.patientId, caseId: c.id, date: postDate, type: 'immediate-postoperative', domain,
      gcs: isBrain ? (c.priority === 'emergency' ? { eye: 2, verbal: null, motor: 5 } : { eye: 4, verbal: 5, motor: 6 }) : undefined,
      pupils: isBrain ? { left: { size: 3, reaction: 'brisk' }, right: { size: 3, reaction: 'brisk' } } : undefined,
      cranialNerves: isBrain ? (c.complications.some((x) => x.description.includes('facial')) ? 'Left VII House-Brackmann III' : c.brain!.cranialNerves) : undefined,
      motor: worse ? mkMotor(baseMotor, -1) : mkMotor(baseMotor, 0),
      sensory: isBrain ? c.brain!.sensoryDeficit : c.spine!.sensory,
      reflexes: isBrain ? undefined : c.spine!.reflexes,
      deficits: worse ? ['Dense left hemiplegia', 'Dysarthria'] : c.priority === 'emergency' ? ['Sedated; formal assessment limited'] : [],
      painScore: isBrain ? null : Math.max(1, (c.spine!.painScore ?? 6) - 3),
      odiScore: null,
      functionalStatus: isBrain ? undefined : 'Day 1: mobilised with physiotherapy',
      bowelBladder: isBrain ? undefined : c.spine!.bowelBladder,
      spinalLevel: isBrain ? undefined : c.spine!.levels.join(', '),
      mrs: isBrain ? (c.priority === 'emergency' ? 5 : mrsPre) : null,
      kps: isBrain ? (c.priority === 'emergency' ? 30 : 70) : null,
      asiaGrade: isBrain ? undefined : c.spine!.asiaGrade,
      notes: c.priority === 'emergency' ? 'Assessed in neuro-ICU; verbal component not testable (intubated).' : 'Day 1 post-operative review on the ward.',
    })
  }

  // Follow-up assessments at ~6 weeks and ~6 months when in the past
  const fu1 = addDays(c.surgeryDate!, 42)
  const fu2 = addDays(c.surgeryDate!, 180)
  const unknown = c.outcome === 'unknown'
  const schedule: [string, AssessmentType, number][] = [[fu1, 'outpatient-follow-up', improves ? 1 : worse ? -1 : 0], [fu2, 'outpatient-follow-up', improves ? 1 : worse ? 0 : 0]]
  if (c.priority === 'emergency') schedule.unshift([addDays(c.surgeryDate!, 7), 'inpatient-postoperative', worse ? -1 : 0])
  const flagship = [0, 1, 2, 3, 4, 7, 10, 16, 18, 22, 28, 30, 33, 40].includes(seedIdx)
  schedule.forEach(([date, type, delta], k) => {
    if (date > '2026-10-26') return
    if (unknown && k > 0) return // missed follow-up — no later data
    if (date === fu2 && !flagship) return // 6-month assessment only documented for selected journeys
    const motor = mkMotor(baseMotor, delta + (k > 0 && improves ? 1 : 0))
    const pain = isBrain ? null : Math.max(0, (c.spine!.painScore ?? 6) - 4 - k)
    pushAssessment({
      patientId: c.patientId, caseId: c.id, date, type, domain,
      gcs: isBrain ? (worse ? { eye: 4, verbal: 3, motor: 6 } : { eye: 4, verbal: 5, motor: 6 }) : undefined,
      pupils: isBrain ? { left: { size: 3, reaction: 'brisk' }, right: { size: 3, reaction: 'brisk' } } : undefined,
      cranialNerves: isBrain ? (c.complications.some((x) => x.description.includes('facial')) ? (k === 0 ? 'Left VII House-Brackmann III' : 'Left VII House-Brackmann II') : 'Intact') : undefined,
      motor,
      sensory: improves ? 'Improving' : isBrain ? c.brain!.sensoryDeficit : c.spine!.sensory,
      reflexes: isBrain ? undefined : improves ? 'Symmetrical' : c.spine!.reflexes,
      deficits: worse ? ['Left hemiplegia 2/5', 'Dysarthria'] : improves ? [] : c.spine ? c.spine.symptoms.slice(0, 1) : [],
      painScore: pain,
      odiScore: isBrain ? null : c.spine!.odiScore ? Math.max(4, c.spine!.odiScore - 24 - k * 10) : null,
      functionalStatus: isBrain ? undefined : improves ? (k === 0 ? 'Walking 1 km; returned to light duties' : 'Full activities') : 'Unchanged',
      bowelBladder: isBrain ? undefined : 'Normal',
      spinalLevel: isBrain ? undefined : c.spine!.levels.join(', '),
      mrs: isBrain ? (worse ? 4 : c.priority === 'emergency' ? (k === 0 ? 4 : 2) : improves ? 0 : 1) : null,
      kps: isBrain ? (worse ? 40 : c.priority === 'emergency' ? (k === 0 ? 50 : 80) : improves ? 90 : 70) : null,
      asiaGrade: isBrain ? undefined : improves && c.spine!.asiaGrade === 'C' ? 'D' : c.spine!.asiaGrade,
      notes: `${type === 'inpatient-postoperative' ? 'Inpatient day 7' : `Outpatient review at ${k === schedule.length - 1 && schedule.length > 2 ? '6 months' : k === 0 ? '6 weeks' : '6 months'}`} after ${c.plannedProcedure.toLowerCase()}.`,
    })
  })
})

// ---------------------------------------------------------------------------
// Imaging & investigations
// ---------------------------------------------------------------------------

const facilities = ['hosp-001', 'hosp-002', 'hosp-003', 'hosp-004', 'hosp-005', 'hosp-006']

const imagingSeeds: { caseIdx: number; modality: ImagingRecord['modality']; region: string; offset: number; image?: string; contrast?: boolean; findings?: string; impression?: string; status?: ImagingRecord['status'] }[] = [
  { caseIdx: 0, modality: 'MRI Brain', region: 'Brain', offset: -3, image: 'mriBrainAxial', contrast: true },
  { caseIdx: 0, modality: 'MRI Brain', region: 'Brain (post-operative)', offset: 2, image: 'mriBrainAxial', contrast: true, findings: 'Resection cavity in the right frontal lobe with expected post-operative changes. No residual T2/FLAIR signal abnormality beyond the cavity margin.', impression: 'Gross total resection. No complication.' },
  { caseIdx: 1, modality: 'MRI Spine', region: 'Lumbar spine', offset: -14, image: 'mriLumbarSagittal' },
  { caseIdx: 2, modality: 'CT Brain', region: 'Brain', offset: 0, image: 'ctBrainAxial' },
  { caseIdx: 2, modality: 'CT Brain', region: 'Brain (post-operative)', offset: 1, image: 'ctBrainAxial', findings: 'Right craniectomy defect with satisfactory evacuation of the subdural haematoma. Midline shift reduced to 2 mm. Small residual temporal contusions.', impression: 'Satisfactory post-operative appearance.' },
  { caseIdx: 3, modality: 'MRI Spine', region: 'Cervical spine', offset: -20, image: 'mriCervicalSagittal' },
  { caseIdx: 4, modality: 'Angiography', region: 'Cerebral (DSA)', offset: -18, image: 'angiography' },
  { caseIdx: 4, modality: 'CT Brain', region: 'CT angiography', offset: -30, image: 'ctBrainAxial', contrast: true },
  { caseIdx: 5, modality: 'MRI Brain', region: 'Brain', offset: -40, image: 'mriBrainAxial' },
  { caseIdx: 7, modality: 'MRI Brain', region: 'Internal auditory canals', offset: -10, image: 'mriBrainAxial', contrast: true },
  { caseIdx: 8, modality: 'CT Brain', region: 'Brain', offset: -2, image: 'ctBrainAxial' },
  { caseIdx: 9, modality: 'MRI Spine', region: 'Thoracic spine', offset: -25, image: 'mriCervicalSagittal', contrast: true },
  { caseIdx: 10, modality: 'MRI Brain', region: 'Brain', offset: -12, image: 'mriBrainAxial', contrast: true },
  { caseIdx: 10, modality: 'MRI Brain', region: 'Brain (surveillance)', offset: 210, image: 'mriBrainAxial', contrast: true, findings: 'New 22 mm nodular enhancement at the posterior margin of the resection cavity with raised rCBV on perfusion imaging.', impression: 'Findings favour tumour progression over treatment effect. For MDT.' },
  { caseIdx: 11, modality: 'MRI Brain', region: 'Pituitary', offset: -22, image: 'mriBrainAxial', contrast: true },
  { caseIdx: 15, modality: 'X-ray', region: 'Lumbar spine (flexion/extension)', offset: -30, image: 'xraySpine' },
  { caseIdx: 16, modality: 'CT Brain', region: 'CT angiography', offset: -1, image: 'ctBrainAxial', contrast: true },
  { caseIdx: 18, modality: 'CT Spine', region: 'Thoracolumbar spine', offset: -1, image: 'ctSpine' },
  { caseIdx: 25, modality: 'Angiography', region: 'Cerebral (DSA)', offset: -35, image: 'angiography' },
  { caseIdx: 28, modality: 'CT Brain', region: 'Brain', offset: 0, image: 'ctBrainAxial' },
  { caseIdx: 33, modality: 'MRI Spine', region: 'Whole spine', offset: -3, image: 'mriCervicalSagittal', contrast: true },
  { caseIdx: 39, modality: 'MRI Brain', region: 'Brain', offset: -15, image: 'mriBrainAxial', contrast: true },
  { caseIdx: 40, modality: 'CT Spine', region: 'Cervical spine', offset: -1, image: 'ctSpine' },
  { caseIdx: 40, modality: 'MRI Spine', region: 'Cervical spine', offset: -1, image: 'mriCervicalSagittal' },
  { caseIdx: 42, modality: 'MRI Spine', region: 'Cervical spine', offset: -8, image: 'mriCervicalSagittal', contrast: true },
  { caseIdx: 44, modality: 'MRI Brain', region: 'Brain (SWI)', offset: -5, image: 'mriBrainAxial' },
  { caseIdx: 36, modality: 'CT Brain', region: 'Brain', offset: -1, image: 'ctBrainAxial' },
  { caseIdx: 48, modality: 'CT Brain', region: 'Brain', offset: -1, image: 'ctBrainAxial' },
  // Laboratory
  { caseIdx: 22, modality: 'Laboratory', region: 'Blood cultures / inflammatory markers', offset: -1, findings: 'WCC 16.2 ×10⁹/L, CRP 212 mg/L, ESR 88 mm/h. Blood cultures: Staphylococcus aureus (MSSA) in 2/2 bottles.', impression: 'Bacteraemia consistent with spinal epidural abscess.' },
  { caseIdx: 16, modality: 'Laboratory', region: 'Transcranial Doppler series', offset: 6, findings: 'Mean flow velocity left MCA 165 cm/s, Lindegaard ratio 4.2.', impression: 'Moderate vasospasm.', status: 'reviewed' },
  { caseIdx: 11, modality: 'Laboratory', region: 'Pituitary profile', offset: -20, findings: 'Prolactin 48 mIU/L (mild stalk effect), 9 am cortisol 410 nmol/L, TSH 2.1, IGF-1 normal, LH/FSH low.', impression: 'Non-functioning adenoma with hypogonadotropic hypogonadism.' },
  { caseIdx: 1, modality: 'Laboratory', region: 'Pre-operative bloods', offset: -7, findings: 'Hb 14.1 g/dL, WCC 6.8, platelets 240, INR 1.0, creatinine 78 µmol/L, HbA1c 5.6%.', impression: 'Fit for surgery.' },
]

export const imaging: ImagingRecord[] = imagingSeeds.map((s, i) => {
  const c = cases.find((x) => Number(x.consultationId!.slice(5)) - 1 === s.caseIdx)!
  const anchor = c.surgeryDate ?? c.plannedDate ?? c.createdAt
  const d = c.brain ?? c.spine!
  const isBrain = c.type !== 'spine'
  return {
    id: `img-${pad(i + 1)}`,
    patientId: c.patientId,
    caseId: c.id,
    modality: s.modality,
    region: s.region,
    studyDate: addDays(anchor, s.offset),
    findings: s.findings ?? d.imagingFindings,
    impression: s.impression ?? c.diagnosis,
    facilityId: facilities[(s.caseIdx + i) % facilities.length],
    imageKey: s.image,
    contrast: s.contrast,
    status: s.status ?? (isBrain ? 'reviewed' : 'reported'),
  }
})
