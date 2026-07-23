import type { Metadata } from 'next'
import { Shield } from 'lucide-react'
import { LoginForm } from './login-form'
import { ThemeToggle } from '@/components/theme-toggle'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      {/* Theme toggle in corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm space-y-7">
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-zinc-900 dark:bg-zinc-100 shadow-md">
            <Shield className="h-7 w-7 text-white dark:text-zinc-900" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">AWO Course</h1>
            <p className="text-sm text-muted-foreground">
              Air Warfare Officer Course Portal
            </p>
          </div>
        </div>

        {/* Form */}
        <LoginForm />

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Contact your Course IC if you need access.
        </p>
      </div>
    </div>
  )
}
