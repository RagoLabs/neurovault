import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CheckCircle2, FileText, Save, X, Sparkles } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { Field, FormSection } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PatientSelect } from '@/components/shared/PatientSelect'
import { saveConsultation, useCollection, useRecord } from '@/services/repository'
import { useDemoStore } from '@/stores/demoStore'
import { DEMO_REFERENCE_DATE } from '@/config/demo'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const draftSchema = z.object({
  patientId: z.string().min(1, 'Select a patient'),
  date: z.string().min(1, 'Consultation date is required').refine((v) => v <= DEMO_REFERENCE_DATE, 'Date cannot be in the future'),
  hospitalId: z.string().min(1, 'Select a hospital'),
  chiefComplaint: z.string().trim().min(3, 'Chief complaint is required'),
  historyOfPresentingIllness: z.string(),
  relevantMedicalHistory: z.string(),
  examinationFindings: z.string(),
  workingDiagnosis: z.string(),
  differentialDiagnosis: z.string(),
  investigationsRequested: z.string(),
  investigationFindings: z.string(),
  managementPlan: z.string(),
  followUpRecommendations: z.string(),
})
const completeSchema = draftSchema.extend({
  historyOfPresentingIllness: z.string().trim().min(10, 'History is required to complete the consultation'),
  examinationFindings: z.string().trim().min(10, 'Examination findings are required to complete the consultation'),
  workingDiagnosis: z.string().trim().min(3, 'Working diagnosis is required to complete the consultation'),
  managementPlan: z.string().trim().min(5, 'Management plan is required to complete the consultation'),
})
type Values = z.infer<typeof draftSchema>

export function ConsultationFormPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const existing = useRecord('consultations', id)
  const hospitals = useCollection('hospitals')
  const templates = useCollection('noteTemplates')
  const defaultHospital = useDemoStore((s) => s.preferences.defaultHospitalId)
  const navigate = useNavigate()
  const [mode, setMode] = useState<'draft' | 'complete'>('complete')

  const form = useForm<Values>({
    resolver: async (values, ctx, opts) => zodResolver(mode === 'draft' ? draftSchema : completeSchema)(values, ctx, opts),
    defaultValues: {
      patientId: params.get('patient') ?? '', date: DEMO_REFERENCE_DATE, hospitalId: defaultHospital, chiefComplaint: '', historyOfPresentingIllness: '', relevantMedicalHistory: '', examinationFindings: '', workingDiagnosis: '', differentialDiagnosis: '', investigationsRequested: '', investigationFindings: '', managementPlan: '', followUpRecommendations: '',
    },
  })

  useEffect(() => {
    if (existing) form.reset({ ...existing })
  }, [existing, form])

  const applyTemplate = (tplId: string) => {
    const t = templates.find((x) => x.id === tplId)
    if (!t) return
    Object.entries(t.fields).forEach(([k, v]) => {
      if (!form.getValues(k as keyof Values)) form.setValue(k as keyof Values, v as string, { shouldDirty: true })
    })
    toast.success(`Template “${t.name}” applied to empty fields`)
  }

  const submit = (status: 'draft' | 'completed') => {
    setMode(status === 'draft' ? 'draft' : 'complete')
    setTimeout(() => {
      form.handleSubmit((v) => {
        const c = saveConsultation({ ...v, id: existing?.id, status, caseId: existing?.caseId, templateId: existing?.templateId })
        toast.success(status === 'draft' ? 'Draft saved' : 'Consultation completed', { description: status === 'completed' ? 'You can now initiate a surgical case from this consultation.' : undefined })
        navigate(`/consultations/${c.id}`)
      })()
    }, 0)
  }

  const e = form.formState.errors
  const reg = form.register
  const locked = existing?.status === 'completed' && !!existing.caseId

  return (
    <PageTransition>
      <PageHeader
        title={existing ? 'Edit consultation' : 'New consultation'}
        description={locked ? 'This consultation has initiated a surgical case; edits are limited to documentation fields.' : 'Save as a draft at any time, or complete the consultation when the clinical sections are documented.'}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline"><Sparkles /> Apply note template</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Reusable templates (fill empty fields)</DropdownMenuLabel>
              {templates.map((t) => <DropdownMenuItem key={t.id} onSelect={() => applyTemplate(t.id)}><FileText /> {t.name} <span className="ml-auto text-[10px] uppercase text-muted-foreground">{t.domain}</span></DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <form onSubmit={(ev) => ev.preventDefault()} className="space-y-5 pb-24" noValidate>
        <FormSection title="Encounter" description="Patient, date and location of the consultation.">
          <Field label="Patient" required error={e.patientId?.message} htmlFor="patient">
            <Controller control={form.control} name="patientId" render={({ field }) => <PatientSelect id="patient" value={field.value} onChange={field.onChange} disabled={locked} />} />
          </Field>
          <Field label="Consultation date" htmlFor="date" required error={e.date?.message}><Input id="date" type="date" max={DEMO_REFERENCE_DATE} {...reg('date')} aria-invalid={!!e.date} /></Field>
          <Field label="Hospital / clinic" required error={e.hospitalId?.message}>
            <Controller control={form.control} name="hospitalId" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Select hospital" /></SelectTrigger><SelectContent>{hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select>} />
          </Field>
          <Field label="Chief complaint" htmlFor="cc" required error={e.chiefComplaint?.message}><Input id="cc" {...reg('chiefComplaint')} aria-invalid={!!e.chiefComplaint} /></Field>
        </FormSection>
        <FormSection title="History" description="Presenting illness and relevant background.">
          <Field label="History of presenting illness" htmlFor="hpi" required={mode === 'complete'} error={e.historyOfPresentingIllness?.message} className="md:col-span-2"><Textarea id="hpi" rows={5} {...reg('historyOfPresentingIllness')} aria-invalid={!!e.historyOfPresentingIllness} /></Field>
          <Field label="Relevant medical history" htmlFor="rmh" className="md:col-span-2"><Textarea id="rmh" rows={3} {...reg('relevantMedicalHistory')} /></Field>
        </FormSection>
        <FormSection title="Examination and diagnosis">
          <Field label="Examination findings" htmlFor="exam" required={mode === 'complete'} error={e.examinationFindings?.message} className="md:col-span-2"><Textarea id="exam" rows={5} {...reg('examinationFindings')} aria-invalid={!!e.examinationFindings} /></Field>
          <Field label="Working diagnosis" htmlFor="wd" required={mode === 'complete'} error={e.workingDiagnosis?.message}><Input id="wd" {...reg('workingDiagnosis')} aria-invalid={!!e.workingDiagnosis} /></Field>
          <Field label="Differential diagnosis" htmlFor="dd"><Input id="dd" placeholder="Separate with semicolons" {...reg('differentialDiagnosis')} /></Field>
        </FormSection>
        <FormSection title="Investigations">
          <Field label="Investigations requested" htmlFor="ir"><Textarea id="ir" rows={3} {...reg('investigationsRequested')} /></Field>
          <Field label="Investigation findings" htmlFor="if"><Textarea id="if" rows={3} {...reg('investigationFindings')} /></Field>
        </FormSection>
        <FormSection title="Plan">
          <Field label="Management plan" htmlFor="mp" required={mode === 'complete'} error={e.managementPlan?.message} className="md:col-span-2"><Textarea id="mp" rows={4} {...reg('managementPlan')} aria-invalid={!!e.managementPlan} /></Field>
          <Field label="Follow-up recommendations" htmlFor="fr" className="md:col-span-2"><Textarea id="fr" rows={2} {...reg('followUpRecommendations')} /></Field>
        </FormSection>
        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/85 backdrop-blur no-print">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-end gap-2 px-4 py-3 md:px-8">
            {Object.keys(e).length > 0 && <span className="mr-auto text-sm text-destructive">Please correct the highlighted fields.</span>}
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}><X /> Cancel</Button>
            <Button type="button" variant="outline" onClick={() => submit('draft')}><Save /> Save draft</Button>
            <Button type="button" onClick={() => submit('completed')}><CheckCircle2 /> Complete consultation</Button>
          </div>
        </div>
      </form>
    </PageTransition>
  )
}
