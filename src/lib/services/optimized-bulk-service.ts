import { BaseService } from './base-service'
import { withTimeout } from '@/lib/middleware/performance'

export interface BulkResult {
  success: number
  errors: string[]
  total: number
  duration: number
}

/**
 * Optimized bulk operations service with parallel processing and concurrency control
 */
export class OptimizedBulkService extends BaseService {
  private concurrencyLimit = 5
  private timeoutMs = 30000

  constructor(tableName: any, concurrency: number = 5) {
    super(tableName)
    this.concurrencyLimit = concurrency
  }

  /**
   * Process items in parallel chunks with concurrency control
   */
  async processBulk<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    chunkSize: number = this.concurrencyLimit
  ): Promise<{ results: R[], errors: Array<{ item: T, error: string }> }> {
    const results: R[] = []
    const errors: Array<{ item: T, error: string }> = []
    
    // Process in chunks to avoid overwhelming the database
    const chunks = this.chunk(items, chunkSize)
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (item) => {
        try {
          const result = await withTimeout(
            processor(item),
            this.timeoutMs,
            `Processing item timed out after ${this.timeoutMs}ms`
          )
          return { success: true, item, result }
        } catch (error) {
          return { 
            success: false, 
            item, 
            error: error instanceof Error ? error.message : String(error) 
          }
        }
      })
      
      const chunkResults = await Promise.allSettled(promises)
      
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value.result)
          } else {
            errors.push({
              item: result.value.item,
              error: result.value.error
            })
          }
        } else {
          errors.push({
            item: chunk[index],
            error: result.reason?.message || 'Unknown error'
          })
        }
      })
      
      // Yield to event loop between chunks
      await new Promise(resolve => setImmediate(resolve))
    }
    
    return { results, errors }
  }

  /**
   * Optimized bulk delete with parallel processing
   */
  async bulkDelete(ids: string[]): Promise<BulkResult> {
    const startTime = Date.now()
    
    await this.checkPermission(['admin', 'superadmin'])
    
    const { results, errors } = await this.processBulk(
      ids,
      async (id: string) => {
        return await this.delete(id)
      }
    )

    return {
      success: results.length,
      errors: errors.map(e => `Failed to delete ${e.item}: ${e.error}`),
      total: ids.length,
      duration: Date.now() - startTime
    }
  }

  /**
   * Optimized bulk restore with parallel processing
   */
  async bulkRestore(ids: string[]): Promise<BulkResult> {
    const startTime = Date.now()
    
    await this.checkPermission(['admin', 'superadmin'])
    
    const { results, errors } = await this.processBulk(
      ids,
      async (id: string) => {
        return await this.restore(id)
      }
    )

    return {
      success: results.length,
      errors: errors.map(e => `Failed to restore ${e.item}: ${e.error}`),
      total: ids.length,
      duration: Date.now() - startTime
    }
  }

  /**
   * Optimized bulk update with parallel processing
   */
  async bulkUpdate<T>(
    updates: Array<{ id: string, data: T }>,
    updateFunction: (id: string, data: T) => Promise<any>
  ): Promise<BulkResult> {
    const startTime = Date.now()
    
    await this.checkPermission(['admin', 'superadmin'])
    
    const { results, errors } = await this.processBulk(
      updates,
      async (update) => {
        return await updateFunction(update.id, update.data)
      }
    )

    return {
      success: results.length,
      errors: errors.map(e => `Failed to update ${e.item.id}: ${e.error}`),
      total: updates.length,
      duration: Date.now() - startTime
    }
  }

  /**
   * Optimized bulk create with parallel processing
   */
  async bulkCreate<T>(
    items: T[],
    createFunction: (item: T) => Promise<any>
  ): Promise<BulkResult> {
    const startTime = Date.now()
    
    await this.checkPermission(['admin', 'superadmin'])
    
    const { results, errors } = await this.processBulk(
      items,
      createFunction
    )

    return {
      success: results.length,
      errors: errors.map((e, index) => `Failed to create item ${index + 1}: ${e.error}`),
      total: items.length,
      duration: Date.now() - startTime
    }
  }

  /**
   * Batch database operations for maximum efficiency
   */
  async batchOperation<T>(
    items: T[],
    operation: 'insert' | 'update' | 'delete',
    tableName?: string,
    batchSize: number = 100
  ): Promise<BulkResult> {
    const startTime = Date.now()
    const table = tableName || this.tableName
    const supabase = await this.getSupabase()
    
    const results: any[] = []
    const errors: string[] = []
    const chunks = this.chunk(items, batchSize)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      try {
        let query
        
        switch (operation) {
          case 'insert':
            query = supabase.from(table as string).insert(chunk).select()
            break
          case 'update':
            // For updates, items should have id field
            const updatePromises = chunk.map((item: any) => 
              supabase
                .from(table as string)
                .update(item)
                .eq('id', item.id)
                .select()
            )
            const updateResults = await Promise.allSettled(updatePromises)
            updateResults.forEach((result, index) => {
              if (result.status === 'fulfilled' && result.value.data) {
                results.push(...result.value.data)
              } else {
                errors.push(`Batch ${i + 1}, item ${index + 1}: ${result.status === 'rejected' ? result.reason : 'Update failed'}`)
              }
            })
            continue
          case 'delete':
            // For deletes, items should be IDs
            const deleteIds = chunk as string[]
            query = supabase.from(table as string).delete().in('id', deleteIds)
            break
          default:
            throw new Error(`Unsupported operation: ${operation}`)
        }

        if (query) {
          const { data, error } = await withTimeout(
            query,
            this.timeoutMs,
            `Batch operation timed out after ${this.timeoutMs}ms`
          )

          if (error) {
            errors.push(`Batch ${i + 1}: ${error.message}`)
          } else if (data) {
            results.push(...(Array.isArray(data) ? data : [data]))
          }
        }
        
      } catch (error) {
        errors.push(`Batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`)
      }
      
      // Yield to event loop between batches
      if (i < chunks.length - 1) {
        await new Promise(resolve => setImmediate(resolve))
      }
    }

    return {
      success: results.length,
      errors,
      total: items.length,
      duration: Date.now() - startTime
    }
  }

  /**
   * Split array into chunks
   */
  private chunk<T>(array: T[], size: number): T[][] {
    if (size <= 0) size = 1
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    )
  }

  /**
   * Get statistics about bulk operation performance
   */
  getPerformanceStats(result: BulkResult) {
    const successRate = (result.success / result.total) * 100
    const itemsPerSecond = result.total / (result.duration / 1000)
    
    return {
      successRate: Math.round(successRate * 100) / 100,
      itemsPerSecond: Math.round(itemsPerSecond * 100) / 100,
      averageTimePerItem: Math.round((result.duration / result.total) * 100) / 100,
      totalDuration: result.duration
    }
  }

  /**
   * Validate bulk operation before execution
   */
  validateBulkOperation(items: any[], maxItems: number = 1000): void {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array')
    }
    
    if (items.length === 0) {
      throw new Error('No items provided')
    }
    
    if (items.length > maxItems) {
      throw new Error(`Too many items: ${items.length}. Maximum allowed: ${maxItems}`)
    }
  }

  /**
   * Progress callback for long-running operations
   */
  async bulkOperationWithProgress<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    progressCallback?: (completed: number, total: number, errors: number) => void,
    chunkSize: number = this.concurrencyLimit
  ): Promise<BulkResult> {
    const startTime = Date.now()
    const total = items.length
    let completed = 0
    let errorCount = 0
    const errors: string[] = []
    
    const chunks = this.chunk(items, chunkSize)
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (item, index) => {
        try {
          const result = await withTimeout(
            processor(item),
            this.timeoutMs,
            `Processing item ${completed + index + 1} timed out`
          )
          return { success: true, item, result }
        } catch (error) {
          return { 
            success: false, 
            item, 
            error: error instanceof Error ? error.message : String(error) 
          }
        }
      })
      
      const chunkResults = await Promise.allSettled(promises)
      
      chunkResults.forEach((result, index) => {
        completed++
        
        if (result.status === 'fulfilled') {
          if (!result.value.success) {
            errorCount++
            errors.push(`Item ${completed}: ${result.value.error}`)
          }
        } else {
          errorCount++
          errors.push(`Item ${completed}: ${result.reason?.message || 'Unknown error'}`)
        }
        
        // Call progress callback
        if (progressCallback) {
          progressCallback(completed, total, errorCount)
        }
      })
      
      // Yield to event loop between chunks
      await new Promise(resolve => setImmediate(resolve))
    }

    return {
      success: completed - errorCount,
      errors,
      total,
      duration: Date.now() - startTime
    }
  }
}

// Specific optimized bulk services for different entities
export class OptimizedStudentBulkService extends OptimizedBulkService {
  constructor() {
    super('students', 10) // Higher concurrency for students
  }

  async bulkEnroll(
    enrollments: Array<{ studentId: string, groupId: string, notes?: string }>
  ): Promise<BulkResult> {
    const startTime = Date.now()
    
    const { results, errors } = await this.processBulk(
      enrollments,
      async (enrollment) => {
        // Implementation would call the actual enrollment method
        return await this.enrollInGroup(enrollment.studentId, enrollment.groupId, enrollment.notes)
      }
    )

    return {
      success: results.length,
      errors: errors.map(e => `Failed to enroll student: ${e.error}`),
      total: enrollments.length,
      duration: Date.now() - startTime
    }
  }

  private async enrollInGroup(studentId: string, groupId: string, notes?: string): Promise<any> {
    // This would implement the actual enrollment logic
    const supabase = await this.getSupabase()
    // Implementation details...
    return { studentId, groupId, notes }
  }
}

export class OptimizedTeacherBulkService extends OptimizedBulkService {
  constructor() {
    super('teachers', 8) // Moderate concurrency for teachers
  }

  async bulkAssign(
    assignments: Array<{ teacherId: string, groupId: string, role?: string }>
  ): Promise<BulkResult> {
    const startTime = Date.now()
    
    const { results, errors } = await this.processBulk(
      assignments,
      async (assignment) => {
        return await this.assignToGroup(assignment.teacherId, assignment.groupId, assignment.role)
      }
    )

    return {
      success: results.length,
      errors: errors.map(e => `Failed to assign teacher: ${e.error}`),
      total: assignments.length,
      duration: Date.now() - startTime
    }
  }

  private async assignToGroup(teacherId: string, groupId: string, role?: string): Promise<any> {
    // Implementation would call the actual assignment method
    const supabase = await this.getSupabase()
    // Implementation details...
    return { teacherId, groupId, role }
  }
}