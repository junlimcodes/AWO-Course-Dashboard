'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: 'Unauthorised' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return { supabase: null, error: 'Unauthorised' }
  return { supabase, error: null }
}

export async function upsertRole(data: {
  id?: string
  title: string
  description: string
  holderId: string | null
  sortOrder: number
}) {
  const { supabase, error } = await assertAdmin()
  if (error || !supabase) return { error }

  if (data.id) {
    const { error: err } = await supabase
      .from('course_roles')
      .update({
        title: data.title,
        description: data.description || null,
        holder_id: data.holderId || null,
        sort_order: data.sortOrder,
      })
      .eq('id', data.id)
    if (err) return { error: err.message }
  } else {
    const { error: err } = await supabase.from('course_roles').insert({
      title: data.title,
      description: data.description || null,
      holder_id: data.holderId || null,
      sort_order: data.sortOrder,
    })
    if (err) return { error: err.message }
  }

  revalidatePath('/roles')
  return { error: null }
}

export async function deleteRole(id: string) {
  const { supabase, error } = await assertAdmin()
  if (error || !supabase) return { error }
  const { error: err } = await supabase.from('course_roles').delete().eq('id', id)
  if (err) return { error: err.message }
  revalidatePath('/roles')
  return { error: null }
}
