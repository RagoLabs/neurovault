import { Link } from 'react-router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRecord } from '@/services/repository'
import { initials } from '@/utils/format'
import { patientAge } from '@/utils/clinical'
import { cn } from '@/lib/utils'

export function PatientChip({ patientId, className, link = true, compact }: { patientId: string; className?: string; link?: boolean; compact?: boolean }) {
  const p = useRecord('patients', patientId)
  if (!p) return <span className="text-muted-foreground">Unknown patient</span>
  const content = (
    <span className={cn('inline-flex items-center gap-2 min-w-0', className)}>
      <Avatar className={compact ? 'size-7' : 'size-8'}>
        <AvatarFallback className={cn(p.sex === 'female' ? 'bg-lavender/20 text-indigo-700 dark:text-indigo-300' : 'bg-cyan/20 text-sky-700 dark:text-sky-300')}>{initials(p.firstName, p.lastName)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium leading-tight">{p.firstName} {p.lastName}</span>
        {!compact && <span className="block truncate font-data text-xs text-muted-foreground">{p.patientNumber} · {patientAge(p)} y · {p.sex === 'male' ? 'M' : 'F'}</span>}
      </span>
    </span>
  )
  return link ? <Link to={`/patients/${p.id}`} onClick={(e) => e.stopPropagation()} className="rounded-md outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{content}</Link> : content
}
