import { cn } from '@/lib/utils'

/** Numeric clinical value shown with a label; never animated so it stays readable. */
export function ScorePill({ label, value, unit, tone = 'default', className }: { label: string; value: string | number | null | undefined; unit?: string; tone?: 'default' | 'good' | 'warn' | 'bad' | 'muted'; className?: string }) {
  const tones = {
    default: 'bg-muted text-foreground',
    good: 'bg-success/15 text-emerald-700 dark:text-emerald-300',
    warn: 'bg-warning/15 text-amber-700 dark:text-amber-300',
    bad: 'bg-danger/15 text-red-700 dark:text-red-300',
    muted: 'bg-muted text-muted-foreground',
  }
  const empty = value === null || value === undefined || value === ''
  return (
    <div className={cn('inline-flex flex-col rounded-lg px-3 py-1.5', empty ? tones.muted : tones[tone], className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</span>
      <span className="font-data text-base font-bold tabular-nums leading-tight">{empty ? 'Not recorded' : value}{!empty && unit ? <span className="ml-0.5 text-xs font-medium opacity-70">{unit}</span> : null}</span>
    </div>
  )
}
