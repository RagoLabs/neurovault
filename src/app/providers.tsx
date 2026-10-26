import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useDemoStore } from '@/stores/demoStore'

export function Providers({ children }: { children: ReactNode }) {
  const theme = useDemoStore((s) => s.preferences.theme)
  return (
    <TooltipProvider delayDuration={200}>
      {children}
      <Toaster richColors closeButton position="bottom-right" theme={theme} toastOptions={{ className: 'font-sans' }} />
    </TooltipProvider>
  )
}
