'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  MessageSquare,
  Star,
  Clock,
  Award,
  TrendingUp,
  Users,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface SmartPrompt {
  id: string
  type: 'contextual' | 'follow_up' | 'quality_improvement' | 'celebration' | 'reminder'
  title: string
  message: string
  action: {
    label: string
    type: 'feedback' | 'template' | 'quick_action'
    data: any
  }
  context: {
    triggeredBy: string
    userId: string
    userName: string
    userType: 'student' | 'teacher'
    relatedEntity?: string
    timestamp: Date
  }
  priority: 'low' | 'medium' | 'high'
  suggestedResponses?: string[]
  auto_dismiss_after?: number // minutes
}

interface SmartFeedbackPromptsProps {
  prompts: SmartPrompt[]
  onAction: (promptId: string, actionType: string, data?: any) => void
  onDismiss: (promptId: string) => void
  position?: 'toast' | 'inline' | 'sidebar'
  className?: string
}

export function SmartFeedbackPrompts({
  prompts = [],
  onAction,
  onDismiss,
  position = 'toast',
  className
}: SmartFeedbackPromptsProps) {
  const { toast } = useToast()
  const [visiblePrompts, setVisiblePrompts] = useState<Set<string>>(new Set())
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Show new prompts with animation
    const newPromptIds = prompts.map(p => p.id).filter(id => !visiblePrompts.has(id))
    if (newPromptIds.length > 0) {
      setVisiblePrompts(prev => new Set([...prev, ...newPromptIds]))
    }

    // Auto-dismiss prompts after specified time
    const timers = prompts
      .filter(prompt => prompt.auto_dismiss_after)
      .map(prompt => setTimeout(() => {
        handleDismiss(prompt.id)
      }, (prompt.auto_dismiss_after || 5) * 60 * 1000))

    return () => timers.forEach(clearTimeout)
  }, [prompts])

  const handleAction = (promptId: string, actionType: string, data?: any) => {
    onAction(promptId, actionType, data)
    handleDismiss(promptId)
    
    toast({
      title: "Action completed",
      description: "Thank you for providing feedback!"
    })
  }

  const handleDismiss = (promptId: string) => {
    setAnimatingOut(prev => new Set([...prev, promptId]))
    
    setTimeout(() => {
      setVisiblePrompts(prev => {
        const newSet = new Set(prev)
        newSet.delete(promptId)
        return newSet
      })
      setAnimatingOut(prev => {
        const newSet = new Set(prev)
        newSet.delete(promptId)
        return newSet
      })
      onDismiss(promptId)
    }, 300)
  }

  const getPromptIcon = (type: SmartPrompt['type']) => {
    switch (type) {
      case 'contextual':
        return MessageSquare
      case 'follow_up':
        return TrendingUp
      case 'quality_improvement':
        return Star
      case 'celebration':
        return Award
      case 'reminder':
        return Clock
      default:
        return Sparkles
    }
  }

  const getPriorityStyle = (priority: SmartPrompt['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-orange-200 bg-orange-50 shadow-lg'
      case 'medium':
        return 'border-blue-200 bg-blue-50 shadow-md'
      case 'low':
        return 'border-gray-200 bg-gray-50 shadow-sm'
    }
  }

  const getPromptColor = (type: SmartPrompt['type']) => {
    switch (type) {
      case 'celebration':
        return 'text-green-600'
      case 'quality_improvement':
        return 'text-orange-600'
      case 'reminder':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const visiblePromptsList = prompts.filter(prompt => visiblePrompts.has(prompt.id))

  if (visiblePromptsList.length === 0) {
    return null
  }

  if (position === 'toast') {
    return (
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        {visiblePromptsList.map((prompt) => {
          const IconComponent = getPromptIcon(prompt.type)
          const isAnimatingOut = animatingOut.has(prompt.id)
          
          return (
            <Card
              key={prompt.id}
              className={cn(
                "transition-all duration-300 transform",
                getPriorityStyle(prompt.priority),
                isAnimatingOut ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
                className
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "flex-shrink-0 p-2 rounded-full bg-white shadow-sm",
                    getPromptColor(prompt.type)
                  )}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium truncate">
                        {prompt.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleDismiss(prompt.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {prompt.message}
                    </p>

                    {/* Context Info */}
                    <div className="flex items-center space-x-2 mb-3 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{prompt.context.userName}</span>
                      {prompt.context.relatedEntity && (
                        <>
                          <span>•</span>
                          <span>{prompt.context.relatedEntity}</span>
                        </>
                      )}
                    </div>

                    {/* Quick Response Options */}
                    {prompt.suggestedResponses && prompt.suggestedResponses.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {prompt.suggestedResponses.slice(0, 2).map((response, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs justify-start h-7"
                            onClick={() => handleAction(prompt.id, 'quick_response', response)}
                          >
                            "{response}"
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Primary Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{prompt.context.timestamp.toLocaleTimeString()}</span>
                      </div>
                      
                      <Button
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleAction(prompt.id, prompt.action.type, prompt.action.data)}
                      >
                        {prompt.action.label}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  if (position === 'inline') {
    return (
      <div className={cn("space-y-3", className)}>
        {visiblePromptsList.map((prompt) => {
          const IconComponent = getPromptIcon(prompt.type)
          const isAnimatingOut = animatingOut.has(prompt.id)
          
          return (
            <Card
              key={prompt.id}
              className={cn(
                "transition-all duration-300",
                getPriorityStyle(prompt.priority),
                isAnimatingOut ? "opacity-0 scale-95" : "opacity-100 scale-100"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-start space-x-3">
                  <IconComponent className={cn("h-4 w-4 mt-1", getPromptColor(prompt.type))} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium">{prompt.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {prompt.priority}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDismiss(prompt.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {prompt.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{prompt.context.userName}</span>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => handleAction(prompt.id, prompt.action.type, prompt.action.data)}
                      >
                        {prompt.action.label}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Sidebar position
  return (
    <div className={cn("w-64 space-y-2", className)}>
      <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center space-x-2">
        <Sparkles className="h-4 w-4" />
        <span>Smart Suggestions</span>
        <Badge variant="outline">{visiblePromptsList.length}</Badge>
      </div>
      
      {visiblePromptsList.map((prompt) => {
        const IconComponent = getPromptIcon(prompt.type)
        const isAnimatingOut = animatingOut.has(prompt.id)
        
        return (
          <Card
            key={prompt.id}
            className={cn(
              "transition-all duration-300 cursor-pointer hover:shadow-md",
              getPriorityStyle(prompt.priority),
              isAnimatingOut ? "opacity-0 scale-95" : "opacity-100 scale-100"
            )}
          >
            <CardContent className="p-3">
              <div className="flex items-start space-x-2">
                <IconComponent className={cn("h-3 w-3 mt-1", getPromptColor(prompt.type))} />
                
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-medium truncate mb-1">
                    {prompt.title}
                  </h5>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {prompt.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate">
                      {prompt.context.userName}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-6 px-2"
                      onClick={() => handleAction(prompt.id, prompt.action.type, prompt.action.data)}
                    >
                      Act
                    </Button>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground"
                  onClick={() => handleDismiss(prompt.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}