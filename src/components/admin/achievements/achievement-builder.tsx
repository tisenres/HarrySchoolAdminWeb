'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Award,
  BookOpen,
  Clock,
  Star,
  Target,
  Zap,
  Trophy,
  Save,
  X,
  Palette,
  Template,
  Copy,
  Sparkles,
  Wand2,
  Plus,
  Trash2,
  FileText,
  Download
} from 'lucide-react'
import type { Achievement } from '@/types/ranking'
import { achievementService, type AchievementCreateData } from '@/lib/services/achievement-service'
import { scaleVariants, fadeVariants, staggerContainer, staggerItem } from '@/lib/animations'

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

interface AchievementBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit' | 'template' | 'bulk'
  achievement?: Achievement
  onSubmit?: (data: AchievementFormData[]) => void
}

// Education-themed icon library with categories
const iconLibrary = [
  { emoji: '📚', name: 'Books', category: 'academic' },
  { emoji: '🎓', name: 'Graduation Cap', category: 'academic' },
  { emoji: '✏️', name: 'Pencil', category: 'academic' },
  { emoji: '📝', name: 'Writing', category: 'academic' },
  { emoji: '🧮', name: 'Calculator', category: 'academic' },
  { emoji: '🔬', name: 'Microscope', category: 'academic' },
  { emoji: '🗒️', name: 'Notepad', category: 'academic' },
  { emoji: '📊', name: 'Chart', category: 'academic' },
  { emoji: '📐', name: 'Ruler', category: 'academic' },
  { emoji: '🖊️', name: 'Pen', category: 'academic' },
  
  { emoji: '🏆', name: 'Trophy', category: 'achievement' },
  { emoji: '🥇', name: 'Gold Medal', category: 'achievement' },
  { emoji: '🥈', name: 'Silver Medal', category: 'achievement' },
  { emoji: '🥉', name: 'Bronze Medal', category: 'achievement' },
  { emoji: '🏅', name: 'Sports Medal', category: 'achievement' },
  { emoji: '👑', name: 'Crown', category: 'achievement' },
  { emoji: '💎', name: 'Diamond', category: 'achievement' },
  { emoji: '⭐', name: 'Star', category: 'achievement' },
  { emoji: '🌟', name: 'Glowing Star', category: 'achievement' },
  { emoji: '✨', name: 'Sparkles', category: 'achievement' },
  
  { emoji: '⚡', name: 'Lightning', category: 'energy' },
  { emoji: '🔥', name: 'Fire', category: 'energy' },
  { emoji: '💪', name: 'Strong', category: 'energy' },
  { emoji: '🚀', name: 'Rocket', category: 'energy' },
  { emoji: '⚙️', name: 'Gear', category: 'energy' },
  { emoji: '🎯', name: 'Target', category: 'energy' },
  { emoji: '💫', name: 'Comet', category: 'energy' },
  { emoji: '🌠', name: 'Shooting Star', category: 'energy' },
  { emoji: '⭐', name: 'White Star', category: 'energy' },
  { emoji: '🔆', name: 'Bright', category: 'energy' },
  
  { emoji: '🤝', name: 'Handshake', category: 'behavior' },
  { emoji: '❤️', name: 'Heart', category: 'behavior' },
  { emoji: '😊', name: 'Happy', category: 'behavior' },
  { emoji: '👏', name: 'Clap', category: 'behavior' },
  { emoji: '🙌', name: 'Praise', category: 'behavior' },
  { emoji: '💝', name: 'Gift', category: 'behavior' },
  { emoji: '🎉', name: 'Celebration', category: 'behavior' },
  { emoji: '🎊', name: 'Party', category: 'behavior' },
  { emoji: '🌈', name: 'Rainbow', category: 'behavior' },
  { emoji: '🦋', name: 'Butterfly', category: 'behavior' },
  
  { emoji: '📅', name: 'Calendar', category: 'time' },
  { emoji: '⏰', name: 'Clock', category: 'time' },
  { emoji: '📆', name: 'Calendar Page', category: 'time' },
  { emoji: '⌚', name: 'Watch', category: 'time' },
  { emoji: '🗓️', name: 'Calendar Days', category: 'time' },
  { emoji: '⏳', name: 'Hourglass', category: 'time' },
  { emoji: '⏱️', name: 'Stopwatch', category: 'time' },
  { emoji: '🔔', name: 'Bell', category: 'time' },
]

// Harry School brand colors with expanded palette
const colorPalette = [
  { name: 'Harry Green', value: '#4F7942', category: 'primary' },
  { name: 'Deep Green', value: '#2D4A22', category: 'primary' },
  { name: 'Light Green', value: '#6B9A5B', category: 'primary' },
  { name: 'Sage Green', value: '#87A96B', category: 'primary' },
  { name: 'Forest Green', value: '#355E3B', category: 'primary' },
  { name: 'Mint Green', value: '#98FB98', category: 'primary' },
  
  { name: 'Royal Blue', value: '#2563EB', category: 'academic' },
  { name: 'Navy Blue', value: '#1E3A8A', category: 'academic' },
  { name: 'Sky Blue', value: '#3B82F6', category: 'academic' },
  { name: 'Teal', value: '#0891B2', category: 'academic' },
  { name: 'Cyan', value: '#06B6D4', category: 'academic' },
  { name: 'Steel Blue', value: '#4682B4', category: 'academic' },
  
  { name: 'Gold', value: '#F59E0B', category: 'achievement' },
  { name: 'Orange', value: '#EA580C', category: 'achievement' },
  { name: 'Amber', value: '#D97706', category: 'achievement' },
  { name: 'Yellow', value: '#EAB308', category: 'achievement' },
  { name: 'Bronze', value: '#CD7F32', category: 'achievement' },
  { name: 'Copper', value: '#B87333', category: 'achievement' },
  
  { name: 'Purple', value: '#8B5CF6', category: 'special' },
  { name: 'Violet', value: '#7C3AED', category: 'special' },
  { name: 'Indigo', value: '#6366F1', category: 'special' },
  { name: 'Pink', value: '#EC4899', category: 'special' },
  { name: 'Magenta', value: '#D946EF', category: 'special' },
  { name: 'Fuchsia', value: '#C026D3', category: 'special' },
  
  { name: 'Red', value: '#EF4444', category: 'energy' },
  { name: 'Rose', value: '#F43F5E', category: 'energy' },
  { name: 'Crimson', value: '#DC2626', category: 'energy' },
  { name: 'Coral', value: '#FB7185', category: 'energy' },
  { name: 'Scarlet', value: '#FF2400', category: 'energy' },
  { name: 'Cherry', value: '#DE3163', category: 'energy' },
]

export function AchievementBuilder({
  open,
  onOpenChange,
  mode,
  achievement,
  onSubmit
}: AchievementBuilderProps) {
  const [loading, setLoading] = useState(false)
  const [selectedIconCategory, setSelectedIconCategory] = useState('academic')
  const [selectedColorCategory, setSelectedColorCategory] = useState('primary')
  const [previewIcon, setPreviewIcon] = useState('🏆')
  const [previewColor, setPreviewColor] = useState('#4F7942')
  const [activeTemplate, setActiveTemplate] = useState<AchievementCreateData | null>(null)
  const [bulkAchievements, setBulkAchievements] = useState<AchievementFormData[]>([])
  const [currentTab, setCurrentTab] = useState('single')

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
      
      if (mode === 'bulk') {
        // Add current form data to bulk list
        setBulkAchievements(prev => [...prev, data])
        form.reset()
        return
      }

      if (onSubmit) {
        onSubmit([data])
      }
      
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error saving achievement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSubmit = async () => {
    try {
      setLoading(true)
      
      if (onSubmit) {
        onSubmit(bulkAchievements)
      }
      
      setBulkAchievements([])
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving bulk achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: AchievementCreateData) => {
    setActiveTemplate(template)
    form.reset({
      name: template.name,
      description: template.description,
      icon_name: template.icon_name,
      badge_color: template.badge_color,
      points_reward: template.points_reward,
      coins_reward: template.coins_reward,
      achievement_type: template.achievement_type,
      is_active: template.is_active,
    })
    setPreviewIcon(template.icon_name)
    setPreviewColor(template.badge_color)
    setCurrentTab('single')
  }

  const handleIconSelect = (emoji: string) => {
    form.setValue('icon_name', emoji)
    setPreviewIcon(emoji)
  }

  const handleColorSelect = (color: string) => {
    form.setValue('badge_color', color)
    setPreviewColor(color)
  }

  const removeBulkAchievement = (index: number) => {
    setBulkAchievements(prev => prev.filter((_, i) => i !== index))
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
    return achievementService.getAchievementRarity(type)
  }

  const iconCategories = [...new Set(iconLibrary.map(icon => icon.category))]
  const colorCategories = [...new Set(colorPalette.map(color => color.category))]

  const filteredIcons = iconLibrary.filter(icon => icon.category === selectedIconCategory)
  const filteredColors = colorPalette.filter(color => color.category === selectedColorCategory)

  const watchedType = form.watch('achievement_type')
  const rarityInfo = getRarityInfo(watchedType)
  const templates = achievementService.getAchievementTemplates()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>{mode === 'create' ? 'Create Achievement' : mode === 'edit' ? 'Edit Achievement' : mode === 'template' ? 'Create from Template' : 'Bulk Create Achievements'}</span>
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Design a new achievement to recognize student accomplishments'
              : mode === 'edit'
              ? 'Update achievement details and settings'
              : mode === 'template'
              ? 'Choose a template to quickly create achievements'
              : 'Create multiple achievements at once'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates" className="flex items-center space-x-2">
                <Template className="h-4 w-4" />
                <span>Templates</span>
              </TabsTrigger>
              <TabsTrigger value="single" className="flex items-center space-x-2">
                <Wand2 className="h-4 w-4" />
                <span>Single</span>
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center space-x-2">
                <Copy className="h-4 w-4" />
                <span>Bulk ({bulkAchievements.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6">
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {templates.map((template, index) => {
                  const rarity = getRarityInfo(template.achievement_type)
                  return (
                    <motion.div
                      key={index}
                      variants={staggerItem}
                      whileHover={{ scale: 1.02 }}
                      className="relative"
                    >
                      <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 relative overflow-hidden"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="absolute top-2 right-2">
                          <Badge className={`${rarity.color} text-xs`}>
                            {rarity.label}
                          </Badge>
                        </div>

                        <CardContent className="p-4 text-center">
                          <div 
                            className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
                            style={{ backgroundColor: template.badge_color }}
                          >
                            {template.icon_name}
                          </div>

                          <h3 className="font-semibold text-sm mb-2">{template.name}</h3>
                          {template.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {template.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-center space-x-4 text-xs">
                            {template.points_reward > 0 && (
                              <div className="flex items-center space-x-1 text-yellow-600">
                                <Star className="h-3 w-3" />
                                <span>+{template.points_reward}</span>
                              </div>
                            )}
                            {template.coins_reward > 0 && (
                              <div className="flex items-center space-x-1 text-green-600">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span>+{template.coins_reward}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-center space-x-2 mt-3">
                            {getAchievementTypeIcon(template.achievement_type)}
                            <span className="text-xs capitalize">{template.achievement_type}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </motion.div>
            </TabsContent>

            <TabsContent value="single" className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-6">
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
            </TabsContent>

            <TabsContent value="bulk" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Bulk Achievement Creation</h3>
                  <div className="flex items-center space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => form.handleSubmit(handleSubmit)()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Current
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      disabled={bulkAchievements.length === 0}
                      onClick={() => {
                        const csvContent = bulkAchievements.map(a => 
                          `"${a.name}","${a.description || ''}","${a.achievement_type}",${a.points_reward},${a.coins_reward}`
                        ).join('\n')
                        const blob = new Blob([`Name,Description,Type,Points,Coins\n${csvContent}`], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'achievements.csv'
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>

                {bulkAchievements.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    <AnimatePresence>
                      {bulkAchievements.map((achievement, index) => {
                        const rarity = getRarityInfo(achievement.achievement_type)
                        return (
                          <motion.div
                            key={index}
                            variants={scaleVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                                style={{ backgroundColor: achievement.badge_color }}
                              >
                                {achievement.icon_name}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium">{achievement.name}</h4>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    {getAchievementTypeIcon(achievement.achievement_type)}
                                    <span className="capitalize">{achievement.achievement_type}</span>
                                  </div>
                                  <Badge className={`${rarity.color} text-xs`}>
                                    {rarity.label}
                                  </Badge>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBulkAchievement(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No achievements added yet</p>
                    <p className="text-sm">Use the Single tab to create achievements and add them here</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
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
          
          {currentTab === 'bulk' ? (
            <Button
              onClick={handleBulkSubmit}
              disabled={loading || bulkAchievements.length === 0}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 mr-2"
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Create {bulkAchievements.length} Achievements
            </Button>
          ) : (
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
              {mode === 'create' ? 'Create Achievement' : mode === 'edit' ? 'Save Changes' : 'Create from Template'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}