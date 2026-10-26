import { useLocation } from 'react-router'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from './Breadcrumbs'
import { GlobalSearch } from './GlobalSearch'
import { NotificationCenter } from './NotificationCenter'
import { ThemeToggle } from './ThemeToggle'
import { ProfileMenu } from './ProfileMenu'
import { QuickAdd } from './QuickAdd'
import { allNavItems, segmentLabels } from './nav'
import { brand } from '@/config/surgeon'
import { Badge } from '@/components/ui/badge'
import { useDemoStore } from '@/stores/demoStore'

function usePageTitle() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  if (!parts.length) return 'Dashboard'
  const nav = allNavItems.find((n) => n.to === `/${parts[0]}`)
  return nav?.label ?? segmentLabels[parts[0]] ?? 'NeuroVault'
}

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const title = usePageTitle()
  const showBanner = useDemoStore((s) => s.preferences.showDemoBanner)
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6 no-print">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation"><Menu /></Button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h2 className="truncate text-sm font-semibold md:text-base">{title}</h2>
          {showBanner && <Badge variant="warning" className="hidden sm:inline-flex normal-case tracking-normal font-medium">{brand.demoLabel}</Badge>}
        </div>
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <GlobalSearch />
        <QuickAdd />
        <NotificationCenter />
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  )
}
