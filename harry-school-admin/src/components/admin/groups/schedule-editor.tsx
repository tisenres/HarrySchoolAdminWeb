'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Clock } from 'lucide-react'
import type { ScheduleSlot } from '@/types/group'
import { DAYS_OF_WEEK } from '@/lib/validations/group'

interface ScheduleEditorProps {
  schedule: ScheduleSlot[]
  onChange: (schedule: ScheduleSlot[]) => void
  className?: string
  error?: string
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${minute}`
}).slice(16, 44) // 08:00 to 21:30

const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
} as const

export function ScheduleEditor({
  schedule,
  onChange,
  className,
  error
}: ScheduleEditorProps) {
  const [newSlot, setNewSlot] = useState<Partial<ScheduleSlot>>({})
  const [isAdding, setIsAdding] = useState(false)

  const addScheduleSlot = () => {
    if (newSlot.day && newSlot.start_time && newSlot.end_time) {
      const slot: ScheduleSlot = {
        day: newSlot.day,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        ...(newSlot.room?.trim() && { room: newSlot.room.trim() })
      }
      
      // Validate that end time is after start time
      const startTime = new Date(`2000-01-01 ${slot.start_time}`)
      const endTime = new Date(`2000-01-01 ${slot.end_time}`)
      
      if (endTime <= startTime) {
        return
      }

      // Check for conflicts
      const hasConflict = schedule.some(existing => 
        existing.day === slot.day && (
          (startTime < new Date(`2000-01-01 ${existing.end_time}`) &&
           new Date(`2000-01-01 ${existing.start_time}`) < endTime)
        )
      )

      if (hasConflict) {
        return
      }

      onChange([...schedule, slot])
      setNewSlot({})
      setIsAdding(false)
    }
  }

  const removeScheduleSlot = (index: number) => {
    const newSchedule = schedule.filter((_, i) => i !== index)
    onChange(newSchedule)
  }

  const updateScheduleSlot = (index: number, field: keyof ScheduleSlot, value: string) => {
    const newSchedule = [...schedule]
    const slot = { ...newSchedule[index] } as ScheduleSlot
    
    if (field === 'room') {
      const trimmedValue = value.trim()
      if (trimmedValue) {
        slot[field] = trimmedValue
      } else {
        delete slot[field]
      }
    } else {
      slot[field] = value as any
    }
    
    newSchedule[index] = slot
    onChange(newSchedule)
  }

  const getConflictError = () => {
    if (!newSlot.day || !newSlot.start_time || !newSlot.end_time) return null
    
    const startTime = new Date(`2000-01-01 ${newSlot.start_time}`)
    const endTime = new Date(`2000-01-01 ${newSlot.end_time}`)
    
    if (endTime <= startTime) {
      return 'End time must be after start time'
    }

    const hasConflict = schedule.some(existing => 
      existing.day === newSlot.day && (
        (startTime < new Date(`2000-01-01 ${existing.end_time}`) &&
         new Date(`2000-01-01 ${existing.start_time}`) < endTime)
      )
    )

    if (hasConflict) {
      return 'This time slot conflicts with existing schedule'
    }

    return null
  }

  const formatTimeSlot = (slot: ScheduleSlot) => {
    return `${slot.start_time}-${slot.end_time}${slot.room ? ` (${slot.room})` : ''}`
  }

  const getScheduleSummary = () => {
    const grouped = schedule.reduce((acc, slot) => {
      if (!acc[slot.day]) {
        acc[slot.day] = []
      }
      acc[slot.day]!.push(slot)
      return acc
    }, {} as Record<string, ScheduleSlot[]>)

    return Object.entries(grouped).map(([day, slots]) => (
      <div key={day} className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">
          {DAY_LABELS[day as keyof typeof DAY_LABELS]}
        </Badge>
        {slots.map((slot, index) => (
          <span key={index} className="text-sm text-muted-foreground">
            {formatTimeSlot(slot)}
          </span>
        ))}
      </div>
    ))
  }

  const conflictError = getConflictError()

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Class Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Schedule Display */}
        {schedule.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Schedule:</Label>
            <div className="space-y-2">
              {getScheduleSummary()}
            </div>
          </div>
        )}

        {/* Schedule Slots List */}
        {schedule.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Schedule Details:</Label>
            {schedule.map((slot, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border rounded-md">
                <Select
                  value={slot.day}
                  onValueChange={(value) => updateScheduleSlot(index, 'day', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day}>
                        {DAY_LABELS[day]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={slot.start_time}
                  onValueChange={(value) => updateScheduleSlot(index, 'start_time', value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-muted-foreground">to</span>

                <Select
                  value={slot.end_time}
                  onValueChange={(value) => updateScheduleSlot(index, 'end_time', value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Room (optional)"
                  value={slot.room || ''}
                  onChange={(e) => updateScheduleSlot(index, 'room', e.target.value)}
                  className="w-32"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeScheduleSlot(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Slot */}
        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Time Slot
          </Button>
        )}

        {isAdding && (
          <div className="space-y-3 p-3 border rounded-md bg-muted/50">
            <Label className="text-sm font-medium">Add New Time Slot</Label>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={newSlot.day || ''}
                onValueChange={(value) => setNewSlot(prev => ({ ...prev, day: value as any }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day} value={day}>
                      {DAY_LABELS[day]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newSlot.start_time || ''}
                onValueChange={(value) => setNewSlot(prev => ({ ...prev, start_time: value }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-muted-foreground text-sm">to</span>

              <Select
                value={newSlot.end_time || ''}
                onValueChange={(value) => setNewSlot(prev => ({ ...prev, end_time: value }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Room (optional)"
                value={newSlot.room || ''}
                onChange={(e) => setNewSlot(prev => ({ ...prev, room: e.target.value }))}
                className="w-32"
              />
            </div>

            {conflictError && (
              <p className="text-sm text-destructive">{conflictError}</p>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={addScheduleSlot}
                disabled={!newSlot.day || !newSlot.start_time || !newSlot.end_time || !!conflictError}
              >
                Add Slot
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewSlot({})
                  setIsAdding(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {schedule.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No schedule slots added yet. Click "Add Time Slot" to get started.
          </p>
        )}
      </CardContent>
    </Card>
  )
}