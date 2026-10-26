import type { MotorPower } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const mrc = [[5, 'Normal power'], [4, 'Against resistance'], [3, 'Against gravity'], [2, 'Gravity eliminated'], [1, 'Flicker'], [0, 'No contraction']] as const
const limbs: { key: keyof MotorPower; label: string }[] = [
  { key: 'rightUpper', label: 'Right upper limb' },
  { key: 'leftUpper', label: 'Left upper limb' },
  { key: 'rightLower', label: 'Right lower limb' },
  { key: 'leftLower', label: 'Left lower limb' },
]

export function MotorPowerGrid({ value, onChange, disabled }: { value: MotorPower; onChange: (v: MotorPower) => void; disabled?: boolean }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="mb-3 text-sm font-semibold">Limb motor power (MRC 0–5)</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {limbs.map((l) => (
          <div key={l.key} className="flex flex-col gap-1.5">
            <Label htmlFor={`motor-${l.key}`}>{l.label}</Label>
            <Select disabled={disabled} value={value[l.key] === null ? 'NT' : String(value[l.key])} onValueChange={(v) => onChange({ ...value, [l.key]: v === 'NT' ? null : Number(v) })}>
              <SelectTrigger id={`motor-${l.key}`}><SelectValue /></SelectTrigger>
              <SelectContent>
                {mrc.map(([n, label]) => <SelectItem key={n} value={String(n)}>{n}/5 — {label}</SelectItem>)}
                <SelectItem value="NT">Not tested</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MotorPowerDisplay({ value, compare }: { value: MotorPower; compare?: MotorPower }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {limbs.map((l) => {
        const v = value[l.key]
        const c = compare?.[l.key]
        const delta = v !== null && c !== null && c !== undefined ? v - c : null
        return (
          <div key={l.key} className="rounded-lg border bg-card px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{l.label}</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className={cn('font-data text-lg font-bold tabular-nums', v === null && 'text-muted-foreground text-sm font-medium')}>{v === null ? 'Not tested' : `${v}/5`}</span>
              {delta !== null && delta !== 0 && <span className={cn('text-xs font-semibold', delta > 0 ? 'text-emerald-600 dark:text-success' : 'text-red-600 dark:text-danger')}>{delta > 0 ? '+' : ''}{delta}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
