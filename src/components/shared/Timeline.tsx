import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { fmtDate } from '@/utils/format'
import type { ReactNode } from 'react'

export interface TimelineEvent {
  id: string
  date: string
  title: string
  description?: ReactNode
  icon: React.ComponentType<{ className?: string }>
  tone?: 'teal' | 'cyan' | 'lavender' | 'amber' | 'red' | 'green' | 'slate'
  href?: string
  badge?: ReactNode
}

const tones = {
  teal: 'bg-teal text-white',
  cyan: 'bg-cyan text-navy',
  lavender: 'bg-lavender text-white',
  amber: 'bg-warning text-navy',
  red: 'bg-danger text-white',
  green: 'bg-success text-white',
  slate: 'bg-muted-foreground text-white',
}

export function Timeline({ events, className }: { events: TimelineEvent[]; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <ol className={cn('relative ml-3 border-l-2 border-border/80 pl-7', className)}>
      {events.map((ev, i) => {
        const Icon = ev.icon
        const inner = (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <time className="font-data text-xs font-medium text-muted-foreground tabular-nums">{fmtDate(ev.date)}</time>
              {ev.badge}
            </div>
            <div className="mt-0.5 text-sm font-semibold">{ev.title}</div>
            {ev.description && <div className="mt-0.5 text-sm text-muted-foreground">{ev.description}</div>}
          </>
        )
        return (
          <motion.li
            key={ev.id}
            initial={reduce ? false : { opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.3 }}
            className="relative pb-7 last:pb-0"
          >
            <span className={cn('absolute -left-[2.45rem] top-0 flex size-7 items-center justify-center rounded-full ring-4 ring-background', tones[ev.tone ?? 'teal'])}>
              <Icon className="size-3.5" />
            </span>
            {ev.href ? (
              <Link to={ev.href} className="block -m-2 rounded-lg p-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{inner}</Link>
            ) : (
              <div>{inner}</div>
            )}
          </motion.li>
        )
      })}
    </ol>
  )
}
