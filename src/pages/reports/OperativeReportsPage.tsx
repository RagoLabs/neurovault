import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { FileText, Plus } from 'lucide-react'
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
import type { OperativeReport, SurgicalCase } from '@/types'
import { Badge } from '@/components/ui/badge'

type Row = OperativeReport & { c: SurgicalCase; patientName: string }

export function OperativeReportsPage() {
  const d = useDataset()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const rows = useMemo<Row[]>(() => d.operativeReports.filter((r) => status === 'all' || r.status === status).map((r) => ({ ...r, c: d.cases.find((c) => c.id === r.caseId)!, patientName: fullName(d.patients.find((p) => p.id === d.cases.find((c) => c.id === r.caseId)?.patientId)) })).filter((r) => r.c), [d, status])
  const missing = useMemo(() => d.cases.filter((c) => c.status === 'completed' && !d.operativeReports.some((r) => r.caseId === c.id)), [d])

  const columns = useMemo<ColumnDef<Row, unknown>[]>(() => [
    { id: 'case', header: 'Case', accessorFn: (r) => r.c.caseNumber, cell: ({ row }) => <span className="font-semibold whitespace-nowrap">{row.original.c.caseNumber}</span> },
    { id: 'patient', header: 'Patient', accessorKey: 'patientName', cell: ({ row }) => <PatientChip patientId={row.original.c.patientId} compact /> },
    { id: 'proc', header: 'Procedure', accessorKey: 'procedurePerformed', cell: ({ getValue }) => <span className="block max-w-80 truncate font-sans" title={getValue() as string}>{getValue() as string}</span> },
    { id: 'type', header: 'Type', accessorFn: (r) => r.c.type, cell: ({ row }) => <StatusBadge kind="caseType" value={row.original.c.type} /> },
    { id: 'date', header: 'Surgery', accessorFn: (r) => r.c.surgeryDate ?? '', cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums">{fmtDate(getValue() as string)}</span> },
    { id: 'version', header: 'Version', accessorKey: 'version', cell: ({ getValue }) => <span className="tabular-nums">v{getValue() as number}</span>, size: 70 },
    { id: 'status', header: 'Status', accessorKey: 'status', cell: ({ getValue }) => <StatusBadge kind="report" value={getValue() as OperativeReport['status']} /> },
    { id: 'updated', header: 'Updated', accessorKey: 'updatedAt', cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums text-muted-foreground">{fmtDate(getValue() as string)}</span> },
  ], [])

  return (
    <PageTransition>
      <PageHeader title="Operative reports" description={`${d.operativeReports.length} reports · ${d.operativeReports.filter((r) => r.status === 'draft').length} drafts`} actions={missing.length > 0 && <Button asChild><Link to={`/operative-reports/new?case=${missing[0].id}`}><Plus /> New report</Link></Button>} />
      {missing.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <FileText className="size-4" /> <span className="font-medium">{missing.length} completed case{missing.length > 1 ? 's' : ''} without an operative report:</span>
          {missing.map((c) => <Link key={c.id} to={`/operative-reports/new?case=${c.id}`} className="underline underline-offset-2 hover:text-primary">{c.caseNumber}</Link>)}
        </div>
      )}
      <div className="surface">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Search case, patient, procedure…" className="md:w-80" />
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40" aria-label="Status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="finalized">Finalized</SelectItem><SelectItem value="amended">Amended</SelectItem></SelectContent></Select>
          <Badge variant="outline" className="normal-case tracking-normal font-medium md:ml-auto">Finalized reports are locked; changes create a tracked amendment</Badge>
        </div>
        <DataTable columns={columns} data={rows} globalFilter={q} onRowClick={(r) => navigate(`/operative-reports/${r.id}`)} initialSorting={[{ id: 'date', desc: true }]} emptyTitle="No reports"
          mobileCard={(r) => <div><div className="flex justify-between"><span className="font-semibold">{r.c.caseNumber}</span><StatusBadge kind="report" value={r.status} /></div><div className="text-sm">{r.patientName}</div><div className="mt-1 text-sm text-muted-foreground">{r.procedurePerformed}</div></div>} />
      </div>
    </PageTransition>
  )
}
