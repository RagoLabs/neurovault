import { useNavigate } from 'react-router'
import { Activity, Brain, ClipboardPlus, FileBarChart, Plus, Stethoscope, UserPlus } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export const quickActions = [
  { label: 'Register patient', to: '/patients/new', icon: UserPlus, description: 'Add a new patient record' },
  { label: 'New consultation', to: '/consultations/new', icon: Stethoscope, description: 'Document a clinic consultation' },
  { label: 'Create surgical case', to: '/cases/new', icon: Brain, description: 'Start the case wizard' },
  { label: 'Record follow-up', to: '/follow-ups/new', icon: ClipboardPlus, description: 'Schedule or record a review' },
  { label: 'Neurological assessment', to: '/assessments/new', icon: Activity, description: 'Record GCS, motor and sensory findings' },
  { label: 'Generate report', to: '/analytics/logbook', icon: FileBarChart, description: 'Surgical logbook and exports' },
]

export function QuickAdd() {
  const navigate = useNavigate()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5" aria-label="Quick add">
          <Plus className="size-4" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {quickActions.map((a) => (
          <DropdownMenuItem key={a.to} onSelect={() => navigate(a.to)}>
            <a.icon />
            <div>
              <div>{a.label}</div>
              <div className="text-[11px] text-muted-foreground">{a.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
