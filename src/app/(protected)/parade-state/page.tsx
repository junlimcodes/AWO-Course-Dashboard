import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ParadeGrid } from '@/components/parade-state/parade-grid'
import { toWeekStartStr, parseWeekStart, toDayIndex } from '@/lib/date-utils'
import { PARADE_STATUS_COLORS, type ParadeStatus, type Profile, type ParadeStateEntry } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CalendarRange } from 'lucide-react'

export const metadata: Metadata = { title: 'Parade State' }

const STATUS_GROUPS: { status: ParadeStatus; label: string; dot: string }[] = [
  { status: 'in_camp', label: 'In Camp', dot: 'bg-emerald-500' },
  { status: 'out_of_camp', label: 'Out of Camp', dot: 'bg-sky-500' },
  { status: 'medical_appt', label: 'Medical Appt', dot: 'bg-violet-500' },
  { status: 'rsi', label: 'RSI', dot: 'bg-orange-500' },
  { status: 'rso', label: 'RSO', dot: 'bg-amber-500' },
]

export default async function ParadeStatePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { week } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()
  const currentWeekStart = toWeekStartStr(today)
  const todayDayIndex = toDayIndex(today)

  let weekStart: string
  if (week && /^\d{4}-\d{2}-\d{2}$/.test(week)) {
    weekStart = toWeekStartStr(parseWeekStart(week))
  } else {
    weekStart = currentWeekStart
  }

  const [{ data: profile }, { data: profiles }, { data: entries }] = await Promise.all([
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('parade_state').select('*').eq('week_start', weekStart),
  ])

  const isCurrentWeek = weekStart === currentWeekStart
  const todayEntries = (entries ?? []).filter((e: ParadeStateEntry) => e.day_of_week === todayDayIndex)
  const entryByUserId = new Map(todayEntries.map((e: ParadeStateEntry) => [e.user_id, e]))

  // Group profiles by today's status
  const grouped = new Map<ParadeStatus | 'not_updated', { profile: Profile; entry?: ParadeStateEntry }[]>()
  for (const p of profiles ?? []) {
    const entry = entryByUserId.get(p.id) as ParadeStateEntry | undefined
    const key: ParadeStatus | 'not_updated' = entry ? (entry.status as ParadeStatus) : 'not_updated'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push({ profile: p as Profile, entry })
  }

  const notUpdated = grouped.get('not_updated') ?? []
  const weekday = today.toLocaleDateString('en-SG', { timeZone: 'Asia/Singapore', weekday: 'long' })
  const todayLabel = today.toLocaleDateString('en-SG', {
    timeZone: 'Asia/Singapore', weekday: 'long', day: 'numeric', month: 'short',
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
          <CalendarRange className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parade State</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Click any cell in your row to update your status.</p>
        </div>
      </div>

      {/* Today's breakdown — only shown for current week */}
      {isCurrentWeek && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Today</h2>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm font-medium">{todayLabel}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {STATUS_GROUPS.map(({ status, label, dot }) => {
              const members = grouped.get(status) ?? []
              if (members.length === 0) return null
              return (
                <div
                  key={status}
                  className={cn(
                    'rounded-2xl p-4 border',
                    PARADE_STATUS_COLORS[status]
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
                    <span className="text-sm font-bold">{label}</span>
                    <span className="ml-auto text-sm font-bold">{members.length}</span>
                  </div>
                  <ul className="space-y-2">
                    {members.map(({ profile: p, entry }) => (
                      <li key={p.id}>
                        <p className="text-sm font-semibold">{p.ops_name || p.full_name}</p>
                        {entry?.notes && (
                          <p className="text-xs opacity-75 mt-0.5 leading-snug">{entry.notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}

            {/* Not Updated */}
            {notUpdated.length > 0 && (
              <div className="rounded-2xl p-4 border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-sm font-bold">Not Updated</span>
                  <span className="ml-auto text-sm font-bold">{notUpdated.length}</span>
                </div>
                <ul className="space-y-1.5">
                  {notUpdated.map(({ profile: p }) => (
                    <li key={p.id} className="text-sm font-semibold">
                      {p.ops_name || p.full_name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Weekly grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Weekly Grid</h2>
        <ParadeGrid
          profiles={profiles ?? []}
          entries={entries ?? []}
          weekStart={weekStart}
          currentUserId={user.id}
          isAdmin={profile?.is_admin ?? false}
        />
      </section>
    </div>
  )
}
