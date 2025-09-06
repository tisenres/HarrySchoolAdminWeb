'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Trophy, CheckCircle } from 'lucide-react'

/**
 * Demo component to showcase referral integration functionality
 * This demonstrates how referral features seamlessly integrate with existing ranking system
 */
export function ReferralIntegrationDemo() {
  const [demoStep, setDemoStep] = useState(0)

  const demoSteps = [
    {
      title: "Referral Summary Card",
      description: "Integrated into existing ranking overview alongside achievements and feedback",
      features: ["Real-time conversion rates", "Progress tracking", "Next milestone preview"]
    },
    {
      title: "Quick Referral Submission",
      description: "Seamless form integrated with existing student action patterns",
      features: ["Form validation", "Success animations", "Auto point calculation"]
    },
    {
      title: "Referral Achievements",
      description: "Extends existing achievement system with referral-specific badges",
      features: ["Progress indicators", "Tiered rewards", "Visual consistency"]
    },
    {
      title: "Points Integration",
      description: "Referral points flow through existing ranking and transaction systems",
      features: ["Automatic point awards", "Transaction history", "Ranking updates"]
    }
  ]

  const integrationHighlights = [
    "🎯 Extends existing ranking tab without separate interfaces",
    "🔄 Uses existing card layouts and component patterns", 
    "📊 Integrates with current progress tracking systems",
    "🏆 Extends achievement system seamlessly",
    "💰 Flows through existing points and transaction infrastructure",
    "🎨 Maintains visual consistency with existing design system"
  ]

  return (
    <div className="space-y-6">
      {/* Integration Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <span>Referral System Integration</span>
            <Badge className="bg-green-100 text-green-800 border-green-300">
              ✅ Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Referral functionality has been seamlessly integrated into the existing student ranking tab,
            extending the current infrastructure without creating separate systems.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span>Integration Highlights</span>
              </h4>
              <ul className="space-y-1 text-sm">
                {integrationHighlights.map((highlight, i) => (
                  <li key={i} className="text-muted-foreground">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Components Added</span>
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• ReferralSummaryCard - Overview integration</li>
                <li>• ReferralSubmissionForm - Quick actions</li>
                <li>• ReferralAchievements - Achievement extension</li>
                <li>• ReferralPointsBreakdown - Transaction integration</li>
                <li>• Extended StudentRankingOverview</li>
                <li>• New "Referrals" tab in ranking interface</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-4">
              {demoSteps.map((_, index) => (
                <Button
                  key={index}
                  variant={demoStep === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDemoStep(index)}
                >
                  Step {index + 1}
                </Button>
              ))}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">{demoSteps[demoStep].title}</h3>
              <p className="text-muted-foreground mb-3">{demoSteps[demoStep].description}</p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Features:</h4>
                <ul className="space-y-1">
                  {demoSteps[demoStep].features.map((feature, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">✅ Completed</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Referral types and interfaces</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>ReferralSummaryCard component</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>ReferralSubmissionForm with validation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>ReferralAchievements gallery</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>ReferralPointsBreakdown component</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Extended StudentRankingOverview</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Integrated StudentRankingTab</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Mock data generation for testing</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-blue-700">🔄 Integration Points</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>4-column layout in ranking overview</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>5-column progress summary</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>6-tab navigation with Referrals tab</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Quick action buttons integration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Achievement system extension</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Points transaction flow</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}