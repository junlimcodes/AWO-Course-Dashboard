'use client'

import { useState } from 'react'
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
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/parade-state': 'Parade State',
  '/directory': 'Directory',
  '/roles': 'Roles & Responsibilities',
  '/lessons': 'Lessons Learned',
  '/resources': 'Resources',
  '/admin': 'Admin',
}

export function MobileHeader({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const title =
    Object.entries(PAGE_TITLES).find(([path]) =>
      path === '/dashboard' ? pathname === path : pathname.startsWith(path)
    )?.[1] ?? 'AWO Course'

  const initials = profile.ops_name
    ? profile.ops_name.slice(0, 2).toUpperCase()
    : profile.full_name.slice(0, 2).toUpperCase()

  return (
    <>
      <header className="flex md:hidden items-center h-14 px-4 border-b bg-background shrink-0 sticky top-0 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 mr-3"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
        <span className="font-semibold text-sm flex-1 truncate">{title}</span>
        <ThemeToggle />
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="px-4 h-14 border-b flex flex-row items-center space-y-0 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
                <Shield className="h-3.5 w-3.5 text-white dark:text-zinc-900" />
              </div>
              <SheetTitle className="text-sm font-semibold tracking-tight">
                AWO Course
              </SheetTitle>
            </div>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active =
                href === '/dashboard' ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
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
            })}

            {profile.is_admin && (
              <>
                <Separator className="my-2" />
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname.startsWith('/admin')
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  Admin
                </Link>
              </>
            )}
          </nav>

          <div className="p-3 border-t space-y-2">
            <div className="flex items-center gap-3 px-1">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-none">{profile.full_name}</p>
                {profile.ops_name && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    ({profile.ops_name}){profile.appointment ? ` · ${profile.appointment}` : ''}
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
        </SheetContent>
      </Sheet>
    </>
  )
}
