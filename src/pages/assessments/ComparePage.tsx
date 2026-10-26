import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Activity, GitCompare, Info } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { PatientSelect } from '@/components/shared/PatientSelect'
import { Field } from '@/components/shared/FormField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/shared/EmptyState'
import { RecoveryChart } from '@/components/charts/RecoveryChart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDataset } from '@/services/repository'
import { computeGcs, motorTotal } from '@/utils/clinical'
import { fmtDate } from '@/utils/format'
import type { NeuroAssessment } from '@/types'
import { assessmentTypes, labelOf } from '@/components/clinical/clinicalOptions'
import { cn } from '@/lib/utils'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Button } from '@/components/ui/button'

type Slot = 'baseline' | 'postoperative' | 'first-follow-up' | 'latest-follow-up'
const slotLabel: Record<Slot, string> = { baseline: 'Baseline (preoperative)', postoperative: 'Postoperative', 'first-follow-up': 'First follow-up', 'latest-follow-up': 'Latest follow-up' }

function autoPick(list: NeuroAssessment[]): Record<Slot, string> {
  const pre = list.find((a) => a.type === 'preoperative')
  const post = list.find((a) => a.type === 'immediate-postoperative' || a.type === 'inpatient-postoperative')
  const fus = list.filter((a) => a.type === 'outpatient-follow-up' || a.type === 'other')
  return { baseline: pre?.id ?? '', postoperative: post?.id ?? '', 'first-follow-up': fus[0]?.id ?? '', 'latest-follow-up': fus.length > 1 ? fus[fus.length - 1].id : '' }
}

const num = (v: number | null | undefined) => (v === null || v === undefined ? null : v)

export function ComparePage() {
  const [params, setParams] = useSearchParams()
  const d = useDataset()
  const patientId = params.get('patient') ?? ''
  const cases = useMemo(() => d.cases.filter((c) => c.patientId === patientId && d.assessments.some((a) => a.caseId === c.id)), [d, patientId])
  const caseId = params.get('case') && cases.some((c) => c.id === params.get('case')) ? params.get('case')! : cases[0]?.id ?? ''
  const list = useMemo(() => d.assessments.filter((a) => a.caseId === caseId).sort((a, b) => (a.date < b.date ? -1 : 1)), [d.assessments, caseId])
  const [slots, setSlots] = useState<Record<Slot, string>>(() => autoPick(list))
  useEffect(() => setSlots(autoPick(list)), [list])

  const picked = (Object.keys(slotLabel) as Slot[]).map((s) => ({ slot: s, a: list.find((x) => x.id === slots[s]) }))
  const domain = list[0]?.domain
  const base = picked[0].a

  const chartData = picked.filter((p) => p.a).map(({ slot, a }) => {
    const m = motorTotal(a!.motor)
    return { label: slotLabel[slot].split(' ')[0], gcs: domain === 'brain' ? computeGcs(a!.gcs).total : null, motor: m.tested ? m.sum : null, pain: num(a!.painScore), odi: num(a!.odiScore), mrs: num(a!.mrs), kps: num(a!.kps) }
  })

  const rows: { label: string; get: (a: NeuroAssessment) => string | number | null; higherBetter?: boolean; lowerBetter?: boolean }[] = domain === 'brain'
    ? [
        { label: 'GCS total', get: (a) => (a.gcs ? computeGcs(a.gcs).label : null), higherBetter: true },
        { label: 'Pupils', get: (a) => (a.pupils ? `R ${a.pupils.right.size}mm ${a.pupils.right.reaction} · L ${a.pupils.left.size}mm ${a.pupils.left.reaction}` : null) },
        { label: 'Cranial nerves', get: (a) => a.cranialNerves ?? null },
        { label: 'Right upper limb', get: (a) => a.motor.rightUpper, higherBetter: true },
        { label: 'Left upper limb', get: (a) => a.motor.leftUpper, higherBetter: true },
        { label: 'Right lower limb', get: (a) => a.motor.rightLower, higherBetter: true },
        { label: 'Left lower limb', get: (a) => a.motor.leftLower, higherBetter: true },
        { label: 'Sensory', get: (a) => a.sensory ?? null },
        { label: 'Deficits', get: (a) => (a.deficits.length ? a.deficits.join('; ') : 'None recorded') },
        { label: 'mRS', get: (a) => num(a.mrs), lowerBetter: true },
        { label: 'KPS', get: (a) => num(a.kps), higherBetter: true },
      ]
    : [
        { label: 'Right upper limb', get: (a) => a.motor.rightUpper, higherBetter: true },
        { label: 'Left upper limb', get: (a) => a.motor.leftUpper, higherBetter: true },
        { label: 'Right lower limb', get: (a) => a.motor.rightLower, higherBetter: true },
        { label: 'Left lower limb', get: (a) => a.motor.leftLower, higherBetter: true },
        { label: 'Sensory', get: (a) => a.sensory ?? null },
        { label: 'Reflexes', get: (a) => a.reflexes ?? null },
        { label: 'Bowel / bladder', get: (a) => a.bowelBladder ?? null },
        { label: 'Pain (NRS)', get: (a) => num(a.painScore), lowerBetter: true },
        { label: 'ODI (%)', get: (a) => num(a.odiScore), lowerBetter: true },
        { label: 'ASIA grade', get: (a) => (a.asiaGrade === 'not-assessed' ? null : a.asiaGrade ?? null) },
        { label: 'Functional status', get: (a) => a.functionalStatus ?? null },
        { label: 'Deficits', get: (a) => (a.deficits.length ? a.deficits.join('; ') : 'None recorded') },
      ]

  const setParam = (k: string, v: string) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); if (k === 'patient') n.delete('case'); setParams(n, { replace: true }) }

  return (
    <PageTransition>
      <PageHeader title="Neurological comparison" description="Before-and-after comparison of recorded examinations. Values that were not recorded are shown as such and are never interpreted as change." actions={<Button asChild variant="outline"><Link to="/assessments/new"><Activity /> New assessment</Link></Button>} />
      <div className="surface mb-5 grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-6">
        <Field label="Patient" className="lg:col-span-2"><PatientSelect value={patientId} onChange={(v) => setParam('patient', v)} /></Field>
        <Field label="Surgical case" className="lg:col-span-4"><Select value={caseId} onValueChange={(v) => setParam('case', v)} disabled={!cases.length}><SelectTrigger><SelectValue placeholder={patientId ? 'No cases with assessments' : 'Select a patient'} /></SelectTrigger><SelectContent>{cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.caseNumber} · {c.plannedProcedure}</SelectItem>)}</SelectContent></Select></Field>
        {(Object.keys(slotLabel) as Slot[]).map((s) => (
          <Field key={s} label={slotLabel[s]} className="lg:col-span-3 xl:col-span-1 lg:[&:nth-child(3)]:col-span-3">
            <Select value={slots[s] || 'none'} onValueChange={(v) => setSlots((x) => ({ ...x, [s]: v === 'none' ? '' : v }))} disabled={!list.length}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">— Not selected —</SelectItem>{list.map((a) => <SelectItem key={a.id} value={a.id}>{fmtDate(a.date)} · {labelOf(assessmentTypes, a.type)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        ))}
      </div>

      {!list.length ? (
        <EmptyState icon={GitCompare} title="Select a patient with recorded assessments" description="Try Amina Kessy, Joseph Mwangi or Daniel Okafor for complete journeys." />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title={domain === 'brain' ? 'GCS and motor sum' : 'Motor sum and pain'} description="Gaps indicate values not recorded at that time point" icon={Activity}>
              <RecoveryChart data={chartData} series={domain === 'brain' ? [{ key: 'gcs', name: 'GCS (3–15)', color: 'var(--chart-brain)' }, { key: 'motor', name: 'Motor sum (0–20)', color: 'var(--chart-spine)' }] : [{ key: 'motor', name: 'Motor sum (0–20)', color: 'var(--chart-spine)' }, { key: 'pain', name: 'Pain NRS (0–10)', color: 'var(--chart-other)' }]} yDomain={[0, 20]} />
            </SectionCard>
            <SectionCard title={domain === 'brain' ? 'Functional scales' : 'Disability index'} description={domain === 'brain' ? 'mRS (lower is better) and KPS (higher is better)' : 'ODI percentage (lower is better)'} icon={Activity}>
              <RecoveryChart data={chartData} series={domain === 'brain' ? [{ key: 'kps', name: 'KPS (0–100)', color: 'var(--chart-vascular)' }, { key: 'mrs', name: 'mRS (0–6)', color: 'var(--chart-other)' }] : [{ key: 'odi', name: 'ODI %', color: 'var(--chart-brain)' }]} yDomain={domain === 'brain' ? [0, 100] : [0, 100]} />
            </SectionCard>
          </div>
          <SectionCard title="Structured comparison" description="Arrows compare each column against the baseline column where both values are numeric and recorded." icon={GitCompare} noPadding>
            <Table>
              <TableHeader><TableRow><TableHead className="w-44">Finding</TableHead>{picked.map(({ slot, a }) => <TableHead key={slot}><div>{slotLabel[slot]}</div><div className="font-normal normal-case tracking-normal text-[11px]">{a ? fmtDate(a.date) : 'Not selected'}</div></TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const bv = base ? r.get(base) : null
                  return (
                    <TableRow key={r.label}>
                      <TableCell className="font-medium font-sans">{r.label}</TableCell>
                      {picked.map(({ slot, a }, i) => {
                        if (!a) return <TableCell key={slot} className="text-muted-foreground">—</TableCell>
                        const v = r.get(a)
                        const numeric = typeof v === 'number' && typeof bv === 'number' && i > 0
                        const diff = numeric ? (v as number) - (bv as number) : 0
                        const better = numeric && diff !== 0 && ((r.higherBetter && diff > 0) || (r.lowerBetter && diff < 0))
                        const worse = numeric && diff !== 0 && ((r.higherBetter && diff < 0) || (r.lowerBetter && diff > 0))
                        return (
                          <TableCell key={slot} className={cn(v === null && 'text-muted-foreground italic')}>
                            {v === null ? 'Not recorded' : <span className="inline-flex items-center gap-1.5">{String(v)}{numeric && diff !== 0 && <span className={cn('text-[11px] font-semibold', better && 'text-emerald-600 dark:text-success', worse && 'text-red-600 dark:text-danger')} title="Change vs baseline">{diff > 0 ? '▲' : '▼'} {Math.abs(diff)}</span>}</span>}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </SectionCard>
          <DemoNotice><span className="inline-flex items-start gap-1"><Info className="mt-0.5 size-3.5 shrink-0" /> This comparison displays recorded data only. It does not generate clinical recommendations, and missing time points are never treated as improvement or deterioration.</span></DemoNotice>
        </div>
      )}
    </PageTransition>
  )
}
