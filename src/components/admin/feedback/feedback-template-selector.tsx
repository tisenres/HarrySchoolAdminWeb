'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  FileText,
  Star,
  Clock,
  Users,
  Award,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Filter,
  Search,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import type { FeedbackTemplate } from '@/types/feedback'

interface FeedbackTemplateWithContext extends FeedbackTemplate {
  usage_count?: number
  success_rate?: number
  average_rating?: number
  context_relevance_score?: number
  recommended_for?: string[]
  effectiveness_tags?: string[]
}

interface FeedbackTemplateSelectorProps {
  templates: FeedbackTemplateWithContext[]
  context: {
    userType: 'student' | 'teacher'
    userName: string
    groupName?: string
    situation?: 'class_completion' | 'achievement' | 'improvement' | 'general'
    recentActivity?: string
    relationshipDuration?: number // months
  }
  onSelectTemplate: (template: FeedbackTemplateWithContext) => void
  onCustomFeedback: () => void
  showRecommendations?: boolean
  className?: string
}

export function FeedbackTemplateSelector({
  templates = [],
  context,
  onSelectTemplate,
  onCustomFeedback,
  showRecommendations = true,
  className
}: FeedbackTemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [filteredTemplates, setFilteredTemplates] = useState<FeedbackTemplateWithContext[]>([])

  // Smart template ranking based on context
  useEffect(() => {
    let scored = templates.map(template => {
      let score = 0
      
      // Base usage and success factors
      score += (template.usage_count || 0) * 0.1
      score += (template.success_rate || 0) * 0.3
      score += (template.average_rating || 0) * 0.2
      
      // Context relevance
      score += (template.context_relevance_score || 0) * 0.4
      
      // Situation matching
      if (template.recommended_for?.includes(context.situation || 'general')) {
        score += 20
      }
      
      // User type matching
      if (template.feedback_direction === `student_to_${context.userType}` || 
          template.feedback_direction === `${context.userType}_to_student`) {
        score += 15
      }
      
      // Recent activity boost
      if (context.recentActivity && 
          template.message_template?.toLowerCase().includes(context.recentActivity.toLowerCase())) {
        score += 10
      }
      
      return { ...template, smart_score: score }
    })

    // Apply filters
    if (searchTerm) {
      scored = scored.filter(template =>
        template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.message_template?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      scored = scored.filter(template => template.category === selectedCategory)
    }

    // Sort by smart score
    scored.sort((a, b) => (b.smart_score || 0) - (a.smart_score || 0))
    
    setFilteredTemplates(scored)
  }, [templates, searchTerm, selectedCategory, context])

  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)))
  const recommendedTemplates = filteredTemplates.slice(0, 3)
  const otherTemplates = filteredTemplates.slice(3)

  const getTemplateIcon = (category?: string) => {
    switch (category) {
      case 'teaching_quality':
        return Award
      case 'communication':
        return MessageSquare
      case 'behavior':
        return Users
      case 'homework':
        return FileText
      case 'attendance':
        return Clock
      default:
        return Star
    }
  }

  const getEffectivenessColor = (rate?: number) => {
    if (!rate) return 'text-gray-500'
    if (rate >= 0.8) return 'text-green-600'
    if (rate >= 0.6) return 'text-blue-600'
    return 'text-orange-600'
  }

  const formatUsageStats = (template: FeedbackTemplateWithContext) => {
    const stats = []
    if (template.usage_count) {
      stats.push(`${template.usage_count} uses`)
    }
    if (template.success_rate) {
      stats.push(`${Math.round(template.success_rate * 100)}% effective`)
    }
    if (template.average_rating) {
      stats.push(`${template.average_rating.toFixed(1)}/5 rating`)
    }
    return stats.join(' • ')
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <span>Smart Templates</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredTemplates.length} available
          </Badge>
        </CardTitle>
        
        {/* Context Display */}
        <div className="text-sm text-muted-foreground">
          Suggestions for <span className="font-medium">{context.userName}</span>
          {context.groupName && <span> in {context.groupName}</span>}
          {context.situation && <span> • {context.situation.replace('_', ' ')}</span>}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center space-x-2 overflow-x-auto">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="whitespace-nowrap"
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category || '')}
                className="whitespace-nowrap"
              >
                {category?.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Recommended Templates */}
        {showRecommendations && recommendedTemplates.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Recommended for You</span>
            </div>
            
            <div className="space-y-2">
              {recommendedTemplates.map((template, index) => {
                const IconComponent = getTemplateIcon(template.category)
                
                return (
                  <Card
                    key={template.id}
                    className="border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors cursor-pointer"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="p-1.5 bg-green-100 rounded-full">
                            <IconComponent className="h-3 w-3 text-green-600" />
                          </div>
                          {index === 0 && (
                            <Badge className="mt-1 text-xs bg-green-600">
                              Best Match
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium truncate">
                              {template.template_name}
                            </h4>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {template.message_template}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {template.effectiveness_tags?.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            {template.success_rate && (
                              <span className={cn(
                                "text-xs font-medium",
                                getEffectivenessColor(template.success_rate)
                              )}>
                                {Math.round(template.success_rate * 100)}% effective
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Other Templates */}
        {otherTemplates.length > 0 && (
          <>
            {showRecommendations && <Separator />}
            
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">All Templates</span>
                <span className="text-xs text-muted-foreground">
                  {otherTemplates.length} templates
                </span>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-4">
                  {otherTemplates.map((template) => {
                    const IconComponent = getTemplateIcon(template.category)
                    
                    return (
                      <Card
                        key={template.id}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => onSelectTemplate(template)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-3">
                            <IconComponent className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="text-sm font-medium truncate">
                                  {template.template_name}
                                </h5>
                                {template.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {template.category.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                {template.message_template}
                              </p>
                              
                              {/* Usage Stats */}
                              <div className="text-xs text-muted-foreground">
                                {formatUsageStats(template)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {/* Custom Feedback Option */}
        <Separator />
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onCustomFeedback}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Write Custom Feedback
        </Button>

        {/* No Results */}
        {filteredTemplates.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center py-8">
            <div className="space-y-2">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No templates found matching your criteria
              </p>
              <Button variant="outline" size="sm" onClick={onCustomFeedback}>
                Create Custom Feedback
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}