import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AnimatePresence } from 'motion/react'
import { Sidebar, SidebarNav } from './Sidebar'
import { Topbar } from './Topbar'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Logo } from './Logo'
import { brand, surgeon } from '@/config/surgeon'
import { WelcomeDialog } from './WelcomeDialog'
import { DemoTour } from './DemoTour'
import { useTheme } from '@/hooks/useTheme'
import { useDemoStore } from '@/stores/demoStore'
import { cn } from '@/lib/utils'

const COLLAPSE_KEY = 'neurovault.sidebar.collapsed'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1' } catch { return false }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  useTheme()
  const density = useDemoStore((s) => s.preferences.density)
  const reducedMotion = useDemoStore((s) => s.preferences.reducedMotion)

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0') } catch { /* ignore */ }
  }, [collapsed])

  useEffect(() => {
    document.documentElement.dataset.density = density
    document.documentElement.classList.toggle('motion-reduce', reducedMotion)
  }, [density, reducedMotion])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="bg-sidebar text-sidebar-foreground p-0 gap-0 border-sidebar-border">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main application navigation</SheetDescription>
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
            <Logo className="size-9" />
            <div className="leading-tight">
              <div className="font-semibold text-sidebar-foreground">{brand.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-sidebar-muted">{surgeon.shortName}'s practice</div>
            </div>
          </div>
          <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
        <main className={cn('flex-1 overflow-x-clip px-4 py-6 md:px-6 lg:px-8', density === 'compact' && 'py-4 text-[13px]')}>
          <div className="mx-auto w-full max-w-[1500px]">
            <AnimatePresence mode="wait" initial={false}>
              <Outlet key={location.pathname.split('/').slice(0, 2).join('/')} />
            </AnimatePresence>
          </div>
        </main>
        <footer className="border-t px-6 py-3 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2 no-print">
          <span>{brand.name} {brand.version} · {brand.demoLabel}</span>
          <span>Imagery: see public/images/ATTRIBUTION.md · No real patient data</span>
        </footer>
      </div>
      <WelcomeDialog />
      <DemoTour />
    </div>
  )
}
