'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Award,
  Search,
  Filter,
  Calendar,
  User,
  Trophy,
  Star,
  Target,
  Zap,
  BookOpen,
  Clock,
  Users,
  TrendingUp,
  Grid,
  List,
  Eye
} from 'lucide-react'
import type { Achievement } from '@/types/ranking'
import { fadeVariants, staggerContainer, staggerItem, scaleVariants, hoverScale } from '@/lib/animations'

interface AchievementGalleryProps {
  viewMode?: 'admin' | 'public'
}

// Mock data - Replace with actual API calls
const mockAchievements: Achievement[] = [
  {
    id: '1',
    organization_id: 'org-1',
    name: 'Perfect Attendance',
    description: 'Attended all classes for a full month without any absences',
    icon_name: '📅',
    badge_color: '#4F7942',
    points_reward: 100,
    coins_reward: 50,
    achievement_type: 'attendance',
    is_active: true,
    created_by: 'admin-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    organization_id: 'org-1',
    name: 'Homework Champion',
    description: 'Completed all homework assignments for two consecutive weeks',
    icon_name: '📚',
    badge_color: '#8B5CF6',
    points_reward: 75,
    coins_reward: 25,
    achievement_type: 'homework',
    is_active: true,
    created_by: 'admin-1',
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z'
  },
  {
    id: '3',
    organization_id: 'org-1',
    name: 'Class Helper',
    description: 'Consistently helped classmates and showed excellent behavior',
    icon_name: '🤝',
    badge_color: '#F59E0B',
    points_reward: 60,
    coins_reward: 30,
    achievement_type: 'behavior',
    is_active: true,
    created_by: 'admin-1',
    created_at: '2024-01-05T09:15:00Z',
    updated_at: '2024-01-05T09:15:00Z'
  },
  {
    id: '4',
    organization_id: 'org-1',
    name: 'Study Streak Master',
    description: 'Maintained a 10-day consecutive study streak',
    icon_name: '⚡',
    badge_color: '#EF4444',
    points_reward: 120,
    coins_reward: 60,
    achievement_type: 'streak',
    is_active: true,
    created_by: 'admin-1',
    created_at: '2024-01-20T16:45:00Z',
    updated_at: '2024-01-20T16:45:00Z'
  },
  {
    id: '5',
    organization_id: 'org-1',
    name: 'Level 5 Scholar',
    description: 'Reached Level 5 in the ranking system',
    icon_name: '🎯',
    badge_color: '#06B6D4',
    points_reward: 200,
    coins_reward: 100,
    achievement_type: 'milestone',
    is_active: true,
    created_by: 'admin-1',
    created_at: '2024-02-01T11:20:00Z',
    updated_at: '2024-02-01T11:20:00Z'
  },
  {
    id: '6',
    organization_id: 'org-1',
    name: 'Student of the Month',
    description: 'Outstanding performance and dedication throughout the month',
    icon_name: '👑',
    badge_color: '#8B5CF6',
    points_reward: 300,
    coins_reward: 150,
    achievement_type: 'special',
    is_active: true,
    created_by: 'admin-1',
    created_at: '2024-02-05T13:30:00Z',
    updated_at: '2024-02-05T13:30:00Z'
  }
]

export function AchievementGallery({ viewMode = 'admin' }: AchievementGalleryProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [rarityFilter, setRarityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid')
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAchievements(mockAchievements)
      setLoading(false)
    }, 1000)
  }, [])

  // Filter achievements based on search and filters
  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = searchTerm === '' || 
      achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      achievement.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || achievement.achievement_type === typeFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && achievement.is_active) ||
      (statusFilter === 'inactive' && !achievement.is_active)
    
    const rarity = getAchievementRarity(achievement.achievement_type)
    const matchesRarity = rarityFilter === 'all' || rarity.level === rarityFilter

    return matchesSearch && matchesType && matchesStatus && matchesRarity
  })

  // Get unique achievement types for filter
  const achievementTypes = [...new Set(achievements.map(a => a.achievement_type))]

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'homework': return <BookOpen className="h-5 w-5" />
      case 'attendance': return <Clock className="h-5 w-5" />
      case 'behavior': return <Star className="h-5 w-5" />
      case 'streak': return <Zap className="h-5 w-5" />
      case 'milestone': return <Target className="h-5 w-5" />
      case 'special': return <Trophy className="h-5 w-5" />
      default: return <Award className="h-5 w-5" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getAchievementRarity = (type: string) => {
    switch (type) {
      case 'special': return { 
        label: 'Legendary', 
        level: 'legendary',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        bgGradient: 'from-purple-500 to-pink-500'
      }
      case 'milestone': return { 
        label: 'Epic', 
        level: 'epic',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        bgGradient: 'from-orange-500 to-red-500'
      }
      case 'streak': return { 
        label: 'Rare', 
        level: 'rare',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        bgGradient: 'from-blue-500 to-cyan-500'
      }
      default: return { 
        label: 'Common', 
        level: 'common',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        bgGradient: 'from-gray-500 to-gray-600'
      }
    }
  }

  const getAchievementStats = () => {
    const totalAchievements = achievements.length
    const activeAchievements = achievements.filter(a => a.is_active).length
    const totalPointsReward = achievements.reduce((sum, a) => sum + a.points_reward, 0)
    const totalCoinsReward = achievements.reduce((sum, a) => sum + a.coins_reward, 0)

    return {
      total: totalAchievements,
      active: activeAchievements,
      totalPoints: totalPointsReward,
      totalCoins: totalCoinsReward
    }
  }

  const stats = getAchievementStats()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Achievement Gallery</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg p-4">
                  <div className="w-16 h-16 bg-muted-foreground rounded-full mx-auto mb-3"></div>
                  <div className="h-4 bg-muted-foreground rounded mb-2"></div>
                  <div className="h-3 bg-muted-foreground rounded w-3/4 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-4 w-4" />
                <span>Achievement Gallery</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Browse and manage all achievements in your organization
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewLayout === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewLayout('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewLayout === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewLayout('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Achievement Stats */}
          <motion.div 
            variants={staggerItem}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.totalCoins}</div>
              <div className="text-sm text-muted-foreground">Total Coins</div>
            </div>
          </motion.div>

          <Separator />

          {/* Filters */}
          <motion.div 
            variants={staggerItem}
            className="flex flex-col lg:flex-row gap-4"
          >
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

              <Select value={rarityFilter} onValueChange={setRarityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Rarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rarities</SelectItem>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>

              {viewMode === 'admin' && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Eye className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </motion.div>

          {/* Achievement Grid/List */}
          {filteredAchievements.length > 0 ? (
            <motion.div 
              variants={staggerContainer}
              className={
                viewLayout === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              <AnimatePresence>
                {filteredAchievements.map((achievement) => {
                  const rarity = getAchievementRarity(achievement.achievement_type)

                  return (
                    <motion.div
                      key={achievement.id}
                      variants={scaleVariants}
                      {...hoverScale}
                      layout
                    >
                      {viewLayout === 'grid' ? (
                        <Card 
                          className="cursor-pointer hover:shadow-lg transition-shadow duration-200 relative overflow-hidden"
                          onClick={() => setSelectedAchievement(achievement)}
                        >
                          {/* Rarity indicator */}
                          <div className="absolute top-2 right-2">
                            <Badge className={`${rarity.color} text-xs`}>
                              {rarity.label}
                            </Badge>
                          </div>

                          {/* Status indicator for admin view */}
                          {viewMode === 'admin' && !achievement.is_active && (
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className="text-xs">
                                Inactive
                              </Badge>
                            </div>
                          )}

                          <CardContent className="p-6 text-center">
                            {/* Achievement Badge */}
                            <motion.div 
                              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                              style={{ backgroundColor: achievement.badge_color || '#4F7942' }}
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              {achievement.icon_name || '🏆'}
                            </motion.div>

                            {/* Achievement Info */}
                            <div className="space-y-2">
                              <h3 className="font-semibold text-sm leading-tight">
                                {achievement.name}
                              </h3>
                              {achievement.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {achievement.description}
                                </p>
                              )}
                              
                              {/* Rewards */}
                              <div className="flex items-center justify-center space-x-4 text-xs">
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

                              {/* Created Date */}
                              <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground pt-2 border-t">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(achievement.created_at)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card 
                          className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                          onClick={() => setSelectedAchievement(achievement)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              {/* Achievement Badge */}
                              <div 
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0"
                                style={{ backgroundColor: achievement.badge_color || '#4F7942' }}
                              >
                                {achievement.icon_name || '🏆'}
                              </div>

                              {/* Achievement Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-semibold truncate">
                                    {achievement.name}
                                  </h3>
                                  <div className="flex items-center space-x-2">
                                    <Badge className={`${rarity.color} text-xs`}>
                                      {rarity.label}
                                    </Badge>
                                    {viewMode === 'admin' && !achievement.is_active && (
                                      <Badge variant="secondary" className="text-xs">
                                        Inactive
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {achievement.description && (
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                    {achievement.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4 text-sm">
                                    <div className="flex items-center space-x-1">
                                      {getAchievementIcon(achievement.achievement_type)}
                                      <span className="capitalize">{achievement.achievement_type}</span>
                                    </div>
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
                                  
                                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(achievement.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              variants={staggerItem}
              className="text-center py-12"
            >
              <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No achievements found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || typeFilter !== 'all' || rarityFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No achievements have been created yet.'}
              </p>
              {(searchTerm || typeFilter !== 'all' || rarityFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setTypeFilter('all')
                    setRarityFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Achievement Detail Dialog */}
      <AnimatePresence>
        {selectedAchievement && (
          <Dialog 
            open={!!selectedAchievement} 
            onOpenChange={() => setSelectedAchievement(null)}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">
                  Achievement Details
                </DialogTitle>
              </DialogHeader>
              
              <motion.div 
                variants={scaleVariants}
                initial="hidden"
                animate="visible"
                className="text-center space-y-6"
              >
                {/* Large Achievement Badge */}
                <div 
                  className="w-32 h-32 mx-auto rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl"
                  style={{ backgroundColor: selectedAchievement.badge_color || '#4F7942' }}
                >
                  {selectedAchievement.icon_name || '🏆'}
                </div>

                {/* Achievement Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      {selectedAchievement.name}
                    </h3>
                    {selectedAchievement.description && (
                      <p className="text-muted-foreground">
                        {selectedAchievement.description}
                      </p>
                    )}
                  </div>

                  {/* Achievement Type and Rarity */}
                  <div className="flex items-center justify-center space-x-4">
                    <Badge variant="outline" className="flex items-center space-x-1">
                      {getAchievementIcon(selectedAchievement.achievement_type)}
                      <span className="capitalize">
                        {selectedAchievement.achievement_type}
                      </span>
                    </Badge>
                    <Badge className={getAchievementRarity(selectedAchievement.achievement_type).color}>
                      {getAchievementRarity(selectedAchievement.achievement_type).label}
                    </Badge>
                  </div>

                  {/* Status */}
                  {viewMode === 'admin' && (
                    <div className="flex items-center justify-center">
                      <Badge variant={selectedAchievement.is_active ? "default" : "secondary"}>
                        {selectedAchievement.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  )}

                  {/* Rewards */}
                  <div className="flex items-center justify-center space-x-6 p-4 bg-muted rounded-lg">
                    {selectedAchievement.points_reward > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          +{selectedAchievement.points_reward}
                        </div>
                        <div className="text-xs text-muted-foreground">Points</div>
                      </div>
                    )}
                    {selectedAchievement.coins_reward > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          +{selectedAchievement.coins_reward}
                        </div>
                        <div className="text-xs text-muted-foreground">Coins</div>
                      </div>
                    )}
                  </div>

                  {/* Achievement Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Created Date</span>
                      </div>
                      <span className="font-medium">
                        {formatDate(selectedAchievement.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </motion.div>
  )
}