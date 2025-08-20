import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

interface QueuedOperation {
  id: string;
  operation: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
  metadata?: {
    table?: string;
    action?: 'insert' | 'update' | 'delete';
    localId?: string;
    conflictResolution?: 'client' | 'server' | 'manual';
  };
}

interface ConflictResolution {
  operationId: string;
  conflictType: 'data_conflict' | 'version_conflict' | 'constraint_violation';
  clientData: any;
  serverData: any;
  resolution: 'use_client' | 'use_server' | 'merge' | 'manual_review';
  mergedData?: any;
}

/**
 * Offline queue management for mobile Supabase operations
 * Handles data synchronization, conflict resolution, and background sync
 */
export class OfflineQueue {
  private static readonly QUEUE_STORAGE_KEY = '@harry-school:offline-queue';
  private static readonly CONFLICTS_STORAGE_KEY = '@harry-school:sync-conflicts';
  private static readonly MAX_QUEUE_SIZE = 1000;
  private static readonly BATCH_SIZE = 10;
  
  private isProcessing = false;
  private listeners: Set<(event: OfflineQueueEvent) => void> = new Set();

  constructor() {
    this.cleanupOldOperations();
  }

  /**
   * Add operation to offline queue
   */
  async enqueue(
    operation: (client: SupabaseClient<Database>) => Promise<any>,
    options: {
      priority?: 'high' | 'medium' | 'low';
      maxRetries?: number;
      metadata?: QueuedOperation['metadata'];
    } = {}
  ): Promise<string> {
    const operationId = this.generateId();
    const queuedOp: QueuedOperation = {
      id: operationId,
      operation: this.serializeOperation(operation),
      data: options.metadata?.localId ? await this.getLocalData(options.metadata.localId) : null,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      priority: options.priority || 'medium',
      metadata: options.metadata,
    };

    await this.addToQueue(queuedOp);
    this.emitEvent('operation_queued', { operationId, priority: queuedOp.priority });
    
    return operationId;
  }

  /**
   * Process the entire queue when connection is available
   */
  async processQueue(client: SupabaseClient<Database>): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.emitEvent('queue_processing_started', {});

    try {
      const queue = await this.getQueue();
      const sortedQueue = this.sortQueueByPriority(queue);
      
      // Process in batches to avoid overwhelming the connection
      for (let i = 0; i < sortedQueue.length; i += OfflineQueue.BATCH_SIZE) {
        const batch = sortedQueue.slice(i, i + OfflineQueue.BATCH_SIZE);
        await this.processBatch(client, batch);
      }

      this.emitEvent('queue_processing_completed', { processedCount: queue.length });
    } catch (error) {
      this.emitEvent('queue_processing_error', { error: error.message });
    } finally {
      this.isProcessing = false;
    }
  }

  private async processBatch(client: SupabaseClient<Database>, batch: QueuedOperation[]): Promise<void> {
    const promises = batch.map(operation => this.processOperation(client, operation));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      const operation = batch[index];
      if (result.status === 'rejected') {
        this.handleOperationFailure(operation, result.reason);
      }
    });
  }

  private async processOperation(client: SupabaseClient<Database>, operation: QueuedOperation): Promise<void> {
    try {
      const operationFn = this.deserializeOperation(operation.operation);
      const result = await operationFn(client);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Check for conflicts if this is an update operation
      if (operation.metadata?.action === 'update' && operation.data) {
        await this.checkForConflicts(client, operation, result.data);
      }

      await this.removeFromQueue(operation.id);
      this.emitEvent('operation_completed', { 
        operationId: operation.id, 
        result: result.data 
      });

    } catch (error) {
      await this.handleOperationFailure(operation, error);
      throw error;
    }
  }

  private async handleOperationFailure(operation: QueuedOperation, error: any): Promise<void> {
    operation.retryCount++;
    
    if (operation.retryCount >= operation.maxRetries) {
      // Move to failed operations or handle based on operation type
      await this.handlePermanentFailure(operation, error);
    } else {
      // Update operation in queue for retry
      await this.updateOperationInQueue(operation);
      this.emitEvent('operation_retry_scheduled', { 
        operationId: operation.id, 
        retryCount: operation.retryCount 
      });
    }
  }

  private async handlePermanentFailure(operation: QueuedOperation, error: any): Promise<void> {
    await this.removeFromQueue(operation.id);
    
    // Store failed operation for manual review if it's critical
    if (operation.priority === 'high') {
      await this.storeFailed operation(operation, error);
    }
    
    this.emitEvent('operation_failed', { 
      operationId: operation.id, 
      error: error.message,
      isCritical: operation.priority === 'high'
    });
  }

  private async checkForConflicts(
    client: SupabaseClient<Database>, 
    operation: QueuedOperation, 
    serverData: any
  ): Promise<void> {
    if (!operation.data || !operation.metadata?.table) return;

    const localData = operation.data;
    
    // Simple conflict detection - in a real app, you'd have more sophisticated logic
    const hasConflict = this.detectDataConflict(localData, serverData);
    
    if (hasConflict) {
      const conflict: ConflictResolution = {
        operationId: operation.id,
        conflictType: 'data_conflict',
        clientData: localData,
        serverData: serverData,
        resolution: operation.metadata.conflictResolution || 'manual_review',
      };

      if (conflict.resolution === 'merge') {
        conflict.mergedData = this.mergeData(localData, serverData);
      }

      await this.storeConflict(conflict);
      this.emitEvent('conflict_detected', { 
        operationId: operation.id, 
        conflictType: conflict.conflictType 
      });
    }
  }

  private detectDataConflict(localData: any, serverData: any): boolean {
    // Simple timestamp-based conflict detection
    if (localData.updated_at && serverData.updated_at) {
      return new Date(localData.updated_at).getTime() < new Date(serverData.updated_at).getTime();
    }
    return false;
  }

  private mergeData(localData: any, serverData: any): any {
    // Simple merge strategy - prefer server data for system fields, local data for user fields
    return {
      ...serverData,
      // Keep local changes for user-editable fields
      ...Object.keys(localData).reduce((acc, key) => {
        if (!['id', 'created_at', 'updated_at', 'organization_id'].includes(key)) {
          acc[key] = localData[key];
        }
        return acc;
      }, {} as any),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Get pending conflicts for manual resolution
   */
  async getConflicts(): Promise<ConflictResolution[]> {
    try {
      const stored = await AsyncStorage.getItem(OfflineQueue.CONFLICTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get conflicts:', error);
      return [];
    }
  }

  /**
   * Resolve a conflict manually
   */
  async resolveConflict(operationId: string, resolution: ConflictResolution): Promise<void> {
    const conflicts = await this.getConflicts();
    const updatedConflicts = conflicts.filter(c => c.operationId !== operationId);
    
    await AsyncStorage.setItem(
      OfflineQueue.CONFLICTS_STORAGE_KEY, 
      JSON.stringify(updatedConflicts)
    );

    this.emitEvent('conflict_resolved', { operationId, resolution: resolution.resolution });
  }

  /**
   * Get queue status and statistics
   */
  async getQueueStatus(): Promise<{
    totalOperations: number;
    operationsByPriority: Record<string, number>;
    oldestOperation: number | null;
    conflicts: number;
    isProcessing: boolean;
  }> {
    const queue = await this.getQueue();
    const conflicts = await this.getConflicts();
    
    const operationsByPriority = queue.reduce((acc, op) => {
      acc[op.priority] = (acc[op.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const oldestTimestamp = queue.length > 0 
      ? Math.min(...queue.map(op => op.timestamp))
      : null;

    return {
      totalOperations: queue.length,
      operationsByPriority,
      oldestOperation: oldestTimestamp,
      conflicts: conflicts.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear the entire queue (use with caution)
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(OfflineQueue.QUEUE_STORAGE_KEY);
    this.emitEvent('queue_cleared', {});
  }

  /**
   * Subscribe to queue events
   */
  addEventListener(listener: (event: OfflineQueueEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Private helper methods

  private async getQueue(): Promise<QueuedOperation[]> {
    try {
      const stored = await AsyncStorage.getItem(OfflineQueue.QUEUE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get queue:', error);
      return [];
    }
  }

  private async addToQueue(operation: QueuedOperation): Promise<void> {
    const queue = await this.getQueue();
    
    // Prevent queue from growing too large
    if (queue.length >= OfflineQueue.MAX_QUEUE_SIZE) {
      // Remove oldest low-priority operations
      const filtered = queue
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            const priorities = { high: 3, medium: 2, low: 1 };
            return priorities[b.priority] - priorities[a.priority];
          }
          return b.timestamp - a.timestamp;
        })
        .slice(0, OfflineQueue.MAX_QUEUE_SIZE - 1);
      
      await AsyncStorage.setItem(OfflineQueue.QUEUE_STORAGE_KEY, JSON.stringify(filtered));
    }

    queue.push(operation);
    await AsyncStorage.setItem(OfflineQueue.QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }

  private async removeFromQueue(operationId: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter(op => op.id !== operationId);
    await AsyncStorage.setItem(OfflineQueue.QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  }

  private async updateOperationInQueue(operation: QueuedOperation): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(op => op.id === operation.id);
    
    if (index !== -1) {
      queue[index] = operation;
      await AsyncStorage.setItem(OfflineQueue.QUEUE_STORAGE_KEY, JSON.stringify(queue));
    }
  }

  private sortQueueByPriority(queue: QueuedOperation[]): QueuedOperation[] {
    const priorities = { high: 3, medium: 2, low: 1 };
    
    return queue.sort((a, b) => {
      // First by priority
      if (a.priority !== b.priority) {
        return priorities[b.priority] - priorities[a.priority];
      }
      // Then by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  private async storeConflict(conflict: ConflictResolution): Promise<void> {
    const conflicts = await this.getConflicts();
    conflicts.push(conflict);
    await AsyncStorage.setItem(
      OfflineQueue.CONFLICTS_STORAGE_KEY, 
      JSON.stringify(conflicts)
    );
  }

  private async storeFailedOperation(operation: QueuedOperation, error: any): Promise<void> {
    // Store critical failed operations for manual review
    const failedOps = await this.getFailedOperations();
    failedOps.push({
      ...operation,
      failedAt: Date.now(),
      error: error.message,
    });
    
    await AsyncStorage.setItem(
      '@harry-school:failed-operations', 
      JSON.stringify(failedOps.slice(-50)) // Keep last 50 failed operations
    );
  }

  private async getFailedOperations(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem('@harry-school:failed-operations');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  private async getLocalData(localId: string): Promise<any> {
    try {
      const stored = await AsyncStorage.getItem(`@harry-school:local-data:${localId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  private async cleanupOldOperations(): Promise<void> {
    const queue = await this.getQueue();
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const filtered = queue.filter(op => op.timestamp > oneWeekAgo);
    
    if (filtered.length !== queue.length) {
      await AsyncStorage.setItem(OfflineQueue.QUEUE_STORAGE_KEY, JSON.stringify(filtered));
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private serializeOperation(operation: Function): string {
    // In a real implementation, you'd need a more sophisticated serialization strategy
    // This is a simplified version for demo purposes
    return operation.toString();
  }

  private deserializeOperation(serialized: string): Function {
    // This is a simplified deserialization - in practice, you'd use a proper serialization library
    // or have predefined operation types
    return new Function('return ' + serialized)();
  }

  private emitEvent(type: string, data: any): void {
    const event: OfflineQueueEvent = { type, data, timestamp: Date.now() };
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in queue event listener:', error);
      }
    });
  }

  cleanup(): void {
    this.listeners.clear();
  }
}

interface OfflineQueueEvent {
  type: string;
  data: any;
  timestamp: number;
}

export type { QueuedOperation, ConflictResolution, OfflineQueueEvent };