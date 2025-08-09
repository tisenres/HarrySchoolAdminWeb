import { Card } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage system settings, users, and archives
        </p>
      </div>

      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Settings module will be implemented in Phase 4
        </p>
      </Card>
    </div>
  )
}