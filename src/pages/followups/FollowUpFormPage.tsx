import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { CalendarCheck, CalendarX, Save, X, Ban } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { Field, FormSection } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PatientSelect } from '@/components/shared/PatientSelect'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { NotFound } from '@/pages/NotFound'
import { useDataset, createFollowup, updateFollowup } from '@/services/repository'
import { deriveFollowUpStatus } from '@/utils/clinical'
import { DEMO_REFERENCE_DATE } from '@/config/demo'
import { visitTypes } from '@/components/clinical/clinicalOptions'
import type { ClinicalOutcome, FollowUp, VisitType } from '@/types'
import { useDemoStore } from '@/stores/demoStore'

export function FollowUpFormPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const d = useDataset()
  const navigate = useNavigate()
  const defaultHospital = useDemoStore((s) => s.preferences.defaultHospitalId)
  const existing = d.followUps.find((f) => f.id === id)
  const presetCase = d.cases.find((c) => c.id === params.get('case'))
  const [patientId, setPatientId] = useState(existing?.patientId ?? presetCase?.patientId ?? params.get('patient') ?? '')
  const [caseId, setCaseId] = useState(existing?.caseId ?? presetCase?.id ?? '')
  const cases = useMemo(() => d.cases.filter((c) => c.patientId === patientId), [d.cases, patientId])
  const [f, setF] = useState<Omit<FollowUp, 'id' | 'patientId' | 'caseId'>>(existing ? { ...existing } : { date: DEMO_REFERENCE_DATE, time: '09:00', visitType: 'postoperative-review', status: 'scheduled', hospitalId: presetCase?.hospitalId ?? defaultHospital, painScore: null, requiresFurtherAssessment: false })
  const [mode, setMode] = useState<'schedule' | 'record'>(existing && existing.status !== 'completed' && existing.date <= DEMO_REFERENCE_DATE ? 'record' : existing?.status === 'completed' ? 'record' : 'schedule')
  const [err, setErr] = useState<Record<string, string>>({})
  if (id && !existing) return <NotFound />
  const up = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const derived = existing ? deriveFollowUpStatus(existing) : undefined

  const persist = (status: FollowUp['status']) => {
    const e: Record<string, string> = {}
    if (!patientId) e.patientId = 'Select a patient'
    if (!caseId) e.caseId = 'Select the associated surgical case'
    if (!f.date) e.date = 'Date is required'
    if (status === 'completed') {
      if (f.date > DEMO_REFERENCE_DATE) e.date = 'A completed review cannot be dated in the future'
      if (!f.neuroExam?.trim()) e.neuroExam = 'Record the neurological examination'
      if (!f.outcome) e.outcome = 'Select the documented clinical outcome (choose Unknown if not assessable)'
      if (!f.plan?.trim()) e.plan = 'Management plan is required'
      if (f.nextFollowUpDate && f.nextFollowUpDate <= f.date) e.nextFollowUpDate = 'Next follow-up must be after this review'
    }
    if (f.painScore !== null && f.painScore !== undefined && (f.painScore < 0 || f.painScore > 10)) e.painScore = 'Pain is 0–10'
    setErr(e); if (Object.keys(e).length) return
    const payload = { ...f, status, patientId, caseId }
    if (existing) { updateFollowup(existing.id, payload); toast.success(status === 'completed' ? 'Follow-up completed' : status === 'missed' ? 'Marked as missed' : status === 'cancelled' ? 'Appointment cancelled' : 'Follow-up updated') }
    else { createFollowup(payload); toast.success(status === 'completed' ? 'Follow-up recorded' : 'Follow-up scheduled') }
    if (status === 'completed' && f.nextFollowUpDate) {
      createFollowup({ patientId, caseId, date: f.nextFollowUpDate, time: f.time, visitType: 'routine', status: 'scheduled', hospitalId: f.hospitalId, painScore: null })
      toast.info('Next follow-up scheduled', { description: f.nextFollowUpDate })
    }
    navigate(`/cases/${caseId}?tab=followups`)
  }

  const recording = mode === 'record'

  return (
    <PageTransition>
      <PageHeader title={existing ? (existing.status === 'completed' ? 'Follow-up findings' : 'Follow-up appointment') : 'Record follow-up'} description={<span className="inline-flex items-center gap-2">{derived && <StatusBadge kind="followUp" value={derived} />}{existing ? `Appointment on ${existing.date} at ${existing.time}` : 'Schedule a review, or record findings of a completed visit.'}</span>} actions={!existing && <div className="flex items-center gap-2 text-sm"><Label htmlFor="mode">Record findings now</Label><Switch id="mode" checked={recording} onCheckedChange={(v) => setMode(v ? 'record' : 'schedule')} /></div>} />
      <div className="space-y-5 pb-24">
        <FormSection title="Appointment" description="Patient, case and scheduling details.">
          <Field label="Patient" required error={err.patientId}><PatientSelect value={patientId} onChange={(v) => { setPatientId(v); setCaseId('') }} disabled={!!existing} /></Field>
          <Field label="Associated surgical case" required error={err.caseId}><Select value={caseId} onValueChange={(v) => { setCaseId(v); const c = d.cases.find((x) => x.id === v); if (c) up('hospitalId', c.hospitalId) }} disabled={!patientId || !!existing}><SelectTrigger><SelectValue placeholder={patientId ? 'Select case' : 'Select a patient first'} /></SelectTrigger><SelectContent>{cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.caseNumber} · {c.plannedProcedure}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Follow-up date" required error={err.date} htmlFor="fdate"><Input id="fdate" type="date" value={f.date} onChange={(e) => up('date', e.target.value)} /></Field>
          <Field label="Time" htmlFor="ftime"><Input id="ftime" type="time" value={f.time} onChange={(e) => up('time', e.target.value)} /></Field>
          <Field label="Visit type"><Select value={f.visitType} onValueChange={(v) => up('visitType', v as VisitType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{visitTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Location"><Select value={f.hospitalId} onValueChange={(v) => up('hospitalId', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{d.hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Notes" htmlFor="fnotes" className="md:col-span-2"><Input id="fnotes" value={f.notes ?? ''} onChange={(e) => up('notes', e.target.value)} placeholder="e.g. bring imaging; pre-admission consent" /></Field>
        </FormSection>

        {recording && (
          <>
            <FormSection title="Clinical findings" description="Documented at the visit.">
              <Field label="Symptoms" htmlFor="sym" className="md:col-span-2"><Textarea id="sym" rows={2} value={f.symptoms ?? ''} onChange={(e) => up('symptoms', e.target.value)} /></Field>
              <Field label="Neurological examination" required error={err.neuroExam} htmlFor="ne" className="md:col-span-2"><Textarea id="ne" rows={3} value={f.neuroExam ?? ''} onChange={(e) => up('neuroExam', e.target.value)} /></Field>
              <Field label="Pain score (0–10)" error={err.painScore} htmlFor="ps" description="Where applicable; leave empty if not assessed"><Input id="ps" type="number" min={0} max={10} value={f.painScore ?? ''} onChange={(e) => up('painScore', e.target.value === '' ? null : Number(e.target.value))} /></Field>
              <Field label="Wound assessment" htmlFor="wa"><Input id="wa" value={f.woundAssessment ?? ''} onChange={(e) => up('woundAssessment', e.target.value)} /></Field>
              <Field label="Functional recovery" htmlFor="fr"><Input id="fr" value={f.functionalRecovery ?? ''} onChange={(e) => up('functionalRecovery', e.target.value)} /></Field>
              <Field label="Imaging review" htmlFor="ir"><Input id="ir" value={f.imagingReview ?? ''} onChange={(e) => up('imagingReview', e.target.value)} /></Field>
              <Field label="Complications" htmlFor="co" className="md:col-span-2"><Input id="co" value={f.complications ?? ''} onChange={(e) => up('complications', e.target.value)} placeholder="None" /></Field>
            </FormSection>
            <FormSection title="Outcome and plan">
              <Field label="Clinical outcome" required error={err.outcome} description="Choose Unknown rather than guessing when the outcome cannot be assessed"><Select value={f.outcome ?? ''} onValueChange={(v) => up('outcome', v as ClinicalOutcome)}><SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger><SelectContent>{(['improved', 'stable', 'deteriorated', 'deceased', 'unknown'] as ClinicalOutcome[]).map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Requires further assessment"><div className="flex h-9 items-center gap-2"><Switch id="rfa" checked={!!f.requiresFurtherAssessment} onCheckedChange={(v) => up('requiresFurtherAssessment', v)} /><Label htmlFor="rfa">Flag this patient</Label></div></Field>
              <Field label="Management plan" required error={err.plan} htmlFor="pl" className="md:col-span-2"><Textarea id="pl" rows={3} value={f.plan ?? ''} onChange={(e) => up('plan', e.target.value)} /></Field>
              <Field label="Next follow-up date" error={err.nextFollowUpDate} htmlFor="nfd" description="A scheduled appointment is created automatically"><Input id="nfd" type="date" value={f.nextFollowUpDate ?? ''} onChange={(e) => up('nextFollowUpDate', e.target.value || undefined)} /></Field>
            </FormSection>
          </>
        )}

        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/85 backdrop-blur no-print">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-end gap-2 px-4 py-3 md:px-8">
            {Object.keys(err).length > 0 && <span className="mr-auto text-sm text-destructive">Please correct the highlighted fields.</span>}
            <Button variant="ghost" onClick={() => navigate(-1)}><X /> Cancel</Button>
            {existing && existing.status === 'scheduled' && <><Button variant="outline" onClick={() => persist('missed')}><CalendarX /> Mark missed</Button><Button variant="outline" onClick={() => persist('cancelled')}><Ban /> Cancel appointment</Button></>}
            {!recording && <Button onClick={() => persist('scheduled')}><Save /> {existing ? 'Save changes' : 'Schedule follow-up'}</Button>}
            {recording && <Button onClick={() => persist('completed')}><CalendarCheck /> {existing?.status === 'completed' ? 'Update findings' : 'Complete follow-up'}</Button>}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
