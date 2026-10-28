import { NavLink, Link } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { navGroups } from './nav'
import { brand, surgeon } from '@/config/surgeon'
import { cn } from '@/lib/utils'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { Logo } from './Logo'

export function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Main navigation">
      {navGroups.map((group) => (
        <div key={group.label} className="mb-4">
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
                {group.label}
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && <div className="mx-3 mb-2 h-px bg-sidebar-border" />}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const link = (
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/85 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      collapsed && 'justify-center px-0',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary" />}
                      <item.icon className={cn('size-[18px] shrink-0 transition-colors', isActive ? 'text-primary' : 'text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground')} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              )
              return (
                <li key={item.to}>
                  {collapsed ? <SimpleTooltip label={item.label} side="right">{link}</SimpleTooltip> : link}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion()
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 264 }}
      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 32 }}
      className="relative hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex sticky top-0 z-30"
    >
      <div className={cn('flex h-16 items-center gap-3 border-b border-sidebar-border px-4', collapsed && 'justify-center px-0')}>
        <Link to="/" className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-lg">
          <Logo className="size-9" />
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-semibold text-sidebar-foreground tracking-tight">{brand.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-sidebar-muted">{surgeon.shortName}'s practice</div>
            </div>
          )}
        </Link>
      </div>
      <SidebarNav collapsed={collapsed} />
      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={onToggle}
          className={cn('flex h-9 w-full items-center gap-2 rounded-lg px-3 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/60', collapsed && 'justify-center px-0')}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /> Collapse</>}
        </button>
      </div>
    </motion.aside>
  )
}
