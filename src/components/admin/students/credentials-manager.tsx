'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  Key,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react'
import { fadeVariants, getAnimationConfig } from '@/lib/animations'

interface StudentWithoutCredentials {
  id: string
  first_name: string
  last_name: string
  full_name: string
}

interface BulkCredentialsResult {
  username: string
  password: string
  student_name: string
}

export function CredentialsManager() {
  const [studentsWithoutCredentials, setStudentsWithoutCredentials] = useState<StudentWithoutCredentials[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<BulkCredentialsResult[]>([])
  const [progress, setProgress] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadStudentsWithoutCredentials()
  }, [])

  const loadStudentsWithoutCredentials = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/students/credentials?without_credentials=true')
      const result = await response.json()

      if (result.success) {
        setStudentsWithoutCredentials(result.data)
        setSelectedStudents(new Set())
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast({
        title: 'Error',
        description: 'Failed to load students without credentials',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStudentSelect = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents)
    if (checked) {
      newSelected.add(studentId)
    } else {
      newSelected.delete(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(studentsWithoutCredentials.map(s => s.id)))
    } else {
      setSelectedStudents(new Set())
    }
  }

  const createBulkCredentials = async () => {
    if (selectedStudents.size === 0) return

    setCreating(true)
    setProgress(0)
    const studentIds = Array.from(selectedStudents)
    
    try {
      const response = await fetch('/api/students/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentIds })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Transform results for display
        const credentials = result.data.map((cred: any) => {
          const student = studentsWithoutCredentials.find(s => s.id === cred.student_id)
          return {
            username: cred.username,
            password: cred.password_visible,
            student_name: student?.full_name || 'Unknown'
          }
        })
        
        setCreatedCredentials(credentials)
        setShowResults(true)
        setProgress(100)
        
        toast({
          title: 'Success',
          description: `Created credentials for ${credentials.length} students`
        })
        
        // Refresh the list
        loadStudentsWithoutCredentials()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error creating credentials:', error)
      toast({
        title: 'Error',
        description: 'Failed to create credentials',
        variant: 'destructive'
      })
    } finally {
      setCreating(false)
    }
  }

  const exportCredentials = () => {
    const csvContent = [
      ['Student Name', 'Username', 'Password'].join(','),
      ...createdCredentials.map(cred => 
        [cred.student_name, cred.username, cred.password].join(',')
      )
    ].join('\\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `student-credentials-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-[#1d7452]" />
            Credentials Manager
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

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      transition={getAnimationConfig(fadeVariants)}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[#1d7452]" />
              Bulk Credentials Manager
            </div>
            <Button
              variant="outline"
              onClick={loadStudentsWithoutCredentials}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Manage login credentials for multiple students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {studentsWithoutCredentials.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">All Set!</h3>
              <p className="text-muted-foreground">
                All active students have login credentials created.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">
                    {studentsWithoutCredentials.length} students need credentials
                  </span>
                </div>
                {selectedStudents.size > 0 && (
                  <Badge variant="secondary">
                    {selectedStudents.size} selected
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2 py-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedStudents.size === studentsWithoutCredentials.length &&
                    studentsWithoutCredentials.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All
                </label>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {studentsWithoutCredentials.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50"
                  >
                    <Checkbox
                      id={student.id}
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={(checked) => 
                        handleStudentSelect(student.id, checked as boolean)
                      }
                    />
                    <label htmlFor={student.id} className="flex-1 text-sm">
                      {student.full_name}
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Dialog open={showResults} onOpenChange={setShowResults}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={createBulkCredentials}
                      disabled={selectedStudents.size === 0 || creating}
                      className="bg-[#1d7452] hover:bg-[#1d7452]/90"
                    >
                      {creating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Create Credentials ({selectedStudents.size})
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Credentials Created Successfully</DialogTitle>
                      <DialogDescription>
                        {createdCredentials.length} student credentials have been created.
                        Make sure to save this information securely.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="max-h-60 overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-2">Student</th>
                              <th className="text-left p-2">Username</th>
                              <th className="text-left p-2">Password</th>
                            </tr>
                          </thead>
                          <tbody>
                            {createdCredentials.map((cred, index) => (
                              <tr key={index} className="border-t">
                                <td className="p-2">{cred.student_name}</td>
                                <td className="p-2 font-mono text-xs">{cred.username}</td>
                                <td className="p-2 font-mono text-xs">{cred.password}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={exportCredentials}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as CSV
                      </Button>
                      <Button onClick={() => setShowResults(false)}>
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {creating && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    Creating credentials...
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}