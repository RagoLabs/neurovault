import type { GCSComponents } from '@/types'
import { computeGcs, gcsSeverity } from '@/utils/clinical'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const options = {
  eye: [[4, 'Spontaneous'], [3, 'To sound'], [2, 'To pressure'], [1, 'None']],
  verbal: [[5, 'Orientated'], [4, 'Confused'], [3, 'Words'], [2, 'Sounds'], [1, 'None']],
  motor: [[6, 'Obeys commands'], [5, 'Localising'], [4, 'Normal flexion'], [3, 'Abnormal flexion'], [2, 'Extension'], [1, 'None']],
} as const

export function GcsInput({ value, onChange, disabled }: { value: GCSComponents; onChange: (v: GCSComponents) => void; disabled?: boolean }) {
  const res = computeGcs(value)
  const sev = gcsSeverity(res.total)
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Glasgow Coma Scale</div>
        <div className={cn('rounded-lg px-3 py-1 font-data text-sm font-bold tabular-nums', sev === 'severe' ? 'bg-danger/15 text-red-700 dark:text-red-300' : sev === 'moderate' ? 'bg-warning/15 text-amber-700 dark:text-amber-300' : sev === 'mild' ? 'bg-success/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
          GCS {res.label}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {(['eye', 'verbal', 'motor'] as const).map((k) => (
          <div key={k} className="flex flex-col gap-1.5">
            <Label htmlFor={`gcs-${k}`} className="capitalize">{k} ({k === 'eye' ? 'E' : k === 'verbal' ? 'V' : 'M'})</Label>
            <Select disabled={disabled} value={value[k] === null ? 'NT' : String(value[k])} onValueChange={(v) => onChange({ ...value, [k]: v === 'NT' ? null : Number(v) })}>
              <SelectTrigger id={`gcs-${k}`}><SelectValue /></SelectTrigger>
              <SelectContent>
                {options[k].map(([n, label]) => <SelectItem key={n} value={String(n)}>{n} — {label}</SelectItem>)}
                <SelectItem value="NT">NT — Not testable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      {!res.complete && <p className="mt-2 text-xs text-muted-foreground">A not-testable component is recorded as “NT” and the total is marked with “T”; it is never scored as 1.</p>}
    </div>
  )
}
