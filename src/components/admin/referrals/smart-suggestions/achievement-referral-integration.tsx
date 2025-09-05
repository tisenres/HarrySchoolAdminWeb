'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Trophy,
  UserPlus,
  Sparkles,
  Heart,
  Star,
  Share2,
  MessageCircle,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react'
import { ReferralOpportunityWidget } from './referral-opportunity-widget'

interface AchievementCelebrationEvent {
  achievement_id: string
  achievement_title: string
  user_id: string
  user_name: string
  user_type: 'student' | 'teacher'
  points_awarded: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  category: string
  unlock_timestamp: Date
  celebration_status: 'queued' | 'playing' | 'completed' | 'skipped'
}

interface AchievementReferralIntegrationProps {
  celebrationEvent: AchievementCelebrationEvent
  isActive: boolean
  onCelebrationComplete: () => void
  onCreateReferral: () => void
  onScheduleReminder: (time: Date) => void
  settings: {
    enable_referral_suggestions: boolean
    suggestion_timing: 'during' | 'after' | 'both'
    auto_suggest_threshold: number // engagement score threshold
  }
}

export function AchievementReferralIntegration({
  celebrationEvent,
  isActive,
  onCelebrationComplete,
  onCreateReferral,
  onScheduleReminder,
  settings
}: AchievementReferralIntegrationProps) {
  const [celebrationPhase, setCelebrationPhase] = useState<'celebration' | 'sharing' | 'complete'>('celebration')
  const [showReferralWidget, setShowReferralWidget] = useState(false)
  const [userEngagementScore] = useState(85) // This would come from actual engagement tracking
  const [celebrationTimer, setCelebrationTimer] = useState(5)

  // Achievement celebration with referral integration
  useEffect(() => {
    if (!isActive) return

    let timer: NodeJS.Timeout
    
    if (celebrationPhase === 'celebration') {
      // Initial celebration phase (5 seconds)
      timer = setTimeout(() => {
        setCelebrationPhase('sharing')
        
        // Show referral widget if settings allow and engagement is high enough
        if (settings.enable_referral_suggestions && 
            (settings.suggestion_timing === 'after' || settings.suggestion_timing === 'both') &&
            userEngagementScore >= settings.auto_suggest_threshold) {
          setShowReferralWidget(true)
        }
      }, 5000)
    } else if (celebrationPhase === 'sharing') {
      // Extended sharing phase (10 seconds) with referral opportunity
      timer = setTimeout(() => {
        setCelebrationPhase('complete')
        setShowReferralWidget(false)
        onCelebrationComplete()
      }, 10000)
    }

    return () => clearTimeout(timer)
  }, [celebrationPhase, isActive, settings, userEngagementScore, onCelebrationComplete])

  // Countdown timer for celebration
  useEffect(() => {
    if (celebrationPhase === 'celebration' && celebrationTimer > 0) {
      const timer = setTimeout(() => {
        setCelebrationTimer(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [celebrationPhase, celebrationTimer])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50 text-gray-700'
      case 'uncommon': return 'border-green-300 bg-green-50 text-green-700'
      case 'rare': return 'border-blue-300 bg-blue-50 text-blue-700'
      case 'epic': return 'border-purple-300 bg-purple-50 text-purple-700'
      case 'legendary': return 'border-yellow-300 bg-yellow-50 text-yellow-700'
      default: return 'border-gray-300 bg-gray-50 text-gray-700'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Star className="h-6 w-6" />
      case 'uncommon': return <Star className="h-6 w-6" />
      case 'rare': return <Trophy className="h-6 w-6" />
      case 'epic': return <Trophy className="h-6 w-6" />
      case 'legendary': return <Trophy className="h-6 w-6" />
      default: return <Star className="h-6 w-6" />
    }
  }

  const handleShareSuccess = () => {
    setShowReferralWidget(true)
  }

  const handleReferralAction = (action: string) => {
    switch (action) {
      case 'create':
        onCreateReferral()
        setShowReferralWidget(false)
        setCelebrationPhase('complete')
        onCelebrationComplete()
        break
      case 'later':
        const reminderTime = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
        onScheduleReminder(reminderTime)
        setShowReferralWidget(false)
        setCelebrationPhase('complete')
        onCelebrationComplete()
        break
      case 'dismiss':
        setShowReferralWidget(false)
        setCelebrationPhase('complete')
        onCelebrationComplete()
        break
    }
  }

  if (!isActive) return null

  return (
    <AnimatePresence>
      {/* Main Celebration Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="max-w-md w-full mx-4"
        >
          {celebrationPhase === 'celebration' && (
            <Card className="relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <motion.div
                  animate={{ 
                    background: [
                      "radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)",
                      "radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)",
                      "radial-gradient(circle at 40% 60%, rgba(120, 255, 198, 0.3) 0%, transparent 50%)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0"
                />
              </div>

              <CardContent className="p-8 text-center relative z-10">
                {/* Achievement Icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotateY: [0, 180, 360]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mb-6"
                >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${getRarityColor(celebrationEvent.rarity)}`}>
                    {getRarityIcon(celebrationEvent.rarity)}
                  </div>
                </motion.div>

                {/* Achievement Details */}
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-2"
                >
                  {celebrationEvent.achievement_title}
                </motion.h2>
                
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg text-muted-foreground mb-4"
                >
                  Congratulations, {celebrationEvent.user_name}!
                </motion.p>

                {/* Points and Rarity */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center justify-center gap-4 mb-6"
                >
                  <div className="flex items-center gap-1">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="font-bold">{celebrationEvent.points_awarded} points</span>
                  </div>
                  <Badge className={getRarityColor(celebrationEvent.rarity)}>
                    {celebrationEvent.rarity}
                  </Badge>
                </motion.div>

                {/* Countdown */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 }}
                  className="text-4xl font-bold text-purple-600 mb-4"
                >
                  {celebrationTimer}
                </motion.div>

                {/* Early referral trigger during celebration */}
                {settings.enable_referral_suggestions && 
                 settings.suggestion_timing === 'during' &&
                 celebrationTimer <= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <Button
                      onClick={handleShareSuccess}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share This Success!
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          )}

          {celebrationPhase === 'sharing' && !showReferralWidget && (
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4"
                >
                  <Sparkles className="h-8 w-8 text-white" />
                </motion.div>

                <h3 className="text-xl font-bold mb-2">Amazing Achievement!</h3>
                <p className="text-muted-foreground mb-6">
                  Your success is worth celebrating and sharing with others who might be inspired!
                </p>

                <div className="flex gap-3 justify-center">
                  <Button onClick={handleShareSuccess} className="flex-1">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Share & Refer
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleReferralAction('later')}
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Maybe Later
                  </Button>
                </div>

                <div className="mt-4 flex items-center justify-center gap-1 text-xs text-purple-600">
                  <Heart className="h-3 w-3" />
                  <span>Your success helps others discover opportunities</span>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Skip button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReferralAction('dismiss')}
          className="absolute top-4 right-4 text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Referral Opportunity Widget (appears alongside celebration) */}
      {showReferralWidget && (
        <ReferralOpportunityWidget
          achievementContext={{
            achievement_id: celebrationEvent.achievement_id,
            achievement_title: celebrationEvent.achievement_title,
            user_id: celebrationEvent.user_id,
            user_name: celebrationEvent.user_name,
            user_type: celebrationEvent.user_type,
            points_awarded: celebrationEvent.points_awarded,
            rarity: celebrationEvent.rarity,
            achievement_category: celebrationEvent.category
          }}
          isVisible={true}
          onDismiss={() => handleReferralAction('dismiss')}
          onCreateReferral={() => handleReferralAction('create')}
          onRemindLater={() => handleReferralAction('later')}
          onViewTips={() => {
            // This would open the coaching bot
            console.log('Opening coaching bot')
          }}
        />
      )}
    </AnimatePresence>
  )
}