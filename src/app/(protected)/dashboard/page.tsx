import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { CalendarRange, Users, Briefcase, BookOpen, FolderOpen, ArrowRight } from 'lucide-react'
import { toWeekStartStr, toDayIndex } from '@/lib/date-utils'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()

  const [
    { data: profile },
    { data: profiles },
    { data: todayStates },
    { data: roles },
    { data: latestLessons },
    { data: resources },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('profiles').select('id, full_name, ops_name'),
    supabase
      .from('parade_state')
      .select('user_id, status')
      .eq('week_start', toWeekStartStr(today))
      .eq('day_of_week', toDayIndex(today)),
    supabase.from('course_roles').select('id, title, profiles(ops_name, full_name)').order('sort_order').limit(4),
    supabase.from('lessons').select('id, title, profiles(ops_name, full_name)').order('created_at', { ascending: false }).limit(1),
    supabase.from('resources').select('id, category'),
  ])

  if (!profile) redirect('/login')

  const totalMembers = profiles?.length ?? 0
  const counts: Record<string, number> = {}
  for (const s of todayStates ?? []) counts[s.status] = (counts[s.status] ?? 0) + 1
  const inCamp = counts['in_camp'] ?? 0
  const outOfCamp = counts['out_of_camp'] ?? 0
  const medical = (counts['rso'] ?? 0) + (counts['rsi'] ?? 0) + (counts['medical_appt'] ?? 0)
  const notUpdated = totalMembers - (todayStates?.length ?? 0)
  const accounted = totalMembers - notUpdated
  const pct = totalMembers > 0 ? Math.round((accounted / totalMembers) * 100) : 0

  const resourceCount = resources?.length ?? 0
  const categoryCount = new Set(resources?.map(r => r.category) ?? []).size

  const sgtHour = parseInt(
    new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', hour: 'numeric', hour12: false }).format(today)
  )
  const greeting = sgtHour < 12 ? 'Good morning' : sgtHour < 18 ? 'Good afternoon' : 'Good evening'
  const dateLabel = today.toLocaleDateString('en-SG', {
    timeZone: 'Asia/Singapore', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const weekday = today.toLocaleDateString('en-SG', { timeZone: 'Asia/Singapore', weekday: 'long' })

  const latestLesson = latestLessons?.[0] ?? null
  const lessonAuthor = (latestLesson?.profiles as { ops_name?: string; full_name?: string } | null)?.ops_name ?? 'Unknown'

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {profile.ops_name || profile.full_name}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Live</span>
        </div>
      </div>

      {/* Parade State — hero widget */}
      <Link href="/parade-state" className="group block">
        <Card className="transition-all group-hover:shadow-lg group-hover:-translate-y-0.5 cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                <CalendarRange className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Parade State</CardTitle>
                <p className="text-xs text-muted-foreground">Today · {weekday}</p>
              </div>
            </div>
            <CardAction>
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                View details <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* X / Y fraction */}
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tabular-nums leading-none">{inCamp}</span>
              <span className="text-2xl font-semibold text-muted-foreground tabular-nums">/ {totalMembers}</span>
              <span className="text-sm text-muted-foreground ml-1">in camp today</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{pct}% accounted for</p>
            </div>

            {/* Status chips */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                {inCamp} In Camp
              </span>
              {outOfCamp > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                  {outOfCamp} Out of Camp
                </span>
              )}
              {medical > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  {medical} Medical / RSO
                </span>
              )}
              {notUpdated > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                  {notUpdated} Not Updated
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Secondary widgets — 2x2 on mobile, 4-col on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Directory */}
        <Link href="/directory" className="group block">
          <Card className="h-full transition-all group-hover:shadow-md group-hover:-translate-y-0.5 cursor-pointer">
            <CardHeader>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
                <Users className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
              </div>
              <CardAction>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-2">
              <CardTitle className="text-base font-bold">Directory</CardTitle>
              <p className="text-3xl font-bold tabular-nums">{totalMembers}</p>
              <p className="text-xs text-muted-foreground">course members</p>
              <div className="flex -space-x-1.5 pt-1">
                {(profiles ?? []).slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/50 border-2 border-card flex items-center justify-center text-[9px] font-bold text-violet-700 dark:text-violet-300 uppercase"
                  >
                    {(p.ops_name || p.full_name || '?')[0]}
                  </div>
                ))}
                {totalMembers > 6 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                    +{totalMembers - 6}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Roles */}
        <Link href="/roles" className="group block">
          <Card className="h-full transition-all group-hover:shadow-md group-hover:-translate-y-0.5 cursor-pointer">
            <CardHeader>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                <Briefcase className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
              </div>
              <CardAction>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-2">
              <CardTitle className="text-base font-bold">Roles</CardTitle>
              {(roles ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No roles set up yet.</p>
              ) : (
                <ul className="space-y-1.5 pt-1">
                  {(roles ?? []).map((role) => {
                    const holder = role.profiles as { ops_name?: string; full_name?: string } | null
                    return (
                      <li key={role.id} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground truncate">{role.title}</span>
                        <span className="text-xs font-semibold shrink-0">
                          {holder ? (holder.ops_name || holder.full_name) : <span className="text-muted-foreground/40">TBC</span>}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Lessons */}
        <Link href="/lessons" className="group block">
          <Card className="h-full transition-all group-hover:shadow-md group-hover:-translate-y-0.5 cursor-pointer">
            <CardHeader>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <BookOpen className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardAction>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-2">
              <CardTitle className="text-base font-bold">Lessons Learned</CardTitle>
              {latestLesson ? (
                <div className="space-y-1 pt-1">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Latest gem</p>
                  <p className="text-sm font-medium line-clamp-3 leading-snug">{latestLesson.title}</p>
                  <p className="text-xs text-muted-foreground">— {lessonAuthor}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No lessons posted yet.</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Resources */}
        <Link href="/resources" className="group block">
          <Card className="h-full transition-all group-hover:shadow-md group-hover:-translate-y-0.5 cursor-pointer">
            <CardHeader>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900/40">
                <FolderOpen className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <CardAction>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-2">
              <CardTitle className="text-base font-bold">Resources</CardTitle>
              <p className="text-3xl font-bold tabular-nums">{resourceCount}</p>
              <p className="text-xs text-muted-foreground">
                {resourceCount === 0 ? 'No files yet' : `${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'}`}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
