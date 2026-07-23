import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RolesClient } from './roles-client'

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roles & Responsibilities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Course appointments and their responsibilities.
        </p>
      </div>
      <RolesClient
        roles={(roles as any) ?? []}
        profiles={profiles ?? []}
        isAdmin={profile?.is_admin ?? false}
      />
    </div>
  )
}
