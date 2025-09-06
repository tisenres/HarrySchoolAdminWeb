'use client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Not Found</h2>
        <p className="text-muted-foreground mb-4">Could not find the requested resource</p>
        <a href="/" className="text-primary hover:underline">
          Return Home
        </a>
      </div>
    </div>
  )
}