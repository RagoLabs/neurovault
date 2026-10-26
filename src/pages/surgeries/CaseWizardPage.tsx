import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Bone, Brain, Check, Sparkles, UserPlus, Save } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { Field } from '@/components/shared/FormField'
import { PatientSelect } from '@/components/shared/PatientSelect'
import { PatientChip } from '@/components/shared/PatientChip'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { KeyValue } from '@/components/shared/KeyValue'
import { GcsInput } from '@/components/clinical/GcsInput'
import { PupilInput } from '@/components/clinical/PupilInput'
import { MotorPowerGrid } from '@/components/clinical/MotorPowerGrid'
import { brainCategories, brainRegions, lateralities, spineCategories, spineRegions, brainFieldConfig, labelOf } from '@/components/clinical/clinicalOptions'
import { createSurgicalCase, useCollection, useRecord } from '@/services/repository'
import { useDemoStore } from '@/stores/demoStore'
import { DEMO_REFERENCE_DATE } from '@/config/demo'
import type { BrainCategory, BrainRegion, CaseType, Laterality, Priority, ProcedureCategory, SpineCategory, SpineRegion, SurgeonRole, GCSComponents, MotorPower, PupilExam } from '@/types'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'

const steps = ['Select patient', 'Case type', 'Clinical details', 'Surgical planning', 'Review & save']
const DRAFT_KEY = 'neurovault.caseWizard.draft'

interface Draft {
  patientId: string
  consultationId?: string
  type: CaseType | ''
  // clinical
  diagnosis: string
  indication: string
  findings: string
  plannedProcedure: string
  symptoms: string
  imagingFindings: string
  brainCategory: BrainCategory
  brainRegion: BrainRegion
  laterality: Laterality
  lesionLocation: string
  lesionSizeMm: string
  gcs: GCSComponents
  pupils: { left: PupilExam; right: PupilExam }
  cranialNerves: string
  motorDeficit: string
  sensoryDeficit: string
  brainApproach: string
  grading: Record<string, string>
  spineCategory: SpineCategory
  spineRegion: SpineRegion
  levels: string
  motor: MotorPower
  sensory: string
  reflexes: string
  bowelBladder: string
  painScore: string
  functionalLimitation: string
  spineApproach: string
  instrumentation: string
  odiScore: string
  asiaGrade: 'A' | 'B' | 'C' | 'D' | 'E' | 'not-assessed'
  // planning
  hospitalId: string
  surgeonRole: SurgeonRole
  priority: Priority
  plannedDate: string
  status: 'planned' | 'scheduled'
  preopConsiderations: string
}

const initial = (patientId: string, consultationId: string | undefined, hospitalId: string, type: CaseType): Draft => ({
  patientId, consultationId, type: '',
  diagnosis: '', indication: '', findings: '', plannedProcedure: '', symptoms: '', imagingFindings: '',
  brainCategory: 'tumor', brainRegion: 'frontal', laterality: 'left', lesionLocation: '', lesionSizeMm: '', gcs: { eye: 4, verbal: 5, motor: 6 }, pupils: { left: { size: 3, reaction: 'brisk' }, right: { size: 3, reaction: 'brisk' } }, cranialNerves: 'Intact', motorDeficit: 'None', sensoryDeficit: 'None', brainApproach: '', grading: {},
  spineCategory: 'disc-herniation', spineRegion: 'lumbar', levels: '', motor: { rightUpper: 5, leftUpper: 5, rightLower: 5, leftLower: 5 }, sensory: 'Intact', reflexes: 'Normal', bowelBladder: 'Normal', painScore: '5', functionalLimitation: '', spineApproach: '', instrumentation: '', odiScore: '', asiaGrade: 'E',
  hospitalId, surgeonRole: 'primary', priority: 'elective', plannedDate: '', status: 'planned', preopConsiderations: '',
  ...(type ? {} : {}),
})

export function CaseWizardPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const hospitals = useCollection('hospitals')
  const prefs = useDemoStore((s) => s.preferences)
  const consultation = useRecord('consultations', params.get('consultation') ?? undefined)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY)
      if (saved && !params.get('patient')) return JSON.parse(saved) as Draft
    } catch { /* ignore */ }
    return initial(params.get('patient') ?? '', params.get('consultation') ?? undefined, prefs.defaultHospitalId, prefs.defaultCaseType)
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const patient = useRecord('patients', draft.patientId || undefined)

  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* ignore */ }
  }, [draft])

  useEffect(() => {
    if (consultation && !draft.diagnosis) {
      setDraft((x) => ({ ...x, patientId: consultation.patientId, consultationId: consultation.id, diagnosis: consultation.workingDiagnosis, indication: consultation.historyOfPresentingIllness, findings: consultation.examinationFindings, imagingFindings: consultation.investigationFindings, hospitalId: consultation.hospitalId, symptoms: consultation.chiefComplaint }))
    }
  }, [consultation, draft.diagnosis])

  const up = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((x) => ({ ...x, [k]: v }))
  const isBrain = draft.type === 'brain' || draft.type === 'combined'
  const isSpine = draft.type === 'spine' || draft.type === 'combined'
  const brainCfg = brainFieldConfig[draft.brainCategory]

  const validate = (s: number) => {
    const e: Record<string, string> = {}
    if (s === 0 && !draft.patientId) e.patientId = 'Select a patient to continue'
    if (s === 1 && !draft.type) e.type = 'Choose the case type'
    if (s === 2) {
      if (draft.diagnosis.trim().length < 3) e.diagnosis = 'Diagnosis is required'
      if (draft.indication.trim().length < 5) e.indication = 'Surgical indication is required'
      if (draft.plannedProcedure.trim().length < 3) e.plannedProcedure = 'Planned intervention is required'
      if (isBrain && !draft.lesionLocation.trim()) e.lesionLocation = 'Lesion location is required'
      if (isBrain && brainCfg.lesionSize && draft.lesionSizeMm && (Number(draft.lesionSizeMm) <= 0 || Number(draft.lesionSizeMm) > 300)) e.lesionSizeMm = 'Enter a size in mm (1–300)'
      if (isSpine && !draft.levels.trim()) e.levels = 'Enter the vertebral level(s), e.g. L4/L5'
      if (isSpine && draft.painScore !== '' && (Number(draft.painScore) < 0 || Number(draft.painScore) > 10)) e.painScore = 'Pain score must be 0–10'
      if (isSpine && draft.odiScore !== '' && (Number(draft.odiScore) < 0 || Number(draft.odiScore) > 100)) e.odiScore = 'ODI must be 0–100'
    }
    if (s === 3) {
      if (!draft.hospitalId) e.hospitalId = 'Select a hospital'
      if (draft.status === 'scheduled' && !draft.plannedDate) e.plannedDate = 'A scheduled case needs a date'
      if (draft.plannedDate && draft.plannedDate < DEMO_REFERENCE_DATE && draft.priority === 'elective') e.plannedDate = 'Planned date is before the demo reference date'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate(step)) setStep((s) => Math.min(s + 1, steps.length - 1)) }
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const procedureCategory = useMemo<ProcedureCategory>(() => {
    if (draft.type === 'spine') return 'spine'
    if (draft.brainCategory === 'aneurysm' || draft.brainCategory === 'avm') return 'neurovascular'
    return 'brain'
  }, [draft.type, draft.brainCategory])

  const save = () => {
    for (let s = 0; s < 4; s++) if (!validate(s)) { setStep(s); return }
    const c = createSurgicalCase({
      patientId: draft.patientId,
      consultationId: draft.consultationId,
      type: draft.type as CaseType,
      procedureCategory,
      diagnosis: draft.diagnosis.trim(),
      indication: draft.indication.trim(),
      findings: draft.findings.trim(),
      plannedProcedure: draft.plannedProcedure.trim(),
      hospitalId: draft.hospitalId,
      surgeonRole: draft.surgeonRole,
      priority: draft.priority,
      status: draft.status,
      plannedDate: draft.plannedDate || undefined,
      preopConsiderations: draft.preopConsiderations.trim(),
      brain: isBrain ? {
        category: draft.brainCategory, region: draft.brainRegion, laterality: draft.laterality, lesionLocation: draft.lesionLocation.trim(), lesionSizeMm: draft.lesionSizeMm ? Number(draft.lesionSizeMm) : undefined,
        symptoms: draft.symptoms.split(/[;\n]/).map((s) => s.trim()).filter(Boolean), imagingFindings: draft.imagingFindings.trim(), gcs: brainCfg.gcs ? draft.gcs : undefined, pupils: brainCfg.pupils ? draft.pupils : undefined,
        cranialNerves: draft.cranialNerves, motorDeficit: draft.motorDeficit, sensoryDeficit: draft.sensoryDeficit, approach: draft.brainApproach.trim(), grading: Object.entries(draft.grading).filter(([, v]) => v).map(([system, value]) => ({ system, value })),
      } : undefined,
      spine: isSpine ? {
        category: draft.spineCategory, region: draft.spineRegion, levels: draft.levels.split(/[,;]/).map((s) => s.trim()).filter(Boolean), laterality: draft.laterality, symptoms: draft.symptoms.split(/[;\n]/).map((s) => s.trim()).filter(Boolean),
        motor: draft.motor, sensory: draft.sensory, reflexes: draft.reflexes, bowelBladder: draft.bowelBladder, painScore: draft.painScore === '' ? undefined : Number(draft.painScore), functionalLimitation: draft.functionalLimitation, imagingFindings: draft.imagingFindings.trim(), approach: draft.spineApproach.trim(), instrumentation: draft.instrumentation.trim() || undefined, odiScore: draft.odiScore === '' ? undefined : Number(draft.odiScore), asiaGrade: draft.asiaGrade,
      } : undefined,
    })
    try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    toast.success(`Case ${c.caseNumber} created`, { description: `${c.plannedProcedure} · ${patient?.firstName} ${patient?.lastName}` })
    navigate(`/cases/${c.id}`)
  }

  const hospitalName = hospitals.find((h) => h.id === draft.hospitalId)?.name

  return (
    <PageTransition>
      <PageHeader title="Create surgical case" description="Five steps. Your progress is preserved if you navigate away and come back." />
      {/* Progress */}
      <ol className="mb-6 grid grid-cols-5 gap-2" aria-label="Progress">
        {steps.map((label, i) => (
          <li key={label} className="min-w-0">
            <button type="button" onClick={() => i < step && setStep(i)} disabled={i > step} className={cn('w-full text-left cursor-pointer disabled:cursor-default', i > step && 'opacity-60')}>
              <div className={cn('h-1.5 rounded-full transition-colors', i < step ? 'bg-primary' : i === step ? 'bg-primary/60' : 'bg-muted')} />
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]', i < step ? 'border-primary bg-primary text-primary-foreground' : i === step ? 'border-primary text-primary' : 'text-muted-foreground')}>{i < step ? <Check className="size-3" /> : i + 1}</span>
                <span className="truncate hidden sm:inline">{label}</span>
              </div>
            </button>
          </li>
        ))}
      </ol>

      <div className="surface p-5 md:p-7 min-h-[420px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={reduce ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
            {step === 0 && (
              <div className="max-w-xl space-y-5">
                <div><h2 className="text-lg font-semibold">Select patient</h2><p className="text-sm text-muted-foreground">Search the directory or register a new patient.</p></div>
                <Field label="Patient" required error={errors.patientId}><PatientSelect value={draft.patientId} onChange={(v) => up('patientId', v)} /></Field>
                {patient && <div className="rounded-xl border bg-muted/30 p-4"><PatientChip patientId={patient.id} /><p className="mt-2 text-sm">{patient.primaryDiagnosis}</p>{patient.allergies.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Allergies: {patient.allergies.join(', ')}</p>}</div>}
                {consultation && <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">Initiated from consultation on {consultation.date}: <strong>{consultation.workingDiagnosis}</strong></div>}
                <Button asChild variant="outline"><Link to="/patients/new"><UserPlus /> Register a new patient</Link></Button>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-5">
                <div><h2 className="text-lg font-semibold">Case type</h2><p className="text-sm text-muted-foreground">The clinical details form adapts to the selected type.</p></div>
                {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                <div className="grid gap-3 md:grid-cols-3">
                  {([['brain', 'Brain', Brain, 'Tumour, trauma, haemorrhage, hydrocephalus, vascular'], ['spine', 'Spine', Bone, 'Disc, stenosis, trauma, tumour, deformity, infection'], ['combined', 'Combined / craniovertebral', Sparkles, 'Chiari, craniocervical junction, staged cranio-spinal']] as const).map(([v, label, Icon, desc]) => (
                    <button key={v} type="button" onClick={() => up('type', v)} className={cn('rounded-xl border p-5 text-left transition-all hover:border-primary/50 hover:shadow-card cursor-pointer', draft.type === v && 'border-primary bg-primary/5 ring-2 ring-primary/30')}>
                      <Icon className={cn('size-7', draft.type === v ? 'text-primary' : 'text-muted-foreground')} />
                      <div className="mt-3 font-semibold">{label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6">
                <div><h2 className="text-lg font-semibold">Clinical details</h2><p className="text-sm text-muted-foreground">Diagnosis, indication, relevant findings and planned intervention{isBrain ? ', with brain-specific examination' : ''}{isSpine ? ', with spinal examination' : ''}.</p></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={isBrain && !isSpine ? 'Intracranial diagnosis' : isSpine && !isBrain ? 'Spinal diagnosis' : 'Diagnosis'} required error={errors.diagnosis} htmlFor="dx"><Input id="dx" value={draft.diagnosis} onChange={(e) => up('diagnosis', e.target.value)} /></Field>
                  <Field label="Planned intervention / proposed procedure" required error={errors.plannedProcedure} htmlFor="proc"><Input id="proc" value={draft.plannedProcedure} onChange={(e) => up('plannedProcedure', e.target.value)} /></Field>
                  <Field label="Surgical indication" required error={errors.indication} htmlFor="ind" className="md:col-span-2"><Textarea id="ind" rows={3} value={draft.indication} onChange={(e) => up('indication', e.target.value)} /></Field>
                  <Field label="Presenting symptoms" description="Separate with semicolons" htmlFor="sym" className="md:col-span-2"><Input id="sym" value={draft.symptoms} onChange={(e) => up('symptoms', e.target.value)} placeholder="Headache; focal seizures; left arm weakness" /></Field>
                  <Field label="Relevant findings" htmlFor="find"><Textarea id="find" rows={3} value={draft.findings} onChange={(e) => up('findings', e.target.value)} /></Field>
                  <Field label={isBrain ? 'Relevant MRI / CT findings' : 'Imaging findings'} htmlFor="img"><Textarea id="img" rows={3} value={draft.imagingFindings} onChange={(e) => up('imagingFindings', e.target.value)} /></Field>
                </div>

                {isBrain && (
                  <section className="space-y-4 rounded-xl border border-lavender/40 p-4 md:p-5">
                    <h3 className="flex items-center gap-2 font-semibold"><Brain className="size-4 text-lavender" /> Brain-specific details</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Category"><Select value={draft.brainCategory} onValueChange={(v) => up('brainCategory', v as BrainCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{brainCategories.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></Field>
                      <Field label="Anatomical region"><Select value={draft.brainRegion} onValueChange={(v) => up('brainRegion', v as BrainRegion)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{brainRegions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></Field>
                      <Field label="Side / laterality"><Select value={draft.laterality} onValueChange={(v) => up('laterality', v as Laterality)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{lateralities.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></Field>
                      <Field label="Lesion location" required error={errors.lesionLocation} htmlFor="loc" className={brainCfg.lesionSize ? 'md:col-span-2' : 'md:col-span-3'}><Input id="loc" value={draft.lesionLocation} onChange={(e) => up('lesionLocation', e.target.value)} /></Field>
                      {brainCfg.lesionSize && <Field label="Lesion size (mm)" error={errors.lesionSizeMm} htmlFor="size"><Input id="size" type="number" min={1} max={300} value={draft.lesionSizeMm} onChange={(e) => up('lesionSizeMm', e.target.value)} /></Field>}
                      <Field label="Surgical approach" htmlFor="appr" className="md:col-span-3"><Input id="appr" value={draft.brainApproach} onChange={(e) => up('brainApproach', e.target.value)} placeholder="e.g. Right pterional craniotomy, transsylvian" /></Field>
                    </div>
                    {brainCfg.gcs && <GcsInput value={draft.gcs} onChange={(v) => up('gcs', v)} />}
                    {brainCfg.pupils && <PupilInput value={draft.pupils} onChange={(v) => up('pupils', v)} />}
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Cranial nerve findings" htmlFor="cn"><Input id="cn" value={draft.cranialNerves} onChange={(e) => up('cranialNerves', e.target.value)} /></Field>
                      <Field label="Motor deficit" htmlFor="md"><Input id="md" value={draft.motorDeficit} onChange={(e) => up('motorDeficit', e.target.value)} /></Field>
                      <Field label="Sensory deficit" htmlFor="sd"><Input id="sd" value={draft.sensoryDeficit} onChange={(e) => up('sensoryDeficit', e.target.value)} /></Field>
                    </div>
                    <div>
                      <div className="mb-2 text-sm font-medium">Relevant grading systems <span className="text-xs text-muted-foreground">(configured for {labelOf(brainCategories, draft.brainCategory).toLowerCase()})</span></div>
                      <div className="grid gap-3 md:grid-cols-4">
                        {brainCfg.grading.map((g) => <Field key={g} label={g} htmlFor={`g-${g}`}><Input id={`g-${g}`} value={draft.grading[g] ?? ''} onChange={(e) => up('grading', { ...draft.grading, [g]: e.target.value })} /></Field>)}
                      </div>
                    </div>
                  </section>
                )}

                {isSpine && (
                  <section className="space-y-4 rounded-xl border border-teal/40 p-4 md:p-5">
                    <h3 className="flex items-center gap-2 font-semibold"><Bone className="size-4 text-teal" /> Spine-specific details</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Category"><Select value={draft.spineCategory} onValueChange={(v) => up('spineCategory', v as SpineCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{spineCategories.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></Field>
                      <Field label="Spinal region"><Select value={draft.spineRegion} onValueChange={(v) => up('spineRegion', v as SpineRegion)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{spineRegions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></Field>
                      <Field label="Vertebral level(s)" required error={errors.levels} htmlFor="lv" description="Comma separated, e.g. L4/L5, L5/S1"><Input id="lv" value={draft.levels} onChange={(e) => up('levels', e.target.value)} /></Field>
                      {!isBrain && <Field label="Laterality"><Select value={draft.laterality} onValueChange={(v) => up('laterality', v as Laterality)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{lateralities.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></Field>}
                      <Field label="Surgical approach" htmlFor="sappr" className="md:col-span-2"><Input id="sappr" value={draft.spineApproach} onChange={(e) => up('spineApproach', e.target.value)} placeholder="e.g. Posterior midline, microsurgical" /></Field>
                      <Field label="Instrumentation details" htmlFor="instr" className="md:col-span-3" description="Where applicable"><Input id="instr" value={draft.instrumentation} onChange={(e) => up('instrumentation', e.target.value)} placeholder="e.g. L4/L5 pedicle screws, TLIF cage" /></Field>
                    </div>
                    <MotorPowerGrid value={draft.motor} onChange={(v) => up('motor', v)} />
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Sensory examination" htmlFor="sens"><Input id="sens" value={draft.sensory} onChange={(e) => up('sensory', e.target.value)} /></Field>
                      <Field label="Reflexes" htmlFor="refl"><Input id="refl" value={draft.reflexes} onChange={(e) => up('reflexes', e.target.value)} /></Field>
                      <Field label="Bowel / bladder symptoms" htmlFor="bb"><Input id="bb" value={draft.bowelBladder} onChange={(e) => up('bowelBladder', e.target.value)} /></Field>
                      <Field label="Pain score (NRS 0–10)" error={errors.painScore} htmlFor="pain"><Input id="pain" type="number" min={0} max={10} value={draft.painScore} onChange={(e) => up('painScore', e.target.value)} /></Field>
                      <Field label="ODI (%)" error={errors.odiScore} htmlFor="odi" description="Oswestry Disability Index, if measured"><Input id="odi" type="number" min={0} max={100} value={draft.odiScore} onChange={(e) => up('odiScore', e.target.value)} /></Field>
                      <Field label="ASIA impairment grade" description="Demonstration only — not auto-classified"><Select value={draft.asiaGrade} onValueChange={(v) => up('asiaGrade', v as Draft['asiaGrade'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['A', 'B', 'C', 'D', 'E'].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}<SelectItem value="not-assessed">Not assessed</SelectItem></SelectContent></Select></Field>
                      <Field label="Functional limitation" htmlFor="fl" className="md:col-span-3"><Input id="fl" value={draft.functionalLimitation} onChange={(e) => up('functionalLimitation', e.target.value)} /></Field>
                    </div>
                  </section>
                )}
              </div>
            )}
            {step === 3 && (
              <div className="space-y-5">
                <div><h2 className="text-lg font-semibold">Surgical planning</h2><p className="text-sm text-muted-foreground">Hospital, role, priority, date and preoperative considerations.</p></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Hospital" required error={errors.hospitalId}><Select value={draft.hospitalId} onValueChange={(v) => up('hospitalId', v)}><SelectTrigger><SelectValue placeholder="Select hospital" /></SelectTrigger><SelectContent>{hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select></Field>
                  <Field label="Surgeon's role"><Select value={draft.surgeonRole} onValueChange={(v) => up('surgeonRole', v as SurgeonRole)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="primary">Primary surgeon</SelectItem><SelectItem value="assistant">Assistant surgeon</SelectItem><SelectItem value="supervising">Supervising surgeon</SelectItem></SelectContent></Select></Field>
                  <Field label="Priority"><Select value={draft.priority} onValueChange={(v) => up('priority', v as Priority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="elective">Elective</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="emergency">Emergency</SelectItem></SelectContent></Select></Field>
                  <Field label="Initial status"><Select value={draft.status} onValueChange={(v) => up('status', v as Draft['status'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planned">Planned (date to be confirmed)</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem></SelectContent></Select></Field>
                  <Field label="Planned date" required={draft.status === 'scheduled'} error={errors.plannedDate} htmlFor="pd"><Input id="pd" type="date" value={draft.plannedDate} onChange={(e) => up('plannedDate', e.target.value)} /></Field>
                  <Field label="Preoperative considerations" htmlFor="preop" className="md:col-span-2"><Textarea id="preop" rows={4} value={draft.preopConsiderations} onChange={(e) => up('preopConsiderations', e.target.value)} placeholder="Anaesthetic risk, antiplatelets, neuromonitoring, positioning, implants, consent…" /></Field>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-5">
                <div><h2 className="text-lg font-semibold">Review and save</h2><p className="text-sm text-muted-foreground">Check the summary. The case number is assigned on save.</p></div>
                <div className="rounded-xl border bg-muted/30 p-4"><PatientChip patientId={draft.patientId} /></div>
                <div className="flex flex-wrap gap-2"><StatusBadge kind="caseType" value={draft.type as CaseType} /><StatusBadge kind="category" value={procedureCategory} /><StatusBadge kind="priority" value={draft.priority} /><StatusBadge kind="case" value={draft.status} /></div>
                <KeyValue columns={2} items={[
                  { label: 'Diagnosis', value: draft.diagnosis }, { label: 'Planned procedure', value: draft.plannedProcedure },
                  { label: 'Indication', value: draft.indication, span: true },
                  { label: 'Hospital', value: hospitalName }, { label: 'Planned date', value: draft.plannedDate || 'To be confirmed' },
                  ...(isBrain ? [{ label: 'Brain', value: `${labelOf(brainCategories, draft.brainCategory)} · ${labelOf(brainRegions, draft.brainRegion)} · ${labelOf(lateralities, draft.laterality)} · ${draft.lesionLocation}${draft.lesionSizeMm ? ` · ${draft.lesionSizeMm} mm` : ''}`, span: true }] : []),
                  ...(isSpine ? [{ label: 'Spine', value: `${labelOf(spineCategories, draft.spineCategory)} · ${labelOf(spineRegions, draft.spineRegion)} · ${draft.levels}${draft.instrumentation ? ` · ${draft.instrumentation}` : ''}`, span: true }] : []),
                  { label: 'Preoperative considerations', value: draft.preopConsiderations, span: true },
                ]} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => { try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ } navigate('/cases') }}>Cancel</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={back} disabled={step === 0}><ArrowLeft /> Back</Button>
          {step < steps.length - 1 ? <Button onClick={next}>Continue <ArrowRight /></Button> : <Button onClick={save}><Save /> Create case</Button>}
        </div>
      </div>
    </PageTransition>
  )
}
