import { jsPDF } from 'jspdf'
import autoTable, { type RowInput } from 'jspdf-autotable'
import * as XLSX from 'xlsx'

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function exportCsv(fileName: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
  download(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), fileName)
}

export function exportXlsx(fileName: string, sheets: { name: string; headers: string[]; rows: (string | number | null | undefined)[][] }[]) {
  const wb = XLSX.utils.book_new()
  sheets.forEach((s) => {
    const ws = XLSX.utils.aoa_to_sheet([s.headers, ...s.rows])
    ws['!cols'] = s.headers.map((h, i) => ({ wch: Math.min(60, Math.max(h.length, ...s.rows.map((r) => String(r[i] ?? '').length)) + 2) }))
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31))
  })
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  download(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName)
}

export interface PdfSection {
  heading?: string
  paragraphs?: string[]
  keyValues?: [string, string][]
  table?: { headers: string[]; rows: RowInput[] }
}

export interface PdfDocumentSpec {
  title: string
  subtitle?: string
  meta?: string[]
  sections: PdfSection[]
  footer: string
  watermark?: string
}

/** Builds a clinical-looking PDF entirely in the browser. */
export function buildPdf(spec: PdfDocumentSpec): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const margin = 16
  let y = margin

  // Header band
  doc.setFillColor(11, 20, 38)
  doc.rect(0, 0, W, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(spec.title, margin, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (spec.subtitle) doc.text(spec.subtitle, margin, 17)
  doc.setTextColor(22, 184, 166)
  doc.text('NeuroVault · Demo Mode — Fictional Clinical Data', W - margin, 11, { align: 'right' })
  doc.setTextColor(200, 210, 225)
  if (spec.meta) spec.meta.forEach((m, i) => doc.text(m, W - margin, 17 + i * 4.5, { align: 'right' }))
  y = 34
  doc.setTextColor(20, 20, 20)

  const ensure = (needed: number) => {
    if (y + needed > H - margin - 8) {
      doc.addPage()
      y = margin
    }
  }

  spec.sections.forEach((s) => {
    if (s.heading) {
      ensure(12)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(11, 20, 38)
      doc.text(s.heading.toUpperCase(), margin, y)
      doc.setDrawColor(22, 184, 166)
      doc.setLineWidth(0.5)
      doc.line(margin, y + 1.5, margin + 30, y + 1.5)
      y += 7
      doc.setTextColor(20, 20, 20)
    }
    if (s.keyValues) {
      doc.setFontSize(9)
      s.keyValues.forEach(([k, v]) => {
        const lines = doc.splitTextToSize(v || '—', W - margin * 2 - 45)
        ensure(lines.length * 4.5 + 2)
        doc.setFont('helvetica', 'bold')
        doc.text(k, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.text(lines, margin + 45, y)
        y += lines.length * 4.5 + 1.5
      })
      y += 2
    }
    if (s.paragraphs) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      s.paragraphs.forEach((p) => {
        const lines = doc.splitTextToSize(p || '—', W - margin * 2)
        ensure(lines.length * 4.6 + 3)
        doc.text(lines, margin, y)
        y += lines.length * 4.6 + 3
      })
    }
    if (s.table) {
      ensure(20)
      autoTable(doc, {
        startY: y,
        head: [s.table.headers],
        body: s.table.rows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 1.8, lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fillColor: [20, 36, 61], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [243, 246, 250] },
        theme: 'grid',
      })
      y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
      y += 8
    }
  })

  // Footer on every page
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setTextColor(120, 130, 150)
    doc.text(spec.footer, margin, H - 8)
    doc.text(`Page ${i} of ${pages}`, W - margin, H - 8, { align: 'right' })
    if (spec.watermark) {
      doc.saveGraphicsState()
      doc.setGState(doc.GState({ opacity: 0.06 }))
      doc.setFontSize(48)
      doc.setTextColor(11, 20, 38)
      doc.text(spec.watermark, W / 2, H / 2, { align: 'center', angle: 30 })
      doc.restoreGraphicsState()
    }
  }
  return doc
}

export function savePdf(spec: PdfDocumentSpec, fileName: string) {
  buildPdf(spec).save(fileName)
}

export function downloadText(fileName: string, text: string, mime = 'text/plain') {
  download(new Blob([text], { type: `${mime};charset=utf-8` }), fileName)
}

export function downloadDataUrl(fileName: string, dataUrl: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
}
