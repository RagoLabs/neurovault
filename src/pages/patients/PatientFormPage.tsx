import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Save, X } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { Field, FormSection } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { createPatient, updatePatient, useCollection, useRecord } from '@/services/repository'
import { useDemoStore } from '@/stores/demoStore'
import { DEMO_REFERENCE_DATE } from '@/config/demo'

const schema = z.object({
  firstName: z.string().trim().min(2, 'First name is required (min 2 characters)'),
  lastName: z.string().trim().min(2, 'Last name is required (min 2 characters)'),
  dateOfBirth: z.string().min(1, 'Date of birth is required').refine((v) => v <= DEMO_REFERENCE_DATE, 'Date of birth cannot be in the future'),
  sex: z.enum(['male', 'female']),
  phone: z.string().trim().min(7, 'Enter a valid contact number'),
  email: z.string().trim().email('Enter a valid email').or(z.literal('')),
  address: z.string().trim().min(3, 'Address is required'),
  ecName: z.string().trim().min(2, 'Emergency contact name is required'),
  ecRelationship: z.string().trim().min(2, 'Relationship is required'),
  ecPhone: z.string().trim().min(7, 'Enter a valid contact number'),
  medicalHistory: z.string(),
  previousSurgeries: z.string(),
  medications: z.string(),
  allergies: z.string(),
  comorbidities: z.string(),
  primaryDiagnosis: z.string().trim().min(3, 'Primary diagnosis or referral reason is required'),
  mrn: z.string().trim(),
  hospitalId: z.string().min(1, 'Select a hospital'),
  status: z.enum(['active', 'inactive']),
})
type Values = z.infer<typeof schema>

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)

export function PatientFormPage() {
  const { id } = useParams()
  const existing = useRecord('patients', id)
  const hospitals = useCollection('hospitals')
  const defaultHospital = useDemoStore((s) => s.preferences.defaultHospitalId)
  const navigate = useNavigate()
  const editing = !!id

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', dateOfBirth: '', sex: 'female', phone: '+255 ', email: '', address: '', ecName: '', ecRelationship: '', ecPhone: '+255 ',
      medicalHistory: '', previousSurgeries: '', medications: '', allergies: 'None known', comorbidities: '', primaryDiagnosis: '', mrn: '', hospitalId: defaultHospital, status: 'active',
    },
  })

  useEffect(() => {
    if (existing) {
      form.reset({
        firstName: existing.firstName, lastName: existing.lastName, dateOfBirth: existing.dateOfBirth, sex: existing.sex, phone: existing.phone, email: existing.email ?? '', address: existing.address,
        ecName: existing.emergencyContact.name, ecRelationship: existing.emergencyContact.relationship, ecPhone: existing.emergencyContact.phone,
        medicalHistory: existing.medicalHistory.join('\n'), previousSurgeries: existing.previousSurgeries.join('\n'), medications: existing.medications.join('\n'), allergies: existing.allergies.join('\n'), comorbidities: existing.comorbidities.join('\n'),
        primaryDiagnosis: existing.primaryDiagnosis, mrn: existing.mrn ?? '', hospitalId: existing.hospitalId, status: existing.status,
      })
    }
  }, [existing, form])

  const onSubmit = (v: Values) => {
    const payload = {
      firstName: v.firstName, lastName: v.lastName, dateOfBirth: v.dateOfBirth, sex: v.sex, phone: v.phone, email: v.email || undefined, address: v.address,
      emergencyContact: { name: v.ecName, relationship: v.ecRelationship, phone: v.ecPhone },
      medicalHistory: lines(v.medicalHistory), previousSurgeries: lines(v.previousSurgeries), medications: lines(v.medications), allergies: lines(v.allergies), comorbidities: lines(v.comorbidities),
      primaryDiagnosis: v.primaryDiagnosis, mrn: v.mrn || undefined, hospitalId: v.hospitalId, status: v.status,
    }
    if (editing && existing) {
      updatePatient(existing.id, payload)
      toast.success('Patient record updated')
      navigate(`/patients/${existing.id}`)
    } else {
      const p = createPatient(payload)
      toast.success(`${p.firstName} ${p.lastName} registered`, { description: `Patient number ${p.patientNumber} assigned.` })
      navigate(`/patients/${p.id}`)
    }
  }

  const e = form.formState.errors
  const reg = form.register

  return (
    <PageTransition>
      <PageHeader title={editing ? 'Edit patient' : 'Register patient'} description={editing ? `Editing ${existing?.patientNumber}` : 'A new internal patient number is assigned automatically on save.'} />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-24" noValidate>
        <FormSection title="Personal information" description="Demographics and contact details.">
          <Field label="First name" htmlFor="firstName" required error={e.firstName?.message}><Input id="firstName" {...reg('firstName')} aria-invalid={!!e.firstName} autoFocus /></Field>
          <Field label="Last name" htmlFor="lastName" required error={e.lastName?.message}><Input id="lastName" {...reg('lastName')} aria-invalid={!!e.lastName} /></Field>
          <Field label="Date of birth" htmlFor="dob" required error={e.dateOfBirth?.message}><Input id="dob" type="date" max={DEMO_REFERENCE_DATE} {...reg('dateOfBirth')} aria-invalid={!!e.dateOfBirth} /></Field>
          <Field label="Sex" required error={e.sex?.message}>
            <Controller control={form.control} name="sex" render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4 h-9 items-center">
                <div className="flex items-center gap-2"><RadioGroupItem value="female" id="sex-f" /><Label htmlFor="sex-f">Female</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="male" id="sex-m" /><Label htmlFor="sex-m">Male</Label></div>
              </RadioGroup>
            )} />
          </Field>
          <Field label="Contact number" htmlFor="phone" required error={e.phone?.message}><Input id="phone" type="tel" {...reg('phone')} aria-invalid={!!e.phone} /></Field>
          <Field label="Email" htmlFor="email" error={e.email?.message} description="Optional"><Input id="email" type="email" {...reg('email')} aria-invalid={!!e.email} /></Field>
          <Field label="Address" htmlFor="address" required error={e.address?.message} className="md:col-span-2"><Input id="address" {...reg('address')} aria-invalid={!!e.address} /></Field>
          <Field label="Emergency contact name" htmlFor="ecName" required error={e.ecName?.message}><Input id="ecName" {...reg('ecName')} aria-invalid={!!e.ecName} /></Field>
          <Field label="Relationship" htmlFor="ecRel" required error={e.ecRelationship?.message}><Input id="ecRel" placeholder="e.g. Spouse" {...reg('ecRelationship')} aria-invalid={!!e.ecRelationship} /></Field>
          <Field label="Emergency contact number" htmlFor="ecPhone" required error={e.ecPhone?.message}><Input id="ecPhone" type="tel" {...reg('ecPhone')} aria-invalid={!!e.ecPhone} /></Field>
        </FormSection>

        <FormSection title="Clinical information" description="One item per line. These appear on the patient summary and operative documents.">
          <Field label="Primary diagnosis / referral reason" htmlFor="dx" required error={e.primaryDiagnosis?.message} className="md:col-span-2"><Input id="dx" {...reg('primaryDiagnosis')} aria-invalid={!!e.primaryDiagnosis} /></Field>
          <Field label="Medical history" htmlFor="mh"><Textarea id="mh" rows={3} placeholder="Hypertension&#10;Type 2 diabetes" {...reg('medicalHistory')} /></Field>
          <Field label="Previous surgeries" htmlFor="ps"><Textarea id="ps" rows={3} {...reg('previousSurgeries')} /></Field>
          <Field label="Current medications" htmlFor="med"><Textarea id="med" rows={3} placeholder="Drug, dose, frequency" {...reg('medications')} /></Field>
          <Field label="Allergies" htmlFor="all" description="Write “None known” if none."><Textarea id="all" rows={3} {...reg('allergies')} /></Field>
          <Field label="Relevant comorbidities" htmlFor="com" className="md:col-span-2"><Textarea id="com" rows={2} {...reg('comorbidities')} /></Field>
        </FormSection>

        <FormSection title="Identifiers" description="The internal NeuroVault number is generated automatically.">
          <Field label="Internal patient number" htmlFor="pn" description="Assigned on save"><Input id="pn" value={existing?.patientNumber ?? 'Auto-generated (NV-####)'} readOnly className="bg-muted text-muted-foreground" /></Field>
          <Field label="Hospital medical record number" htmlFor="mrn" description="Optional"><Input id="mrn" {...reg('mrn')} /></Field>
          <Field label="Hospital / facility" required error={e.hospitalId?.message}>
            <Controller control={form.control} name="hospitalId" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}><SelectTrigger aria-invalid={!!e.hospitalId}><SelectValue placeholder="Select hospital" /></SelectTrigger><SelectContent>{hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select>
            )} />
          </Field>
          <Field label="Record status">
            <Controller control={form.control} name="status" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
            )} />
          </Field>
        </FormSection>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/85 backdrop-blur md:left-[var(--sidebar-w,0px)] no-print">
          <div className="mx-auto flex max-w-[1500px] items-center justify-end gap-2 px-4 py-3 md:px-8">
            {Object.keys(e).length > 0 && <span className="mr-auto text-sm text-destructive">Please correct the highlighted fields.</span>}
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}><X /> Cancel</Button>
            <Button type="submit"><Save /> {editing ? 'Save changes' : 'Register patient'}</Button>
          </div>
        </div>
      </form>
    </PageTransition>
  )
}
