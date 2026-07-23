'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Phone, Send, MessageCircle, Mail, Pencil } from 'lucide-react'
import { EditProfileDialog } from '@/components/directory/edit-profile-dialog'
import type { Profile } from '@/lib/types'

function ContactRow({
  icon: Icon,
  value,
  href,
}: {
  icon: React.ElementType
  value: string
  href?: string
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      {href ? (
        <a href={href} className="text-foreground hover:underline truncate" target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      ) : (
        <span className="text-foreground truncate">{value}</span>
      )}
    </div>
  )
}

function MemberCard({
  profile,
  isCurrentUser,
  onEdit,
}: {
  profile: Profile
  isCurrentUser: boolean
  onEdit: () => void
}) {
  const initials = profile.ops_name
    ? profile.ops_name.slice(0, 2).toUpperCase()
    : profile.full_name.slice(0, 2).toUpperCase()

  const hasContacts =
    profile.contact_number || profile.telegram || profile.whatsapp || profile.email

  return (
    <Card className={isCurrentUser ? 'ring-2 ring-primary/20' : ''}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-sm leading-none">{profile.full_name}</p>
                {profile.ops_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">({profile.ops_name})</p>
                )}
              </div>
              {isCurrentUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={onEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit profile</span>
                </Button>
              )}
            </div>
            {profile.appointment && (
              <Badge variant="secondary" className="mt-2 text-xs font-normal">
                {profile.appointment}
              </Badge>
            )}
            {hasContacts && (
              <div className="mt-3 space-y-1.5">
                {profile.contact_number && (
                  <ContactRow
                    icon={Phone}
                    value={profile.contact_number}
                    href={`tel:${profile.contact_number}`}
                  />
                )}
                {profile.telegram && (
                  <ContactRow
                    icon={Send}
                    value={profile.telegram}
                    href={`https://t.me/${profile.telegram.replace('@', '')}`}
                  />
                )}
                {profile.whatsapp && (
                  <ContactRow
                    icon={MessageCircle}
                    value={profile.whatsapp}
                  />
                )}
                {profile.email && (
                  <ContactRow
                    icon={Mail}
                    value={profile.email}
                    href={`mailto:${profile.email}`}
                  />
                )}
              </div>
            )}
            {!hasContacts && !isCurrentUser && (
              <p className="mt-2 text-xs text-muted-foreground italic">No contact details yet</p>
            )}
            {!hasContacts && isCurrentUser && (
              <button
                onClick={onEdit}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Add your contact details →
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DirectoryClient({
  profiles,
  currentUserId,
}: {
  profiles: Profile[]
  currentUserId: string
}) {
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {profiles.map((profile) => (
          <MemberCard
            key={profile.id}
            profile={profile}
            isCurrentUser={profile.id === currentUserId}
            onEdit={() => setEditingProfile(profile)}
          />
        ))}
      </div>

      {editingProfile && editingProfile.id === currentUserId && (
        <EditProfileDialog
          open={!!editingProfile}
          onOpenChange={(open) => !open && setEditingProfile(null)}
          profile={editingProfile}
        />
      )}
    </>
  )
}
