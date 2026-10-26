import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Bandage, BedDouble, FileDown, HeartPulse, Plus, Save, Stethoscope } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { KeyValue } from '@/components/shared/KeyValue'
import { PatientChip } from '@/components/shared/PatientChip'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Field, FormSection } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NotFound } from '@/pages/NotFound'
import { useDataset, savePostopNote, saveDischargeSummary, updateSurgicalCase } from '@/services/repository'
import { fmtDate, fullName } from '@/utils/format'
import { surgeon, brand } from '@/config/surgeon'
import { DEMO_REFERENCE_DATE } from '@/config/demo'
import { differenceInCalendarDays } from 'date-fns'
import type { PostopNote, DischargeSummary } from '@/types'
import { RecoveryChart } from '@/components/charts/RecoveryChart'
import { savePdf } from '@/utils/export'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

const woundOptions: PostopNote['woundStatus'][] = ['clean-dry', 'serous-ooze', 'erythema', 'dehiscence', 'infected', 'not-assessed']
const condOptions: PostopNote['clinicalCondition'][] = ['stable', 'improving', 'concern', 'critical']

export function PostopCasePage() {
  const { caseId } = useParams()
  const d = useDataset()
  const [params, setParams] = useSearchParams()
  const reduce = useReducedMotion()
  const c = d.cases.find((x) => x.id === caseId)
  const notes = useMemo(() => d.postopNotes.filter((n) => n.caseId === caseId).sort((a, b) => a.postopDay - b.postopDay), [d.postopNotes, caseId])
  const discharge = useMemo(() => d.dischargeSummaries.find((x) => x.caseId === caseId), [d.dischargeSummaries, caseId])
  const [noteOpen, setNoteOpen] = useState(false)
  if (!c || !c.surgeryDate) return <NotFound />
  const patient = d.patients.find((p) => p.id === c.patientId)
  const hospital = d.hospitals.find((h) => h.id === c.hospitalId)
  const latest = notes.at(-1)
  const inpatient = latest ? latest.dischargeStatus === 'inpatient' : true
  const tab = params.get('tab') ?? 'notes'
  const chart = notes.map((n) => ({ label: `D${n.postopDay}`, pain: n.painScore }))

  return (
    <PageTransition>
      <PageHeader title={`Postoperative care · ${c.caseNumber}`} eyebrow={c.plannedProcedure} description={<span className="inline-flex flex-wrap items-center gap-2"><PatientChip patientId={c.patientId} compact /> · Surgery {fmtDate(c.surgeryDate)} · {hospital?.shortName} · {latest ? (inpatient ? <Badge variant="info"><BedDouble className="size-3" /> Inpatient, day {latest.postopDay}</Badge> : <Badge variant="success">Discharged day {latest.postopDay}</Badge>) : <Badge variant="secondary">No notes yet</Badge>}</span>} actions={<><Button asChild variant="outline"><Link to={`/cases/${c.id}`}>Open case</Link></Button><Button onClick={() => setNoteOpen(true)}><Plus /> Add progress note</Button></>} />
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <TabsList><TabsTrigger value="notes">Progress notes <span className="text-xs text-muted-foreground">{notes.length}</span></TabsTrigger><TabsTrigger value="discharge">Discharge summary</TabsTrigger></TabsList>
        <TabsContent value="notes">
          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard className="lg:col-span-2" title="Progress-note timeline" description="Chronological record; multiple notes per surgery are supported" icon={HeartPulse}>
              {notes.length ? (
                <ol className="relative ml-3 border-l-2 border-border pl-7">
                  {notes.map((n, i) => (
                    <motion.li key={n.id} initial={reduce ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative pb-6 last:pb-0">
                      <span className={cn('absolute -left-[2.45rem] top-0 flex size-7 items-center justify-center rounded-full ring-4 ring-background text-[10px] font-bold text-white', n.clinicalCondition === 'critical' ? 'bg-danger' : n.clinicalCondition === 'concern' ? 'bg-warning text-navy' : n.clinicalCondition === 'improving' ? 'bg-cyan text-navy' : 'bg-success')}>D{n.postopDay}</span>
                      <div className="rounded-xl border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-semibold">Postoperative day {n.postopDay} <span className="font-data text-xs font-normal text-muted-foreground">· {fmtDate(n.date)} · {n.author}</span></div><div className="flex gap-2"><Badge variant={n.clinicalCondition === 'critical' ? 'danger' : n.clinicalCondition === 'concern' ? 'warning' : n.clinicalCondition === 'improving' ? 'info' : 'success'}>{n.clinicalCondition}</Badge><Badge variant={n.dischargeStatus === 'inpatient' ? 'info' : 'success'}>{n.dischargeStatus}</Badge></div></div>
                        <KeyValue className="mt-3" columns={2} items={[{ label: 'Neurological findings', value: n.neuroFindings, span: true }, { label: 'Pain', value: n.painScore === null ? 'Not recorded' : `${n.painScore}/10` }, { label: 'Wound', value: <span className="inline-flex items-center gap-1 capitalize"><Bandage className="size-3.5" /> {n.woundStatus.replace(/-/g, ' ')}</span> }, { label: 'Observations', value: n.observations, span: true }, { label: 'Complications', value: n.complications }, { label: 'Plan', value: n.plan }]} />
                      </div>
                    </motion.li>
                  ))}
                </ol>
              ) : <EmptyState compact icon={HeartPulse} title="No progress notes" description="Add the first postoperative note." action={<Button onClick={() => setNoteOpen(true)}><Plus /> Add note</Button>} />}
            </SectionCard>
            <div className="space-y-4">
              <SectionCard title="Pain trend" description="Recorded pain scores by postoperative day">
                {notes.some((n) => n.painScore !== null) ? <RecoveryChart data={chart} series={[{ key: 'pain', name: 'Pain NRS', color: 'var(--chart-other)' }]} yDomain={[0, 10]} height={180} /> : <p className="text-sm text-muted-foreground">No pain scores recorded.</p>}
              </SectionCard>
              <SectionCard title="Complications on case">
                {c.complications.length ? <ul className="space-y-2 text-sm">{c.complications.map((k) => <li key={k.id} className="flex items-start justify-between gap-2"><span>{k.description}</span><Badge variant={k.severity === 'major' ? 'danger' : k.severity === 'moderate' ? 'warning' : 'secondary'}>{k.severity}</Badge></li>)}</ul> : <p className="text-sm text-muted-foreground">None recorded.</p>}
              </SectionCard>
              <SectionCard title="Outcome"><StatusBadge kind="outcome" value={c.outcome ?? 'unknown'} /></SectionCard>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="discharge">
          <DischargeForm caseId={c.id} patientId={c.patientId} surgeryDate={c.surgeryDate} existing={discharge} diagnosis={c.diagnosis} procedure={c.plannedProcedure} latestDay={latest?.postopDay} patientLabel={`${fullName(patient)} · ${patient?.patientNumber}`} hospitalName={hospital?.name ?? ''} />
        </TabsContent>
      </Tabs>
      <NoteDialog open={noteOpen} onOpenChange={setNoteOpen} caseId={c.id} patientId={c.patientId} surgeryDate={c.surgeryDate} nextDay={(latest?.postopDay ?? 0) + 1} />
    </PageTransition>
  )
}

function NoteDialog({ open, onOpenChange, caseId, patientId, surgeryDate, nextDay }: { open: boolean; onOpenChange: (o: boolean) => void; caseId: string; patientId: string; surgeryDate: string; nextDay: number }) {
  const maxDay = Math.max(1, differenceInCalendarDays(new Date(`${DEMO_REFERENCE_DATE}T00:00:00`), new Date(`${surgeryDate}T00:00:00`)))
  const [day, setDay] = useState(String(Math.min(nextDay, maxDay)))
  const [neuro, setNeuro] = useState('')
  const [cond, setCond] = useState<PostopNote['clinicalCondition']>('stable')
  const [pain, setPain] = useState('')
  const [wound, setWound] = useState<PostopNote['woundStatus']>('clean-dry')
  const [obs, setObs] = useState('')
  const [comp, setComp] = useState('None')
  const [plan, setPlan] = useState('')
  const [disch, setDisch] = useState<PostopNote['dischargeStatus']>('inpatient')
  const [err, setErr] = useState<Record<string, string>>({})
  const save = () => {
    const e: Record<string, string> = {}
    const dn = Number(day)
    if (!Number.isInteger(dn) || dn < 0 || dn > maxDay) e.day = `Postoperative day must be 0–${maxDay}`
    if (neuro.trim().length < 5) e.neuro = 'Neurological findings are required'
    if (pain !== '' && (Number(pain) < 0 || Number(pain) > 10)) e.pain = 'Pain is 0–10'
    if (plan.trim().length < 3) e.plan = 'Management plan is required'
    setErr(e); if (Object.keys(e).length) return
    const date = new Date(`${surgeryDate}T00:00:00`); date.setDate(date.getDate() + dn)
    savePostopNote({ caseId, patientId, date: date.toISOString().slice(0, 10), postopDay: dn, neuroFindings: neuro.trim(), clinicalCondition: cond, painScore: pain === '' ? null : Number(pain), woundStatus: wound, observations: obs.trim(), complications: comp.trim() || 'None', plan: plan.trim(), dischargeStatus: disch, author: surgeon.fullName })
    toast.success(`Postoperative day ${dn} note added`, { description: 'The surgical case and patient timeline have been updated.' })
    onOpenChange(false); setNeuro(''); setObs(''); setPlan(''); setPain('')
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New postoperative progress note</DialogTitle><DialogDescription>Documented by {surgeon.fullName}. The note date is derived from the surgery date and postoperative day.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Postoperative day" required error={err.day} htmlFor="pday"><Input id="pday" type="number" min={0} max={maxDay} value={day} onChange={(e) => setDay(e.target.value)} /></Field>
          <Field label="Clinical condition"><Select value={cond} onValueChange={(v) => setCond(v as PostopNote['clinicalCondition'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{condOptions.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Neurological findings" required error={err.neuro} htmlFor="pneuro" className="sm:col-span-2"><Textarea id="pneuro" rows={3} value={neuro} onChange={(e) => setNeuro(e.target.value)} /></Field>
          <Field label="Pain score (0–10)" error={err.pain} htmlFor="ppain" description="Leave empty if not assessed"><Input id="ppain" type="number" min={0} max={10} value={pain} onChange={(e) => setPain(e.target.value)} /></Field>
          <Field label="Wound status"><Select value={wound} onValueChange={(v) => setWound(v as PostopNote['woundStatus'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{woundOptions.map((o) => <SelectItem key={o} value={o} className="capitalize">{o.replace(/-/g, ' ')}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Relevant observations" htmlFor="pobs" className="sm:col-span-2"><Textarea id="pobs" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Temperature, haemodynamics, drains, mobility…" /></Field>
          <Field label="Complications" htmlFor="pcomp"><Input id="pcomp" value={comp} onChange={(e) => setComp(e.target.value)} /></Field>
          <Field label="Discharge status"><Select value={disch} onValueChange={(v) => setDisch(v as PostopNote['dischargeStatus'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="inpatient">Inpatient</SelectItem><SelectItem value="discharged">Discharged</SelectItem><SelectItem value="transferred">Transferred</SelectItem><SelectItem value="deceased">Deceased</SelectItem></SelectContent></Select></Field>
          <Field label="Management plan" required error={err.plan} htmlFor="pplan" className="sm:col-span-2"><Textarea id="pplan" rows={2} value={plan} onChange={(e) => setPlan(e.target.value)} /></Field>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}><Save /> Save note</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DischargeForm({ caseId, patientId, surgeryDate, existing, diagnosis, procedure, latestDay, patientLabel, hospitalName }: { caseId: string; patientId: string; surgeryDate: string; existing?: DischargeSummary; diagnosis: string; procedure: string; latestDay?: number; patientLabel: string; hospitalName: string }) {
  const [f, setF] = useState<Omit<DischargeSummary, 'id' | 'caseId' | 'patientId'>>(existing ? { ...existing } : { admissionDate: surgeryDate, dischargeDate: DEMO_REFERENCE_DATE, finalDiagnosis: diagnosis, procedure, hospitalCourse: '', conditionAtDischarge: '', medications: '', instructions: '', followUpPlan: `Clinic review with ${surgeon.shortName} in 2 weeks, then 6 weeks.`, author: surgeon.fullName })
  const [err, setErr] = useState<Record<string, string>>({})
  const up = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const save = () => {
    const e: Record<string, string> = {}
    if (f.dischargeDate < f.admissionDate) e.dischargeDate = 'Discharge cannot be before admission'
    if (f.dischargeDate > DEMO_REFERENCE_DATE) e.dischargeDate = 'Discharge date cannot be in the future'
    if (f.hospitalCourse.trim().length < 10) e.hospitalCourse = 'Describe the hospital course'
    if (f.conditionAtDischarge.trim().length < 3) e.conditionAtDischarge = 'Condition at discharge is required'
    setErr(e); if (Object.keys(e).length) return
    saveDischargeSummary({ ...f, id: existing?.id, caseId, patientId })
    const dn = differenceInCalendarDays(new Date(`${f.dischargeDate}T00:00:00`), new Date(`${surgeryDate}T00:00:00`))
    if (latestDay === undefined || latestDay < dn) {
      savePostopNote({ caseId, patientId, date: f.dischargeDate, postopDay: dn, neuroFindings: f.conditionAtDischarge, clinicalCondition: 'stable', painScore: null, woundStatus: 'clean-dry', observations: 'Discharge summary completed.', complications: 'None', plan: f.followUpPlan, dischargeStatus: 'discharged', author: surgeon.fullName })
    }
    updateSurgicalCase(caseId, {})
    toast.success('Discharge summary saved')
  }
  const exportPdf = () => {
    savePdf({ title: 'Discharge summary', subtitle: patientLabel, meta: [hospitalName, `Admitted ${fmtDate(f.admissionDate)} · Discharged ${fmtDate(f.dischargeDate)}`], sections: [{ heading: 'Diagnosis and procedure', keyValues: [['Final diagnosis', f.finalDiagnosis], ['Procedure', f.procedure]] }, { heading: 'Hospital course', paragraphs: [f.hospitalCourse] }, { heading: 'Discharge', keyValues: [['Condition at discharge', f.conditionAtDischarge], ['Medications', f.medications], ['Instructions', f.instructions], ['Follow-up plan', f.followUpPlan]] }, { paragraphs: [`Signed: ${surgeon.signatureLine}`] }], footer: `${brand.name} · ${brand.demoLabel}`, watermark: 'DEMO' }, `discharge-summary-${caseId}.pdf`)
    toast.success('Discharge summary PDF generated')
  }
  return (
    <div className="space-y-5">
      <FormSection title="Discharge summary" description={existing ? `Last saved · author ${existing.author}` : 'Complete and save to document discharge. Saving also records a discharge progress note.'}>
        <Field label="Admission date" htmlFor="adm"><Input id="adm" type="date" value={f.admissionDate} onChange={(e) => up('admissionDate', e.target.value)} /></Field>
        <Field label="Discharge date" required error={err.dischargeDate} htmlFor="dis"><Input id="dis" type="date" max={DEMO_REFERENCE_DATE} value={f.dischargeDate} onChange={(e) => up('dischargeDate', e.target.value)} /></Field>
        <Field label="Final diagnosis" htmlFor="fd"><Input id="fd" value={f.finalDiagnosis} onChange={(e) => up('finalDiagnosis', e.target.value)} /></Field>
        <Field label="Procedure" htmlFor="pr"><Input id="pr" value={f.procedure} onChange={(e) => up('procedure', e.target.value)} /></Field>
        <Field label="Hospital course" required error={err.hospitalCourse} htmlFor="hc" className="md:col-span-2"><Textarea id="hc" rows={4} value={f.hospitalCourse} onChange={(e) => up('hospitalCourse', e.target.value)} /></Field>
        <Field label="Condition at discharge" required error={err.conditionAtDischarge} htmlFor="cd" className="md:col-span-2"><Input id="cd" value={f.conditionAtDischarge} onChange={(e) => up('conditionAtDischarge', e.target.value)} /></Field>
        <Field label="Discharge medications" htmlFor="dm"><Textarea id="dm" rows={3} value={f.medications} onChange={(e) => up('medications', e.target.value)} /></Field>
        <Field label="Patient instructions" htmlFor="pi"><Textarea id="pi" rows={3} value={f.instructions} onChange={(e) => up('instructions', e.target.value)} /></Field>
        <Field label="Follow-up plan" htmlFor="fp" className="md:col-span-2"><Input id="fp" value={f.followUpPlan} onChange={(e) => up('followUpPlan', e.target.value)} /></Field>
      </FormSection>
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={exportPdf} disabled={!existing}><FileDown /> Export PDF</Button><Button onClick={save}><Stethoscope /> {existing ? 'Update summary' : 'Save discharge summary'}</Button></div>
    </div>
  )
}
