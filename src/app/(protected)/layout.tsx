import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'
import { MobileHeader } from '@/components/mobile-header'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-background tactical-grid">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 min-w-0 overflow-auto">
        <MobileHeader profile={profile} />
        <main className="flex-1 p-5 md:p-7 max-w-screen-xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
