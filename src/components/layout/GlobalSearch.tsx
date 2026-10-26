import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Brain, FileText, Search, Stethoscope, UserRound, Scissors } from 'lucide-react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { useDataset } from '@/services/repository'
import { globalSearch } from '@/services/search'
import { allNavItems } from './nav'
import { useDebounce } from '@/hooks/useDebounce'

const kindIcon = { patient: UserRound, case: Brain, consultation: Stethoscope, procedure: Scissors, page: FileText }
const kindLabel = { patient: 'Patients', case: 'Surgical cases', consultation: 'Consultations', procedure: 'Procedures', page: 'Pages' }

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const dq = useDebounce(q, 120)
  const d = useDataset()
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => globalSearch(d, dq, 14), [d, dq])
  const pages = useMemo(() => (dq ? allNavItems.filter((n) => n.label.toLowerCase().includes(dq.toLowerCase())) : allNavItems.slice(0, 6)), [dq])
  const grouped = useMemo(() => {
    const g: Record<string, typeof results> = {}
    results.forEach((r) => ((g[r.kind] ??= []).push(r)))
    return g
  }, [results])

  const go = (href: string) => {
    setOpen(false)
    setQ('')
    navigate(href)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="hidden h-9 w-64 justify-start gap-2 text-muted-foreground md:flex lg:w-80 font-normal" aria-label="Open global search">
        <Search className="size-4" />
        <span className="flex-1 text-left text-sm">Search patients, cases, procedures…</span>
        <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-data text-[10px] font-medium text-muted-foreground lg:inline">⌘K</kbd>
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="md:hidden" aria-label="Search"><Search /></Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Global search" description="Search patients, cases, consultations and procedures">
        <CommandInput placeholder="Search patients, cases, consultations, procedures…" value={q} onValueChange={setQ} />
        <CommandList>
          <CommandEmpty>No results for “{q}”.</CommandEmpty>
          {(Object.keys(grouped) as (keyof typeof kindIcon)[]).map((kind) => (
            <CommandGroup key={kind} heading={kindLabel[kind]}>
              {grouped[kind].map((r) => {
                const Icon = kindIcon[r.kind]
                return (
                  <CommandItem key={r.id + r.kind} value={`${r.kind}-${r.id}-${r.title}`} onSelect={() => go(r.href)}>
                    <Icon className="text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{r.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{r.subtitle}</div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
          {pages.length > 0 && (
            <CommandGroup heading="Go to">
              {pages.map((p) => (
                <CommandItem key={p.to} value={`page-${p.label}`} onSelect={() => go(p.to)}>
                  <p.icon className="text-muted-foreground" />
                  <span>{p.label}</span>
                  <CommandShortcut>↵</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
