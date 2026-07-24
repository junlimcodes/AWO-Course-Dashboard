import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RolesClient } from './roles-client'
import { Briefcase } from 'lucide-react'

export const metadata: Metadata = { title: 'Roles & Responsibilities' }

export default async function RolesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: roles }, { data: profiles }] = await Promise.all([
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
    supabase
      .from('course_roles')
      .select('*, profiles(*)')
      .order('sort_order'),
    supabase.from('profiles').select('*').order('full_name'),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
          <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Responsibilities</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Course appointments and their responsibilities.</p>
        </div>
      </div>
      <RolesClient
        roles={(roles as any) ?? []}
        profiles={profiles ?? []}
        isAdmin={profile?.is_admin ?? false}
      />
    </div>
  )
}
