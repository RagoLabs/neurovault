import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { Activity, AlertTriangle, ArrowRight, Bone, Brain, CalendarClock, HeartPulse, Scissors, Users, CalendarDays } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { StatCard } from '@/components/shared/StatCard'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityChart } from '@/components/charts/ActivityChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDataset } from '@/services/repository'
import { getDashboardStats, getProcedureDistribution, getSurgicalActivity, type ActivityRange } from '@/services/stats'
import { surgeon, brand } from '@/config/surgeon'
import { demoToday } from '@/config/demo'
import { fmtDate } from '@/utils/format'
import { deriveFollowUpStatus } from '@/utils/clinical'
import { quickActions } from '@/components/layout/QuickAdd'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { format } from 'date-fns'
import { PatientChip } from '@/components/shared/PatientChip'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { imageAssets } from '@/config/images'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  useDocumentTitle('Dashboard')
  const d = useDataset()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [range, setRange] = useState<ActivityRange>('6m')
  const stats = useMemo(() => getDashboardStats(d), [d])
  const activity = useMemo(() => getSurgicalActivity(d.cases, range), [d.cases, range])
  const distribution = useMemo(() => getProcedureDistribution(d.cases), [d.cases])
  const today = demoToday()

  const upcoming = useMemo(() => {
    return d.followUps
      .map((f) => ({ f, s: deriveFollowUpStatus(f, today) }))
      .filter((x) => x.s === 'overdue' || x.s === 'today' || x.s === 'scheduled')
      .sort((a, b) => (a.s === 'overdue' && b.s !== 'overdue' ? -1 : b.s === 'overdue' && a.s !== 'overdue' ? 1 : a.f.date < b.f.date ? -1 : a.f.date > b.f.date ? 1 : a.f.time.localeCompare(b.f.time)))
      .slice(0, 7)
  }, [d.followUps, today])

  const recent = useMemo(() => [...d.cases].filter((c) => c.status === 'completed').sort((a, b) => (a.surgeryDate! < b.surgeryDate! ? 1 : -1)).slice(0, 7), [d.cases])
  const hospital = (id: string) => d.hospitals.find((h) => h.id === id)?.shortName ?? '—'
  const caseOf = (id: string) => d.cases.find((c) => c.id === id)
  const delta = stats.proceduresThisMonth - stats.proceduresLastMonth

  return (
    <PageTransition>
      {/* Welcome header */}
      <section className="neural-bg relative mb-6 overflow-hidden rounded-2xl border bg-card p-6 md:p-8 shadow-card">
        <div className="grid-fade pointer-events-none absolute inset-0" aria-hidden />
        <img src={imageAssets.neuralMotif.src} alt="" aria-hidden className="pointer-events-none absolute -right-10 -top-10 hidden w-[520px] opacity-70 md:block dark:opacity-40" loading="eager" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Brain className="size-4" /> {brand.name} · {format(today, 'EEEE, d MMMM yyyy')}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{greeting()}, <br />{surgeon.shortName}.</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">Here is an overview of your neurosurgical practice and patient recovery.</p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {quickActions.slice(0, 5).map((a, i) => (
              <motion.div key={a.to} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <Button asChild variant={i === 0 ? 'default' : 'outline'} size="sm" className={cn(i !== 0 && 'bg-card/80 backdrop-blur')}>
                  <Link to={a.to}><a.icon /> {a.label}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key statistics">
        <StatCard index={0} label="Registered patients" value={stats.totalPatients} icon={Users} tone="cyan" trend={{ value: stats.newPatientsThisMonth, label: 'registered this month' }} href="/patients" />
        <StatCard index={1} label="Surgical procedures" value={stats.totalProcedures} icon={Scissors} tone="teal" hint={`${stats.scheduledCases} scheduled`} href="/cases" />
        <StatCard index={2} label="Brain surgeries" value={stats.brainSurgeries + stats.neurovascular + stats.other} icon={Brain} tone="lavender" hint={`${stats.brainSurgeries} cranial · ${stats.neurovascular} neurovascular · ${stats.other} other`} href="/cases?type=brain" />
        <StatCard index={3} label="Spinal surgeries" value={stats.spinalSurgeries} icon={Bone} tone="teal" hint="completed spinal procedures" href="/cases?type=spine" />
        <StatCard index={4} label="Procedures this month" value={stats.proceduresThisMonth} icon={CalendarDays} tone="cyan" trend={{ value: delta, label: `vs ${stats.proceduresLastMonth} last month` }} href="/analytics" />
        <StatCard index={5} label="Active postoperative" value={stats.activePostop} icon={HeartPulse} tone="green" hint="operated in the last 6 weeks, not yet discharged from care" href="/postoperative" />
        <StatCard index={6} label="Upcoming follow-ups" value={stats.upcomingFollowUps} icon={CalendarClock} tone="lavender" hint={`${stats.todayFollowUps} today`} href="/follow-ups" />
        <StatCard index={7} label="Overdue follow-ups" value={stats.overdueFollowUps} icon={AlertTriangle} tone={stats.overdueFollowUps ? 'red' : 'green'} hint="scheduled reviews past their date" href="/follow-ups?status=overdue" />
      </section>

      {/* Charts */}
      <section className="mb-6 grid gap-4 lg:grid-cols-5">
        <SectionCard
          className="lg:col-span-3"
          title="Surgical activity"
          description="Completed procedures over time, derived from case records"
          icon={Activity}
          action={
            <Tabs value={range} onValueChange={(v) => setRange(v as ActivityRange)}>
              <TabsList className="h-8">
                <TabsTrigger value="7d" className="h-6 px-2 text-xs">7d</TabsTrigger>
                <TabsTrigger value="30d" className="h-6 px-2 text-xs">30d</TabsTrigger>
                <TabsTrigger value="6m" className="h-6 px-2 text-xs">6m</TabsTrigger>
                <TabsTrigger value="12m" className="h-6 px-2 text-xs">12m</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          <ActivityChart data={activity} />
        </SectionCard>
        <SectionCard className="lg:col-span-2" title="Procedure distribution" description="Each completed case is counted once in its primary category" icon={Brain}>
          <DonutChart data={distribution} />
        </SectionCard>
      </section>

      {/* Lists */}
      <section className="grid gap-4 lg:grid-cols-5">
        <SectionCard
          className="lg:col-span-2"
          title="Upcoming follow-ups"
          description="Overdue reviews are listed first"
          icon={CalendarClock}
          action={<Button asChild variant="ghost" size="sm"><Link to="/follow-ups">All <ArrowRight /></Link></Button>}
          noPadding
        >
          <ul className="divide-y">
            {upcoming.map(({ f, s }) => {
              const c = caseOf(f.caseId)
              return (
                <li key={f.id} className={cn('flex items-center gap-3 px-5 py-3', s === 'overdue' && 'bg-warning/5')}>
                  <div className="min-w-0 flex-1">
                    <PatientChip patientId={f.patientId} compact />
                    <div className="mt-1 truncate text-xs text-muted-foreground">{c?.plannedProcedure ?? '—'}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-data tabular-nums font-medium">{fmtDate(f.date)} · {f.time}</span>
                      <Badge variant="outline" className="normal-case tracking-normal font-medium">{f.visitType.replace(/-/g, ' ')}</Badge>
                      <StatusBadge kind="followUp" value={s} />
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/cases/${f.caseId}`)}>Open case</Button>
                </li>
              )
            })}
            {!upcoming.length && <li className="px-5 py-8 text-center text-sm text-muted-foreground">No upcoming follow-ups.</li>}
          </ul>
        </SectionCard>
        <SectionCard
          className="lg:col-span-3"
          title="Recent surgical cases"
          description="Most recently completed procedures"
          icon={Scissors}
          action={<Button asChild variant="ghost" size="sm"><Link to="/cases">All cases <ArrowRight /></Link></Button>}
          noPadding
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Diagnosis</TableHead>
                <TableHead className="hidden xl:table-cell">Procedure</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden lg:table-cell">Hospital</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((c) => (
                <TableRow key={c.id} onClick={() => navigate(`/cases/${c.id}`)} className="cursor-pointer" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(`/cases/${c.id}`)}>
                  <TableCell className="font-medium whitespace-nowrap">{c.caseNumber}</TableCell>
                  <TableCell><PatientChip patientId={c.patientId} compact link={false} /></TableCell>
                  <TableCell className="hidden md:table-cell max-w-56 truncate" title={c.diagnosis}>{c.diagnosis}</TableCell>
                  <TableCell className="hidden xl:table-cell max-w-56 truncate" title={c.plannedProcedure}>{c.plannedProcedure}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{fmtDate(c.surgeryDate)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{hospital(c.hospitalId)}</TableCell>
                  <TableCell><StatusBadge kind="case" value={c.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      </section>
    </PageTransition>
  )
}
