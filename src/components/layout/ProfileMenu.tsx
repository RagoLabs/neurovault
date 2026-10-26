import { useNavigate } from 'react-router'
import { BadgeCheck, LogOut, Settings, UserRound, RotateCcw, BookOpen } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { surgeon } from '@/config/surgeon'
import { useDemoStore } from '@/stores/demoStore'
import { toast } from 'sonner'

export function ProfileMenu() {
  const navigate = useNavigate()
  const setWelcomeSeen = useDemoStore((s) => s.setWelcomeSeen)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5 pr-2" aria-label="Surgeon profile menu">
          <Avatar className="size-7">
            <AvatarFallback className="bg-gradient-to-br from-teal to-cyan text-navy text-[11px]">{surgeon.initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium xl:inline">{surgeon.fullName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-semibold text-foreground">{surgeon.fullName}</div>
          <div className="text-xs">{surgeon.credentials}</div>
          <div className="text-xs">{surgeon.specialty}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/settings')}><UserRound /> Surgeon profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/settings?tab=professional')}><BadgeCheck /> Professional information</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/settings?tab=appearance')}><Settings /> Preferences</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setWelcomeSeen(false)}><BookOpen /> Show welcome &amp; tour</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/settings?tab=demo')}><RotateCcw /> Demo data management</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toast.info('Sign-out is not available in the demo', { description: 'No authentication backend exists in this frontend prototype.' })}><LogOut /> Sign out <span className="ml-auto text-[10px] uppercase text-muted-foreground">demo</span></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
