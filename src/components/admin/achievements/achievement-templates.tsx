'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
  Template,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Star,
  Trophy,
  Award,
  BookOpen,
  Clock,
  Target,
  Zap,
  Settings,
  FileText,
  Package,
  Wand2,
  Save,
  X,
  Check,
  Import,
  Export,
  Sparkles,
  Filter,
  Search
} from 'lucide-react'
import type { Achievement } from '@/types/ranking'
import { achievementService, type AchievementCreateData } from '@/lib/services/achievement-service'
import { fadeVariants, staggerContainer, staggerItem, scaleVariants } from '@/lib/animations'

interface AchievementTemplate {
  id: string
  name: string
  description: string
  category: 'academic' | 'behavior' | 'attendance' | 'special' | 'custom'
  achievements: AchievementCreateData[]
  tags: string[]
  created_at: string
  created_by: string
  is_public: boolean
  usage_count: number
}

interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: any
  count: number
}

// Pre-built achievement templates
const defaultTemplates: AchievementTemplate[] = [
  {
    id: 'academic-excellence',
    name: 'Academic Excellence Package',
    description: 'Comprehensive set of achievements for academic performance',
    category: 'academic',
    achievements: [
      {
        name: 'Perfect Test Score',
        description: 'Achieved 100% on a test or exam',
        icon_name: '📊',
        badge_color: '#4F7942',
        points_reward: 150,
        coins_reward: 75,
        achievement_type: 'homework',
        is_active: true
      },
      {
        name: 'Research Master',
        description: 'Completed an outstanding research project',
        icon_name: '🔬',
        badge_color: '#2563EB',
        points_reward: 200,
        coins_reward: 100,
        achievement_type: 'homework',
        is_active: true
      },
      {
        name: 'Knowledge Seeker',
        description: 'Asked excellent questions and showed curiosity',
        icon_name: '🧠',
        badge_color: '#8B5CF6',
        points_reward: 100,
        coins_reward: 50,
        achievement_type: 'behavior',
        is_active: true
      },
      {
        name: 'Academic Champion',
        description: 'Maintained excellent grades throughout the semester',
        icon_name: '🏆',
        badge_color: '#F59E0B',
        points_reward: 300,
        coins_reward: 150,
        achievement_type: 'milestone',
        is_active: true
      }
    ],
    tags: ['academic', 'grades', 'study', 'excellence'],
    created_at: '2024-01-01T00:00:00Z',
    created_by: 'system',
    is_public: true,
    usage_count: 45
  },
  {
    id: 'attendance-rewards',
    name: 'Attendance Rewards',
    description: 'Motivate students with attendance-based achievements',
    category: 'attendance',
    achievements: [
      {
        name: 'Perfect Week',
        description: 'Attended all classes for a full week',
        icon_name: '📅',
        badge_color: '#4F7942',
        points_reward: 50,
        coins_reward: 25,
        achievement_type: 'attendance',
        is_active: true
      },
      {
        name: 'Monthly Attendance Star',
        description: 'Perfect attendance for an entire month',
        icon_name: '⭐',
        badge_color: '#F59E0B',
        points_reward: 200,
        coins_reward: 100,
        achievement_type: 'attendance',
        is_active: true
      },
      {
        name: 'Never Miss',
        description: 'Perfect attendance for the entire semester',
        icon_name: '🎯',
        badge_color: '#EF4444',
        points_reward: 500,
        coins_reward: 250,
        achievement_type: 'milestone',
        is_active: true
      },
      {
        name: 'Early Bird',
        description: 'Always arrives on time or early',
        icon_name: '⏰',
        badge_color: '#06B6D4',
        points_reward: 75,
        coins_reward: 35,
        achievement_type: 'attendance',
        is_active: true
      }
    ],
    tags: ['attendance', 'punctuality', 'consistency'],
    created_at: '2024-01-01T00:00:00Z',
    created_by: 'system',
    is_public: true,
    usage_count: 67
  },
  {
    id: 'behavior-excellence',
    name: 'Positive Behavior Program',
    description: 'Encourage good behavior and character development',
    category: 'behavior',
    achievements: [
      {
        name: 'Helper Hero',
        description: 'Consistently helps classmates and teachers',
        icon_name: '🤝',
        badge_color: '#F59E0B',
        points_reward: 100,
        coins_reward: 50,
        achievement_type: 'behavior',
        is_active: true
      },
      {
        name: 'Kindness Champion',
        description: 'Shows exceptional kindness and empathy',
        icon_name: '❤️',
        badge_color: '#EC4899',
        points_reward: 125,
        coins_reward: 60,
        achievement_type: 'behavior',
        is_active: true
      },
      {
        name: 'Leadership Star',
        description: 'Demonstrates natural leadership abilities',
        icon_name: '👑',
        badge_color: '#8B5CF6',
        points_reward: 150,
        coins_reward: 75,
        achievement_type: 'behavior',
        is_active: true
      },
      {
        name: 'Respect Master',
        description: 'Always treats others with respect and dignity',
        icon_name: '🙏',
        badge_color: '#4F7942',
        points_reward: 100,
        coins_reward: 50,
        achievement_type: 'behavior',
        is_active: true
      }
    ],
    tags: ['behavior', 'character', 'social', 'respect'],
    created_at: '2024-01-01T00:00:00Z',
    created_by: 'system',
    is_public: true,
    usage_count: 52
  },
  {
    id: 'special-recognition',
    name: 'Special Recognition Awards',
    description: 'Unique achievements for exceptional accomplishments',
    category: 'special',
    achievements: [
      {
        name: 'Innovation Award',
        description: 'Created something new and innovative',
        icon_name: '💡',
        badge_color: '#F59E0B',
        points_reward: 250,
        coins_reward: 125,
        achievement_type: 'special',
        is_active: true
      },
      {
        name: 'Community Service Star',
        description: 'Outstanding contribution to community service',
        icon_name: '🌟',
        badge_color: '#4F7942',
        points_reward: 300,
        coins_reward: 150,
        achievement_type: 'special',
        is_active: true
      },
      {
        name: 'Student of the Month',
        description: 'Exceptional overall performance and dedication',
        icon_name: '👑',
        badge_color: '#8B5CF6',
        points_reward: 400,
        coins_reward: 200,
        achievement_type: 'special',
        is_active: true
      },
      {
        name: 'Peer Mentor',
        description: 'Exceptional support and mentoring of other students',
        icon_name: '🎓',
        badge_color: '#06B6D4',
        points_reward: 200,
        coins_reward: 100,
        achievement_type: 'special',
        is_active: true
      }
    ],
    tags: ['special', 'recognition', 'excellence', 'leadership'],
    created_at: '2024-01-01T00:00:00Z',
    created_by: 'system',
    is_public: true,
    usage_count: 23
  }
]

const templateCategories: TemplateCategory[] = [
  {
    id: 'academic',
    name: 'Academic',
    description: 'Study and homework related achievements',
    icon: BookOpen,
    count: 1
  },
  {
    id: 'behavior',
    name: 'Behavior',
    description: 'Character and social behavior achievements',
    icon: Star,
    count: 1
  },
  {
    id: 'attendance',
    name: 'Attendance',
    description: 'Punctuality and attendance achievements',
    icon: Clock,
    count: 1
  },
  {
    id: 'special',
    name: 'Special',
    description: 'Unique and recognition achievements',
    icon: Trophy,
    count: 1
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'User-created achievement templates',
    icon: Wand2,
    count: 0
  }
]

export function AchievementTemplates() {
  const [templates, setTemplates] = useState<AchievementTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AchievementTemplate | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<AchievementTemplate | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importData, setImportData] = useState('')

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'custom' as const,
    tags: [] as string[],
    is_public: false,
    achievements: [] as AchievementCreateData[]
  })

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTemplates(defaultTemplates)
      setLoading(false)
    }, 1000)
  }, [])

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  const handleCreateTemplate = async () => {
    try {
      setLoading(true)
      
      const newTemplate: AchievementTemplate = {
        id: `template-${Date.now()}`,
        ...templateForm,
        created_at: new Date().toISOString(),
        created_by: 'current-user',
        usage_count: 0
      }

      setTemplates(prev => [newTemplate, ...prev])
      setTemplateForm({
        name: '',
        description: '',
        category: 'custom',
        tags: [],
        is_public: false,
        achievements: []
      })
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Error creating template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditTemplate = async () => {
    if (!editingTemplate) return
    
    try {
      setLoading(true)
      
      const updatedTemplate: AchievementTemplate = {
        ...editingTemplate,
        ...templateForm
      }

      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t))
      setEditingTemplate(null)
      setShowEditDialog(false)
    } catch (error) {
      console.error('Error updating template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return
    
    try {
      setTemplates(prev => prev.filter(t => t.id !== deletingTemplate.id))
      setDeletingTemplate(null)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handleDuplicateTemplate = (template: AchievementTemplate) => {
    const duplicatedTemplate: AchievementTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      created_at: new Date().toISOString(),
      created_by: 'current-user',
      usage_count: 0,
      is_public: false
    }
    
    setTemplates(prev => [duplicatedTemplate, ...prev])
  }

  const handleUseTemplate = async (template: AchievementTemplate) => {
    try {
      setLoading(true)
      
      // Create achievements from template
      await achievementService.bulkCreateAchievements(template.achievements)
      
      // Update usage count
      setTemplates(prev => prev.map(t => 
        t.id === template.id 
          ? { ...t, usage_count: t.usage_count + 1 }
          : t
      ))
      
      // Show success message
      console.log(`Created ${template.achievements.length} achievements from template`)
    } catch (error) {
      console.error('Error using template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportTemplate = (template: AchievementTemplate) => {
    const exportData = {
      template: {
        name: template.name,
        description: template.description,
        category: template.category,
        achievements: template.achievements,
        tags: template.tags
      },
      exported_at: new Date().toISOString(),
      exported_by: 'current-user'
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportTemplate = () => {
    try {
      const importedData = JSON.parse(importData)
      
      if (!importedData.template) {
        throw new Error('Invalid template format')
      }
      
      const newTemplate: AchievementTemplate = {
        id: `template-${Date.now()}`,
        ...importedData.template,
        created_at: new Date().toISOString(),
        created_by: 'current-user',
        usage_count: 0,
        is_public: false
      }
      
      setTemplates(prev => [newTemplate, ...prev])
      setImportData('')
      setShowImportDialog(false)
    } catch (error) {
      console.error('Error importing template:', error)
      // Show error message
    }
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

  const getCategoryIcon = (category: string) => {
    const categoryData = templateCategories.find(c => c.id === category)
    return categoryData ? <categoryData.icon className="h-4 w-4" /> : <Package className="h-4 w-4" />
  }

  if (loading && templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Template className="h-4 w-4" />
            <span>Achievement Templates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Template className="h-4 w-4" />
                <span>Achievement Templates</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Pre-built achievement packages for quick deployment
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
                <Import className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Stats */}
          <motion.div 
            variants={staggerItem}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            {templateCategories.map((category) => {
              const count = templates.filter(t => t.category === category.id).length
              return (
                <div key={category.id} className="text-center p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <category.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">{category.name}</div>
                </div>
              )
            })}
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
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {templateCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-2">
                      <category.icon className="h-4 w-4" />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Template Grid */}
          {filteredTemplates.length > 0 ? (
            <motion.div 
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    variants={scaleVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="group"
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(template.category)}
                            <div>
                              <h3 className="font-semibold line-clamp-1">{template.name}</h3>
                              <p className="text-xs text-muted-foreground capitalize">
                                {template.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {template.is_public && (
                              <Badge variant="secondary" className="text-xs">
                                Public
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {template.usage_count} uses
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>

                        {/* Achievement Preview */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">
                            Achievements ({template.achievements.length})
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {template.achievements.slice(0, 4).map((achievement, index) => (
                              <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded text-xs">
                                <div 
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                                  style={{ backgroundColor: achievement.badge_color }}
                                >
                                  {achievement.icon_name}
                                </div>
                                <span className="truncate">{achievement.name}</span>
                              </div>
                            ))}
                          </div>
                          {template.achievements.length > 4 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{template.achievements.length - 4} more achievements
                            </p>
                          )}
                        </div>

                        {/* Tags */}
                        {template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <Button
                            size="sm"
                            onClick={() => handleUseTemplate(template)}
                            disabled={loading}
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            Use Template
                          </Button>
                          
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDuplicateTemplate(template)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportTemplate(template)}
                            >
                              <Export className="h-4 w-4" />
                            </Button>
                            {!template.is_public && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingTemplate(template)
                                    setTemplateForm({
                                      name: template.name,
                                      description: template.description,
                                      category: template.category,
                                      tags: template.tags,
                                      is_public: template.is_public,
                                      achievements: template.achievements
                                    })
                                    setShowEditDialog(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setDeletingTemplate(template)
                                    setShowDeleteDialog(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              variants={staggerItem}
              className="text-center py-12"
            >
              <Template className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Create your first achievement template to get started.'}
              </p>
              {(searchTerm || selectedCategory !== 'all') ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Achievement Template</DialogTitle>
            <DialogDescription>
              Create a reusable template with multiple achievements
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Template Name *</label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Academic Excellence Package"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category *</label>
                <Select 
                  value={templateForm.category} 
                  onValueChange={(value: any) => setTemplateForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateCategories.filter(c => c.id !== 'all').map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          <category.icon className="h-4 w-4" />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this template includes and when to use it"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input
                value={templateForm.tags.join(', ')}
                onChange={(e) => setTemplateForm(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }))}
                placeholder="e.g., academic, grades, study"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={templateForm.is_public}
                onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_public: checked }))}
              />
              <label className="text-sm font-medium">Make template public</label>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Note: You'll be able to add achievements to this template after creating it. 
                Or you can use the Achievement Builder to create achievements and then organize them into templates.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!templateForm.name || loading}
            >
              <Save className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template information and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Template Name *</label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Academic Excellence Package"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category *</label>
                <Select 
                  value={templateForm.category} 
                  onValueChange={(value: any) => setTemplateForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateCategories.filter(c => c.id !== 'all').map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          <category.icon className="h-4 w-4" />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this template includes and when to use it"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input
                value={templateForm.tags.join(', ')}
                onChange={(e) => setTemplateForm(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }))}
                placeholder="e.g., academic, grades, study"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={templateForm.is_public}
                onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_public: checked }))}
              />
              <label className="text-sm font-medium">Make template public</label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditTemplate}
              disabled={!templateForm.name || loading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Template Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Achievement Template</DialogTitle>
            <DialogDescription>
              Import a template from a JSON file or paste the template data
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Template JSON Data</label>
              <Textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste the exported template JSON here..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p>Expected format:</p>
              <pre className="mt-1 p-2 bg-muted rounded text-xs">
{`{
  "template": {
    "name": "Template Name",
    "description": "Template description",
    "category": "custom",
    "achievements": [...],
    "tags": [...]
  }
}`}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImportTemplate}
              disabled={!importData.trim()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTemplate?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}