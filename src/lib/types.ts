export type ParadeStatus = 'in_camp' | 'out_of_camp' | 'rso' | 'rsi' | 'medical_appt'

export const PARADE_STATUS_LABELS: Record<ParadeStatus, string> = {
  in_camp: 'In Camp',
  out_of_camp: 'Out of Camp',
  rso: 'RSO',
  rsi: 'RSI',
  medical_appt: 'Medical Appt',
}

export const PARADE_STATUS_SHORT: Record<ParadeStatus, string> = {
  in_camp: 'IC',
  out_of_camp: 'OOC',
  rso: 'RSO',
  rsi: 'RSI',
  medical_appt: 'MA',
}

export const PARADE_STATUS_COLORS: Record<ParadeStatus, string> = {
  in_camp: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  out_of_camp: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800',
  rso: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  rsi: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  medical_appt: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
}

export interface Profile {
  id: string
  username: string
  ops_name: string | null
  full_name: string
  appointment: string | null
  contact_number: string | null
  telegram: string | null
  whatsapp: string | null
  email: string | null
  is_admin: boolean
  created_at: string
}

export interface ParadeStateEntry {
  id: string
  user_id: string
  week_start: string
  day_of_week: number
  status: ParadeStatus
  notes: string | null
  updated_at: string
}

export interface CourseRole {
  id: string
  title: string
  description: string | null
  holder_id: string | null
  sort_order: number
  created_at: string
  profiles?: Profile | null
}

export interface Lesson {
  id: string
  author_id: string
  title: string
  content: string
  created_at: string
  profiles?: Profile | null
}

export interface Resource {
  id: string
  uploader_id: string
  title: string
  description: string | null
  category: string
  file_url: string
  file_name: string
  file_size: number | null
  created_at: string
  profiles?: Profile | null
}
