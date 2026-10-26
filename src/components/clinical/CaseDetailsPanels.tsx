import type { BrainCaseDetails, SpineCaseDetails } from '@/types'
import { KeyValue } from '@/components/shared/KeyValue'
import { Badge } from '@/components/ui/badge'
import { computeGcs } from '@/utils/clinical'
import { brainCategories, brainRegions, lateralities, spineCategories, spineRegions, labelOf } from './clinicalOptions'
import { PupilDisplay } from './PupilInput'
import { MotorPowerDisplay } from './MotorPowerGrid'
import { ScorePill } from '@/components/shared/ScorePill'

export function BrainDetailsPanel({ b }: { b: BrainCaseDetails }) {
  const gcs = computeGcs(b.gcs)
  return (
    <div className="space-y-5">
      <KeyValue
        columns={3}
        items={[
          { label: 'Category', value: labelOf(brainCategories, b.category) },
          { label: 'Anatomical region', value: labelOf(brainRegions, b.region) },
          { label: 'Laterality', value: labelOf(lateralities, b.laterality) },
          { label: 'Lesion location', value: b.lesionLocation, span: true },
          { label: 'Lesion size', value: b.lesionSizeMm ? `${b.lesionSizeMm} mm` : undefined },
          { label: 'Surgical approach', value: b.approach, span: true },
          { label: 'Presenting symptoms', value: <ul className="flex flex-wrap gap-1.5">{b.symptoms.map((s) => <li key={s}><Badge variant="outline" className="normal-case tracking-normal font-medium">{s}</Badge></li>)}</ul>, span: true },
          { label: 'MRI / CT findings', value: b.imagingFindings, span: true },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <ScorePill label="GCS" value={b.gcs ? gcs.label : null} tone={gcs.total !== null && gcs.total <= 8 ? 'bad' : gcs.total !== null && gcs.total <= 12 ? 'warn' : 'good'} />
        {b.grading?.map((g) => <ScorePill key={g.system} label={g.system} value={g.value} />)}
      </div>
      <KeyValue
        columns={2}
        items={[
          { label: 'Pupils', value: <PupilDisplay value={b.pupils} /> },
          { label: 'Cranial nerves', value: b.cranialNerves },
          { label: 'Motor deficit', value: b.motorDeficit },
          { label: 'Sensory deficit', value: b.sensoryDeficit },
        ]}
      />
    </div>
  )
}

export function SpineDetailsPanel({ s }: { s: SpineCaseDetails }) {
  return (
    <div className="space-y-5">
      <KeyValue
        columns={3}
        items={[
          { label: 'Category', value: labelOf(spineCategories, s.category) },
          { label: 'Spinal region', value: labelOf(spineRegions, s.region) },
          { label: 'Vertebral level(s)', value: s.levels.join(', ') },
          { label: 'Laterality', value: labelOf(lateralities, s.laterality) },
          { label: 'Surgical approach', value: s.approach, span: true },
          { label: 'Instrumentation', value: s.instrumentation, span: true },
          { label: 'Presenting symptoms', value: <ul className="flex flex-wrap gap-1.5">{s.symptoms.map((x) => <li key={x}><Badge variant="outline" className="normal-case tracking-normal font-medium">{x}</Badge></li>)}</ul>, span: true },
          { label: 'Imaging findings', value: s.imagingFindings, span: true },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <ScorePill label="Pain (NRS)" value={s.painScore ?? null} unit="/10" tone={(s.painScore ?? 0) >= 7 ? 'bad' : (s.painScore ?? 0) >= 4 ? 'warn' : 'good'} />
        <ScorePill label="ODI" value={s.odiScore ?? null} unit="%" tone={(s.odiScore ?? 0) > 40 ? 'bad' : (s.odiScore ?? 0) > 20 ? 'warn' : 'good'} />
        <ScorePill label="ASIA grade" value={s.asiaGrade ?? null} tone={s.asiaGrade === 'E' ? 'good' : s.asiaGrade === 'D' ? 'warn' : 'bad'} />
      </div>
      {s.motor && <MotorPowerDisplay value={s.motor} />}
      <KeyValue
        columns={2}
        items={[
          { label: 'Sensory examination', value: s.sensory },
          { label: 'Reflexes', value: s.reflexes },
          { label: 'Bowel / bladder', value: s.bowelBladder },
          { label: 'Functional limitation', value: s.functionalLimitation },
        ]}
      />
    </div>
  )
}
