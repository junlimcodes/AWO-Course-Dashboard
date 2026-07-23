'use client'

import { useState, useTransition } from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { upsertParadeState } from '@/app/(protected)/parade-state/actions'
import { PARADE_STATUS_LABELS, type ParadeStatus } from '@/lib/types'
import { DAYS } from '@/lib/date-utils'

interface EditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  memberName: string
  weekStart: string
  dayOfWeek: number
  initialStatus: ParadeStatus
  initialNotes: string
}

export function EditDialog({
  open,
  onOpenChange,
  userId,
  memberName,
  weekStart,
  dayOfWeek,
  initialStatus,
  initialNotes,
}: EditDialogProps) {
  const [status, setStatus] = useState<ParadeStatus>(initialStatus)
  const [notes, setNotes] = useState(initialNotes)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      const result = await upsertParadeState({
        userId,
        weekStart,
        dayOfWeek,
        status,
        notes,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Parade state updated')
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            {memberName} — {DAYS[dayOfWeek]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ParadeStatus)}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PARADE_STATUS_LABELS) as ParadeStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {PARADE_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="e.g. Medical appt at NUH, back by 1400"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
