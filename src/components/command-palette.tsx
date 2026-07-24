'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, LayoutDashboard, CalendarRange, Users, Briefcase,
  BookOpen, FolderOpen, Settings, CornerDownLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    href: '/dashboard',    icon: LayoutDashboard },
  { id: 'parade-state', label: 'Parade State', href: '/parade-state', icon: CalendarRange },
  { id: 'directory',    label: 'Directory',    href: '/directory',    icon: Users },
  { id: 'roles',        label: 'Roles',        href: '/roles',        icon: Briefcase },
  { id: 'lessons',      label: 'Lessons',      href: '/lessons',      icon: BookOpen },
  { id: 'resources',    label: 'Resources',    href: '/resources',    icon: FolderOpen },
]

type ResultItem = {
  id: string
  label: string
  sub?: string
  href: string
  icon?: React.ElementType
  avatar?: string
  category: 'Navigate' | 'Members'
  flatIdx: number
}

export function CommandPalette({ profiles, isAdmin }: { profiles: Profile[]; isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // ⌘K + custom event trigger
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('cmd-palette-open', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('cmd-palette-open', onOpen)
    }
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setIdx(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // Build flat result list
  const q = query.toLowerCase()

  const navBase = [
    ...NAV_ITEMS,
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', href: '/admin', icon: Settings }] : []),
  ].filter(item => !q || item.label.toLowerCase().includes(q))

  const memberBase = q
    ? profiles.filter(p =>
        p.full_name?.toLowerCase().includes(q) ||
        p.ops_name?.toLowerCase().includes(q)
      ).slice(0, 5)
    : []

  const navResults: ResultItem[] = navBase.map((item, i) => ({
    ...item, category: 'Navigate', flatIdx: i,
  }))
  const memResults: ResultItem[] = memberBase.map((p, i) => ({
    id: p.id,
    label: p.ops_name || p.full_name || '?',
    sub: p.ops_name && p.full_name && p.ops_name !== p.full_name ? p.full_name : undefined,
    href: '/directory',
    avatar: (p.ops_name || p.full_name || '?')[0].toUpperCase(),
    category: 'Members',
    flatIdx: navResults.length + i,
  }))

  const total = navResults.length + memResults.length

  // Arrow-key + enter + escape navigation
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIdx(i => {
          const next = Math.min(i + 1, total - 1)
          scrollTo(next)
          return next
        })
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setIdx(i => {
          const next = Math.max(i - 1, 0)
          scrollTo(next)
          return next
        })
      }
      if (e.key === 'Enter') {
        const all = [...navResults, ...memResults]
        const item = all.find(r => r.flatIdx === idx)
        if (item) { router.push(item.href); setOpen(false) }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, navResults, memResults, idx, total, router])

  function scrollTo(i: number) {
    const items = listRef.current?.querySelectorAll('[data-result]')
    ;(items?.[i] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' })
  }

  function navigate(href: string) { router.push(href); setOpen(false) }

  function ResultRow({ item }: { item: ResultItem }) {
    const selected = item.flatIdx === idx
    return (
      <button
        data-result=""
        onMouseEnter={() => setIdx(item.flatIdx)}
        onClick={() => navigate(item.href)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
          selected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
        )}
      >
        {item.avatar ? (
          <span className={cn(
            'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
            selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            {item.avatar}
          </span>
        ) : item.icon ? (
          <span className={cn(
            'h-7 w-7 rounded-lg flex items-center justify-center shrink-0',
            selected ? 'bg-primary/15' : 'bg-muted'
          )}>
            <item.icon className="h-3.5 w-3.5" />
          </span>
        ) : null}

        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium truncate">{item.label}</span>
          {item.sub && (
            <span className="block text-xs text-muted-foreground truncate">{item.sub}</span>
          )}
        </span>

        {selected && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 opacity-50" />}
      </button>
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[18vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[520px] rounded-2xl bg-card border shadow-2xl overflow-hidden"
        style={{ animation: 'cmd-in 0.15s ease both' }}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 h-14 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setIdx(0) }}
            placeholder="Search or jump to..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center px-1.5 rounded border bg-muted text-[10px] font-mono text-muted-foreground/70">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[300px] overflow-y-auto p-2">
          {total === 0 && (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {navResults.length > 0 && (
            <div>
              <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                Navigate
              </p>
              <div className="space-y-0.5">
                {navResults.map(item => <ResultRow key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {memResults.length > 0 && (
            <div className="mt-1">
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                Members
              </p>
              <div className="space-y-0.5">
                {memResults.map(item => <ResultRow key={item.id} item={item} />)}
              </div>
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t bg-muted/30 text-[10px] text-muted-foreground/60 font-mono">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  )
}
