import { Metadata } from 'next'
import { NotificationSettings } from '@/components/admin/settings/notification-settings'

export const metadata: Metadata = {
  title: 'Notification Settings',
  description: 'Manage your notification preferences and settings',
}

export default function NotificationSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-600 mt-2">
          Customize how and when you receive notifications
        </p>
      </div>
      
      <NotificationSettings />
    </div>
  )
}