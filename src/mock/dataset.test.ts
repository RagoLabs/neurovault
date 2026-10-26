import { describe, it, expect } from 'vitest'
import { initialDataset, validateDataset } from './index'

describe('mock dataset integrity', () => {
  it('has no referential errors', () => {
    const errors = validateDataset(initialDataset)
    expect(errors).toEqual([])
  })

  it('meets the requested record volumes', () => {
    expect(initialDataset.patients.length).toBeGreaterThanOrEqual(35)
    expect(initialDataset.cases.length).toBeGreaterThanOrEqual(45)
    expect(initialDataset.consultations.length).toBeGreaterThanOrEqual(25)
    expect(initialDataset.assessments.length).toBeGreaterThanOrEqual(35)
    expect(initialDataset.operativeReports.length).toBeGreaterThanOrEqual(25)
    expect(initialDataset.followUps.length).toBeGreaterThanOrEqual(40)
    expect(initialDataset.imaging.length).toBeGreaterThanOrEqual(20)
    expect(initialDataset.hospitals.length).toBeGreaterThanOrEqual(5)
  })

  it('contains the required mixture of case states', () => {
    const statuses = new Set(initialDataset.cases.map((c) => c.status))
    for (const s of ['planned', 'scheduled', 'completed', 'postponed', 'cancelled']) expect(statuses.has(s as never)).toBe(true)
    expect(initialDataset.followUps.some((f) => f.status === 'missed')).toBe(true)
    expect(initialDataset.cases.some((c) => c.outcome === 'unknown')).toBe(true)
    expect(initialDataset.cases.some((c) => c.complications.length > 0)).toBe(true)
  })

  it('numbers cases chronologically', () => {
    const created = initialDataset.cases.map((c) => c.createdAt)
    const sorted = [...created].sort()
    expect(created).toEqual(sorted)
  })
})
