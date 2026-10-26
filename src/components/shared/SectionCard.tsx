import type { ReactNode } from 'react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function SectionCard({ title, description, icon: Icon, action, children, className, contentClassName, noPadding }: { title: ReactNode; description?: ReactNode; icon?: React.ComponentType<{ className?: string }>; action?: ReactNode; children: ReactNode; className?: string; contentClassName?: string; noPadding?: boolean }) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary"><Icon className="size-4" /></div>}
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className={cn(noPadding && 'p-0', contentClassName)}>{children}</CardContent>
    </Card>
  )
}
