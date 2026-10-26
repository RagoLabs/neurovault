import { Activity, Brain, ClipboardList, FileBarChart, HeartPulse, Users, Compass, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDemoStore } from '@/stores/demoStore'
import { brand, surgeon } from '@/config/surgeon'
import { Logo } from './Logo'

const features = [
  { icon: Users, label: 'Patient clinical management' },
  { icon: Brain, label: 'Brain and spinal surgery documentation' },
  { icon: Activity, label: 'Neurological assessments and recovery comparison' },
  { icon: HeartPulse, label: 'Postoperative care and follow-up' },
  { icon: ClipboardList, label: 'Clinical outcome monitoring' },
  { icon: FileBarChart, label: 'Surgical reporting, logbook and exports' },
]

export function WelcomeDialog() {
  const seen = useDemoStore((s) => s.welcomeSeen)
  const setSeen = useDemoStore((s) => s.setWelcomeSeen)
  const setTourStep = useDemoStore((s) => s.setTourStep)
  return (
    <Dialog open={!seen} onOpenChange={(o) => !o && setSeen(true)}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" hideClose>
        <div className="neural-bg relative border-b px-8 pt-8 pb-6">
          <div className="grid-fade absolute inset-0 opacity-60" aria-hidden />
          <div className="relative flex items-center gap-4">
            <Logo className="size-12" />
            <div>
              <DialogHeader>
                <DialogTitle className="text-2xl">Welcome to {brand.name}</DialogTitle>
                <DialogDescription className="text-sm">A personal neurosurgery clinical management system, custom-built for {surgeon.fullName}.</DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>
        <div className="px-8 py-6">
          <p className="text-sm text-muted-foreground">This frontend demonstration uses <strong className="text-foreground">entirely fictional clinical data</strong>. No real patients, no backend, no authentication. Changes you make are kept in this browser and can be reset at any time from Settings.</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <f.icon className="size-4 text-primary shrink-0" />
                {f.label}
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <div className="font-semibold">Suggested demo journey</div>
            <div className="mt-1 text-muted-foreground">Dashboard → open <em>Amina Kessy</em> (right frontal glioma) → consultation → neurological examination → surgical case → operative report → postoperative notes → follow-ups → recovery comparison → surgical logbook.</div>
          </div>
        </div>
        <DialogFooter className="border-t px-8 py-4 sm:justify-between">
          <Button variant="ghost" onClick={() => setSeen(true)}>Explore on my own</Button>
          <Button onClick={() => { setSeen(true); setTourStep(0) }}><Compass /> Start guided tour <ArrowRight /></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
