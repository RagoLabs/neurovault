import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useDemoStore } from '@/stores/demoStore'

const steps = [
  { route: '/', title: 'Surgeon dashboard', body: 'Live statistics, surgical activity, procedure distribution, upcoming follow-ups and recent cases — all computed from the same fictional dataset.' },
  { route: '/patients/pt-001', title: 'Patient profile', body: 'Amina Kessy’s record: summary header, clinical timeline and tabs for consultations, cases, assessments, imaging, follow-ups and documents.' },
  { route: '/cases/case-006', title: 'Surgical case', body: 'Brain-specific clinical details, GCS, grading systems, linked operative report, postoperative notes and follow-up status in one place.' },
  { route: '/assessments/compare?patient=pt-001', title: 'Neurological comparison', body: 'Compare baseline, postoperative and follow-up examinations side by side. Missing data is shown as missing — never as improvement.' },
  { route: '/anatomy', title: 'Anatomy explorer', body: 'An educational map of brain regions and spinal levels linking to the procedures and mock cases associated with each.' },
  { route: '/analytics/logbook', title: 'Surgical logbook', body: 'A printable, exportable logbook (PDF, CSV, Excel) with clearly defined, data-derived statistics and a de-identified option.' },
]

export function DemoTour() {
  const step = useDemoStore((s) => s.tourStep)
  const setStep = useDemoStore((s) => s.setTourStep)
  const navigate = useNavigate()

  useEffect(() => {
    if (step !== null && steps[step]) navigate(steps[step].route)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  if (step === null) return null
  const s = steps[step]
  const last = step === steps.length - 1
  return (
    <AnimatePresence>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border bg-card p-5 shadow-pop no-print"
        role="dialog"
        aria-label="Guided demo tour"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Guided tour · step {step + 1} of {steps.length}</div>
            <h3 className="mt-1 text-base font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setStep(null)} aria-label="End tour"><X /></Button>
        </div>
        <Progress value={((step + 1) / steps.length) * 100} className="mt-4 h-1.5" />
        <div className="mt-4 flex justify-between">
          <Button variant="outline" size="sm" onClick={() => setStep(step - 1)} disabled={step === 0}><ArrowLeft /> Back</Button>
          {last ? <Button size="sm" onClick={() => setStep(null)}>Finish</Button> : <Button size="sm" onClick={() => setStep(step + 1)}>Next <ArrowRight /></Button>}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
