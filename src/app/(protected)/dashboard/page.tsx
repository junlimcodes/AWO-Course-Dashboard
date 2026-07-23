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
    supabase
      .from('course_roles')
      .select('id, title, profiles(ops_name, full_name)')
      .order('sort_order')
      .limit(4),
    supabase
      .from('lessons')
      .select('id, title, profiles(ops_name, full_name)')
      .order('created_at', { ascending: false })
      .limit(1),
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

  const resourceCount = resources?.length ?? 0
  const categoryCount = new Set(resources?.map(r => r.category) ?? []).size

  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dateLabel = today.toLocaleDateString('en-SG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const latestLesson = latestLessons?.[0] ?? null
  const lessonAuthor = latestLesson
    ? ((latestLesson.profiles as { ops_name?: string; full_name?: string } | null)?.ops_name ?? 'Unknown')
    : null

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}, {profile.ops_name || profile.full_name}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{dateLabel}</p>
      </div>

      {/* Parade State — full-width widget */}
      <Link href="/parade-state" className="group block">
        <Card className="transition-colors group-hover:bg-accent/40 cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <CalendarRange className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Parade State</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Today&apos;s strength &middot; {today.toLocaleDateString('en-SG', { weekday: 'long' })}
                </p>
              </div>
            </div>
            <CardAction>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { label: 'In Camp', value: inCamp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60 ring-1 ring-emerald-200 dark:ring-emerald-900' },
                { label: 'Out of Camp', value: outOfCamp, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/60 ring-1 ring-sky-200 dark:ring-sky-900' },
                { label: 'Medical / RSO', value: medical, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/60 ring-1 ring-amber-200 dark:ring-amber-900' },
                { label: 'Not Updated', value: notUpdated, color: 'text-zinc-500 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800/60 ring-1 ring-zinc-200 dark:ring-zinc-700' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`rounded-lg p-3 text-center ${bg}`}>
                  <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Secondary widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Directory */}
        <Link href="/directory" className="group block">
          <Card className="h-full transition-colors group-hover:bg-accent/40 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <CardTitle className="text-sm font-semibold">Directory</CardTitle>
              </div>
              <CardAction>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5" />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-3xl font-bold tabular-nums">{totalMembers}</p>
                <p className="text-xs text-muted-foreground mt-0.5">course members</p>
              </div>
              <div className="flex -space-x-1.5">
                {(profiles ?? []).slice(0, 7).map((p) => (
                  <div
                    key={p.id}
                    className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-card flex items-center justify-center text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 uppercase"
                  >
                    {(p.ops_name || p.full_name || '?')[0]}
                  </div>
                ))}
                {totalMembers > 7 && (
                  <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-card flex items-center justify-center text-[10px] font-semibold text-zinc-500">
                    +{totalMembers - 7}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Roles */}
        <Link href="/roles" className="group block">
          <Card className="h-full transition-colors group-hover:bg-accent/40 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Briefcase className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <CardTitle className="text-sm font-semibold">Roles</CardTitle>
              </div>
              <CardAction>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5" />
              </CardAction>
            </CardHeader>
            <CardContent>
              {(roles ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No roles set up yet.</p>
              ) : (
                <ul className="space-y-2">
                  {(roles ?? []).map((role) => {
                    const holder = role.profiles as { ops_name?: string; full_name?: string } | null
                    return (
                      <li key={role.id} className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground truncate">{role.title}</span>
                        <span className="text-xs font-medium shrink-0">
                          {holder ? (holder.ops_name || holder.full_name) : <span className="text-muted-foreground/60">—</span>}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Lessons Learned */}
        <Link href="/lessons" className="group block">
          <Card className="h-full transition-colors group-hover:bg-accent/40 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <BookOpen className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <CardTitle className="text-sm font-semibold">Lessons Learned</CardTitle>
              </div>
              <CardAction>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5" />
              </CardAction>
            </CardHeader>
            <CardContent>
              {latestLesson ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium line-clamp-2 leading-snug">{latestLesson.title}</p>
                  <p className="text-xs text-muted-foreground">Latest gem &middot; {lessonAuthor}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No lessons posted yet.</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Resources */}
        <Link href="/resources" className="group block">
          <Card className="h-full transition-colors group-hover:bg-accent/40 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <FolderOpen className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <CardTitle className="text-sm font-semibold">Resources</CardTitle>
              </div>
              <CardAction>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{resourceCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {resourceCount === 0
                  ? 'No files uploaded yet'
                  : `${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'}`}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
