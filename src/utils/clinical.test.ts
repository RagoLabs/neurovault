import { describe, it, expect } from 'vitest'
import { computeGcs, computeOdi, deriveFollowUpStatus, motorDelta, caseFollowUpStatus } from './clinical'
import type { FollowUp, SurgicalCase } from '@/types'

describe('GCS', () => {
  it('sums complete components', () => {
    expect(computeGcs({ eye: 4, verbal: 5, motor: 6 })).toEqual({ total: 15, label: '15 (E4 V5 M6)', complete: true })
    expect(computeGcs({ eye: 1, verbal: 2, motor: 4 }).total).toBe(7)
  })
  it('never scores a not-testable component as 1', () => {
    const r = computeGcs({ eye: 1, verbal: null, motor: 4 })
    expect(r.total).toBeNull()
    expect(r.complete).toBe(false)
    expect(r.label).toBe('5T (E1 VNT M4)')
  })
  it('rejects out-of-range values', () => {
    expect(computeGcs({ eye: 5, verbal: 5, motor: 6 }).total).toBeNull()
  })
})

describe('ODI', () => {
  it('computes percentage from answered sections only', () => {
    expect(computeOdi([2, 2, 2, 2, 2, 2, 2, 2, 2, 2])).toBe(40)
    expect(computeOdi([5, 5, null, null, null, null, null, null, null, null])).toBe(100)
    expect(computeOdi(Array(10).fill(null))).toBeNull()
  })
})

describe('motor delta', () => {
  it('ignores untested limbs instead of treating them as change', () => {
    expect(motorDelta({ rightUpper: 4, leftUpper: 4, rightLower: 4, leftLower: 4 }, { rightUpper: 5, leftUpper: null, rightLower: 5, leftLower: 4 })).toBe(2)
    expect(motorDelta({ rightUpper: null, leftUpper: null, rightLower: null, leftLower: null }, { rightUpper: 5, leftUpper: 5, rightLower: 5, leftLower: 5 })).toBeNull()
  })
})

describe('follow-up status derivation', () => {
  const base: FollowUp = { id: 'f', patientId: 'p', caseId: 'c', date: '2026-10-20', time: '09:00', visitType: 'routine', status: 'scheduled', hospitalId: 'h' }
  const today = new Date('2026-10-26T09:00:00')
  it('marks past scheduled appointments overdue', () => {
    expect(deriveFollowUpStatus(base, today)).toBe('overdue')
    expect(deriveFollowUpStatus({ ...base, date: '2026-10-26' }, today)).toBe('today')
    expect(deriveFollowUpStatus({ ...base, date: '2026-11-02' }, today)).toBe('scheduled')
    expect(deriveFollowUpStatus({ ...base, status: 'missed' }, today)).toBe('missed')
  })
  it('derives case-level follow-up status', () => {
    const c = { id: 'c', status: 'completed' } as SurgicalCase
    expect(caseFollowUpStatus(c, [base], today)).toBe('overdue')
    expect(caseFollowUpStatus(c, [{ ...base, status: 'missed' }], today)).toBe('missed')
    expect(caseFollowUpStatus(c, [{ ...base, status: 'completed' }], today)).toBe('completed')
    expect(caseFollowUpStatus(c, [], today)).toBe('none')
  })
})
