import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Bone, Brain, Info, Scissors, Stethoscope } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { useDataset } from '@/services/repository'
import { brainRegionsInfo, spineRegionsInfo } from './anatomyData'
import type { BrainRegion, SpineRegion } from '@/types'
import { cn } from '@/lib/utils'
import { fmtDate, fullName } from '@/utils/format'
import { ImageWithFallback } from '@/components/shared/ImageWithFallback'
import { imageAssets } from '@/config/images'

const brainPaths: { id: BrainRegion; d: string; label: [number, number] }[] = [
  { id: 'frontal', d: 'M110 232 C 95 180, 120 110, 200 92 C 245 82, 285 88, 318 104 L 300 170 C 270 160, 240 158, 215 172 L 190 222 C 170 240, 140 245, 110 232 Z', label: [195, 140] },
  { id: 'parietal', d: 'M318 104 C 360 94, 410 100, 440 130 C 462 150, 470 175, 468 198 L 410 228 L 350 210 L 300 170 Z', label: [385, 160] },
  { id: 'temporal', d: 'M190 222 L 215 172 C 240 158, 270 160, 300 170 L 350 210 L 330 262 C 300 282, 250 284, 215 270 C 198 262, 190 245, 190 222 Z', label: [236, 232] },
  { id: 'occipital', d: 'M468 198 C 482 230, 470 262, 440 272 L 395 262 L 350 210 L 410 228 Z', label: [440, 235] },
  { id: 'cerebellum', d: 'M395 262 L 440 272 C 445 300, 420 322, 380 320 C 345 318, 330 295, 338 272 Z', label: [390, 296] },
  { id: 'brainstem', d: 'M300 268 L 338 272 C 335 290, 332 310, 330 335 L 300 335 C 296 310, 296 288, 300 268 Z', label: [318, 310] },
  { id: 'ventricular', d: 'M250 180 C 290 170, 330 180, 345 200 C 320 205, 280 208, 250 198 Z', label: [298, 192] },
  { id: 'sellar', d: 'M268 232 C 278 226, 290 226, 300 232 C 292 242, 276 242, 268 232 Z', label: [292, 254] },
  { id: 'skull-base', d: 'M130 250 C 180 268, 230 272, 290 262 L 296 288 C 230 300, 170 296, 128 272 Z', label: [200, 282] },
]

const spineSegments: { id: SpineRegion; y: number; count: number; w: number; color: string }[] = [
  { id: 'craniovertebral', y: 20, count: 2, w: 54, color: 'var(--lavender)' },
  { id: 'cervical', y: 62, count: 5, w: 50, color: 'var(--cyan)' },
  { id: 'thoracic', y: 172, count: 12, w: 58, color: 'var(--teal)' },
  { id: 'lumbar', y: 436, count: 5, w: 70, color: 'var(--warning)' },
  { id: 'sacral', y: 560, count: 5, w: 64, color: 'var(--danger)' },
]

export function AnatomyPage() {
  const d = useDataset()
  const reduce = useReducedMotion()
  const [system, setSystem] = useState<'brain' | 'spine'>('brain')
  const [brainSel, setBrainSel] = useState<BrainRegion>('frontal')
  const [spineSel, setSpineSel] = useState<SpineRegion>('lumbar')
  const [hover, setHover] = useState<string | null>(null)

  const info = system === 'brain' ? brainRegionsInfo[brainSel] : spineRegionsInfo[spineSel]
  const related = useMemo(() => d.cases.filter((c) => (system === 'brain' ? c.brain?.region === brainSel : c.spine?.region === spineSel)).sort((a, b) => ((a.surgeryDate ?? a.plannedDate ?? '') < (b.surgeryDate ?? b.plannedDate ?? '') ? 1 : -1)), [d.cases, system, brainSel, spineSel])
  const counts = useMemo(() => ({ brain: Object.fromEntries(Object.keys(brainRegionsInfo).map((r) => [r, d.cases.filter((c) => c.brain?.region === r).length])), spine: Object.fromEntries(Object.keys(spineRegionsInfo).map((r) => [r, d.cases.filter((c) => c.spine?.region === r).length])) }), [d.cases])
  const procedureCounts = useMemo(() => { const m = new Map<string, number>(); related.forEach((c) => m.set(c.plannedProcedure, (m.get(c.plannedProcedure) ?? 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1]) }, [related])

  return (
    <PageTransition>
      <PageHeader title="Neurosurgical anatomy explorer" description="An educational map linking anatomical regions to the procedures and mock cases in this practice. Schematic illustration — not a diagnostic or anatomically precise model." actions={<Tabs value={system} onValueChange={(v) => setSystem(v as 'brain' | 'spine')}><TabsList><TabsTrigger value="brain"><Brain /> Brain</TabsTrigger><TabsTrigger value="spine"><Bone /> Spine</TabsTrigger></TabsList></Tabs>} />
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="surface neural-bg relative overflow-hidden p-4 lg:col-span-3">
          <div className="grid-fade pointer-events-none absolute inset-0" aria-hidden />
          <AnimatePresence mode="wait">
            {system === 'brain' ? (
              <motion.div key="brain" initial={reduce ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative">
                <svg viewBox="80 60 420 300" className="mx-auto w-full max-w-2xl" role="group" aria-label="Schematic lateral brain with selectable regions">
                  <defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                  <path d="M110 232 C 95 180, 120 110, 200 92 C 260 78, 350 82, 440 130 C 490 160, 480 250, 440 272 C 445 300, 420 322, 380 320 C 350 318, 335 300, 332 282 L 330 335 L 300 335 L 298 282 C 250 290, 170 290, 128 272 C 110 262, 105 248, 110 232 Z" fill="none" stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                  {brainPaths.map((p) => {
                    const active = brainSel === p.id
                    const hovered = hover === p.id
                    return (
                      <g key={p.id} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}>
                        <path d={p.d} className="cursor-pointer transition-all duration-200 outline-none" tabIndex={0} role="button" aria-pressed={active} aria-label={brainRegionsInfo[p.id].label} onClick={() => setBrainSel(p.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setBrainSel(p.id)}
                          fill={active ? 'var(--teal)' : hovered ? 'var(--cyan)' : 'var(--card)'} fillOpacity={active ? 0.85 : hovered ? 0.55 : 0.9} stroke={active ? 'var(--teal)' : 'var(--muted-foreground)'} strokeWidth={active ? 2 : 1} filter={active ? 'url(#glow)' : undefined} />
                        <text x={p.label[0]} y={p.label[1]} textAnchor="middle" className="pointer-events-none select-none" fontSize="11" fontWeight={active ? 700 : 500} fill={active ? '#06201d' : 'var(--foreground)'}>{brainRegionsInfo[p.id].label.split(' ')[0]}</text>
                        {counts.brain[p.id] > 0 && <text x={p.label[0]} y={p.label[1] + 13} textAnchor="middle" className="pointer-events-none" fontSize="9" fill={active ? '#06201d' : 'var(--muted-foreground)'}>{counts.brain[p.id]} case{counts.brain[p.id] === 1 ? '' : 's'}</text>}
                      </g>
                    )
                  })}
                </svg>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {(Object.keys(brainRegionsInfo) as BrainRegion[]).map((r) => <button key={r} type="button" onClick={() => setBrainSel(r)} className={cn('rounded-full border px-2.5 py-1 text-xs cursor-pointer transition-colors', brainSel === r ? 'border-primary bg-primary/15 text-primary font-semibold' : 'hover:bg-muted')}>{brainRegionsInfo[r].label}</button>)}
                </div>
              </motion.div>
            ) : (
              <motion.div key="spine" initial={reduce ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative flex flex-col items-center gap-3 md:flex-row md:items-start md:justify-center">
                <svg viewBox="0 0 220 700" className="h-[520px] w-auto" role="group" aria-label="Schematic vertebral column with selectable regions">
                  {spineSegments.map((s) => {
                    const active = spineSel === s.id
                    const hovered = hover === s.id
                    const h = s.id === 'craniovertebral' ? 16 : s.id === 'thoracic' ? 18 : s.id === 'lumbar' ? 20 : s.id === 'sacral' ? 14 : 18
                    const gap = 4
                    return (
                      <g key={s.id} onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)} className="cursor-pointer" onClick={() => setSpineSel(s.id)} tabIndex={0} role="button" aria-pressed={active} aria-label={spineRegionsInfo[s.id].label} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSpineSel(s.id)}>
                        {Array.from({ length: s.count }).map((_, i) => (
                          <g key={i}>
                            <rect x={110 - s.w / 2} y={s.y + i * (h + gap)} width={s.w} height={h} rx={5} fill={active ? s.color : hovered ? s.color : 'var(--card)'} fillOpacity={active ? 0.9 : hovered ? 0.5 : 1} stroke={active ? s.color : 'var(--muted-foreground)'} strokeWidth={active ? 1.5 : 1} className="transition-all duration-200" />
                            {i < s.count - 1 && <rect x={110 - s.w / 2 + 6} y={s.y + i * (h + gap) + h} width={s.w - 12} height={gap} fill="var(--muted-foreground)" opacity="0.35" />}
                          </g>
                        ))}
                        <text x={110 + s.w / 2 + 10} y={s.y + (s.count * (h + gap)) / 2} fontSize="12" fontWeight={active ? 700 : 500} fill={active ? s.color : 'var(--foreground)'} dominantBaseline="middle">{spineRegionsInfo[s.id].label}</text>
                        <text x={110 - s.w / 2 - 8} y={s.y + (s.count * (h + gap)) / 2} fontSize="10" textAnchor="end" fill="var(--muted-foreground)" dominantBaseline="middle">{spineRegionsInfo[s.id].levels[0]}–{spineRegionsInfo[s.id].levels.at(-1)}</text>
                        {counts.spine[s.id] > 0 && <text x={110 + s.w / 2 + 10} y={s.y + (s.count * (h + gap)) / 2 + 14} fontSize="9" fill="var(--muted-foreground)" dominantBaseline="middle">{counts.spine[s.id]} case{counts.spine[s.id] === 1 ? '' : 's'}</text>}
                      </g>
                    )
                  })}
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div key={info.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
              <div className="surface p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">{system === 'brain' ? <Brain className="size-4" /> : <Bone className="size-4" />} {system === 'brain' ? 'Brain region' : 'Spinal region'}</div>
                <h2 className="mt-1 text-xl font-bold">{info.label}</h2>
                {'levels' in info && <div className="mt-1 font-data text-xs text-muted-foreground">{(info as { levels: string[] }).levels.join(' · ')}</div>}
                <p className="mt-2 text-sm text-muted-foreground">{info.summary}</p>
                <div className="mt-4"><div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Functions</div><ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">{info.functions.map((f) => <li key={f}>{f}</li>)}</ul></div>
              </div>
              <div className="surface p-5">
                <div className="flex items-center gap-2 font-semibold"><Scissors className="size-4 text-primary" /> Common procedure categories</div>
                <ul className="mt-2 flex flex-wrap gap-1.5">{info.procedures.map((p) => <li key={p}><Badge variant="outline" className="normal-case tracking-normal font-medium">{p}</Badge></li>)}</ul>
                <div className="mt-4 flex items-center gap-2 font-semibold"><Stethoscope className="size-4 text-primary" /> Typical conditions</div>
                <ul className="mt-2 flex flex-wrap gap-1.5">{info.conditions.map((p) => <li key={p}><Badge variant="secondary" className="normal-case tracking-normal font-medium">{p}</Badge></li>)}</ul>
              </div>
              <div className="surface p-5">
                <div className="flex items-center justify-between"><div className="font-semibold">Related mock cases</div><Badge variant="default">{related.length}</Badge></div>
                {procedureCounts.length > 0 && <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{procedureCounts.slice(0, 4).map(([p, n]) => <li key={p} className="flex justify-between gap-2"><span className="truncate">{p}</span><span className="tabular-nums font-semibold text-foreground">{n}</span></li>)}</ul>}
                <ul className="mt-3 divide-y">
                  {related.slice(0, 6).map((c) => (
                    <li key={c.id}><Link to={`/cases/${c.id}`} className="flex items-center gap-3 py-2 text-sm hover:text-primary"><span className="font-data text-xs text-muted-foreground w-24 shrink-0">{c.caseNumber}</span><span className="min-w-0 flex-1 truncate">{fullName(d.patients.find((p) => p.id === c.patientId))} · {c.plannedProcedure}</span><StatusBadge kind="case" value={c.status} iconOnly /><span className="font-data text-xs text-muted-foreground tabular-nums hidden sm:inline">{fmtDate(c.surgeryDate ?? c.plannedDate)}</span></Link></li>
                  ))}
                  {!related.length && <li className="py-3 text-sm text-muted-foreground">No cases in this region yet.</li>}
                </ul>
                {related.length > 6 && <Link to={`/cases?type=${system}`} className="mt-2 inline-block text-xs text-primary hover:underline">View all {system} cases</Link>}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="surface overflow-hidden"><ImageWithFallback asset={imageAssets.brainLobes} className="aspect-[16/9]" showCaption /></div>
        <div className="surface overflow-hidden"><ImageWithFallback asset={imageAssets.brainLateral} className="aspect-[16/9]" showCaption /></div>
      </div>
      <DemoNotice className="mt-4"><span className="inline-flex items-start gap-1"><Info className="mt-0.5 size-3.5 shrink-0" /> The interactive illustrations are simplified schematics for navigation and education. They are not anatomically precise models and must not be used for surgical planning.</span></DemoNotice>
    </PageTransition>
  )
}
