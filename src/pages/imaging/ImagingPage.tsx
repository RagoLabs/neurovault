import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, FileText, FlaskConical, Plus, ScanLine, ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { PatientChip } from '@/components/shared/PatientChip'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Field } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PatientSelect } from '@/components/shared/PatientSelect'
import { ImageWithFallback } from '@/components/shared/ImageWithFallback'
import { getImage, SAMPLE_IMAGE_NOTICE, imageAssets } from '@/config/images'
import { useDataset, saveImaging } from '@/services/repository'
import { fmtDate, fullName } from '@/utils/format'
import type { ImagingModality, ImagingRecord } from '@/types'
import { DEMO_REFERENCE_DATE } from '@/config/demo'
import { KeyValue } from '@/components/shared/KeyValue'
import { cn } from '@/lib/utils'

const modalities: ImagingModality[] = ['MRI Brain', 'MRI Spine', 'CT Brain', 'CT Spine', 'X-ray', 'Angiography', 'Laboratory']
const defaultImageFor: Record<ImagingModality, string | undefined> = { 'MRI Brain': 'mriBrainAxial', 'MRI Spine': 'mriLumbarSagittal', 'CT Brain': 'ctBrainAxial', 'CT Spine': 'ctSpine', 'X-ray': 'xraySpine', Angiography: 'angiography', Laboratory: undefined }

export function ImagingPage() {
  const d = useDataset()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [modality, setModality] = useState('all')
  const patientFilter = params.get('patient')
  const caseFilter = params.get('case')
  const [openId, setOpenId] = useState<string | null>(params.get('open'))
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => { if (params.get('open')) setOpenId(params.get('open')) }, [params])

  const rows = useMemo(() => d.imaging
    .filter((i) => (modality === 'all' || i.modality === modality) && (!patientFilter || i.patientId === patientFilter) && (!caseFilter || i.caseId === caseFilter))
    .filter((i) => !q || `${fullName(d.patients.find((p) => p.id === i.patientId))} ${i.modality} ${i.region} ${i.impression} ${i.findings}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.studyDate < b.studyDate ? 1 : -1)), [d, modality, patientFilter, caseFilter, q])

  const idx = rows.findIndex((r) => r.id === openId)
  const current = idx >= 0 ? rows[idx] : null
  const step = (n: number) => { const next = rows[idx + n]; if (next) setOpenId(next.id) }
  const close = () => { setOpenId(null); if (params.get('open')) { const p = new URLSearchParams(params); p.delete('open'); setParams(p, { replace: true }) } }

  return (
    <PageTransition>
      <PageHeader title="Imaging & investigations" description="Radiology and laboratory records linked to patients and cases. Attached images are sample educational imagery, never the fictional patient's own scan." actions={<Button onClick={() => setAddOpen(true)}><Plus /> Add record</Button>} />
      <div className="surface">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Search patient, modality, impression…" className="md:w-80" />
          <Select value={modality} onValueChange={setModality}><SelectTrigger className="md:w-44" aria-label="Modality"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All modalities</SelectItem>{modalities.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
          {(patientFilter || caseFilter) && <Badge variant="info" className="normal-case tracking-normal font-medium">Filtered: {patientFilter ? fullName(d.patients.find((p) => p.id === patientFilter)) : d.cases.find((c) => c.id === caseFilter)?.caseNumber} <button type="button" className="ml-1 cursor-pointer" onClick={() => setParams({}, { replace: true })} aria-label="Clear filter"><X className="size-3" /></button></Badge>}
          <span className="text-sm text-muted-foreground md:ml-auto">{rows.length} record{rows.length === 1 ? '' : 's'}</span>
        </div>
        {rows.length ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {rows.map((r) => {
              const asset = getImage(r.imageKey)
              const c = d.cases.find((x) => x.id === r.caseId)
              return (
                <button key={r.id} type="button" onClick={() => setOpenId(r.id)} className="surface surface-hover overflow-hidden text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {asset ? <ImageWithFallback asset={asset} className="aspect-[4/3] bg-black" /> : <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">{r.modality === 'Laboratory' ? <FlaskConical className="size-8" /> : <FileText className="size-8" />}<span className="text-xs">Report only</span></div>}
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{r.modality}</span><Badge variant={r.status === 'reviewed' ? 'success' : r.status === 'pending' ? 'warning' : 'info'}>{r.status}</Badge></div>
                    <div className="text-xs text-muted-foreground">{r.region} · {fmtDate(r.studyDate)}</div>
                    <div className="mt-2"><PatientChip patientId={r.patientId} compact link={false} /></div>
                    <p className="mt-2 line-clamp-2 text-xs">{r.impression}</p>
                    {c && <div className="mt-2 font-data text-[11px] text-muted-foreground">{c.caseNumber}</div>}
                  </div>
                </button>
              )
            })}
          </div>
        ) : <EmptyState icon={ScanLine} title="No imaging records" description="Adjust the filters or add a record." action={<Button onClick={() => setAddOpen(true)}><Plus /> Add record</Button>} />}
      </div>

      <Dialog open={!!current} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden gap-0" hideClose>
          {current && (
            <div className="grid md:grid-cols-5">
              <div className="relative bg-black md:col-span-3 flex items-center justify-center min-h-72">
                {current.imageKey ? <Viewer imageKey={current.imageKey} /> : <div className="flex flex-col items-center gap-2 p-10 text-white/70"><FlaskConical className="size-10" /><span className="text-sm">No image attachment — report only</span></div>}
                <div className="absolute left-3 top-3 flex gap-2 no-print">
                  <Button size="icon-sm" variant="outline" className="bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white" onClick={() => step(-1)} disabled={idx <= 0} aria-label="Previous"><ChevronLeft /></Button>
                  <Button size="icon-sm" variant="outline" className="bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white" onClick={() => step(1)} disabled={idx >= rows.length - 1} aria-label="Next"><ChevronRight /></Button>
                </div>
                <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-[11px] text-white/90">{idx + 1} / {rows.length}</span>
              </div>
              <div className="flex flex-col md:col-span-2 max-h-[80dvh]">
                <DialogHeader className="px-5 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div><DialogTitle>{current.modality} · {current.region}</DialogTitle><DialogDescription>{fmtDate(current.studyDate)} · {d.hospitals.find((h) => h.id === current.facilityId)?.name}{current.contrast ? ' · with contrast' : ''}</DialogDescription></div>
                    <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close"><X /></Button>
                  </div>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  <PatientChip patientId={current.patientId} />
                  <KeyValue columns={1} items={[{ label: 'Findings', value: current.findings }, { label: 'Impression', value: <span className="font-semibold">{current.impression}</span> }, { label: 'Related case', value: current.caseId ? <Link to={`/cases/${current.caseId}`} className="text-primary hover:underline">{d.cases.find((c) => c.id === current.caseId)?.caseNumber}</Link> : undefined }, { label: 'Status', value: <Badge variant={current.status === 'reviewed' ? 'success' : current.status === 'pending' ? 'warning' : 'info'}>{current.status}</Badge> }]} />
                  {current.imageKey && <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs">{SAMPLE_IMAGE_NOTICE} Credit: {getImage(current.imageKey)?.credit} ({getImage(current.imageKey)?.license}).</div>}
                </div>
                <DialogFooter className="border-t px-5 py-3"><Button variant="outline" size="sm" onClick={() => navigate(`/patients/${current.patientId}?tab=imaging`)}>Patient imaging</Button>{current.caseId && <Button size="sm" onClick={() => navigate(`/cases/${current.caseId}?tab=imaging`)}>Open case</Button>}</DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddImagingDialog open={addOpen} onOpenChange={setAddOpen} presetPatient={patientFilter ?? undefined} presetCase={caseFilter ?? undefined} />
    </PageTransition>
  )
}

function Viewer({ imageKey }: { imageKey: string }) {
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const asset = getImage(imageKey)
  useEffect(() => { setZoom(1); setPos({ x: 0, y: 0 }) }, [imageKey])
  if (!asset) return null
  return (
    <div className="relative size-full overflow-hidden select-none" style={{ minHeight: 420 }}
      onWheel={(e) => { e.preventDefault(); setZoom((z) => Math.min(5, Math.max(1, z - Math.sign(e.deltaY) * 0.2))) }}
      onPointerDown={(e) => setDrag({ x: e.clientX - pos.x, y: e.clientY - pos.y })}
      onPointerMove={(e) => drag && zoom > 1 && setPos({ x: e.clientX - drag.x, y: e.clientY - drag.y })}
      onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}
    >
      <img src={asset.src} alt={asset.alt} draggable={false} className={cn('absolute inset-0 m-auto max-h-full max-w-full object-contain transition-transform', zoom > 1 ? 'cursor-grab' : 'cursor-zoom-in')} style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})` }} onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2))} />
      <span className="absolute left-3 bottom-10 rounded bg-navy/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Sample educational image</span>
      <div className="absolute right-3 top-3 flex gap-1 no-print">
        <Button size="icon-sm" variant="outline" className="bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white" onClick={() => setZoom((z) => Math.min(5, z + 0.5))} aria-label="Zoom in"><ZoomIn /></Button>
        <Button size="icon-sm" variant="outline" className="bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} aria-label="Zoom out"><ZoomOut /></Button>
        <Button size="icon-sm" variant="outline" className="bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white" onClick={() => { setZoom(1); setPos({ x: 0, y: 0 }) }} aria-label="Reset zoom"><RotateCcw /></Button>
      </div>
      <span className="absolute right-3 bottom-3 rounded bg-black/60 px-2 py-1 font-data text-[11px] text-white/90 tabular-nums">{Math.round(zoom * 100)}%</span>
    </div>
  )
}

function AddImagingDialog({ open, onOpenChange, presetPatient, presetCase }: { open: boolean; onOpenChange: (o: boolean) => void; presetPatient?: string; presetCase?: string }) {
  const d = useDataset()
  const [patientId, setPatientId] = useState(presetPatient ?? '')
  const [caseId, setCaseId] = useState(presetCase ?? '')
  const [modality, setModality] = useState<ImagingModality>('MRI Brain')
  const [region, setRegion] = useState('')
  const [date, setDate] = useState(DEMO_REFERENCE_DATE)
  const [findings, setFindings] = useState('')
  const [impression, setImpression] = useState('')
  const [facility, setFacility] = useState('hosp-001')
  const [attach, setAttach] = useState(true)
  const [err, setErr] = useState<Record<string, string>>({})
  const cases = d.cases.filter((c) => c.patientId === patientId)
  const save = () => {
    const e: Record<string, string> = {}
    if (!patientId) e.patientId = 'Select a patient'
    if (!region.trim()) e.region = 'Region is required'
    if (!impression.trim()) e.impression = 'Impression is required'
    setErr(e); if (Object.keys(e).length) return
    saveImaging({ patientId, caseId: caseId || undefined, modality, region: region.trim(), studyDate: date, findings: findings.trim(), impression: impression.trim(), facilityId: facility, imageKey: attach ? defaultImageFor[modality] : undefined, status: 'reported' })
    toast.success('Imaging record added')
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Add imaging / investigation record</DialogTitle><DialogDescription>Attached images are sample educational images from the bundled library; uploading real DICOM is out of scope for this prototype.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient" required error={err.patientId} className="sm:col-span-2"><PatientSelect value={patientId} onChange={(v) => { setPatientId(v); setCaseId('') }} /></Field>
          <Field label="Related case" className="sm:col-span-2"><Select value={caseId || 'none'} onValueChange={(v) => setCaseId(v === 'none' ? '' : v)} disabled={!patientId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No linked case</SelectItem>{cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.caseNumber} · {c.plannedProcedure}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Modality"><Select value={modality} onValueChange={(v) => setModality(v as ImagingModality)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{modalities.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Body region / test" required error={err.region} htmlFor="reg"><Input id="reg" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Lumbar spine" /></Field>
          <Field label="Study date" htmlFor="sd"><Input id="sd" type="date" max={DEMO_REFERENCE_DATE} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Reporting facility"><Select value={facility} onValueChange={setFacility}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{d.hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.shortName}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Findings" htmlFor="fi" className="sm:col-span-2"><Textarea id="fi" rows={3} value={findings} onChange={(e) => setFindings(e.target.value)} /></Field>
          <Field label="Impression" required error={err.impression} htmlFor="imp" className="sm:col-span-2"><Input id="imp" value={impression} onChange={(e) => setImpression(e.target.value)} /></Field>
          {defaultImageFor[modality] && <label className="sm:col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} className="size-4 accent-[var(--teal)]" /> Attach illustrative sample image ({imageAssets[defaultImageFor[modality] as keyof typeof imageAssets]?.caption})</label>}
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Save record</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { ImagingRecord }
