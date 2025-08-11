'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wrench, Clock, RefreshCw } from 'lucide-react'
import { SystemSettingsClientService } from '@/lib/services/system-settings-service.client'
import { useTranslations } from 'next-intl'

export default function MaintenancePage() {
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'System is under maintenance. We\'ll be back shortly...'
  )
  const [isChecking, setIsChecking] = useState(false)
  const router = useRouter()
  const t = useTranslations('maintenance')

  useEffect(() => {
    async function fetchMaintenanceMessage() {
      try {
        const settings = await SystemSettingsClientService.getSettingsClient()
        setMaintenanceMessage(settings.maintenance_message)
      } catch (error) {
        console.error('Error fetching maintenance message:', error)
      }
    }

    fetchMaintenanceMessage()
  }, [])

  const checkSystemStatus = async () => {
    setIsChecking(true)
    try {
      // Wait a moment to avoid hammering the server
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const settings = await SystemSettingsClientService.getSettingsClient()
      if (!settings.maintenance_mode) {
        // Maintenance mode is off, redirect to dashboard
        router.push('/')
      }
    } catch (error) {
      console.error('Error checking system status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-xl font-semibold">
            System Under Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {maintenanceMessage}
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Please check back in a few minutes</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={checkSystemStatus}
              disabled={isChecking}
              className="w-full"
              variant="outline"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking Status...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check System Status
                </>
              )}
            </Button>

            <div className="text-xs text-center text-muted-foreground space-y-1">
              <p>If you&apos;re an administrator and need immediate access,</p>
              <p>please contact your system administrator.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}