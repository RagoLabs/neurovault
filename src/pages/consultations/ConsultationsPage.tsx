import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Stethoscope } from 'lucide-react'
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
import type { Consultation } from '@/types'

export function ConsultationsPage() {
  const d = useDataset()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const rows = useMemo(() => d.consultations.filter((c) => status === 'all' || c.status === status).map((c) => ({ ...c, patientName: fullName(d.patients.find((p) => p.id === c.patientId)) })), [d, status])

  const columns = useMemo<ColumnDef<Consultation & { patientName: string }, unknown>[]>(() => [
    { id: 'date', header: 'Date', accessorKey: 'date', cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums">{fmtDate(getValue() as string)}</span>, size: 110 },
    { id: 'patient', header: 'Patient', accessorKey: 'patientName', cell: ({ row }) => <PatientChip patientId={row.original.patientId} compact /> },
    { id: 'complaint', header: 'Chief complaint', accessorKey: 'chiefComplaint', cell: ({ getValue }) => <span className="block max-w-64 truncate font-sans">{getValue() as string}</span> },
    { id: 'dx', header: 'Working diagnosis', accessorKey: 'workingDiagnosis', cell: ({ getValue }) => <span className="block max-w-72 truncate font-sans">{getValue() as string}</span> },
    { id: 'case', header: 'Case', accessorFn: (r) => d.cases.find((c) => c.id === r.caseId)?.caseNumber ?? '', cell: ({ row }) => { const c = d.cases.find((x) => x.id === row.original.caseId); return c ? <Link to={`/cases/${c.id}`} onClick={(e) => e.stopPropagation()} className="text-primary hover:underline whitespace-nowrap">{c.caseNumber}</Link> : <span className="text-muted-foreground">—</span> } },
    { id: 'status', header: 'Status', accessorKey: 'status', cell: ({ getValue }) => <StatusBadge kind="consultation" value={getValue() as Consultation['status']} /> },
  ], [d.cases])

  return (
    <PageTransition>
      <PageHeader title="Consultations" description="Clinic consultations, drafts and the surgical cases they initiated." actions={<Button asChild><Link to="/consultations/new"><Plus /> New consultation</Link></Button>} />
      <div className="surface">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Search patient, complaint, diagnosis…" className="md:w-80" />
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36" aria-label="Status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent></Select>
        </div>
        <DataTable columns={columns} data={rows} globalFilter={q} onRowClick={(r) => navigate(`/consultations/${r.id}`)} initialSorting={[{ id: 'date', desc: true }]} emptyTitle="No consultations" emptyAction={<Button asChild><Link to="/consultations/new"><Stethoscope /> New consultation</Link></Button>}
          mobileCard={(r) => <div><div className="flex justify-between"><span className="font-semibold">{r.patientName}</span><StatusBadge kind="consultation" value={r.status} /></div><div className="text-xs text-muted-foreground">{fmtDate(r.date)}</div><div className="mt-1 text-sm">{r.workingDiagnosis}</div></div>} />
      </div>
    </PageTransition>
  )
}
