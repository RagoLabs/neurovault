import { useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Activity, AlertTriangle, Brain, CalendarClock, ClipboardList, FileText, HeartPulse, Mail, MapPin, Pencil, Phone, Pill, ScanLine, Stethoscope, UserRound, FolderOpen, Scissors, GitCompare, Plus, CheckCircle2, XCircle, CalendarPlus } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/shared/SectionCard'
import { KeyValue } from '@/components/shared/KeyValue'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Timeline, type TimelineEvent } from '@/components/shared/Timeline'
import { EmptyState } from '@/components/shared/EmptyState'
import { NotFound } from '@/pages/NotFound'
import { useDataset } from '@/services/repository'
import { caseFollowUpStatus, deriveFollowUpStatus, patientAge, computeGcs } from '@/utils/clinical'
import { fmtDate, initials } from '@/utils/format'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { AssessmentSummary } from '@/components/clinical/AssessmentSummary'
import { getImage } from '@/config/images'
import { ImageWithFallback } from '@/components/shared/ImageWithFallback'
import { fmtBytes } from '@/utils/format'

export function PatientDetailPage() {
  const { id } = useParams()
  const d = useDataset()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const p = d.patients.find((x) => x.id === id)
  useDocumentTitle(p ? `${p.firstName} ${p.lastName}` : 'Patient')

  const cases = useMemo(() => d.cases.filter((c) => c.patientId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [d.cases, id])
  const consultations = useMemo(() => d.consultations.filter((c) => c.patientId === id).sort((a, b) => (a.date < b.date ? 1 : -1)), [d.consultations, id])
  const assessments = useMemo(() => d.assessments.filter((a) => a.patientId === id).sort((a, b) => (a.date < b.date ? 1 : -1)), [d.assessments, id])
  const imaging = useMemo(() => d.imaging.filter((i) => i.patientId === id).sort((a, b) => (a.studyDate < b.studyDate ? 1 : -1)), [d.imaging, id])
  const followUps = useMemo(() => d.followUps.filter((f) => f.patientId === id).sort((a, b) => (a.date < b.date ? 1 : -1)), [d.followUps, id])
  const documents = useMemo(() => d.documents.filter((x) => x.patientId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [d.documents, id])
  const postop = useMemo(() => d.postopNotes.filter((n) => n.patientId === id), [d.postopNotes, id])

  if (!p) return <NotFound />

  const hospital = d.hospitals.find((h) => h.id === p.hospitalId)
  const latestCase = cases.find((c) => c.status === 'completed')
  const fuStatus = latestCase ? caseFollowUpStatus(latestCase, d.followUps) : 'none'
  const tab = params.get('tab') ?? 'overview'

  const timeline: TimelineEvent[] = [
    ...consultations.map((c) => ({ id: c.id, date: c.date, title: c.status === 'draft' ? 'Consultation (draft)' : 'Consultation', description: c.workingDiagnosis, icon: Stethoscope, tone: 'cyan' as const, href: `/consultations/${c.id}` })),
    ...imaging.map((i) => ({ id: i.id, date: i.studyDate, title: `${i.modality} reviewed`, description: i.impression, icon: ScanLine, tone: 'lavender' as const, href: `/imaging?patient=${p.id}` })),
    ...cases.flatMap((c) => {
      const ev: TimelineEvent[] = [{ id: `${c.id}-created`, date: c.createdAt, title: `Surgical case opened · ${c.caseNumber}`, description: c.plannedProcedure, icon: Brain, tone: 'teal', href: `/cases/${c.id}`, badge: <StatusBadge kind="case" value={c.status} /> }]
      if (c.status === 'scheduled' && c.plannedDate) ev.push({ id: `${c.id}-sched`, date: c.plannedDate, title: 'Surgery scheduled', description: c.plannedProcedure, icon: CalendarClock, tone: 'cyan', href: `/cases/${c.id}` })
      if (c.surgeryDate) ev.push({ id: `${c.id}-surg`, date: c.surgeryDate, title: 'Surgery performed', description: c.plannedProcedure, icon: Scissors, tone: 'teal', href: `/cases/${c.id}` })
      c.complications.forEach((k) => ev.push({ id: k.id, date: k.date, title: `Complication: ${k.description}`, description: k.management, icon: AlertTriangle, tone: 'red', href: `/cases/${c.id}` }))
      return ev
    }),
    ...assessments.map((a) => ({ id: a.id, date: a.date, title: `${a.type.replace(/-/g, ' ')} assessment`, description: a.domain === 'brain' && a.gcs ? `GCS ${computeGcs(a.gcs).label}` : a.painScore !== null && a.painScore !== undefined ? `Pain ${a.painScore}/10` : undefined, icon: Activity, tone: 'lavender' as const, href: `/assessments/${a.id}` })),
    ...postop.filter((n) => n.dischargeStatus === 'discharged').map((n) => ({ id: n.id, date: n.date, title: `Discharged · postoperative day ${n.postopDay}`, icon: HeartPulse, tone: 'green' as const, href: `/postoperative/${n.caseId}` })),
    ...followUps.map((f) => {
      const s = deriveFollowUpStatus(f)
      return { id: f.id, date: f.date, title: s === 'completed' ? 'Follow-up completed' : s === 'missed' ? 'Follow-up missed' : s === 'overdue' ? 'Follow-up overdue' : 'Follow-up scheduled', description: f.outcome ? `Outcome: ${f.outcome}` : f.visitType.replace(/-/g, ' '), icon: s === 'completed' ? CheckCircle2 : s === 'missed' ? XCircle : CalendarClock, tone: (s === 'completed' ? 'green' : s === 'missed' ? 'red' : s === 'overdue' ? 'amber' : 'slate') as TimelineEvent['tone'], href: `/follow-ups/${f.id}`, badge: <StatusBadge kind="followUp" value={s} /> }
    }),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  const hospitalName = (hid: string) => d.hospitals.find((h) => h.id === hid)?.shortName ?? '—'

  return (
    <PageTransition>
      {/* Summary header */}
      <section className="surface mb-6 overflow-hidden">
        <div className="neural-bg h-2 w-full" />
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:p-6">
          <Avatar className="size-16 text-lg"><AvatarFallback className={cn('text-lg', p.sex === 'female' ? 'bg-lavender/20 text-indigo-700 dark:text-indigo-300' : 'bg-cyan/20 text-sky-700 dark:text-sky-300')}>{initials(p.firstName, p.lastName)}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{p.firstName} {p.lastName}</h1>
              <Badge variant={p.status === 'active' ? 'success' : 'secondary'}>{p.status}</Badge>
              <StatusBadge kind="caseFollowUp" value={fuStatus} />
            </div>
            <div className="mt-1 font-data text-sm text-muted-foreground">{p.patientNumber} · {patientAge(p)} years · {p.sex === 'male' ? 'Male' : 'Female'} · DOB {fmtDate(p.dateOfBirth)}{p.mrn ? ` · MRN ${p.mrn}` : ''}</div>
            <p className="mt-2 text-sm font-medium">{p.primaryDiagnosis}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Phone className="size-3.5" /> {p.phone}</span>
              {p.email && <span className="inline-flex items-center gap-1"><Mail className="size-3.5" /> {p.email}</span>}
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {p.address}</span>
              <span className="inline-flex items-center gap-1"><UserRound className="size-3.5" /> {hospital?.name}</span>
            </div>
            {p.allergies.some((a) => a.toLowerCase() !== 'none known' && a.toLowerCase() !== 'none') && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300"><AlertTriangle className="size-3.5" /> Allergies: {p.allergies.join(', ')}</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 md:flex-col">
            <Button asChild variant="outline" size="sm"><Link to={`/patients/${p.id}/edit`}><Pencil /> Edit</Link></Button>
            <Button asChild size="sm"><Link to={`/consultations/new?patient=${p.id}`}><Stethoscope /> New consultation</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to={`/cases/new?patient=${p.id}`}><Brain /> New case</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to={`/assessments/compare?patient=${p.id}`}><GitCompare /> Compare recovery</Link></Button>
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Clinical timeline</TabsTrigger>
          <TabsTrigger value="consultations">Consultations <span className="text-xs text-muted-foreground">{consultations.length}</span></TabsTrigger>
          <TabsTrigger value="cases">Surgical cases <span className="text-xs text-muted-foreground">{cases.length}</span></TabsTrigger>
          <TabsTrigger value="assessments">Assessments <span className="text-xs text-muted-foreground">{assessments.length}</span></TabsTrigger>
          <TabsTrigger value="imaging">Imaging <span className="text-xs text-muted-foreground">{imaging.length}</span></TabsTrigger>
          <TabsTrigger value="followups">Follow-ups <span className="text-xs text-muted-foreground">{followUps.length}</span></TabsTrigger>
          <TabsTrigger value="documents">Documents <span className="text-xs text-muted-foreground">{documents.length}</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard title="Clinical background" icon={Pill} className="lg:col-span-2">
              <KeyValue columns={2} items={[
                { label: 'Medical history', value: list(p.medicalHistory) },
                { label: 'Previous surgeries', value: list(p.previousSurgeries) },
                { label: 'Current medications', value: list(p.medications) },
                { label: 'Allergies', value: list(p.allergies) },
                { label: 'Comorbidities', value: list(p.comorbidities) },
                { label: 'Emergency contact', value: `${p.emergencyContact.name} (${p.emergencyContact.relationship}) · ${p.emergencyContact.phone}` },
                { label: 'Registered', value: fmtDate(p.registeredAt) },
                { label: 'Primary hospital', value: hospital?.name },
              ]} />
            </SectionCard>
            <div className="space-y-4">
              <SectionCard title="Latest surgical case" icon={Brain}>
                {latestCase ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between"><Link to={`/cases/${latestCase.id}`} className="font-semibold hover:underline">{latestCase.caseNumber}</Link><StatusBadge kind="case" value={latestCase.status} /></div>
                    <div>{latestCase.plannedProcedure}</div>
                    <div className="text-muted-foreground">{fmtDate(latestCase.surgeryDate)} · {hospitalName(latestCase.hospitalId)}</div>
                    <div className="flex gap-2 pt-1"><StatusBadge kind="caseType" value={latestCase.type} /><StatusBadge kind="outcome" value={latestCase.outcome ?? 'unknown'} /></div>
                  </div>
                ) : cases[0] ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between"><Link to={`/cases/${cases[0].id}`} className="font-semibold hover:underline">{cases[0].caseNumber}</Link><StatusBadge kind="case" value={cases[0].status} /></div>
                    <div>{cases[0].plannedProcedure}</div>
                    <div className="text-muted-foreground">Planned {fmtDate(cases[0].plannedDate)}</div>
                  </div>
                ) : (
                  <EmptyState compact icon={Brain} title="No surgical case" action={<Button asChild size="sm"><Link to={`/cases/new?patient=${p.id}`}><Plus /> Create case</Link></Button>} />
                )}
              </SectionCard>
              <SectionCard title="Next follow-up" icon={CalendarClock}>
                {(() => {
                  const next = [...followUps].filter((f) => ['scheduled', 'today', 'overdue'].includes(deriveFollowUpStatus(f))).sort((a, b) => (a.date < b.date ? -1 : 1))[0]
                  return next ? (
                    <div className="space-y-1 text-sm">
                      <div className="font-data font-semibold tabular-nums">{fmtDate(next.date)} · {next.time}</div>
                      <div className="capitalize">{next.visitType.replace(/-/g, ' ')}</div>
                      <StatusBadge kind="followUp" value={deriveFollowUpStatus(next)} />
                      <div className="pt-2"><Button asChild size="sm" variant="outline"><Link to={`/follow-ups/${next.id}`}>Record findings</Link></Button></div>
                    </div>
                  ) : (
                    <EmptyState compact icon={CalendarClock} title="No follow-up scheduled" action={<Button asChild size="sm" variant="outline"><Link to={`/follow-ups/new?patient=${p.id}`}><CalendarPlus /> Schedule</Link></Button>} />
                  )
                })()}
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <SectionCard title="Clinical timeline" description="All events in chronological order, newest first. Click an event to open its record." icon={ClipboardList}>
            {timeline.length ? <Timeline events={timeline} /> : <EmptyState compact title="No clinical events yet" />}
          </SectionCard>
        </TabsContent>

        <TabsContent value="consultations">
          <SectionCard title="Consultations" icon={Stethoscope} action={<Button asChild size="sm"><Link to={`/consultations/new?patient=${p.id}`}><Plus /> New</Link></Button>} noPadding>
            {consultations.length ? (
              <ul className="divide-y">
                {consultations.map((c) => (
                  <li key={c.id}>
                    <Link to={`/consultations/${c.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50">
                      <div className="font-data text-sm tabular-nums text-muted-foreground w-24 shrink-0">{fmtDate(c.date)}</div>
                      <div className="min-w-0 flex-1"><div className="truncate font-medium">{c.chiefComplaint}</div><div className="truncate text-xs text-muted-foreground">{c.workingDiagnosis}</div></div>
                      <StatusBadge kind="consultation" value={c.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <EmptyState compact icon={Stethoscope} title="No consultations" />}
          </SectionCard>
        </TabsContent>

        <TabsContent value="cases">
          <SectionCard title="Surgical cases" icon={Brain} action={<Button asChild size="sm"><Link to={`/cases/new?patient=${p.id}`}><Plus /> New case</Link></Button>} noPadding>
            {cases.length ? (
              <ul className="divide-y">
                {cases.map((c) => (
                  <li key={c.id}>
                    <Link to={`/cases/${c.id}`} className="flex flex-col gap-2 px-5 py-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4">
                      <div className="font-data text-sm font-semibold w-32 shrink-0">{c.caseNumber}</div>
                      <div className="min-w-0 flex-1"><div className="truncate font-medium">{c.plannedProcedure}</div><div className="truncate text-xs text-muted-foreground">{c.diagnosis} · {hospitalName(c.hospitalId)} · {fmtDate(c.surgeryDate ?? c.plannedDate)}</div></div>
                      <div className="flex gap-2"><StatusBadge kind="caseType" value={c.type} /><StatusBadge kind="case" value={c.status} />{c.outcome && <StatusBadge kind="outcome" value={c.outcome} />}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <EmptyState compact icon={Brain} title="No surgical cases" />}
          </SectionCard>
        </TabsContent>

        <TabsContent value="assessments">
          <SectionCard title="Neurological assessments" icon={Activity} action={<div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link to={`/assessments/compare?patient=${p.id}`}><GitCompare /> Compare</Link></Button><Button asChild size="sm"><Link to={`/assessments/new?patient=${p.id}`}><Plus /> New</Link></Button></div>}>
            {assessments.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {assessments.map((a) => (
                  <Link key={a.id} to={`/assessments/${a.id}`} className="rounded-xl border p-4 hover:bg-muted/40 transition-colors">
                    <div className="mb-3 flex items-center justify-between gap-2"><div><div className="text-sm font-semibold capitalize">{a.type.replace(/-/g, ' ')}</div><div className="font-data text-xs text-muted-foreground">{fmtDate(a.date)} · {d.cases.find((c) => c.id === a.caseId)?.caseNumber}</div></div><StatusBadge kind="caseType" value={a.domain} /></div>
                    <AssessmentSummary a={a} compact />
                  </Link>
                ))}
              </div>
            ) : <EmptyState compact icon={Activity} title="No assessments recorded" />}
          </SectionCard>
        </TabsContent>

        <TabsContent value="imaging">
          <SectionCard title="Imaging & investigations" icon={ScanLine} action={<Button asChild size="sm" variant="outline"><Link to={`/imaging?patient=${p.id}`}>Open imaging directory</Link></Button>}>
            {imaging.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {imaging.map((i) => (
                  <button key={i.id} type="button" onClick={() => navigate(`/imaging?patient=${p.id}&open=${i.id}`)} className="surface surface-hover overflow-hidden text-left cursor-pointer">
                    {i.imageKey ? <ImageWithFallback asset={getImage(i.imageKey)} className="aspect-[4/3] bg-black" /> : <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground"><FileText className="size-8" /></div>}
                    <div className="p-3"><div className="text-sm font-semibold">{i.modality} · {i.region}</div><div className="font-data text-xs text-muted-foreground">{fmtDate(i.studyDate)}</div><p className="mt-1 line-clamp-2 text-xs">{i.impression}</p></div>
                  </button>
                ))}
              </div>
            ) : <EmptyState compact icon={ScanLine} title="No imaging records" />}
          </SectionCard>
        </TabsContent>

        <TabsContent value="followups">
          <SectionCard title="Follow-up appointments" icon={CalendarClock} action={<Button asChild size="sm"><Link to={`/follow-ups/new?patient=${p.id}`}><Plus /> Schedule</Link></Button>} noPadding>
            {followUps.length ? (
              <ul className="divide-y">
                {followUps.map((f) => {
                  const s = deriveFollowUpStatus(f)
                  return (
                    <li key={f.id}>
                      <Link to={`/follow-ups/${f.id}`} className="flex flex-col gap-2 px-5 py-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4">
                        <div className="font-data text-sm tabular-nums w-36 shrink-0">{fmtDate(f.date)} · {f.time}</div>
                        <div className="min-w-0 flex-1"><div className="font-medium capitalize">{f.visitType.replace(/-/g, ' ')}</div><div className="truncate text-xs text-muted-foreground">{f.notes ?? f.symptoms ?? d.cases.find((c) => c.id === f.caseId)?.plannedProcedure}</div></div>
                        <div className="flex gap-2"><StatusBadge kind="followUp" value={s} />{f.outcome && <StatusBadge kind="outcome" value={f.outcome} />}</div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : <EmptyState compact icon={CalendarClock} title="No follow-ups" />}
          </SectionCard>
        </TabsContent>

        <TabsContent value="documents">
          <SectionCard title="Documents" icon={FolderOpen} action={<Button asChild size="sm" variant="outline"><Link to={`/documents?patient=${p.id}`}>Open documents</Link></Button>} noPadding>
            {documents.length ? (
              <ul className="divide-y">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <Link to={`/documents?patient=${p.id}&open=${doc.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50">
                      <FileText className="size-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1"><div className="truncate font-medium">{doc.title}</div><div className="truncate text-xs text-muted-foreground">{doc.fileName} · {fmtBytes(doc.sizeBytes)}</div></div>
                      <Badge variant="outline" className="capitalize">{doc.category}</Badge>
                      <span className="font-data text-xs text-muted-foreground tabular-nums hidden sm:inline">{fmtDate(doc.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <EmptyState compact icon={FolderOpen} title="No documents" />}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageTransition>
  )
}

function list(items: string[]) {
  if (!items.length) return undefined
  return <ul className="list-disc space-y-0.5 pl-4">{items.map((i) => <li key={i}>{i}</li>)}</ul>
}
