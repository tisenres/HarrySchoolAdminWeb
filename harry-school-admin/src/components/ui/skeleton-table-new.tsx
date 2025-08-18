import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 flex-1" />
      </div>
      
      {/* Table skeleton */}
      <Card className="p-4">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-[50px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-[80px]" />
            </div>
          ))}
        </div>
      </Card>
      
      {/* Pagination skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-[100px]" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  )
}