import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, CalendarDays, Scissors, Stethoscope, ClipboardList, CalendarPlus } from 'lucide-react'
import { addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths, subWeeks } from 'date-fns'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useDataset } from '@/services/repository'
import { demoToday } from '@/config/demo'
import { deriveFollowUpStatus, toIso } from '@/utils/clinical'
import { fmtDate, fullName } from '@/utils/format'
import type { CalendarEvent } from '@/types'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PatientChip } from '@/components/shared/PatientChip'
import { KeyValue } from '@/components/shared/KeyValue'

const kindStyle: Record<CalendarEvent['kind'], string> = { surgery: 'bg-lavender/20 text-indigo-800 border-lavender/40 dark:text-indigo-200', 'follow-up': 'bg-teal/15 text-teal-800 border-teal/40 dark:text-teal-200', consultation: 'bg-cyan/15 text-sky-800 border-cyan/40 dark:text-sky-200', other: 'bg-muted text-foreground' }

export function CalendarPage() {
  const d = useDataset()
  const navigate = useNavigate()
  const today = demoToday()
  const [view, setView] = useState<'month' | 'week' | 'agenda'>('month')
  const [cursor, setCursor] = useState(today)
  const [selected, setSelected] = useState<CalendarEvent | null>(null)

  const events = useMemo<CalendarEvent[]>(() => {
    const pName = (id: string) => fullName(d.patients.find((p) => p.id === id))
    const ev: CalendarEvent[] = []
    d.cases.forEach((c) => {
      const date = c.surgeryDate ?? c.plannedDate
      if (!date || c.status === 'cancelled') return
      ev.push({ id: `s-${c.id}`, kind: 'surgery', date, time: c.priority === 'emergency' ? undefined : '08:00', title: `${c.plannedProcedure}`, subtitle: `${pName(c.patientId)} · ${d.hospitals.find((h) => h.id === c.hospitalId)?.shortName}`, refId: c.id, patientId: c.patientId, hospitalId: c.hospitalId, status: c.status, link: `/cases/${c.id}` })
    })
    d.followUps.forEach((f) => ev.push({ id: `f-${f.id}`, kind: 'follow-up', date: f.date, time: f.time, title: `${f.visitType.replace(/-/g, ' ')}`, subtitle: `${pName(f.patientId)} · ${d.cases.find((c) => c.id === f.caseId)?.caseNumber ?? ''}`, refId: f.id, patientId: f.patientId, hospitalId: f.hospitalId, status: deriveFollowUpStatus(f), link: `/follow-ups/${f.id}` }))
    d.consultations.forEach((k) => ev.push({ id: `c-${k.id}`, kind: 'consultation', date: k.date, time: '10:00', title: 'Consultation', subtitle: `${pName(k.patientId)} · ${k.workingDiagnosis}`, refId: k.id, patientId: k.patientId, hospitalId: k.hospitalId, status: k.status, link: `/consultations/${k.id}` }))
    return ev.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.time ?? '').localeCompare(b.time ?? '')))
  }, [d])

  const byDate = useMemo(() => { const m = new Map<string, CalendarEvent[]>(); events.forEach((e) => (m.get(e.date) ?? m.set(e.date, []).get(e.date)!).push(e)); return m }, [events])

  const monthDays = eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) })
  const weekDays = eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) })
  const agenda = useMemo(() => { const start = toIso(cursor); return events.filter((e) => e.date >= start).slice(0, 40) }, [events, cursor])

  const move = (n: number) => setCursor((c) => (view === 'month' ? (n > 0 ? addMonths(c, 1) : subMonths(c, 1)) : view === 'week' ? (n > 0 ? addWeeks(c, 1) : subWeeks(c, 1)) : addDays(c, n * 7)))

  const EventPill = ({ e, compact }: { e: CalendarEvent; compact?: boolean }) => (
    <button type="button" onClick={() => setSelected(e)} className={cn('w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] font-medium cursor-pointer hover:brightness-95', kindStyle[e.kind], e.status === 'overdue' && 'ring-1 ring-warning', e.status === 'missed' && 'line-through opacity-70')} title={`${e.title} — ${e.subtitle}`}>
      {e.time && <span className="font-data tabular-nums mr-1 opacity-70">{e.time}</span>}{compact ? e.title : `${e.title} · ${e.subtitle}`}
    </button>
  )

  return (
    <PageTransition>
      <PageHeader title="Surgical calendar" description="Surgeries, follow-up appointments and consultations in one schedule." actions={<Button asChild><Link to="/follow-ups/new"><CalendarPlus /> Schedule</Link></Button>} />
      <div className="surface">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => move(-1)} aria-label="Previous"><ChevronLeft /></Button>
            <Button variant="outline" size="icon-sm" onClick={() => move(1)} aria-label="Next"><ChevronRight /></Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(today)}>Today</Button>
            <h2 className="ml-2 text-lg font-semibold">{view === 'month' ? format(cursor, 'MMMM yyyy') : view === 'week' ? `${format(weekDays[0], 'd MMM')} – ${format(weekDays[6], 'd MMM yyyy')}` : `Agenda from ${format(cursor, 'd MMM yyyy')}`}</h2>
          </div>
          <div className="flex items-center gap-3 md:ml-auto">
            <div className="hidden items-center gap-2 text-xs sm:flex"><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-lavender" /> Surgery</span><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-teal" /> Follow-up</span><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-cyan" /> Consultation</span></div>
            <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}><TabsList><TabsTrigger value="month">Month</TabsTrigger><TabsTrigger value="week">Week</TabsTrigger><TabsTrigger value="agenda">Agenda</TabsTrigger></TabsList></Tabs>
          </div>
        </div>

        {view === 'month' && (
          <div className="grid grid-cols-7 border-b text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => <div key={w} className="py-2">{w}</div>)}</div>
        )}
        {view === 'month' && (
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const key = toIso(day)
              const list = byDate.get(key) ?? []
              const isToday = isSameDay(day, today)
              return (
                <div key={key} className={cn('min-h-24 border-b border-r p-1.5 align-top md:min-h-28', !isSameMonth(day, cursor) && 'bg-muted/30 text-muted-foreground', isToday && 'bg-primary/5')}>
                  <div className={cn('mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-medium', isToday && 'bg-primary text-primary-foreground')}>{format(day, 'd')}</div>
                  <div className="space-y-0.5">
                    {list.slice(0, 3).map((e) => <EventPill key={e.id} e={e} compact />)}
                    {list.length > 3 && <button type="button" onClick={() => { setCursor(day); setView('week') }} className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer">+{list.length - 3} more</button>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {view === 'week' && (
          <div className="grid md:grid-cols-7">
            {weekDays.map((day) => {
              const key = toIso(day)
              const list = byDate.get(key) ?? []
              const isToday = isSameDay(day, today)
              return (
                <div key={key} className={cn('min-h-40 border-b p-2 md:border-r', isToday && 'bg-primary/5')}>
                  <div className="mb-2 flex items-center gap-2 text-sm"><span className={cn('inline-flex size-7 items-center justify-center rounded-full font-semibold', isToday && 'bg-primary text-primary-foreground')}>{format(day, 'd')}</span><span className="text-muted-foreground">{format(day, 'EEE')}</span></div>
                  <div className="space-y-1">{list.length ? list.map((e) => <EventPill key={e.id} e={e} />) : <div className="text-xs text-muted-foreground">No events</div>}</div>
                </div>
              )
            })}
          </div>
        )}
        {view === 'agenda' && (
          <ul className="divide-y">
            {agenda.map((e) => (
              <li key={e.id}><button type="button" onClick={() => setSelected(e)} className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-muted/50 cursor-pointer">
                <div className="w-28 shrink-0 font-data text-sm tabular-nums"><div className={cn(e.date === toIso(today) && 'font-semibold text-primary')}>{fmtDate(e.date)}</div><div className="text-xs text-muted-foreground">{e.time ?? 'All day'}</div></div>
                <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-lg border', kindStyle[e.kind])}>{e.kind === 'surgery' ? <Scissors className="size-4" /> : e.kind === 'follow-up' ? <ClipboardList className="size-4" /> : <Stethoscope className="size-4" />}</span>
                <div className="min-w-0 flex-1"><div className="truncate font-medium capitalize">{e.title}</div><div className="truncate text-xs text-muted-foreground">{e.subtitle}</div></div>
                <Badge variant={e.status === 'overdue' ? 'warning' : e.status === 'missed' ? 'danger' : e.status === 'completed' ? 'success' : 'info'} className="capitalize">{e.status}</Badge>
              </button></li>
            ))}
            {!agenda.length && <li className="px-5 py-10 text-center text-sm text-muted-foreground">No upcoming events from this date.</li>}
          </ul>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader><SheetTitle className="capitalize">{selected.title}</SheetTitle><SheetDescription>{fmtDate(selected.date)}{selected.time ? ` · ${selected.time}` : ''} · {d.hospitals.find((h) => h.id === selected.hospitalId)?.name}</SheetDescription></SheetHeader>
              <SheetBody className="space-y-4">
                {selected.patientId && <PatientChip patientId={selected.patientId} />}
                <KeyValue columns={1} items={[{ label: 'Type', value: <span className="capitalize inline-flex items-center gap-2"><CalendarDays className="size-3.5" /> {selected.kind}</span> }, { label: 'Details', value: selected.subtitle }, { label: 'Status', value: selected.kind === 'follow-up' ? <StatusBadge kind="followUp" value={selected.status as never} /> : selected.kind === 'surgery' ? <StatusBadge kind="case" value={selected.status as never} /> : <StatusBadge kind="consultation" value={selected.status as never} /> }]} />
                <Button onClick={() => { navigate(selected.link); setSelected(null) }}>Open record</Button>
              </SheetBody>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  )
}
