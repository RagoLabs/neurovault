import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'

export function EmptyState({ icon: Icon = Inbox, title, description, action, className, compact }: { icon?: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-16 px-6', className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-primary/15 blur-xl" />
        <div className="relative flex size-14 items-center justify-center rounded-2xl border bg-card shadow-card">
          <Icon className="size-6 text-primary" />
        </div>
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground text-balance">{description}</p>}
      {action && <div className="mt-4 flex gap-2">{action}</div>}
    </div>
  )
}
