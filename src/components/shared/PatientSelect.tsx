import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, UserRound } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { useCollection } from '@/services/repository'
import { cn } from '@/lib/utils'
import { patientAge } from '@/utils/clinical'

export function PatientSelect({ value, onChange, placeholder = 'Select patient…', disabled, className, id }: { value?: string; onChange: (id: string) => void; placeholder?: string; disabled?: boolean; className?: string; id?: string }) {
  const patients = useCollection('patients')
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => patients.find((p) => p.id === value), [patients, value])
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className={cn('w-full justify-between font-normal h-9 px-3', !selected && 'text-muted-foreground/70', className)}>
          <span className="flex items-center gap-2 truncate">
            <UserRound className="size-4 opacity-60" />
            {selected ? `${selected.firstName} ${selected.lastName} · ${selected.patientNumber}` : placeholder}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-80 p-0" align="start">
        <Command filter={(v, s) => (v.toLowerCase().includes(s.toLowerCase()) ? 1 : 0)}>
          <CommandInput placeholder="Search name, patient number or diagnosis…" />
          <CommandList>
            <CommandEmpty>No patient found.</CommandEmpty>
            <CommandGroup>
              {patients.map((p) => (
                <CommandItem key={p.id} value={`${p.firstName} ${p.lastName} ${p.patientNumber} ${p.primaryDiagnosis}`} onSelect={() => { onChange(p.id); setOpen(false) }}>
                  <Check className={cn('size-4', value === p.id ? 'opacity-100' : 'opacity-0')} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.firstName} {p.lastName} <span className="text-xs text-muted-foreground">· {patientAge(p)} y · {p.sex === 'male' ? 'M' : 'F'}</span></div>
                    <div className="truncate text-xs text-muted-foreground">{p.patientNumber} · {p.primaryDiagnosis}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
