import { Link, useParams } from 'react-router'
import { Activity, GitCompare } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PatientChip } from '@/components/shared/PatientChip'
import { Button } from '@/components/ui/button'
import { NotFound } from '@/pages/NotFound'
import { useDataset } from '@/services/repository'
import { fmtDate } from '@/utils/format'
import { AssessmentSummary } from '@/components/clinical/AssessmentSummary'
import { assessmentTypes, labelOf } from '@/components/clinical/clinicalOptions'
import { KeyValue } from '@/components/shared/KeyValue'

export function AssessmentDetailPage() {
  const { id } = useParams()
  const d = useDataset()
  const a = d.assessments.find((x) => x.id === id)
  if (!a) return <NotFound />
  const c = d.cases.find((x) => x.id === a.caseId)
  const siblings = d.assessments.filter((x) => x.caseId === a.caseId).sort((x, y) => (x.date < y.date ? -1 : 1))
  return (
    <PageTransition>
      <PageHeader title={labelOf(assessmentTypes, a.type)} eyebrow={fmtDate(a.date)} description={<span className="inline-flex items-center gap-2"><StatusBadge kind="caseType" value={a.domain} /> Assessed by {a.assessedBy}</span>} actions={<Button asChild><Link to={`/assessments/compare?patient=${a.patientId}&case=${a.caseId}`}><GitCompare /> Compare over time</Link></Button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Examination findings" icon={Activity}><AssessmentSummary a={a} /></SectionCard>
        <div className="space-y-4">
          <SectionCard title="Patient & case"><PatientChip patientId={a.patientId} />{c && <div className="mt-3 text-sm"><Link to={`/cases/${c.id}`} className="font-semibold text-primary hover:underline">{c.caseNumber}</Link><div className="text-muted-foreground">{c.plannedProcedure}</div></div>}</SectionCard>
          <SectionCard title="Assessments for this case" noPadding>
            <ul className="divide-y">{siblings.map((s) => <li key={s.id}><Link to={`/assessments/${s.id}`} className={`flex items-center justify-between px-5 py-2.5 text-sm hover:bg-muted/50 ${s.id === a.id ? 'bg-primary/5 font-semibold' : ''}`}><span className="capitalize">{labelOf(assessmentTypes, s.type)}</span><span className="font-data text-xs tabular-nums text-muted-foreground">{fmtDate(s.date)}</span></Link></li>)}</ul>
          </SectionCard>
          <SectionCard title="Record"><KeyValue columns={1} items={[{ label: 'Record ID', value: <span className="font-data">{a.id}</span> }, { label: 'Domain', value: a.domain }]} /></SectionCard>
        </div>
      </div>
    </PageTransition>
  )
}
