import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Download, FileImage, FileText, FolderOpen, Trash2, Upload, X } from 'lucide-react'
import { PageTransition } from '@/components/shared/PageTransition'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { PatientChip } from '@/components/shared/PatientChip'
import { EmptyState } from '@/components/shared/EmptyState'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PatientSelect } from '@/components/shared/PatientSelect'
import { KeyValue } from '@/components/shared/KeyValue'
import { useDataset, saveDocument, deleteDocument } from '@/services/repository'
import { fmtBytes, fmtDateTime, fullName } from '@/utils/format'
import { downloadText, downloadDataUrl, savePdf } from '@/utils/export'
import type { ClinicalDocument, DocumentCategory } from '@/types'
import { surgeon, brand } from '@/config/surgeon'
import { cn } from '@/lib/utils'

const categories: { value: DocumentCategory; label: string }[] = [
  { value: 'consultation', label: 'Consultation reports' }, { value: 'operative', label: 'Operative reports' }, { value: 'discharge', label: 'Discharge summaries' }, { value: 'imaging', label: 'Imaging reports' }, { value: 'laboratory', label: 'Laboratory reports' }, { value: 'follow-up', label: 'Follow-up reports' }, { value: 'other', label: 'Other clinical documents' },
]
const catVariant: Record<DocumentCategory, 'default' | 'info' | 'success' | 'lavender' | 'warning' | 'secondary' | 'outline'> = { consultation: 'info', operative: 'default', discharge: 'success', imaging: 'lavender', laboratory: 'warning', 'follow-up': 'secondary', other: 'outline' }

export function DocumentsPage() {
  const d = useDataset()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [openId, setOpenId] = useState<string | null>(params.get('open'))
  const [uploadOpen, setUploadOpen] = useState(false)
  const patientFilter = params.get('patient')
  useEffect(() => { if (params.get('open')) setOpenId(params.get('open')) }, [params])

  const docs = useMemo(() => d.documents.filter((x) => (cat === 'all' || x.category === cat) && (!patientFilter || x.patientId === patientFilter)).filter((x) => !q || `${x.title} ${x.fileName} ${x.description ?? ''} ${fullName(d.patients.find((p) => p.id === x.patientId))}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [d, cat, patientFilter, q])
  const counts = useMemo(() => Object.fromEntries(categories.map((c) => [c.value, d.documents.filter((x) => x.category === c.value && (!patientFilter || x.patientId === patientFilter)).length])), [d.documents, patientFilter])
  const current = d.documents.find((x) => x.id === openId)

  const download = (doc: ClinicalDocument) => {
    if (doc.dataUrl) downloadDataUrl(doc.fileName, doc.dataUrl)
    else if (doc.textContent) { if (doc.mimeType === 'application/pdf') { const lines = doc.textContent.split('\n'); savePdf({ title: doc.title, subtitle: doc.description, meta: [fmtDateTime(doc.createdAt)], sections: [{ paragraphs: lines.filter(Boolean) }], footer: `${brand.name} · ${brand.demoLabel} · ${surgeon.fullName}`, watermark: 'DEMO' }, doc.fileName) } else downloadText(doc.fileName, doc.textContent) }
    else { toast.error('No content available for this document') ; return }
    toast.success(`Downloading ${doc.fileName}`)
  }

  return (
    <PageTransition>
      <PageHeader title="Documents" description="Generated clinical documents and demo uploads, grouped by category." actions={<Button onClick={() => setUploadOpen(true)}><Upload /> Upload (demo)</Button>} />
      <div className="grid gap-5 lg:grid-cols-4">
        <aside className="surface h-fit p-2 lg:sticky lg:top-20">
          <button type="button" onClick={() => setCat('all')} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer', cat === 'all' ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-muted')}><span>All documents</span><span className="tabular-nums text-xs text-muted-foreground">{Object.values(counts).reduce((a, b) => a + b, 0)}</span></button>
          {categories.map((c) => <button key={c.value} type="button" onClick={() => setCat(c.value)} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer', cat === c.value ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-muted')}><span>{c.label}</span><span className="tabular-nums text-xs text-muted-foreground">{counts[c.value]}</span></button>)}
        </aside>
        <div className="surface lg:col-span-3">
          <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
            <SearchInput value={q} onChange={setQ} placeholder="Search title, file name, patient…" className="md:w-80" />
            {patientFilter && <Badge variant="info" className="normal-case tracking-normal font-medium">Patient: {fullName(d.patients.find((p) => p.id === patientFilter))} <button type="button" className="ml-1 cursor-pointer" onClick={() => setParams({}, { replace: true })} aria-label="Clear"><X className="size-3" /></button></Badge>}
            <span className="text-sm text-muted-foreground md:ml-auto">{docs.length} document{docs.length === 1 ? '' : 's'}</span>
          </div>
          {docs.length ? (
            <ul className="divide-y">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <button type="button" onClick={() => setOpenId(doc.id)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-muted/50 cursor-pointer">
                    <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', doc.mimeType.startsWith('image/') ? 'bg-lavender/15 text-indigo-600 dark:text-lavender' : 'bg-primary/10 text-primary')}>{doc.mimeType.startsWith('image/') ? <FileImage className="size-5" /> : <FileText className="size-5" />}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium">{doc.title}</span><span className="block truncate text-xs text-muted-foreground">{doc.fileName} · {fmtBytes(doc.sizeBytes)} · {fmtDateTime(doc.createdAt)}{doc.patientId ? ` · ${fullName(d.patients.find((p) => p.id === doc.patientId))}` : ''}</span></span>
                    <Badge variant={catVariant[doc.category]} className="hidden sm:inline-flex">{doc.category}</Badge>
                    {doc.source === 'uploaded' && <Badge variant="warning">upload</Badge>}
                  </button>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={FolderOpen} title="No documents" description="Generated documents appear here automatically; uploads are kept in this browser only." />}
        </div>
      </div>

      <Sheet open={!!current} onOpenChange={(o) => { if (!o) { setOpenId(null); if (params.get('open')) { const p = new URLSearchParams(params); p.delete('open'); setParams(p, { replace: true }) } } }}>
        <SheetContent className="w-[min(100%,44rem)]">
          {current && (
            <>
              <SheetHeader><SheetTitle className="pr-8">{current.title}</SheetTitle><SheetDescription>{current.fileName} · {fmtBytes(current.sizeBytes)}</SheetDescription></SheetHeader>
              <SheetBody className="space-y-4">
                {current.patientId && <PatientChip patientId={current.patientId} />}
                <KeyValue columns={2} items={[{ label: 'Category', value: <Badge variant={catVariant[current.category]}>{current.category}</Badge> }, { label: 'Source', value: current.source }, { label: 'Created', value: fmtDateTime(current.createdAt) }, { label: 'Type', value: current.mimeType }, { label: 'Description', value: current.description, span: true }]} />
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preview</div>
                  {current.dataUrl && current.mimeType.startsWith('image/') ? <img src={current.dataUrl} alt={current.title} className="max-h-96 w-full rounded-lg object-contain bg-black" /> : current.textContent ? <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-data text-xs leading-relaxed">{current.textContent}</pre> : current.dataUrl ? <p className="text-sm text-muted-foreground">Preview not available for this file type. Download to open.</p> : <p className="text-sm text-muted-foreground">Preview unavailable (file content was not persisted — see upload limitations).</p>}
                </div>
              </SheetBody>
              <SheetFooter>
                {current.source === 'uploaded' && <ConfirmDialog trigger={<Button variant="outline" className="text-destructive"><Trash2 /> Delete</Button>} title="Delete this document?" description="This removes the demo upload from the browser. This cannot be undone." confirmLabel="Delete" destructive onConfirm={() => { deleteDocument(current.id); setOpenId(null); toast.success('Document deleted') }} />}
                <Button onClick={() => download(current)}><Download /> Download</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} presetPatient={patientFilter ?? undefined} />
    </PageTransition>
  )
}

function UploadDialog({ open, onOpenChange, presetPatient }: { open: boolean; onOpenChange: (o: boolean) => void; presetPatient?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<DocumentCategory>('other')
  const [patientId, setPatientId] = useState(presetPatient ?? '')
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (!file) { toast.error('Choose a file first'); return }
    if (file.size > 4 * 1024 * 1024) { toast.error('Demo uploads are limited to 4 MB'); return }
    setBusy(true)
    const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file) })
    const text = file.type.startsWith('text/') ? await file.text() : undefined
    saveDocument({ patientId: patientId || undefined, category, title: title.trim() || file.name, fileName: file.name, mimeType: file.type || 'application/octet-stream', sizeBytes: file.size, createdAt: new Date().toISOString(), source: 'uploaded', description: 'Demo upload (stored in this browser only)', dataUrl, textContent: text })
    setBusy(false); setFile(null); setTitle(''); onOpenChange(false)
    toast.success('Document uploaded (demo)', { description: file.size > 200_000 ? 'Large file: preview is kept in memory for this session only.' : 'Stored in browser localStorage.' })
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload document (demo)</DialogTitle><DialogDescription>Nothing is sent to any server. Files are kept in this browser; files over 200 KB are not persisted across reloads.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <button type="button" onClick={() => inputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/40 cursor-pointer" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}>
            <Upload className="size-6" />{file ? <span className="font-medium text-foreground">{file.name} · {fmtBytes(file.size)}</span> : <span>Click or drop a file (PDF, image or text, max 4 MB)</span>}
          </button>
          <input ref={inputRef} type="file" className="hidden" accept=".pdf,image/*,text/plain,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Field label="Title" htmlFor="dtitle"><Input id="dtitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={file?.name ?? 'Document title'} /></Field>
          <Field label="Category"><Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Patient (optional)"><PatientSelect value={patientId} onChange={setPatientId} /></Field>
          <DemoNotice tone="warning">Demo limitation: uploads live in browser storage only and are removed by “Reset demo data”.</DemoNotice>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save} disabled={busy || !file}><Upload /> Upload</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
