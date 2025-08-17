'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  UserPlus, 
  Trophy, 
  CheckCircle, 
  AlertCircle,
  Search,
  Phone,
  Mail,
  Clock,
  DollarSign,
  Users,
  Loader2
} from 'lucide-react'
import type { StudentReferral } from '@/types/referral'
import { referralAdminService } from '@/lib/services/referral-admin-service'

interface ReferralConversionTrackerProps {
  /** Student data when converting a referral to enrollment */
  referralData?: {
    referred_student_name: string
    referred_student_phone?: string
    referrer_name: string
    referrer_id: string
    referral_id: string
  }
  /** Callback when referral is successfully converted */
  onConversionComplete?: (studentId: string) => void
  /** Callback when conversion is cancelled */  
  onCancel?: () => void
  /** Show as inline component vs modal */
  inline?: boolean
}

interface PendingReferralMatch {
  referral: StudentReferral
  confidence: 'high' | 'medium' | 'low'
  matchReasons: string[]
}

export function ReferralConversionTracker({
  referralData,
  onConversionComplete,
  onCancel,
  inline = false
}: ReferralConversionTrackerProps) {
  const [step, setStep] = useState<'search' | 'confirm' | 'complete'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingMatches, setPendingMatches] = useState<PendingReferralMatch[]>([])
  const [selectedReferral, setSelectedReferral] = useState<StudentReferral | null>(null)
  const [loading, setLoading] = useState(false)
  const [converting, setConverting] = useState(false)
  const [conversionNotes, setConversionNotes] = useState('')

  // Auto-populate search if referralData is provided
  useEffect(() => {
    if (referralData) {
      setSearchQuery(referralData.referred_student_name)
      handleSearch(referralData.referred_student_name)
    }
  }, [referralData])

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setPendingMatches([])
      return
    }

    setLoading(true)
    try {
      // Search for pending referrals that match the student name or phone
      const { data: referrals } = await referralAdminService.getReferrals({
        status: 'pending'
      }, 1, 50)

      const matches: PendingReferralMatch[] = []
      
      referrals.forEach(referral => {
        const matchReasons: string[] = []
        let confidence: 'high' | 'medium' | 'low' = 'low'

        // Check name match
        const nameMatch = referral.referred_student_name.toLowerCase().includes(query.toLowerCase()) ||
                          query.toLowerCase().includes(referral.referred_student_name.toLowerCase())
        
        if (nameMatch) {
          matchReasons.push('Name match')
          confidence = 'high'
        }

        // Check phone match if available
        if (referral.referred_student_phone && query.includes(referral.referred_student_phone)) {
          matchReasons.push('Phone match')
          confidence = 'high'
        }

        // Partial name matches
        const queryWords = query.toLowerCase().split(' ')
        const referralWords = referral.referred_student_name.toLowerCase().split(' ')
        const wordMatches = queryWords.filter(word => 
          referralWords.some(refWord => refWord.includes(word) || word.includes(refWord))
        )

        if (wordMatches.length > 0 && !nameMatch) {
          matchReasons.push(`Partial name match (${wordMatches.length} words)`)
          confidence = wordMatches.length >= 2 ? 'medium' : 'low'
        }

        if (matchReasons.length > 0) {
          matches.push({
            referral,
            confidence,
            matchReasons
          })
        }
      })

      // Sort by confidence
      matches.sort((a, b) => {
        const confidenceOrder = { high: 3, medium: 2, low: 1 }
        return confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
      })

      setPendingMatches(matches)
    } catch (error) {
      console.error('Error searching referrals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectReferral = (referral: StudentReferral) => {
    setSelectedReferral(referral)
    setStep('confirm')
  }

  const handleConfirmConversion = async () => {
    if (!selectedReferral) return

    setConverting(true)
    try {
      // This would typically create the student record first
      // For now, we'll simulate with a generated student ID
      const newStudentId = `student_${Date.now()}`

      // Update the referral status to enrolled
      await referralAdminService.updateReferralStatus(
        selectedReferral.id,
        'enrolled',
        {
          enrolled_student_id: newStudentId,
          contact_notes: conversionNotes || 'Successfully enrolled via admin conversion tracker',
          updated_by: 'admin' // This should come from auth context
        }
      )

      setStep('complete')
      
      if (onConversionComplete) {
        onConversionComplete(newStudentId)
      }
    } catch (error) {
      console.error('Error converting referral:', error)
    } finally {
      setConverting(false)
    }
  }

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      high: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-red-100 text-red-800 border-red-200'
    }
    
    return (
      <Badge className={variants[confidence as keyof typeof variants] || variants.low}>
        {confidence} confidence
      </Badge>
    )
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    return `${diffInDays} days ago`
  }

  const containerClass = inline 
    ? "space-y-4" 
    : "max-w-2xl mx-auto space-y-4"

  if (step === 'complete') {
    return (
      <motion.div 
        className={containerClass}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Referral Successfully Converted!
            </h3>
            <p className="text-sm text-green-700 mb-4">
              {selectedReferral?.referred_student_name} has been enrolled and the referrer will receive points.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
              <Trophy className="h-4 w-4" />
              <span>100 points awarded to referrer</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (step === 'confirm' && selectedReferral) {
    return (
      <motion.div 
        className={containerClass}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Confirm Referral Conversion</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Referral Details */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Referral Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Referred Student</Label>
                  <p className="font-medium">{selectedReferral.referred_student_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p>{selectedReferral.referred_student_phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Referrer Type</Label>
                  <p className="capitalize">{selectedReferral.referrer_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p>{formatTimeAgo(selectedReferral.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Conversion Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Conversion Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the enrollment process..."
                value={conversionNotes}
                onChange={(e) => setConversionNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Points Award Info */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-800">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium">
                  100 points will be awarded to the referrer upon confirmation
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep('search')}
                disabled={converting}
              >
                Back to Search
              </Button>
              <div className="flex items-center space-x-2">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel} disabled={converting}>
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={handleConfirmConversion}
                  disabled={converting}
                >
                  {converting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Enrollment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className={containerClass}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Referral Conversion Tracker</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Box */}
          <div className="space-y-2">
            <Label htmlFor="search">Search for Pending Referral</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Enter student name or phone number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  handleSearch(e.target.value)
                }}
                className="pl-9"
              />
            </div>
          </div>

          {/* Search Results */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && searchQuery && pendingMatches.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No pending referrals found matching "{searchQuery}"
              </p>
            </div>
          )}

          {!loading && pendingMatches.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">
                Found {pendingMatches.length} potential match{pendingMatches.length !== 1 ? 'es' : ''}:
              </h4>
              
              {pendingMatches.map(({ referral, confidence, matchReasons }) => (
                <motion.div
                  key={referral.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSelectReferral(referral)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium">{referral.referred_student_name}</h5>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        {referral.referred_student_phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{referral.referred_student_phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(referral.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {getConfidenceBadge(confidence)}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs">
                    <Badge variant="secondary">{referral.referrer_type}</Badge>
                    <span className="text-muted-foreground">
                      Match: {matchReasons.join(', ')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Instructions */}
          {!searchQuery && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How to use:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Search for the student name or phone number</li>
                    <li>Select the matching pending referral</li>
                    <li>Confirm the enrollment to award referral points</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {onCancel && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}