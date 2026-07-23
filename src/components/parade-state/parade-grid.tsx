'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { EditDialog } from './edit-dialog'
import {
  PARADE_STATUS_SHORT,
  PARADE_STATUS_COLORS,
  PARADE_STATUS_LABELS,
  type Profile,
  type ParadeStateEntry,
  type ParadeStatus,
} from '@/lib/types'
import {
  DAYS,
  formatWeekLabel,
  addWeeks,
  toWeekStartStr,
  parseWeekStart,
} from '@/lib/date-utils'

interface CellData {
  status: ParadeStatus
  notes: string | null
  entryId?: string
}

interface EditTarget {
  userId: string
  memberName: string
  dayOfWeek: number
  status: ParadeStatus
  notes: string
}

interface ParadeGridProps {
  profiles: Profile[]
  entries: ParadeStateEntry[]
  weekStart: string
  currentUserId: string
  isAdmin: boolean
}

export function ParadeGrid({
  profiles,
  entries,
  weekStart,
  currentUserId,
  isAdmin,
}: ParadeGridProps) {
  const router = useRouter()
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)

  const weekStartDate = parseWeekStart(weekStart)
  const weekLabel = formatWeekLabel(weekStartDate)

  // Build lookup: userId → dayOfWeek → CellData
  const lookup = new Map<string, Map<number, CellData>>()
  for (const e of entries) {
    if (!lookup.has(e.user_id)) lookup.set(e.user_id, new Map())
    lookup.get(e.user_id)!.set(e.day_of_week, {
      status: e.status as ParadeStatus,
      notes: e.notes,
      entryId: e.id,
    })
  }

  const navigateWeek = (delta: number) => {
    const next = addWeeks(weekStartDate, delta)
    router.push(`/parade-state?week=${toWeekStartStr(next)}`)
  }

  const openEdit = (member: Profile, day: number, cell: CellData | undefined) => {
    const canEdit = member.id === currentUserId || isAdmin
    if (!canEdit) return
    setEditTarget({
      userId: member.id,
      memberName: member.ops_name
        ? `${member.full_name} (${member.ops_name})`
        : member.full_name,
      dayOfWeek: day,
      status: cell?.status ?? 'in_camp',
      notes: cell?.notes ?? '',
    })
  }

  return (
    <TooltipProvider delay={200}>
      <div className="space-y-4">
        {/* Week navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:ml-1">Prev</span>
          </Button>
          <p className="text-sm font-medium text-center">{weekLabel}</p>
          <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
            <span className="sr-only md:not-sr-only md:mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-44 sticky left-0 bg-muted/40 z-10">
                  Member
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="text-center px-2 py-3 font-medium text-muted-foreground w-[calc((100%-176px)/7)]"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((member, idx) => {
                const memberCells = lookup.get(member.id)
                const canEdit = member.id === currentUserId || isAdmin
                return (
                  <tr
                    key={member.id}
                    className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                  >
                    {/* Name cell */}
                    <td className={`px-4 py-3 sticky left-0 z-10 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <div>
                        <p className="font-medium leading-none text-foreground">
                          {member.full_name}
                        </p>
                        {member.ops_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ({member.ops_name})
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Day cells */}
                    {DAYS.map((_, dayIdx) => {
                      const cell = memberCells?.get(dayIdx)
                      return (
                        <td key={dayIdx} className="px-1.5 py-2 text-center">
                          {cell ? (
                            <Tooltip>
                              <TooltipTrigger
                                onClick={() => openEdit(member, dayIdx, cell)}
                                disabled={!canEdit}
                                className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-opacity ${
                                  PARADE_STATUS_COLORS[cell.status]
                                } ${canEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                              >
                                {PARADE_STATUS_SHORT[cell.status]}
                                {cell.notes && (
                                  <FileText className="h-2.5 w-2.5 opacity-70" />
                                )}
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[200px]">
                                <p className="font-medium">{PARADE_STATUS_LABELS[cell.status]}</p>
                                {cell.notes && (
                                  <p className="text-xs opacity-80 mt-0.5">{cell.notes}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <button
                              onClick={() => openEdit(member, dayIdx, undefined)}
                              disabled={!canEdit}
                              className={`inline-flex items-center justify-center rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground/50 transition-colors ${
                                canEdit
                                  ? 'cursor-pointer hover:border-border hover:text-muted-foreground hover:bg-muted/50'
                                  : 'cursor-default'
                              }`}
                            >
                              —
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-1">
          {(Object.entries(PARADE_STATUS_LABELS) as [ParadeStatus, string][]).map(
            ([status, label]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium ${PARADE_STATUS_COLORS[status]}`}
                >
                  {PARADE_STATUS_SHORT[status]}
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Edit dialog */}
      {editTarget && (
        <EditDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          userId={editTarget.userId}
          memberName={editTarget.memberName}
          weekStart={weekStart}
          dayOfWeek={editTarget.dayOfWeek}
          initialStatus={editTarget.status}
          initialNotes={editTarget.notes}
        />
      )}
    </TooltipProvider>
  )
}
