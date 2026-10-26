import type { AppNotification, FollowUp, Hospital, VisitType } from '@/types'
import { cases } from './surgeries'
import { addDays, createRng, pad } from './seed'

export const hospitals: Hospital[] = [
  { id: 'hosp-001', name: 'Serengeti Neuroscience Institute', shortName: 'Serengeti NI', location: 'Masaki Peninsula', city: 'Dar es Salaam', phone: '+255 22 000 1001', email: 'theatres@serengeti-ni.demo', type: 'specialist', theatres: 4, notes: 'Primary base. Dedicated neurosurgical theatre with intraoperative navigation and 5-ALA fluorescence microscope.' },
  { id: 'hosp-002', name: 'Bahari Teaching Hospital', shortName: 'Bahari TH', location: 'Upanga', city: 'Dar es Salaam', phone: '+255 22 000 1002', email: 'neurosurgery@bahari-th.demo', type: 'teaching', theatres: 12, notes: 'University-affiliated. Residents and registrars assist on elective lists.' },
  { id: 'hosp-003', name: 'Kilimani Trauma Centre', shortName: 'Kilimani TC', location: 'Kinondoni', city: 'Dar es Salaam', phone: '+255 22 000 1003', email: 'trauma@kilimani-tc.demo', type: 'regional', theatres: 8, notes: 'Level-1 trauma receiving centre; 24-hour CT and neuro-ICU.' },
  { id: 'hosp-004', name: 'Mount Meru Specialist Hospital', shortName: 'Mt Meru SH', location: 'Njiro', city: 'Arusha', phone: '+255 27 000 1004', email: 'surgery@mtmeru-sh.demo', type: 'private', theatres: 5, notes: 'Monthly visiting list for northern-zone patients; spinal instrumentation available.' },
  { id: 'hosp-005', name: 'Lakeview Regional Hospital', shortName: 'Lakeview RH', location: 'Nyamagana', city: 'Mwanza', phone: '+255 28 000 1005', email: 'theatres@lakeview-rh.demo', type: 'regional', theatres: 6, notes: 'Quarterly outreach list; MRI available on site.' },
  { id: 'hosp-006', name: 'Coral Coast Private Clinic', shortName: 'Coral Coast', location: 'Oyster Bay', city: 'Dar es Salaam', phone: '+255 22 000 1006', email: 'bookings@coralcoast.demo', type: 'private', theatres: 2, notes: 'Day-case and short-stay spinal surgery.' },
]

// ---------------------------------------------------------------------------
// Follow-up appointments
// ---------------------------------------------------------------------------

const TODAY = '2026-10-26'
const times = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00']

export const followUps: FollowUp[] = []
let n = 0

function push(f: Omit<FollowUp, 'id'>) {
  n += 1
  followUps.push({ id: `fu-${pad(n)}`, ...f })
}

cases
  .filter((c) => c.status === 'completed')
  .forEach((c) => {
    const seedIdx = Number(c.consultationId!.slice(5)) - 1
    const rng = createRng(4000 + seedIdx)
    const isBrain = c.type !== 'spine'
    const plan: [number, VisitType][] = [
      [14, 'wound-check'],
      [42, isBrain ? 'imaging-review' : 'postoperative-review'],
      [180, 'routine'],
    ]
    const unknown = c.outcome === 'unknown'
    const worse = c.outcome === 'deteriorated'
    plan.forEach(([days, visitType], k) => {
      const date = addDays(c.surgeryDate!, days)
      const time = times[(seedIdx + k * 3) % times.length]
      const past = date < TODAY
      let status: FollowUp['status'] = past ? 'completed' : 'scheduled'
      // Specific storylines
      if (unknown && k >= 1 && past) status = 'missed'
      if (seedIdx === 4 && k === 1) status = 'scheduled' // Samuel Ndlovu — overdue (date in past, still scheduled)
      if (seedIdx === 21 && k === 2 && past) status = 'missed'
      if (seedIdx === 7 && k === 2 && past) status = 'cancelled'
      if (seedIdx === 36 && k === 1) status = 'scheduled' // overdue
      if (seedIdx === 13 && k === 1 && past) status = 'missed'
      const completed = status === 'completed'
      const pain = isBrain ? null : Math.max(0, (c.spine!.painScore ?? 6) - 3 - k * 2)
      push({
        patientId: c.patientId,
        caseId: c.id,
        date,
        time,
        visitType,
        status,
        hospitalId: c.hospitalId,
        symptoms: completed ? (worse ? 'Persistent left-sided weakness; dysarthria improving slowly.' : k === 0 ? 'Wound discomfort only.' : isBrain ? 'No headache; no seizures.' : 'Residual mild back ache; leg pain resolved.') : undefined,
        neuroExam: completed ? (worse ? 'Left hemiplegia 2/5; left facial weakness.' : isBrain ? 'GCS 15; no focal deficit.' : 'Power 5/5 all limbs; reflexes symmetrical.') : undefined,
        painScore: completed ? pain : undefined,
        woundAssessment: completed ? (c.complications.some((x) => x.description.toLowerCase().includes('infection')) && k === 0 ? 'Erythema and serous ooze at the posterior wound; swab taken.' : 'Well healed.') : undefined,
        functionalRecovery: completed ? (worse ? 'Wheelchair dependent; rehabilitation ongoing.' : k === 0 ? 'Mobilising independently.' : k === 1 ? 'Returned to light duties.' : 'Full activities.') : undefined,
        imagingReview: completed && visitType === 'imaging-review' ? 'Post-operative imaging reviewed: satisfactory, no residual.' : undefined,
        complications: completed ? (c.complications.find((x) => x.date <= date && x.date > addDays(date, -45))?.description ?? 'None') : undefined,
        outcome: completed ? (worse ? 'deteriorated' : c.outcome === 'stable' ? 'stable' : 'improved') : undefined,
        plan: completed ? (k === 2 ? 'Discharged from routine follow-up; open access if symptoms recur.' : 'Continue recovery plan; next review as scheduled.') : undefined,
        nextFollowUpDate: completed && k < 2 ? addDays(c.surgeryDate!, plan[k + 1][0]) : undefined,
        requiresFurtherAssessment: completed ? worse || c.outcome === 'stable' : status === 'missed',
        notes: status === 'missed' ? 'Patient did not attend; two phone attempts unanswered.' : status === 'cancelled' ? 'Cancelled by patient — travelling; to rebook.' : undefined,
      })
      if (rng() < 0) return // keep rng referenced for deterministic future tweaks
    })
  })

// Today's and this-week appointments for scheduled/planned cases (pre-admission reviews)
cases
  .filter((c) => c.status === 'scheduled' && c.plannedDate)
  .forEach((c, i) => {
    const date = addDays(c.plannedDate!, -7)
    push({
      patientId: c.patientId, caseId: c.id, date: date < TODAY ? TODAY : date, time: times[(i * 2 + 1) % times.length], visitType: 'routine', status: 'scheduled', hospitalId: c.hospitalId,
      notes: 'Pre-admission review and consent.',
    })
  })

// A couple of urgent reviews for today
push({ patientId: 'pt-035', caseId: cases.find((c) => c.patientId === 'pt-035')!.id, date: TODAY, time: '11:30', visitType: 'urgent', status: 'scheduled', hospitalId: 'hosp-002', notes: 'New contralateral leg pain — MRI review.' })
push({ patientId: 'pt-037', caseId: cases.find((c) => c.patientId === 'pt-037' && c.reoperation)!.id, date: TODAY, time: '15:00', visitType: 'wound-check', status: 'scheduled', hospitalId: 'hosp-003', notes: 'Post re-drainage wound check and CT.' })

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notifications: AppNotification[] = [
  { id: 'ntf-001', title: 'Overdue follow-up', message: 'Samuel Ndlovu (NV-0005) — 6-week imaging review after MCA aneurysm clipping is overdue.', createdAt: '2026-10-26T07:30:00', type: 'warning', read: false, link: '/follow-ups' },
  { id: 'ntf-002', title: 'Surgery in 3 days', message: 'Fatma Rashid (NV-0006) — VP shunt insertion scheduled for 29 Oct at Bahari Teaching Hospital.', createdAt: '2026-10-26T07:00:00', type: 'info', read: false, link: '/cases' },
  { id: 'ntf-003', title: 'Draft operative report', message: 'Operative report for Robert Macha (posterior fixation, 13 Oct) is still in draft.', createdAt: '2026-10-25T18:10:00', type: 'warning', read: false, link: '/operative-reports' },
  { id: 'ntf-004', title: 'MDT outcome recorded', message: 'Emmanuel Shayo — neuro-oncology MDT recommends re-resection; case scheduled for 18 Nov.', createdAt: '2026-10-15T16:45:00', type: 'success', read: true, link: '/cases' },
  { id: 'ntf-005', title: 'Missed appointment', message: 'Grace Lumumba (NV-0004) did not attend her 6-week review. Outcome remains unrecorded.', createdAt: '2026-04-09T17:00:00', type: 'danger', read: true, link: '/follow-ups' },
  { id: 'ntf-006', title: 'Histopathology available', message: 'Amina Kessy — final histology: IDH-mutant diffuse astrocytoma, WHO grade 2.', createdAt: '2026-02-26T12:00:00', type: 'info', read: true, link: '/patients/pt-001' },
]
