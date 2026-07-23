'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, File, Download, Trash2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { UploadDialog } from '@/components/resources/upload-dialog'
import { deleteResource } from './actions'
import { formatFileSize } from '@/lib/date-utils'
import type { Resource, Profile } from '@/lib/types'

function fileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return <FileText className="h-4 w-4 text-red-500 shrink-0" />
  if (['pptx', 'ppt'].includes(ext ?? ''))
    return <FileText className="h-4 w-4 text-orange-500 shrink-0" />
  if (['docx', 'doc'].includes(ext ?? ''))
    return <FileText className="h-4 w-4 text-sky-500 shrink-0" />
  return <File className="h-4 w-4 text-muted-foreground shrink-0" />
}

function ResourceCard({
  resource,
  signedUrl,
  canDelete,
  onDelete,
}: {
  resource: Resource & { profiles: Profile | null }
  signedUrl: string | null
  canDelete: boolean
  onDelete: () => void
}) {
  const date = new Date(resource.created_at).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const uploader = resource.profiles
  const uploaderName = uploader
    ? uploader.ops_name
      ? `${uploader.full_name} (${uploader.ops_name})`
      : uploader.full_name
    : 'Unknown'

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{fileIcon(resource.file_name)}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm leading-none truncate">{resource.title}</p>
                {resource.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {resource.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">{uploaderName}</span>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="text-xs text-muted-foreground">{date}</span>
                  {resource.file_size && (
                    <>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(resource.file_size)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {signedUrl && (
                  <a
                    href={signedUrl}
                    download={resource.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="sr-only">Download</span>
                  </a>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ResourcesClient({
  resources,
  signedUrls,
  currentUserId,
  isAdmin,
}: {
  resources: (Resource & { profiles: Profile | null })[]
  signedUrls: Record<string, string>
  currentUserId: string
  isAdmin: boolean
}) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const categories = ['All', ...Array.from(new Set(resources.map((r) => r.category))).sort()]
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered =
    activeCategory === 'All'
      ? resources
      : resources.filter((r) => r.category === activeCategory)

  const handleDelete = (id: string, filePath: string) => {
    startTransition(async () => {
      const result = await deleteResource(id, filePath)
      if (result.error) toast.error(result.error)
      else toast.success('File deleted')
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No resources yet. Upload the first one!
        </div>
      ) : (
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs h-7">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No files in this category.
                </p>
              ) : (
                filtered.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    signedUrl={signedUrls[resource.file_url] ?? null}
                    canDelete={resource.uploader_id === currentUserId || isAdmin}
                    onDelete={() => handleDelete(resource.id, resource.file_url)}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        userId={currentUserId}
      />
    </>
  )
}
