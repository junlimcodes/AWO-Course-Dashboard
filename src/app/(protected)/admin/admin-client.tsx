'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Plus, Loader2, KeyRound, Shield, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { createUser, updateUserAdmin, resetPassword } from './actions'
import type { Profile } from '@/lib/types'

const COMMON_APPOINTMENTS = [
  'Course IC',
  'Admin IC',
  'Sports IC',
  'Book In / Book Out IC',
  'Welfare IC',
  'Safety IC',
]

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [opsName, setOpsName] = useState('')
  const [appointment, setAppointment] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleCreate = () => {
    if (!username.trim() || !password || !fullName.trim()) {
      toast.error('Username, password and full name are required')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    startTransition(async () => {
      const result = await createUser({ username, password, fullName, opsName, appointment, isAdmin })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Account created for ${fullName}`)
        setUsername(''); setPassword(''); setFullName(''); setOpsName(''); setAppointment(''); setIsAdmin(false)
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input placeholder="e.g. johndoe" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="Min 8 chars" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input placeholder="e.g. John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ops Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input placeholder="e.g. JD" value={opsName} onChange={(e) => setOpsName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Appointment <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input list="appt-list" placeholder="e.g. Admin IC" value={appointment} onChange={(e) => setAppointment(e.target.value)} />
              <datalist id="appt-list">
                {COMMON_APPOINTMENTS.map((a) => <option key={a} value={a} />)}
              </datalist>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch id="is-admin" checked={isAdmin} onCheckedChange={setIsAdmin} />
            <Label htmlFor="is-admin" className="cursor-pointer">
              Grant admin access
              <span className="block text-xs text-muted-foreground font-normal">
                Admins can manage users, roles, and all parade state entries.
              </span>
            </Label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
}) {
  const [newPassword, setNewPassword] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleReset = () => {
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    startTransition(async () => {
      const result = await resetPassword(userId, newPassword)
      if (result.error) toast.error(result.error)
      else { toast.success(`Password reset for ${userName}`); setNewPassword(''); onOpenChange(false) }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Reset Password — {userName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input type="password" placeholder="Min 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleReset} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminClient({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<Profile | null>(null)
  const [isPending, startTransition] = useTransition()

  const toggleAdmin = (profile: Profile) => {
    startTransition(async () => {
      const result = await updateUserAdmin(profile.id, !profile.is_admin)
      if (result.error) toast.error(result.error)
      else toast.success(`${profile.full_name} is ${!profile.is_admin ? 'now' : 'no longer'} an admin`)
    })
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Course Members</CardTitle>
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {profiles.map((profile, idx) => {
                const initials = (profile.ops_name ?? profile.full_name).slice(0, 2).toUpperCase()
                const isSelf = profile.id === currentUserId
                return (
                  <div key={profile.id}>
                    {idx > 0 && <Separator />}
                    <div className="flex items-center gap-3 py-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium leading-none">
                            {profile.full_name}
                            {profile.ops_name && (
                              <span className="text-muted-foreground font-normal"> ({profile.ops_name})</span>
                            )}
                          </p>
                          {profile.is_admin && (
                            <Badge variant="secondary" className="text-xs py-0 h-4">Admin</Badge>
                          )}
                          {isSelf && (
                            <Badge variant="outline" className="text-xs py-0 h-4">You</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          @{profile.username}
                          {profile.appointment && ` · ${profile.appointment}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setResetTarget(profile)}
                          title="Reset password"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        {!isSelf && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleAdmin(profile)}
                            title={profile.is_admin ? 'Remove admin' : 'Make admin'}
                            disabled={isPending}
                          >
                            {profile.is_admin ? (
                              <ShieldOff className="h-3.5 w-3.5" />
                            ) : (
                              <Shield className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      {resetTarget && (
        <ResetPasswordDialog
          open={!!resetTarget}
          onOpenChange={(open) => !open && setResetTarget(null)}
          userId={resetTarget.id}
          userName={resetTarget.full_name}
        />
      )}
    </>
  )
}
