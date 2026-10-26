import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DemoNotice({ children, className, tone = 'info' }: { children: React.ReactNode; className?: string; tone?: 'info' | 'warning' }) {
  return (
    <div className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-xs', tone === 'info' ? 'border-info/30 bg-info/10 text-sky-800 dark:text-sky-200' : 'border-warning/30 bg-warning/10 text-amber-800 dark:text-amber-200', className)}>
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
