'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { CredentialsManager } from '@/components/admin/students/credentials-manager'
import { fadeVariants, getAnimationConfig } from '@/lib/animations'

export default function StudentsCredentialsPage() {
  const router = useRouter()

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      transition={getAnimationConfig(fadeVariants)}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Student Credentials Management</h1>
            <p className="text-muted-foreground">
              Create and manage login credentials for students
            </p>
          </div>
        </div>
      </div>

      {/* Credentials Manager */}
      <CredentialsManager />
    </motion.div>
  )
}