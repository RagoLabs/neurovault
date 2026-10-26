import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, CalendarCheck, CalendarClock, CalendarPlus, CalendarX, CircleDot, Search, TrendingUp } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PatientChip } from '@/components/shared/PatientChip'
import { StatCard } from '@/components/shared/StatCard'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDataset } from '@/services/repository'
import { deriveFollowUpStatus, type DerivedFollowUpStatus } from '@/utils/clinical'
import { fmtDate, fullName } from '@/utils/format'
import type { FollowUp } from '@/types'
import { RecoveryChart } from '@/components/charts/RecoveryChart'
import { SimpleBarChart } from '@/components/charts/SimpleBarChart'
import { visitTypes, labelOf } from '@/components/clinical/clinicalOptions'

type Row = FollowUp & { derived: DerivedFollowUpStatus; patientName: string; procedure: string }

export function FollowUpsPage() {
  const d = useDataset()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const filter = params.get('status') ?? 'all'

  const all = useMemo<Row[]>(() => d.followUps.map((f) => ({ ...f, derived: deriveFollowUpStatus(f), patientName: fullName(d.patients.find((p) => p.id === f.patientId)), procedure: d.cases.find((c) => c.id === f.caseId)?.plannedProcedure ?? '' })), [d])
  const counts = useMemo(() => ({ today: all.filter((r) => r.derived === 'today').length, upcoming: all.filter((r) => r.derived === 'scheduled').length, overdue: all.filter((r) => r.derived === 'overdue').length, completed: all.filter((r) => r.derived === 'completed').length, missed: all.filter((r) => r.derived === 'missed').length, further: all.filter((r) => r.requiresFurtherAssessment).length }), [all])
  const rows = useMemo(() => all.filter((r) => filter === 'all' ? true : filter === 'further' ? r.requiresFurtherAssessment : filter === 'upcoming' ? r.derived === 'scheduled' || r.derived === 'today' : r.derived === filter), [all, filter])

  const attendance = useMemo(() => [{ label: 'Completed', value: counts.completed }, { label: 'Missed', value: counts.missed }, { label: 'Cancelled', value: all.filter((r) => r.derived === 'cancelled').length }, { label: 'Overdue', value: counts.overdue }, { label: 'Upcoming', value: counts.upcoming + counts.today }], [counts, all])
  const painTrend = useMemo(() => {
    const spine = all.filter((r) => r.derived === 'completed' && r.painScore !== null && r.painScore !== undefined)
    const byType = ['wound-check', 'postoperative-review', 'routine'].map((t) => { const s = spine.filter((r) => r.visitType === t); return { label: t === 'wound-check' ? '2 weeks' : t === 'postoperative-review' ? '6 weeks' : '6 months', pain: s.length ? Number((s.reduce((a, b) => a + (b.painScore ?? 0), 0) / s.length).toFixed(1)) : null, n: s.length } })
    return byType
  }, [all])
  const outcomes = useMemo(() => (['improved', 'stable', 'deteriorated', 'unknown'] as const).map((o) => ({ label: o, value: all.filter((r) => r.derived === 'completed' && (r.outcome ?? 'unknown') === o).length })), [all])

  const columns = useMemo<ColumnDef<Row, unknown>[]>(() => [
    { id: 'date', header: 'Date', accessorFn: (r) => `${r.date} ${r.time}`, cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{fmtDate(row.original.date)} · {row.original.time}</span> },
    { id: 'patient', header: 'Patient', accessorKey: 'patientName', cell: ({ row }) => <PatientChip patientId={row.original.patientId} compact /> },
    { id: 'proc', header: 'Procedure', accessorKey: 'procedure', cell: ({ getValue }) => <span className="block max-w-64 truncate font-sans">{getValue() as string}</span> },
    { id: 'visit', header: 'Visit type', accessorKey: 'visitType', cell: ({ getValue }) => <span className="font-sans">{labelOf(visitTypes, getValue() as FollowUp['visitType'])}</span> },
    { id: 'status', header: 'Status', accessorKey: 'derived', cell: ({ getValue }) => <StatusBadge kind="followUp" value={getValue() as DerivedFollowUpStatus} /> },
    { id: 'outcome', header: 'Outcome', accessorFn: (r) => r.outcome ?? '', cell: ({ row }) => row.original.derived === 'completed' ? <StatusBadge kind="outcome" value={row.original.outcome ?? 'unknown'} /> : row.original.derived === 'missed' ? <Badge variant="secondary">Unknown — not seen</Badge> : <span className="text-muted-foreground">—</span> },
    { id: 'further', header: 'Further assessment', accessorFn: (r) => (r.requiresFurtherAssessment ? 1 : 0), cell: ({ row }) => row.original.requiresFurtherAssessment ? <Badge variant="warning"><AlertTriangle className="size-3" /> Required</Badge> : <span className="text-muted-foreground">—</span> },
    { id: 'actions', header: '', enableSorting: false, cell: ({ row }) => <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/follow-ups/${row.original.id}`) }}>{row.original.derived === 'completed' ? 'View' : 'Record'}</Button> },
  ], [navigate])

  return (
    <PageTransition>
      <PageHeader title="Follow-ups" description="Today's appointments, upcoming reviews, overdue and missed follow-ups, and longitudinal recovery tracking." actions={<><Button asChild variant="outline"><Link to="/calendar"><CalendarClock /> Calendar</Link></Button><Button asChild><Link to="/follow-ups/new"><CalendarPlus /> Record follow-up</Link></Button></>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard index={0} label="Today" value={counts.today} icon={CircleDot} tone="lavender" hint="appointments today" href="/follow-ups?status=today" />
        <StatCard index={1} label="Upcoming" value={counts.upcoming} icon={CalendarClock} tone="cyan" hint="scheduled after today" href="/follow-ups?status=upcoming" />
        <StatCard index={2} label="Overdue" value={counts.overdue} icon={AlertTriangle} tone={counts.overdue ? 'red' : 'green'} hint="past date, not recorded" href="/follow-ups?status=overdue" />
        <StatCard index={3} label="Completed" value={counts.completed} icon={CalendarCheck} tone="green" hint={`${counts.missed} missed`} href="/follow-ups?status=completed" />
        <StatCard index={4} label="Further assessment" value={counts.further} icon={Search} tone="amber" hint="patients flagged for review" href="/follow-ups?status=further" />
      </div>
      <div className="surface mb-5">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <Tabs value={filter} onValueChange={(v) => setParams(v === 'all' ? {} : { status: v }, { replace: true })}>
            <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="today">Today</TabsTrigger><TabsTrigger value="upcoming">Upcoming</TabsTrigger><TabsTrigger value="overdue">Overdue</TabsTrigger><TabsTrigger value="completed">Completed</TabsTrigger><TabsTrigger value="missed">Missed</TabsTrigger><TabsTrigger value="further">Needs assessment</TabsTrigger></TabsList>
          </Tabs>
          <SearchInput value={q} onChange={setQ} placeholder="Search patient, procedure…" className="md:ml-auto md:w-72" />
        </div>
        <DataTable columns={columns} data={rows} globalFilter={q} onRowClick={(r) => navigate(`/follow-ups/${r.id}`)} initialSorting={[{ id: 'date', desc: filter === 'completed' || filter === 'missed' || filter === 'all' }]} pageSize={10} emptyTitle="No follow-ups in this view" rowClassName={(row) => (row.original.derived === 'overdue' ? 'bg-warning/5' : row.original.derived === 'missed' ? 'bg-danger/5' : undefined)}
          mobileCard={(r) => <div><div className="flex justify-between"><span className="font-semibold">{r.patientName}</span><StatusBadge kind="followUp" value={r.derived} /></div><div className="text-xs tabular-nums text-muted-foreground">{fmtDate(r.date)} · {r.time} · {labelOf(visitTypes, r.visitType)}</div><div className="mt-1 text-sm">{r.procedure}</div></div>} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Follow-up attendance" description="Derived from appointment status" icon={CalendarCheck}><SimpleBarChart data={attendance} height={200} colors={['var(--success)', 'var(--danger)', 'var(--muted-foreground)', 'var(--warning)', 'var(--cyan)']} /></SectionCard>
        <SectionCard title="Mean pain score at review" description={`Completed spinal reviews with a recorded score (n = ${painTrend.map((p) => p.n).join(' / ')})`} icon={TrendingUp}><RecoveryChart data={painTrend} series={[{ key: 'pain', name: 'Mean pain NRS', color: 'var(--chart-other)' }]} yDomain={[0, 10]} height={200} /></SectionCard>
        <SectionCard title="Documented outcomes at review" description="Completed reviews only; missed reviews have no outcome" icon={CalendarX}><SimpleBarChart data={outcomes} height={200} colors={['var(--success)', 'var(--cyan)', 'var(--danger)', 'var(--muted-foreground)']} /></SectionCard>
      </div>
    </PageTransition>
  )
}
