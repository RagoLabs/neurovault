import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Activity, GitCompare, Plus } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PatientChip } from '@/components/shared/PatientChip'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDataset } from '@/services/repository'
import { fmtDate, fullName } from '@/utils/format'
import { computeGcs, motorTotal } from '@/utils/clinical'
import type { NeuroAssessment } from '@/types'
import { assessmentTypes, labelOf } from '@/components/clinical/clinicalOptions'

type Row = NeuroAssessment & { patientName: string; caseNumber: string }

export function AssessmentsPage() {
  const d = useDataset()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [domain, setDomain] = useState('all')
  const rows = useMemo<Row[]>(() => d.assessments.filter((a) => (type === 'all' || a.type === type) && (domain === 'all' || a.domain === domain)).map((a) => ({ ...a, patientName: fullName(d.patients.find((p) => p.id === a.patientId)), caseNumber: d.cases.find((c) => c.id === a.caseId)?.caseNumber ?? '' })), [d, type, domain])

  const columns = useMemo<ColumnDef<Row, unknown>[]>(() => [
    { id: 'date', header: 'Date', accessorKey: 'date', cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums">{fmtDate(getValue() as string)}</span> },
    { id: 'patient', header: 'Patient', accessorKey: 'patientName', cell: ({ row }) => <PatientChip patientId={row.original.patientId} compact /> },
    { id: 'case', header: 'Case', accessorKey: 'caseNumber', cell: ({ row }) => <Link to={`/cases/${row.original.caseId}`} onClick={(e) => e.stopPropagation()} className="text-primary hover:underline whitespace-nowrap">{row.original.caseNumber}</Link> },
    { id: 'type', header: 'Assessment', accessorKey: 'type', cell: ({ getValue }) => <span className="capitalize font-sans">{labelOf(assessmentTypes, getValue() as NeuroAssessment['type'])}</span> },
    { id: 'domain', header: 'Domain', accessorKey: 'domain', cell: ({ getValue }) => <StatusBadge kind="caseType" value={getValue() as 'brain' | 'spine'} /> },
    { id: 'gcs', header: 'GCS', accessorFn: (r) => computeGcs(r.gcs).total ?? -1, cell: ({ row }) => row.original.domain === 'brain' ? <span className="tabular-nums">{row.original.gcs ? computeGcs(row.original.gcs).label.split(' ')[0] : <span className="text-muted-foreground">NR</span>}</span> : <span className="text-muted-foreground">—</span>, size: 70 },
    { id: 'motor', header: 'Motor', accessorFn: (r) => motorTotal(r.motor).sum, cell: ({ row }) => { const m = motorTotal(row.original.motor); return <span className="tabular-nums">{m.tested ? `${m.sum}/${m.max}` : <span className="text-muted-foreground">NR</span>}</span> }, size: 80 },
    { id: 'pain', header: 'Pain', accessorFn: (r) => r.painScore ?? -1, cell: ({ row }) => <span className="tabular-nums">{row.original.painScore === null || row.original.painScore === undefined ? <span className="text-muted-foreground">—</span> : `${row.original.painScore}/10`}</span>, size: 70 },
    { id: 'deficits', header: 'Deficits', accessorFn: (r) => r.deficits.length, cell: ({ row }) => row.original.deficits.length ? <span className="block max-w-56 truncate font-sans text-red-700 dark:text-red-300">{row.original.deficits.join('; ')}</span> : <span className="text-emerald-700 dark:text-emerald-300">None recorded</span> },
  ], [])

  return (
    <PageTransition>
      <PageHeader title="Neurological assessments" description="Repeated examinations over time, linked to the surgical case. NR = not recorded." actions={<><Button asChild variant="outline"><Link to="/assessments/compare"><GitCompare /> Compare</Link></Button><Button asChild><Link to="/assessments/new"><Plus /> New assessment</Link></Button></>} />
      <div className="surface">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Search patient, case…" className="md:w-72" />
          <Select value={type} onValueChange={setType}><SelectTrigger className="md:w-56" aria-label="Assessment type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All assessment types</SelectItem>{assessmentTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
          <Select value={domain} onValueChange={setDomain}><SelectTrigger className="md:w-36" aria-label="Domain"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Brain & spine</SelectItem><SelectItem value="brain">Brain</SelectItem><SelectItem value="spine">Spine</SelectItem></SelectContent></Select>
        </div>
        <DataTable columns={columns} data={rows} globalFilter={q} onRowClick={(r) => navigate(`/assessments/${r.id}`)} initialSorting={[{ id: 'date', desc: true }]} pageSize={15} emptyTitle="No assessments" emptyAction={<Button asChild><Link to="/assessments/new"><Activity /> New assessment</Link></Button>}
          mobileCard={(r) => <div><div className="flex justify-between"><span className="font-semibold">{r.patientName}</span><StatusBadge kind="caseType" value={r.domain} /></div><div className="text-xs text-muted-foreground">{fmtDate(r.date)} · {labelOf(assessmentTypes, r.type)}</div></div>} />
      </div>
    </PageTransition>
  )
}
