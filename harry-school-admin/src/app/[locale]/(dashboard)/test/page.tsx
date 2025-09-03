// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function TestPage() {
  return (
    <div>
      <h1>Test Page</h1>
      <p>This is a simple test page to verify deployment works.</p>
    </div>
  )
}