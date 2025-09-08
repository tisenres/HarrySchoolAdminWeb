'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  BookOpen,
  Settings
} from 'lucide-react'
import type { Group } from '@/types/group'

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('groups')
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const groupId = params.id as string

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}`)
        if (response.ok) {
          const groupData = await response.json()
          setGroup(groupData)
        } else {
          setError('Group not found')
        }
      } catch (err) {
        setError('Failed to load group')
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      fetchGroup()
    }
  }, [groupId])

  const handleEdit = () => {
    router.push(`/en/groups?edit=${groupId}`)
  }

  const handleDelete = async () => {
    if (!group || !confirm('Are you sure you want to delete this group?')) return

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.push('/en/groups')
      } else {
        alert('Failed to delete group')
      }
    } catch (err) {
      alert('Failed to delete group')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h1 className="text-2xl font-bold text-muted-foreground">{error || 'Group not found'}</h1>
        <Button onClick={() => router.push('/en/groups')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/en/groups')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground">{group.group_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Group Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Subject</label>
              <p className="font-medium">{group.subject}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Level</label>
              <p className="font-medium">{group.level || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Capacity</label>
              <p className="font-medium">{group.max_students} students</p>
            </div>
          </div>
          {group.description && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="mt-1">{group.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
