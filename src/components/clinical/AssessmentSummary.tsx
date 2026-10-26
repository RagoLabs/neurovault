import type { NeuroAssessment } from '@/types'
import { computeGcs, motorTotal } from '@/utils/clinical'
import { ScorePill } from '@/components/shared/ScorePill'
import { MotorPowerDisplay } from './MotorPowerGrid'
import { PupilDisplay } from './PupilInput'
import { KeyValue } from '@/components/shared/KeyValue'
import { Badge } from '@/components/ui/badge'

export function AssessmentSummary({ a, compact }: { a: NeuroAssessment; compact?: boolean }) {
  const gcs = computeGcs(a.gcs)
  const m = motorTotal(a.motor)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {a.domain === 'brain' && <ScorePill label="GCS" value={a.gcs ? gcs.label : null} tone={gcs.total !== null && gcs.total <= 8 ? 'bad' : gcs.total !== null && gcs.total <= 12 ? 'warn' : 'good'} />}
        <ScorePill label="Motor sum" value={m.tested ? `${m.sum}/${m.max}` : null} tone={m.tested ? (m.sum === m.max ? 'good' : m.sum >= m.max - 4 ? 'warn' : 'bad') : 'muted'} />
        {a.domain === 'spine' && <ScorePill label="Pain" value={a.painScore ?? null} unit="/10" tone={(a.painScore ?? 0) >= 7 ? 'bad' : (a.painScore ?? 0) >= 4 ? 'warn' : 'good'} />}
        {a.domain === 'spine' && <ScorePill label="ODI" value={a.odiScore ?? null} unit="%" tone={(a.odiScore ?? 0) > 40 ? 'bad' : (a.odiScore ?? 0) > 20 ? 'warn' : 'good'} />}
        {a.domain === 'spine' && <ScorePill label="ASIA" value={a.asiaGrade === 'not-assessed' ? null : a.asiaGrade ?? null} tone={a.asiaGrade === 'E' ? 'good' : a.asiaGrade === 'D' ? 'warn' : 'bad'} />}
        {a.domain === 'brain' && <ScorePill label="mRS" value={a.mrs ?? null} tone={(a.mrs ?? 0) <= 1 ? 'good' : (a.mrs ?? 0) <= 3 ? 'warn' : 'bad'} />}
        {a.domain === 'brain' && <ScorePill label="KPS" value={a.kps ?? null} tone={(a.kps ?? 0) >= 80 ? 'good' : (a.kps ?? 0) >= 60 ? 'warn' : 'bad'} />}
      </div>
      {!compact && (
        <>
          <MotorPowerDisplay value={a.motor} />
          <KeyValue
            columns={2}
            items={[
              ...(a.domain === 'brain' ? [{ label: 'Pupils', value: <PupilDisplay value={a.pupils} /> }, { label: 'Cranial nerves', value: a.cranialNerves }] : [{ label: 'Spinal level', value: a.spinalLevel }, { label: 'Reflexes', value: a.reflexes }]),
              { label: 'Sensory findings', value: a.sensory },
              a.domain === 'spine' ? { label: 'Bowel / bladder', value: a.bowelBladder } : { label: 'Functional status', value: a.functionalStatus },
              { label: 'Neurological deficits', value: a.deficits.length ? <ul className="flex flex-wrap gap-1.5">{a.deficits.map((d) => <li key={d}><Badge variant="danger" className="normal-case tracking-normal font-medium">{d}</Badge></li>)}</ul> : <Badge variant="success" className="normal-case tracking-normal font-medium">No deficit recorded</Badge>, span: true },
              { label: 'Additional observations', value: a.notes, span: true },
            ]}
          />
        </>
      )}
    </div>
  )
}
