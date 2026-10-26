import type { CaseStatus, ClinicalOutcome, ConsultationStatus, Priority, ReportStatus, CaseType, ProcedureCategory } from '@/types'
import type { DerivedFollowUpStatus, CaseFollowUpStatus } from '@/utils/clinical'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Ban, CalendarClock, CheckCircle2, CircleDashed, CircleDot, Clock, FileCheck, FilePen, FileSignature, HelpCircle, Minus, PauseCircle, TrendingDown, TrendingUp, XCircle, Brain, Bone, Activity, Sparkles, Siren, Zap } from 'lucide-react'
import type { ReactNode } from 'react'

type V = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info' | 'lavender' | 'navy'

const map = {
  case: {
    planned: ['secondary', 'Planned', CircleDashed],
    scheduled: ['info', 'Scheduled', CalendarClock],
    completed: ['success', 'Completed', CheckCircle2],
    postponed: ['warning', 'Postponed', PauseCircle],
    cancelled: ['danger', 'Cancelled', Ban],
  },
  followUp: {
    scheduled: ['info', 'Scheduled', CalendarClock],
    today: ['lavender', 'Today', CircleDot],
    completed: ['success', 'Completed', CheckCircle2],
    missed: ['danger', 'Missed', XCircle],
    cancelled: ['secondary', 'Cancelled', Ban],
    overdue: ['warning', 'Overdue', AlertTriangle],
  },
  caseFollowUp: {
    'up-to-date': ['success', 'Up to date', CheckCircle2],
    due: ['info', 'Review due', Clock],
    overdue: ['warning', 'Overdue', AlertTriangle],
    missed: ['danger', 'Missed', XCircle],
    none: ['secondary', 'No follow-up', Minus],
    completed: ['success', 'Completed', CheckCircle2],
  },
  outcome: {
    improved: ['success', 'Improved', TrendingUp],
    stable: ['info', 'Stable', Minus],
    deteriorated: ['danger', 'Deteriorated', TrendingDown],
    deceased: ['navy', 'Deceased', Minus],
    unknown: ['secondary', 'Unknown', HelpCircle],
  },
  report: {
    draft: ['warning', 'Draft', FilePen],
    finalized: ['success', 'Finalized', FileCheck],
    amended: ['lavender', 'Amended', FileSignature],
  },
  consultation: {
    draft: ['warning', 'Draft', FilePen],
    completed: ['success', 'Completed', CheckCircle2],
  },
  priority: {
    elective: ['secondary', 'Elective', Clock],
    urgent: ['warning', 'Urgent', Zap],
    emergency: ['danger', 'Emergency', Siren],
  },
  caseType: {
    brain: ['lavender', 'Brain', Brain],
    spine: ['default', 'Spine', Bone],
    combined: ['info', 'Combined', Sparkles],
  },
  category: {
    brain: ['lavender', 'Brain', Brain],
    spine: ['default', 'Spine', Bone],
    neurovascular: ['info', 'Neurovascular', Activity],
    other: ['warning', 'Other', Sparkles],
  },
} as const

type Kind = keyof typeof map

type ValueFor<K extends Kind> = K extends 'case' ? CaseStatus : K extends 'followUp' ? DerivedFollowUpStatus : K extends 'caseFollowUp' ? CaseFollowUpStatus : K extends 'outcome' ? ClinicalOutcome : K extends 'report' ? ReportStatus : K extends 'consultation' ? ConsultationStatus : K extends 'priority' ? Priority : K extends 'caseType' ? CaseType : ProcedureCategory

export function StatusBadge<K extends Kind>({ kind, value, className, iconOnly }: { kind: K; value: ValueFor<K> | undefined; className?: string; iconOnly?: boolean }): ReactNode {
  if (!value) return <Badge variant="secondary" className={className}>—</Badge>
  const entry = (map[kind] as Record<string, readonly [V, string, React.ComponentType<{ className?: string }>]>)[value]
  if (!entry) return <Badge variant="secondary" className={className}>{String(value)}</Badge>
  const [variant, label, Icon] = entry
  return (
    <Badge variant={variant} className={className} title={label}>
      <Icon className="size-3" aria-hidden />
      {!iconOnly && label}
      {iconOnly && <span className="sr-only">{label}</span>}
    </Badge>
  )
}
