import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function KeyValue({ items, columns = 2, className }: { items: { label: string; value: ReactNode; span?: boolean }[]; columns?: 1 | 2 | 3; className?: string }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-4', columns === 1 ? 'grid-cols-1' : columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((it) => (
        <div key={it.label} className={cn('min-w-0', it.span && 'sm:col-span-full')}>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{it.label}</dt>
          <dd className="mt-1 text-sm leading-relaxed break-words">{it.value === undefined || it.value === null || it.value === '' ? <span className="text-muted-foreground">—</span> : it.value}</dd>
        </div>
      ))}
    </dl>
  )
}
