'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const INTERNAL_DOMAIN = 'awo-course.app'

export async function login(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const username = (formData.get('username') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Please enter your username and password.' }
  }

  const supabase = await createClient()
  const email = `${username}@${INTERNAL_DOMAIN}`

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid username or password. Please try again.' }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
