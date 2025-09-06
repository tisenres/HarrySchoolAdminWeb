'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Clock
} from 'lucide-react'
import type { StudentAchievement } from '@/types/ranking'
import { fadeVariants, staggerContainer, staggerItem, scaleVariants, hoverScale } from '@/lib/animations'

interface AchievementGalleryProps {
  achievements: StudentAchievement[]
  loading?: boolean
}

export function AchievementGallery({
  achievements,
  loading = false
}: AchievementGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedAchievement, setSelectedAchievement] = useState<StudentAchievement | null>(null)

  // Filter achievements based on search and type
  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = searchTerm === '' || 
      achievement.achievement?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      achievement.achievement?.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || achievement.achievement?.achievement_type === typeFilter

    return matchesSearch && matchesType
  })

  // Get unique achievement types for filter
  const achievementTypes = [...new Set(achievements.map(a => a.achievement?.achievement_type).filter(Boolean))]

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
      case 'special': return { label: 'Legendary', color: 'bg-purple-100 text-purple-800 border-purple-200' }
      case 'milestone': return { label: 'Epic', color: 'bg-orange-100 text-orange-800 border-orange-200' }
      case 'streak': return { label: 'Rare', color: 'bg-blue-100 text-blue-800 border-blue-200' }
      default: return { label: 'Common', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
  }

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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Achievement Gallery</span>
            </div>
            <Badge variant="secondary">
              {filteredAchievements.length} earned
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <motion.div 
            variants={staggerItem}
            className="flex flex-col sm:flex-row gap-4"
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
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Achievement Type" />
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
          </motion.div>

          {/* Achievement Grid */}
          {filteredAchievements.length > 0 ? (
            <motion.div 
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {filteredAchievements.map((studentAchievement) => {
                  const achievement = studentAchievement.achievement
                  if (!achievement) return null

                  const rarity = getAchievementRarity(achievement.achievement_type)

                  return (
                    <motion.div
                      key={studentAchievement.id}
                      variants={scaleVariants}
                      {...hoverScale}
                      layout
                    >
                      <Card 
                        className="cursor-pointer hover:shadow-lg transition-shadow duration-200 relative overflow-hidden"
                        onClick={() => setSelectedAchievement(studentAchievement)}
                      >
                        {/* Rarity indicator */}
                        <div className="absolute top-2 right-2">
                          <Badge className={`${rarity.color} text-xs`}>
                            {rarity.label}
                          </Badge>
                        </div>

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

                            {/* Earned Date */}
                            <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground pt-2 border-t">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(studentAchievement.earned_at)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
                {searchTerm || typeFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'This student hasn\'t earned any achievements yet.'}
              </p>
              {(searchTerm || typeFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setTypeFilter('all')
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
                  style={{ backgroundColor: selectedAchievement.achievement?.badge_color || '#4F7942' }}
                >
                  {selectedAchievement.achievement?.icon_name || '🏆'}
                </div>

                {/* Achievement Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      {selectedAchievement.achievement?.name}
                    </h3>
                    {selectedAchievement.achievement?.description && (
                      <p className="text-muted-foreground">
                        {selectedAchievement.achievement.description}
                      </p>
                    )}
                  </div>

                  {/* Achievement Type and Rarity */}
                  <div className="flex items-center justify-center space-x-4">
                    <Badge variant="outline" className="flex items-center space-x-1">
                      {getAchievementIcon(selectedAchievement.achievement?.achievement_type || '')}
                      <span className="capitalize">
                        {selectedAchievement.achievement?.achievement_type}
                      </span>
                    </Badge>
                    <Badge className={getAchievementRarity(selectedAchievement.achievement?.achievement_type || '').color}>
                      {getAchievementRarity(selectedAchievement.achievement?.achievement_type || '').label}
                    </Badge>
                  </div>

                  {/* Rewards */}
                  <div className="flex items-center justify-center space-x-6 p-4 bg-muted rounded-lg">
                    {selectedAchievement.achievement?.points_reward && selectedAchievement.achievement.points_reward > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          +{selectedAchievement.achievement.points_reward}
                        </div>
                        <div className="text-xs text-muted-foreground">Points</div>
                      </div>
                    )}
                    {selectedAchievement.achievement?.coins_reward && selectedAchievement.achievement.coins_reward > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          +{selectedAchievement.achievement.coins_reward}
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
                        <span>Earned Date</span>
                      </div>
                      <span className="font-medium">
                        {formatDate(selectedAchievement.earned_at)}
                      </span>
                    </div>

                    {selectedAchievement.awarded_by_profile && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Awarded By</span>
                        </div>
                        <span className="font-medium">
                          {selectedAchievement.awarded_by_profile.full_name}
                        </span>
                      </div>
                    )}

                    {selectedAchievement.notes && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium">Notes</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {selectedAchievement.notes}
                        </p>
                      </div>
                    )}
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