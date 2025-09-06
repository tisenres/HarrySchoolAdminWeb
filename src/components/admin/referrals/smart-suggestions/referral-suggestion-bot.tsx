'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle,
  Bot,
  Send,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Users,
  Target,
  Star,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Heart,
  BookOpen,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CoachingSession {
  id: string
  user_id: string
  started_at: Date
  current_topic: string
  user_context: {
    referral_history: {
      total_referrals: number
      successful_referrals: number
      conversion_rate: number
    }
    recent_achievements: string[]
    engagement_level: 'high' | 'medium' | 'low'
    coaching_preferences: string[]
  }
}

interface BotMessage {
  id: string
  type: 'bot' | 'user' | 'suggestion' | 'tip'
  content: string
  timestamp: Date
  metadata?: {
    topic?: string
    confidence?: number
    actions?: string[]
    helpful?: boolean
  }
}

interface ReferralTip {
  id: string
  category: 'timing' | 'approach' | 'targeting' | 'follow_up' | 'personal_story'
  title: string
  description: string
  example: string
  success_rate: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

interface ReferralSuggestionBotProps {
  isOpen: boolean
  isMinimized: boolean
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  userContext?: {
    user_id: string
    user_name: string
    referral_experience: 'none' | 'some' | 'experienced'
    recent_achievements: string[]
    current_goals: string[]
  }
}

export function ReferralSuggestionBot({
  isOpen,
  isMinimized,
  onClose,
  onMinimize,
  onMaximize,
  userContext
}: ReferralSuggestionBotProps) {
  const [messages, setMessages] = useState<BotMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentTopic, setCurrentTopic] = useState<string>('welcome')
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize conversation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        addBotMessage(getWelcomeMessage())
      }, 500)
    }
  }, [isOpen])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addBotMessage = (content: string, metadata?: any) => {
    const message: BotMessage = {
      id: `bot_${Date.now()}`,
      type: 'bot',
      content,
      timestamp: new Date(),
      metadata
    }
    setMessages(prev => [...prev, message])
  }

  const addUserMessage = (content: string) => {
    const message: BotMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const addSuggestion = (content: string, actions: string[]) => {
    const message: BotMessage = {
      id: `suggestion_${Date.now()}`,
      type: 'suggestion',
      content,
      timestamp: new Date(),
      metadata: { actions }
    }
    setMessages(prev => [...prev, message])
  }

  const getWelcomeMessage = (): string => {
    if (!userContext) {
      return "Hi! I'm your referral coaching assistant. I'm here to help you share your positive experience with friends who might benefit from our community. What would you like to know about making great referrals?"
    }

    const experience = userContext.referral_experience
    const name = userContext.user_name

    if (experience === 'none') {
      return `Hi ${name}! 🌟 I see this might be your first time referring someone - that's exciting! I'm here to help you share your experience in a natural, helpful way. Let's start with understanding who might be a great fit for our community.`
    } else if (experience === 'some') {
      return `Welcome back, ${name}! 👋 I see you've made some referrals before. Let's work together to improve your approach and help you find even better matches for our community.`
    } else {
      return `Hey ${name}! 🎯 Great to see an experienced referrer! I'm here to help you optimize your strategy and discover new opportunities based on your recent achievements.`
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userInput = inputValue.trim()
    addUserMessage(userInput)
    setInputValue('')
    setIsTyping(true)
    setShowQuickActions(false)

    // Simulate bot processing and response
    setTimeout(() => {
      const response = generateBotResponse(userInput)
      addBotMessage(response.message, response.metadata)
      
      if (response.suggestions) {
        setTimeout(() => {
          response.suggestions?.forEach(suggestion => {
            addSuggestion(suggestion.content, suggestion.actions)
          })
        }, 1000)
      }
      
      setIsTyping(false)
    }, 1500)
  }

  const generateBotResponse = (userInput: string) => {
    const input = userInput.toLowerCase()
    
    // Intent recognition
    if (input.includes('who') || input.includes('target') || input.includes('friend')) {
      setCurrentTopic('targeting')
      return {
        message: "Great question! The best referrals come from understanding what makes someone a good fit. Based on your achievements, I can suggest some ideal personality types and interests to look for.",
        metadata: { topic: 'targeting', confidence: 90 },
        suggestions: [
          {
            content: "Look for friends who are goal-oriented and appreciate structured learning environments",
            actions: ["View targeting tips", "See examples"]
          },
          {
            content: "Consider people who have mentioned wanting to learn new skills or improve themselves",
            actions: ["Personal story template", "Conversation starters"]
          }
        ]
      }
    }
    
    if (input.includes('when') || input.includes('timing') || input.includes('time')) {
      setCurrentTopic('timing')
      return {
        message: "Timing is crucial for referrals! The best moments are when you're genuinely excited about your progress or when friends express interest in similar goals.",
        metadata: { topic: 'timing', confidence: 85 },
        suggestions: [
          {
            content: "Right after achieving a milestone or receiving positive feedback",
            actions: ["Learn why", "See script examples"]
          },
          {
            content: "When friends mention challenges you've successfully overcome here",
            actions: ["Response templates", "Success stories"]
          }
        ]
      }
    }
    
    if (input.includes('how') || input.includes('approach') || input.includes('start')) {
      setCurrentTopic('approach')
      return {
        message: "The best approach is natural and genuine. Share your authentic experience rather than trying to 'sell' anything. People connect with real stories and outcomes.",
        metadata: { topic: 'approach', confidence: 95 },
        suggestions: [
          {
            content: "Start with your own transformation or positive experience",
            actions: ["Story framework", "Personal examples"]
          },
          {
            content: "Focus on how the community/program solved a specific challenge",
            actions: ["Problem-solution template", "Conversation flow"]
          }
        ]
      }
    }
    
    if (input.includes('follow') || input.includes('after') || input.includes('next')) {
      setCurrentTopic('follow_up')
      return {
        message: "Following up shows you care about their success, not just making a referral. The key is being helpful and supportive throughout their decision process.",
        metadata: { topic: 'follow_up', confidence: 80 },
        suggestions: [
          {
            content: "Check in to answer questions, not to pressure",
            actions: ["Follow-up scripts", "Timing guidelines"]
          },
          {
            content: "Share additional resources or connect them with others who can help",
            actions: ["Resource list", "Introduction templates"]
          }
        ]
      }
    }

    // Default response
    return {
      message: "I understand you're looking for referral guidance. Let me help you with some personalized suggestions based on your experience and recent achievements.",
      metadata: { topic: 'general', confidence: 70 },
      suggestions: [
        {
          content: "Let's identify your ideal referral prospects",
          actions: ["Start targeting exercise", "View personality matches"]
        },
        {
          content: "Work on your personal referral story",
          actions: ["Story builder", "Template examples"]
        }
      ]
    }
  }

  const handleQuickAction = (action: string) => {
    addUserMessage(action)
    setTimeout(() => {
      const response = generateBotResponse(action)
      addBotMessage(response.message, response.metadata)
    }, 1000)
  }

  const markHelpful = (messageId: string, helpful: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, metadata: { ...msg.metadata, helpful } }
        : msg
    ))
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        height: isMinimized ? 'auto' : '500px'
      }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-4 right-4 z-50 w-80"
    >
      <Card className="shadow-xl border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Referral Coach</CardTitle>
                <div className="text-xs text-muted-foreground">AI-powered guidance</div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={isMinimized ? onMaximize : onMinimize}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="space-y-4">
            {/* Messages */}
            <ScrollArea className="h-64 pr-3">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.type === 'bot' && (
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="bg-white p-3 rounded-lg border text-sm">
                            {message.content}
                          </div>
                          {message.metadata && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {message.metadata.topic}
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markHelpful(message.id, true)}
                                  className={cn(
                                    "h-4 w-4 p-0",
                                    message.metadata.helpful === true && "text-green-600"
                                  )}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markHelpful(message.id, false)}
                                  className={cn(
                                    "h-4 w-4 p-0",
                                    message.metadata.helpful === false && "text-red-600"
                                  )}
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {message.type === 'user' && (
                      <div className="flex gap-2 justify-end">
                        <div className="bg-blue-600 text-white p-3 rounded-lg text-sm max-w-xs">
                          {message.content}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs">U</span>
                        </div>
                      </div>
                    )}

                    {message.type === 'suggestion' && (
                      <div className="ml-8">
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              {message.content}
                              {message.metadata?.actions && (
                                <div className="flex gap-1 mt-2">
                                  {message.metadata.actions.map((action: string, index: number) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-6"
                                      onClick={() => handleQuickAction(action)}
                                    >
                                      {action}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Quick Actions */}
            {showQuickActions && messages.length <= 1 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Quick help:</div>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Who should I refer?",
                    "When is the best time?",
                    "How do I start the conversation?",
                    "What should I say?",
                    "How to follow up?"
                  ].map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me about referrals..."
                className="text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-1 text-xs text-blue-600 bg-blue-50 rounded p-2">
              <Heart className="h-3 w-3" />
              <span>Helping you share success authentically</span>
            </div>
          </CardContent>
        )}

        {isMinimized && (
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Referral coach available</span>
              <Badge variant="outline" className="text-xs ml-auto">
                {messages.length} messages
              </Badge>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}