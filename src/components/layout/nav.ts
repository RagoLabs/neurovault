import { Activity, BarChart3, Bone, Brain, Building2, CalendarDays, ClipboardList, FileText, FolderOpen, HeartPulse, LayoutDashboard, ScanLine, Settings, Stethoscope, Users, CalendarClock } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Clinical management',
    items: [
      { label: 'Patients', to: '/patients', icon: Users },
      { label: 'Consultations', to: '/consultations', icon: Stethoscope },
      { label: 'Neurological Assessments', to: '/assessments', icon: Activity },
      { label: 'Imaging & Investigations', to: '/imaging', icon: ScanLine },
    ],
  },
  {
    label: 'Surgical management',
    items: [
      { label: 'Neurosurgical Cases', to: '/cases', icon: Brain },
      { label: 'Operative Reports', to: '/operative-reports', icon: FileText },
      { label: 'Postoperative Care', to: '/postoperative', icon: HeartPulse },
      { label: 'Follow-ups', to: '/follow-ups', icon: ClipboardList },
      { label: 'Surgical Calendar', to: '/calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Anatomy Explorer', to: '/anatomy', icon: Bone },
      { label: 'Analytics & Reports', to: '/analytics', icon: BarChart3 },
      { label: 'Documents', to: '/documents', icon: FolderOpen },
      { label: 'Hospitals', to: '/hospitals', icon: Building2 },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
]

export const allNavItems = navGroups.flatMap((g) => g.items)

/** Breadcrumb labels for route segments. */
export const segmentLabels: Record<string, string> = {
  patients: 'Patients',
  consultations: 'Consultations',
  assessments: 'Neurological Assessments',
  imaging: 'Imaging & Investigations',
  cases: 'Neurosurgical Cases',
  'operative-reports': 'Operative Reports',
  postoperative: 'Postoperative Care',
  'follow-ups': 'Follow-ups',
  calendar: 'Surgical Calendar',
  anatomy: 'Anatomy Explorer',
  analytics: 'Analytics & Reports',
  documents: 'Documents',
  hospitals: 'Hospitals',
  settings: 'Settings',
  new: 'New',
  edit: 'Edit',
  compare: 'Compare',
  logbook: 'Surgical Logbook',
  reports: 'Reports',
}

export { CalendarClock }
