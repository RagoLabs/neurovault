import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap [&>svg]:size-3 transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary dark:text-teal-300',
        secondary: 'border-transparent bg-muted text-muted-foreground',
        outline: 'border-border text-foreground',
        success: 'border-transparent bg-success/15 text-emerald-700 dark:text-emerald-300',
        warning: 'border-transparent bg-warning/15 text-amber-700 dark:text-amber-300',
        danger: 'border-transparent bg-danger/15 text-red-700 dark:text-red-300',
        info: 'border-transparent bg-info/15 text-sky-700 dark:text-sky-300',
        lavender: 'border-transparent bg-lavender/15 text-indigo-700 dark:text-indigo-300',
        navy: 'border-transparent bg-navy text-white dark:bg-slate-700',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
