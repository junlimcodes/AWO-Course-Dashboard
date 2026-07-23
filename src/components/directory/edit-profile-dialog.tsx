'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/app/(protected)/directory/actions'
import type { Profile } from '@/lib/types'

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
}

export function EditProfileDialog({ open, onOpenChange, profile }: EditProfileDialogProps) {
  const [opsName, setOpsName] = useState(profile.ops_name ?? '')
  const [contactNumber, setContactNumber] = useState(profile.contact_number ?? '')
  const [telegram, setTelegram] = useState(profile.telegram ?? '')
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? '')
  const [email, setEmail] = useState(profile.email ?? '')
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateProfile({ opsName, contactNumber, telegram, whatsapp, email })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Profile updated')
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="ops-name">Ops Name / Callsign</Label>
            <Input
              id="ops-name"
              placeholder="e.g. JL"
              value={opsName}
              onChange={(e) => setOpsName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact">Contact Number</Label>
            <Input
              id="contact"
              placeholder="e.g. 9123 4567"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telegram">Telegram Handle</Label>
            <Input
              id="telegram"
              placeholder="e.g. @username"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input
              id="whatsapp"
              placeholder="e.g. +65 9123 4567"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Personal Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
