'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Lightbulb,
  Star,
  Users,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Heart,
  BookOpen,
  Award,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  Send,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QualityTip {
  id: string
  category: 'targeting' | 'timing' | 'messaging' | 'follow_up' | 'authenticity'
  title: string
  description: string
  example: string
  do_example: string
  dont_example: string
  success_rate_impact: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  personalized: boolean
}

interface ReferralTemplate {
  id: string
  name: string
  context: string
  template: string
  success_rate: number
  customizable_fields: string[]
  tone: 'casual' | 'professional' | 'excited' | 'supportive'
}

interface QualityAnalysis {
  overall_score: number
  authenticity_score: number
  relevance_score: number
  timing_score: number
  personalization_score: number
  improvements: string[]
  strengths: string[]
}

interface ReferralQualityHelperProps {
  userContext: {
    user_id: string
    user_name: string
    experience_level: 'beginner' | 'intermediate' | 'advanced'
    recent_achievements: string[]
    referral_history: {
      total_sent: number
      successful: number
      conversion_rate: number
    }
  }
  onPreviewReferral: (content: string) => void
  onSendReferral: (content: string, recipient: string) => void
}

export function ReferralQualityHelper({
  userContext,
  onPreviewReferral,
  onSendReferral
}: ReferralQualityHelperProps) {
  const [selectedTab, setSelectedTab] = useState('tips')
  const [currentTip, setCurrentTip] = useState<QualityTip | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ReferralTemplate | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [qualityAnalysis, setQualityAnalysis] = useState<QualityAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Get personalized tips based on user experience and history
  const getPersonalizedTips = (): QualityTip[] => {
    const baseTips: QualityTip[] = [
      {
        id: 'authenticity_1',
        category: 'authenticity',
        title: 'Share Your Real Experience',
        description: 'People connect with genuine stories about your actual transformation or progress.',
        example: 'Instead of general praise, share specific moments that impacted you.',
        do_example: '"The way the teachers here helped me overcome my fear of public speaking was incredible. I went from avoiding presentations to actually enjoying them!"',
        dont_example: '"This place is great, you should check it out."',
        success_rate_impact: 35,
        difficulty: 'beginner',
        personalized: true
      },
      {
        id: 'targeting_1',
        category: 'targeting',
        title: 'Match Their Goals',
        description: 'Connect your referral to what they\'ve specifically mentioned wanting to achieve.',
        example: 'Reference conversations where they expressed challenges or aspirations.',
        do_example: '"Remember when you mentioned wanting to improve your presentation skills? The communication workshops here have been game-changing for me."',
        dont_example: '"You should join because it\'s good for everyone."',
        success_rate_impact: 40,
        difficulty: 'intermediate',
        personalized: true
      },
      {
        id: 'timing_1',
        category: 'timing',
        title: 'Leverage Positive Momentum',
        description: 'Share your success when you\'re genuinely excited about recent achievements.',
        example: 'Use moments when you\'ve just accomplished something meaningful.',
        do_example: '"I just got promoted after applying the leadership skills I learned here. I couldn\'t help but think of your career goals!"',
        dont_example: 'Sending referrals when you\'re feeling neutral or frustrated.',
        success_rate_impact: 25,
        difficulty: 'beginner',
        personalized: false
      },
      {
        id: 'messaging_1',
        category: 'messaging',
        title: 'Focus on Their Benefits',
        description: 'Frame your message around how it could specifically help them, not how great the program is.',
        example: 'Connect program features to their individual needs and challenges.',
        do_example: '"Given your interest in data analysis, you\'d love the hands-on projects they have here. It\'s exactly the practical experience you were looking for."',
        dont_example: '"This program has amazing teachers and great facilities."',
        success_rate_impact: 30,
        difficulty: 'intermediate',
        personalized: true
      },
      {
        id: 'follow_up_1',
        category: 'follow_up',
        title: 'Support Their Decision Process',
        description: 'Follow up with helpful information rather than pressure to decide quickly.',
        example: 'Offer to answer questions or connect them with relevant resources.',
        do_example: '"No pressure at all! If you have any questions about the program structure or want to chat with another student, I\'m happy to help."',
        dont_example: '"Have you decided yet? The deadline is coming up!"',
        success_rate_impact: 20,
        difficulty: 'advanced',
        personalized: false
      }
    ]

    // Filter and personalize based on user experience level
    return baseTips.filter(tip => {
      if (userContext.experience_level === 'beginner') {
        return tip.difficulty === 'beginner' || tip.difficulty === 'intermediate'
      } else if (userContext.experience_level === 'intermediate') {
        return tip.difficulty !== 'advanced'
      }
      return true
    }).slice(0, 3) // Show top 3 most relevant tips
  }

  const getReferralTemplates = (): ReferralTemplate[] => {
    return [
      {
        id: 'achievement_celebration',
        name: 'Achievement Celebration',
        context: 'After unlocking an achievement or reaching a milestone',
        template: `Hey {name}! 🎉 

I just {achievement} and I couldn't help but think of you! You mentioned wanting to {their_goal}, and honestly, the supportive environment here has been incredible for helping me reach milestones like this.

{specific_benefit}

Would love to chat more about it if you're interested - no pressure though! 

{your_name}`,
        success_rate: 78,
        customizable_fields: ['name', 'achievement', 'their_goal', 'specific_benefit', 'your_name'],
        tone: 'excited'
      },
      {
        id: 'problem_solution',
        name: 'Problem-Solution Match',
        context: 'When you know they\'re facing a challenge you\'ve overcome',
        template: `Hi {name},

I remember you mentioning {their_challenge}. I was just thinking about how much the {specific_program_aspect} here helped me with exactly that issue.

{your_transformation_story}

If you're still looking for ways to tackle this, I'd be happy to share more about my experience. The approach they take here is really practical and supportive.

Let me know if you'd like to chat!

Best,
{your_name}`,
        success_rate: 85,
        customizable_fields: ['name', 'their_challenge', 'specific_program_aspect', 'your_transformation_story', 'your_name'],
        tone: 'supportive'
      },
      {
        id: 'casual_sharing',
        name: 'Casual Experience Sharing',
        context: 'Natural conversation starter about your positive experience',
        template: `Hey {name}!

Hope you're doing well! I've been meaning to share something cool with you. You know how I've been working on {your_goal}? The progress I've made through {program_name} has been amazing.

{specific_example}

I know you've been interested in {their_interest}, and I think you'd really enjoy the community and approach here. Would you like to know more about it?

{your_name}`,
        success_rate: 72,
        customizable_fields: ['name', 'your_goal', 'program_name', 'specific_example', 'their_interest', 'your_name'],
        tone: 'casual'
      },
      {
        id: 'professional_recommendation',
        name: 'Professional Recommendation',
        context: 'For professional contacts or career-focused referrals',
        template: `Dear {name},

I hope this message finds you well. Given our previous conversations about {professional_topic}, I wanted to share an opportunity that has significantly impacted my professional development.

{professional_outcome}

The {specific_skills_or_knowledge} I've gained through {program_name} directly addresses the challenges we discussed regarding {their_professional_challenge}.

I believe this could be valuable for your {their_goal}. I'd be happy to discuss my experience in more detail if you're interested.

Best regards,
{your_name}`,
        success_rate: 80,
        customizable_fields: ['name', 'professional_topic', 'professional_outcome', 'specific_skills_or_knowledge', 'program_name', 'their_professional_challenge', 'their_goal', 'your_name'],
        tone: 'professional'
      }
    ]
  }

  const analyzeMessageQuality = (message: string): QualityAnalysis => {
    // Simulate AI quality analysis
    const personalWords = ['I', 'my', 'me', 'personally'].filter(word => 
      message.toLowerCase().includes(word)
    ).length
    
    const benefitWords = ['you', 'your', 'help', 'benefit', 'achieve'].filter(word => 
      message.toLowerCase().includes(word)
    ).length
    
    const authenticityIndicators = ['experienced', 'learned', 'achieved', 'overcome', 'discovered'].filter(word => 
      message.toLowerCase().includes(word)
    ).length
    
    const authenticity_score = Math.min(100, (authenticityIndicators + personalWords) * 15)
    const relevance_score = Math.min(100, benefitWords * 20)
    const personalization_score = Math.min(100, (message.split('{').length - 1) * 25 + benefitWords * 10)
    const timing_score = 75 // Would be based on actual timing context
    
    const overall_score = Math.round((authenticity_score + relevance_score + personalization_score + timing_score) / 4)
    
    const improvements = []
    const strengths = []
    
    if (authenticity_score < 60) improvements.push("Add more personal experience and specific examples")
    else strengths.push("Good use of personal experience")
    
    if (relevance_score < 60) improvements.push("Focus more on recipient's benefits and needs")
    else strengths.push("Clear focus on recipient benefits")
    
    if (personalization_score < 60) improvements.push("Include more specific details about the recipient")
    else strengths.push("Well personalized message")
    
    if (message.length < 100) improvements.push("Provide more context and details")
    if (message.length > 500) improvements.push("Consider making the message more concise")
    
    return {
      overall_score,
      authenticity_score,
      relevance_score,
      timing_score,
      personalization_score,
      improvements,
      strengths
    }
  }

  const handleAnalyzeMessage = () => {
    if (!customMessage.trim()) return
    
    setIsAnalyzing(true)
    setTimeout(() => {
      const analysis = analyzeMessageQuality(customMessage)
      setQualityAnalysis(analysis)
      setIsAnalyzing(false)
    }, 1500)
  }

  const handleUseTemplate = (template: ReferralTemplate) => {
    setSelectedTemplate(template)
    setCustomMessage(template.template)
    setSelectedTab('composer')
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-purple-100 text-purple-800'
    }
    return colors[difficulty as keyof typeof colors] || colors.beginner
  }

  const tips = getPersonalizedTips()
  const templates = getReferralTemplates()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Referral Quality Helper
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered guidance for creating authentic, effective referrals
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {userContext.experience_level} level
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tips">Quality Tips</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="composer">Composer</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            {/* Quality Tips */}
            <TabsContent value="tips" className="space-y-4">
              <div className="grid gap-4">
                {tips.map((tip) => (
                  <motion.div
                    key={tip.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      currentTip?.id === tip.id && "ring-2 ring-blue-500"
                    )} onClick={() => setCurrentTip(currentTip?.id === tip.id ? null : tip)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Star className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{tip.title}</h3>
                              <p className="text-xs text-muted-foreground capitalize">{tip.category}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getDifficultyBadge(tip.difficulty)} variant="outline">
                              {tip.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-green-600">
                              +{tip.success_rate_impact}%
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{tip.description}</p>
                        
                        {currentTip?.id === tip.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 border-t pt-3"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-600">Do this:</span>
                              </div>
                              <p className="text-sm bg-green-50 p-3 rounded border border-green-200">
                                {tip.do_example}
                              </p>
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-600">Avoid this:</span>
                              </div>
                              <p className="text-sm bg-red-50 p-3 rounded border border-red-200">
                                {tip.dont_example}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Templates */}
            <TabsContent value="templates" className="space-y-4">
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">{template.context}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className={`capitalize ${
                            template.tone === 'excited' ? 'text-orange-600' :
                            template.tone === 'professional' ? 'text-blue-600' :
                            template.tone === 'supportive' ? 'text-green-600' :
                            'text-purple-600'
                          }`}>
                            {template.tone}
                          </Badge>
                          <Badge variant="outline" className="text-green-600">
                            {template.success_rate}% success
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded text-sm mb-3 font-mono whitespace-pre-line">
                        {template.template.substring(0, 200)}...
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {template.customizable_fields.length} customizable fields
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onPreviewReferral(template.template)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleUseTemplate(template)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Message Composer */}
            <TabsContent value="composer" className="space-y-4">
              {selectedTemplate && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Using template: {selectedTemplate.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedTemplate.success_rate}% success rate
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedTemplate.context}</p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Name</Label>
                  <Input
                    id="recipient"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Friend's name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Your Referral Message</Label>
                  <Textarea
                    id="message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Write your authentic referral message..."
                    rows={8}
                  />
                  <div className="text-xs text-muted-foreground">
                    {customMessage.length} characters
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleAnalyzeMessage}
                    variant="outline"
                    disabled={!customMessage.trim() || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    )}
                    Analyze Quality
                  </Button>
                  <Button 
                    onClick={() => onPreviewReferral(customMessage)}
                    variant="outline"
                    disabled={!customMessage.trim()}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    onClick={() => onSendReferral(customMessage, recipientName)}
                    disabled={!customMessage.trim() || !recipientName.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Referral
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Quality Analysis */}
            <TabsContent value="analysis" className="space-y-4">
              {!qualityAnalysis && !isAnalyzing && (
                <Card className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Compose a message and analyze its quality to get personalized feedback
                  </p>
                  <Button onClick={() => setSelectedTab('composer')}>
                    Start Composing
                  </Button>
                </Card>
              )}

              {isAnalyzing && (
                <Card className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium mb-2">Analyzing Message Quality</h3>
                  <p className="text-muted-foreground">
                    Evaluating authenticity, relevance, personalization, and timing...
                  </p>
                </Card>
              )}

              {qualityAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Overall Score */}
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className={cn("text-6xl font-bold mb-2", getScoreColor(qualityAnalysis.overall_score))}>
                        {qualityAnalysis.overall_score}
                      </div>
                      <div className="text-lg font-medium mb-2">Overall Quality Score</div>
                      <Progress value={qualityAnalysis.overall_score} className="h-2" />
                    </CardContent>
                  </Card>

                  {/* Detailed Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="text-center">
                        <div className={cn("text-2xl font-bold", getScoreColor(qualityAnalysis.authenticity_score))}>
                          {qualityAnalysis.authenticity_score}
                        </div>
                        <div className="text-sm text-muted-foreground">Authenticity</div>
                        <Progress value={qualityAnalysis.authenticity_score} className="h-1 mt-2" />
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="text-center">
                        <div className={cn("text-2xl font-bold", getScoreColor(qualityAnalysis.relevance_score))}>
                          {qualityAnalysis.relevance_score}
                        </div>
                        <div className="text-sm text-muted-foreground">Relevance</div>
                        <Progress value={qualityAnalysis.relevance_score} className="h-1 mt-2" />
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="text-center">
                        <div className={cn("text-2xl font-bold", getScoreColor(qualityAnalysis.personalization_score))}>
                          {qualityAnalysis.personalization_score}
                        </div>
                        <div className="text-sm text-muted-foreground">Personalization</div>
                        <Progress value={qualityAnalysis.personalization_score} className="h-1 mt-2" />
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="text-center">
                        <div className={cn("text-2xl font-bold", getScoreColor(qualityAnalysis.timing_score))}>
                          {qualityAnalysis.timing_score}
                        </div>
                        <div className="text-sm text-muted-foreground">Timing</div>
                        <Progress value={qualityAnalysis.timing_score} className="h-1 mt-2" />
                      </div>
                    </Card>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ThumbsUp className="h-5 w-5 text-green-600" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {qualityAnalysis.strengths.map((strength, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5 text-orange-600" />
                          Improvements
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {qualityAnalysis.improvements.map((improvement, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{improvement}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => setSelectedTab('composer')}>
                      Revise Message
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedTab('tips')}>
                      View Tips
                    </Button>
                  </div>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}