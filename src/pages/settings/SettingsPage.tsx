import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { BadgeCheck, Bell, Bone, Brain, Database, Fingerprint, KeyRound, Palette, RotateCcw, ShieldAlert, Sliders, UserRound, Download, CheckCircle2 } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionCard } from '@/components/shared/SectionCard'
import { KeyValue } from '@/components/shared/KeyValue'
import { Field } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { surgeon, brand } from '@/config/surgeon'
import { useDemoStore, STORAGE_KEY } from '@/stores/demoStore'
import { useDataset, resetDemoData } from '@/services/repository'
import { validateDataset } from '@/mock'
import { useTheme } from '@/hooks/useTheme'
import { DEMO_REFERENCE_DATE } from '@/config/demo'
import { fmtDateTime } from '@/utils/format'
import { downloadText } from '@/utils/export'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'profile'
  const prefs = useDemoStore((s) => s.preferences)
  const setPrefs = useDemoStore((s) => s.setPreferences)
  const lastReset = useDemoStore((s) => s.lastResetAt)
  const setWelcomeSeen = useDemoStore((s) => s.setWelcomeSeen)
  const d = useDataset()
  const { theme, setTheme } = useTheme()
  const [validation, setValidation] = useState<string[] | null>(null)
  const storageKb = useMemo(() => { try { return Math.round((localStorage.getItem(STORAGE_KEY)?.length ?? 0) / 1024) } catch { return 0 } }, [d])
  const counts = useMemo(() => ({ Patients: d.patients.length, Cases: d.cases.length, Consultations: d.consultations.length, Assessments: d.assessments.length, 'Operative reports': d.operativeReports.length, 'Postoperative notes': d.postopNotes.length, 'Follow-ups': d.followUps.length, Imaging: d.imaging.length, Documents: d.documents.length, Hospitals: d.hospitals.length }), [d])

  const reset = () => { resetDemoData(); setValidation(null); toast.success('Demo data restored to the original fictional dataset') }
  const exportJson = () => { downloadText(`neurovault-demo-export-${DEMO_REFERENCE_DATE}.json`, JSON.stringify(d, null, 2), 'application/json'); toast.success('Dataset exported as JSON') }

  return (
    <PageTransition>
      <PageHeader title="Settings" description="Profile, clinical preferences, templates, appearance and demo data management." />
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })} className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <TabsList className="flex h-auto w-full flex-row flex-wrap justify-start gap-1 p-1.5 lg:w-60 lg:flex-col lg:items-stretch lg:sticky lg:top-20">
          {[['profile', 'Surgeon profile', UserRound], ['professional', 'Professional information', BadgeCheck], ['clinical', 'Clinical preferences', Sliders], ['brain', 'Brain surgery templates', Brain], ['spine', 'Spinal surgery templates', Bone], ['notifications', 'Notification preferences', Bell], ['appearance', 'Appearance', Palette], ['demo', 'Demo data management', Database], ['security', 'Security information', ShieldAlert]].map(([v, l, I]) => { const Icon = I as React.ComponentType<{ className?: string }>; return <TabsTrigger key={String(v)} value={String(v)} className="justify-start gap-2"><Icon className="size-4" /> {String(l)}</TabsTrigger> })}
        </TabsList>
        <div className="min-w-0 flex-1 space-y-4">
          <TabsContent value="profile" className="mt-0">
            <SectionCard title="Surgeon profile" description="Identity is read from src/config/surgeon.ts so it can be edited without changing components." icon={UserRound}>
              <div className="flex items-center gap-4"><Avatar className="size-16 text-lg"><AvatarFallback className="bg-gradient-to-br from-teal to-cyan text-navy text-lg">{surgeon.initials}</AvatarFallback></Avatar><div><div className="text-xl font-bold">{surgeon.fullName}</div><div className="text-sm text-muted-foreground">{surgeon.credentials}</div><div className="text-sm text-muted-foreground">{surgeon.specialty}</div></div></div>
              <KeyValue className="mt-5" columns={2} items={[{ label: 'Email', value: surgeon.email }, { label: 'Phone', value: surgeon.phone }, { label: 'Practice', value: surgeon.practiceName }, { label: 'Primary hospital', value: d.hospitals.find((h) => h.id === surgeon.primaryHospitalId)?.name }, { label: 'Biography', value: surgeon.biography, span: true }]} />
              <DemoNotice className="mt-4">Profile fields are configuration in this prototype; editing them in the UI is reserved for the backend phase.</DemoNotice>
            </SectionCard>
          </TabsContent>
          <TabsContent value="professional" className="mt-0">
            <SectionCard title="Professional information" icon={BadgeCheck}>
              <KeyValue columns={2} items={[{ label: 'Registration number', value: surgeon.registrationNumber }, { label: 'Signature line', value: surgeon.signatureLine }, { label: 'Subspecialty interests', value: <ul className="flex flex-wrap gap-1.5">{surgeon.subspecialties.map((s) => <li key={s}><Badge variant="outline" className="normal-case tracking-normal font-medium">{s}</Badge></li>)}</ul>, span: true }, { label: 'Operating sites', value: <ul className="list-disc pl-4">{d.hospitals.map((h) => <li key={h.id}>{h.name}</li>)}</ul>, span: true }]} />
            </SectionCard>
          </TabsContent>
          <TabsContent value="clinical" className="mt-0">
            <SectionCard title="Clinical preferences" description="Defaults used when creating records." icon={Sliders}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Default hospital"><Select value={prefs.defaultHospitalId} onValueChange={(v) => setPrefs({ defaultHospitalId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{d.hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Default case type"><Select value={prefs.defaultCaseType} onValueChange={(v) => setPrefs({ defaultCaseType: v as typeof prefs.defaultCaseType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="brain">Brain</SelectItem><SelectItem value="spine">Spine</SelectItem><SelectItem value="combined">Combined</SelectItem></SelectContent></Select></Field>
                <Field label="Date format"><Select value={prefs.dateFormat} onValueChange={(v) => setPrefs({ dateFormat: v as typeof prefs.dateFormat })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dd MMM yyyy">26 Oct 2026</SelectItem><SelectItem value="yyyy-MM-dd">2026-10-26</SelectItem><SelectItem value="dd/MM/yyyy">26/10/2026</SelectItem></SelectContent></Select></Field>
                <Field label="Demo reference date" description="Fixed so overdue/upcoming states stay coherent"><Input readOnly value={DEMO_REFERENCE_DATE} className="bg-muted" /></Field>
              </div>
            </SectionCard>
          </TabsContent>
          <TabsContent value="brain" className="mt-0"><TemplateEditor domain="brain" /></TabsContent>
          <TabsContent value="spine" className="mt-0"><TemplateEditor domain="spine" /></TabsContent>
          <TabsContent value="notifications" className="mt-0">
            <SectionCard title="Notification preferences" description="In-app notification centre only; no email or SMS in the demo." icon={Bell}>
              <div className="space-y-3">
                {([['overdueFollowUps', 'Overdue follow-up reminders'], ['upcomingSurgery', 'Upcoming surgery alerts (3 days before)'], ['draftReports', 'Unfinalized operative report reminders'], ['dailyDigest', 'Daily digest summary']] as const).map(([k, l]) => <div key={k} className="flex items-center justify-between rounded-lg border px-4 py-3"><Label htmlFor={k}>{l}</Label><Switch id={k} checked={prefs.notifications[k]} onCheckedChange={(v) => setPrefs({ notifications: { ...prefs.notifications, [k]: v } })} /></div>)}
              </div>
            </SectionCard>
          </TabsContent>
          <TabsContent value="appearance" className="mt-0">
            <SectionCard title="Appearance" icon={Palette}>
              <div className="grid gap-3 sm:grid-cols-3">
                {(['light', 'dark', 'system'] as const).map((t) => <button key={t} type="button" onClick={() => setTheme(t)} className={cn('rounded-xl border p-4 text-left capitalize cursor-pointer transition-colors hover:border-primary/50', theme === t && 'border-primary bg-primary/5 ring-2 ring-primary/30')}><div className={cn('mb-3 h-14 rounded-lg border', t === 'dark' ? 'bg-[#080f1d]' : t === 'light' ? 'bg-[#f3f6fa]' : 'bg-gradient-to-r from-[#f3f6fa] to-[#080f1d]')} /><div className="font-medium">{t}</div></button>)}
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Display density"><Select value={prefs.density} onValueChange={(v) => setPrefs({ density: v as typeof prefs.density })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="comfortable">Comfortable</SelectItem><SelectItem value="compact">Compact</SelectItem></SelectContent></Select></Field>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border px-4 py-3"><Label htmlFor="rm">Reduce motion</Label><Switch id="rm" checked={prefs.reducedMotion} onCheckedChange={(v) => setPrefs({ reducedMotion: v })} /></div>
                  <div className="flex items-center justify-between rounded-lg border px-4 py-3"><Label htmlFor="db">Show “Demo Mode” badge in header</Label><Switch id="db" checked={prefs.showDemoBanner} onCheckedChange={(v) => setPrefs({ showDemoBanner: v })} /></div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>
          <TabsContent value="demo" className="mt-0 space-y-4">
            <SectionCard title="Demo data management" description="All records are fictional and stored in this browser's localStorage." icon={Database}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{Object.entries(counts).map(([k, v]) => <div key={k} className="rounded-lg bg-muted/60 px-3 py-2"><div className="font-data text-lg font-bold tabular-nums">{v}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div></div>)}</div>
              <KeyValue className="mt-4" columns={3} items={[{ label: 'Storage key', value: <span className="font-data">{STORAGE_KEY}</span> }, { label: 'Approximate size', value: `${storageKb} KB` }, { label: 'Last reset', value: lastReset ? fmtDateTime(lastReset) : 'Never (original dataset)' }]} />
              <div className="mt-5 flex flex-wrap gap-2">
                <ConfirmDialog trigger={<Button variant="destructive"><RotateCcw /> Reset demo data</Button>} title="Reset all demo data?" description="Every change made in this browser — new patients, cases, notes, uploads and preferences-independent records — will be replaced with the original fictional dataset. This cannot be undone." confirmLabel="Reset everything" destructive onConfirm={reset} />
                <Button variant="outline" onClick={() => { const errs = validateDataset(d); setValidation(errs); toast[errs.length ? 'error' : 'success'](errs.length ? `${errs.length} integrity issue(s) found` : 'Dataset integrity verified') }}><CheckCircle2 /> Validate relationships</Button>
                <Button variant="outline" onClick={exportJson}><Download /> Export dataset (JSON)</Button>
                <Button variant="outline" onClick={() => { setWelcomeSeen(false); toast.info('Welcome screen will show on the dashboard') }}>Show welcome &amp; tour again</Button>
              </div>
              {validation && <div className={cn('mt-4 rounded-lg border p-3 text-sm', validation.length ? 'border-danger/40 bg-danger/10' : 'border-success/40 bg-success/10')}>{validation.length ? <ul className="list-disc pl-4 font-data text-xs">{validation.map((e) => <li key={e}>{e}</li>)}</ul> : 'All references between patients, cases, reports, assessments, follow-ups, imaging and documents are consistent.'}</div>}
            </SectionCard>
            <DemoNotice tone="warning">The data layer (src/services/repository.ts) is designed to be replaced by real API calls. Nothing leaves this browser in the demo.</DemoNotice>
          </TabsContent>
          <TabsContent value="security" className="mt-0">
            <SectionCard title="Security information" description="Demonstration only — there is no authentication backend in this prototype." icon={ShieldAlert}>
              <div className="space-y-3">
                {[['Multi-factor authentication', 'Would be enforced for all clinician accounts', KeyRound], ['Session timeout', 'Automatic sign-out after inactivity', Fingerprint], ['Audit log', 'Every view and change of a patient record would be logged', ShieldAlert], ['Encryption', 'Data at rest and in transit encrypted; no data leaves the browser in this demo', Database]].map(([t, s, I]) => { const Icon = I as React.ComponentType<{ className?: string }>; return <div key={String(t)} className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"><div className="flex items-center gap-3"><Icon className="size-4 text-muted-foreground" /><div><div className="text-sm font-medium">{String(t)}</div><div className="text-xs text-muted-foreground">{String(s)}</div></div></div><Badge variant="warning">Demo only</Badge></div> })}
              </div>
              <DemoNotice tone="warning" className="mt-4">This frontend prototype makes no claims of production security. Real authentication, authorisation, audit logging and encryption will be implemented with the backend.</DemoNotice>
            </SectionCard>
          </TabsContent>
        </div>
      </Tabs>
      <p className="mt-6 text-xs text-muted-foreground">{brand.name} {brand.version}</p>
    </PageTransition>
  )
}

function TemplateEditor({ domain }: { domain: 'brain' | 'spine' }) {
  const templates = useDemoStore((s) => s.data.noteTemplates.filter((t) => t.domain === domain))
  const upsert = useDemoStore((s) => s.upsert)
  const [sel, setSel] = useState(templates[0]?.id ?? '')
  const t = templates.find((x) => x.id === sel) ?? templates[0]
  if (!t) return <SectionCard title={domain === 'brain' ? 'Brain surgery templates' : 'Spinal surgery templates'}><p className="text-sm text-muted-foreground">No templates.</p></SectionCard>
  const fields = Object.entries(t.fields) as [keyof typeof t.fields, string][]
  return (
    <SectionCard title={domain === 'brain' ? 'Brain surgery templates' : 'Spinal surgery templates'} description="Reusable note templates applied in the consultation form. Changes are saved to the demo store." icon={domain === 'brain' ? Brain : Bone} action={<Select value={t.id} onValueChange={setSel}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent>{templates.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent></Select>}>
      <div className="grid gap-4">
        {fields.map(([k, v]) => <Field key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())} htmlFor={`tpl-${k}`}><Textarea id={`tpl-${k}`} rows={2} value={v} onChange={(e) => upsert('noteTemplates', { ...t, fields: { ...t.fields, [k]: e.target.value } })} /></Field>)}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Edits apply immediately to new consultations that use this template.</p>
    </SectionCard>
  )
}
