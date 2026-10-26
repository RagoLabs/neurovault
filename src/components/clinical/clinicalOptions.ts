import type { BrainCategory, BrainRegion, SpineCategory, SpineRegion, Laterality, AssessmentType, VisitType } from '@/types'

export const brainCategories: { value: BrainCategory; label: string }[] = [
  { value: 'tumor', label: 'Brain tumour' },
  { value: 'trauma', label: 'Traumatic brain injury' },
  { value: 'hemorrhage', label: 'Intracranial haemorrhage' },
  { value: 'hydrocephalus', label: 'Hydrocephalus' },
  { value: 'aneurysm', label: 'Cerebral aneurysm' },
  { value: 'avm', label: 'Arteriovenous / cavernous malformation' },
  { value: 'other', label: 'Other intracranial pathology' },
]

export const brainRegions: { value: BrainRegion; label: string }[] = [
  { value: 'frontal', label: 'Frontal' },
  { value: 'temporal', label: 'Temporal' },
  { value: 'parietal', label: 'Parietal' },
  { value: 'occipital', label: 'Occipital' },
  { value: 'cerebellum', label: 'Cerebellum' },
  { value: 'brainstem', label: 'Brainstem' },
  { value: 'ventricular', label: 'Ventricular system' },
  { value: 'sellar', label: 'Sellar / suprasellar' },
  { value: 'skull-base', label: 'Skull base / CPA' },
]

export const spineCategories: { value: SpineCategory; label: string }[] = [
  { value: 'disc-herniation', label: 'Disc herniation' },
  { value: 'stenosis', label: 'Spinal stenosis' },
  { value: 'trauma', label: 'Spinal trauma' },
  { value: 'tumor', label: 'Spinal tumour' },
  { value: 'cord-compression', label: 'Spinal cord compression / myelopathy' },
  { value: 'degenerative', label: 'Degenerative spinal disease' },
  { value: 'deformity', label: 'Deformity' },
  { value: 'infection', label: 'Infection' },
]

export const spineRegions: { value: SpineRegion; label: string }[] = [
  { value: 'cervical', label: 'Cervical' },
  { value: 'thoracic', label: 'Thoracic' },
  { value: 'lumbar', label: 'Lumbar' },
  { value: 'sacral', label: 'Sacral' },
  { value: 'craniovertebral', label: 'Craniovertebral junction' },
]

export const lateralities: { value: Laterality; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'bilateral', label: 'Bilateral' },
  { value: 'midline', label: 'Midline' },
  { value: 'not-applicable', label: 'Not applicable' },
]

export const assessmentTypes: { value: AssessmentType; label: string }[] = [
  { value: 'preoperative', label: 'Preoperative' },
  { value: 'immediate-postoperative', label: 'Immediate postoperative' },
  { value: 'inpatient-postoperative', label: 'Inpatient postoperative' },
  { value: 'outpatient-follow-up', label: 'Outpatient follow-up' },
  { value: 'other', label: 'Other clinical review' },
]

export const visitTypes: { value: VisitType; label: string }[] = [
  { value: 'postoperative-review', label: 'Postoperative review' },
  { value: 'wound-check', label: 'Wound check' },
  { value: 'imaging-review', label: 'Imaging review' },
  { value: 'routine', label: 'Routine review' },
  { value: 'urgent', label: 'Urgent review' },
]

/** Which condition-specific fields apply for each brain category. */
export const brainFieldConfig: Record<BrainCategory, { lesionSize: boolean; gcs: boolean; pupils: boolean; grading: string[] }> = {
  tumor: { lesionSize: true, gcs: true, pupils: false, grading: ['WHO CNS5', 'KPS', 'Simpson'] },
  trauma: { lesionSize: true, gcs: true, pupils: true, grading: ['GCS on arrival', 'Marshall CT'] },
  hemorrhage: { lesionSize: true, gcs: true, pupils: true, grading: ['ICH score', 'Markwalder'] },
  hydrocephalus: { lesionSize: false, gcs: true, pupils: false, grading: ['MMSE', 'Evans index'] },
  aneurysm: { lesionSize: true, gcs: true, pupils: true, grading: ['WFNS', 'Hunt & Hess', 'Modified Fisher', 'PHASES'] },
  avm: { lesionSize: true, gcs: true, pupils: false, grading: ['Spetzler–Martin', 'Zabramski'] },
  other: { lesionSize: true, gcs: true, pupils: false, grading: ['KPS'] },
}

export const labelOf = <T extends string>(list: { value: T; label: string }[], v: T | undefined) => list.find((x) => x.value === v)?.label ?? v ?? '—'
