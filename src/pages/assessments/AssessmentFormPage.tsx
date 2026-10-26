import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Save, X } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { Field, FormSection } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PatientSelect } from '@/components/shared/PatientSelect'
import { GcsInput } from '@/components/clinical/GcsInput'
import { PupilInput } from '@/components/clinical/PupilInput'
import { MotorPowerGrid } from '@/components/clinical/MotorPowerGrid'
import { assessmentTypes } from '@/components/clinical/clinicalOptions'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { useDataset, saveAssessment } from '@/services/repository'
import { surgeon } from '@/config/surgeon'
import { DEMO_REFERENCE_DATE } from '@/config/demo'
import type { AssessmentType, GCSComponents, MotorPower, PupilExam, NeuroAssessment } from '@/types'
import { computeOdi, odiCategory } from '@/utils/clinical'
import { Slider } from '@/components/ui/slider'

const odiSections = ['Pain intensity', 'Personal care', 'Lifting', 'Walking', 'Sitting', 'Standing', 'Sleeping', 'Social life', 'Travelling', 'Employment / homemaking']

export function AssessmentFormPage() {
  const [params] = useSearchParams()
  const d = useDataset()
  const navigate = useNavigate()
  const presetCase = d.cases.find((c) => c.id === params.get('case'))
  const [patientId, setPatientId] = useState(presetCase?.patientId ?? params.get('patient') ?? '')
  const [caseId, setCaseId] = useState(presetCase?.id ?? '')
  const cases = useMemo(() => d.cases.filter((c) => c.patientId === patientId), [d.cases, patientId])
  const selectedCase = cases.find((c) => c.id === caseId)
  const [domain, setDomain] = useState<'brain' | 'spine'>(selectedCase?.type === 'spine' ? 'spine' : 'brain')
  const [type, setType] = useState<AssessmentType>('outpatient-follow-up')
  const [date, setDate] = useState(DEMO_REFERENCE_DATE)
  const [gcs, setGcs] = useState<GCSComponents>({ eye: 4, verbal: 5, motor: 6 })
  const [pupils, setPupils] = useState<{ left: PupilExam; right: PupilExam }>({ left: { size: 3, reaction: 'brisk' }, right: { size: 3, reaction: 'brisk' } })
  const [motor, setMotor] = useState<MotorPower>({ rightUpper: 5, leftUpper: 5, rightLower: 5, leftLower: 5 })
  const [cranialNerves, setCranialNerves] = useState('Intact')
  const [sensory, setSensory] = useState('Intact')
  const [reflexes, setReflexes] = useState('Normal and symmetrical')
  const [deficits, setDeficits] = useState('')
  const [pain, setPain] = useState<number | null>(null)
  const [odi, setOdi] = useState<(number | null)[]>(Array(10).fill(null))
  const [functional, setFunctional] = useState('')
  const [bowelBladder, setBowelBladder] = useState('Normal')
  const [spinalLevel, setSpinalLevel] = useState(selectedCase?.spine?.levels.join(', ') ?? '')
  const [mrs, setMrs] = useState<string>('')
  const [kps, setKps] = useState<string>('')
  const [asia, setAsia] = useState<NeuroAssessment['asiaGrade']>('not-assessed')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const odiScore = computeOdi(odi)

  const onCase = (id: string) => {
    setCaseId(id)
    const c = d.cases.find((x) => x.id === id)
    if (c) { setDomain(c.type === 'spine' ? 'spine' : 'brain'); setSpinalLevel(c.spine?.levels.join(', ') ?? '') }
  }

  const save = () => {
    const e: Record<string, string> = {}
    if (!patientId) e.patientId = 'Select a patient'
    if (!caseId) e.caseId = 'Select the associated surgical case'
    if (!date || date > DEMO_REFERENCE_DATE) e.date = 'Enter a valid assessment date (not in the future)'
    if (kps && (Number(kps) < 0 || Number(kps) > 100 || Number(kps) % 10 !== 0)) e.kps = 'KPS is 0–100 in steps of 10'
    setErrors(e)
    if (Object.keys(e).length) return
    const a = saveAssessment({
      patientId, caseId, date, type, domain,
      gcs: domain === 'brain' ? gcs : undefined, pupils: domain === 'brain' ? pupils : undefined, cranialNerves: domain === 'brain' ? cranialNerves : undefined,
      motor, sensory, reflexes: domain === 'spine' ? reflexes : undefined,
      deficits: deficits.split(/[;\n]/).map((s) => s.trim()).filter(Boolean),
      painScore: domain === 'spine' ? pain : null, odiScore: domain === 'spine' ? odiScore : null, functionalStatus: functional || undefined, bowelBladder: domain === 'spine' ? bowelBladder : undefined, spinalLevel: domain === 'spine' ? spinalLevel : undefined,
      mrs: domain === 'brain' && mrs !== '' ? Number(mrs) : null, kps: domain === 'brain' && kps !== '' ? Number(kps) : null, asiaGrade: domain === 'spine' ? asia : undefined,
      notes, assessedBy: surgeon.fullName,
    })
    toast.success('Neurological assessment recorded', { description: 'The patient timeline and recovery comparison have been updated.' })
    navigate(`/assessments/${a.id}`)
  }

  return (
    <PageTransition>
      <PageHeader title="New neurological assessment" description="Record a repeatable examination. Components that cannot be tested are recorded as not testable rather than scored." />
      <div className="space-y-5 pb-24">
        <FormSection title="Context" description="Every assessment is linked to a surgical case so it can be compared over time.">
          <Field label="Patient" required error={errors.patientId}><PatientSelect value={patientId} onChange={(v) => { setPatientId(v); setCaseId('') }} /></Field>
          <Field label="Surgical case" required error={errors.caseId}><Select value={caseId} onValueChange={onCase} disabled={!patientId}><SelectTrigger><SelectValue placeholder={patientId ? (cases.length ? 'Select case' : 'No cases for this patient') : 'Select a patient first'} /></SelectTrigger><SelectContent>{cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.caseNumber} · {c.plannedProcedure}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Assessment type"><Select value={type} onValueChange={(v) => setType(v as AssessmentType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{assessmentTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Date" required error={errors.date} htmlFor="adate"><Input id="adate" type="date" max={DEMO_REFERENCE_DATE} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Assessment domain" description="Determines which examination sections are shown"><Select value={domain} onValueChange={(v) => setDomain(v as 'brain' | 'spine')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="brain">Brain</SelectItem><SelectItem value="spine">Spine</SelectItem></SelectContent></Select></Field>
        </FormSection>

        {domain === 'brain' && (
          <section className="surface space-y-4 p-5 md:p-6">
            <div><h2 className="text-base font-semibold">Brain assessment</h2><p className="text-sm text-muted-foreground">Glasgow Coma Scale, pupils, cranial nerves, limb power, sensation and deficits.</p></div>
            <GcsInput value={gcs} onChange={setGcs} />
            <PupilInput value={pupils} onChange={setPupils} />
            <MotorPowerGrid value={motor} onChange={setMotor} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Cranial nerve findings" htmlFor="cn"><Input id="cn" value={cranialNerves} onChange={(e) => setCranialNerves(e.target.value)} /></Field>
              <Field label="Sensory findings" htmlFor="sens"><Input id="sens" value={sensory} onChange={(e) => setSensory(e.target.value)} /></Field>
              <Field label="Modified Rankin Scale (0–6)" description="Optional" htmlFor="mrs"><Select value={mrs} onValueChange={setMrs}><SelectTrigger id="mrs"><SelectValue placeholder="Not recorded" /></SelectTrigger><SelectContent>{['0 — No symptoms', '1 — No significant disability', '2 — Slight disability', '3 — Moderate disability', '4 — Moderately severe disability', '5 — Severe disability', '6 — Dead'].map((l, i) => <SelectItem key={i} value={String(i)}>{l}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Karnofsky performance status" description="0–100 in steps of 10, optional" error={errors.kps} htmlFor="kps"><Input id="kps" type="number" min={0} max={100} step={10} value={kps} onChange={(e) => setKps(e.target.value)} /></Field>
              <Field label="Neurological deficits" description="Separate with semicolons; leave empty if none" htmlFor="def" className="md:col-span-2"><Input id="def" value={deficits} onChange={(e) => setDeficits(e.target.value)} /></Field>
              <Field label="Functional status" htmlFor="fs" className="md:col-span-2"><Input id="fs" value={functional} onChange={(e) => setFunctional(e.target.value)} /></Field>
            </div>
          </section>
        )}

        {domain === 'spine' && (
          <section className="surface space-y-4 p-5 md:p-6">
            <div><h2 className="text-base font-semibold">Spine assessment</h2><p className="text-sm text-muted-foreground">Limb motor examination, sensation, reflexes, pain, function and sphincter symptoms.</p></div>
            <MotorPowerGrid value={motor} onChange={setMotor} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Spinal level" htmlFor="lvl"><Input id="lvl" value={spinalLevel} onChange={(e) => setSpinalLevel(e.target.value)} /></Field>
              <Field label="Sensory findings" htmlFor="ssens"><Input id="ssens" value={sensory} onChange={(e) => setSensory(e.target.value)} /></Field>
              <Field label="Reflexes" htmlFor="refl"><Input id="refl" value={reflexes} onChange={(e) => setReflexes(e.target.value)} /></Field>
              <Field label="Bowel and bladder" htmlFor="bb"><Input id="bb" value={bowelBladder} onChange={(e) => setBowelBladder(e.target.value)} /></Field>
              <Field label="Pain score (NRS)" description={pain === null ? 'Not recorded — move the slider to record' : `${pain}/10`}>
                <div className="flex items-center gap-3 h-9"><Slider min={0} max={10} step={1} value={[pain ?? 0]} onValueChange={(v) => setPain(v[0])} className="flex-1" /><Button type="button" size="sm" variant="ghost" onClick={() => setPain(null)}>Clear</Button></div>
              </Field>
              <Field label="ASIA impairment grade" description="Demonstration only — entered manually, not auto-classified"><Select value={asia ?? 'not-assessed'} onValueChange={(v) => setAsia(v as NeuroAssessment['asiaGrade'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['A', 'B', 'C', 'D', 'E'].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}<SelectItem value="not-assessed">Not assessed</SelectItem></SelectContent></Select></Field>
              <Field label="Neurological deficits" description="Separate with semicolons; leave empty if none" htmlFor="sdef" className="md:col-span-2"><Input id="sdef" value={deficits} onChange={(e) => setDeficits(e.target.value)} /></Field>
              <Field label="Functional limitations" htmlFor="sfs" className="md:col-span-2"><Input id="sfs" value={functional} onChange={(e) => setFunctional(e.target.value)} /></Field>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between"><div className="text-sm font-semibold">Oswestry Disability Index (optional)</div><div className="font-data text-sm font-bold tabular-nums">{odiScore === null ? 'Not scored' : `${odiScore}% · ${odiCategory(odiScore)}`}</div></div>
              <div className="grid gap-2 sm:grid-cols-2">
                {odiSections.map((s, i) => (
                  <div key={s} className="flex items-center justify-between gap-2 text-sm"><span>{s}</span>
                    <Select value={odi[i] === null ? 'NA' : String(odi[i])} onValueChange={(v) => setOdi((o) => o.map((x, k) => (k === i ? (v === 'NA' ? null : Number(v)) : x)))}><SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NA">Not answered</SelectItem>{[0, 1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Scored from answered sections only (section score ÷ max × 100).</p>
            </div>
            <DemoNotice>ISNCSCI/ASIA classification is not computed automatically in this prototype. The grade field is a manual entry for demonstration.</DemoNotice>
          </section>
        )}

        <FormSection title="Additional observations">
          <Field label="Notes" htmlFor="notes" className="md:col-span-2"><Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </FormSection>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/85 backdrop-blur no-print">
          <div className="mx-auto flex max-w-[1500px] items-center justify-end gap-2 px-4 py-3 md:px-8">
            {Object.keys(errors).length > 0 && <span className="mr-auto text-sm text-destructive">Please correct the highlighted fields.</span>}
            <Button variant="ghost" onClick={() => navigate(-1)}><X /> Cancel</Button>
            <Button onClick={save}><Save /> Save assessment</Button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
