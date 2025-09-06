import { SimpleRankings } from '@/components/admin/rankings/simple-rankings'

export default function TestRankingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rankings Test Page</h1>
          <p className="text-muted-foreground mt-2">
            Testing all ranking features and buttons
          </p>
        </div>
      </div>

      <SimpleRankings />
    </div>
  )
}