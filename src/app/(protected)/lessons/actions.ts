'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addLesson(data: { title: string; content: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorised' }

  const { error } = await supabase.from('lessons').insert({
    author_id: user.id,
    title: data.title,
    content: data.content,
  })

  if (error) return { error: error.message }
  revalidatePath('/lessons')
  return { error: null }
}

export async function deleteLesson(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorised' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!lesson) return { error: 'Not found' }
  if (lesson.author_id !== user.id && !profile?.is_admin) return { error: 'Unauthorised' }

  const { error } = await supabase.from('lessons').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/lessons')
  return { error: null }
}
