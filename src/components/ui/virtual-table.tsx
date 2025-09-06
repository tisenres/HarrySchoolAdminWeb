'use client'

import React, { 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect, 
  useState,
  memo,
  ReactNode 
} from 'react'
import { FixedSizeList as List, ListChildComponentProps, areEqual } from 'react-window'
import { cn } from '@/lib/utils'

export interface VirtualTableColumn<T = any> {
  key: string
  header: ReactNode
  width: number | string
  minWidth?: number
  maxWidth?: number
  render: (item: T, index: number) => ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

export interface VirtualTableProps<T = any> {
  data: T[]
  columns: VirtualTableColumn<T>[]
  height: number
  itemHeight?: number
  className?: string
  overscan?: number
  onScroll?: (scrollOffset: number) => void
  onRowClick?: (item: T, index: number) => void
  selectedItems?: Set<string>
  getItemId?: (item: T) => string
  loading?: boolean
  loadingPlaceholder?: ReactNode
  emptyPlaceholder?: ReactNode
  stickyHeader?: boolean
  zebra?: boolean
}

interface VirtualRowProps<T> extends ListChildComponentProps {
  data: {
    items: T[]
    columns: VirtualTableColumn<T>[]
    onRowClick?: (item: T, index: number) => void
    selectedItems?: Set<string>
    getItemId?: (item: T) => string
    zebra?: boolean
    rowClassName?: string
  }
}

// Memoized row component for performance
const VirtualRow = memo(<T extends any>({ 
  index, 
  style, 
  data 
}: VirtualRowProps<T>) => {
  const { 
    items, 
    columns, 
    onRowClick, 
    selectedItems, 
    getItemId, 
    zebra,
    rowClassName 
  } = data
  
  const item = items[index]
  const itemId = item && getItemId ? getItemId(item) : undefined
  const isSelected = itemId && selectedItems?.has(itemId)
  const isEven = index % 2 === 0

  const handleClick = useCallback(() => {
    if (item) {
      onRowClick?.(item, index)
    }
  }, [item, index, onRowClick])

  return (
    <div
      style={style}
      className={cn(
        'flex items-center border-b border-border/40 transition-colors duration-150',
        {
          'bg-muted/30': isSelected,
          'hover:bg-muted/50': onRowClick && !isSelected,
          'bg-muted/10': zebra && isEven && !isSelected,
          'cursor-pointer': onRowClick,
        },
        rowClassName
      )}
      onClick={onRowClick ? handleClick : undefined}
      role={onRowClick ? 'button' : undefined}
      tabIndex={onRowClick ? 0 : undefined}
    >
      {columns.map((column) => (
        <div
          key={column.key}
          className={cn(
            'flex-shrink-0 px-3 py-2 text-sm overflow-hidden',
            column.className
          )}
          style={{ 
            width: typeof column.width === 'number' ? `${column.width}px` : column.width,
            minWidth: column.minWidth,
            maxWidth: column.maxWidth,
          }}
        >
          {item ? column.render(item, index) : null}
        </div>
      ))}
    </div>
  )
}, areEqual) as <T>(props: VirtualRowProps<T>) => React.JSX.Element

// Loading skeleton row
const SkeletonRow = memo<{ columns: VirtualTableColumn[] }>(() => (
  <div className="flex items-center border-b border-border/40 animate-pulse">
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="flex-1 px-3 py-2">
        <div className="h-4 bg-muted/60 rounded" />
      </div>
    ))}
  </div>
))

SkeletonRow.displayName = 'SkeletonRow'

// Main virtual table component
export const VirtualTable = memo(<T extends any>({
  data,
  columns,
  height,
  itemHeight = 52,
  className,
  overscan = 5,
  onScroll,
  onRowClick,
  selectedItems,
  getItemId,
  loading = false,
  loadingPlaceholder,
  emptyPlaceholder,
  stickyHeader = true,
  zebra = false,
}: VirtualTableProps<T>) => {
  const listRef = useRef<List>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  // Memoized row data to prevent unnecessary re-renders
  const rowData = useMemo(() => ({
    items: data,
    columns,
    onRowClick,
    selectedItems,
    getItemId,
    zebra,
  }), [data, columns, onRowClick, selectedItems, getItemId, zebra])

  // Calculate total width of all columns
  const totalWidth = useMemo(() => {
    return columns.reduce((sum, col) => {
      const width = typeof col.width === 'number' ? col.width : 200
      return sum + width
    }, 0)
  }, [columns])

  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    setIsScrolled(scrollOffset > 0)
    onScroll?.(scrollOffset)
  }, [onScroll])

  // Scroll to top when data changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0)
      setIsScrolled(false)
    }
  }, [data])

  if (loading) {
    return (
      <div className={cn('border rounded-lg bg-background', className)}>
        {/* Loading Header */}
        <div className="flex border-b bg-muted/30">
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                'flex-shrink-0 px-3 py-3 text-sm font-medium text-muted-foreground',
                column.headerClassName
              )}
              style={{ 
                width: typeof column.width === 'number' ? `${column.width}px` : column.width,
                minWidth: column.minWidth,
                maxWidth: column.maxWidth,
              }}
            >
              {column.header}
            </div>
          ))}
        </div>
        
        {/* Loading Content */}
        {loadingPlaceholder || (
          <div className="p-8 text-center">
            <div className="space-y-3">
              {Array.from({ length: 8 }, (_, i) => (
                <SkeletonRow key={i} columns={columns} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn('border rounded-lg bg-background', className)}>
        {/* Header for empty state */}
        <div className="flex border-b bg-muted/30">
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                'flex-shrink-0 px-3 py-3 text-sm font-medium text-muted-foreground',
                column.headerClassName
              )}
              style={{ 
                width: typeof column.width === 'number' ? `${column.width}px` : column.width,
                minWidth: column.minWidth,
                maxWidth: column.maxWidth,
              }}
            >
              {column.header}
            </div>
          ))}
        </div>
        
        {/* Empty state content */}
        <div style={{ height: height - 48 }} className="flex items-center justify-center">
          {emptyPlaceholder || (
            <div className="text-center text-muted-foreground py-12">
              <div className="text-sm">No data available</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg bg-background overflow-hidden', className)}>
      {/* Sticky Header */}
      <div 
        className={cn(
          'flex border-b bg-muted/30 transition-shadow duration-200',
          {
            'shadow-sm': stickyHeader && isScrolled,
          }
        )}
        style={{
          position: stickyHeader ? 'sticky' : 'relative',
          top: stickyHeader ? 0 : 'auto',
          zIndex: stickyHeader ? 10 : 'auto',
        }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              'flex-shrink-0 px-3 py-3 text-sm font-medium text-muted-foreground',
              column.headerClassName
            )}
            style={{ 
              width: typeof column.width === 'number' ? `${column.width}px` : column.width,
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
            }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtual List */}
      <List
        ref={listRef}
        height={height - 48} // Subtract header height
        width={totalWidth}
        itemCount={data?.length || 0}
        itemSize={itemHeight}
        itemData={rowData as any}
        overscanCount={overscan}
        onScroll={handleScroll}
      >
        {VirtualRow as any}
      </List>
    </div>
  )
}) as <T>(props: VirtualTableProps<T>) => React.JSX.Element

// Export utilities for external use
export const scrollToItem = (listRef: React.RefObject<List>, index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start') => {
  listRef.current?.scrollToItem(index, align)
}

export const scrollToOffset = (listRef: React.RefObject<List>, offset: number) => {
  listRef.current?.scrollTo(offset)
}