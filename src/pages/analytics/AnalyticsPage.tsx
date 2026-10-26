import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Activity, AlertTriangle, BarChart3, Building2, FileDown, FileSpreadsheet, FileText, Info, Repeat, Scissors, X, ClipboardCheck } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatCard } from '@/components/shared/StatCard'
import { Field } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DonutChart } from '@/components/charts/DonutChart'
import { SimpleBarChart } from '@/components/charts/SimpleBarChart'
import { ActivityChart } from '@/components/charts/ActivityChart'
import { RecoveryChart } from '@/components/charts/RecoveryChart'
import { useDataset } from '@/services/repository'
import { getProcedureDistribution, getSurgicalActivity } from '@/services/stats'
import { computeOutcomes, defaultFilters, filterCases, type AnalyticsFilters } from './analyticsUtils'
import { exportCsv, exportXlsx, savePdf } from '@/utils/export'
import { surgeon, brand } from '@/config/surgeon'
import { fmtDate, fullName } from '@/utils/format'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'

const pct = (v: number | null) => (v === null ? 'n/a' : `${Math.round(v * 100)}%`)

export function AnalyticsPage() {
  const d = useDataset()
  const [f, setF] = useState<AnalyticsFilters>(defaultFilters())
  const [deidentified, setDeidentified] = useState(true)
  const up = <K extends keyof AnalyticsFilters>(k: K, v: AnalyticsFilters[K]) => setF((x) => ({ ...x, [k]: v }))
  const cases = useMemo(() => filterCases(d.cases, f), [d.cases, f])
  const completed = useMemo(() => cases.filter((c) => c.status === 'completed'), [cases])
  const out = useMemo(() => computeOutcomes(d, cases), [d, cases])
  const distribution = useMemo(() => getProcedureDistribution(cases), [cases])
  const activity = useMemo(() => getSurgicalActivity(cases, '12m'), [cases])
  const byHospital = useMemo(() => d.hospitals.map((h) => ({ label: h.shortName, value: completed.filter((c) => c.hospitalId === h.id).length })).filter((x) => x.value > 0), [d.hospitals, completed])
  const byPriority = useMemo(() => (['elective', 'urgent', 'emergency'] as const).map((p) => ({ label: p, value: completed.filter((c) => c.priority === p).length })), [completed])
  const byCategory = useMemo(() => { const m = new Map<string, number>(); completed.forEach((c) => { const k = c.brain ? c.brain.category : c.spine?.category ?? 'other'; m.set(k, (m.get(k) ?? 0) + 1) }); return [...m.entries()].map(([label, value]) => ({ label: label.replace(/-/g, ' '), value })).sort((a, b) => b.value - a.value) }, [completed])
  const isDefault = JSON.stringify(f) === JSON.stringify(defaultFilters())

  const rows = () => completed.map((c) => {
    const p = d.patients.find((x) => x.id === c.patientId)
    return [c.caseNumber, deidentified ? `${p?.sex === 'male' ? 'M' : 'F'}, ${p ? new Date(f.to).getFullYear() - Number(p.dateOfBirth.slice(0, 4)) : ''} y` : `${fullName(p)} (${p?.patientNumber})`, c.type, c.procedureCategory, c.diagnosis, c.plannedProcedure, d.hospitals.find((h) => h.id === c.hospitalId)?.shortName ?? '', c.priority, fmtDate(c.surgeryDate), c.durationMinutes ?? '', c.complications.length, c.reoperation ? 'Yes' : 'No', c.outcome ?? 'unknown']
  })
  const headers = ['Case', deidentified ? 'Patient (de-identified)' : 'Patient', 'Type', 'Category', 'Diagnosis', 'Procedure', 'Hospital', 'Priority', 'Surgery date', 'Duration (min)', 'Complications', 'Reoperation', 'Outcome']
  const stamp = `${f.from}_to_${f.to}`
  const doCsv = () => { exportCsv(`neurovault-cases-${stamp}.csv`, headers, rows()); toast.success('CSV exported') }
  const doXlsx = () => { exportXlsx(`neurovault-analytics-${stamp}.xlsx`, [{ name: 'Cases', headers, rows: rows() }, { name: 'Summary', headers: ['Metric', 'Value', 'Definition'], rows: [['Operations', out.completed, 'Completed cases in range'], ['Cases with complications', out.withComplications, 'Completed cases with ≥1 documented complication'], ['Complication rate', pct(out.complicationRate), 'Cases with complications ÷ operations'], ['Reoperations', out.reoperations, 'Completed cases flagged as reoperation'], ['Follow-up completion', pct(out.fuRate), 'Completed ÷ (completed + missed + overdue) follow-ups'], ['Documented assessments', out.assessmentsDocumented, 'Neurological assessments linked to cases in range']] }]); toast.success('Excel workbook exported') }
  const doPdf = () => { savePdf({ title: 'Surgical analytics report', subtitle: `${surgeon.fullName} · ${fmtDate(f.from)} – ${fmtDate(f.to)}`, meta: [deidentified ? 'De-identified' : 'Identified', `Generated ${fmtDate(f.to)}`], sections: [{ heading: 'Summary', keyValues: [['Operations', String(out.completed)], ['Brain / spine', `${distribution[0].value + distribution[2].value + distribution[3].value} / ${distribution[1].value}`], ['Complication rate', `${pct(out.complicationRate)} (${out.withComplications} of ${out.completed})`], ['Reoperations', String(out.reoperations)], ['Follow-up completion', `${pct(out.fuRate)} (${out.fuDone} of ${out.fuDue})`]] }, { heading: 'Definitions', paragraphs: ['Operations: completed cases in the reporting period. Complication rate: completed cases with at least one documented complication divided by operations. Reoperations: completed cases flagged as a reoperation of an earlier case. Follow-up completion: completed follow-ups divided by follow-ups that were due (completed, missed or overdue). No success rates are inferred.'] }, { heading: 'Case listing', table: { headers, rows: rows() } }], footer: `${brand.name} · ${brand.demoLabel} · ${surgeon.fullName}`, watermark: 'DEMO' }, `neurovault-analytics-${stamp}.pdf`); toast.success('PDF report generated') }

  return (
    <PageTransition>
      <PageHeader title="Analytics & reports" description="Surgical activity and clinical outcomes computed from the case records. Every statistic has an explicit definition; no success rates are inferred." actions={<><Button asChild variant="outline"><Link to="/analytics/logbook"><FileText /> Surgical logbook</Link></Button><Button variant="outline" onClick={doCsv}><FileDown /> CSV</Button><Button variant="outline" onClick={doXlsx}><FileSpreadsheet /> Excel</Button><Button onClick={doPdf}><FileDown /> PDF report</Button></>} />

      <div className="surface mb-5 p-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
          <Field label="From" htmlFor="from"><Input id="from" type="date" value={f.from} onChange={(e) => up('from', e.target.value)} /></Field>
          <Field label="To" htmlFor="to"><Input id="to" type="date" value={f.to} onChange={(e) => up('to', e.target.value)} /></Field>
          <Field label="Hospital"><Select value={f.hospitalId} onValueChange={(v) => up('hospitalId', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All hospitals</SelectItem>{d.hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.shortName}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Case type"><Select value={f.caseType} onValueChange={(v) => up('caseType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="brain">Brain</SelectItem><SelectItem value="spine">Spine</SelectItem><SelectItem value="combined">Combined</SelectItem></SelectContent></Select></Field>
          <Field label="Procedure contains" htmlFor="proc"><Input id="proc" value={f.procedure} onChange={(e) => up('procedure', e.target.value)} placeholder="e.g. craniotomy" /></Field>
          <Field label="Diagnosis contains" htmlFor="dx"><Input id="dx" value={f.diagnosis} onChange={(e) => up('diagnosis', e.target.value)} placeholder="e.g. glioma" /></Field>
          <Field label="Outcome"><Select value={f.outcome} onValueChange={(v) => up('outcome', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{['improved', 'stable', 'deteriorated', 'deceased', 'unknown'].map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent></Select></Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2"><Switch id="deid" checked={deidentified} onCheckedChange={setDeidentified} /><Label htmlFor="deid">De-identified exports (no names or patient numbers)</Label></div>
          <span className="text-muted-foreground">{cases.length} cases in range · {completed.length} completed</span>
          {!isDefault && <Button variant="ghost" size="sm" onClick={() => setF(defaultFilters())}><X /> Reset filters</Button>}
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Surgical activity</h2>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Total operations" value={out.completed} icon={Scissors} tone="teal" hint="completed cases in range" />
        <StatCard index={1} label="Brain vs spine" value={`${distribution[0].value + distribution[2].value + distribution[3].value} / ${distribution[1].value}`} icon={BarChart3} tone="lavender" hint="cranial (incl. vascular, other) / spinal" />
        <StatCard index={2} label="Emergency / urgent" value={`${byPriority[2].value} / ${byPriority[1].value}`} icon={AlertTriangle} tone="amber" hint={`${byPriority[0].value} elective`} />
        <StatCard index={3} label="Hospitals used" value={byHospital.length} icon={Building2} tone="cyan" hint="sites with completed procedures" />
      </div>
      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Procedures by month" description="Completed cases, last 12 months of the range end" icon={BarChart3}><ActivityChart data={activity} /></SectionCard>
        <SectionCard title="Procedures by category" description="Each case counted once in its primary category" icon={BarChart3}><DonutChart data={distribution} /></SectionCard>
        <SectionCard title="Procedures by hospital" icon={Building2}><SimpleBarChart data={byHospital} layout="vertical" height={Math.max(160, byHospital.length * 40)} color="var(--chart-vascular)" /></SectionCard>
        <SectionCard title="Procedures by condition category" icon={BarChart3}><SimpleBarChart data={byCategory} layout="vertical" height={Math.max(160, byCategory.length * 32)} color="var(--chart-brain)" /></SectionCard>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Clinical outcomes</h2>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Cases with complications" value={out.withComplications} icon={AlertTriangle} tone={out.withComplications ? 'red' : 'green'} hint={`${pct(out.complicationRate)} of operations (≥1 documented complication)`} />
        <StatCard index={1} label="Reoperations" value={out.reoperations} icon={Repeat} tone="amber" hint="cases flagged as reoperation of a prior case" />
        <StatCard index={2} label="Follow-up completion" value={pct(out.fuRate)} icon={ClipboardCheck} tone="green" hint={`${out.fuDone} completed of ${out.fuDue} due (completed + missed + overdue)`} />
        <StatCard index={3} label="Documented assessments" value={out.assessmentsDocumented} icon={Activity} tone="lavender" hint="neurological assessments on cases in range" />
      </div>
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Documented neurological outcomes" description="Outcome recorded on the case; 'unknown' means not documented" icon={Activity}><SimpleBarChart data={out.outcomes} height={220} colors={['var(--success)', 'var(--cyan)', 'var(--danger)', 'var(--navy-light)', 'var(--muted-foreground)']} /></SectionCard>
        <SectionCard title="Complications by severity" icon={AlertTriangle}><SimpleBarChart data={out.bySeverity} height={220} colors={['var(--muted-foreground)', 'var(--warning)', 'var(--danger)']} /></SectionCard>
        <SectionCard title="Functional assessment trends" description={`Mean KPS (brain) n=${out.kpsByType.map((k) => k.n).join('/')} · mean ODI (spine) n=${out.odiByType.map((k) => k.n).join('/')}`} icon={Activity}>
          <RecoveryChart data={out.kpsByType} series={[{ key: 'kps', name: 'Mean KPS', color: 'var(--chart-brain)' }]} yDomain={[0, 100]} height={110} />
          <RecoveryChart data={out.odiByType} series={[{ key: 'odi', name: 'Mean ODI %', color: 'var(--chart-spine)' }]} yDomain={[0, 100]} height={110} />
        </SectionCard>
      </div>
      <Collapsible>
        <CollapsibleTrigger asChild><Button variant="ghost" size="sm"><Info /> Statistic definitions <ChevronDown /></Button></CollapsibleTrigger>
        <CollapsibleContent>
          <DemoNotice className="mt-2"><ul className="list-disc space-y-0.5 pl-4"><li><strong>Operations</strong>: cases with status “completed” whose surgery date is in range.</li><li><strong>Complication rate</strong>: completed cases with at least one documented complication ÷ operations. This is a documentation count, not a quality metric.</li><li><strong>Reoperations</strong>: completed cases flagged as a reoperation of an earlier case (staged procedures are included).</li><li><strong>Follow-up completion</strong>: completed follow-ups ÷ follow-ups that were due (completed, missed or overdue). Future appointments are excluded.</li><li><strong>Outcomes</strong>: as documented on the case; “unknown” is shown explicitly and never counted as improved.</li><li><strong>Functional trends</strong>: mean of recorded scores per assessment type; missing scores are excluded, not imputed.</li></ul></DemoNotice>
        </CollapsibleContent>
      </Collapsible>
    </PageTransition>
  )
}
