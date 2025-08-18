'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Settings,
  Search,
  Filter,
  Plus,
  Edit,
  Archive,
  RotateCcw,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
  Star,
  Trophy,
  Target,
  Zap,
  BookOpen,
  Clock,
  Award,
  Calendar,
  TrendingUp,
  Copy
} from 'lucide-react'
import type { Achievement } from '@/types/ranking'
import { AchievementForm } from './achievement-form'
import { achievementService } from '@/lib/services/achievement-service'

export function AchievementManagement() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null)
  const [deletingAchievement, setDeletingAchievement] = useState<Achievement | null>(null)

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    try {
      setLoading(true)
      const { achievements } = await achievementService.getAchievements({ status: 'all' })
      setAchievements(achievements)
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter achievements based on search and filters
  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = searchTerm === '' || 
      achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      achievement.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || achievement.achievement_type === typeFilter
    
    const matchesStatus = (() => {
      switch (statusFilter) {
        case 'active': return achievement.is_active && !achievement.deleted_at
        case 'inactive': return !achievement.is_active && !achievement.deleted_at
        case 'archived': return !!achievement.deleted_at
        case 'all': return true
        default: return true
      }
    })()

    return matchesSearch && matchesType && matchesStatus
  })

  // Get unique achievement types for filter
  const achievementTypes = [...new Set(achievements.map(a => a.achievement_type))]

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'homework': return <BookOpen className="h-4 w-4" />
      case 'attendance': return <Clock className="h-4 w-4" />
      case 'behavior': return <Star className="h-4 w-4" />
      case 'streak': return <Zap className="h-4 w-4" />
      case 'milestone': return <Target className="h-4 w-4" />
      case 'special': return <Trophy className="h-4 w-4" />
      default: return <Award className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getAchievementRarity = (type: string) => {
    switch (type) {
      case 'special': return { 
        label: 'Legendary', 
        color: 'bg-purple-100 text-purple-800 border-purple-200'
      }
      case 'milestone': return { 
        label: 'Epic', 
        color: 'bg-orange-100 text-orange-800 border-orange-200'
      }
      case 'streak': return { 
        label: 'Rare', 
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      }
      default: return { 
        label: 'Common', 
        color: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }
  }

  const handleToggleStatus = async (achievement: Achievement) => {
    try {
      setLoading(true)
      const updatedAchievement = await achievementService.toggleAchievementStatus(
        achievement.id, 
        !achievement.is_active
      )
      
      setAchievements(prev => prev.map(a => 
        a.id === achievement.id ? updatedAchievement : a
      ))
    } catch (error) {
      console.error('Error toggling achievement status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (achievement: Achievement) => {
    try {
      setLoading(true)
      await achievementService.archiveAchievement(achievement.id)
      await loadAchievements() // Reload to get updated list
    } catch (error) {
      console.error('Error archiving achievement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (achievement: Achievement) => {
    try {
      setLoading(true)
      const restoredAchievement = await achievementService.restoreAchievement(achievement.id)
      
      setAchievements(prev => prev.map(a => 
        a.id === achievement.id ? restoredAchievement : a
      ))
    } catch (error) {
      console.error('Error restoring achievement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingAchievement) return
    
    try {
      setLoading(true)
      await achievementService.deleteAchievement(deletingAchievement.id)
      
      setAchievements(prev => prev.filter(a => a.id !== deletingAchievement.id))
      setDeletingAchievement(null)
    } catch (error) {
      console.error('Error deleting achievement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (achievement: Achievement) => {
    try {
      setLoading(true)
      const duplicatedAchievement = await achievementService.duplicateAchievement(achievement.id)
      
      setAchievements(prev => [duplicatedAchievement, ...prev])
    } catch (error) {
      console.error('Error duplicating achievement:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAchievementStats = () => {
    const total = achievements.filter(a => !a.deleted_at).length
    const active = achievements.filter(a => a.is_active && !a.deleted_at).length
    const inactive = achievements.filter(a => !a.is_active && !a.deleted_at).length
    const archived = achievements.filter(a => a.deleted_at).length

    return { total, active, inactive, archived }
  }

  const stats = getAchievementStats()

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Achievement Management</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Create, edit, and manage achievement settings
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Achievement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <div className="text-sm text-muted-foreground">Inactive</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.archived}</div>
              <div className="text-sm text-muted-foreground">Archived</div>
            </div>
          </div>

          <Separator />

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search achievements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {achievementTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Achievement Table */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Achievement</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rewards</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAchievements.map((achievement) => {
                      const rarity = getAchievementRarity(achievement.achievement_type)
                      const isArchived = !!achievement.deleted_at

                      return (
                        <tr
                          key={achievement.id}
                          className={isArchived ? 'opacity-60' : ''}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                style={{ backgroundColor: achievement.badge_color || '#4F7942' }}
                              >
                                {achievement.icon_name || '🏆'}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-medium truncate">
                                  {achievement.name}
                                </h4>
                                {achievement.description && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {achievement.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getAchievementIcon(achievement.achievement_type)}
                              <div>
                                <div className="capitalize text-sm">
                                  {achievement.achievement_type}
                                </div>
                                <Badge className={`${rarity.color} text-xs`}>
                                  {rarity.label}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-4 text-sm">
                              {achievement.points_reward > 0 && (
                                <div className="flex items-center space-x-1 text-yellow-600">
                                  <Star className="h-3 w-3" />
                                  <span>+{achievement.points_reward}</span>
                                </div>
                              )}
                              {achievement.coins_reward > 0 && (
                                <div className="flex items-center space-x-1 text-green-600">
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                  <span>+{achievement.coins_reward}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {isArchived ? (
                                <Badge variant="destructive">Archived</Badge>
                              ) : (
                                <Badge variant={achievement.is_active ? "default" : "secondary"}>
                                  {achievement.is_active ? "Active" : "Inactive"}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(achievement.created_at)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                {!isArchived ? (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => setEditingAchievement(achievement)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem
                                      onClick={() => handleDuplicate(achievement)}
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem
                                      onClick={() => handleToggleStatus(achievement)}
                                      disabled={loading}
                                    >
                                      {loading ? (
                                        <>
                                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                                          Processing...
                                        </>
                                      ) : achievement.is_active ? (
                                        <>
                                          <EyeOff className="h-4 w-4 mr-2" />
                                          Deactivate
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Activate
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuSeparator />
                                    
                                    <DropdownMenuItem
                                      onClick={() => handleArchive(achievement)}
                                      disabled={loading}
                                      className="text-orange-600"
                                    >
                                      {loading ? (
                                        <>
                                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                                          Archiving...
                                        </>
                                      ) : (
                                        <>
                                          <Archive className="h-4 w-4 mr-2" />
                                          Archive
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleRestore(achievement)}
                                      className="text-green-600"
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Restore
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuSeparator />
                                    
                                    <DropdownMenuItem
                                      onClick={() => setDeletingAchievement(achievement)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Permanently
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </tr>
                      )
                    })}
                </TableBody>
              </Table>

              {filteredAchievements.length === 0 && (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No achievements found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'active'
                      ? 'Try adjusting your filters to see more results.'
                      : 'Create your first achievement to get started.'}
                  </p>
                  {(searchTerm || typeFilter !== 'all' || statusFilter !== 'active') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('')
                        setTypeFilter('all')
                        setStatusFilter('active')
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Achievement Form */}
      <AchievementForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        mode="create"
        onSuccess={() => {
          setShowCreateForm(false)
          loadAchievements()
        }}
      />

      {/* Edit Achievement Form */}
      <AchievementForm
        open={!!editingAchievement}
        onOpenChange={(open) => !open && setEditingAchievement(null)}
        mode="edit"
        achievement={editingAchievement || undefined}
        onSuccess={() => {
          setEditingAchievement(null)
          loadAchievements()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingAchievement} onOpenChange={() => setDeletingAchievement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Achievement Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{deletingAchievement?.name}"? 
              This action cannot be undone and will remove all associated student achievements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  Deleting...
                </>
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}