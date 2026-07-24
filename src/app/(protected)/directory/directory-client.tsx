'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Phone, Send, MessageCircle, Mail, Pencil } from 'lucide-react'
import { EditProfileDialog } from '@/components/directory/edit-profile-dialog'
import type { Profile } from '@/lib/types'

function ContactRow({ icon: Icon, value, href }: { icon: React.ElementType; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-violet-400 dark:text-violet-500 shrink-0" />
      {href ? (
        <a href={href} className="text-foreground hover:text-violet-600 dark:hover:text-violet-400 hover:underline truncate transition-colors" target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      ) : (
        <span className="text-foreground truncate">{value}</span>
      )}
    </div>
  )
}

function MemberCard({ profile, isCurrentUser, onEdit, animDelay }: {
  profile: Profile
  isCurrentUser: boolean
  onEdit: () => void
  animDelay: number
}) {
  const initials = (profile.ops_name || profile.full_name).slice(0, 2).toUpperCase()
  const hasContacts = profile.contact_number || profile.telegram || profile.whatsapp || profile.email

  return (
    <div
      className={`rounded-3xl p-5 border transition-all hover:shadow-md ${
        isCurrentUser
          ? 'bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-700/50 ring-2 ring-violet-400/25'
          : 'bg-violet-50/50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-800/30'
      }`}
      style={{ animation: `fade-up 0.5s ease ${animDelay}s both` }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-violet-200 dark:bg-violet-800 flex items-center justify-center text-sm font-bold text-violet-800 dark:text-violet-100 shrink-0 uppercase">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-sm leading-none">{profile.full_name}</p>
              {profile.ops_name && (
                <p className="text-xs text-violet-500/80 dark:text-violet-400/70 mt-0.5">({profile.ops_name})</p>
              )}
            </div>
            {isCurrentUser && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40"
                onClick={onEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit profile</span>
              </Button>
            )}
          </div>

          {profile.appointment && (
            <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300">
              {profile.appointment}
            </span>
          )}

          {hasContacts && (
            <div className="mt-3 space-y-1.5">
              {profile.contact_number && (
                <ContactRow icon={Phone} value={profile.contact_number} href={`tel:${profile.contact_number}`} />
              )}
              {profile.telegram && (
                <ContactRow icon={Send} value={profile.telegram} href={`https://t.me/${profile.telegram.replace('@', '')}`} />
              )}
              {profile.whatsapp && (
                <ContactRow icon={MessageCircle} value={profile.whatsapp} />
              )}
              {profile.email && (
                <ContactRow icon={Mail} value={profile.email} href={`mailto:${profile.email}`} />
              )}
            </div>
          )}

          {!hasContacts && !isCurrentUser && (
            <p className="mt-2 text-xs text-violet-400/60 italic">No contact details yet</p>
          )}
          {!hasContacts && isCurrentUser && (
            <button
              onClick={onEdit}
              className="mt-2 text-xs text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 underline underline-offset-2 transition-colors"
            >
              Add your contact details →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function DirectoryClient({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {profiles.map((profile, idx) => (
          <MemberCard
            key={profile.id}
            profile={profile}
            isCurrentUser={profile.id === currentUserId}
            onEdit={() => setEditingProfile(profile)}
            animDelay={Math.min(idx * 0.06, 0.45)}
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
