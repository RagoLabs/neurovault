import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Brain, Plus, X } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PatientChip } from '@/components/shared/PatientChip'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDataset } from '@/services/repository'
import { caseFollowUpStatus, type CaseFollowUpStatus } from '@/utils/clinical'
import { fmtDate, fullName } from '@/utils/format'
import type { SurgicalCase, CaseStatus } from '@/types'

type Row = SurgicalCase & { patientName: string; hospitalName: string; fu: CaseFollowUpStatus }

export function CasesPage() {
  const d = useDataset()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const type = params.get('type') ?? 'all'
  const status = params.get('status') ?? 'all'
  const hospital = params.get('hospital') ?? 'all'
  const set = (k: string, v: string) => { const n = new URLSearchParams(params); if (v === 'all') n.delete(k); else n.set(k, v); setParams(n, { replace: true }) }

  const rows = useMemo<Row[]>(() => d.cases
    .filter((c) => (type === 'all' || c.type === type) && (status === 'all' || c.status === status) && (hospital === 'all' || c.hospitalId === hospital))
    .map((c) => ({ ...c, patientName: fullName(d.patients.find((p) => p.id === c.patientId)), hospitalName: d.hospitals.find((h) => h.id === c.hospitalId)?.shortName ?? '—', fu: caseFollowUpStatus(c, d.followUps) })), [d, type, status, hospital])

  const counts = useMemo(() => Object.fromEntries((['all', 'planned', 'scheduled', 'completed', 'postponed', 'cancelled'] as const).map((s) => [s, d.cases.filter((c) => (s === 'all' || c.status === s) && (type === 'all' || c.type === type)).length])), [d.cases, type])

  const columns = useMemo<ColumnDef<Row, unknown>[]>(() => [
    { id: 'number', header: 'Case number', accessorKey: 'caseNumber', cell: ({ getValue }) => <span className="font-semibold whitespace-nowrap">{getValue() as string}</span>, size: 120 },
    { id: 'patient', header: 'Patient', accessorKey: 'patientName', cell: ({ row }) => <PatientChip patientId={row.original.patientId} compact /> },
    { id: 'type', header: 'Type', accessorKey: 'type', cell: ({ getValue }) => <StatusBadge kind="caseType" value={getValue() as SurgicalCase['type']} />, size: 90 },
    { id: 'dx', header: 'Diagnosis', accessorKey: 'diagnosis', cell: ({ getValue }) => <span className="block max-w-64 truncate font-sans" title={getValue() as string}>{getValue() as string}</span> },
    { id: 'proc', header: 'Planned procedure', accessorKey: 'plannedProcedure', cell: ({ getValue }) => <span className="block max-w-64 truncate font-sans" title={getValue() as string}>{getValue() as string}</span> },
    { id: 'hospital', header: 'Hospital', accessorKey: 'hospitalName', cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue() as string}</span> },
    { id: 'date', header: 'Surgery date', accessorFn: (r) => r.surgeryDate ?? r.plannedDate ?? '', cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{row.original.surgeryDate ? fmtDate(row.original.surgeryDate) : row.original.plannedDate ? <span className="text-muted-foreground">{fmtDate(row.original.plannedDate)} (planned)</span> : <span className="text-muted-foreground">Not scheduled</span>}</span> },
    { id: 'priority', header: 'Priority', accessorKey: 'priority', cell: ({ getValue }) => <StatusBadge kind="priority" value={getValue() as SurgicalCase['priority']} /> },
    { id: 'status', header: 'Status', accessorKey: 'status', cell: ({ getValue }) => <StatusBadge kind="case" value={getValue() as CaseStatus} /> },
    { id: 'fu', header: 'Follow-up', accessorKey: 'fu', cell: ({ getValue }) => <StatusBadge kind="caseFollowUp" value={getValue() as CaseFollowUpStatus} /> },
  ], [])

  const hasFilters = type !== 'all' || status !== 'all' || hospital !== 'all' || q

  return (
    <PageTransition>
      <PageHeader title="Neurosurgical cases" description={`${d.cases.length} cases · ${d.cases.filter((c) => c.status === 'completed').length} completed`} actions={<Button asChild><Link to="/cases/new"><Plus /> Create surgical case</Link></Button>} />
      <div className="surface">
        <div className="flex flex-col gap-3 border-b p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Tabs value={type} onValueChange={(v) => set('type', v)}>
              <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="brain">Brain</TabsTrigger><TabsTrigger value="spine">Spine</TabsTrigger><TabsTrigger value="combined">Combined</TabsTrigger></TabsList>
            </Tabs>
            <SearchInput value={q} onChange={setQ} placeholder="Search case, patient, diagnosis, procedure…" className="md:w-80 md:ml-auto" />
            <Select value={hospital} onValueChange={(v) => set('hospital', v)}><SelectTrigger className="md:w-52" aria-label="Hospital"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All hospitals</SelectItem>{d.hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select>
            {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setQ(''); setParams({}, { replace: true }) }}><X /> Clear</Button>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'planned', 'scheduled', 'completed', 'postponed', 'cancelled'] as const).map((s) => (
              <button key={s} type="button" onClick={() => set('status', s)} className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors cursor-pointer ${status === s ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
                {s} <span className="ml-1 tabular-nums text-muted-foreground">{counts[s]}</span>
              </button>
            ))}
          </div>
        </div>
        <DataTable columns={columns} data={rows} globalFilter={q} onRowClick={(r) => navigate(`/cases/${r.id}`)} initialSorting={[{ id: 'date', desc: true }]} emptyTitle="No cases match" emptyDescription="Adjust the filters or create a new surgical case." emptyAction={<Button asChild><Link to="/cases/new"><Brain /> Create case</Link></Button>}
          mobileCard={(r) => <div><div className="flex justify-between gap-2"><span className="font-semibold">{r.caseNumber}</span><StatusBadge kind="case" value={r.status} /></div><div className="text-sm">{r.patientName}</div><div className="mt-1 text-sm text-muted-foreground">{r.plannedProcedure}</div><div className="mt-2 flex gap-2 text-xs"><StatusBadge kind="caseType" value={r.type} /><span className="tabular-nums">{fmtDate(r.surgeryDate ?? r.plannedDate)}</span></div></div>} />
      </div>
    </PageTransition>
  )
}
