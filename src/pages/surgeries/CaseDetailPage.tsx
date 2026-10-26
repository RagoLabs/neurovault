import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Activity, AlertTriangle, Bone, Brain, CalendarClock, CalendarPlus, ClipboardList, FileText, HeartPulse, Pencil, Plus, ScanLine, Stethoscope, GitCompare, Building2, Info } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionCard } from '@/components/shared/SectionCard'
import { KeyValue } from '@/components/shared/KeyValue'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PatientChip } from '@/components/shared/PatientChip'
import { EmptyState } from '@/components/shared/EmptyState'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NotFound } from '@/pages/NotFound'
import { useDataset, updateSurgicalCase } from '@/services/repository'
import { fmtDate } from '@/utils/format'
import { caseFollowUpStatus, deriveFollowUpStatus } from '@/utils/clinical'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { BrainDetailsPanel, SpineDetailsPanel } from '@/components/clinical/CaseDetailsPanels'
import { AssessmentSummary } from '@/components/clinical/AssessmentSummary'
import type { CaseStatus, ClinicalOutcome, Complication } from '@/types'
import { DEMO_REFERENCE_DATE } from '@/config/demo'
import { newId } from '@/services/ids'
import { getImage } from '@/config/images'
import { ImageWithFallback } from '@/components/shared/ImageWithFallback'

export function CaseDetailPage() {
  const { id } = useParams()
  const d = useDataset()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const c = d.cases.find((x) => x.id === id)
  useDocumentTitle(c ? c.caseNumber : 'Case')
  const [statusOpen, setStatusOpen] = useState(false)
  const [compOpen, setCompOpen] = useState(false)

  const report = useMemo(() => d.operativeReports.find((r) => r.caseId === id), [d.operativeReports, id])
  const notes = useMemo(() => d.postopNotes.filter((n) => n.caseId === id).sort((a, b) => a.postopDay - b.postopDay), [d.postopNotes, id])
  const assessments = useMemo(() => d.assessments.filter((a) => a.caseId === id).sort((a, b) => (a.date < b.date ? -1 : 1)), [d.assessments, id])
  const followUps = useMemo(() => d.followUps.filter((f) => f.caseId === id).sort((a, b) => (a.date < b.date ? -1 : 1)), [d.followUps, id])
  const imaging = useMemo(() => d.imaging.filter((i) => i.caseId === id).sort((a, b) => (a.studyDate < b.studyDate ? -1 : 1)), [d.imaging, id])
  const discharge = useMemo(() => d.dischargeSummaries.find((x) => x.caseId === id), [d.dischargeSummaries, id])

  if (!c) return <NotFound />
  const hospital = d.hospitals.find((h) => h.id === c.hospitalId)
  const consultation = c.consultationId ? d.consultations.find((k) => k.id === c.consultationId) : undefined
  const parentCase = c.reoperationOfCaseId ? d.cases.find((x) => x.id === c.reoperationOfCaseId) : undefined
  const childCases = d.cases.filter((x) => x.reoperationOfCaseId === c.id)
  const fu = caseFollowUpStatus(c, d.followUps)
  const tab = params.get('tab') ?? 'overview'

  return (
    <PageTransition>
      <section className="surface mb-6 overflow-hidden">
        <div className={c.type === 'spine' ? 'h-2 bg-gradient-to-r from-teal to-cyan' : 'h-2 bg-gradient-to-r from-lavender to-cyan'} />
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:p-6">
          <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${c.type === 'spine' ? 'bg-teal/12 text-teal' : 'bg-lavender/15 text-indigo-600 dark:text-lavender'}`}>{c.type === 'spine' ? <Bone className="size-7" /> : <Brain className="size-7" />}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-data text-2xl font-bold tracking-tight">{c.caseNumber}</h1>
              <StatusBadge kind="case" value={c.status} /><StatusBadge kind="caseType" value={c.type} /><StatusBadge kind="category" value={c.procedureCategory} /><StatusBadge kind="priority" value={c.priority} />
              {c.reoperation && <Badge variant="warning">Reoperation</Badge>}
            </div>
            <p className="mt-2 text-lg font-semibold leading-tight">{c.plannedProcedure}</p>
            <p className="text-sm text-muted-foreground">{c.diagnosis}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <PatientChip patientId={c.patientId} compact />
              <span className="inline-flex items-center gap-1 text-muted-foreground"><Building2 className="size-3.5" /> {hospital?.name}</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground"><CalendarClock className="size-3.5" /> {c.surgeryDate ? `Operated ${fmtDate(c.surgeryDate)}` : c.plannedDate ? `Planned ${fmtDate(c.plannedDate)}` : 'Date to be confirmed'}{c.durationMinutes ? ` · ${c.durationMinutes} min` : ''}</span>
              <StatusBadge kind="caseFollowUp" value={fu} />
              {c.outcome && <StatusBadge kind="outcome" value={c.outcome} />}
            </div>
            {c.statusNote && <div className="mt-3 inline-flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs"><Info className="mt-0.5 size-3.5 shrink-0" /> {c.statusNote}</div>}
          </div>
          <div className="flex flex-wrap gap-2 md:flex-col">
            <Button size="sm" variant="outline" onClick={() => setStatusOpen(true)}><Pencil /> Update status</Button>
            {c.status === 'completed' && (report ? <Button asChild size="sm"><Link to={`/operative-reports/${report.id}`}><FileText /> Operative report</Link></Button> : <Button asChild size="sm"><Link to={`/operative-reports/new?case=${c.id}`}><FileText /> Write operative report</Link></Button>)}
            {c.status === 'completed' && <Button asChild size="sm" variant="outline"><Link to={`/postoperative/${c.id}`}><HeartPulse /> Postoperative care</Link></Button>}
            <Button asChild size="sm" variant="outline"><Link to={`/assessments/new?case=${c.id}`}><Activity /> Assessment</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to={`/follow-ups/new?case=${c.id}`}><CalendarPlus /> Follow-up</Link></Button>
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Clinical details</TabsTrigger>
          <TabsTrigger value="report">Operative report</TabsTrigger>
          <TabsTrigger value="postop">Postoperative <span className="text-xs text-muted-foreground">{notes.length}</span></TabsTrigger>
          <TabsTrigger value="assessments">Assessments <span className="text-xs text-muted-foreground">{assessments.length}</span></TabsTrigger>
          <TabsTrigger value="followups">Follow-ups <span className="text-xs text-muted-foreground">{followUps.length}</span></TabsTrigger>
          <TabsTrigger value="imaging">Imaging <span className="text-xs text-muted-foreground">{imaging.length}</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <SectionCard title="Case summary" icon={ClipboardList}>
                <KeyValue columns={2} items={[{ label: 'Surgical indication', value: c.indication, span: true }, { label: 'Relevant findings', value: c.findings, span: true }, { label: 'Preoperative considerations', value: c.preopConsiderations, span: true }, { label: "Surgeon's role", value: c.surgeonRole }, { label: 'Case opened', value: fmtDate(c.createdAt) }]} />
              </SectionCard>
              {c.brain && <SectionCard title="Brain-specific details" icon={Brain}><BrainDetailsPanel b={c.brain} /></SectionCard>}
              {c.spine && <SectionCard title="Spine-specific details" icon={Bone}><SpineDetailsPanel s={c.spine} /></SectionCard>}
            </div>
            <div className="space-y-4">
              <SectionCard title="Complications" icon={AlertTriangle} action={<Button size="sm" variant="outline" onClick={() => setCompOpen(true)}><Plus /> Add</Button>}>
                {c.complications.length ? (
                  <ul className="space-y-3">
                    {c.complications.map((k) => (
                      <li key={k.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex items-start justify-between gap-2"><span className="font-medium">{k.description}</span><Badge variant={k.severity === 'major' ? 'danger' : k.severity === 'moderate' ? 'warning' : 'secondary'}>{k.severity}</Badge></div>
                        <div className="mt-1 text-xs text-muted-foreground">{fmtDate(k.date)} · {k.resolved ? 'Resolved' : 'Ongoing'}</div>
                        <div className="mt-1 text-xs">{k.management}</div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">No complications recorded.</p>}
              </SectionCard>
              <SectionCard title="Linked records" icon={Stethoscope}>
                <ul className="space-y-2 text-sm">
                  {consultation ? <li><Link to={`/consultations/${consultation.id}`} className="text-primary hover:underline">Consultation · {fmtDate(consultation.date)}</Link></li> : <li className="text-muted-foreground">No linked consultation</li>}
                  {parentCase && <li>Reoperation of <Link to={`/cases/${parentCase.id}`} className="text-primary hover:underline">{parentCase.caseNumber}</Link> ({parentCase.plannedProcedure})</li>}
                  {childCases.map((x) => <li key={x.id}>Subsequent procedure: <Link to={`/cases/${x.id}`} className="text-primary hover:underline">{x.caseNumber}</Link> ({x.plannedProcedure})</li>)}
                  {discharge && <li><Link to={`/postoperative/${c.id}?tab=discharge`} className="text-primary hover:underline">Discharge summary · {fmtDate(discharge.dischargeDate)}</Link></li>}
                  <li><Link to={`/assessments/compare?patient=${c.patientId}&case=${c.id}`} className="inline-flex items-center gap-1 text-primary hover:underline"><GitCompare className="size-3.5" /> Compare neurological recovery</Link></li>
                </ul>
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="report">
          {report ? (
            <SectionCard title={`Operative report · v${report.version}`} description={<span className="inline-flex items-center gap-2"><StatusBadge kind="report" value={report.status} /> {report.finalizedAt ? `Finalized ${fmtDate(report.finalizedAt)}` : 'Not yet finalized'}</span>} icon={FileText} action={<Button asChild size="sm"><Link to={`/operative-reports/${report.id}`}>Open editor</Link></Button>}>
              <KeyValue columns={2} items={[{ label: 'Procedure performed', value: report.procedurePerformed, span: true }, { label: 'Approach', value: report.approach }, { label: 'Estimated blood loss', value: report.estimatedBloodLossMl !== null ? `${report.estimatedBloodLossMl} mL` : undefined }, { label: 'Operative findings', value: report.operativeFindings, span: true }, { label: 'Implants', value: report.implants }, { label: 'Intraoperative complications', value: report.intraopComplications }, { label: 'Immediate postoperative condition', value: report.immediatePostopCondition, span: true }]} />
            </SectionCard>
          ) : (
            <EmptyState icon={FileText} title={c.status === 'completed' ? 'No operative report yet' : 'Operative report available after surgery'} description={c.status === 'completed' ? 'Document the procedure using the brain or spine template.' : `This case is ${c.status}.`} action={c.status === 'completed' ? <Button asChild><Link to={`/operative-reports/new?case=${c.id}`}><FileText /> Write operative report</Link></Button> : undefined} />
          )}
        </TabsContent>

        <TabsContent value="postop">
          <SectionCard title="Postoperative progress" icon={HeartPulse} action={<Button asChild size="sm"><Link to={`/postoperative/${c.id}`}>Open postoperative care</Link></Button>} noPadding>
            {notes.length ? (
              <ul className="divide-y">
                {notes.map((n) => (
                  <li key={n.id} className="flex items-start gap-4 px-5 py-3 text-sm">
                    <div className="w-16 shrink-0 font-data text-xs font-semibold">Day {n.postopDay}<div className="font-normal text-muted-foreground">{fmtDate(n.date)}</div></div>
                    <div className="min-w-0 flex-1"><div>{n.neuroFindings}</div><div className="mt-1 text-xs text-muted-foreground">Wound: {n.woundStatus.replace(/-/g, ' ')} · Pain {n.painScore ?? '—'}/10 · {n.complications}</div></div>
                    <Badge variant={n.clinicalCondition === 'critical' ? 'danger' : n.clinicalCondition === 'concern' ? 'warning' : n.clinicalCondition === 'improving' ? 'info' : 'success'}>{n.clinicalCondition}</Badge>
                  </li>
                ))}
              </ul>
            ) : <EmptyState compact icon={HeartPulse} title="No postoperative notes" description={c.status === 'completed' ? 'Add the first progress note from the postoperative care page.' : undefined} />}
          </SectionCard>
        </TabsContent>

        <TabsContent value="assessments">
          <SectionCard title="Neurological assessments" icon={Activity} action={<div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link to={`/assessments/compare?patient=${c.patientId}&case=${c.id}`}><GitCompare /> Compare</Link></Button><Button asChild size="sm"><Link to={`/assessments/new?case=${c.id}`}><Plus /> New</Link></Button></div>}>
            {assessments.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {assessments.map((a) => (
                  <Link key={a.id} to={`/assessments/${a.id}`} className="rounded-xl border p-4 hover:bg-muted/40 transition-colors">
                    <div className="mb-3 flex items-center justify-between"><div className="text-sm font-semibold capitalize">{a.type.replace(/-/g, ' ')}</div><span className="font-data text-xs text-muted-foreground">{fmtDate(a.date)}</span></div>
                    <AssessmentSummary a={a} compact />
                  </Link>
                ))}
              </div>
            ) : <EmptyState compact icon={Activity} title="No assessments for this case" />}
          </SectionCard>
        </TabsContent>

        <TabsContent value="followups">
          <SectionCard title="Follow-up appointments" icon={CalendarClock} action={<Button asChild size="sm"><Link to={`/follow-ups/new?case=${c.id}`}><Plus /> Schedule</Link></Button>} noPadding>
            {followUps.length ? (
              <ul className="divide-y">
                {followUps.map((f) => { const s = deriveFollowUpStatus(f); return (
                  <li key={f.id}><Link to={`/follow-ups/${f.id}`} className="flex flex-col gap-2 px-5 py-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4"><div className="w-36 shrink-0 font-data text-sm tabular-nums">{fmtDate(f.date)} · {f.time}</div><div className="min-w-0 flex-1"><div className="font-medium capitalize">{f.visitType.replace(/-/g, ' ')}</div><div className="truncate text-xs text-muted-foreground">{f.symptoms ?? f.notes ?? '—'}</div></div><div className="flex gap-2"><StatusBadge kind="followUp" value={s} />{f.outcome && <StatusBadge kind="outcome" value={f.outcome} />}</div></Link></li>
                )})}
              </ul>
            ) : <EmptyState compact icon={CalendarClock} title="No follow-ups scheduled" />}
          </SectionCard>
        </TabsContent>

        <TabsContent value="imaging">
          <SectionCard title="Imaging & investigations" icon={ScanLine} action={<Button asChild size="sm" variant="outline"><Link to={`/imaging?case=${c.id}`}>Open imaging</Link></Button>}>
            {imaging.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {imaging.map((i) => (
                  <button key={i.id} type="button" onClick={() => navigate(`/imaging?case=${c.id}&open=${i.id}`)} className="surface surface-hover overflow-hidden text-left cursor-pointer">
                    {i.imageKey ? <ImageWithFallback asset={getImage(i.imageKey)} className="aspect-[4/3] bg-black" /> : <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground"><FileText className="size-8" /></div>}
                    <div className="p-3"><div className="text-sm font-semibold">{i.modality} · {i.region}</div><div className="font-data text-xs text-muted-foreground">{fmtDate(i.studyDate)}</div><p className="mt-1 line-clamp-2 text-xs">{i.impression}</p></div>
                  </button>
                ))}
              </div>
            ) : <EmptyState compact icon={ScanLine} title="No imaging linked to this case" />}
          </SectionCard>
        </TabsContent>
      </Tabs>

      <StatusDialog open={statusOpen} onOpenChange={setStatusOpen} caseId={c.id} status={c.status} plannedDate={c.plannedDate} surgeryDate={c.surgeryDate} outcome={c.outcome} statusNote={c.statusNote} />
      <ComplicationDialog open={compOpen} onOpenChange={setCompOpen} caseId={c.id} existing={c.complications} />
    </PageTransition>
  )
}

function StatusDialog({ open, onOpenChange, caseId, status, plannedDate, surgeryDate, outcome, statusNote }: { open: boolean; onOpenChange: (o: boolean) => void; caseId: string; status: CaseStatus; plannedDate?: string; surgeryDate?: string; outcome?: ClinicalOutcome; statusNote?: string }) {
  const [s, setS] = useState<CaseStatus>(status)
  const [date, setDate] = useState(surgeryDate ?? plannedDate ?? '')
  const [out, setOut] = useState<ClinicalOutcome>(outcome ?? 'unknown')
  const [note, setNote] = useState(statusNote ?? '')
  const [err, setErr] = useState('')
  const save = () => {
    if ((s === 'scheduled' || s === 'completed') && !date) { setErr('A date is required for this status'); return }
    if (s === 'completed' && date > DEMO_REFERENCE_DATE) { setErr('A completed case cannot have a future surgery date'); return }
    updateSurgicalCase(caseId, { status: s, plannedDate: date || undefined, surgeryDate: s === 'completed' ? date : undefined, outcome: s === 'completed' ? out : undefined, statusNote: note || undefined })
    toast.success('Case status updated')
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Update case status</DialogTitle><DialogDescription>Change the workflow state of this case. Completed cases require a surgery date.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <Field label="Status"><Select value={s} onValueChange={(v) => setS(v as CaseStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(['planned', 'scheduled', 'completed', 'postponed', 'cancelled'] as CaseStatus[]).map((x) => <SelectItem key={x} value={x} className="capitalize">{x}</SelectItem>)}</SelectContent></Select></Field>
          <Field label={s === 'completed' ? 'Surgery date' : 'Planned date'} error={err} htmlFor="sdate"><Input id="sdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          {s === 'completed' && <Field label="Documented outcome" description="Leave as unknown if not yet assessed"><Select value={out} onValueChange={(v) => setOut(v as ClinicalOutcome)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(['improved', 'stable', 'deteriorated', 'deceased', 'unknown'] as ClinicalOutcome[]).map((x) => <SelectItem key={x} value={x} className="capitalize">{x}</SelectItem>)}</SelectContent></Select></Field>}
          {(s === 'postponed' || s === 'cancelled') && <Field label="Reason" htmlFor="snote"><Textarea id="snote" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>}
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ComplicationDialog({ open, onOpenChange, caseId, existing }: { open: boolean; onOpenChange: (o: boolean) => void; caseId: string; existing: Complication[] }) {
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(DEMO_REFERENCE_DATE)
  const [sev, setSev] = useState<Complication['severity']>('minor')
  const [mgmt, setMgmt] = useState('')
  const [err, setErr] = useState('')
  const save = () => {
    if (desc.trim().length < 3) { setErr('Describe the complication'); return }
    updateSurgicalCase(caseId, { complications: [...existing, { id: newId('comp'), date, description: desc.trim(), severity: sev, management: mgmt.trim(), resolved: false }] })
    toast.success('Complication recorded')
    setDesc(''); setMgmt(''); setErr('')
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record complication</DialogTitle><DialogDescription>Documented complications feed the outcome analytics.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <Field label="Description" required error={err} htmlFor="cdesc"><Input id="cdesc" value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" htmlFor="cdate"><Input id="cdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Severity"><Select value={sev} onValueChange={(v) => setSev(v as Complication['severity'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minor">Minor</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="major">Major</SelectItem></SelectContent></Select></Field>
          </div>
          <Field label="Management" htmlFor="cmgmt"><Textarea id="cmgmt" rows={2} value={mgmt} onChange={(e) => setMgmt(e.target.value)} /></Field>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Record</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
