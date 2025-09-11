'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  RotateCcw,
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react'
import { fadeVariants, getAnimationConfig } from '@/lib/animations'

interface StudentCredentials {
  id: string
  username: string
  password: string
  isActive: boolean
  createdAt: string
}

interface StudentCredentialsProps {
  studentId: string
  studentName: string
  onCredentialsChange?: () => void
}

export function StudentCredentials({ 
  studentId, 
  studentName, 
  onCredentialsChange 
}: StudentCredentialsProps) {
  const [credentials, setCredentials] = useState<StudentCredentials | null>(null)
  const [hasCredentials, setHasCredentials] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadCredentials()
  }, [studentId])

  const loadCredentials = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/students/${studentId}/credentials`)
      const result = await response.json()

      if (result.success) {
        setCredentials(result.data)
        setHasCredentials(true)
      } else {
        setCredentials(null)
        setHasCredentials(result.hasCredentials === true)
      }
    } catch (error) {
      console.error('Error loading credentials:', error)
      toast({
        title: 'Error',
        description: 'Failed to load student credentials',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const createCredentials = async () => {
    setIsCreating(true)
    try {
      const response = await fetch(`/api/students/${studentId}/credentials`, {
        method: 'POST'
      })
      const result = await response.json()

      if (result.success) {
        setCredentials(result.data)
        setHasCredentials(true)
        onCredentialsChange?.()
        toast({
          title: 'Success',
          description: 'Student credentials created successfully'
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error creating credentials:', error)
      toast({
        title: 'Error',
        description: 'Failed to create student credentials',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const updatePassword = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/students/${studentId}/credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      const result = await response.json()

      if (result.success) {
        setCredentials(prev => prev ? { ...prev, password: result.data.password } : null)
        toast({
          title: 'Success',
          description: 'Password updated successfully'
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating password:', error)
      toast({
        title: 'Error',
        description: 'Failed to update password',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: 'Copied!',
        description: `${type} copied to clipboard`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-[#1d7452]" />
            Student Credentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d7452]"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasCredentials) {
    return (
      <motion.div
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        transition={getAnimationConfig(fadeVariants)}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[#1d7452]" />
              Student Credentials
            </CardTitle>
            <CardDescription>
              Create login credentials for {studentName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Credentials Created</h3>
              <p className="text-muted-foreground mb-6">
                This student doesn't have login credentials yet. Create them to allow student access.
              </p>
              <Button 
                onClick={createCredentials} 
                disabled={isCreating}
                size="lg"
                className="bg-[#1d7452] hover:bg-[#1d7452]/90"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Credentials
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      transition={getAnimationConfig(fadeVariants)}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[#1d7452]" />
              Student Credentials
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </CardTitle>
          <CardDescription>
            Login credentials for {studentName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {credentials && (
            <>
              {/* Username */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={credentials.username}
                    readOnly
                    className="font-mono bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.username, 'Username')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Password
                </Label>
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    readOnly
                    className="font-mono bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.password, 'Password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Created: {formatDate(credentials.createdAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isUpdating}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Password
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Password</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will generate a new password for {studentName}. The old password will no longer work.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={updatePassword}>
                        Reset Password
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}