'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Medal, Award, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Achievement {
  id: string
  name: string
  description: string
  points_reward: number
  coins_reward: number
  icon_name?: string
  badge_color?: string
  is_active: boolean
}

interface User {
  id: string
  name: string
  userType: 'teacher' | 'student'
  points: number
  level: number
  coins: number
}

interface AwardAchievementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: User[]
  onSuccess?: () => void
}

export function AwardAchievementModal({ open, onOpenChange, users, onSuccess }: AwardAchievementModalProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedAchievement, setSelectedAchievement] = useState<string>('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [achievementsLoading, setAchievementsLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetchAchievements()
      // Reset form
      setSelectedAchievement('')
      setSelectedUsers([])
      setNotes('')
    }
  }, [open])

  const fetchAchievements = async () => {
    try {
      setAchievementsLoading(true)
      const response = await fetch('/api/achievements')
      const data = await response.json()
      
      if (data && data.achievements) {
        setAchievements(data.achievements.filter((a: Achievement) => a.is_active))
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
      toast.error('Failed to load achievements')
    } finally {
      setAchievementsLoading(false)
    }
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    setSelectedUsers(users.map(u => u.id))
  }

  const handleDeselectAll = () => {
    setSelectedUsers([])
  }

  const handleSubmit = async () => {
    if (!selectedAchievement) {
      toast.error('Please select an achievement')
      return
    }
    
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/achievements/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_ids: selectedUsers,
          achievement_id: selectedAchievement,
          notes: notes.trim() || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to award achievement')
      }

      toast.success(`Achievement awarded to ${result.awarded_count} user(s)`, {
        description: result.skipped_count > 0 
          ? `${result.skipped_count} user(s) already had this achievement`
          : undefined
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error awarding achievement:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to award achievement')
    } finally {
      setLoading(false)
    }
  }

  const selectedAchievementData = achievements.find(a => a.id === selectedAchievement)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5" />
            Award Achievement
          </DialogTitle>
          <DialogDescription>
            Select an achievement and users to award it to. Points and coins will be automatically added to their accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Achievement Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Achievement</label>
            <Select value={selectedAchievement} onValueChange={setSelectedAchievement}>
              <SelectTrigger>
                <SelectValue placeholder={achievementsLoading ? "Loading achievements..." : "Select an achievement"} />
              </SelectTrigger>
              <SelectContent>
                {achievements.map((achievement) => (
                  <SelectItem key={achievement.id} value={achievement.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{achievement.icon_name || '🏆'}</span>
                      <div>
                        <div className="font-medium">{achievement.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {achievement.points_reward} points • {achievement.coins_reward} coins
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedAchievementData && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{selectedAchievementData.icon_name || '🏆'}</span>
                  <div className="flex-1">
                    <h4 className="font-medium">{selectedAchievementData.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedAchievementData.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-yellow-600">
                        <Award className="h-3 w-3 mr-1" />
                        +{selectedAchievementData.points_reward} points
                      </Badge>
                      <Badge variant="outline" className="text-green-600">
                        +{selectedAchievementData.coins_reward} coins
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Users ({selectedUsers.length} selected)</label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                  disabled={users.length === 0}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeselectAll}
                  disabled={selectedUsers.length === 0}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            
            <ScrollArea className="max-h-60 border rounded-lg p-4">
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={user.id}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <label htmlFor={user.id} className="flex-1 flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {user.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {user.userType}
                            </Badge>
                            <span>Level {user.level}</span>
                            <span>•</span>
                            <span>{user.points} points</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
                
                {users.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No users available</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              placeholder="Add any notes about this achievement award..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !selectedAchievement || selectedUsers.length === 0}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Award Achievement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}