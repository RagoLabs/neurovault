import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Eye, FileCheck, FileDown, FileSignature, History, Lock, Printer, Save, Pencil } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { Field, FormSection } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { NotFound } from '@/pages/NotFound'
import { useDataset, saveOperativeReport, finalizeOperativeReport, amendOperativeReport } from '@/services/repository'
import { surgeon, brand } from '@/config/surgeon'
import { fmtDate, fmtDateTime, fullName } from '@/utils/format'
import { savePdf } from '@/utils/export'
import type { OperativeReport, SurgicalCase, SurgeonRole } from '@/types'
import { patientAge } from '@/utils/clinical'
import { Badge } from '@/components/ui/badge'
import { KeyValue } from '@/components/shared/KeyValue'

const brainTemplate = (c: SurgicalCase) => ({
  approach: c.brain?.approach ?? 'Craniotomy',
  procedureDescription: 'POSITIONING: Supine, head fixed in three-pin head holder, turned to the contralateral side. Neuronavigation registered.\n\nINCISION AND EXPOSURE: Curvilinear scalp incision planned with navigation. Scalp opened in layers; haemostasis with scalp clips. Free bone flap raised with craniotome.\n\nDURAL OPENING: Dura opened in C-shaped fashion and reflected to the base.\n\nINTRADURAL PROCEDURE: Under the operating microscope, the lesion was identified and …\n\nCLOSURE: Watertight dural closure. Bone flap replaced and fixed with titanium plates. Scalp closed in layers over a subgaleal drain.',
  intraopMonitoring: 'Neuronavigation; standard anaesthetic monitoring',
  postopPlan: 'Hourly neuro-observations for 24 h. CT head within 24 h. Dexamethasone taper. Continue antiepileptic. Drain out day 1. Mobilise day 1.',
  immediatePostopCondition: 'Extubated in theatre, obeying commands, neurologically at baseline. Transferred to HDU.',
})
const spineTemplate = (c: SurgicalCase) => ({
  approach: c.spine?.approach ?? 'Posterior midline',
  procedureDescription: 'POSITIONING: Prone on a radiolucent frame with all pressure points padded. Level confirmed with lateral fluoroscopy.\n\nEXPOSURE: Midline incision over the planned level(s). Paraspinal muscles elevated subperiosteally; self-retaining retractors placed. Level re-confirmed.\n\nDECOMPRESSION: …\n\nINSTRUMENTATION (if applicable): …\n\nCLOSURE: Haemostasis secured. Wound irrigated and closed in layers with absorbable sutures and skin clips.',
  intraopMonitoring: 'Fluoroscopy; SSEP/MEP where instrumented',
  postopPlan: 'Neuro-observations 4-hourly. Mobilise with physiotherapy day 1. Drain out when <50 mL/24 h. Wound check day 10.',
  immediatePostopCondition: 'Extubated in theatre, moving all four limbs to baseline. Transferred to the ward.',
})

type Form = Omit<OperativeReport, 'id' | 'caseId' | 'status' | 'version' | 'createdAt' | 'updatedAt' | 'finalizedAt' | 'amendments'>

export function OperativeReportEditorPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const d = useDataset()
  const navigate = useNavigate()
  const existing = d.operativeReports.find((r) => r.id === id)
  const caseId = existing?.caseId ?? params.get('case') ?? ''
  const c = d.cases.find((x) => x.id === caseId)
  const patient = d.patients.find((p) => p.id === c?.patientId)
  const hospital = d.hospitals.find((h) => h.id === c?.hospitalId)
  const [preview, setPreview] = useState(false)
  const [amending, setAmending] = useState(false)
  const [amendReason, setAmendReason] = useState('')
  const [amendChanges, setAmendChanges] = useState('')

  const initial = useMemo<Form | null>(() => {
    if (!c) return null
    if (existing) {
      const { id: _i, caseId: _c, status: _s, version: _v, createdAt: _ca, updatedAt: _u, finalizedAt: _f, amendments: _a, ...rest } = existing
      void _i; void _c; void _s; void _v; void _ca; void _u; void _f; void _a
      return rest
    }
    const tpl = c.type === 'spine' ? spineTemplate(c) : brainTemplate(c)
    return {
      team: { primarySurgeon: surgeon.fullName, assistants: [], anaesthetist: '', surgeonRole: c.surgeonRole },
      preopDiagnosis: c.diagnosis, postopDiagnosis: c.diagnosis, procedurePerformed: c.plannedProcedure, approach: tpl.approach, operativeFindings: c.findings, procedureDescription: tpl.procedureDescription,
      intraopMonitoring: tpl.intraopMonitoring, estimatedBloodLossMl: null, specimens: '', implants: c.spine?.instrumentation ?? '', intraopComplications: 'None', immediatePostopCondition: tpl.immediatePostopCondition, postopPlan: tpl.postopPlan, anaesthesiaType: 'General anaesthesia', durationMinutes: c.durationMinutes ?? null,
    }
  }, [c, existing])

  const [form, setForm] = useState<Form | null>(initial)
  useEffect(() => setForm(initial), [initial])

  if (!c || !form) return <NotFound />
  const locked = existing?.status === 'finalized' || existing?.status === 'amended'
  const editable = !locked || amending
  const up = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))

  const validate = () => {
    const missing: string[] = []
    if (!form.procedurePerformed.trim()) missing.push('procedure performed')
    if (!form.postopDiagnosis.trim()) missing.push('postoperative diagnosis')
    if (!form.operativeFindings.trim()) missing.push('operative findings')
    if (form.procedureDescription.trim().length < 40 || form.procedureDescription.includes('…')) missing.push('complete procedure description (remove placeholders)')
    if (!form.team.anaesthetist.trim()) missing.push('anaesthesia provider')
    return missing
  }

  const saveDraft = () => {
    const r = saveOperativeReport({ ...form, id: existing?.id, caseId: c.id, status: existing?.status ?? 'draft', version: existing?.version ?? 1, createdAt: existing?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(), finalizedAt: existing?.finalizedAt, amendments: existing?.amendments ?? [] })
    toast.success('Draft saved')
    if (!existing) navigate(`/operative-reports/${r.id}`, { replace: true })
  }
  const finalize = () => {
    const missing = validate()
    if (missing.length) { toast.error('Cannot finalize', { description: `Complete: ${missing.join(', ')}.` }); return }
    const r = saveOperativeReport({ ...form, id: existing?.id, caseId: c.id, status: 'draft', version: existing?.version ?? 1, createdAt: existing?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(), amendments: existing?.amendments ?? [] })
    finalizeOperativeReport(r.id)
    toast.success('Operative report finalized', { description: 'The report is now locked. Further changes are recorded as amendments.' })
    if (!existing) navigate(`/operative-reports/${r.id}`, { replace: true })
  }
  const submitAmendment = () => {
    if (!existing || amendReason.trim().length < 3 || amendChanges.trim().length < 3) { toast.error('Provide a reason and summary of changes'); return }
    amendOperativeReport(existing.id, { reason: amendReason.trim(), changes: amendChanges.trim(), author: surgeon.fullName }, form)
    setAmending(false); setAmendReason(''); setAmendChanges('')
    toast.success(`Amendment recorded · version ${existing.version + 1}`)
  }

  const pdfSpec = () => ({
    title: 'Operative report',
    subtitle: `${c.caseNumber} · ${fullName(patient)} (${patient?.patientNumber}, ${patient ? patientAge(patient) : '—'} y, ${patient?.sex === 'male' ? 'M' : 'F'})`,
    meta: [hospital?.name ?? '', `Surgery ${fmtDate(c.surgeryDate)}`, `Status: ${existing?.status ?? 'draft'} · v${existing?.version ?? 1}`],
    sections: [
      { heading: 'Case information', keyValues: [['Patient', `${fullName(patient)} · ${patient?.patientNumber}`], ['Case number', c.caseNumber], ['Hospital', hospital?.name ?? ''], ['Date', fmtDate(c.surgeryDate)], ['Procedure category', c.procedureCategory]] as [string, string][] },
      { heading: 'Surgical team', keyValues: [['Primary surgeon', form.team.primarySurgeon], ['Assistants', form.team.assistants.join(', ') || '—'], ['Anaesthesia provider', form.team.anaesthetist], ['Surgeon role', form.team.surgeonRole], ['Anaesthesia', form.anaesthesiaType]] as [string, string][] },
      { heading: 'Procedure details', keyValues: [['Preoperative diagnosis', form.preopDiagnosis], ['Postoperative diagnosis', form.postopDiagnosis], ['Procedure performed', form.procedurePerformed], ['Approach', form.approach], ['Duration', form.durationMinutes ? `${form.durationMinutes} min` : '—'], ['Estimated blood loss', form.estimatedBloodLossMl !== null ? `${form.estimatedBloodLossMl} mL` : '—'], ['Intraoperative monitoring', form.intraopMonitoring], ['Specimens', form.specimens || 'None'], ['Implants / devices', form.implants || 'None'], ['Intraoperative complications', form.intraopComplications]] as [string, string][] },
      { heading: 'Operative findings', paragraphs: [form.operativeFindings] },
      { heading: 'Procedure description', paragraphs: form.procedureDescription.split('\n\n') },
      { heading: 'Postoperative', keyValues: [['Immediate condition', form.immediatePostopCondition], ['Management plan', form.postopPlan]] as [string, string][] },
      ...(existing?.amendments.length ? [{ heading: 'Amendment history', table: { headers: ['Date', 'Author', 'Reason', 'Changes'], rows: existing.amendments.map((a) => [fmtDateTime(a.date), a.author, a.reason, a.changes]) } }] : []),
      { paragraphs: [`Electronically signed: ${surgeon.signatureLine}${existing?.finalizedAt ? ` · Finalized ${fmtDateTime(existing.finalizedAt)}` : ' · DRAFT — not yet finalized'}`] },
    ],
    footer: `${brand.name} · ${brand.demoLabel} · ${surgeon.fullName}`,
    watermark: existing?.status === 'draft' || !existing ? 'DRAFT' : 'DEMO',
  })

  const team = form.team

  return (
    <PageTransition>
      <PageHeader
        title={existing ? `Operative report · ${c.caseNumber}` : `New operative report · ${c.caseNumber}`}
        eyebrow={c.type === 'spine' ? 'Spinal surgery template' : 'Brain surgery template'}
        description={<span className="inline-flex flex-wrap items-center gap-2"><StatusBadge kind="report" value={existing?.status ?? 'draft'} /><span>v{existing?.version ?? 1}</span>{existing?.finalizedAt && <span>· Finalized {fmtDateTime(existing.finalizedAt)}</span>}{locked && !amending && <span className="inline-flex items-center gap-1 text-muted-foreground"><Lock className="size-3.5" /> Locked — amend to change</span>}</span>}
        actions={
          <>
            <Button variant="outline" onClick={() => setPreview(true)}><Eye /> Preview</Button>
            <Button variant="outline" onClick={() => { savePdf(pdfSpec(), `${c.caseNumber}-operative-report-v${existing?.version ?? 1}.pdf`); toast.success('PDF exported') }}><FileDown /> Export PDF</Button>
            <Button variant="outline" onClick={() => { setPreview(true); setTimeout(() => window.print(), 400) }}><Printer /> Print</Button>
            {editable && !amending && <Button variant="outline" onClick={saveDraft}><Save /> Save draft</Button>}
            {!locked && <ConfirmDialog trigger={<Button><FileCheck /> Finalize report</Button>} title="Finalize operative report?" description="A finalized report is locked. Later changes are recorded as tracked amendments with a new version number and reason." confirmLabel="Finalize" onConfirm={finalize} />}
            {locked && !amending && <Button onClick={() => setAmending(true)}><Pencil /> Amend report</Button>}
            {amending && <Button variant="ghost" onClick={() => { setForm(initial); setAmending(false) }}>Cancel amendment</Button>}
            {amending && <Button onClick={submitAmendment}><FileSignature /> Record amendment</Button>}
          </>
        }
      />
      {amending && (
        <div className="mb-5 grid gap-4 rounded-xl border border-lavender/50 bg-lavender/10 p-4 md:grid-cols-2">
          <Field label="Reason for amendment" required htmlFor="ar"><Input id="ar" value={amendReason} onChange={(e) => setAmendReason(e.target.value)} placeholder="e.g. Histopathology result added" /></Field>
          <Field label="Summary of changes" required htmlFor="ac"><Input id="ac" value={amendChanges} onChange={(e) => setAmendChanges(e.target.value)} placeholder="Describe what was changed" /></Field>
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <FormSection title="Case information" description="Pulled from the surgical case record.">
            <Field label="Patient"><Input readOnly value={`${fullName(patient)} · ${patient?.patientNumber}`} className="bg-muted" /></Field>
            <Field label="Case number"><Input readOnly value={c.caseNumber} className="bg-muted" /></Field>
            <Field label="Hospital"><Input readOnly value={hospital?.name ?? ''} className="bg-muted" /></Field>
            <Field label="Date of surgery"><Input readOnly value={fmtDate(c.surgeryDate)} className="bg-muted" /></Field>
            <Field label="Procedure category"><Input readOnly value={c.procedureCategory} className="bg-muted capitalize" /></Field>
            <Field label="Anaesthesia type" htmlFor="an"><Input id="an" disabled={!editable} value={form.anaesthesiaType} onChange={(e) => up('anaesthesiaType', e.target.value)} /></Field>
          </FormSection>
          <FormSection title="Surgical team">
            <Field label="Primary surgeon" htmlFor="ps"><Input id="ps" disabled={!editable} value={team.primarySurgeon} onChange={(e) => up('team', { ...team, primarySurgeon: e.target.value })} /></Field>
            <Field label="Surgeon role"><Select disabled={!editable} value={team.surgeonRole} onValueChange={(v) => up('team', { ...team, surgeonRole: v as SurgeonRole })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="primary">Primary</SelectItem><SelectItem value="assistant">Assistant</SelectItem><SelectItem value="supervising">Supervising</SelectItem></SelectContent></Select></Field>
            <Field label="Assistant surgeons" description="Comma separated" htmlFor="as"><Input id="as" disabled={!editable} value={team.assistants.join(', ')} onChange={(e) => up('team', { ...team, assistants: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} /></Field>
            <Field label="Anaesthesia provider" required htmlFor="ap"><Input id="ap" disabled={!editable} value={team.anaesthetist} onChange={(e) => up('team', { ...team, anaesthetist: e.target.value })} /></Field>
          </FormSection>
          <FormSection title="Procedure details">
            <Field label="Preoperative diagnosis" htmlFor="pre"><Input id="pre" disabled={!editable} value={form.preopDiagnosis} onChange={(e) => up('preopDiagnosis', e.target.value)} /></Field>
            <Field label="Postoperative diagnosis" required htmlFor="post"><Input id="post" disabled={!editable} value={form.postopDiagnosis} onChange={(e) => up('postopDiagnosis', e.target.value)} /></Field>
            <Field label="Procedure performed" required htmlFor="pp" className="md:col-span-2"><Input id="pp" disabled={!editable} value={form.procedurePerformed} onChange={(e) => up('procedurePerformed', e.target.value)} /></Field>
            <Field label="Surgical approach" htmlFor="appr"><Input id="appr" disabled={!editable} value={form.approach} onChange={(e) => up('approach', e.target.value)} /></Field>
            <Field label="Duration (minutes)" htmlFor="dur"><Input id="dur" type="number" min={0} disabled={!editable} value={form.durationMinutes ?? ''} onChange={(e) => up('durationMinutes', e.target.value === '' ? null : Number(e.target.value))} /></Field>
            <Field label="Operative findings" required htmlFor="of" className="md:col-span-2"><Textarea id="of" rows={3} disabled={!editable} value={form.operativeFindings} onChange={(e) => up('operativeFindings', e.target.value)} /></Field>
            <Field label="Procedure description" required htmlFor="pd" className="md:col-span-2" description="Structured narrative. Replace template placeholders (…) before finalizing."><Textarea id="pd" rows={14} disabled={!editable} value={form.procedureDescription} onChange={(e) => up('procedureDescription', e.target.value)} className="font-data text-[13px]" /></Field>
            <Field label="Intraoperative monitoring" htmlFor="im"><Input id="im" disabled={!editable} value={form.intraopMonitoring} onChange={(e) => up('intraopMonitoring', e.target.value)} /></Field>
            <Field label="Estimated blood loss (mL)" htmlFor="ebl"><Input id="ebl" type="number" min={0} disabled={!editable} value={form.estimatedBloodLossMl ?? ''} onChange={(e) => up('estimatedBloodLossMl', e.target.value === '' ? null : Number(e.target.value))} /></Field>
            <Field label="Specimens" htmlFor="sp"><Input id="sp" disabled={!editable} value={form.specimens} onChange={(e) => up('specimens', e.target.value)} /></Field>
            <Field label="Implants and devices" htmlFor="imp"><Input id="imp" disabled={!editable} value={form.implants} onChange={(e) => up('implants', e.target.value)} /></Field>
            <Field label="Intraoperative complications" htmlFor="ic" className="md:col-span-2"><Input id="ic" disabled={!editable} value={form.intraopComplications} onChange={(e) => up('intraopComplications', e.target.value)} /></Field>
            <Field label="Immediate postoperative condition" htmlFor="ipc" className="md:col-span-2"><Textarea id="ipc" rows={2} disabled={!editable} value={form.immediatePostopCondition} onChange={(e) => up('immediatePostopCondition', e.target.value)} /></Field>
            <Field label="Postoperative management plan" htmlFor="pmp" className="md:col-span-2"><Textarea id="pmp" rows={3} disabled={!editable} value={form.postopPlan} onChange={(e) => up('postopPlan', e.target.value)} /></Field>
          </FormSection>
        </div>
        <div className="space-y-4">
          <div className="surface p-5">
            <h3 className="font-semibold">Document status</h3>
            <KeyValue className="mt-3" columns={1} items={[{ label: 'Status', value: <StatusBadge kind="report" value={existing?.status ?? 'draft'} /> }, { label: 'Version', value: `v${existing?.version ?? 1}` }, { label: 'Created', value: existing ? fmtDateTime(existing.createdAt) : 'Not saved yet' }, { label: 'Last updated', value: existing ? fmtDateTime(existing.updatedAt) : '—' }, { label: 'Finalized', value: existing?.finalizedAt ? fmtDateTime(existing.finalizedAt) : 'Not finalized' }, { label: 'Signed by', value: surgeon.signatureLine }]} />
          </div>
          <div className="surface p-5">
            <h3 className="flex items-center gap-2 font-semibold"><History className="size-4" /> Amendment history</h3>
            {existing?.amendments.length ? (
              <ul className="mt-3 space-y-3">
                {existing.amendments.map((a) => <li key={a.id} className="rounded-lg border p-3 text-sm"><div className="flex items-center justify-between"><span className="font-medium">{a.reason}</span><Badge variant="lavender">amended</Badge></div><div className="mt-1 text-xs text-muted-foreground">{fmtDateTime(a.date)} · {a.author}</div><div className="mt-1 text-xs">{a.changes}</div></li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-muted-foreground">No amendments. Finalized reports preserve their content; each amendment increments the version with a recorded reason.</p>}
          </div>
          <div className="surface p-5 text-sm">
            <h3 className="font-semibold">Linked case</h3>
            <Link to={`/cases/${c.id}`} className="mt-2 block text-primary hover:underline">{c.caseNumber} · {c.plannedProcedure}</Link>
          </div>
        </div>
      </div>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-3xl print:max-w-none print:shadow-none print:border-0 print:p-0">
          <DialogHeader className="no-print"><DialogTitle>Report preview</DialogTitle><DialogDescription>Print-friendly layout. Use your browser's print dialog to save as PDF or print.</DialogDescription></DialogHeader>
          <article className="print-area font-data text-[13px] leading-relaxed text-black bg-white p-6 rounded-lg border print:border-0">
            <header className="mb-4 flex items-start justify-between border-b-2 border-[#0B1426] pb-3">
              <div><div className="text-lg font-bold uppercase tracking-wide text-[#0B1426]">Operative report</div><div className="text-xs text-gray-600">{hospital?.name} · Department of Neurosurgery</div></div>
              <div className="text-right text-xs"><div className="font-semibold">{surgeon.fullName}</div><div>{surgeon.credentials}</div><div className="mt-1 uppercase tracking-wider text-[10px] text-gray-500">{brand.demoLabel}</div></div>
            </header>
            <table className="mb-4 w-full text-xs"><tbody>
              <tr><td className="py-0.5 pr-2 font-semibold text-gray-600">Patient</td><td>{fullName(patient)} · {patient?.patientNumber} · {patient ? patientAge(patient) : ''} y · {patient?.sex}</td><td className="py-0.5 pr-2 font-semibold text-gray-600">Case</td><td>{c.caseNumber}</td></tr>
              <tr><td className="py-0.5 pr-2 font-semibold text-gray-600">Date</td><td>{fmtDate(c.surgeryDate)}</td><td className="py-0.5 pr-2 font-semibold text-gray-600">Status</td><td className="uppercase">{existing?.status ?? 'draft'} · v{existing?.version ?? 1}</td></tr>
              <tr><td className="py-0.5 pr-2 font-semibold text-gray-600">Surgeon</td><td>{team.primarySurgeon} ({team.surgeonRole})</td><td className="py-0.5 pr-2 font-semibold text-gray-600">Anaesthetist</td><td>{team.anaesthetist || '—'}</td></tr>
              <tr><td className="py-0.5 pr-2 font-semibold text-gray-600">Assistants</td><td>{team.assistants.join(', ') || '—'}</td><td className="py-0.5 pr-2 font-semibold text-gray-600">Anaesthesia</td><td>{form.anaesthesiaType}</td></tr>
            </tbody></table>
            {[['Preoperative diagnosis', form.preopDiagnosis], ['Postoperative diagnosis', form.postopDiagnosis], ['Procedure performed', form.procedurePerformed], ['Approach', form.approach], ['Operative findings', form.operativeFindings]].map(([k, v]) => <section key={k} className="mb-2"><div className="text-[11px] font-bold uppercase tracking-wider text-gray-600">{k}</div><div>{v || '—'}</div></section>)}
            <section className="mb-2"><div className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Procedure description</div><div className="whitespace-pre-wrap">{form.procedureDescription}</div></section>
            <div className="grid grid-cols-2 gap-x-6">
              {[['Monitoring', form.intraopMonitoring], ['Estimated blood loss', form.estimatedBloodLossMl !== null ? `${form.estimatedBloodLossMl} mL` : '—'], ['Specimens', form.specimens || 'None'], ['Implants', form.implants || 'None'], ['Intraoperative complications', form.intraopComplications], ['Duration', form.durationMinutes ? `${form.durationMinutes} min` : '—']].map(([k, v]) => <section key={k} className="mb-2"><div className="text-[11px] font-bold uppercase tracking-wider text-gray-600">{k}</div><div>{v}</div></section>)}
            </div>
            {[['Immediate postoperative condition', form.immediatePostopCondition], ['Postoperative management plan', form.postopPlan]].map(([k, v]) => <section key={k} className="mb-2"><div className="text-[11px] font-bold uppercase tracking-wider text-gray-600">{k}</div><div>{v}</div></section>)}
            {existing?.amendments.length ? <section className="mt-4 border-t pt-2"><div className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Amendment history</div><ul className="list-disc pl-4 text-xs">{existing.amendments.map((a) => <li key={a.id}>{fmtDateTime(a.date)} — {a.author}: {a.reason}. {a.changes}</li>)}</ul></section> : null}
            <footer className="mt-6 flex items-end justify-between border-t pt-3 text-xs"><div><div className="font-semibold">{surgeon.signatureLine}</div><div className="text-gray-500">{existing?.finalizedAt ? `Electronically signed ${fmtDateTime(existing.finalizedAt)}` : 'DRAFT — not finalized'}</div></div><div className="text-gray-500">Generated by {brand.name} · fictional demonstration data</div></footer>
          </article>
          <DialogFooter className="no-print"><Button variant="outline" onClick={() => window.print()}><Printer /> Print</Button><Button onClick={() => setPreview(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
