import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'react-native-uuid';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';

export interface OfflineQueueRecord {
  id: string;
  type: 'attendance' | 'performance' | 'note';
  data: any;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  syncStatus: 'pending' | 'syncing' | 'failed' | 'synced';
  conflictResolution: 'overwrite' | 'merge' | 'skip';
  validationStatus: 'valid' | 'invalid' | 'warning';
  metadata?: {
    deviceId?: string;
    teacherId?: string;
    groupId?: string;
    date?: string;
  };
}

export interface QueueStats {
  totalPending: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  failedItems: number;
  lastSyncAttempt?: number;
  nextSyncAttempt?: number;
}

class OfflineQueueService {
  private queueKey = 'offline_queue';
  private statsKey = 'queue_stats';
  private isOnline = true;
  private isSyncing = false;
  private syncCallbacks: ((stats: QueueStats) => void)[] = [];

  constructor() {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      // If we just came back online and weren't syncing, start sync
      if (wasOffline && this.isOnline && !this.isSyncing) {
        this.processPendingQueue();
      }
    });
  }

  async addToQueue(
    type: OfflineQueueRecord['type'],
    data: any,
    priority: OfflineQueueRecord['priority'] = 'medium',
    metadata?: OfflineQueueRecord['metadata']
  ): Promise<string> {
    const record: OfflineQueueRecord = {
      id: uuidv4(),
      type,
      data,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.getMaxRetries(priority),
      syncStatus: 'pending',
      conflictResolution: this.getConflictResolution(type),
      validationStatus: this.validateData(type, data),
      metadata
    };

    await this.saveRecord(record);
    await this.updateStats();
    
    // If online and not currently syncing, try to sync immediately
    if (this.isOnline && !this.isSyncing) {
      setTimeout(() => this.processPendingQueue(), 100);
    }

    return record.id;
  }

  private getMaxRetries(priority: OfflineQueueRecord['priority']): number {
    switch (priority) {
      case 'high': return 5;
      case 'medium': return 3;
      case 'low': return 2;
      default: return 3;
    }
  }

  private getConflictResolution(type: OfflineQueueRecord['type']): OfflineQueueRecord['conflictResolution'] {
    switch (type) {
      case 'attendance': return 'overwrite'; // Last attendance status wins
      case 'performance': return 'merge'; // Combine performance data
      case 'note': return 'overwrite'; // Last note wins
      default: return 'overwrite';
    }
  }

  private validateData(type: OfflineQueueRecord['type'], data: any): OfflineQueueRecord['validationStatus'] {
    try {
      switch (type) {
        case 'attendance':
          if (!data.studentId || !data.date || !data.status) {
            return 'invalid';
          }
          if (!['present', 'absent', 'late', 'excused'].includes(data.status)) {
            return 'invalid';
          }
          return 'valid';
        
        case 'performance':
          if (!data.studentId || typeof data.score !== 'number') {
            return 'invalid';
          }
          if (data.score < 0 || data.score > 100) {
            return 'warning';
          }
          return 'valid';
        
        case 'note':
          if (!data.studentId || !data.content) {
            return 'invalid';
          }
          return 'valid';
        
        default:
          return 'warning';
      }
    } catch (error) {
      return 'invalid';
    }
  }

  private async saveRecord(record: OfflineQueueRecord) {
    try {
      const existingQueue = await this.loadQueue();
      
      // Remove any existing record with same key for conflict resolution
      const filteredQueue = existingQueue.filter(
        existing => !this.isConflictingRecord(existing, record)
      );
      
      filteredQueue.push(record);
      
      // Sort by priority and timestamp
      filteredQueue.sort(this.comparePriority);
      
      await AsyncStorage.setItem(this.queueKey, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error('Error saving queue record:', error);
    }
  }

  private isConflictingRecord(existing: OfflineQueueRecord, newRecord: OfflineQueueRecord): boolean {
    if (existing.type !== newRecord.type) return false;
    
    switch (existing.type) {
      case 'attendance':
        return existing.data.studentId === newRecord.data.studentId &&
               existing.data.date === newRecord.data.date;
      
      case 'performance':
        return existing.data.studentId === newRecord.data.studentId &&
               existing.data.assessmentId === newRecord.data.assessmentId;
      
      case 'note':
        return existing.data.studentId === newRecord.data.studentId &&
               existing.data.noteType === newRecord.data.noteType;
      
      default:
        return false;
    }
  }

  private comparePriority(a: OfflineQueueRecord, b: OfflineQueueRecord): number {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    // First sort by priority
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by timestamp (older first)
    return a.timestamp - b.timestamp;
  }

  private async loadQueue(): Promise<OfflineQueueRecord[]> {
    try {
      const queueData = await AsyncStorage.getItem(this.queueKey);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Error loading queue:', error);
      return [];
    }
  }

  async processPendingQueue(): Promise<QueueStats> {
    if (!this.isOnline || this.isSyncing) {
      return this.getStats();
    }

    this.isSyncing = true;
    
    try {
      const queue = await this.loadQueue();
      const pendingRecords = queue.filter(
        record => record.syncStatus === 'pending' && 
                 record.validationStatus !== 'invalid' &&
                 record.retryCount < record.maxRetries
      );

      const results = await Promise.allSettled(
        pendingRecords.map(record => this.syncRecord(record))
      );

      // Update records based on sync results
      const updatedQueue = queue.map((record, index) => {
        if (record.syncStatus !== 'pending') return record;
        
        const resultIndex = pendingRecords.findIndex(p => p.id === record.id);
        if (resultIndex === -1) return record;
        
        const result = results[resultIndex];
        if (result.status === 'fulfilled') {
          return { ...record, syncStatus: 'synced' as const };
        } else {
          return {
            ...record,
            syncStatus: 'failed' as const,
            retryCount: record.retryCount + 1
          };
        }
      });

      // Remove synced records and failed records that exceeded max retries
      const cleanedQueue = updatedQueue.filter(
        record => record.syncStatus !== 'synced' && 
                 record.retryCount < record.maxRetries
      );

      await AsyncStorage.setItem(this.queueKey, JSON.stringify(cleanedQueue));
      await this.updateStats();
      
      return this.getStats();
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncRecord(record: OfflineQueueRecord): Promise<void> {
    switch (record.type) {
      case 'attendance':
        return this.syncAttendanceRecord(record);
      case 'performance':
        return this.syncPerformanceRecord(record);
      case 'note':
        return this.syncNoteRecord(record);
      default:
        throw new Error(`Unknown record type: ${record.type}`);
    }
  }

  private async syncAttendanceRecord(record: OfflineQueueRecord): Promise<void> {
    const { data } = record;
    
    const { error } = await supabase
      .from('attendance')
      .upsert({
        id: data.id,
        student_id: data.studentId,
        group_id: data.groupId,
        date: data.date,
        status: data.status,
        teacher_id: data.teacherId,
        notes: data.notes,
        created_at: new Date(data.timestamp || record.timestamp).toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to sync attendance: ${error.message}`);
    }
  }

  private async syncPerformanceRecord(record: OfflineQueueRecord): Promise<void> {
    const { data } = record;
    
    const { error } = await supabase
      .from('student_performance')
      .upsert({
        id: data.id,
        student_id: data.studentId,
        assessment_id: data.assessmentId,
        score: data.score,
        feedback: data.feedback,
        teacher_id: data.teacherId,
        created_at: new Date(data.timestamp || record.timestamp).toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to sync performance: ${error.message}`);
    }
  }

  private async syncNoteRecord(record: OfflineQueueRecord): Promise<void> {
    const { data } = record;
    
    const { error } = await supabase
      .from('teacher_notes')
      .upsert({
        id: data.id,
        student_id: data.studentId,
        content: data.content,
        note_type: data.noteType,
        teacher_id: data.teacherId,
        created_at: new Date(data.timestamp || record.timestamp).toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to sync note: ${error.message}`);
    }
  }

  async getStats(): Promise<QueueStats> {
    try {
      const queue = await this.loadQueue();
      const pending = queue.filter(r => r.syncStatus === 'pending');
      
      const stats: QueueStats = {
        totalPending: pending.length,
        highPriority: pending.filter(r => r.priority === 'high').length,
        mediumPriority: pending.filter(r => r.priority === 'medium').length,
        lowPriority: pending.filter(r => r.priority === 'low').length,
        failedItems: queue.filter(r => r.syncStatus === 'failed').length,
        lastSyncAttempt: Date.now()
      };

      await AsyncStorage.setItem(this.statsKey, JSON.stringify(stats));
      
      // Notify callbacks
      this.syncCallbacks.forEach(callback => callback(stats));
      
      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalPending: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
        failedItems: 0
      };
    }
  }

  private async updateStats() {
    await this.getStats(); // This will update and store stats
  }

  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.queueKey);
      await AsyncStorage.removeItem(this.statsKey);
      await this.updateStats();
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }

  async retryFailedItems(): Promise<void> {
    try {
      const queue = await this.loadQueue();
      const updatedQueue = queue.map(record => 
        record.syncStatus === 'failed' && record.retryCount < record.maxRetries
          ? { ...record, syncStatus: 'pending' as const }
          : record
      );
      
      await AsyncStorage.setItem(this.queueKey, JSON.stringify(updatedQueue));
      
      if (this.isOnline) {
        await this.processPendingQueue();
      }
    } catch (error) {
      console.error('Error retrying failed items:', error);
    }
  }

  onStatsChange(callback: (stats: QueueStats) => void): () => void {
    this.syncCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.syncCallbacks.indexOf(callback);
      if (index > -1) {
        this.syncCallbacks.splice(index, 1);
      }
    };
  }

  async getQueueDetails(): Promise<OfflineQueueRecord[]> {
    return this.loadQueue();
  }

  async removeFromQueue(recordId: string): Promise<void> {
    try {
      const queue = await this.loadQueue();
      const filteredQueue = queue.filter(record => record.id !== recordId);
      await AsyncStorage.setItem(this.queueKey, JSON.stringify(filteredQueue));
      await this.updateStats();
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  }
}

export const offlineQueueService = new OfflineQueueService();