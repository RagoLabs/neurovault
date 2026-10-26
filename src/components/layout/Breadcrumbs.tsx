import { Link, useLocation } from 'react-router'
import { ChevronRight, Home } from 'lucide-react'
import { segmentLabels } from './nav'
import { useDataset } from '@/services/repository'
import { fullName } from '@/utils/format'

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const d = useDataset()
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = parts.map((seg, i) => {
    const href = '/' + parts.slice(0, i + 1).join('/')
    let label = segmentLabels[seg] ?? seg
    const parent = parts[i - 1]
    if (parent === 'patients') label = fullName(d.patients.find((p) => p.id === seg)) 
    else if (parent === 'cases') label = d.cases.find((c) => c.id === seg)?.caseNumber ?? label
    else if (parent === 'consultations') label = d.consultations.find((c) => c.id === seg) ? 'Consultation' : label
    else if (parent === 'operative-reports') label = d.operativeReports.find((r) => r.id === seg) ? 'Report' : label
    else if (parent === 'assessments') label = d.assessments.find((a) => a.id === seg) ? 'Assessment' : label
    else if (parent === 'hospitals') label = d.hospitals.find((h) => h.id === seg)?.shortName ?? label
    else if (parent === 'postoperative') label = d.cases.find((c) => c.id === seg)?.caseNumber ?? label
    else if (parent === 'follow-ups') label = d.followUps.find((f) => f.id === seg) ? 'Follow-up' : label
    return { href, label, last: i === parts.length - 1 }
  })
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-xs text-muted-foreground md:flex">
      <Link to="/" className="inline-flex items-center gap-1 rounded hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"><Home className="size-3.5" /></Link>
      {crumbs.map((c) => (
        <span key={c.href} className="inline-flex items-center gap-1 min-w-0">
          <ChevronRight className="size-3 shrink-0 opacity-60" />
          {c.last ? <span className="truncate font-medium text-foreground max-w-48" aria-current="page">{c.label}</span> : <Link to={c.href} className="truncate rounded hover:text-foreground max-w-40 outline-none focus-visible:ring-2 focus-visible:ring-ring">{c.label}</Link>}
        </span>
      ))}
    </nav>
  )
}
