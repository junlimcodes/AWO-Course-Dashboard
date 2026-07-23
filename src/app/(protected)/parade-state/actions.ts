'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ParadeStatus } from '@/lib/types'

export async function upsertParadeState(data: {
  userId: string
  weekStart: string
  dayOfWeek: number
  status: ParadeStatus
  notes: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorised' }

  // Verify the user is editing their own entry or is admin
  if (data.userId !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) return { error: 'Unauthorised' }
  }

  const { error } = await supabase.from('parade_state').upsert(
    {
      user_id: data.userId,
      week_start: data.weekStart,
      day_of_week: data.dayOfWeek,
      status: data.status,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,week_start,day_of_week' }
  )

  if (error) return { error: error.message }

  revalidatePath('/parade-state')
  revalidatePath('/dashboard')
  return { error: null }
}
