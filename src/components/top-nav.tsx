'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarRange, Users, Briefcase,
  BookOpen, FolderOpen, Settings, LogOut, Menu, Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { logout } from '@/app/(auth)/login/actions'
import { ThemeToggle } from '@/components/theme-toggle'
import type { Profile } from '@/lib/types'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/parade-state', label: 'Parade State', icon: CalendarRange },
  { href: '/directory', label: 'Directory', icon: Users },
  { href: '/roles', label: 'Roles', icon: Briefcase },
  { href: '/lessons', label: 'Lessons', icon: BookOpen },
  { href: '/resources', label: 'Resources', icon: FolderOpen },
]

function isActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href)
}

export function TopNav({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const allItems = [
    ...NAV_ITEMS,
    ...(profile.is_admin ? [{ href: '/admin', label: 'Admin', icon: Settings }] : []),
  ]

  const initials = (profile.ops_name || profile.full_name || '?').slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-sidebar/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-5 md:px-8 max-w-screen-xl mx-auto">

        {/* Logo */}
        <Link href="/dashboard" className="font-bold text-sm tracking-tight shrink-0 mr-2">
          AWO Course
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto">
          {allItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                isActive(pathname, href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop search trigger */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('cmd-palette-open'))}
          className="hidden md:flex items-center gap-2 ml-auto mr-2 h-8 rounded-lg border bg-muted/40 hover:bg-muted px-3 text-xs text-muted-foreground transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-1 inline-flex h-4 items-center gap-px rounded border bg-background px-1 text-[9px] font-mono text-muted-foreground/60">
            ⌘K
          </kbd>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Desktop: name + sign out */}
          <span className="hidden md:block text-sm font-medium text-foreground">
            {profile.ops_name || profile.full_name}
          </span>
          <form action={logout} className="hidden md:block">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </form>

          {/* Mobile: search + hamburger */}
          <button
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            onClick={() => window.dispatchEvent(new CustomEvent('cmd-palette-open'))}
          >
            <Search className="h-4 w-4 text-muted-foreground" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      {/* Mobile sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          <div className="flex items-center h-14 px-4 border-b shrink-0">
            <span className="font-bold text-sm tracking-tight">AWO Course</span>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {allItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive(pathname, href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t space-y-1">
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{profile.full_name}</p>
                {profile.ops_name && (
                  <p className="text-xs text-muted-foreground truncate">{profile.ops_name}</p>
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
    </header>
  )
}
