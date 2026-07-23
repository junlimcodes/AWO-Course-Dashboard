'use client'

import { useState, useRef, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { saveResourceMeta } from '@/app/(protected)/resources/actions'

const SUGGESTED_CATEGORIES = [
  'General',
  'ATC Notes',
  'ADW Notes',
  'ABM Notes',
  'Doctrine',
  'Procedures',
  'Exercises',
  'Admin',
]

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function UploadDialog({ open, onOpenChange, userId }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f && !title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
  }

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file'); return }
    if (!title.trim()) { toast.error('Please enter a title'); return }
    if (!category.trim()) { toast.error('Please enter a category'); return }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const filePath = `${userId}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file, { upsert: false })

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`)
        return
      }

      const result = await saveResourceMeta({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        filePath,
        fileName: file.name,
        fileSize: file.size,
      })

      if (result.error) {
        // Attempt cleanup
        await supabase.storage.from('resources').remove([filePath])
        toast.error(result.error)
      } else {
        toast.success('File uploaded!')
        setFile(null)
        setTitle('')
        setDescription('')
        setCategory('General')
        if (fileRef.current) fileRef.current.value = ''
        onOpenChange(false)
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Upload Resource</DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          {/* File picker */}
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-5 cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <>
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium truncate max-w-full">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Click to select a file</p>
                <p className="text-xs text-muted-foreground/70">PDF, PPTX, DOCX and more</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />

          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              placeholder="e.g. ATC Theory Week 3 Notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input
              list="category-suggestions"
              placeholder="e.g. ATC Notes"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <datalist id="category-suggestions">
              {SUGGESTED_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label>
              Description <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              placeholder="Brief description of what this file contains…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
