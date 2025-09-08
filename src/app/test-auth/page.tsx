'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, UserPlus, GraduationCap, Users, RefreshCw } from 'lucide-react'

interface Credentials {
  username: string
  password: string
  email: string
  metadata?: any
}

export default function TestAuthPage() {
  const [studentCredentials, setStudentCredentials] = useState<Credentials | null>(null)
  const [teacherCredentials, setTeacherCredentials] = useState<Credentials | null>(null)
  const [loading, setLoading] = useState(false)
  const [studentName, setStudentName] = useState('Ali Karimov')
  const [teacherName, setTeacherName] = useState('Marina Abdullayeva')

  const generateCredentials = async (type: 'student' | 'teacher', name: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/demo-credentials')
      const data = await response.json()
      
      if (data.success) {
        const [firstName, lastName] = name.split(' ')
        
        if (type === 'student') {
          const creds = generateStudentCredentials(firstName || 'Student', lastName || 'User', '2008-03-15')
          setStudentCredentials(creds)
        } else {
          const creds = generateTeacherCredentials(firstName || 'Teacher', lastName || 'User')
          setTeacherCredentials(creds)
        }
      }
    } catch (error) {
      console.error('Error generating credentials:', error)
    }
    setLoading(false)
  }

  const generateStudentCredentials = (firstName: string, lastName: string, dateOfBirth: string) => {
    const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3).padEnd(3, 'x')
    const digits = Math.floor(100 + Math.random() * 900).toString()
    const username = cleanFirstName + digits
    
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const password = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const email = `${username}@harryschool.internal`

    return { username, password, email, metadata: { firstName, lastName, dateOfBirth } }
  }

  const generateTeacherCredentials = (firstName: string, lastName: string) => {
    const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3).padEnd(3, 'x')
    const digits = Math.floor(100 + Math.random() * 900).toString()
    const username = cleanFirstName + digits
    
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const password = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const email = `${username}@harryschool.internal`

    return { username, password, email, metadata: { firstName, lastName } }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🔐 Harry School Authentication Demo</h1>
        <p className="text-muted-foreground">
          Test how usernames and passwords are automatically generated for students and teachers
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="student">Student Test</TabsTrigger>
          <TabsTrigger value="teacher">Teacher Test</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                How Auto-Generated Credentials Work
              </CardTitle>
              <CardDescription>
                When students or teachers are created in the admin panel, the system automatically generates simple login credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Username Format</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <code className="text-sm">First 3 letters + 3 digits</code>
                    <div className="text-xs text-muted-foreground mt-1">
                      Example: "ali123", "mar456"
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Password Format</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <code className="text-sm">6 alphanumeric characters</code>
                    <div className="text-xs text-muted-foreground mt-1">
                      Example: "a7x9m2", "k3p8s1"
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Admin Panel Integration</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Credentials are displayed when creating new students/teachers</li>
                  <li>• Admin can retrieve credentials later for support</li>
                  <li>• Students use these credentials in the mobile app</li>
                  <li>• RLS policies ensure secure data access</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Student Credential Generation
              </CardTitle>
              <CardDescription>
                Test how student login credentials are generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="studentName">Student Name</Label>
                  <Input
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter student name"
                  />
                </div>
                <Button 
                  onClick={() => generateCredentials('student', studentName)}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Generate
                </Button>
              </div>

              {studentCredentials && (
                <div className="p-4 bg-green-50 rounded-md border border-green-200">
                  <h4 className="font-medium text-green-900 mb-3">Generated Student Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-green-700">Username</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {studentCredentials.username}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyToClipboard(studentCredentials.username)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-green-700">Password</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {studentCredentials.password}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyToClipboard(studentCredentials.password)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-green-700">Email (Internal)</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {studentCredentials.email}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyToClipboard(studentCredentials.email)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-green-700">
                    ℹ️ These credentials would be displayed to the admin and used by the student in the mobile app
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teacher" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teacher Credential Generation
              </CardTitle>
              <CardDescription>
                Test how teacher login credentials are generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="teacherName">Teacher Name</Label>
                  <Input
                    id="teacherName"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Enter teacher name"
                  />
                </div>
                <Button 
                  onClick={() => generateCredentials('teacher', teacherName)}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Generate
                </Button>
              </div>

              {teacherCredentials && (
                <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3">Generated Teacher Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-blue-700">Username</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {teacherCredentials.username}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyToClipboard(teacherCredentials.username)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-700">Password</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {teacherCredentials.password}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyToClipboard(teacherCredentials.password)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-700">Email (Internal)</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {teacherCredentials.email}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyToClipboard(teacherCredentials.email)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-blue-700">
                    ℹ️ These credentials would be displayed to the admin and used by the teacher for system access
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🚀 Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                ✅ Database Ready
              </Badge>
              <p className="text-sm text-muted-foreground">
                All migrations applied, RLS policies active
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                ✅ Services Updated
              </Badge>
              <p className="text-sm text-muted-foreground">
                StudentService and TeacherService auto-generate credentials
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Next Step:</strong> Create actual students/teachers through the admin panel to test the full authentication flow with database integration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}