/**
 * Fixed demo reference date. All "today", overdue and upcoming calculations
 * in the mock dataset are anchored to this date so the demo stays coherent
 * regardless of when it is opened. Switch `useLiveClock` to true to use the
 * real system clock instead.
 */
export const DEMO_REFERENCE_DATE = '2026-10-26'
export const useLiveClock = false

export function demoToday(): Date {
  if (useLiveClock) return new Date()
  const d = new Date(`${DEMO_REFERENCE_DATE}T09:30:00`)
  return d
}
