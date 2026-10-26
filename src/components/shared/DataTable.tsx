import { useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type Row,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { EmptyState } from './EmptyState'

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  globalFilter?: string
  onRowClick?: (row: T) => void
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  initialSorting?: SortingState
  dense?: boolean
  rowClassName?: (row: Row<T>) => string | undefined
  className?: string
  /** Render a card layout for narrow screens. */
  mobileCard?: (row: T) => ReactNode
}

export function DataTable<T>({ columns, data, globalFilter = '', onRowClick, pageSize = 10, emptyTitle = 'No records', emptyDescription, emptyAction, initialSorting = [], dense, rowClassName, className, mobileCard }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize })

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    autoResetPageIndex: true,
  })

  const rows = table.getRowModel().rows
  const total = table.getFilteredRowModel().rows.length

  if (!data.length || !total) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} compact />
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {mobileCard && (
        <div className="grid gap-3 md:hidden">
          {rows.map((row) => (
            <div key={row.id} onClick={() => onRowClick?.(row.original)} className={cn('surface p-4', onRowClick && 'cursor-pointer surface-hover')}>
              {mobileCard(row.original)}
            </div>
          ))}
        </div>
      )}
      <div className={cn(mobileCard && 'hidden md:block')}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer -ml-1 px-1 rounded focus-visible:ring-2 focus-visible:ring-ring outline-none">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? <ArrowUp className="size-3" /> : sorted === 'desc' ? <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => { if (onRowClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onRowClick(row.original) } }}
                className={cn(onRowClick && 'cursor-pointer focus-visible:outline-none focus-visible:bg-muted', rowClassName?.(row))}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cn(dense && 'py-1.5')}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {total > pageSize && (
        <div className="flex flex-col gap-3 border-t px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{pagination.pageIndex * pagination.pageSize + 1}–{Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)}</span> of <span className="font-medium text-foreground">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(pagination.pageSize)} onValueChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) })}>
              <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{[10, 20, 50].map((n) => <SelectItem key={n} value={String(n)}>{n} rows</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label="First page"><ChevronsLeft /></Button>
              <Button variant="outline" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page"><ChevronLeft /></Button>
              <span className="px-2 text-xs text-muted-foreground tabular-nums">{pagination.pageIndex + 1} / {table.getPageCount()}</span>
              <Button variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page"><ChevronRight /></Button>
              <Button variant="outline" size="icon-sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} aria-label="Last page"><ChevronsRight /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
