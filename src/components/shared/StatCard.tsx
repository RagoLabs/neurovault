import { motion, useReducedMotion } from 'motion/react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from 'react-router'

export function StatCard({ label, value, icon: Icon, hint, trend, tone = 'teal', index = 0, href }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; hint?: string; trend?: { value: number; label: string }; tone?: 'teal' | 'cyan' | 'lavender' | 'amber' | 'red' | 'green'; index?: number; href?: string }) {
  const reduce = useReducedMotion()
  const tones = {
    teal: 'bg-teal/12 text-teal',
    cyan: 'bg-cyan/12 text-sky-600 dark:text-cyan',
    lavender: 'bg-lavender/15 text-indigo-600 dark:text-lavender',
    amber: 'bg-warning/15 text-amber-600 dark:text-warning',
    red: 'bg-danger/12 text-red-600 dark:text-danger',
    green: 'bg-success/12 text-emerald-600 dark:text-success',
  }
  const TrendIcon = trend ? (trend.value > 0 ? ArrowUpRight : trend.value < 0 ? ArrowDownRight : Minus) : null
  const body = (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, duration: 0.35, ease: 'easeOut' }}
      className="surface surface-hover group relative h-full overflow-hidden p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-data text-3xl font-bold tabular-nums leading-none">{value}</p>
        </div>
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110', tones[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground min-h-4">
        {trend && TrendIcon && (
          <span className={cn('inline-flex items-center gap-0.5 font-semibold', trend.value > 0 ? 'text-emerald-600 dark:text-success' : trend.value < 0 ? 'text-red-600 dark:text-danger' : 'text-muted-foreground')}>
            <TrendIcon className="size-3.5" />
            {trend.value > 0 ? '+' : ''}
            {trend.value}
          </span>
        )}
        <span className="truncate">{trend?.label ?? hint}</span>
      </div>
    </motion.div>
  )
  return href ? <Link to={href} className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">{body}</Link> : body
}
