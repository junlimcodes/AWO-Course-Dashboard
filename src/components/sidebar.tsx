'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarRange,
  Users,
  Briefcase,
  BookOpen,
  FolderOpen,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { logout } from '@/app/(auth)/login/actions'
import type { Profile } from '@/lib/types'
import { ThemeToggle } from '@/components/theme-toggle'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/parade-state', label: 'Parade State', icon: CalendarRange },
  { href: '/directory', label: 'Directory', icon: Users },
  { href: '/roles', label: 'Roles & Responsibilities', icon: Briefcase },
  { href: '/lessons', label: 'Lessons Learned', icon: BookOpen },
  { href: '/resources', label: 'Resources', icon: FolderOpen },
]

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}

function UserCard({ profile }: { profile: Profile }) {
  const initials = profile.ops_name
    ? profile.ops_name.slice(0, 2).toUpperCase()
    : profile.full_name.slice(0, 2).toUpperCase()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 px-1">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-none">
            {profile.full_name}
          </p>
          {(profile.ops_name || profile.appointment) && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {profile.ops_name && `(${profile.ops_name})`}
              {profile.ops_name && profile.appointment && ' · '}
              {profile.appointment}
            </p>
          )}
        </div>
      </div>
      <form action={logout}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground h-9"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </form>
    </div>
  )
}

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r bg-sidebar h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
          <Shield className="h-3.5 w-3.5 text-white dark:text-zinc-900" />
        </div>
        <span className="font-semibold text-sm tracking-tight">AWO Course</span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            }
          />
        ))}

        {profile.is_admin && (
          <>
            <Separator className="my-2" />
            <NavItem
              href="/admin"
              label="Admin"
              icon={Settings}
              active={pathname.startsWith('/admin')}
            />
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t">
        <UserCard profile={profile} />
      </div>
    </aside>
  )
}
