'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Award, Users, BarChart3, Settings as SettingsIcon } from 'lucide-react'
import { AchievementGallery } from '@/components/admin/achievements/achievement-gallery'
import { AchievementForm } from '@/components/admin/achievements/achievement-form'
import { AchievementAnalytics } from '@/components/admin/achievements/achievement-analytics'
import { ManualAwardInterface } from '@/components/admin/achievements/manual-award-interface'
import { AchievementManagement } from '@/components/admin/achievements/achievement-management'
import { fadeVariants, staggerContainer } from '@/lib/animations'

export default function AchievementsPage() {
  const t = useTranslations('achievements')
  const [activeTab, setActiveTab] = useState('gallery')
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={fadeVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Achievement Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and award achievements to recognize student success
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Achievement</span>
        </Button>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div variants={fadeVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gallery" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Gallery</span>
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center space-x-2">
              <SettingsIcon className="h-4 w-4" />
              <span>Management</span>
            </TabsTrigger>
            <TabsTrigger value="award" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Award</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="space-y-6">
            <AchievementGallery />
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <AchievementManagement />
          </TabsContent>

          <TabsContent value="award" className="space-y-6">
            <ManualAwardInterface />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AchievementAnalytics />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Create Achievement Form Modal */}
      <AchievementForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        mode="create"
      />
    </motion.div>
  )
}