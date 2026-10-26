import type { PupilExam } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Pupils = { left: PupilExam; right: PupilExam }

export function PupilInput({ value, onChange, disabled }: { value: Pupils; onChange: (v: Pupils) => void; disabled?: boolean }) {
  const side = (k: 'left' | 'right') => (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`pupil-${k}-size`} className="capitalize">{k} size (mm)</Label>
        <Input id={`pupil-${k}-size`} type="number" min={1} max={9} step={0.5} disabled={disabled} value={value[k].size} onChange={(e) => onChange({ ...value, [k]: { ...value[k], size: Number(e.target.value) } })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`pupil-${k}-react`}>Reaction</Label>
        <Select disabled={disabled} value={value[k].reaction} onValueChange={(v) => onChange({ ...value, [k]: { ...value[k], reaction: v as PupilExam['reaction'] } })}>
          <SelectTrigger id={`pupil-${k}-react`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="brisk">Brisk</SelectItem>
            <SelectItem value="sluggish">Sluggish</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
            <SelectItem value="not-assessable">Not assessable</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="mb-3 text-sm font-semibold">Pupillary examination</div>
      <div className="grid gap-3 md:grid-cols-2">{side('right')}{side('left')}</div>
    </div>
  )
}

export function PupilDisplay({ value }: { value?: Pupils }) {
  if (!value) return <span className="text-muted-foreground">Not recorded</span>
  const fmt = (p: PupilExam) => `${p.size} mm, ${p.reaction.replace('-', ' ')}`
  return <span className="font-data text-sm">R {fmt(value.right)} · L {fmt(value.left)}</span>
}
