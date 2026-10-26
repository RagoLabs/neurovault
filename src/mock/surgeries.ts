import type {
  BrainCaseDetails,
  CaseStatus,
  CaseType,
  ClinicalOutcome,
  Complication,
  DischargeSummary,
  OperativeReport,
  PostopNote,
  Priority,
  ProcedureCategory,
  SpineCaseDetails,
  SurgicalCase,
} from '@/types'
import { surgeon } from '@/config/surgeon'
import { addDays, createRng, pad, pick } from './seed'

// ---------------------------------------------------------------------------
// Surgical cases
// ---------------------------------------------------------------------------

interface CaseSeed {
  pt: number
  type: CaseType
  cat: ProcedureCategory
  dx: string
  proc: string
  hosp: number
  priority: Priority
  status: CaseStatus
  created: string
  date?: string
  outcome?: ClinicalOutcome
  indication: string
  findings: string
  preop: string
  brain?: BrainCaseDetails
  spine?: SpineCaseDetails
  complications?: Omit<Complication, 'id'>[]
  reop?: number // index of original case seed
  note?: string
  duration?: number
}

const H = ['hosp-001', 'hosp-002', 'hosp-003', 'hosp-004', 'hosp-005', 'hosp-006']

const normalGcs = { eye: 4, verbal: 5, motor: 6 }
const normalPupils = { left: { size: 3, reaction: 'brisk' as const }, right: { size: 3, reaction: 'brisk' as const } }
const fullPower = { rightUpper: 5, leftUpper: 5, rightLower: 5, leftLower: 5 }

const seeds: CaseSeed[] = [
  // 0 — Amina Kessy: flagship brain tumour journey
  {
    pt: 1, type: 'brain', cat: 'brain', hosp: 0, priority: 'elective', status: 'completed', created: '2026-01-08', date: '2026-02-12', outcome: 'improved', duration: 245,
    dx: 'Right frontal low-grade glioma (WHO grade 2 diffuse astrocytoma)',
    proc: 'Right frontal craniotomy and awake microsurgical resection with cortical mapping',
    indication: 'New-onset focal seizures with a non-enhancing right frontal lesion showing interval growth on serial MRI. Maximal safe resection recommended for diagnosis and seizure control.',
    findings: 'T2/FLAIR hyperintense infiltrative lesion in the right middle frontal gyrus abutting the premotor cortex. No enhancement. No midline shift.',
    preop: 'Awake craniotomy with intraoperative speech and motor mapping. Preoperative neuropsychology baseline completed. Continue levetiracetam. Functional MRI and DTI tractography reviewed.',
    brain: {
      category: 'tumor', region: 'frontal', laterality: 'right', lesionLocation: 'Right middle frontal gyrus, anterior to the precentral gyrus', lesionSizeMm: 38,
      symptoms: ['Focal motor seizures (left arm)', 'Mild headache on waking', 'No focal deficit'],
      imagingFindings: 'Non-enhancing, T2/FLAIR hyperintense infiltrative lesion 38 × 31 × 29 mm, right middle frontal gyrus. Minimal mass effect. MR spectroscopy: raised choline/NAA ratio.',
      gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact II–XII', motorDeficit: 'None', sensoryDeficit: 'None',
      approach: 'Right frontal craniotomy, awake, neuronavigation-guided', grading: [{ system: 'WHO CNS5', value: 'Grade 2 (IDH-mutant)' }, { system: 'KPS', value: '90' }],
    },
  },
  // 1 — Joseph Mwangi: flagship lumbar spine journey
  {
    pt: 2, type: 'spine', cat: 'spine', hosp: 1, priority: 'elective', status: 'completed', created: '2026-02-02', date: '2026-03-03', outcome: 'improved', duration: 95,
    dx: 'L4/L5 left paracentral disc herniation with L5 radiculopathy',
    proc: 'L4/L5 left microdiscectomy',
    indication: 'Persistent left L5 radicular pain for 14 weeks despite physiotherapy and analgesia, with concordant MRI findings and new foot dorsiflexion weakness.',
    findings: 'Large left paracentral L4/L5 disc extrusion compressing the traversing left L5 nerve root.',
    preop: 'Routine. Penicillin allergy noted — cefazolin avoided, clindamycin prophylaxis. Pre-operative ODI 52.',
    spine: {
      category: 'disc-herniation', region: 'lumbar', levels: ['L4/L5'], laterality: 'left',
      symptoms: ['Left leg radicular pain (L5 dermatome)', 'Paraesthesia dorsum of left foot', 'Left EHL and dorsiflexion weakness'],
      motor: { rightUpper: 5, leftUpper: 5, rightLower: 5, leftLower: 4 }, sensory: 'Reduced light touch left L5 dermatome', reflexes: 'Knee 2+ bilaterally, ankle 2+ bilaterally',
      bowelBladder: 'Normal', painScore: 8, functionalLimitation: 'Unable to sit >15 min; off work 6 weeks',
      imagingFindings: 'MRI: left paracentral L4/L5 disc extrusion with caudal migration, severe lateral recess stenosis, left L5 root compression.',
      approach: 'Posterior, left-sided microsurgical (tubular retractor)', odiScore: 52, asiaGrade: 'E',
    },
  },
  // 2 — Daniel Okafor: flagship trauma journey with complication and reoperation
  {
    pt: 3, type: 'brain', cat: 'brain', hosp: 2, priority: 'emergency', status: 'completed', created: '2026-03-19', date: '2026-03-19', outcome: 'improved', duration: 150,
    dx: 'Severe traumatic brain injury — acute right fronto-temporo-parietal subdural haematoma with 11 mm midline shift',
    proc: 'Right fronto-temporo-parietal decompressive craniectomy and evacuation of acute subdural haematoma',
    indication: 'Motorcycle collision. GCS 7 on arrival (E1 V2 M4) with a dilated right pupil. CT: 14 mm acute SDH, 11 mm midline shift, uncal herniation.',
    findings: 'Acute SDH over the right convexity with underlying contusions of the temporal pole. Tense, swollen brain after evacuation.',
    preop: 'Emergency pathway. Intubated and ventilated. Mannitol given in ED. Tranexamic acid given. Cross-match 4 units.',
    brain: {
      category: 'trauma', region: 'temporal', laterality: 'right', lesionLocation: 'Right fronto-temporo-parietal convexity', lesionSizeMm: 14,
      symptoms: ['Reduced consciousness', 'Right pupil dilated and fixed', 'Left hemiparesis'],
      imagingFindings: 'CT: 14 mm acute right subdural haematoma, 11 mm leftward midline shift, effacement of basal cisterns, right temporal contusions.',
      gcs: { eye: 1, verbal: null, motor: 4 }, pupils: { left: { size: 3, reaction: 'brisk' }, right: { size: 6, reaction: 'fixed' } },
      cranialNerves: 'Right III palsy (dilated pupil)', motorDeficit: 'Left hemiparesis (localises on right only)', sensoryDeficit: 'Not assessable',
      approach: 'Large reverse question-mark trauma flap, decompressive craniectomy', grading: [{ system: 'Marshall CT', value: 'VI (evacuated mass lesion)' }, { system: 'GCS on arrival', value: '7 (E1 V2 M4)' }],
    },
    complications: [
      { date: '2026-03-31', description: 'Superficial surgical site infection of the scalp flap', severity: 'moderate', management: 'Wound swab, IV flucloxacillin for 7 days then oral course; wound healed', resolved: true },
    ],
  },
  // 3 — Grace Lumumba: ACDF with missed follow-up and unknown outcome
  {
    pt: 4, type: 'spine', cat: 'spine', hosp: 3, priority: 'elective', status: 'completed', created: '2026-01-21', date: '2026-02-25', outcome: 'unknown', duration: 130,
    dx: 'Cervical spondylotic myelopathy C5/6',
    proc: 'C5/6 anterior cervical discectomy and fusion (ACDF) with PEEK cage and plate',
    indication: 'Progressive gait disturbance, hand clumsiness and hyperreflexia with cord signal change at C5/6.',
    findings: 'Disc-osteophyte complex at C5/6 with cord compression and T2 signal change.',
    preop: 'Hypertension controlled. Awake fibre-optic intubation not required. Neuromonitoring (SSEP/MEP) requested.',
    spine: {
      category: 'cord-compression', region: 'cervical', levels: ['C5/6'], laterality: 'midline',
      symptoms: ['Gait imbalance', 'Bilateral hand clumsiness', 'Neck pain', 'Lhermitte phenomenon'],
      motor: { rightUpper: 4, leftUpper: 4, rightLower: 4, leftLower: 4 }, sensory: 'Reduced proprioception in feet; patchy C6 hypoaesthesia', reflexes: 'Brisk 3+ in all four limbs, Hoffmann positive bilaterally, upgoing plantars',
      bowelBladder: 'Urgency, no incontinence', painScore: 4, functionalLimitation: 'Needs rail on stairs; dropping objects',
      imagingFindings: 'MRI: C5/6 disc-osteophyte complex with severe canal stenosis and focal cord T2 hyperintensity. Mild C4/5 and C6/7 degeneration.',
      approach: 'Anterior cervical (left-sided Smith-Robinson)', instrumentation: 'PEEK interbody cage 7 mm with anterior cervical plate', odiScore: 40, asiaGrade: 'D',
    },
  },
  // 4 — Samuel Ndlovu: neurovascular, overdue follow-up
  {
    pt: 5, type: 'brain', cat: 'neurovascular', hosp: 0, priority: 'elective', status: 'completed', created: '2026-04-03', date: '2026-05-14', outcome: 'improved', duration: 210,
    dx: 'Unruptured right middle cerebral artery bifurcation aneurysm (7 mm)',
    proc: 'Right pterional craniotomy and microsurgical clipping of MCA aneurysm',
    indication: 'Incidental 7 mm wide-necked MCA bifurcation aneurysm in a 38-year-old smoker with a daughter-sac; treatment recommended after multidisciplinary discussion.',
    findings: 'Wide-necked saccular aneurysm at the M1 bifurcation incorporating the origin of the inferior M2 trunk.',
    preop: 'Smoking cessation advised. Aspirin continued. CT angiography and catheter angiography reviewed. Intraoperative ICG videoangiography planned.',
    brain: {
      category: 'aneurysm', region: 'temporal', laterality: 'right', lesionLocation: 'Right MCA bifurcation (M1/M2)', lesionSizeMm: 7,
      symptoms: ['Asymptomatic (incidental finding during headache work-up)'],
      imagingFindings: 'CTA/DSA: 7 × 5 mm saccular aneurysm at right MCA bifurcation, neck 4 mm, small daughter sac superiorly.',
      gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'None', sensoryDeficit: 'None',
      approach: 'Right pterional craniotomy, transsylvian', grading: [{ system: 'PHASES', value: '6' }, { system: 'Hunt & Hess', value: 'N/A (unruptured)' }],
    },
  },
  // 5 — Fatma Rashid: scheduled VP shunt
  {
    pt: 6, type: 'brain', cat: 'brain', hosp: 1, priority: 'elective', status: 'scheduled', created: '2026-08-14', date: '2026-10-29',
    dx: 'Normal pressure hydrocephalus',
    proc: 'Ventriculoperitoneal shunt insertion (programmable valve)',
    indication: 'Classic triad with positive response to high-volume lumbar tap test (gait velocity improved 32%).',
    findings: 'Ventriculomegaly (Evans index 0.38) with DESH pattern.',
    preop: 'Diabetes: perioperative sliding-scale insulin. Antiplatelet not on. Right frontal (Kocher) entry planned.',
    brain: {
      category: 'hydrocephalus', region: 'ventricular', laterality: 'right', lesionLocation: 'Lateral ventricles (communicating hydrocephalus)',
      symptoms: ['Magnetic gait', 'Urinary urgency and incontinence', 'Mild cognitive slowing'],
      imagingFindings: 'MRI: ventriculomegaly out of proportion to sulcal atrophy, Evans index 0.38, tight high-convexity sulci, aqueductal flow void.',
      gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'None (gait apraxia)', sensoryDeficit: 'None',
      approach: 'Right frontal burr hole, programmable valve, peritoneal catheter via mini-laparotomy', grading: [{ system: 'MMSE', value: '24/30' }],
    },
  },
  // 6
  {
    pt: 7, type: 'spine', cat: 'spine', hosp: 3, priority: 'elective', status: 'completed', created: '2025-11-11', date: '2025-11-27', outcome: 'improved', duration: 140,
    dx: 'Lumbar spinal stenosis L3–L5 with neurogenic claudication', proc: 'L3–L5 decompressive laminectomy',
    indication: 'Neurogenic claudication limiting walking to 100 m despite 6 months of conservative management.',
    findings: 'Severe central canal stenosis at L3/4 and L4/5 from ligamentum flavum hypertrophy and facet arthropathy.',
    preop: 'Routine. No instability on flexion-extension radiographs.',
    spine: { category: 'stenosis', region: 'lumbar', levels: ['L3/L4', 'L4/L5'], laterality: 'bilateral', symptoms: ['Bilateral leg heaviness on walking', 'Relief on sitting', 'Low back pain'], motor: fullPower, sensory: 'Intact', reflexes: 'Ankle jerks reduced bilaterally', bowelBladder: 'Normal', painScore: 6, functionalLimitation: 'Walking distance 100 m', imagingFindings: 'MRI: severe central stenosis L3/4 and L4/5, cross-sectional area <70 mm².', approach: 'Posterior midline', odiScore: 46, asiaGrade: 'E' },
  },
  // 7
  {
    pt: 8, type: 'brain', cat: 'brain', hosp: 0, priority: 'elective', status: 'completed', created: '2025-12-02', date: '2025-12-18', outcome: 'stable', duration: 420,
    dx: 'Left vestibular schwannoma (Koos grade 3)', proc: 'Left retrosigmoid craniotomy and microsurgical resection of vestibular schwannoma with facial nerve monitoring',
    indication: 'Growing 24 mm cerebellopontine angle tumour with brainstem contact and non-serviceable hearing.',
    findings: 'Tumour in the CPA extending into the internal auditory meatus, facial nerve splayed anteriorly.',
    preop: 'Facial nerve EMG monitoring and BAER. Audiogram documented. Lateral park-bench position.',
    brain: { category: 'tumor', region: 'skull-base', laterality: 'left', lesionLocation: 'Left cerebellopontine angle / internal auditory canal', lesionSizeMm: 24, symptoms: ['Progressive left hearing loss', 'Tinnitus', 'Mild imbalance'], imagingFindings: 'MRI: 24 mm enhancing CPA mass with IAC extension, brainstem contact, no hydrocephalus.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Left VIII: profound SNHL. VII intact (HB I).', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Retrosigmoid', grading: [{ system: 'Koos', value: '3' }, { system: 'House-Brackmann (pre)', value: 'I' }] },
    complications: [{ date: '2025-12-19', description: 'Postoperative left facial weakness House-Brackmann III', severity: 'moderate', management: 'Eye care, physiotherapy; improved to HB II at 6 months', resolved: false }],
  },
  // 8
  {
    pt: 9, type: 'brain', cat: 'brain', hosp: 2, priority: 'urgent', status: 'completed', created: '2026-05-30', date: '2026-06-02', outcome: 'improved', duration: 75,
    dx: 'Bilateral chronic subdural haematoma', proc: 'Bilateral burr-hole drainage of chronic subdural haematomas with subdural drains',
    indication: 'Progressive confusion and gait disturbance in an anticoagulated patient; bilateral collections with mass effect.',
    findings: 'Bilateral hypodense collections, 18 mm right and 12 mm left.',
    preop: 'Warfarin reversed (INR 1.2 on day of surgery). Cardiology advised restart in 4 weeks.',
    brain: { category: 'hemorrhage', region: 'parietal', laterality: 'bilateral', lesionLocation: 'Bilateral fronto-parietal convexity', lesionSizeMm: 18, symptoms: ['Confusion', 'Unsteady gait', 'Headache'], imagingFindings: 'CT: bilateral chronic subdural collections, right 18 mm, left 12 mm, minimal midline shift.', gcs: { eye: 4, verbal: 4, motor: 6 }, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'Mild left drift', sensoryDeficit: 'None', approach: 'Two burr holes per side', grading: [{ system: 'Markwalder', value: '2' }] },
  },
  // 9
  {
    pt: 10, type: 'spine', cat: 'spine', hosp: 4, priority: 'elective', status: 'completed', created: '2026-02-24', date: '2026-03-26', outcome: 'improved', duration: 200,
    dx: 'Intradural extramedullary meningioma T7', proc: 'T6–T8 laminectomy and microsurgical resection of intradural meningioma',
    indication: 'Progressive spastic paraparesis and sensory level at T8.',
    findings: 'Dorsolateral intradural extramedullary enhancing lesion at T7 compressing the cord.',
    preop: 'Latex-free theatre. Neuromonitoring (MEP/SSEP). Intraoperative ultrasound.',
    spine: { category: 'tumor', region: 'thoracic', levels: ['T7'], laterality: 'left', symptoms: ['Progressive leg stiffness', 'Numbness below the chest', 'Urinary urgency'], motor: { rightUpper: 5, leftUpper: 5, rightLower: 4, leftLower: 3 }, sensory: 'Sensory level T8', reflexes: 'Hyperreflexic lower limbs, clonus left', bowelBladder: 'Urgency', painScore: 3, functionalLimitation: 'Walks with a stick', imagingFindings: 'MRI: 18 mm dural-based enhancing intradural extramedullary lesion at T7, cord displaced to the right.', approach: 'Posterior midline, laminectomy', asiaGrade: 'D' },
  },
  // 10 — Emmanuel Shayo GBM
  {
    pt: 11, type: 'brain', cat: 'brain', hosp: 0, priority: 'urgent', status: 'completed', created: '2026-03-05', date: '2026-03-20', outcome: 'stable', duration: 260,
    dx: 'Glioblastoma, left temporal (WHO grade 4, IDH-wildtype)', proc: 'Left temporal craniotomy and 5-ALA fluorescence-guided resection',
    indication: 'Ring-enhancing left temporal mass with expressive dysphasia and raised intracranial pressure.',
    findings: 'Necrotic enhancing mass in the left anterior temporal lobe with surrounding oedema.',
    preop: 'Dexamethasone. Language mapping not possible (awake not tolerated) — anterior temporal approach sparing Wernicke area by navigation.',
    brain: { category: 'tumor', region: 'temporal', laterality: 'left', lesionLocation: 'Left anterior temporal lobe', lesionSizeMm: 46, symptoms: ['Expressive dysphasia', 'Headache', 'Memory impairment'], imagingFindings: 'MRI: 46 mm ring-enhancing left temporal mass with central necrosis, extensive vasogenic oedema, 6 mm midline shift.', gcs: { eye: 4, verbal: 4, motor: 6 }, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'Mild right pronator drift', sensoryDeficit: 'None', approach: 'Left temporal craniotomy, 5-ALA guided', grading: [{ system: 'WHO CNS5', value: 'Grade 4' }, { system: 'KPS', value: '70' }] },
  },
  // 11 — Zainab Omari pituitary
  {
    pt: 12, type: 'brain', cat: 'brain', hosp: 1, priority: 'elective', status: 'completed', created: '2026-06-12', date: '2026-07-09', outcome: 'improved', duration: 180,
    dx: 'Non-functioning pituitary macroadenoma with chiasmal compression', proc: 'Endoscopic endonasal transsphenoidal resection of pituitary adenoma',
    indication: 'Bitemporal hemianopia with a 26 mm sellar/suprasellar mass elevating the optic chiasm.',
    findings: 'Soft, suckable adenoma with suprasellar extension; chiasm decompressed.',
    preop: 'Endocrine work-up: hypogonadism, normal cortisol. ENT joint procedure. Perioperative hydrocortisone.',
    brain: { category: 'tumor', region: 'sellar', laterality: 'midline', lesionLocation: 'Sella turcica with suprasellar extension', lesionSizeMm: 26, symptoms: ['Bitemporal visual field loss', 'Amenorrhoea', 'Headache'], imagingFindings: 'MRI: 26 mm sellar mass with suprasellar extension, chiasm draped over the lesion, Knosp grade 1.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Bitemporal hemianopia (II)', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Endoscopic endonasal transsphenoidal', grading: [{ system: 'Knosp', value: '1' }] },
    complications: [{ date: '2026-07-11', description: 'Transient diabetes insipidus', severity: 'minor', management: 'Desmopressin for 5 days; resolved', resolved: true }],
  },
  // 12
  {
    pt: 13, type: 'spine', cat: 'spine', hosp: 5, priority: 'elective', status: 'completed', created: '2026-04-18', date: '2026-05-21', outcome: 'improved', duration: 90,
    dx: 'L5/S1 right paracentral disc herniation with S1 radiculopathy', proc: 'L5/S1 right microdiscectomy',
    indication: 'Right S1 sciatica for 10 weeks, failed conservative treatment.', findings: 'Sequestrated fragment compressing the right S1 root.', preop: 'Routine.',
    spine: { category: 'disc-herniation', region: 'lumbar', levels: ['L5/S1'], laterality: 'right', symptoms: ['Right posterior leg pain to the sole', 'Calf weakness'], motor: { rightUpper: 5, leftUpper: 5, rightLower: 4, leftLower: 5 }, sensory: 'Reduced right S1 dermatome', reflexes: 'Right ankle jerk absent', bowelBladder: 'Normal', painScore: 7, functionalLimitation: 'Unable to drive', imagingFindings: 'MRI: right paracentral L5/S1 extrusion with sequestration.', approach: 'Posterior, right-sided microsurgical', odiScore: 48, asiaGrade: 'E' },
  },
  // 13
  {
    pt: 14, type: 'spine', cat: 'spine', hosp: 1, priority: 'elective', status: 'completed', created: '2026-07-01', date: '2026-08-06', outcome: 'improved', duration: 120,
    dx: 'C6/7 disc prolapse with left C7 radiculopathy', proc: 'C6/7 anterior cervical discectomy and fusion',
    indication: 'Left C7 radicular pain and triceps weakness for 4 months.', findings: 'Left posterolateral disc protrusion at C6/7.', preop: 'Hypothyroidism controlled. Codeine allergy — alternative analgesia.',
    spine: { category: 'disc-herniation', region: 'cervical', levels: ['C6/7'], laterality: 'left', symptoms: ['Left arm pain to middle finger', 'Triceps weakness'], motor: { rightUpper: 5, leftUpper: 4, rightLower: 5, leftLower: 5 }, sensory: 'Reduced left C7', reflexes: 'Left triceps jerk reduced', bowelBladder: 'Normal', painScore: 7, functionalLimitation: 'Difficulty with overhead tasks', imagingFindings: 'MRI: left posterolateral C6/7 disc protrusion with foraminal narrowing.', approach: 'Anterior cervical', instrumentation: 'PEEK cage and plate', odiScore: 36, asiaGrade: 'E' },
  },
  // 14
  {
    pt: 15, type: 'brain', cat: 'brain', hosp: 2, priority: 'emergency', status: 'completed', created: '2026-09-02', date: '2026-09-02', outcome: 'improved', duration: 110,
    dx: 'Compound depressed skull fracture, right parietal', proc: 'Elevation of depressed skull fracture, debridement and dural repair',
    indication: 'Assault with a blunt object; compound depressed fracture with underlying dural laceration.', findings: 'Comminuted fragments depressed 12 mm with a small dural tear and contused cortex.', preop: 'Tetanus and antibiotics in ED. GCS 14.',
    brain: { category: 'trauma', region: 'parietal', laterality: 'right', lesionLocation: 'Right parietal bone', lesionSizeMm: 12, symptoms: ['Scalp laceration', 'Headache', 'Mild confusion'], imagingFindings: 'CT: compound depressed right parietal fracture, 12 mm depression, small underlying contusion, pneumocephalus.', gcs: { eye: 4, verbal: 4, motor: 6 }, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Local scalp flap over fracture', grading: [{ system: 'GCS on arrival', value: '14' }] },
  },
  // 15
  {
    pt: 16, type: 'spine', cat: 'spine', hosp: 3, priority: 'elective', status: 'completed', created: '2026-01-30', date: '2026-03-12', outcome: 'improved', duration: 230,
    dx: 'L4/L5 degenerative spondylolisthesis (Meyerding grade I) with stenosis', proc: 'L4/L5 transforaminal lumbar interbody fusion (TLIF) with pedicle screw fixation',
    indication: 'Mechanical back pain and neurogenic claudication with dynamic instability.', findings: 'Grade I slip with 4 mm translation on flexion-extension.', preop: 'Osteoporosis — DEXA T-score −2.6; cement-augmented screws considered. NSAID allergy. Prior hip replacement.',
    spine: { category: 'degenerative', region: 'lumbar', levels: ['L4/L5'], laterality: 'bilateral', symptoms: ['Back pain', 'Bilateral leg pain on walking'], motor: fullPower, sensory: 'Intact', reflexes: 'Normal', bowelBladder: 'Normal', painScore: 7, functionalLimitation: 'Walking 150 m', imagingFindings: 'MRI/X-ray: grade I L4/L5 spondylolisthesis, severe central stenosis, instability on dynamic films.', approach: 'Posterior midline', instrumentation: 'L4/L5 pedicle screws (cement-augmented), TLIF cage 10 mm', odiScore: 58, asiaGrade: 'E' },
    complications: [{ date: '2026-03-15', description: 'Urinary tract infection', severity: 'minor', management: 'Oral antibiotics', resolved: true }],
  },
  // 16 — Ibrahim Salum ruptured ACom
  {
    pt: 17, type: 'brain', cat: 'neurovascular', hosp: 0, priority: 'emergency', status: 'completed', created: '2026-06-27', date: '2026-06-28', outcome: 'stable', duration: 280,
    dx: 'Aneurysmal subarachnoid haemorrhage from ruptured anterior communicating artery aneurysm (WFNS 2, Fisher 3)', proc: 'Right pterional craniotomy and clipping of anterior communicating artery aneurysm',
    indication: 'Thunderclap headache with SAH; 6 mm ACom aneurysm not favourable for coiling (wide neck, A2 incorporation).', findings: 'Anteriorly projecting ACom aneurysm with intraoperative rupture controlled with temporary clipping.', preop: 'Nimodipine. EVD inserted on admission for acute hydrocephalus. Blood pressure control.',
    brain: { category: 'aneurysm', region: 'frontal', laterality: 'midline', lesionLocation: 'Anterior communicating artery', lesionSizeMm: 6, symptoms: ['Thunderclap headache', 'Neck stiffness', 'Drowsiness'], imagingFindings: 'CT: diffuse SAH, Fisher 3, mild hydrocephalus. CTA: 6 mm ACom aneurysm projecting anteriorly.', gcs: { eye: 3, verbal: 4, motor: 6 }, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Right pterional', grading: [{ system: 'WFNS', value: '2' }, { system: 'Modified Fisher', value: '3' }, { system: 'Hunt & Hess', value: 'II' }] },
    complications: [{ date: '2026-07-04', description: 'Delayed cerebral ischaemia from vasospasm (left ACA territory) with transient right leg weakness', severity: 'major', management: 'Induced hypertension, intra-arterial nimodipine; partial recovery', resolved: false }],
  },
  // 17
  {
    pt: 18, type: 'brain', cat: 'brain', hosp: 1, priority: 'elective', status: 'completed', created: '2026-02-10', date: '2026-03-04', outcome: 'improved', duration: 195,
    dx: 'Right parietal convexity meningioma', proc: 'Right parietal craniotomy and Simpson grade I excision of meningioma',
    indication: 'Focal sensory seizures with a 35 mm enhancing dural-based mass.', findings: 'Firm, well-circumscribed dural-based tumour with an arachnoid plane.', preop: 'Levetiracetam. Navigation. Sagittal sinus not involved.',
    brain: { category: 'tumor', region: 'parietal', laterality: 'right', lesionLocation: 'Right parietal convexity', lesionSizeMm: 35, symptoms: ['Left-sided sensory seizures', 'Headache'], imagingFindings: 'MRI: 35 mm homogeneously enhancing dural-based mass with dural tail, mild oedema.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'None', sensoryDeficit: 'Mild left cortical sensory loss', approach: 'Right parietal craniotomy', grading: [{ system: 'Simpson', value: 'I' }, { system: 'WHO', value: 'Grade 1' }] },
  },
  // 18
  {
    pt: 19, type: 'spine', cat: 'spine', hosp: 3, priority: 'emergency', status: 'completed', created: '2026-07-19', date: '2026-07-20', outcome: 'improved', duration: 240,
    dx: 'L1 burst fracture (AO A4) with incomplete conus injury', proc: 'T12–L2 posterior instrumented fusion and decompression',
    indication: 'Fall from height; 60% canal compromise with ASIA D deficit.', findings: 'Retropulsed fragment compressing the conus; posterior ligamentous complex intact.', preop: 'Trauma pathway; log-roll precautions. Neuromonitoring.',
    spine: { category: 'trauma', region: 'lumbar', levels: ['L1'], laterality: 'midline', symptoms: ['Severe back pain', 'Bilateral leg weakness', 'Perineal numbness'], motor: { rightUpper: 5, leftUpper: 5, rightLower: 3, leftLower: 4 }, sensory: 'Reduced L2–S1 bilaterally, saddle hypoaesthesia', reflexes: 'Reduced lower limb reflexes', bowelBladder: 'Urinary retention (catheterised)', painScore: 9, functionalLimitation: 'Bed-bound', imagingFindings: 'CT: L1 burst fracture, 60% canal compromise, 20° kyphosis. MRI: conus oedema.', approach: 'Posterior midline', instrumentation: 'T12 and L2 pedicle screws, rods', asiaGrade: 'D' },
  },
  // 19 — trigeminal MVD (other)
  {
    pt: 20, type: 'brain', cat: 'other', hosp: 1, priority: 'elective', status: 'completed', created: '2026-05-06', date: '2026-06-11', outcome: 'improved', duration: 170,
    dx: 'Classical trigeminal neuralgia, right V2/V3, with neurovascular conflict', proc: 'Right retrosigmoid microvascular decompression of the trigeminal nerve',
    indication: 'Medically refractory trigeminal neuralgia with SCA loop compressing the root entry zone.', findings: 'Superior cerebellar artery loop indenting the trigeminal nerve at the REZ.', preop: 'Carbamazepine continued. BAER monitoring.',
    brain: { category: 'other', region: 'brainstem', laterality: 'right', lesionLocation: 'Right trigeminal root entry zone', symptoms: ['Paroxysmal right facial pain', 'Trigger zones on chewing'], imagingFindings: 'MRI FIESTA: SCA loop in contact with right trigeminal nerve REZ.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'V: trigger zones, no sensory loss', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Retrosigmoid keyhole', grading: [{ system: 'BNI pain scale', value: 'V' }] },
  },
  // 20 — George Lyimo haemangioblastoma
  {
    pt: 21, type: 'brain', cat: 'brain', hosp: 0, priority: 'elective', status: 'completed', created: '2026-04-29', date: '2026-05-28', outcome: 'improved', duration: 230,
    dx: 'Cerebellar haemangioblastoma (cystic with mural nodule)', proc: 'Suboccipital craniotomy and resection of haemangioblastoma',
    indication: 'Obstructive hydrocephalus and ataxia from a cystic cerebellar lesion.', findings: 'Large cyst with a vascular mural nodule in the right cerebellar hemisphere.', preop: 'VP shunt inserted earlier for hydrocephalus. VHL screening sent.',
    brain: { category: 'tumor', region: 'cerebellum', laterality: 'right', lesionLocation: 'Right cerebellar hemisphere', lesionSizeMm: 42, symptoms: ['Ataxia', 'Headache', 'Vomiting'], imagingFindings: 'MRI: 42 mm cyst with 14 mm enhancing mural nodule, fourth ventricle compressed.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'Right-sided dysmetria', sensoryDeficit: 'None', approach: 'Midline suboccipital', grading: [{ system: 'KPS', value: '80' }] },
  },
  // 21
  {
    pt: 22, type: 'spine', cat: 'spine', hosp: 5, priority: 'elective', status: 'completed', created: '2026-03-23', date: '2026-04-30', outcome: 'stable', duration: 190,
    dx: 'Multilevel cervical spondylotic myelopathy C4–C6', proc: 'C4–C6 open-door laminoplasty',
    indication: 'Moderate myelopathy (mJOA 11) with multilevel stenosis and preserved lordosis.', findings: 'Multilevel posterior compression from ligamentum flavum and facet hypertrophy.', preop: 'Diabetes control. Neuromonitoring.',
    spine: { category: 'cord-compression', region: 'cervical', levels: ['C4/5', 'C5/6'], laterality: 'bilateral', symptoms: ['Hand numbness', 'Gait difficulty'], motor: { rightUpper: 4, leftUpper: 4, rightLower: 4, leftLower: 4 }, sensory: 'Glove distribution hypoaesthesia', reflexes: 'Hyperreflexia, Hoffmann positive', bowelBladder: 'Normal', painScore: 4, functionalLimitation: 'Buttoning difficult', imagingFindings: 'MRI: multilevel cord compression C4–C6 with T2 signal change at C5.', approach: 'Posterior', instrumentation: 'Laminoplasty plates C4–C6', asiaGrade: 'D' },
  },
  // 22
  {
    pt: 23, type: 'spine', cat: 'spine', hosp: 4, priority: 'emergency', status: 'completed', created: '2026-08-22', date: '2026-08-23', outcome: 'improved', duration: 150,
    dx: 'Spinal epidural abscess T10–T12 with evolving paraparesis', proc: 'T10–T12 laminectomy and drainage of epidural abscess',
    indication: 'Fever, back pain and rapidly progressive leg weakness with MRI-confirmed abscess.', findings: 'Purulent dorsal epidural collection; cultures grew Staphylococcus aureus.', preop: 'Blood cultures, IV ceftriaxone switched to flucloxacillin on sensitivities.',
    spine: { category: 'infection', region: 'thoracic', levels: ['T10', 'T11', 'T12'], laterality: 'midline', symptoms: ['Fever', 'Severe back pain', 'Leg weakness over 48 h'], motor: { rightUpper: 5, leftUpper: 5, rightLower: 3, leftLower: 3 }, sensory: 'Sensory level T11', reflexes: 'Brisk, clonus', bowelBladder: 'Retention', painScore: 9, functionalLimitation: 'Unable to stand', imagingFindings: 'MRI: dorsal epidural collection T10–T12 with cord compression and rim enhancement.', approach: 'Posterior midline', asiaGrade: 'C' },
  },
  // 23 — colloid cyst
  {
    pt: 24, type: 'brain', cat: 'brain', hosp: 0, priority: 'urgent', status: 'completed', created: '2026-09-15', date: '2026-09-24', outcome: 'improved', duration: 150,
    dx: 'Colloid cyst of the third ventricle with obstructive hydrocephalus', proc: 'Endoscopic transventricular resection of colloid cyst',
    indication: 'Intermittent severe headaches with a 12 mm colloid cyst and ventriculomegaly.', findings: 'Cyst at the foramen of Monro; complete removal including capsule.', preop: 'Right frontal endoscopic trajectory planned.',
    brain: { category: 'other', region: 'ventricular', laterality: 'midline', lesionLocation: 'Anterior third ventricle at the foramen of Monro', lesionSizeMm: 12, symptoms: ['Positional headaches', 'Nausea', 'Memory lapses'], imagingFindings: 'MRI/CT: 12 mm hyperdense third-ventricular cyst, dilated lateral ventricles.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Right frontal endoscopic', grading: [] },
  },
  // 24
  {
    pt: 25, type: 'spine', cat: 'spine', hosp: 1, priority: 'elective', status: 'completed', created: '2025-12-15', date: '2025-12-30', outcome: 'improved', duration: 85,
    dx: 'L3/L4 disc herniation with L4 radiculopathy', proc: 'L3/L4 microdiscectomy',
    indication: 'Right L4 radiculopathy with quadriceps weakness.', findings: 'Right paracentral L3/L4 extrusion.', preop: 'Hypertension and gout controlled.',
    spine: { category: 'disc-herniation', region: 'lumbar', levels: ['L3/L4'], laterality: 'right', symptoms: ['Right anterior thigh pain', 'Knee buckling'], motor: { rightUpper: 5, leftUpper: 5, rightLower: 4, leftLower: 5 }, sensory: 'Reduced right L4', reflexes: 'Right knee jerk reduced', bowelBladder: 'Normal', painScore: 7, functionalLimitation: 'Stairs difficult', imagingFindings: 'MRI: right paracentral L3/L4 disc extrusion.', approach: 'Posterior right microsurgical', odiScore: 44, asiaGrade: 'E' },
  },
  // 25 — AVM
  {
    pt: 26, type: 'brain', cat: 'neurovascular', hosp: 0, priority: 'elective', status: 'completed', created: '2026-05-20', date: '2026-07-16', outcome: 'improved', duration: 330,
    dx: 'Left parietal arteriovenous malformation, Spetzler–Martin grade II', proc: 'Left parietal craniotomy and microsurgical resection of AVM',
    indication: 'Seizures with a 2.5 cm non-eloquent AVM with superficial venous drainage.', findings: 'Compact nidus fed by angular artery branches, draining to a cortical vein.', preop: 'Preoperative embolisation of the dominant feeder 48 h before surgery. Intraoperative ICG. Lamotrigine continued.',
    brain: { category: 'avm', region: 'parietal', laterality: 'left', lesionLocation: 'Left inferior parietal lobule', lesionSizeMm: 25, symptoms: ['Focal seizures', 'Headache'], imagingFindings: 'DSA: 25 mm nidus, MCA angular branch feeders, superficial drainage. No deep drainage.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Left parietal craniotomy', grading: [{ system: 'Spetzler–Martin', value: 'II' }] },
  },
  // 26 — Chiari (combined / craniovertebral)
  {
    pt: 27, type: 'combined', cat: 'brain', hosp: 1, priority: 'elective', status: 'completed', created: '2026-06-05', date: '2026-06-25', outcome: 'improved', duration: 160,
    dx: 'Chiari I malformation with cervical syringomyelia', proc: 'Foramen magnum decompression with C1 laminectomy and duraplasty',
    indication: 'Occipital headaches on Valsalva and dissociated sensory loss with an expanding syrinx.', findings: 'Tonsillar descent 9 mm with crowded foramen magnum; pulsatile tonsils after dural opening.', preop: 'Prone with head fixed in neutral flexion. Neuromonitoring.',
    brain: { category: 'other', region: 'brainstem', laterality: 'midline', lesionLocation: 'Craniovertebral junction', lesionSizeMm: 9, symptoms: ['Valsalva-induced occipital headache', 'Cape-distribution sensory loss', 'Hand weakness'], imagingFindings: 'MRI: tonsillar descent 9 mm, syrinx C2–C7 (max 6 mm).', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'Mild intrinsic hand weakness', sensoryDeficit: 'Dissociated sensory loss C4–T2', approach: 'Midline suboccipital' },
    spine: { category: 'cord-compression', region: 'craniovertebral', levels: ['C1'], laterality: 'midline', symptoms: ['Cape-distribution sensory loss'], motor: { rightUpper: 4, leftUpper: 4, rightLower: 5, leftLower: 5 }, sensory: 'Dissociated loss C4–T2', reflexes: 'Normal', bowelBladder: 'Normal', painScore: 5, functionalLimitation: 'Reduced grip', imagingFindings: 'Syrinx C2–C7', approach: 'Posterior', asiaGrade: 'D' },
  },
  // 27 — cancelled
  {
    pt: 28, type: 'spine', cat: 'spine', hosp: 3, priority: 'elective', status: 'cancelled', created: '2025-11-18', date: '2026-01-15',
    dx: 'Lumbar spinal stenosis L4/L5', proc: 'L4/L5 decompressive laminectomy',
    indication: 'Neurogenic claudication.', findings: 'Moderate central stenosis L4/L5.', preop: 'CKD stage 3 — nephrology review requested.', note: 'Cancelled: patient elected conservative management after anaesthetic risk discussion (CKD).',
    spine: { category: 'stenosis', region: 'lumbar', levels: ['L4/L5'], laterality: 'bilateral', symptoms: ['Leg heaviness on walking'], motor: fullPower, sensory: 'Intact', reflexes: 'Normal', bowelBladder: 'Normal', painScore: 5, functionalLimitation: 'Walking 200 m', imagingFindings: 'MRI: moderate central stenosis L4/L5.', approach: 'Posterior midline', odiScore: 38, asiaGrade: 'E' },
  },
  // 28 — ICH, deteriorated
  {
    pt: 29, type: 'brain', cat: 'brain', hosp: 2, priority: 'emergency', status: 'completed', created: '2026-07-08', date: '2026-07-08', outcome: 'deteriorated', duration: 170,
    dx: 'Hypertensive intracerebral haemorrhage, right basal ganglia (55 mL) with intraventricular extension', proc: 'Right fronto-temporal craniotomy and evacuation of intracerebral haematoma',
    indication: 'Deteriorating GCS (9) with a 55 mL haematoma and midline shift.', findings: 'Large putaminal haematoma evacuated via transsylvian-transinsular route.', preop: 'Blood pressure lowered to <160 systolic. Platelets normal.',
    brain: { category: 'hemorrhage', region: 'temporal', laterality: 'right', lesionLocation: 'Right putamen / basal ganglia', lesionSizeMm: 52, symptoms: ['Sudden left hemiplegia', 'Reduced consciousness', 'Vomiting'], imagingFindings: 'CT: 55 mL right basal ganglia haemorrhage, IVH, 9 mm midline shift.', gcs: { eye: 2, verbal: 2, motor: 5 }, pupils: { left: { size: 3, reaction: 'brisk' }, right: { size: 4, reaction: 'sluggish' } }, cranialNerves: 'Left facial weakness (UMN)', motorDeficit: 'Dense left hemiplegia', sensoryDeficit: 'Not assessable', approach: 'Right fronto-temporal transsylvian', grading: [{ system: 'ICH score', value: '3' }] },
    complications: [{ date: '2026-07-14', description: 'Ventilator-associated pneumonia', severity: 'major', management: 'IV antibiotics, tracheostomy day 10', resolved: true }],
  },
  // 29
  {
    pt: 30, type: 'spine', cat: 'spine', hosp: 4, priority: 'elective', status: 'completed', created: '2026-03-12', date: '2026-04-02', outcome: 'improved', duration: 100,
    dx: 'C5/6 foraminal stenosis with right C6 radiculopathy', proc: 'Posterior cervical foraminotomy C5/6 (right)',
    indication: 'Right C6 radiculopathy refractory to gabapentin and physiotherapy.', findings: 'Foraminal osteophyte compressing the exiting right C6 root.', preop: 'Routine.',
    spine: { category: 'disc-herniation', region: 'cervical', levels: ['C5/6'], laterality: 'right', symptoms: ['Right arm pain to thumb', 'Biceps weakness'], motor: { rightUpper: 4, leftUpper: 5, rightLower: 5, leftLower: 5 }, sensory: 'Reduced right C6', reflexes: 'Right biceps jerk reduced', bowelBladder: 'Normal', painScore: 6, functionalLimitation: 'Night pain', imagingFindings: 'MRI: right C5/6 foraminal stenosis from uncovertebral osteophyte.', approach: 'Posterior keyhole foraminotomy', asiaGrade: 'E' },
  },
  // 30 — medulloblastoma
  {
    pt: 31, type: 'brain', cat: 'brain', hosp: 3, priority: 'urgent', status: 'completed', created: '2026-02-16', date: '2026-02-27', outcome: 'improved', duration: 300,
    dx: 'Posterior fossa medulloblastoma (fourth ventricle)', proc: 'Midline suboccipital craniotomy and telovelar resection of fourth ventricular tumour',
    indication: 'Raised ICP with a fourth ventricular mass after ETV.', findings: 'Soft, vascular tumour filling the fourth ventricle arising from the inferior vermis; gross total resection.', preop: 'Dexamethasone. ETV performed on 2026-02-20. Spinal MRI and CSF cytology staged.',
    brain: { category: 'tumor', region: 'cerebellum', laterality: 'midline', lesionLocation: 'Fourth ventricle / inferior vermis', lesionSizeMm: 38, symptoms: ['Morning headache', 'Vomiting', 'Truncal ataxia'], imagingFindings: 'MRI: 38 mm heterogeneously enhancing fourth ventricular mass, obstructive hydrocephalus.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Bilateral VI palsy (raised ICP)', motorDeficit: 'Truncal ataxia', sensoryDeficit: 'None', approach: 'Midline suboccipital, telovelar', grading: [{ system: 'Chang staging', value: 'M0' }] },
    complications: [{ date: '2026-02-28', description: 'Posterior fossa syndrome (cerebellar mutism)', severity: 'moderate', management: 'Speech therapy; resolved over 6 weeks', resolved: true }],
  },
  // 31 — postponed deformity
  {
    pt: 32, type: 'spine', cat: 'spine', hosp: 5, priority: 'elective', status: 'postponed', created: '2026-04-08', date: '2026-12-03',
    dx: 'Degenerative lumbar scoliosis with foraminal stenosis L3–L5', proc: 'L2–S1 posterior instrumented correction and fusion',
    indication: 'Progressive deformity (Cobb 32°) with bilateral radiculopathy.', findings: 'Coronal curve with lateral listhesis at L3/4.', preop: 'Bone density optimisation — surgery deferred pending teriparatide course.', note: 'Postponed from 2026-09-10: bone density optimisation with endocrinology.',
    spine: { category: 'deformity', region: 'lumbar', levels: ['L2', 'L3', 'L4', 'L5', 'S1'], laterality: 'bilateral', symptoms: ['Back pain', 'Bilateral leg pain', 'Trunk shift'], motor: fullPower, sensory: 'Intact', reflexes: 'Normal', bowelBladder: 'Normal', painScore: 7, functionalLimitation: 'Walking 100 m', imagingFindings: 'X-ray: lumbar Cobb 32°, lateral listhesis L3/4. MRI: foraminal stenosis L3–L5.', approach: 'Posterior', instrumentation: 'L2–S1 pedicle screws, rods, TLIF L4/5', odiScore: 60, asiaGrade: 'E' },
  },
  // 32 — EDH
  {
    pt: 33, type: 'brain', cat: 'brain', hosp: 2, priority: 'emergency', status: 'completed', created: '2026-09-28', date: '2026-09-28', outcome: 'improved', duration: 95,
    dx: 'Acute left temporal extradural haematoma', proc: 'Left temporal craniotomy and evacuation of extradural haematoma',
    indication: 'Lucid interval then deterioration to GCS 10; 25 mm EDH with midline shift.', findings: 'Middle meningeal artery bleed under a temporal fracture.', preop: 'Emergency. Intubated in ED.',
    brain: { category: 'trauma', region: 'temporal', laterality: 'left', lesionLocation: 'Left temporal extradural space', lesionSizeMm: 25, symptoms: ['Deteriorating consciousness', 'Right hemiparesis'], imagingFindings: 'CT: 25 mm biconvex left temporal EDH, 8 mm midline shift, temporal bone fracture.', gcs: { eye: 2, verbal: 3, motor: 5 }, pupils: { left: { size: 5, reaction: 'sluggish' }, right: { size: 3, reaction: 'brisk' } }, cranialNerves: 'Left III partial', motorDeficit: 'Right hemiparesis', sensoryDeficit: 'Not assessable', approach: 'Left temporal craniotomy', grading: [{ system: 'GCS on arrival', value: '10' }] },
  },
  // 33 — metastasis
  {
    pt: 34, type: 'spine', cat: 'spine', hosp: 0, priority: 'urgent', status: 'completed', created: '2026-08-01', date: '2026-08-04', outcome: 'stable', duration: 260,
    dx: 'Metastatic breast carcinoma T6 with epidural spinal cord compression', proc: 'T6 posterolateral decompression and T4–T8 posterior instrumented stabilisation',
    indication: 'Progressive paraparesis (ASIA C) with ESCC grade 2, SINS 11 (potentially unstable).', findings: 'Epidural tumour from the vertebral body with cord compression; separation surgery performed.', preop: 'Oncology MDT. Dexamethasone. Post-operative SBRT planned.',
    spine: { category: 'tumor', region: 'thoracic', levels: ['T6'], laterality: 'midline', symptoms: ['Mid-back pain', 'Leg weakness', 'Numbness below the chest'], motor: { rightUpper: 5, leftUpper: 5, rightLower: 3, leftLower: 3 }, sensory: 'Sensory level T7', reflexes: 'Hyperreflexic', bowelBladder: 'Constipation, urgency', painScore: 8, functionalLimitation: 'Wheelchair', imagingFindings: 'MRI: T6 vertebral metastasis with epidural extension, ESCC grade 2.', approach: 'Posterior', instrumentation: 'T4, T5, T7, T8 pedicle screws', asiaGrade: 'C' },
  },
  // 34
  {
    pt: 35, type: 'spine', cat: 'spine', hosp: 1, priority: 'elective', status: 'completed', created: '2026-05-13', date: '2026-06-04', outcome: 'improved', duration: 90,
    dx: 'L4/L5 disc herniation with left L5 radiculopathy', proc: 'L4/L5 left microdiscectomy',
    indication: 'Left L5 sciatica for 3 months.', findings: 'Left paracentral extrusion.', preop: 'Diabetes control.',
    spine: { category: 'disc-herniation', region: 'lumbar', levels: ['L4/L5'], laterality: 'left', symptoms: ['Left leg pain', 'Foot numbness'], motor: { rightUpper: 5, leftUpper: 5, rightLower: 5, leftLower: 4 }, sensory: 'Reduced left L5', reflexes: 'Normal', bowelBladder: 'Normal', painScore: 7, functionalLimitation: 'Unable to work', imagingFindings: 'MRI: left paracentral L4/L5 extrusion.', approach: 'Posterior left microsurgical', odiScore: 50, asiaGrade: 'E' },
  },
  // 35 — epidermoid
  {
    pt: 36, type: 'brain', cat: 'brain', hosp: 0, priority: 'elective', status: 'completed', created: '2026-06-20', date: '2026-07-23', outcome: 'improved', duration: 290,
    dx: 'Cerebellopontine angle epidermoid cyst (right)', proc: 'Right retrosigmoid craniotomy and resection of epidermoid cyst',
    indication: 'Trigeminal neuralgia-like pain and hemifacial spasm from a CPA epidermoid.', findings: 'Pearly cyst insinuating around cranial nerves V–VIII; near-total resection, capsule adherent to the brainstem left.', preop: 'Cranial nerve monitoring.',
    brain: { category: 'tumor', region: 'skull-base', laterality: 'right', lesionLocation: 'Right cerebellopontine angle', lesionSizeMm: 30, symptoms: ['Right facial pain', 'Hemifacial spasm', 'Imbalance'], imagingFindings: 'MRI: 30 mm CPA lesion, DWI restriction, no enhancement.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'V: trigger zones; VII: spasm', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Retrosigmoid', grading: [] },
  },
  // 36 — CSDH with recurrence
  {
    pt: 37, type: 'brain', cat: 'brain', hosp: 2, priority: 'urgent', status: 'completed', created: '2026-09-10', date: '2026-09-11', outcome: 'improved', duration: 55,
    dx: 'Left chronic subdural haematoma', proc: 'Left burr-hole drainage of chronic subdural haematoma',
    indication: 'Headache, right-sided weakness and a 20 mm left CSDH.', findings: 'Motor-oil fluid under pressure.', preop: 'Thiamine. Alcohol withdrawal protocol.',
    brain: { category: 'hemorrhage', region: 'frontal', laterality: 'left', lesionLocation: 'Left fronto-parietal convexity', lesionSizeMm: 20, symptoms: ['Headache', 'Right-sided weakness', 'Dysphasia'], imagingFindings: 'CT: 20 mm left CSDH, 7 mm midline shift.', gcs: { eye: 4, verbal: 4, motor: 6 }, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'Right hemiparesis 4/5', sensoryDeficit: 'None', approach: 'Two burr holes', grading: [{ system: 'Markwalder', value: '2' }] },
  },
  // 37 — Veronica scheduled ACDF
  {
    pt: 38, type: 'spine', cat: 'spine', hosp: 3, priority: 'elective', status: 'scheduled', created: '2026-08-28', date: '2026-11-05',
    dx: 'C5/6 disc prolapse with right C6 radiculopathy', proc: 'C5/6 anterior cervical discectomy and fusion',
    indication: 'Persistent C6 radiculopathy with weakness despite 12 weeks of conservative care.', findings: 'Right posterolateral C5/6 protrusion.', preop: 'Asthma — avoid aspirin/NSAIDs. Pre-anaesthetic review booked.',
    spine: { category: 'disc-herniation', region: 'cervical', levels: ['C5/6'], laterality: 'right', symptoms: ['Right arm pain', 'Thumb numbness', 'Biceps weakness'], motor: { rightUpper: 4, leftUpper: 5, rightLower: 5, leftLower: 5 }, sensory: 'Reduced right C6', reflexes: 'Right biceps reduced', bowelBladder: 'Normal', painScore: 6, functionalLimitation: 'Sleep disturbance', imagingFindings: 'MRI: right posterolateral C5/6 disc protrusion.', approach: 'Anterior cervical', instrumentation: 'PEEK cage and plate', odiScore: 34, asiaGrade: 'E' },
  },
  // 38 — NPH shunt Charles
  {
    pt: 39, type: 'brain', cat: 'brain', hosp: 3, priority: 'elective', status: 'completed', created: '2026-07-25', date: '2026-08-13', outcome: 'improved', duration: 70,
    dx: 'Normal pressure hydrocephalus', proc: 'Ventriculoperitoneal shunt insertion (programmable valve)',
    indication: 'Gait and cognitive improvement after lumbar drain trial.', findings: 'Ventriculomegaly, Evans index 0.36.', preop: 'Tamsulosin continued. Prophylactic antibiotics.',
    brain: { category: 'hydrocephalus', region: 'ventricular', laterality: 'right', lesionLocation: 'Lateral ventricles', symptoms: ['Gait apraxia', 'Urinary incontinence', 'Cognitive decline'], imagingFindings: 'MRI: communicating hydrocephalus, Evans index 0.36.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Right frontal burr hole', grading: [{ system: 'MMSE', value: '22/30' }] },
  },
  // 39 — Hadija scheduled olfactory groove meningioma
  {
    pt: 40, type: 'brain', cat: 'brain', hosp: 0, priority: 'elective', status: 'scheduled', created: '2026-09-20', date: '2026-11-12',
    dx: 'Olfactory groove meningioma (48 mm)', proc: 'Bifrontal craniotomy and resection of olfactory groove meningioma',
    indication: 'Anosmia, personality change and early visual decline from a large anterior skull base meningioma.', findings: 'Large anterior skull base meningioma displacing both frontal lobes.', preop: 'Dexamethasone 2 weeks preop. Neuropsychology baseline. ENT joint repair of skull base if needed.',
    brain: { category: 'tumor', region: 'frontal', laterality: 'midline', lesionLocation: 'Anterior cranial fossa, olfactory groove', lesionSizeMm: 48, symptoms: ['Anosmia', 'Apathy and personality change', 'Blurred vision'], imagingFindings: 'MRI: 48 mm enhancing anterior skull base meningioma with bifrontal oedema, hyperostosis of the cribriform plate.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'I: anosmia; II: mild bilateral acuity reduction', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Bifrontal craniotomy', grading: [{ system: 'KPS', value: '80' }] },
  },
  // 40 — Robert Macha cervical fracture stage 1
  {
    pt: 41, type: 'spine', cat: 'spine', hosp: 3, priority: 'emergency', status: 'completed', created: '2026-10-05', date: '2026-10-06', outcome: 'stable', duration: 210,
    dx: 'C6/7 bilateral facet dislocation with incomplete spinal cord injury (ASIA C)', proc: 'Closed reduction, C6/7 ACDF with plating',
    indication: 'Road traffic collision with bilateral jumped facets at C6/7 and incomplete cord injury.', findings: 'Disc disruption at C6/7 with traumatic herniation; reduction achieved under traction.', preop: 'Spinal precautions, mean arterial pressure >85 mmHg. MRI before reduction.',
    spine: { category: 'trauma', region: 'cervical', levels: ['C6/7'], laterality: 'midline', symptoms: ['Neck pain', 'Weakness in all four limbs', 'Numbness below the shoulders'], motor: { rightUpper: 3, leftUpper: 3, rightLower: 2, leftLower: 2 }, sensory: 'Sensory level C7, sacral sparing present', reflexes: 'Areflexic (spinal shock)', bowelBladder: 'Retention', painScore: 8, functionalLimitation: 'Bed-bound', imagingFindings: 'CT: bilateral C6/7 facet dislocation, 50% anterolisthesis. MRI: cord contusion C6–C7, traumatic disc.', approach: 'Anterior cervical', instrumentation: 'C6/7 PEEK cage and plate', asiaGrade: 'C' },
  },
  // 41 — Pendo planned
  {
    pt: 42, type: 'spine', cat: 'spine', hosp: 5, priority: 'elective', status: 'planned', created: '2026-10-12',
    dx: 'L5/S1 disc herniation with right S1 radiculopathy', proc: 'L5/S1 right microdiscectomy',
    indication: 'Six weeks of right S1 sciatica; awaiting response to nerve root block before scheduling.', findings: 'Right paracentral L5/S1 protrusion.', preop: 'Nerve root block booked. Surgery to be scheduled if no response within 4 weeks.',
    spine: { category: 'disc-herniation', region: 'lumbar', levels: ['L5/S1'], laterality: 'right', symptoms: ['Right posterior leg pain'], motor: fullPower, sensory: 'Reduced right S1', reflexes: 'Right ankle jerk reduced', bowelBladder: 'Normal', painScore: 6, functionalLimitation: 'Prolonged sitting', imagingFindings: 'MRI: right paracentral L5/S1 protrusion abutting S1 root.', approach: 'Posterior right microsurgical', odiScore: 40, asiaGrade: 'E' },
  },
  // 42 — Stephen scheduled ependymoma
  {
    pt: 43, type: 'spine', cat: 'spine', hosp: 4, priority: 'elective', status: 'scheduled', created: '2026-10-18', date: '2026-11-20',
    dx: 'Intramedullary ependymoma C3–C5', proc: 'C3–C5 laminoplasty and microsurgical resection of intramedullary tumour',
    indication: 'Progressive quadriparesis and dissociated sensory loss with an enhancing intramedullary lesion.', findings: 'Centrally located intramedullary lesion with polar cysts.', preop: 'Neuromonitoring (MEP, SSEP, D-wave). Dexamethasone.',
    spine: { category: 'tumor', region: 'cervical', levels: ['C3', 'C4', 'C5'], laterality: 'midline', symptoms: ['Neck pain', 'Hand weakness', 'Gait difficulty'], motor: { rightUpper: 4, leftUpper: 4, rightLower: 4, leftLower: 4 }, sensory: 'Dissociated loss C4–C8', reflexes: 'Hyperreflexia lower limbs', bowelBladder: 'Normal', painScore: 5, functionalLimitation: 'Stairs with rail', imagingFindings: 'MRI: enhancing intramedullary lesion C3–C5 with rostral/caudal cysts and haemosiderin cap.', approach: 'Posterior midline myelotomy', instrumentation: 'Laminoplasty plates', asiaGrade: 'D' },
  },
  // 43 — Monica postponed
  {
    pt: 44, type: 'spine', cat: 'spine', hosp: 1, priority: 'elective', status: 'postponed', created: '2025-11-05', date: '2026-11-26',
    dx: 'Multilevel lumbar spinal stenosis L2–L5', proc: 'L2–L5 decompressive laminectomy',
    indication: 'Neurogenic claudication limiting walking to 50 m.', findings: 'Severe central stenosis at three levels.', preop: 'Awaiting cardiac clearance (abnormal stress test).', note: 'Postponed from 2025-12-10 pending cardiology review; new date provisional.',
    spine: { category: 'stenosis', region: 'lumbar', levels: ['L2/L3', 'L3/L4', 'L4/L5'], laterality: 'bilateral', symptoms: ['Bilateral leg pain on walking'], motor: fullPower, sensory: 'Intact', reflexes: 'Reduced ankle jerks', bowelBladder: 'Normal', painScore: 6, functionalLimitation: 'Walking 50 m', imagingFindings: 'MRI: severe central stenosis L2–L5.', approach: 'Posterior midline', odiScore: 54, asiaGrade: 'E' },
  },
  // 44 — Isaac planned cavernoma
  {
    pt: 45, type: 'brain', cat: 'neurovascular', hosp: 3, priority: 'elective', status: 'planned', created: '2026-10-20', date: '2026-12-02',
    dx: 'Right frontal cavernous malformation with a single seizure', proc: 'Right frontal craniotomy and resection of cavernoma',
    indication: 'Symptomatic cavernoma in a non-eloquent location after one generalised seizure.', findings: '14 mm popcorn lesion with haemosiderin rim.', preop: 'Levetiracetam. Navigation. Awaiting patient decision after counselling.',
    brain: { category: 'avm', region: 'frontal', laterality: 'right', lesionLocation: 'Right superior frontal gyrus', lesionSizeMm: 14, symptoms: ['Single generalised seizure'], imagingFindings: 'MRI SWI: 14 mm cavernous malformation with haemosiderin rim, no DVA.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Right frontal craniotomy', grading: [{ system: 'Zabramski', value: 'II' }] },
  },
  // ---- Additional / staged / reoperation cases ----
  // 45 — Daniel cranioplasty (reop of 2)
  {
    pt: 3, type: 'brain', cat: 'brain', hosp: 2, priority: 'elective', status: 'completed', created: '2026-05-20', date: '2026-07-02', outcome: 'improved', duration: 120, reop: 2,
    dx: 'Right fronto-temporo-parietal skull defect after decompressive craniectomy', proc: 'Right cranioplasty with custom PEEK implant',
    indication: 'Sunken flap syndrome with headaches; infection fully resolved for 8 weeks.', findings: 'Healthy scalp, dura intact; implant fitted.', preop: 'Custom PEEK implant manufactured from CT. Antibiotic prophylaxis.',
    brain: { category: 'trauma', region: 'temporal', laterality: 'right', lesionLocation: 'Right fronto-temporo-parietal cranial defect', lesionSizeMm: 120, symptoms: ['Headache', 'Sunken flap'], imagingFindings: 'CT: large right craniectomy defect, no collection, no hydrocephalus.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'Mild left arm weakness 4/5', sensoryDeficit: 'None', approach: 'Re-opening of previous trauma flap', grading: [] },
  },
  // 46 — Emmanuel Shayo redo (scheduled)
  {
    pt: 11, type: 'brain', cat: 'brain', hosp: 0, priority: 'urgent', status: 'scheduled', created: '2026-10-15', date: '2026-11-18', reop: 10,
    dx: 'Recurrent left temporal glioblastoma', proc: 'Re-do left temporal craniotomy and resection of recurrent tumour',
    indication: 'Radiological progression at 7 months with new dysphasia; neuro-oncology MDT recommends re-resection.', findings: 'Nodular enhancement at the resection cavity margin.', preop: 'Dexamethasone. Neuro-oncology MDT 2026-10-14.',
    brain: { category: 'tumor', region: 'temporal', laterality: 'left', lesionLocation: 'Left temporal resection cavity margin', lesionSizeMm: 22, symptoms: ['Worsening dysphasia', 'Headache'], imagingFindings: 'MRI: 22 mm nodular enhancement at posterior cavity margin, increased perfusion.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'Mild right drift', sensoryDeficit: 'None', approach: 'Re-opening of previous craniotomy', grading: [{ system: 'KPS', value: '70' }] },
  },
  // 47 — Ibrahim VP shunt after SAH (reop of 16)
  {
    pt: 17, type: 'brain', cat: 'brain', hosp: 0, priority: 'urgent', status: 'completed', created: '2026-07-28', date: '2026-07-30', outcome: 'improved', duration: 65, reop: 16,
    dx: 'Post-haemorrhagic communicating hydrocephalus', proc: 'Ventriculoperitoneal shunt insertion',
    indication: 'Failed EVD weaning on two occasions.', findings: 'Ventriculomegaly with clear CSF.', preop: 'CSF cultures negative ×3.',
    brain: { category: 'hydrocephalus', region: 'ventricular', laterality: 'right', lesionLocation: 'Lateral ventricles', symptoms: ['Drowsiness on EVD clamping'], imagingFindings: 'CT: ventriculomegaly on EVD clamp trial.', gcs: { eye: 4, verbal: 4, motor: 6 }, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'Right leg 4/5', sensoryDeficit: 'None', approach: 'Right frontal (existing EVD tract)', grading: [] },
  },
  // 48 — Alex Haule recurrence (reop of 36)
  {
    pt: 37, type: 'brain', cat: 'brain', hosp: 2, priority: 'urgent', status: 'completed', created: '2026-10-08', date: '2026-10-09', outcome: 'improved', duration: 60, reop: 36,
    dx: 'Recurrent left chronic subdural haematoma', proc: 'Left re-drainage of chronic subdural haematoma via existing burr holes',
    indication: 'Recurrent headache and weakness with re-accumulation on CT at 4 weeks.', findings: 'Re-accumulated liquefied haematoma with membranes.', preop: 'Alcohol abstinence counselling.',
    brain: { category: 'hemorrhage', region: 'frontal', laterality: 'left', lesionLocation: 'Left fronto-parietal convexity', lesionSizeMm: 16, symptoms: ['Headache', 'Right-sided weakness'], imagingFindings: 'CT: 16 mm recurrent left CSDH, 5 mm shift.', gcs: { eye: 4, verbal: 5, motor: 6 }, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'Right 4/5', sensoryDeficit: 'None', approach: 'Existing burr holes', grading: [{ system: 'Markwalder', value: '1' }] },
  },
  // 49 — Said Mohamed revision cancelled
  {
    pt: 25, type: 'spine', cat: 'spine', hosp: 1, priority: 'elective', status: 'cancelled', created: '2026-04-20', date: '2026-05-27', reop: 24,
    dx: 'Recurrent L3/L4 disc herniation', proc: 'L3/L4 revision microdiscectomy',
    indication: 'Recurrent right L4 radiculopathy at 4 months.', findings: 'Small recurrent protrusion.', preop: 'Trial of transforaminal steroid injection first.', note: 'Cancelled: symptoms resolved after transforaminal injection; patient declined surgery.',
    spine: { category: 'disc-herniation', region: 'lumbar', levels: ['L3/L4'], laterality: 'right', symptoms: ['Recurrent right thigh pain'], motor: fullPower, sensory: 'Mild right L4', reflexes: 'Right knee reduced', bowelBladder: 'Normal', painScore: 5, functionalLimitation: 'Mild', imagingFindings: 'MRI: small recurrent right L3/L4 protrusion with scar.', approach: 'Posterior right', odiScore: 30, asiaGrade: 'E' },
  },
  // 50 — Francis implant removal planned
  {
    pt: 19, type: 'spine', cat: 'spine', hosp: 3, priority: 'elective', status: 'planned', created: '2026-10-10', reop: 18,
    dx: 'Healed L1 burst fracture with prominent instrumentation', proc: 'Removal of T12–L2 instrumentation',
    indication: 'Fracture healed at 12 months; implant prominence and discomfort. To be scheduled after CT confirmation of fusion.', findings: 'CT at 3 months shows early bridging bone.', preop: 'Repeat CT at 12 months before scheduling.',
    spine: { category: 'trauma', region: 'lumbar', levels: ['T12', 'L1', 'L2'], laterality: 'midline', symptoms: ['Implant prominence discomfort'], motor: fullPower, sensory: 'Intact', reflexes: 'Normal', bowelBladder: 'Normal', painScore: 3, functionalLimitation: 'Minimal', imagingFindings: 'CT: bridging bone T12–L2.', approach: 'Posterior', instrumentation: 'Removal of pedicle screws and rods', asiaGrade: 'E' },
  },
  // 51 — George Lyimo VP shunt before resection
  {
    pt: 21, type: 'brain', cat: 'brain', hosp: 0, priority: 'urgent', status: 'completed', created: '2026-04-29', date: '2026-05-02', outcome: 'improved', duration: 60,
    dx: 'Obstructive hydrocephalus secondary to cerebellar mass', proc: 'Ventriculoperitoneal shunt insertion',
    indication: 'Acute symptomatic hydrocephalus pending definitive tumour surgery.', findings: 'Dilated lateral and third ventricles.', preop: 'Dexamethasone.',
    brain: { category: 'hydrocephalus', region: 'ventricular', laterality: 'right', lesionLocation: 'Lateral ventricles', symptoms: ['Headache', 'Vomiting', 'Papilloedema'], imagingFindings: 'MRI: triventricular hydrocephalus from fourth ventricular compression.', gcs: { eye: 4, verbal: 4, motor: 6 }, pupils: normalPupils, cranialNerves: 'Papilloedema', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Right frontal', grading: [] },
  },
  // 52 — Kelvin ETV before resection
  {
    pt: 31, type: 'brain', cat: 'brain', hosp: 3, priority: 'emergency', status: 'completed', created: '2026-02-16', date: '2026-02-20', outcome: 'improved', duration: 55,
    dx: 'Obstructive hydrocephalus from fourth ventricular tumour', proc: 'Endoscopic third ventriculostomy',
    indication: 'Acute hydrocephalus with raised ICP pending tumour resection.', findings: 'Thinned floor of the third ventricle; patent stoma with good flow.', preop: 'Dexamethasone.',
    brain: { category: 'hydrocephalus', region: 'ventricular', laterality: 'right', lesionLocation: 'Third ventricle floor', symptoms: ['Headache', 'Vomiting'], imagingFindings: 'MRI: triventricular hydrocephalus.', gcs: { eye: 4, verbal: 4, motor: 6 }, pupils: normalPupils, cranialNerves: 'Bilateral VI', motorDeficit: 'None', sensoryDeficit: 'None', approach: 'Right frontal endoscopic', grading: [] },
  },
  // 53 — Abdul cranioplasty scheduled
  {
    pt: 29, type: 'brain', cat: 'brain', hosp: 2, priority: 'elective', status: 'scheduled', created: '2026-10-01', date: '2026-11-30', reop: 28,
    dx: 'Right fronto-temporal cranial defect after haematoma evacuation and bone flap removal', proc: 'Right cranioplasty with autologous bone flap',
    indication: 'Bone flap stored; patient now medically stable in rehabilitation.', findings: 'Cranial defect, no collection.', preop: 'Rehabilitation team liaison. Tracheostomy decannulated.',
    brain: { category: 'hemorrhage', region: 'temporal', laterality: 'right', lesionLocation: 'Right fronto-temporal defect', lesionSizeMm: 100, symptoms: ['Left hemiplegia', 'Dysarthria'], imagingFindings: 'CT: cranial defect, encephalomalacia right basal ganglia.', gcs: { eye: 4, verbal: 4, motor: 6 }, pupils: normalPupils, cranialNerves: 'Left facial UMN weakness', motorDeficit: 'Left hemiplegia 2/5', sensoryDeficit: 'Left hemisensory loss', approach: 'Previous flap', grading: [{ system: 'mRS', value: '4' }] },
  },
  // 54 — Mariam tandem lumbar stenosis scheduled
  {
    pt: 22, type: 'spine', cat: 'spine', hosp: 5, priority: 'elective', status: 'scheduled', created: '2026-09-30', date: '2026-12-10',
    dx: 'Tandem lumbar stenosis L4/L5', proc: 'L4/L5 decompressive laminectomy',
    indication: 'Persistent neurogenic claudication after cervical laminoplasty.', findings: 'Severe L4/L5 central stenosis.', preop: 'Diabetes control.',
    spine: { category: 'stenosis', region: 'lumbar', levels: ['L4/L5'], laterality: 'bilateral', symptoms: ['Leg heaviness on walking'], motor: fullPower, sensory: 'Intact', reflexes: 'Reduced ankle jerks', bowelBladder: 'Normal', painScore: 5, functionalLimitation: 'Walking 150 m', imagingFindings: 'MRI: severe L4/L5 central stenosis.', approach: 'Posterior midline', odiScore: 42, asiaGrade: 'E' },
  },
  // 55 — Robert Macha posterior fixation stage 2
  {
    pt: 41, type: 'spine', cat: 'spine', hosp: 3, priority: 'urgent', status: 'completed', created: '2026-10-10', date: '2026-10-13', outcome: 'stable', duration: 180, reop: 40,
    dx: 'C6/7 facet dislocation — posterior column instability after anterior fixation', proc: 'C5–C7 posterior lateral mass screw fixation (second stage)',
    indication: 'Three-column injury; posterior supplementation for stability.', findings: 'Disrupted facet capsules bilaterally; lateral mass screws C5–C7.', preop: 'Prone positioning with Mayfield; neuromonitoring.',
    spine: { category: 'trauma', region: 'cervical', levels: ['C5', 'C6', 'C7'], laterality: 'bilateral', symptoms: ['Weakness all four limbs'], motor: { rightUpper: 3, leftUpper: 3, rightLower: 3, leftLower: 3 }, sensory: 'Level C7, sacral sparing', reflexes: 'Returning', bowelBladder: 'Catheterised', painScore: 6, functionalLimitation: 'Bed-bound', imagingFindings: 'CT: reduced C6/7, anterior plate in situ.', approach: 'Posterior', instrumentation: 'C5–C7 lateral mass screws and rods', asiaGrade: 'C' },
  },
  // 56 — Hassan Juma recurrence
  {
    pt: 9, type: 'brain', cat: 'brain', hosp: 2, priority: 'urgent', status: 'completed', created: '2026-06-29', date: '2026-07-01', outcome: 'improved', duration: 50, reop: 8,
    dx: 'Recurrent right chronic subdural haematoma', proc: 'Right burr-hole re-drainage',
    indication: 'Recurrent right collection with headache after warfarin restart.', findings: 'Re-accumulation under pressure.', preop: 'Warfarin held again; cardiology to consider left atrial appendage occlusion.',
    brain: { category: 'hemorrhage', region: 'parietal', laterality: 'right', lesionLocation: 'Right convexity', lesionSizeMm: 15, symptoms: ['Headache', 'Left drift'], imagingFindings: 'CT: 15 mm recurrent right CSDH.', gcs: normalGcs, pupils: normalPupils, cranialNerves: 'Intact', motorDeficit: 'Left drift', sensoryDeficit: 'None', approach: 'Existing burr holes', grading: [{ system: 'Markwalder', value: '1' }] },
  },
]

// Number cases chronologically by creation date (stable sort).
const ordered = seeds
  .map((s, i) => ({ s, i }))
  .sort((a, b) => (a.s.created < b.s.created ? -1 : a.s.created > b.s.created ? 1 : a.i - b.i))

const caseIdByIndex = new Map<number, string>()
ordered.forEach(({ i }, n) => caseIdByIndex.set(i, `case-${pad(n + 1)}`))

const perYear = new Map<string, number>()

export const cases: SurgicalCase[] = ordered.map(({ s, i }) => {
  const year = s.created.slice(0, 4)
  const id = caseIdByIndex.get(i)!
  const seq = (perYear.get(year) ?? 0) + 1
  perYear.set(year, seq)
  return {
    id,
    caseNumber: `NSC-${year}-${pad(seq)}`,
    patientId: `pt-${pad(s.pt)}`,
    consultationId: `cons-${pad(i + 1)}`,
    type: s.type,
    procedureCategory: s.cat,
    diagnosis: s.dx,
    indication: s.indication,
    findings: s.findings,
    plannedProcedure: s.proc,
    hospitalId: H[s.hosp],
    surgeonRole: 'primary',
    priority: s.priority,
    status: s.status,
    plannedDate: s.date,
    surgeryDate: s.status === 'completed' ? s.date : undefined,
    durationMinutes: s.duration,
    createdAt: s.created,
    preopConsiderations: s.preop,
    brain: s.brain,
    spine: s.spine,
    complications: (s.complications ?? []).map((c, k) => ({ ...c, id: `comp-${pad(i + 1)}-${k + 1}` })),
    outcome: s.outcome,
    reoperation: s.reop !== undefined,
    reoperationOfCaseId: s.reop !== undefined ? caseIdByIndex.get(s.reop) : undefined,
    statusNote: s.note,
  }
})

/** Seed index → case id, used by other mock files to stay consistent. */
export const caseIdForSeed = (seedIndex: number) => caseIdByIndex.get(seedIndex)!
export const seedCount = seeds.length

// ---------------------------------------------------------------------------
// Operative reports
// ---------------------------------------------------------------------------

const assistants = ['Dr. L. Mkumbo (Registrar)', 'Dr. P. Swai (Registrar)', 'Dr. A. Kessy (Resident)', 'Dr. N. Bwire (Fellow)']
const anaesthetists = ['Dr. R. Mtei', 'Dr. S. Hamad', 'Dr. J. Lema', 'Dr. F. Ngasa']

function brainDescription(c: SurgicalCase): string {
  const b = c.brain!
  return [
    `Patient positioned supine with the head fixed in a three-pin head holder and turned to expose the ${b.laterality} ${b.region} region. Neuronavigation registered and accuracy confirmed.`,
    `A ${c.plannedProcedure.toLowerCase().includes('burr') ? 'linear incision' : 'curvilinear incision'} was planned to the lesion using navigation. The scalp was infiltrated with local anaesthetic and adrenaline and opened in layers with haemostasis.`,
    c.plannedProcedure.toLowerCase().includes('burr')
      ? 'Burr holes were fashioned with the perforator and the dura coagulated and opened in a cruciate fashion.'
      : 'A free bone flap was raised with the craniotome. The dura was opened in a C-shaped fashion and reflected towards the base.',
    `Under the operating microscope the lesion was identified at ${b.lesionLocation.toLowerCase()}. ${c.findings}`,
    'The procedure was completed as planned with meticulous haemostasis. Valsalva manoeuvre confirmed no further bleeding.',
    'The dura was closed in a watertight fashion and reinforced with a dural substitute where necessary. The bone flap was replaced and secured with titanium plates. Scalp closed in layers over a subgaleal drain.',
  ].join('\n\n')
}

function spineDescription(c: SurgicalCase): string {
  const s = c.spine!
  const anterior = s.approach.toLowerCase().includes('anterior')
  return [
    anterior
      ? 'Patient positioned supine with a shoulder roll and the neck in slight extension. The level was confirmed with lateral fluoroscopy.'
      : 'Patient positioned prone on a radiolucent frame with all pressure points padded. The level was confirmed with lateral fluoroscopy using a spinal needle.',
    anterior
      ? 'A left-sided transverse skin crease incision was made. The platysma was divided and the plane developed medial to the sternocleidomastoid and carotid sheath down to the prevertebral fascia. The longus colli were elevated and self-retaining retractors placed.'
      : `A midline incision was made over ${s.levels.join(', ')}. The paraspinal muscles were elevated subperiosteally and self-retaining retractors placed.`,
    `${c.findings} Decompression was achieved and confirmed with a blunt nerve hook along the neural elements.`,
    s.instrumentation ? `Instrumentation: ${s.instrumentation}. Screw positions were confirmed with fluoroscopy in two planes.` : 'No instrumentation was used.',
    'Haemostasis was secured with bipolar diathermy and haemostatic matrix. The wound was irrigated with warm saline and closed in layers with absorbable sutures and skin clips.',
  ].join('\n\n')
}

export const operativeReports: OperativeReport[] = cases
  .filter((c) => c.status === 'completed')
  .map((c, idx) => {
    const seedIdx = Number(c.consultationId!.slice(5)) - 1
    const rng = createRng(1000 + seedIdx)
    const assistant = pick(rng, assistants)
    const anaesthetist = pick(rng, anaesthetists)
    const isBrain = c.type !== 'spine'
    // Most reports finalized; a few drafts and two amended ones.
    const status: OperativeReport['status'] = [23, 36, 48, 55].includes(seedIdx) ? 'draft' : [2, 16].includes(seedIdx) ? 'amended' : 'finalized'
    const created = `${c.surgeryDate}T${pad(14 + (idx % 6), 2)}:${pad((idx * 17) % 60, 2)}:00`
    const finalized = status !== 'draft' ? `${addDays(c.surgeryDate!, 1)}T09:${pad((idx * 13) % 60, 2)}:00` : undefined
    const ebl = isBrain ? 150 + Math.floor(rng() * 400) : 80 + Math.floor(rng() * 500)
    const comp = c.complications.find((k) => k.date === c.surgeryDate)
    const amendments: OperativeReport['amendments'] =
      status === 'amended'
        ? [
            {
              id: `amend-${seedIdx}-1`,
              date: `${addDays(c.surgeryDate!, 3)}T11:20:00`,
              author: surgeon.fullName,
              reason: 'Histopathology / implant details added after initial finalisation',
              changes: seedIdx === 2 ? 'Added details of temporal pole contusion debridement and bone flap storage location.' : 'Clarified temporary clip time (4 min 20 s) and added ICG findings.',
            },
          ]
        : []
    return {
      id: `opr-${pad(seedIdx + 1)}`,
      caseId: c.id,
      status,
      version: status === 'amended' ? 2 : 1,
      createdAt: created,
      updatedAt: amendments[0]?.date ?? finalized ?? created,
      finalizedAt: finalized,
      amendments,
      team: { primarySurgeon: surgeon.fullName, assistants: [assistant], anaesthetist, surgeonRole: 'primary' },
      preopDiagnosis: c.diagnosis,
      postopDiagnosis: c.diagnosis,
      procedurePerformed: c.plannedProcedure,
      approach: isBrain ? c.brain!.approach : c.spine!.approach,
      operativeFindings: c.findings,
      procedureDescription: isBrain ? brainDescription(c) : spineDescription(c),
      intraopMonitoring: isBrain ? (c.procedureCategory === 'neurovascular' ? 'ICG videoangiography, SSEP/MEP, Doppler flow probe' : c.brain!.region === 'skull-base' ? 'Facial nerve EMG, BAER' : 'Standard anaesthetic monitoring; neuronavigation') : c.spine!.instrumentation ? 'SSEP and MEP neuromonitoring, fluoroscopy' : 'Fluoroscopy; standard anaesthetic monitoring',
      estimatedBloodLossMl: ebl,
      specimens: c.brain?.category === 'tumor' || c.spine?.category === 'tumor' ? 'Tumour tissue for histopathology (fresh and formalin); frozen section sent' : c.spine?.category === 'infection' ? 'Pus for microscopy, culture and sensitivity' : c.spine?.category === 'disc-herniation' ? 'Disc material for histology' : 'None',
      implants: c.spine?.instrumentation ?? (c.plannedProcedure.includes('shunt') ? 'Programmable VP shunt system, medium pressure' : c.plannedProcedure.includes('clipping') ? 'Titanium aneurysm clip (straight, 7 mm)' : c.plannedProcedure.includes('cranioplasty') ? (c.plannedProcedure.includes('PEEK') ? 'Custom PEEK cranioplasty implant' : 'Autologous bone flap') : 'Titanium mini-plates and screws for bone flap fixation'),
      intraopComplications: comp ? comp.description : c.procedureCategory === 'neurovascular' && c.brain?.category === 'aneurysm' && c.priority === 'emergency' ? 'Intraoperative aneurysm rupture controlled with temporary clipping (4 min 20 s)' : 'None',
      immediatePostopCondition: c.priority === 'emergency' ? 'Transferred intubated to the neuro-ICU for ongoing ventilation and ICP monitoring.' : 'Extubated in theatre, obeying commands, neurologically at baseline. Transferred to the high-dependency unit.',
      postopPlan: isBrain ? 'Hourly neuro-observations for 24 h. CT head within 24 h. Dexamethasone taper. Continue antiepileptic. Drain out day 1. Mobilise day 1.' : 'Neuro-observations 4-hourly. Mobilise with physiotherapy day 1. Drain out when <50 mL/24 h. Upright X-ray before discharge where instrumented. Wound check day 10.',
      anaesthesiaType: 'General anaesthesia (TIVA)',
      durationMinutes: c.durationMinutes ?? null,
    }
  })

// ---------------------------------------------------------------------------
// Postoperative notes & discharge summaries
// ---------------------------------------------------------------------------

const woundPath: PostopNote['woundStatus'][] = ['clean-dry', 'clean-dry', 'clean-dry', 'clean-dry']

export const postopNotes: PostopNote[] = []
export const dischargeSummaries: DischargeSummary[] = []

cases
  .filter((c) => c.status === 'completed' && c.surgeryDate! <= '2026-10-26')
  .forEach((c) => {
    const seedIdx = Number(c.consultationId!.slice(5)) - 1
    const rng = createRng(2000 + seedIdx)
    const isBrain = c.type !== 'spine'
    const severe = c.priority === 'emergency'
    const nNotes = severe ? 4 : c.spine?.category === 'disc-herniation' ? 2 : 3
    const stayDays = severe ? 10 + Math.floor(rng() * 6) : c.spine?.category === 'disc-herniation' ? 1 : 3 + Math.floor(rng() * 3)
    const dischargeDate = addDays(c.surgeryDate!, stayDays)
    const stillInpatient = dischargeDate > '2026-10-26'
    const days = severe ? [1, 3, 7, stayDays] : nNotes === 2 ? [1, stayDays] : [1, 2, stayDays]

    days.forEach((d, k) => {
      const date = addDays(c.surgeryDate!, d)
      if (date > '2026-10-26') return
      const last = k === days.length - 1
      const infection = c.complications.find((x) => x.description.toLowerCase().includes('infection'))
      const wound: PostopNote['woundStatus'] = infection && d >= 7 ? 'erythema' : woundPath[k] ?? 'clean-dry'
      const pain = Math.max(0, (isBrain ? 5 : 7) - d - Math.floor(rng() * 2))
      postopNotes.push({
        id: `pon-${pad(seedIdx + 1)}-${k + 1}`,
        caseId: c.id,
        patientId: c.patientId,
        date,
        postopDay: d,
        neuroFindings: isBrain
          ? severe
            ? d === 1 ? 'Sedated and ventilated; pupils equal and reactive; ICP 12–16 mmHg.' : d <= 3 ? 'Sedation weaned; localising bilaterally; pupils equal.' : 'Awake, obeying commands; GCS 14 (E4 V4 M6); residual contralateral weakness 4/5.'
            : d === 1 ? 'GCS 15, pupils equal and reactive, no new deficit.' : 'Neurologically at baseline; mobilising independently.'
          : d === 1 ? 'Radicular pain resolved; motor power unchanged from pre-op; sensation intact.' : 'Mobilising well; power improving; no new deficit.',
        clinicalCondition: severe && d <= 3 ? 'critical' : wound === 'erythema' ? 'concern' : last ? 'stable' : 'improving',
        painScore: pain,
        woundStatus: wound,
        observations: severe && d <= 3 ? 'Afebrile. Haemodynamically supported with noradrenaline weaning.' : 'Afebrile. Observations within normal limits. Eating and drinking.',
        complications: infection && d >= 7 ? infection.description : 'None',
        plan: last && !stillInpatient
          ? 'Fit for discharge. Discharge summary completed. Follow-up arranged.'
          : isBrain ? 'Continue neuro-observations. Mobilise. Dexamethasone taper per protocol.' : 'Physiotherapy. Analgesia step-down. Mobilise with support.',
        dischargeStatus: last && !stillInpatient ? 'discharged' : 'inpatient',
        author: surgeon.fullName,
      })
    })

    if (!stillInpatient && seedIdx % 3 !== 1) {
      dischargeSummaries.push({
        id: `dis-${pad(seedIdx + 1)}`,
        caseId: c.id,
        patientId: c.patientId,
        admissionDate: addDays(c.surgeryDate!, severe ? 0 : -1),
        dischargeDate,
        finalDiagnosis: c.diagnosis,
        procedure: c.plannedProcedure,
        hospitalCourse: severe
          ? `Admitted as an emergency and taken to theatre for ${c.plannedProcedure.toLowerCase()}. Managed in the neuro-ICU post-operatively with staged weaning of sedation. ${c.complications.length ? 'Course complicated by: ' + c.complications.map((x) => x.description.toLowerCase()).join('; ') + '.' : 'No complications.'} Transferred to the ward and mobilised with the therapy team before discharge.`
          : `Elective admission for ${c.plannedProcedure.toLowerCase()}. Uneventful ${isBrain ? 'post-operative recovery with no new neurological deficit' : 'recovery with resolution of radicular symptoms and early mobilisation'}. ${c.complications.length ? 'Minor complication: ' + c.complications.map((x) => x.description.toLowerCase()).join('; ') + '.' : ''}`,
        conditionAtDischarge: severe ? 'Stable; residual deficit; mobilising with assistance.' : 'Well; neurologically at or better than baseline; mobilising independently.',
        medications: isBrain ? 'Paracetamol 1 g QDS; dexamethasone taper over 5 days; levetiracetam 500 mg BD where prescribed pre-operatively.' : 'Paracetamol 1 g QDS; ibuprofen 400 mg TDS with food (if no contraindication); short course of codeine for breakthrough pain.',
        instructions: isBrain ? 'Keep wound dry for 5 days. No driving until reviewed. Report headache, fever, wound discharge or new weakness immediately.' : 'Avoid lifting >5 kg and prolonged sitting for 6 weeks. Walk daily. Report fever, wound discharge, new weakness or bladder symptoms immediately.',
        followUpPlan: `Clinic review with ${surgeon.shortName} in 2 weeks for wound check, then at 6 weeks${isBrain ? ' with repeat imaging' : ''}.`,
        author: surgeon.fullName,
      })
    }
  })
