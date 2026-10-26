import type { DemoDataset } from '@/types'

export interface SearchResult {
  id: string
  kind: 'patient' | 'case' | 'consultation' | 'procedure' | 'page'
  title: string
  subtitle: string
  href: string
}

export function globalSearch(d: DemoDataset, query: string, limit = 12): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const out: SearchResult[] = []
  const pName = (id: string) => {
    const p = d.patients.find((x) => x.id === id)
    return p ? `${p.firstName} ${p.lastName}` : 'Unknown patient'
  }
  d.patients.forEach((p) => {
    const hay = `${p.firstName} ${p.lastName} ${p.patientNumber} ${p.primaryDiagnosis} ${p.mrn ?? ''}`.toLowerCase()
    if (hay.includes(q)) out.push({ id: p.id, kind: 'patient', title: `${p.firstName} ${p.lastName}`, subtitle: `${p.patientNumber} · ${p.primaryDiagnosis}`, href: `/patients/${p.id}` })
  })
  d.cases.forEach((c) => {
    const hay = `${c.caseNumber} ${c.diagnosis} ${c.plannedProcedure} ${pName(c.patientId)}`.toLowerCase()
    if (hay.includes(q)) out.push({ id: c.id, kind: c.plannedProcedure.toLowerCase().includes(q) ? 'procedure' : 'case', title: `${c.caseNumber} · ${pName(c.patientId)}`, subtitle: `${c.plannedProcedure} · ${c.status}`, href: `/cases/${c.id}` })
  })
  d.consultations.forEach((k) => {
    const hay = `${k.chiefComplaint} ${k.workingDiagnosis} ${pName(k.patientId)}`.toLowerCase()
    if (hay.includes(q)) out.push({ id: k.id, kind: 'consultation', title: `Consultation · ${pName(k.patientId)}`, subtitle: `${k.date} · ${k.workingDiagnosis}`, href: `/consultations/${k.id}` })
  })
  return out.slice(0, limit)
}
