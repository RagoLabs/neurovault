import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-8 shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id="nv-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#16B8A6" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0B1426" />
      <path d="M20 44V20l24 24V20" fill="none" stroke="url(#nv-g)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="3.5" fill="#16B8A6" />
      <circle cx="44" cy="44" r="3.5" fill="#38BDF8" />
    </svg>
  )
}
