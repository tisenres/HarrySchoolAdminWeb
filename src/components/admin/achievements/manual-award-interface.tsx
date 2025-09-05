'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Users,
  Search,
  Award,
  Check,
  ChevronsUpDown,
  X,
  Trophy,
  Star,
  Target,
  Zap,
  BookOpen,
  Clock,
  UserCheck,
  Calendar,
  Gift,
  Sparkles,
  PartyPopper,
  Send
} from 'lucide-react'
import type { Achievement } from '@/types/ranking'
import { fadeVariants, staggerContainer, staggerItem, scaleVariants } from '@/lib/animations'

// Mock data
interface Student {
  id: string
  full_name: string
  group_name?: string
  avatar_url?: string
  current_level?: number
}

const mockStudents: Student[] = [
  { id: '1', full_name: 'Alice Johnson', group_name: 'Math Grade 9A', current_level: 5 },
  { id: '2', full_name: 'Bob Smith', group_name: 'English Grade 10B', current_level: 3 },
  { id: '3', full_name: 'Carol Davis', group_name: 'Science Grade 8C', current_level: 7 },
  { id: '4', full_name: 'David Wilson', group_name: 'Math Grade 9A', current_level: 4 },
  { id: '5', full_name: 'Eva Brown', group_name: 'History Grade 11A', current_level: 6 },
  { id: '6', full_name: 'Frank Miller', group_name: 'Physics Grade 12B', current_level: 8 },
  { id: '7', full_name: 'Grace Taylor', group_name: 'Chemistry Grade 11C', current_level: 5 },
  { id: '8', full_name: 'Henry Anderson', group_name: 'Biology Grade 10A', current_level: 2 },
]

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

export function ManualAwardInterface() {
  const [students, setStudents] = useState<Student[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  
  // UI state
  const [openStudentCombobox, setOpenStudentCombobox] = useState(false)
  const [openAchievementCombobox, setOpenAchievementCombobox] = useState(false)
  const [showBulkMode, setShowBulkMode] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setStudents(mockStudents)
      setAchievements(mockAchievements.filter(a => a.is_active))
      setLoading(false)
    }, 1000)
  }, [])

  // Filter students based on search and group
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGroup = groupFilter === 'all' || 
      student.group_name?.toLowerCase().includes(groupFilter.toLowerCase())

    return matchesSearch && matchesGroup && 
      !selectedStudents.some(s => s.id === student.id)
  })

  // Get unique groups for filter
  const uniqueGroups = [...new Set(students.map(s => s.group_name).filter(Boolean))]

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

  const handleAddStudent = (student: Student) => {
    setSelectedStudents(prev => [...prev, student])
    setOpenStudentCombobox(false)
  }

  const handleRemoveStudent = (studentId: string) => {
    setSelectedStudents(prev => prev.filter(s => s.id !== studentId))
  }

  const handleBulkSelectGroup = (groupName: string) => {
    const groupStudents = students.filter(s => s.group_name === groupName)
    const newStudents = groupStudents.filter(s => 
      !selectedStudents.some(selected => selected.id === s.id)
    )
    setSelectedStudents(prev => [...prev, ...newStudents])
  }

  const handleAwardAchievement = async () => {
    if (!selectedAchievement || selectedStudents.length === 0) return

    try {
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Reset form
      setSelectedStudents([])
      setSelectedAchievement(null)
      setNotes('')
      setShowConfirmDialog(false)
      setShowSuccessDialog(true)
      
    } catch (error) {
      console.error('Error awarding achievement:', error)
    } finally {
      setLoading(false)
    }
  }

  const canAward = selectedAchievement && selectedStudents.length > 0

  if (loading && students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Manual Achievement Award</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-muted rounded"></div>
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
                <Users className="h-4 w-4" />
                <span>Manual Achievement Award</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manually award achievements to students for special recognitions
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={showBulkMode ? "default" : "outline"}
                size="sm"
                onClick={() => setShowBulkMode(!showBulkMode)}
              >
                {showBulkMode ? "Individual Mode" : "Bulk Mode"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Achievement Selection */}
          <motion.div variants={staggerItem} className="space-y-3">
            <label className="text-sm font-medium">Select Achievement *</label>
            <Popover open={openAchievementCombobox} onOpenChange={setOpenAchievementCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openAchievementCombobox}
                  className="w-full justify-between"
                >
                  {selectedAchievement ? (
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: selectedAchievement.badge_color }}
                      >
                        {selectedAchievement.icon_name}
                      </div>
                      <span>{selectedAchievement.name}</span>
                    </div>
                  ) : (
                    "Select achievement..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search achievements..." />
                  <CommandEmpty>No achievement found.</CommandEmpty>
                  <CommandGroup>
                    {achievements.map((achievement) => {
                      const rarity = getAchievementRarity(achievement.achievement_type)
                      return (
                        <CommandItem
                          key={achievement.id}
                          onSelect={() => {
                            setSelectedAchievement(achievement)
                            setOpenAchievementCombobox(false)
                          }}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0"
                              style={{ backgroundColor: achievement.badge_color }}
                            >
                              {achievement.icon_name}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">{achievement.name}</span>
                                <Badge className={`${rarity.color} text-xs ml-2`}>
                                  {rarity.label}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  {getAchievementIcon(achievement.achievement_type)}
                                  <span className="capitalize">{achievement.achievement_type}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1 text-yellow-600">
                                    <Star className="h-3 w-3" />
                                    <span>+{achievement.points_reward}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-green-600">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span>+{achievement.coins_reward}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Check
                            className={`ml-auto h-4 w-4 ${
                              selectedAchievement?.id === achievement.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </motion.div>

          <Separator />

          {/* Student Selection */}
          <motion.div variants={staggerItem} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Select Students *</label>
              <Badge variant="secondary">
                {selectedStudents.length} selected
              </Badge>
            </div>

            {/* Student Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {uniqueGroups.map((group) => (
                    <SelectItem key={group} value={group || ''}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {showBulkMode && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Quick Group Selection</h4>
                <div className="flex flex-wrap gap-2">
                  {uniqueGroups.map((group) => (
                    <Button
                      key={group}
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkSelectGroup(group || '')}
                    >
                      Add all from {group}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Student Selection */}
            <div className="space-y-3">
              <Popover open={openStudentCombobox} onOpenChange={setOpenStudentCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    Add student...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search students..." />
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup>
                      {filteredStudents.map((student) => (
                        <CommandItem
                          key={student.id}
                          onSelect={() => handleAddStudent(student)}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                              {student.full_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{student.full_name}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {student.group_name} • Level {student.current_level}
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected Students */}
              {selectedStudents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Selected Students</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    <AnimatePresence>
                      {selectedStudents.map((student) => (
                        <motion.div
                          key={student.id}
                          variants={scaleVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                              {student.full_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{student.full_name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {student.group_name}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStudent(student.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <Separator />

          {/* Notes */}
          <motion.div variants={staggerItem} className="space-y-3">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              placeholder="Add any additional notes about this achievement award..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </motion.div>

          {/* Award Summary */}
          {canAward && (
            <motion.div 
              variants={staggerItem}
              className="p-4 bg-muted rounded-lg space-y-3"
            >
              <h4 className="font-medium flex items-center space-x-2">
                <Gift className="h-4 w-4" />
                <span>Award Summary</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Achievement</div>
                  <div className="font-medium">{selectedAchievement.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Recipients</div>
                  <div className="font-medium">{selectedStudents.length} students</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Rewards</div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <Star className="h-3 w-3" />
                      <span>+{selectedAchievement.points_reward * selectedStudents.length}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>+{selectedAchievement.coins_reward * selectedStudents.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Button */}
          <motion.div variants={staggerItem} className="flex justify-end">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!canAward || loading}
              size="lg"
              className="flex items-center space-x-2"
            >
              <Award className="h-4 w-4" />
              <span>Award Achievement</span>
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Confirm Achievement Award</span>
            </DialogTitle>
            <DialogDescription>
              You are about to award "{selectedAchievement?.name}" to {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Achievement Preview */}
            {selectedAchievement && (
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg"
                  style={{ backgroundColor: selectedAchievement.badge_color }}
                >
                  {selectedAchievement.icon_name}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{selectedAchievement.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedAchievement.description}</p>
                  <div className="flex items-center space-x-4 text-sm mt-1">
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <Star className="h-3 w-3" />
                      <span>+{selectedAchievement.points_reward} points</span>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>+{selectedAchievement.coins_reward} coins</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recipients List */}
            <div>
              <h4 className="font-medium mb-2">Recipients ({selectedStudents.length})</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedStudents.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2 text-sm">
                    <UserCheck className="h-3 w-3 text-green-600" />
                    <span>{student.full_name}</span>
                    <span className="text-muted-foreground">({student.group_name})</span>
                  </div>
                ))}
              </div>
            </div>

            {notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {notes}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAwardAchievement} disabled={loading}>
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 mr-2"
                >
                  <Send className="h-4 w-4" />
                </motion.div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Confirm Award
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <PartyPopper className="h-5 w-5 text-green-600" />
              <span>Achievement Awarded Successfully!</span>
            </DialogTitle>
            <DialogDescription>
              The achievement has been awarded to all selected students. They will receive notifications about their new achievement.
            </DialogDescription>
          </DialogHeader>
          
          <motion.div 
            className="text-center py-6"
            variants={scaleVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-medium mb-2">Congratulations!</h3>
            <p className="text-muted-foreground">
              Students will be notified about their achievement via the notification system.
            </p>
          </motion.div>

          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Award More Achievements
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}