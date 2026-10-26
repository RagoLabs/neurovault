import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Building2, Mail, MapPin, Pencil, Phone, Plus, Scissors } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDataset, saveHospital } from '@/services/repository'
import type { Hospital } from '@/types'
import { fmtDate } from '@/utils/format'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { motion, useReducedMotion } from 'motion/react'

const empty: Omit<Hospital, 'id'> = { name: '', shortName: '', location: '', city: '', phone: '', email: '', type: 'private', theatres: 1, notes: '' }

export function HospitalsPage() {
  const d = useDataset()
  const reduce = useReducedMotion()
  const [editing, setEditing] = useState<Hospital | null | 'new'>(null)
  const stats = useMemo(() => d.hospitals.map((h) => {
    const cases = d.cases.filter((c) => c.hospitalId === h.id)
    const completed = cases.filter((c) => c.status === 'completed')
    const recent = [...cases].sort((a, b) => ((a.surgeryDate ?? a.plannedDate ?? a.createdAt) < (b.surgeryDate ?? b.plannedDate ?? b.createdAt) ? 1 : -1)).slice(0, 3)
    const patients = d.patients.filter((p) => p.hospitalId === h.id).length
    return { h, cases: cases.length, completed: completed.length, upcoming: cases.filter((c) => c.status === 'scheduled').length, recent, patients }
  }), [d])

  return (
    <PageTransition>
      <PageHeader title="Hospitals" description="Facilities where procedures are performed. All entries are fictional." actions={<Button onClick={() => setEditing('new')}><Plus /> Add hospital</Button>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div key={s.h.id} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="surface surface-hover flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy text-white dark:bg-primary/15 dark:text-primary"><Building2 className="size-5" /></div><div className="min-w-0"><h3 className="truncate font-semibold leading-tight">{s.h.name}</h3><div className="mt-0.5 flex flex-wrap gap-1.5"><Badge variant="secondary" className="capitalize">{s.h.type}</Badge><Badge variant="outline">{s.h.theatres} theatre{s.h.theatres === 1 ? '' : 's'}</Badge></div></div></div>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(s.h)} aria-label={`Edit ${s.h.name}`}><Pencil /></Button>
            </div>
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2"><MapPin className="size-3.5" /> {s.h.location}, {s.h.city}</div><br />
              <div className="inline-flex items-center gap-2"><Phone className="size-3.5" /> {s.h.phone}</div><br />
              <div className="inline-flex items-center gap-2"><Mail className="size-3.5" /> {s.h.email}</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[['Cases', s.cases], ['Completed', s.completed], ['Scheduled', s.upcoming]].map(([k, v]) => <div key={String(k)} className="rounded-lg bg-muted/60 px-2 py-2"><div className="font-data text-xl font-bold tabular-nums">{v}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div></div>)}
            </div>
            {s.h.notes && <p className="mt-3 text-xs text-muted-foreground">{s.h.notes}</p>}
            <div className="mt-4 border-t pt-3">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent activity</div>
              {s.recent.length ? <ul className="space-y-1 text-xs">{s.recent.map((c) => <li key={c.id}><Link to={`/cases/${c.id}`} className="flex items-center gap-2 hover:text-primary"><Scissors className="size-3 shrink-0 text-muted-foreground" /><span className="truncate flex-1">{c.plannedProcedure}</span><StatusBadge kind="case" value={c.status} iconOnly /><span className="font-data tabular-nums text-muted-foreground">{fmtDate(c.surgeryDate ?? c.plannedDate)}</span></Link></li>)}</ul> : <p className="text-xs text-muted-foreground">No cases yet.</p>}
            </div>
            <Link to={`/cases?hospital=${s.h.id}`} className="mt-3 text-xs font-medium text-primary hover:underline">View all cases at this hospital</Link>
          </motion.div>
        ))}
      </div>
      <HospitalDialog value={editing} onClose={() => setEditing(null)} />
    </PageTransition>
  )
}

function HospitalDialog({ value, onClose }: { value: Hospital | null | 'new'; onClose: () => void }) {
  const [f, setF] = useState<Omit<Hospital, 'id'> & { id?: string }>(value === 'new' || !value ? empty : value)
  const [err, setErr] = useState<Record<string, string>>({})
  const [key, setKey] = useState<string | null>(null)
  const current = value === 'new' ? 'new' : value?.id ?? null
  if (current !== key) { setKey(current); setF(value === 'new' || !value ? empty : value); setErr({}) }
  const up = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const save = () => {
    const e: Record<string, string> = {}
    if (f.name.trim().length < 3) e.name = 'Hospital name is required'
    if (!f.shortName.trim()) e.shortName = 'Short name is required'
    if (!f.city.trim()) e.city = 'City is required'
    if (f.theatres < 0 || !Number.isInteger(f.theatres)) e.theatres = 'Enter a whole number'
    setErr(e); if (Object.keys(e).length) return
    saveHospital({ ...f, name: f.name.trim(), shortName: f.shortName.trim() })
    toast.success(f.id ? 'Hospital updated' : 'Hospital added')
    onClose()
  }
  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{f.id ? 'Edit hospital' : 'Add hospital'}</DialogTitle><DialogDescription>Fictional facility details for the demonstration.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hospital name" required error={err.name} htmlFor="hn" className="sm:col-span-2"><Input id="hn" value={f.name} onChange={(e) => up('name', e.target.value)} /></Field>
          <Field label="Short name" required error={err.shortName} htmlFor="hs"><Input id="hs" value={f.shortName} onChange={(e) => up('shortName', e.target.value)} /></Field>
          <Field label="Type"><Select value={f.type} onValueChange={(v) => up('type', v as Hospital['type'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['teaching', 'private', 'regional', 'specialist'].map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Location / area" htmlFor="hl"><Input id="hl" value={f.location} onChange={(e) => up('location', e.target.value)} /></Field>
          <Field label="City" required error={err.city} htmlFor="hc"><Input id="hc" value={f.city} onChange={(e) => up('city', e.target.value)} /></Field>
          <Field label="Phone" htmlFor="hp"><Input id="hp" value={f.phone} onChange={(e) => up('phone', e.target.value)} /></Field>
          <Field label="Email" htmlFor="he"><Input id="he" type="email" value={f.email} onChange={(e) => up('email', e.target.value)} /></Field>
          <Field label="Operating theatres" error={err.theatres} htmlFor="ht"><Input id="ht" type="number" min={0} value={f.theatres} onChange={(e) => up('theatres', Number(e.target.value))} /></Field>
          <Field label="Notes" htmlFor="hnotes" className="sm:col-span-2"><Textarea id="hnotes" rows={2} value={f.notes ?? ''} onChange={(e) => up('notes', e.target.value)} /></Field>
        </div>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>{f.id ? 'Save changes' : 'Add hospital'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
