'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, Loader2, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { upsertRole, deleteRole } from './actions'
import type { Profile, CourseRole } from '@/lib/types'

interface RolesClientProps {
  roles: (CourseRole & { profiles: Profile | null })[]
  profiles: Profile[]
  isAdmin: boolean
}

function RoleCard({
  role,
  isAdmin,
  onEdit,
  onDelete,
  animDelay,
}: {
  role: CourseRole & { profiles: Profile | null }
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
  animDelay: number
}) {
  const holder = role.profiles
  const initials = holder
    ? (holder.ops_name ?? holder.full_name).slice(0, 2).toUpperCase()
    : null

  return (
    <div
      className="rounded-3xl p-5 border bg-amber-50/50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-800/30 transition-all hover:shadow-md"
      style={{ animation: `fade-up 0.5s ease ${animDelay}s both` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-none">{role.title}</p>
          {role.description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {role.description}
            </p>
          )}
          <div className="mt-3">
            {holder ? (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-[10px] font-bold text-amber-800 dark:text-amber-100 shrink-0 uppercase">
                  {initials}
                </div>
                <span className="text-sm font-medium">
                  {holder.full_name}
                  {holder.ops_name && (
                    <span className="text-muted-foreground font-normal">
                      {' '}({holder.ops_name})
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserMinus className="h-4 w-4 text-amber-400/60" />
                <span className="text-sm text-amber-500/60 italic">Vacant</span>
              </div>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function RoleDialog({
  open,
  onOpenChange,
  role,
  profiles,
  maxOrder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: CourseRole & { profiles: Profile | null }
  profiles: Profile[]
  maxOrder: number
}) {
  const [title, setTitle] = useState(role?.title ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [holderId, setHolderId] = useState(role?.holder_id ?? '__vacant__')
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    if (!title.trim()) { toast.error('Title is required'); return }
    startTransition(async () => {
      const result = await upsertRole({
        id: role?.id,
        title: title.trim(),
        description: description.trim(),
        holderId: holderId === '__vacant__' ? null : holderId,
        sortOrder: role?.sort_order ?? maxOrder + 1,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(role ? 'Role updated' : 'Role added')
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Add Role'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5 py-1">
          <div className="space-y-1.5">
            <Label>Role Title</Label>
            <Input placeholder="e.g. Admin IC" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Responsibilities</Label>
            <Textarea
              placeholder="Describe the key responsibilities of this role…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Holder</Label>
            <Select value={holderId} onValueChange={(v) => setHolderId(v ?? '__vacant__')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__vacant__">— Vacant —</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}{p.ops_name ? ` (${p.ops_name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RolesClient({ roles, profiles, isAdmin }: RolesClientProps) {
  const [editingRole, setEditingRole] = useState<(CourseRole & { profiles: Profile | null }) | undefined>(undefined)
  const [addOpen, setAddOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteRole(id)
      if (result.error) toast.error(result.error)
      else toast.success('Role removed')
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        {isAdmin && (
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Role
          </Button>
        )}
      </div>

      {roles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No roles defined yet.{isAdmin && ' Add one above.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {roles.map((role, idx) => (
            <RoleCard
              key={role.id}
              role={role}
              isAdmin={isAdmin}
              onEdit={() => setEditingRole(role)}
              onDelete={() => handleDelete(role.id)}
              animDelay={Math.min(idx * 0.06, 0.45)}
            />
          ))}
        </div>
      )}

      <RoleDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        profiles={profiles}
        maxOrder={roles.length}
      />
      {editingRole && (
        <RoleDialog
          open={!!editingRole}
          onOpenChange={(open) => !open && setEditingRole(undefined)}
          role={editingRole}
          profiles={profiles}
          maxOrder={roles.length}
        />
      )}
    </>
  )
}
