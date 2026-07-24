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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Loader2, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { addLesson, deleteLesson } from './actions'
import type { Lesson, Profile } from '@/lib/types'

function LessonCard({
  lesson,
  canDelete,
  onDelete,
  animDelay,
}: {
  lesson: Lesson & { profiles: Profile | null }
  canDelete: boolean
  onDelete: () => void
  animDelay: number
}) {
  const [expanded, setExpanded] = useState(false)
  const author = lesson.profiles
  const date = new Date(lesson.created_at).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div
      className="rounded-3xl p-5 border bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800/30 transition-all hover:shadow-md"
      style={{ animation: `fade-up 0.5s ease ${animDelay}s both` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
            <Lightbulb className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm leading-none">{lesson.title}</p>
            <p
              className={`mt-2 text-sm text-muted-foreground leading-relaxed ${
                !expanded ? 'line-clamp-3' : ''
              }`}
            >
              {lesson.content}
            </p>
            {lesson.content.length > 200 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-xs text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {author
                  ? author.ops_name
                    ? `${author.full_name} (${author.ops_name})`
                    : author.full_name
                  : 'Unknown'}
              </span>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <span className="text-xs text-muted-foreground">{date}</span>
            </div>
          </div>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

function AddLessonDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAdd = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Both title and content are required')
      return
    }
    startTransition(async () => {
      const result = await addLesson({ title: title.trim(), content: content.trim() })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Lesson added!')
        setTitle('')
        setContent('')
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share a Lesson Learned</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5 py-1">
          <div className="space-y-1.5">
            <Label>Title / Key Takeaway</Label>
            <Input
              placeholder="e.g. Always brief the crew at least 30 mins before…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Details</Label>
            <Textarea
              placeholder="Describe the situation, what happened, and what you learnt…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function LessonsClient({
  lessons,
  currentUserId,
  isAdmin,
}: {
  lessons: (Lesson & { profiles: Profile | null })[]
  currentUserId: string
  isAdmin: boolean
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteLesson(id)
      if (result.error) toast.error(result.error)
      else toast.success('Lesson removed')
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Share Lesson
        </Button>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No lessons shared yet. Be the first to add one!
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, idx) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              canDelete={lesson.author_id === currentUserId || isAdmin}
              onDelete={() => handleDelete(lesson.id)}
              animDelay={Math.min(idx * 0.06, 0.45)}
            />
          ))}
        </div>
      )}

      <AddLessonDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  )
}
