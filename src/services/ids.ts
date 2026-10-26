export function newId(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}${rand}`
}

export function nextSequence(existing: string[], pattern: RegExp): number {
  let max = 0
  existing.forEach((s) => {
    const m = s.match(pattern)
    if (m) max = Math.max(max, Number(m[1]))
  })
  return max + 1
}
