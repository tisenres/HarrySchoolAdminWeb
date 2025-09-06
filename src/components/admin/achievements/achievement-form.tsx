'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Award,
  BookOpen,
  Clock,
  Star,
  Target,
  Zap,
  Trophy,
  Heart,
  Gift,
  Sparkles,
  Crown,
  Medal,
  Save,
  X,
  Palette,
  Eye
} from 'lucide-react'
import type { Achievement } from '@/types/ranking'
import { scaleVariants, fadeVariants } from '@/lib/animations'

const achievementFormSchema = z.object({
  name: z.string().min(1, 'Achievement name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().optional(),
  icon_name: z.string().min(1, 'Icon is required'),
  badge_color: z.string().min(1, 'Badge color is required'),
  points_reward: z.number().min(0, 'Points must be 0 or greater').max(1000, 'Points cannot exceed 1000'),
  coins_reward: z.number().min(0, 'Coins must be 0 or greater').max(500, 'Coins cannot exceed 500'),
  achievement_type: z.enum(['homework', 'attendance', 'behavior', 'streak', 'milestone', 'special']),
  is_active: z.boolean().default(true),
})

type AchievementFormData = z.infer<typeof achievementFormSchema>

interface AchievementFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  achievement?: Achievement
  onSubmit?: (data: AchievementFormData) => void
}

// Education-themed icon library
const iconLibrary = [
  { emoji: '📚', name: 'Books', category: 'academic' },
  { emoji: '🎓', name: 'Graduation Cap', category: 'academic' },
  { emoji: '✏️', name: 'Pencil', category: 'academic' },
  { emoji: '📝', name: 'Writing', category: 'academic' },
  { emoji: '🧮', name: 'Calculator', category: 'academic' },
  { emoji: '🔬', name: 'Microscope', category: 'academic' },
  { emoji: '🗒️', name: 'Notepad', category: 'academic' },
  { emoji: '📊', name: 'Chart', category: 'academic' },
  
  { emoji: '🏆', name: 'Trophy', category: 'achievement' },
  { emoji: '🥇', name: 'Gold Medal', category: 'achievement' },
  { emoji: '🥈', name: 'Silver Medal', category: 'achievement' },
  { emoji: '🥉', name: 'Bronze Medal', category: 'achievement' },
  { emoji: '🏅', name: 'Sports Medal', category: 'achievement' },
  { emoji: '👑', name: 'Crown', category: 'achievement' },
  { emoji: '💎', name: 'Diamond', category: 'achievement' },
  { emoji: '⭐', name: 'Star', category: 'achievement' },
  
  { emoji: '⚡', name: 'Lightning', category: 'energy' },
  { emoji: '🔥', name: 'Fire', category: 'energy' },
  { emoji: '💪', name: 'Strong', category: 'energy' },
  { emoji: '🚀', name: 'Rocket', category: 'energy' },
  { emoji: '⚙️', name: 'Gear', category: 'energy' },
  { emoji: '🎯', name: 'Target', category: 'energy' },
  { emoji: '💫', name: 'Sparkle', category: 'energy' },
  { emoji: '✨', name: 'Stars', category: 'energy' },
  
  { emoji: '🤝', name: 'Handshake', category: 'behavior' },
  { emoji: '❤️', name: 'Heart', category: 'behavior' },
  { emoji: '😊', name: 'Happy', category: 'behavior' },
  { emoji: '👏', name: 'Clap', category: 'behavior' },
  { emoji: '🙌', name: 'Praise', category: 'behavior' },
  { emoji: '💝', name: 'Gift', category: 'behavior' },
  { emoji: '🌟', name: 'Shining Star', category: 'behavior' },
  { emoji: '🎉', name: 'Celebration', category: 'behavior' },
  
  { emoji: '📅', name: 'Calendar', category: 'time' },
  { emoji: '⏰', name: 'Clock', category: 'time' },
  { emoji: '📆', name: 'Calendar Page', category: 'time' },
  { emoji: '⌚', name: 'Watch', category: 'time' },
  { emoji: '🗓️', name: 'Calendar Days', category: 'time' },
  { emoji: '⏳', name: 'Hourglass', category: 'time' },
]

// Harry School brand colors
const colorPalette = [
  { name: 'Harry Green', value: '#4F7942', category: 'primary' },
  { name: 'Deep Green', value: '#2D4A22', category: 'primary' },
  { name: 'Light Green', value: '#6B9A5B', category: 'primary' },
  { name: 'Sage Green', value: '#87A96B', category: 'primary' },
  
  { name: 'Royal Blue', value: '#2563EB', category: 'academic' },
  { name: 'Navy Blue', value: '#1E3A8A', category: 'academic' },
  { name: 'Sky Blue', value: '#3B82F6', category: 'academic' },
  { name: 'Teal', value: '#0891B2', category: 'academic' },
  
  { name: 'Gold', value: '#F59E0B', category: 'achievement' },
  { name: 'Orange', value: '#EA580C', category: 'achievement' },
  { name: 'Amber', value: '#D97706', category: 'achievement' },
  { name: 'Yellow', value: '#EAB308', category: 'achievement' },
  
  { name: 'Purple', value: '#8B5CF6', category: 'special' },
  { name: 'Violet', value: '#7C3AED', category: 'special' },
  { name: 'Indigo', value: '#6366F1', category: 'special' },
  { name: 'Pink', value: '#EC4899', category: 'special' },
  
  { name: 'Red', value: '#EF4444', category: 'energy' },
  { name: 'Rose', value: '#F43F5E', category: 'energy' },
  { name: 'Crimson', value: '#DC2626', category: 'energy' },
  { name: 'Coral', value: '#FB7185', category: 'energy' },
]

export function AchievementForm({
  open,
  onOpenChange,
  mode,
  achievement,
  onSubmit
}: AchievementFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedIconCategory, setSelectedIconCategory] = useState('academic')
  const [selectedColorCategory, setSelectedColorCategory] = useState('primary')
  const [previewIcon, setPreviewIcon] = useState('🏆')
  const [previewColor, setPreviewColor] = useState('#4F7942')

  const form = useForm<AchievementFormData>({
    resolver: zodResolver(achievementFormSchema),
    defaultValues: {
      name: '',
      description: '',
      icon_name: '🏆',
      badge_color: '#4F7942',
      points_reward: 50,
      coins_reward: 25,
      achievement_type: 'milestone',
      is_active: true,
    },
  })

  useEffect(() => {
    if (achievement && mode === 'edit') {
      form.reset({
        name: achievement.name,
        description: achievement.description || '',
        icon_name: achievement.icon_name || '🏆',
        badge_color: achievement.badge_color || '#4F7942',
        points_reward: achievement.points_reward,
        coins_reward: achievement.coins_reward,
        achievement_type: achievement.achievement_type as any,
        is_active: achievement.is_active,
      })
      setPreviewIcon(achievement.icon_name || '🏆')
      setPreviewColor(achievement.badge_color || '#4F7942')
    }
  }, [achievement, mode, form])

  const handleSubmit = async (data: AchievementFormData) => {
    try {
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (onSubmit) {
        onSubmit(data)
      }
      
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error saving achievement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleIconSelect = (emoji: string) => {
    form.setValue('icon_name', emoji)
    setPreviewIcon(emoji)
  }

  const handleColorSelect = (color: string) => {
    form.setValue('badge_color', color)
    setPreviewColor(color)
  }

  const getAchievementTypeIcon = (type: string) => {
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

  const getRarityInfo = (type: string) => {
    switch (type) {
      case 'special': return { label: 'Legendary', color: 'bg-purple-100 text-purple-800' }
      case 'milestone': return { label: 'Epic', color: 'bg-orange-100 text-orange-800' }
      case 'streak': return { label: 'Rare', color: 'bg-blue-100 text-blue-800' }
      default: return { label: 'Common', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const iconCategories = [...new Set(iconLibrary.map(icon => icon.category))]
  const colorCategories = [...new Set(colorPalette.map(color => color.category))]

  const filteredIcons = iconLibrary.filter(icon => icon.category === selectedIconCategory)
  const filteredColors = colorPalette.filter(color => color.category === selectedColorCategory)

  const watchedType = form.watch('achievement_type')
  const rarityInfo = getRarityInfo(watchedType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>{mode === 'create' ? 'Create New Achievement' : 'Edit Achievement'}</span>
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Design a new achievement to recognize student accomplishments'
              : 'Update achievement details and settings'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Form Section */}
          <div className="flex-1 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achievement Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Perfect Attendance" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what students need to do to earn this achievement"
                            className="resize-none"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide clear criteria for earning this achievement
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="achievement_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achievement Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select achievement type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="homework">
                              <div className="flex items-center space-x-2">
                                <BookOpen className="h-4 w-4" />
                                <span>Homework</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="attendance">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>Attendance</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="behavior">
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4" />
                                <span>Behavior</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="streak">
                              <div className="flex items-center space-x-2">
                                <Zap className="h-4 w-4" />
                                <span>Streak</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="milestone">
                              <div className="flex items-center space-x-2">
                                <Target className="h-4 w-4" />
                                <span>Milestone</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="special">
                              <div className="flex items-center space-x-2">
                                <Trophy className="h-4 w-4" />
                                <span>Special</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          <div className="flex items-center space-x-2 mt-1">
                            <span>Rarity Level:</span>
                            <Badge className={rarityInfo.color}>
                              {rarityInfo.label}
                            </Badge>
                          </div>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Rewards */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Rewards</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="points_reward"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points Reward</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              max={1000}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Points added to student's total score
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="coins_reward"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coins Reward</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              max={500}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Coins that can be spent in rewards catalog
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Status</h3>
                  
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Active Achievement
                          </FormLabel>
                          <FormDescription>
                            Only active achievements can be awarded to students
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>

          {/* Design Section */}
          <div className="w-full lg:w-96 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Design</span>
              </h3>

              {/* Preview */}
              <Card>
                <CardContent className="p-6 text-center">
                  <motion.div 
                    className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                    style={{ backgroundColor: previewColor }}
                    variants={scaleVariants}
                    animate="visible"
                    whileHover={{ scale: 1.1 }}
                  >
                    {previewIcon}
                  </motion.div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">{form.watch('name') || 'Achievement Name'}</h4>
                    <div className="flex items-center justify-center space-x-2">
                      {getAchievementTypeIcon(watchedType)}
                      <Badge className={rarityInfo.color}>
                        {rarityInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <Star className="h-3 w-3" />
                        <span>+{form.watch('points_reward')}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>+{form.watch('coins_reward')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Icon Selection */}
              <div className="space-y-3">
                <FormLabel>Achievement Icon</FormLabel>
                
                {/* Icon Categories */}
                <div className="flex flex-wrap gap-2">
                  {iconCategories.map((category) => (
                    <Button
                      key={category}
                      type="button"
                      variant={selectedIconCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedIconCategory(category)}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Icon Grid */}
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                  {filteredIcons.map((icon) => (
                    <Button
                      key={icon.emoji}
                      type="button"
                      variant={previewIcon === icon.emoji ? "default" : "ghost"}
                      size="sm"
                      className="h-10 w-10 p-0 text-lg"
                      onClick={() => handleIconSelect(icon.emoji)}
                      title={icon.name}
                    >
                      {icon.emoji}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="space-y-3">
                <FormLabel>Badge Color</FormLabel>
                
                {/* Color Categories */}
                <div className="flex flex-wrap gap-2">
                  {colorCategories.map((category) => (
                    <Button
                      key={category}
                      type="button"
                      variant={selectedColorCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedColorCategory(category)}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Color Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {filteredColors.map((color) => (
                    <Button
                      key={color.value}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`h-10 w-full p-0 rounded-lg border-2 ${
                        previewColor === color.value ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => handleColorSelect(color.value)}
                      title={color.name}
                    >
                      <div 
                        className="w-full h-6 rounded"
                        style={{ backgroundColor: color.value }}
                      />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={loading}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 mr-2"
              >
                <Save className="h-4 w-4" />
              </motion.div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === 'create' ? 'Create Achievement' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}