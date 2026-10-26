import { useNavigate } from 'react-router'
import { Bell, CheckCheck } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useCollection, markNotificationRead, markAllNotificationsRead } from '@/services/repository'
import { fmtRelative } from '@/utils/format'
import { cn } from '@/lib/utils'

const tone = { info: 'bg-info', warning: 'bg-warning', success: 'bg-success', danger: 'bg-danger' }

export function NotificationCenter() {
  const items = useCollection('notifications')
  const unread = items.filter((n) => !n.read).length
  const navigate = useNavigate()
  const sorted = [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
          <Bell />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">Notifications</div>
          <Button variant="ghost" size="sm" onClick={markAllNotificationsRead} disabled={!unread}><CheckCheck /> Mark all read</Button>
        </div>
        <ul className="max-h-96 overflow-y-auto">
          {sorted.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => { markNotificationRead(n.id); if (n.link) navigate(n.link) }}
                className={cn('flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 cursor-pointer outline-none focus-visible:bg-muted', !n.read && 'bg-primary/5')}
              >
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', tone[n.type])} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm', !n.read && 'font-semibold')}>{n.title}</span>
                  <span className="block text-xs text-muted-foreground line-clamp-2">{n.message}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">{fmtRelative(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
          {!sorted.length && <li className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications</li>}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
