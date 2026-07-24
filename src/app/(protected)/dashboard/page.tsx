import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarRange, Users, Briefcase, BookOpen, FolderOpen, ArrowRight } from 'lucide-react'
import { toWeekStartStr, toDayIndex } from '@/lib/date-utils'
import { ParadeRing } from '@/components/dashboard/parade-ring'
import { CountUp } from '@/components/dashboard/count-up'

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
  const inCamp     = counts['in_camp'] ?? 0
  const outOfCamp  = counts['out_of_camp'] ?? 0
  const medical    = (counts['rso'] ?? 0) + (counts['rsi'] ?? 0) + (counts['medical_appt'] ?? 0)
  const notUpdated = totalMembers - (todayStates?.length ?? 0)
  const accounted  = totalMembers - notUpdated
  const pct        = totalMembers > 0 ? Math.round((accounted / totalMembers) * 100) : 0

  const resourceCount  = resources?.length ?? 0
  const categoryCount  = new Set(resources?.map(r => r.category) ?? []).size

  const sgtHour = parseInt(
    new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', hour: 'numeric', hour12: false }).format(today)
  )
  const greeting  = sgtHour < 12 ? 'Good morning' : sgtHour < 18 ? 'Good afternoon' : 'Good evening'
  const dateLabel = today.toLocaleDateString('en-SG', {
    timeZone: 'Asia/Singapore', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const weekday = today.toLocaleDateString('en-SG', { timeZone: 'Asia/Singapore', weekday: 'long' })

  const latestLesson = latestLessons?.[0] ?? null
  const lessonAuthor =
    (latestLesson?.profiles as { ops_name?: string; full_name?: string } | null)?.ops_name ??
    (latestLesson?.profiles as { ops_name?: string; full_name?: string } | null)?.full_name ??
    'Unknown'

  return (
    <div className="space-y-6">

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

      {/* Bento Grid */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">

        {/* ── Parade State — dark hero card ── */}
        <Link
          href="/parade-state"
          className="group block lg:w-[55%] lg:shrink-0"
          style={{ animation: 'fade-up 0.5s ease both' }}
        >
          <div
            className="h-full min-h-[320px] lg:min-h-[540px] rounded-3xl p-7 flex flex-col cursor-pointer transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1"
            style={{
              background: 'radial-gradient(ellipse at 18% 55%, oklch(0.34 0.16 168 / 0.85) 0%, oklch(0.15 0.04 240) 65%)',
            }}
          >
            {/* Card header */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <CalendarRange className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/90">Parade State</p>
                  <p className="text-xs text-white/40">Today · {weekday}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-white/40 group-hover:text-white/75 transition-colors">
                View details
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>

            {/* Ring — centred in remaining space */}
            <div className="flex-1 flex items-center justify-center py-6">
              <ParadeRing
                inCamp={inCamp}
                outOfCamp={outOfCamp}
                medical={medical}
                notUpdated={notUpdated}
                total={totalMembers}
                pct={pct}
              />
            </div>

            {/* Status chips */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-400/20 text-teal-200 border border-teal-400/20">
                {inCamp} In Camp
              </span>
              {outOfCamp > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/65 border border-white/10">
                  {outOfCamp} Out of Camp
                </span>
              )}
              {medical > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/65 border border-white/10">
                  {medical} Medical / RSO
                </span>
              )}
              {notUpdated > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/25 text-rose-300 border border-rose-400/20">
                  {notUpdated} Not Updated
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* ── Right 2×2 grid ── */}
        <div className="grid grid-cols-2 gap-4 lg:flex-1">

          {/* Directory — violet */}
          <Link
            href="/directory"
            className="group block"
            style={{ animation: 'fade-up 0.5s ease 0.1s both' }}
          >
            <div className="h-full min-h-[220px] rounded-3xl p-5 flex flex-col cursor-pointer transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02] bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800/30">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/60">
                <Users className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="mt-auto pt-4">
                <p className="text-[10px] font-bold text-violet-400 dark:text-violet-500 uppercase tracking-widest mb-1">Directory</p>
                <CountUp to={totalMembers} className="text-4xl font-bold tabular-nums text-violet-900 dark:text-violet-100" />
                <p className="text-xs text-violet-400/80 dark:text-violet-500/80 mt-0.5">course members</p>
                <div className="flex -space-x-1.5 mt-3">
                  {(profiles ?? []).slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="h-5 w-5 rounded-full bg-violet-200 dark:bg-violet-800 border-2 border-violet-50 dark:border-violet-950 flex items-center justify-center text-[8px] font-bold text-violet-700 dark:text-violet-300 uppercase"
                    >
                      {(p.ops_name || p.full_name || '?')[0]}
                    </div>
                  ))}
                  {totalMembers > 5 && (
                    <div className="h-5 w-5 rounded-full bg-violet-100 dark:bg-violet-900 border-2 border-violet-50 dark:border-violet-950 flex items-center justify-center text-[8px] font-bold text-violet-500">
                      +{totalMembers - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>

          {/* Roles — amber */}
          <Link
            href="/roles"
            className="group block"
            style={{ animation: 'fade-up 0.5s ease 0.15s both' }}
          >
            <div className="h-full min-h-[220px] rounded-3xl p-5 flex flex-col cursor-pointer transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02] bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-800/30">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/60">
                <Briefcase className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="mt-auto pt-4">
                <p className="text-[10px] font-bold text-amber-400 dark:text-amber-500 uppercase tracking-widest mb-2">Roles</p>
                {(roles ?? []).length === 0 ? (
                  <p className="text-xs text-amber-400/70">No roles set up yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {(roles ?? []).slice(0, 3).map((role) => {
                      const holder = role.profiles as { ops_name?: string; full_name?: string } | null
                      return (
                        <li key={role.id} className="flex items-center justify-between gap-1">
                          <span className="text-[11px] text-amber-700/70 dark:text-amber-300/60 truncate">{role.title}</span>
                          <span className="text-[11px] font-bold text-amber-900 dark:text-amber-100 shrink-0">
                            {holder ? (holder.ops_name || holder.full_name) : <span className="text-amber-400/50">—</span>}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </Link>

          {/* Lessons — emerald */}
          <Link
            href="/lessons"
            className="group block"
            style={{ animation: 'fade-up 0.5s ease 0.2s both' }}
          >
            <div className="h-full min-h-[220px] rounded-3xl p-5 flex flex-col cursor-pointer transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60">
                <BookOpen className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-auto pt-4">
                <p className="text-[10px] font-bold text-emerald-400 dark:text-emerald-500 uppercase tracking-widest mb-1">Lessons</p>
                {latestLesson ? (
                  <>
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 line-clamp-2 leading-snug">{latestLesson.title}</p>
                    <p className="text-xs text-emerald-500/80 dark:text-emerald-400/60 mt-1">— {lessonAuthor}</p>
                  </>
                ) : (
                  <p className="text-xs text-emerald-400/70">No lessons posted yet.</p>
                )}
              </div>
            </div>
          </Link>

          {/* Resources — sky */}
          <Link
            href="/resources"
            className="group block"
            style={{ animation: 'fade-up 0.5s ease 0.25s both' }}
          >
            <div className="h-full min-h-[220px] rounded-3xl p-5 flex flex-col cursor-pointer transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02] bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-800/30">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/60">
                <FolderOpen className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="mt-auto pt-4">
                <p className="text-[10px] font-bold text-sky-400 dark:text-sky-500 uppercase tracking-widest mb-1">Resources</p>
                <CountUp to={resourceCount} className="text-4xl font-bold tabular-nums text-sky-900 dark:text-sky-100" />
                <p className="text-xs text-sky-400/80 dark:text-sky-500/80 mt-0.5">
                  {resourceCount === 0 ? 'No files yet' : `${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'}`}
                </p>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  )
}
