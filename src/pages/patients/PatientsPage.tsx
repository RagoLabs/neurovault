import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { LayoutGrid, List, UserPlus, Users, X } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useDataset } from '@/services/repository'
import { caseFollowUpStatus, patientAge, type CaseFollowUpStatus } from '@/utils/clinical'
import { fmtDate, initials } from '@/utils/format'
import type { Patient } from '@/types'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

interface Row {
  p: Patient
  age: number
  latestConsultation?: string
  latestSurgery?: string
  classification: 'brain' | 'spine' | 'both' | 'none'
  followUp: CaseFollowUpStatus
  caseCount: number
}

export function PatientsPage() {
  const d = useDataset()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [fu, setFu] = useState('all')
  const [view, setView] = useState<'table' | 'grid'>('table')

  const rows = useMemo<Row[]>(() => {
    return d.patients.map((p) => {
      const cases = d.cases.filter((c) => c.patientId === p.id)
      const cons = d.consultations.filter((c) => c.patientId === p.id).map((c) => c.date).sort()
      const surg = cases.filter((c) => c.surgeryDate).map((c) => c.surgeryDate!).sort()
      const hasBrain = cases.some((c) => c.type !== 'spine')
      const hasSpine = cases.some((c) => c.type === 'spine')
      const latest = [...cases].filter((c) => c.status === 'completed').sort((a, b) => (a.surgeryDate! < b.surgeryDate! ? 1 : -1))[0]
      return {
        p,
        age: patientAge(p),
        latestConsultation: cons.at(-1),
        latestSurgery: surg.at(-1),
        classification: hasBrain && hasSpine ? 'both' : hasBrain ? 'brain' : hasSpine ? 'spine' : 'none',
        followUp: latest ? caseFollowUpStatus(latest, d.followUps) : 'none',
        caseCount: cases.length,
      }
    })
  }, [d])

  const filtered = useMemo(() => rows.filter((r) => (type === 'all' || r.classification === type || (type === 'brain' && r.classification === 'both') || (type === 'spine' && r.classification === 'both')) && (status === 'all' || r.p.status === status) && (fu === 'all' || r.followUp === fu)), [rows, type, status, fu])
  const hasFilters = type !== 'all' || status !== 'all' || fu !== 'all' || q

  const columns = useMemo<ColumnDef<Row, unknown>[]>(
    () => [
      { id: 'number', header: 'Patient ID', accessorFn: (r) => r.p.patientNumber, cell: ({ row }) => <span className="font-medium whitespace-nowrap">{row.original.p.patientNumber}</span>, size: 110 },
      {
        id: 'name', header: 'Full name', accessorFn: (r) => `${r.p.firstName} ${r.p.lastName}`,
        cell: ({ row }) => (
          <span className="flex items-center gap-2 min-w-0">
            <Avatar className="size-7"><AvatarFallback className={cn('text-[10px]', row.original.p.sex === 'female' ? 'bg-lavender/20 text-indigo-700 dark:text-indigo-300' : 'bg-cyan/20 text-sky-700 dark:text-sky-300')}>{initials(row.original.p.firstName, row.original.p.lastName)}</AvatarFallback></Avatar>
            <span className="font-medium font-sans truncate">{row.original.p.firstName} {row.original.p.lastName}</span>
            {row.original.p.status === 'inactive' && <Badge variant="secondary">Inactive</Badge>}
          </span>
        ),
      },
      { id: 'age', header: 'Age', accessorFn: (r) => r.age, cell: ({ getValue }) => <span className="tabular-nums">{getValue() as number}</span>, size: 60 },
      { id: 'sex', header: 'Sex', accessorFn: (r) => r.p.sex, cell: ({ getValue }) => ((getValue() as string) === 'male' ? 'M' : 'F'), size: 50 },
      { id: 'dx', header: 'Primary diagnosis', accessorFn: (r) => r.p.primaryDiagnosis, cell: ({ getValue }) => <span className="block max-w-72 truncate font-sans" title={getValue() as string}>{getValue() as string}</span> },
      { id: 'type', header: 'Type', accessorFn: (r) => r.classification, cell: ({ getValue }) => { const v = getValue() as Row['classification']; return v === 'none' ? <span className="text-muted-foreground">—</span> : v === 'both' ? <span className="flex gap-1"><StatusBadge kind="caseType" value="brain" iconOnly /><StatusBadge kind="caseType" value="spine" iconOnly /></span> : <StatusBadge kind="caseType" value={v} /> }, size: 90 },
      { id: 'cons', header: 'Latest consultation', accessorFn: (r) => r.latestConsultation ?? '', cell: ({ getValue }) => <span className="tabular-nums whitespace-nowrap">{fmtDate(getValue() as string)}</span> },
      { id: 'surg', header: 'Latest surgery', accessorFn: (r) => r.latestSurgery ?? '', cell: ({ getValue }) => <span className="tabular-nums whitespace-nowrap">{fmtDate(getValue() as string)}</span> },
      { id: 'fu', header: 'Follow-up', accessorFn: (r) => r.followUp, cell: ({ getValue }) => <StatusBadge kind="caseFollowUp" value={getValue() as CaseFollowUpStatus} /> },
      { id: 'actions', header: '', enableSorting: false, cell: ({ row }) => <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/patients/${row.original.p.id}`) }}>Open</Button>, size: 70 },
    ],
    [navigate],
  )

  return (
    <PageTransition>
      <PageHeader title="Patients" description={`${d.patients.length} registered patients · ${d.patients.filter((p) => p.status === 'active').length} active`} actions={<Button asChild><Link to="/patients/new"><UserPlus /> Register patient</Link></Button>} />
      <div className="surface">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Search name, ID, diagnosis…" className="md:w-80" />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={type} onValueChange={setType}><SelectTrigger className="w-36" aria-label="Case type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="brain">Brain</SelectItem><SelectItem value="spine">Spine</SelectItem><SelectItem value="none">No case yet</SelectItem></SelectContent></Select>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-32" aria-label="Status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
            <Select value={fu} onValueChange={setFu}><SelectTrigger className="w-40" aria-label="Follow-up status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All follow-up</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="due">Review due</SelectItem><SelectItem value="missed">Missed</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="none">None</SelectItem></SelectContent></Select>
            {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setQ(''); setType('all'); setStatus('all'); setFu('all') }}><X /> Clear</Button>}
          </div>
          <div className="md:ml-auto">
            <Tabs value={view} onValueChange={(v) => setView(v as 'table' | 'grid')}>
              <TabsList className="h-9"><TabsTrigger value="table" aria-label="Table view"><List /></TabsTrigger><TabsTrigger value="grid" aria-label="Grid view"><LayoutGrid /></TabsTrigger></TabsList>
            </Tabs>
          </div>
        </div>
        {view === 'table' ? (
          <DataTable
            columns={columns}
            data={filtered}
            globalFilter={q}
            onRowClick={(r) => navigate(`/patients/${r.p.id}`)}
            emptyTitle="No patients match"
            emptyDescription="Try a different search or clear the filters."
            emptyAction={<Button variant="outline" onClick={() => { setQ(''); setType('all'); setStatus('all'); setFu('all') }}>Clear filters</Button>}
            initialSorting={[{ id: 'number', desc: false }]}
            mobileCard={(r) => (
              <div>
                <div className="flex items-center justify-between gap-2"><span className="font-semibold">{r.p.firstName} {r.p.lastName}</span><StatusBadge kind="caseFollowUp" value={r.followUp} /></div>
                <div className="text-xs text-muted-foreground font-data">{r.p.patientNumber} · {r.age} y · {r.p.sex === 'male' ? 'M' : 'F'}</div>
                <div className="mt-1 text-sm">{r.p.primaryDiagnosis}</div>
              </div>
            )}
          />
        ) : (
          <GridView rows={filtered.filter((r) => !q || `${r.p.firstName} ${r.p.lastName} ${r.p.patientNumber} ${r.p.primaryDiagnosis}`.toLowerCase().includes(q.toLowerCase()))} />
        )}
      </div>
    </PageTransition>
  )
}

function GridView({ rows }: { rows: Row[] }) {
  if (!rows.length) return <EmptyState icon={Users} title="No patients match" compact />
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {rows.map((r) => (
        <Link key={r.p.id} to={`/patients/${r.p.id}`} className="surface surface-hover block p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex items-start gap-3">
            <Avatar className="size-10"><AvatarFallback className={cn(r.p.sex === 'female' ? 'bg-lavender/20 text-indigo-700 dark:text-indigo-300' : 'bg-cyan/20 text-sky-700 dark:text-sky-300')}>{initials(r.p.firstName, r.p.lastName)}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><span className="truncate font-semibold">{r.p.firstName} {r.p.lastName}</span>{r.classification !== 'none' && (r.classification === 'both' ? <span className="flex gap-1"><StatusBadge kind="caseType" value="brain" iconOnly /><StatusBadge kind="caseType" value="spine" iconOnly /></span> : <StatusBadge kind="caseType" value={r.classification} iconOnly />)}</div>
              <div className="font-data text-xs text-muted-foreground">{r.p.patientNumber} · {r.age} y · {r.p.sex === 'male' ? 'Male' : 'Female'}</div>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-sm">{r.p.primaryDiagnosis}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{r.caseCount} case{r.caseCount === 1 ? '' : 's'} · Last surgery {fmtDate(r.latestSurgery)}</span>
            <StatusBadge kind="caseFollowUp" value={r.followUp} />
          </div>
        </Link>
      ))}
    </div>
  )
}
