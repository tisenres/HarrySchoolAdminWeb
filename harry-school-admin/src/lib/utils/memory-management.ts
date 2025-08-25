import { ResourceManager } from '@/lib/middleware/performance'

/**
 * Memory-efficient file processing utilities
 */
export class StreamingFileProcessor {
  private readonly maxMemoryUsage = 50 * 1024 * 1024 // 50MB
  private readonly chunkSize = 1024 * 1024 // 1MB chunks
  
  /**
   * Process large files without loading everything into memory
   */
  async processLargeFile(
    file: File,
    processor: (chunk: Uint8Array, index: number) => Promise<any>
  ): Promise<any[]> {
    const stream = file.stream()
    const reader = stream.getReader()
    const results: any[] = []
    let totalSize = 0
    let chunkIndex = 0

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        totalSize += value.length
        
        // Prevent memory overflow
        if (totalSize > this.maxMemoryUsage) {
          throw new Error(`File too large for memory processing: ${totalSize} bytes. Maximum: ${this.maxMemoryUsage} bytes`)
        }
        
        // Process chunk immediately
        const result = await processor(value, chunkIndex++)
        results.push(result)
        
        // Force garbage collection hint every 10 chunks
        if (chunkIndex % 10 === 0 && global.gc) {
          global.gc()
        }
        
        // Yield to event loop
        await new Promise(resolve => setImmediate(resolve))
      }
      
      return results
      
    } finally {
      // Cleanup
      reader.releaseLock()
      
      // Force garbage collection
      if (global.gc) {
        global.gc()
      }
    }
  }

  /**
   * Process CSV data in streaming fashion
   */
  async processCSVStream(
    file: File,
    rowProcessor: (row: any, rowIndex: number) => Promise<void>,
    options: {
      delimiter?: string
      skipHeader?: boolean
      batchSize?: number
    } = {}
  ): Promise<{ processed: number, errors: string[] }> {
    const { delimiter = ',', skipHeader = true, batchSize = 100 } = options
    
    let processed = 0
    const errors: string[] = []
    let currentBatch: any[] = []
    let rowIndex = 0
    
    const decoder = new TextDecoder()
    let buffer = ''
    
    await this.processLargeFile(file, async (chunk, chunkIndex) => {
      // Decode chunk and add to buffer
      buffer += decoder.decode(chunk, { stream: true })
      
      // Process complete lines
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (!line.trim()) continue
        
        try {
          // Skip header if requested
          if (skipHeader && rowIndex === 0) {
            rowIndex++
            continue
          }
          
          // Parse CSV row
          const row = this.parseCSVRow(line, delimiter)
          
          // Add to batch
          currentBatch.push({ row, index: rowIndex })
          
          // Process batch when full
          if (currentBatch.length >= batchSize) {
            await this.processBatch(currentBatch, rowProcessor, errors)
            processed += currentBatch.length
            currentBatch = []
          }
          
          rowIndex++
          
        } catch (error) {
          errors.push(`Row ${rowIndex}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    })
    
    // Process remaining batch
    if (currentBatch.length > 0) {
      await this.processBatch(currentBatch, rowProcessor, errors)
      processed += currentBatch.length
    }
    
    return { processed, errors }
  }

  private async processBatch(
    batch: Array<{ row: any, index: number }>,
    processor: (row: any, rowIndex: number) => Promise<void>,
    errors: string[]
  ): Promise<void> {
    const promises = batch.map(async ({ row, index }) => {
      try {
        await processor(row, index)
      } catch (error) {
        errors.push(`Row ${index}: ${error instanceof Error ? error.message : String(error)}`)
      }
    })
    
    await Promise.allSettled(promises)
  }

  private parseCSVRow(line: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        // End of field
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    // Add final field
    result.push(current.trim())
    
    return result
  }
}

/**
 * Enhanced API cache with memory management
 */
export class OptimizedApiCache extends Map {
  private maxSize = 1000
  private maxAge = 5 * 60 * 1000 // 5 minutes
  private maxMemoryUsage = 100 * 1024 * 1024 // 100MB
  private currentMemoryUsage = 0

  set(key: string, value: any) {
    // Estimate memory usage
    const entrySize = this.estimateSize(value)
    
    // Remove oldest entries if at capacity or memory limit
    while (
      (this.size >= this.maxSize || this.currentMemoryUsage + entrySize > this.maxMemoryUsage) &&
      this.size > 0
    ) {
      const oldestKey = this.keys().next().value
      this.delete(oldestKey)
    }

    const entry = {
      data: value,
      timestamp: Date.now(),
      size: entrySize
    }

    super.set(key, entry)
    this.currentMemoryUsage += entrySize
  }

  get(key: string) {
    const entry = super.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): boolean {
    const entry = super.get(key)
    if (entry) {
      this.currentMemoryUsage -= entry.size
    }
    return super.delete(key)
  }

  // Cleanup expired entries and optimize memory
  cleanup() {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, entry] of this.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.delete(key)
        cleaned++
      }
    }
    
    // Force garbage collection if we cleaned significant entries
    if (cleaned > 10 && global.gc) {
      global.gc()
    }
    
    return cleaned
  }

  // Estimate memory usage of a value
  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2 // Rough estimate (UTF-16)
    } catch {
      return 1000 // Default estimate for non-serializable objects
    }
  }

  // Get memory usage statistics
  getMemoryStats() {
    return {
      currentUsage: this.currentMemoryUsage,
      maxUsage: this.maxMemoryUsage,
      usagePercentage: (this.currentMemoryUsage / this.maxMemoryUsage) * 100,
      entryCount: this.size,
      maxEntries: this.maxSize
    }
  }
}

/**
 * Memory-efficient bulk data processor
 */
export class BulkDataProcessor {
  private resourceManager = new ResourceManager()
  
  constructor(
    private maxConcurrency: number = 5,
    private memoryLimit: number = 100 * 1024 * 1024 // 100MB
  ) {}

  /**
   * Process large datasets in memory-efficient batches
   */
  async processInBatches<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    options: {
      batchSize?: number
      progressCallback?: (processed: number, total: number) => void
      memoryCheck?: boolean
    } = {}
  ): Promise<{ results: R[], errors: string[] }> {
    const { batchSize = 100, progressCallback, memoryCheck = true } = options
    const results: R[] = []
    const errors: string[] = []
    
    try {
      const totalBatches = Math.ceil(items.length / batchSize)
      let processedItems = 0
      
      for (let i = 0; i < totalBatches; i++) {
        const startIdx = i * batchSize
        const endIdx = Math.min(startIdx + batchSize, items.length)
        const batch = items.slice(startIdx, endIdx)
        
        try {
          // Memory check before processing
          if (memoryCheck && this.isMemoryPressure()) {
            // Force cleanup and garbage collection
            this.forceMemoryCleanup()
            
            // Wait for memory to stabilize
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          
          const batchResults = await processor(batch)
          results.push(...batchResults)
          
          processedItems += batch.length
          
          if (progressCallback) {
            progressCallback(processedItems, items.length)
          }
          
          // Yield to event loop every batch
          await new Promise(resolve => setImmediate(resolve))
          
          // Periodic garbage collection
          if (i % 10 === 0 && global.gc) {
            global.gc()
          }
          
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          errors.push(`Batch ${i + 1} (items ${startIdx}-${endIdx}): ${message}`)
        }
      }
      
      return { results, errors }
      
    } finally {
      this.cleanup()
    }
  }

  /**
   * Process file imports with memory management
   */
  async processFileImport<T>(
    file: File,
    parser: (content: string) => T[],
    validator: (item: T) => Promise<boolean>,
    importer: (validItems: T[]) => Promise<void>,
    options: {
      chunkSize?: number
      validationBatchSize?: number
      importBatchSize?: number
      progressCallback?: (stage: string, progress: number, total: number) => void
    } = {}
  ): Promise<{ imported: number, errors: string[] }> {
    const {
      chunkSize = 1024 * 1024, // 1MB
      validationBatchSize = 100,
      importBatchSize = 50,
      progressCallback
    } = options
    
    let imported = 0
    const errors: string[] = []
    
    try {
      // Read file in chunks to avoid memory overflow
      progressCallback?.('reading', 0, 100)
      
      const fileContent = await this.readFileInChunks(file, chunkSize)
      progressCallback?.('parsing', 0, 100)
      
      // Parse data
      const allItems = parser(fileContent)
      progressCallback?.('parsing', 100, 100)
      
      if (allItems.length === 0) {
        return { imported: 0, errors: ['No data found in file'] }
      }
      
      // Validate items in batches
      progressCallback?.('validating', 0, allItems.length)
      const validItems: T[] = []
      
      for (let i = 0; i < allItems.length; i += validationBatchSize) {
        const batch = allItems.slice(i, i + validationBatchSize)
        
        const validationResults = await Promise.allSettled(
          batch.map(async (item, index) => {
            try {
              const isValid = await validator(item)
              return { valid: isValid, item, index: i + index }
            } catch (error) {
              return { 
                valid: false, 
                item, 
                index: i + index,
                error: error instanceof Error ? error.message : String(error)
              }
            }
          })
        )
        
        validationResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            if (result.value.valid) {
              validItems.push(result.value.item)
            } else {
              errors.push(`Row ${result.value.index + 1}: ${result.value.error || 'Validation failed'}`)
            }
          } else {
            errors.push(`Validation error: ${result.reason}`)
          }
        })
        
        progressCallback?.('validating', Math.min(i + validationBatchSize, allItems.length), allItems.length)
        
        // Memory cleanup every 10 batches
        if ((i / validationBatchSize) % 10 === 0) {
          this.forceMemoryCleanup()
        }
      }
      
      // Import valid items in batches
      progressCallback?.('importing', 0, validItems.length)
      
      for (let i = 0; i < validItems.length; i += importBatchSize) {
        const batch = validItems.slice(i, i + importBatchSize)
        
        try {
          await importer(batch)
          imported += batch.length
          
          progressCallback?.('importing', Math.min(i + importBatchSize, validItems.length), validItems.length)
          
          // Yield to event loop
          await new Promise(resolve => setImmediate(resolve))
          
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          errors.push(`Import batch ${Math.floor(i / importBatchSize) + 1}: ${message}`)
        }
      }
      
      return { imported, errors }
      
    } finally {
      this.cleanup()
    }
  }

  private async readFileInChunks(file: File, chunkSize: number): Promise<string> {
    const chunks: string[] = []
    const stream = file.stream()
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        chunks.push(decoder.decode(value, { stream: true }))
        
        // Memory pressure check
        if (this.isMemoryPressure()) {
          throw new Error('Memory pressure detected during file reading')
        }
      }
      
      // Final decode
      chunks.push(decoder.decode())
      
      return chunks.join('')
      
    } finally {
      reader.releaseLock()
    }
  }

  private isMemoryPressure(): boolean {
    if (typeof process === 'undefined') return false
    
    const memUsage = process.memoryUsage()
    const usedMemory = memUsage.heapUsed
    const availableMemory = memUsage.heapTotal
    
    return usedMemory / availableMemory > 0.85 // 85% threshold
  }

  private forceMemoryCleanup(): void {
    // Clear require cache for large modules (be careful with this)
    if (typeof require !== 'undefined' && typeof window === 'undefined') {
      try {
        const Module = require('module')
        if (Module._cache) {
          Object.keys(Module._cache).forEach(key => {
            if (key.includes('node_modules')) {
              delete Module._cache[key]
            }
          })
        }
      } catch (error) {
        // Silently fail in browser environments
      }
    }
    
    // Force garbage collection if available
    if (typeof window === 'undefined' && global.gc) {
      global.gc()
    }
  }

  cleanup() {
    this.resourceManager.cleanup()
  }
}

// Export optimized instances
export const streamingFileProcessor = new StreamingFileProcessor()
export const optimizedApiCache = new OptimizedApiCache()
export const bulkDataProcessor = new BulkDataProcessor()

// Cleanup function for Next.js API routes
export function withMemoryManagement(handler: Function) {
  return async (...args: any[]) => {
    const processor = new BulkDataProcessor()
    
    try {
      const result = await handler(...args)
      return result
    } finally {
      // Cleanup after request
      processor.cleanup()
      
      // Force GC if memory pressure is high
      if (processor['isMemoryPressure']() && global.gc) {
        global.gc()
      }
    }
  }
}