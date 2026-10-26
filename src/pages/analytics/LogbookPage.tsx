import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FileDown, FileSpreadsheet, Printer } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { Field } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDataset } from '@/services/repository'
import { computeOutcomes, defaultFilters, filterCases, type AnalyticsFilters } from './analyticsUtils'
import { getProcedureDistribution } from '@/services/stats'
import { exportCsv, exportXlsx, savePdf } from '@/utils/export'
import { surgeon, brand } from '@/config/surgeon'
import { fmtDate, fullName } from '@/utils/format'
import { patientAge } from '@/utils/clinical'
import { DEMO_REFERENCE_DATE } from '@/config/demo'
import { Logo } from '@/components/layout/Logo'

const pct = (v: number | null) => (v === null ? 'n/a' : `${Math.round(v * 100)}%`)

export function LogbookPage() {
  const d = useDataset()
  const [f, setF] = useState<AnalyticsFilters>(defaultFilters())
  const [deid, setDeid] = useState(true)
  const cases = useMemo(() => filterCases(d.cases, f).filter((c) => c.status === 'completed').sort((a, b) => (a.surgeryDate! < b.surgeryDate! ? -1 : 1)), [d.cases, f])
  const out = useMemo(() => computeOutcomes(d, cases), [d, cases])
  const dist = useMemo(() => getProcedureDistribution(cases), [cases])
  const procedureSummary = useMemo(() => { const m = new Map<string, number>(); cases.forEach((c) => m.set(c.plannedProcedure, (m.get(c.plannedProcedure) ?? 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1]) }, [cases])
  const hospital = (id: string) => d.hospitals.find((h) => h.id === id)?.shortName ?? ''
  const patientCol = (pid: string) => { const p = d.patients.find((x) => x.id === pid); if (!p) return ''; return deid ? `${p.sex === 'male' ? 'M' : 'F'} ${patientAge(p)} y` : `${fullName(p)} · ${p.patientNumber}` }
  const headers = ['#', 'Date', deid ? 'Patient (de-identified)' : 'Patient', 'Diagnosis', 'Procedure', 'Type', 'Hospital', 'Role', 'Priority', 'Complications', 'Outcome']
  const rows = () => cases.map((c, i) => [i + 1, fmtDate(c.surgeryDate), patientCol(c.patientId), c.diagnosis, c.plannedProcedure, c.type, hospital(c.hospitalId), c.surgeonRole, c.priority, c.complications.length ? c.complications.map((k) => k.description).join('; ') : 'None', c.outcome ?? 'unknown'])
  const stamp = `${f.from}_${f.to}`
  const generated = fmtDate(DEMO_REFERENCE_DATE)

  const pdf = () => { savePdf({ title: 'Surgical logbook', subtitle: `${surgeon.fullName} · ${surgeon.credentials}`, meta: [`Reporting period ${fmtDate(f.from)} – ${fmtDate(f.to)}`, `Generated ${generated}`, deid ? 'De-identified' : 'Identified'], sections: [{ heading: 'Surgeon information', keyValues: [['Name', surgeon.fullName], ['Specialty', surgeon.specialty], ['Registration', surgeon.registrationNumber], ['Practice', surgeon.practiceName]] }, { heading: 'Procedure summary', keyValues: [['Total operations', String(cases.length)], ['Brain', String(dist[0].value)], ['Spine', String(dist[1].value)], ['Neurovascular', String(dist[2].value)], ['Other', String(dist[3].value)], ['Emergency', String(cases.filter((c) => c.priority === 'emergency').length)]] }, { heading: 'Procedures performed', table: { headers: ['Procedure', 'Count'], rows: procedureSummary.map(([p, n]) => [p, n]) } }, { heading: 'Case listing', table: { headers, rows: rows() } }, { heading: 'Outcome summary', keyValues: [['Cases with documented complications', `${out.withComplications} (${pct(out.complicationRate)})`], ['Reoperations', String(out.reoperations)], ['Follow-up completion', `${pct(out.fuRate)} (${out.fuDone}/${out.fuDue} due)`], ...out.outcomes.map((o) => [`Outcome: ${o.label}`, String(o.value)] as [string, string])] }, { paragraphs: ['Definitions: operations are completed cases in the period; complication rate is cases with ≥1 documented complication ÷ operations; follow-up completion is completed ÷ due (completed + missed + overdue). Statistics are counts from the record and are not success-rate claims.', `Generated ${generated} by ${brand.name}. ${brand.demoLabel}.`] }], footer: `${surgeon.signatureLine} · ${brand.demoLabel}`, watermark: 'DEMO' }, `surgical-logbook-${stamp}.pdf`); toast.success('Logbook PDF generated') }

  return (
    <PageTransition>
      <PageHeader title="Surgical logbook" description="Printable record of completed procedures for a reporting period, with procedure and outcome summaries." actions={<><Button variant="outline" onClick={() => { exportCsv(`surgical-logbook-${stamp}.csv`, headers, rows()); toast.success('CSV exported') }}><FileDown /> CSV</Button><Button variant="outline" onClick={() => { exportXlsx(`surgical-logbook-${stamp}.xlsx`, [{ name: 'Logbook', headers, rows: rows() }, { name: 'Procedures', headers: ['Procedure', 'Count'], rows: procedureSummary }]); toast.success('Excel exported') }}><FileSpreadsheet /> Excel</Button><Button variant="outline" onClick={() => window.print()}><Printer /> Print</Button><Button onClick={pdf}><FileDown /> PDF</Button></>} />
      <div className="surface mb-5 grid gap-3 p-4 md:grid-cols-5 no-print">
        <Field label="From" htmlFor="lf"><Input id="lf" type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
        <Field label="To" htmlFor="lt"><Input id="lt" type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
        <Field label="Hospital"><Select value={f.hospitalId} onValueChange={(v) => setF({ ...f, hospitalId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All hospitals</SelectItem>{d.hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.shortName}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Case type"><Select value={f.caseType} onValueChange={(v) => setF({ ...f, caseType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="brain">Brain</SelectItem><SelectItem value="spine">Spine</SelectItem><SelectItem value="combined">Combined</SelectItem></SelectContent></Select></Field>
        <Field label="Identifiers"><div className="flex h-9 items-center gap-2"><Switch id="ldeid" checked={deid} onCheckedChange={setDeid} /><Label htmlFor="ldeid">De-identified</Label></div></Field>
      </div>

      <article className="print-area surface overflow-hidden bg-white text-black dark:bg-card dark:text-foreground print:border-0 print:shadow-none">
        <header className="flex flex-col gap-4 border-b bg-navy p-6 text-white md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4"><Logo className="size-12" /><div><div className="text-xs uppercase tracking-[0.2em] text-teal-300">Surgical logbook</div><h2 className="text-2xl font-bold">{surgeon.fullName}</h2><div className="text-sm text-slate-300">{surgeon.credentials} · {surgeon.specialty}</div></div></div>
          <div className="text-sm text-slate-300 md:text-right"><div>Reporting period <strong className="text-white">{fmtDate(f.from)} – {fmtDate(f.to)}</strong></div><div>Registration {surgeon.registrationNumber}</div><div>Generated {generated}</div><div className="mt-1 text-[11px] uppercase tracking-wider text-amber-300">{brand.demoLabel}</div></div>
        </header>
        <div className="grid gap-6 p-6 md:grid-cols-3">
          <section className="md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Procedure summary</h3>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[['Total', cases.length], ['Brain', dist[0].value], ['Spine', dist[1].value], ['Neurovascular', dist[2].value], ['Other', dist[3].value]].map(([k, v]) => <div key={String(k)} className="rounded-lg border p-3"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div><div className="font-data text-2xl font-bold tabular-nums">{v}</div></div>)}
            </div>
            <table className="mt-4 w-full text-sm font-data"><thead><tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground"><th className="py-1.5">Procedure</th><th className="py-1.5 text-right">Count</th></tr></thead><tbody>{procedureSummary.map(([p, n]) => <tr key={p} className="border-b last:border-0"><td className="py-1.5 pr-4 font-sans">{p}</td><td className="py-1.5 text-right tabular-nums">{n}</td></tr>)}</tbody></table>
          </section>
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Outcome summary</h3>
            <dl className="mt-2 space-y-2 text-sm">
              {[['Cases with documented complications', `${out.withComplications} (${pct(out.complicationRate)})`], ['Reoperations', out.reoperations], ['Follow-up completion', `${pct(out.fuRate)} (${out.fuDone}/${out.fuDue} due)`], ...out.outcomes.map((o) => [`Outcome: ${o.label}`, o.value])].map(([k, v]) => <div key={String(k)} className="flex justify-between gap-3 border-b pb-1 last:border-0"><dt className="text-muted-foreground capitalize">{k}</dt><dd className="font-data font-semibold tabular-nums">{v}</dd></div>)}
            </dl>
            <p className="mt-3 text-[11px] text-muted-foreground">Counts from the record; complication rate = cases with ≥1 documented complication ÷ operations; follow-up completion = completed ÷ due. Not a success-rate claim.</p>
          </section>
        </div>
        <section className="border-t p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Case listing ({cases.length})</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs font-data"><thead><tr className="border-b text-left text-[10px] uppercase tracking-wider text-muted-foreground">{headers.map((h) => <th key={h} className="py-1.5 pr-3 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{rows().map((r, i) => <tr key={i} className="border-b last:border-0 align-top">{r.map((v, k) => <td key={k} className={`py-1.5 pr-3 ${k === 3 || k === 4 ? 'font-sans min-w-48' : 'whitespace-nowrap'}`}>{String(v)}</td>)}</tr>)}</tbody>
            </table>
            {!cases.length && <p className="py-6 text-center text-sm text-muted-foreground">No completed procedures in this period.</p>}
          </div>
        </section>
        <footer className="flex flex-col gap-1 border-t p-6 text-xs text-muted-foreground md:flex-row md:justify-between"><span>{surgeon.signatureLine}</span><span>Generated {generated} · {brand.name} {brand.version} · fictional demonstration data</span></footer>
      </article>
    </PageTransition>
  )
}
