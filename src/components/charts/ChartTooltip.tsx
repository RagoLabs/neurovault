import type { ReactNode } from 'react'

export function ChartTooltipBox({ title, rows }: { title: ReactNode; rows: { label: string; value: ReactNode; color?: string }[] }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-pop min-w-36">
      <div className="mb-1 font-semibold">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 py-0.5">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            {r.color && <span className="size-2 rounded-full" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className="font-data font-semibold tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

export const axisProps = {
  tick: { fontSize: 11, fill: 'var(--muted-foreground)' },
  axisLine: false as const,
  tickLine: false as const,
}

export const gridProps = { stroke: 'var(--border)', strokeDasharray: '3 3', vertical: false }
