import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { HeartPulse } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PatientChip } from '@/components/shared/PatientChip'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDataset } from '@/services/repository'
import { fmtDate, fullName } from '@/utils/format'
import type { SurgicalCase, PostopNote } from '@/types'
import { differenceInCalendarDays } from 'date-fns'
import { demoToday } from '@/config/demo'
import { StatCard } from '@/components/shared/StatCard'
import { BedDouble, CheckCircle2, AlertTriangle } from 'lucide-react'

type Row = { c: SurgicalCase; patientName: string; notes: PostopNote[]; latest?: PostopNote; status: 'inpatient' | 'discharged' | 'no-notes'; day: number }

export function PostoperativePage() {
  const d = useDataset()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'inpatient' | 'discharged' | 'no-notes'>('all')
  const today = demoToday()

  const rows = useMemo<Row[]>(() => d.cases.filter((c) => c.status === 'completed').map((c) => {
    const notes = d.postopNotes.filter((n) => n.caseId === c.id).sort((a, b) => a.postopDay - b.postopDay)
    const latest = notes.at(-1)
    const status: Row['status'] = !notes.length ? 'no-notes' : latest!.dischargeStatus === 'inpatient' ? 'inpatient' : 'discharged'
    return { c, patientName: fullName(d.patients.find((p) => p.id === c.patientId)), notes, latest, status, day: differenceInCalendarDays(today, new Date(`${c.surgeryDate}T00:00:00`)) }
  }).filter((r) => filter === 'all' || r.status === filter).sort((a, b) => (a.c.surgeryDate! < b.c.surgeryDate! ? 1 : -1)), [d, filter, today])

  const counts = useMemo(() => ({ inpatient: rows.filter((r) => r.status === 'inpatient').length, discharged: d.postopNotes.filter((n) => n.dischargeStatus === 'discharged').length, concern: rows.filter((r) => r.latest && (r.latest.clinicalCondition === 'concern' || r.latest.clinicalCondition === 'critical')).length }), [rows, d.postopNotes])

  const columns = useMemo<ColumnDef<Row, unknown>[]>(() => [
    { id: 'case', header: 'Case', accessorFn: (r) => r.c.caseNumber, cell: ({ row }) => <span className="font-semibold whitespace-nowrap">{row.original.c.caseNumber}</span> },
    { id: 'patient', header: 'Patient', accessorKey: 'patientName', cell: ({ row }) => <PatientChip patientId={row.original.c.patientId} compact /> },
    { id: 'proc', header: 'Procedure', accessorFn: (r) => r.c.plannedProcedure, cell: ({ getValue }) => <span className="block max-w-72 truncate font-sans">{getValue() as string}</span> },
    { id: 'date', header: 'Surgery', accessorFn: (r) => r.c.surgeryDate, cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums">{fmtDate(getValue() as string)}</span> },
    { id: 'day', header: 'Post-op day', accessorKey: 'day', cell: ({ getValue }) => <span className="tabular-nums">D{getValue() as number}</span>, size: 90 },
    { id: 'notes', header: 'Notes', accessorFn: (r) => r.notes.length, cell: ({ getValue }) => <span className="tabular-nums">{getValue() as number}</span>, size: 70 },
    { id: 'condition', header: 'Latest condition', accessorFn: (r) => r.latest?.clinicalCondition ?? '', cell: ({ row }) => row.original.latest ? <Badge variant={row.original.latest.clinicalCondition === 'critical' ? 'danger' : row.original.latest.clinicalCondition === 'concern' ? 'warning' : row.original.latest.clinicalCondition === 'improving' ? 'info' : 'success'}>{row.original.latest.clinicalCondition}</Badge> : <span className="text-muted-foreground">—</span> },
    { id: 'status', header: 'Discharge', accessorKey: 'status', cell: ({ getValue }) => { const s = getValue() as Row['status']; return s === 'inpatient' ? <Badge variant="info"><BedDouble className="size-3" /> Inpatient</Badge> : s === 'discharged' ? <Badge variant="success"><CheckCircle2 className="size-3" /> Discharged</Badge> : <Badge variant="secondary">No notes</Badge> } },
    { id: 'outcome', header: 'Outcome', accessorFn: (r) => r.c.outcome ?? 'unknown', cell: ({ row }) => <StatusBadge kind="outcome" value={row.original.c.outcome ?? 'unknown'} /> },
  ], [])

  return (
    <PageTransition>
      <PageHeader title="Postoperative care" description="Progress notes, discharge summaries and current inpatient status for completed procedures." />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Current inpatients" value={counts.inpatient} icon={BedDouble} tone="cyan" hint="latest note not yet discharged" />
        <StatCard index={1} label="Discharged" value={counts.discharged} icon={CheckCircle2} tone="green" hint="documented discharges" />
        <StatCard index={2} label="Flagged concern" value={counts.concern} icon={AlertTriangle} tone={counts.concern ? 'amber' : 'green'} hint="latest note marked concern or critical" />
      </div>
      <div className="surface">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}><TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="inpatient">Inpatient</TabsTrigger><TabsTrigger value="discharged">Discharged</TabsTrigger><TabsTrigger value="no-notes">No notes</TabsTrigger></TabsList></Tabs>
          <SearchInput value={q} onChange={setQ} placeholder="Search case, patient, procedure…" className="md:ml-auto md:w-80" />
        </div>
        <DataTable columns={columns} data={rows} globalFilter={q} onRowClick={(r) => navigate(`/postoperative/${r.c.id}`)} emptyTitle="No postoperative cases" pageSize={15}
          mobileCard={(r) => <div><div className="flex justify-between"><span className="font-semibold">{r.c.caseNumber}</span><span className="text-xs tabular-nums">D{r.day}</span></div><div className="text-sm">{r.patientName}</div><div className="mt-1 text-xs text-muted-foreground">{r.c.plannedProcedure}</div></div>} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1"><HeartPulse className="size-3.5" /> Post-op day is counted from the surgery date to the demo reference date.</p>
    </PageTransition>
  )
}
