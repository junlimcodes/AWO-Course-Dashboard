import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopNav } from '@/components/top-nav'
import { CommandPalette } from '@/components/command-palette'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: allProfiles }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('profiles').select('id, full_name, ops_name').order('full_name'),
  ])

  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <TopNav profile={profile} />
      <main className="p-5 md:p-8 max-w-screen-xl w-full mx-auto">
        {children}
      </main>
      <CommandPalette profiles={allProfiles ?? []} isAdmin={profile.is_admin ?? false} />
    </div>
  )
}
