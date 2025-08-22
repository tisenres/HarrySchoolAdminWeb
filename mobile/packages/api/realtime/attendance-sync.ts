/**
 * Harry School CRM - Real-time Attendance Synchronization Service
 * Handles live attendance marking, conflict resolution, and offline capabilities
 * 
 * Features teacher authority-based conflict resolution and cultural integration
 */

import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealtimeEvent, RealtimeSubscriptionsService } from './subscriptions';

// Types and Interfaces
export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  date: string;
  status: AttendanceStatus;
  timeMarked: string;
  markedBy: string;
  notes?: string;
  lateMinutes?: number;
  excuseReason?: string;
  parentNotified: boolean;
  syncStatus: SyncStatus;
  lastModified: string;
  organizationId: string;
  culturalContext?: {
    prayerTimeConsideration: boolean;
    islamicEventDay: boolean;
    ramadanAdjustment: boolean;
  };
}

export type AttendanceStatus = 
  | 'present' 
  | 'absent' 
  | 'late' 
  | 'excused' 
  | 'sick' 
  | 'family_emergency'
  | 'islamic_event';

export type SyncStatus = 
  | 'synced' 
  | 'pending_sync' 
  | 'conflict_detected' 
  | 'sync_failed'
  | 'offline_pending';

export interface AttendanceConflict {
  id: string;
  recordId: string;
  studentId: string;
  conflictType: 'duplicate_marking' | 'status_mismatch' | 'timing_conflict' | 'teacher_override';
  localData: Partial<AttendanceRecord>;
  serverData: Partial<AttendanceRecord>;
  detectedAt: string;
  resolvedAt?: string;
  resolution?: ConflictResolution;
  culturalConsiderations: {
    respectTeacherAuthority: boolean;
    islamicEventPriority: boolean;
    familyCircumstances: boolean;
  };
}

export interface ConflictResolution {
  strategy: 'teacher_authority' | 'latest_timestamp' | 'status_priority' | 'manual_review';
  resolvedBy: string;
  finalData: Partial<AttendanceRecord>;
  reasoning: string;
  culturalFactors: string[];
}

export interface AttendanceSession {
  id: string;
  classId: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime?: string;
  studentsCount: number;
  markedCount: number;
  pendingCount: number;
  conflictsCount: number;
  isActive: boolean;
  offlineCapable: boolean;
  culturalSettings: {
    prayerTimeAware: boolean;
    islamicCalendarAware: boolean;
    familyPrivacyRespected: boolean;
  };
}

export interface AttendanceSyncConfig {
  batchSize: number;
  syncInterval: number;
  conflictResolutionStrategy: 'automatic' | 'manual' | 'hybrid';
  offlineRetentionDays: number;
  teacherAuthorityEnabled: boolean;
  culturalIntegrationEnabled: boolean;
  parentNotificationEnabled: boolean;
}

// Real-time Attendance Synchronization Service
export class AttendanceSyncService extends EventEmitter {
  private realtimeService: RealtimeSubscriptionsService;
  private config: AttendanceSyncConfig;
  private pendingRecords: Map<string, AttendanceRecord> = new Map();
  private conflicts: Map<string, AttendanceConflict> = new Map();
  private activeSessions: Map<string, AttendanceSession> = new Map();
  private subscriptionId: string | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private isOnline = true;

  constructor(
    realtimeService: RealtimeSubscriptionsService, 
    config: AttendanceSyncConfig
  ) {
    super();
    this.realtimeService = realtimeService;
    this.config = config;
    this.initializeService();
  }

  // Service Initialization
  private async initializeService(): Promise<void> {
    try {
      // Load pending records from storage
      await this.loadPendingRecords();
      
      // Load unresolved conflicts
      await this.loadConflicts();
      
      // Subscribe to attendance events
      await this.subscribeToAttendanceEvents();
      
      // Start sync timer
      this.startSyncTimer();
      
      // Monitor connection status
      this.realtimeService.on('offline_mode_enabled', () => {
        this.isOnline = false;
        this.emit('sync_mode_changed', 'offline');
      });
      
      this.realtimeService.on('connected', () => {
        this.isOnline = true;
        this.emit('sync_mode_changed', 'online');
        this.processPendingSync();
      });
      
      console.log('Attendance Sync Service initialized');
    } catch (error) {
      console.error('Failed to initialize Attendance Sync Service:', error);
    }
  }

  // Event Subscriptions
  private async subscribeToAttendanceEvents(): Promise<void> {
    const eventTypes = ['attendance_marked', 'student_progress'];

    this.subscriptionId = await this.realtimeService.subscribeToEvents(
      eventTypes,
      (event: RealtimeEvent) => this.handleAttendanceEvent(event)
    );
  }

  // Event Handlers
  private async handleAttendanceEvent(event: RealtimeEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'attendance_marked':
          await this.handleAttendanceMarked(event);
          break;
        case 'student_progress':
          // Handle attendance-related progress updates
          if (event.payload.type === 'attendance') {
            await this.handleAttendanceProgress(event);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling attendance event:', error);
    }
  }

  private async handleAttendanceMarked(event: RealtimeEvent): Promise<void> {
    const attendanceData = event.payload;
    const recordId = attendanceData.id;

    // Check if we have a local record that conflicts
    const localRecord = this.pendingRecords.get(recordId);
    
    if (localRecord) {
      // Potential conflict detected
      await this.detectAndHandleConflict(localRecord, attendanceData);
    } else {
      // No conflict, process the update
      await this.processIncomingAttendance(attendanceData);
    }
  }

  private async handleAttendanceProgress(event: RealtimeEvent): Promise<void> {
    const progressData = event.payload;
    
    if (progressData.attendance_improvement) {
      this.emit('attendance_improvement', {
        studentId: progressData.student_id,
        improvement: progressData.attendance_improvement,
        timestamp: event.timestamp,
      });
    }
  }

  // Attendance Marking
  public async markAttendance(
    studentId: string,
    classId: string,
    status: AttendanceStatus,
    notes?: string,
    lateMinutes?: number
  ): Promise<{ success: boolean; recordId?: string; error?: string }> {
    try {
      const teacherId = await this.getCurrentTeacherId();
      const record = await this.createAttendanceRecord(
        studentId,
        classId,
        teacherId,
        status,
        notes,
        lateMinutes
      );

      if (this.isOnline) {
        // Try to sync immediately
        const syncResult = await this.syncRecord(record);
        
        if (syncResult.success) {
          this.emit('attendance_marked', record);
          return { success: true, recordId: record.id };
        } else {
          // Sync failed, store for later
          await this.storePendingRecord(record);
          return { success: true, recordId: record.id };
        }
      } else {
        // Offline mode, store locally
        await this.storePendingRecord(record);
        this.emit('attendance_marked_offline', record);
        return { success: true, recordId: record.id };
      }
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  public async bulkMarkAttendance(
    attendanceData: Array<{
      studentId: string;
      status: AttendanceStatus;
      notes?: string;
      lateMinutes?: number;
    }>,
    classId: string
  ): Promise<{ 
    success: boolean; 
    recordIds: string[]; 
    errors: Array<{ studentId: string; error: string }> 
  }> {
    const recordIds: string[] = [];
    const errors: Array<{ studentId: string; error: string }> = [];

    for (const data of attendanceData) {
      try {
        const result = await this.markAttendance(
          data.studentId,
          classId,
          data.status,
          data.notes,
          data.lateMinutes
        );

        if (result.success && result.recordId) {
          recordIds.push(result.recordId);
        } else {
          errors.push({
            studentId: data.studentId,
            error: result.error || 'Unknown error',
          });
        }
      } catch (error) {
        errors.push({
          studentId: data.studentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0,
      recordIds,
      errors,
    };
  }

  // Record Creation and Management
  private async createAttendanceRecord(
    studentId: string,
    classId: string,
    teacherId: string,
    status: AttendanceStatus,
    notes?: string,
    lateMinutes?: number
  ): Promise<AttendanceRecord> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Get student and class information
    const studentInfo = await this.getStudentInfo(studentId);
    const classInfo = await this.getClassInfo(classId);
    const teacherInfo = await this.getTeacherInfo(teacherId);

    // Check for cultural considerations
    const culturalContext = await this.assessCulturalContext(today, status);

    const record: AttendanceRecord = {
      id: `attendance_${studentId}_${classId}_${Date.now()}`,
      studentId,
      studentName: studentInfo?.name || 'Unknown Student',
      classId,
      className: classInfo?.name || 'Unknown Class',
      teacherId,
      teacherName: teacherInfo?.name || 'Unknown Teacher',
      date: today,
      status,
      timeMarked: now.toISOString(),
      markedBy: teacherId,
      notes,
      lateMinutes,
      parentNotified: false,
      syncStatus: this.isOnline ? 'pending_sync' : 'offline_pending',
      lastModified: now.toISOString(),
      organizationId: await this.getOrganizationId(),
      culturalContext,
    };

    return record;
  }

  private async assessCulturalContext(
    date: string,
    status: AttendanceStatus
  ): Promise<AttendanceRecord['culturalContext']> {
    if (!this.config.culturalIntegrationEnabled) {
      return undefined;
    }

    const context = {
      prayerTimeConsideration: false,
      islamicEventDay: false,
      ramadanAdjustment: false,
    };

    // Check if it's an Islamic event day
    if (await this.isIslamicEventDay(date)) {
      context.islamicEventDay = true;
    }

    // Check if it's during Ramadan
    if (await this.isRamadanPeriod(date)) {
      context.ramadanAdjustment = true;
    }

    // Check if absence is prayer-time related
    if (status === 'late' && await this.isPrayerTimeRelated()) {
      context.prayerTimeConsideration = true;
    }

    return context;
  }

  // Conflict Detection and Resolution
  private async detectAndHandleConflict(
    localRecord: AttendanceRecord,
    serverRecord: any
  ): Promise<void> {
    const conflict = await this.createConflict(localRecord, serverRecord);
    this.conflicts.set(conflict.id, conflict);
    
    this.emit('conflict_detected', conflict);

    if (this.config.conflictResolutionStrategy === 'automatic') {
      await this.resolveConflictAutomatically(conflict);
    } else {
      // Manual or hybrid resolution
      this.emit('conflict_requires_resolution', conflict);
    }
  }

  private async createConflict(
    localRecord: AttendanceRecord,
    serverRecord: any
  ): Promise<AttendanceConflict> {
    const conflictType = this.determineConflictType(localRecord, serverRecord);
    
    const conflict: AttendanceConflict = {
      id: `conflict_${Date.now()}`,
      recordId: localRecord.id,
      studentId: localRecord.studentId,
      conflictType,
      localData: localRecord,
      serverData: serverRecord,
      detectedAt: new Date().toISOString(),
      culturalConsiderations: {
        respectTeacherAuthority: this.config.teacherAuthorityEnabled,
        islamicEventPriority: this.config.culturalIntegrationEnabled,
        familyCircumstances: this.shouldConsiderFamilyCircumstances(localRecord, serverRecord),
      },
    };

    await this.saveConflict(conflict);
    return conflict;
  }

  private determineConflictType(
    localRecord: AttendanceRecord,
    serverRecord: any
  ): AttendanceConflict['conflictType'] {
    if (localRecord.status !== serverRecord.status) {
      return 'status_mismatch';
    }
    
    if (Math.abs(new Date(localRecord.timeMarked).getTime() - new Date(serverRecord.time_marked).getTime()) > 300000) {
      return 'timing_conflict';
    }
    
    if (localRecord.teacherId !== serverRecord.teacher_id) {
      return 'teacher_override';
    }

    return 'duplicate_marking';
  }

  private async resolveConflictAutomatically(conflict: AttendanceConflict): Promise<void> {
    let strategy: ConflictResolution['strategy'] = 'latest_timestamp';
    const culturalFactors: string[] = [];

    // Apply cultural considerations
    if (conflict.culturalConsiderations.respectTeacherAuthority) {
      strategy = 'teacher_authority';
      culturalFactors.push('Teacher authority respected');
    }

    if (conflict.culturalConsiderations.islamicEventPriority) {
      // If one record mentions Islamic event, prioritize it
      const localHasIslamic = conflict.localData.status === 'islamic_event' || 
        conflict.localData.notes?.includes('prayer') ||
        conflict.localData.notes?.includes('Islamic');
      
      const serverHasIslamic = conflict.serverData.status === 'islamic_event' ||
        conflict.serverData.notes?.includes('prayer') ||
        conflict.serverData.notes?.includes('Islamic');

      if (localHasIslamic || serverHasIslamic) {
        strategy = 'status_priority';
        culturalFactors.push('Islamic event consideration');
      }
    }

    const resolution = await this.applyResolutionStrategy(conflict, strategy, culturalFactors);
    
    conflict.resolution = resolution;
    conflict.resolvedAt = new Date().toISOString();
    
    await this.saveConflict(conflict);
    this.emit('conflict_resolved', conflict);
  }

  private async applyResolutionStrategy(
    conflict: AttendanceConflict,
    strategy: ConflictResolution['strategy'],
    culturalFactors: string[]
  ): Promise<ConflictResolution> {
    let finalData: Partial<AttendanceRecord>;
    let reasoning: string;

    switch (strategy) {
      case 'teacher_authority':
        // Prioritize the record from the higher-authority teacher
        const localTeacherRank = await this.getTeacherAuthorityRank(conflict.localData.teacherId!);
        const serverTeacherRank = await this.getTeacherAuthorityRank(conflict.serverData.teacher_id);
        
        if (localTeacherRank > serverTeacherRank) {
          finalData = conflict.localData;
          reasoning = 'Local teacher has higher authority rank';
        } else {
          finalData = conflict.serverData;
          reasoning = 'Server teacher has higher authority rank';
        }
        break;

      case 'status_priority':
        // Prioritize certain statuses over others
        const statusPriority = {
          'islamic_event': 5,
          'family_emergency': 4,
          'sick': 3,
          'excused': 2,
          'late': 1,
          'absent': 1,
          'present': 0,
        };

        const localPriority = statusPriority[conflict.localData.status as AttendanceStatus] || 0;
        const serverPriority = statusPriority[conflict.serverData.status as AttendanceStatus] || 0;

        if (localPriority > serverPriority) {
          finalData = conflict.localData;
          reasoning = 'Local status has higher priority';
        } else {
          finalData = conflict.serverData;
          reasoning = 'Server status has higher priority';
        }
        break;

      case 'latest_timestamp':
      default:
        const localTime = new Date(conflict.localData.timeMarked!).getTime();
        const serverTime = new Date(conflict.serverData.time_marked).getTime();

        if (localTime > serverTime) {
          finalData = conflict.localData;
          reasoning = 'Local record has later timestamp';
        } else {
          finalData = conflict.serverData;
          reasoning = 'Server record has later timestamp';
        }
        break;
    }

    return {
      strategy,
      resolvedBy: 'system',
      finalData,
      reasoning,
      culturalFactors,
    };
  }

  // Synchronization Management
  private startSyncTimer(): void {
    this.syncTimer = setInterval(async () => {
      if (this.isOnline && this.pendingRecords.size > 0) {
        await this.processPendingSync();
      }
    }, this.config.syncInterval);
  }

  private async processPendingSync(): Promise<void> {
    const batch = Array.from(this.pendingRecords.values()).slice(0, this.config.batchSize);
    
    for (const record of batch) {
      try {
        const result = await this.syncRecord(record);
        
        if (result.success) {
          this.pendingRecords.delete(record.id);
          record.syncStatus = 'synced';
          this.emit('record_synced', record);
        } else {
          record.syncStatus = 'sync_failed';
          this.emit('sync_failed', { record, error: result.error });
        }
      } catch (error) {
        console.error('Sync error for record:', record.id, error);
        record.syncStatus = 'sync_failed';
      }
    }

    await this.savePendingRecords();
  }

  private async syncRecord(record: AttendanceRecord): Promise<{ success: boolean; error?: string }> {
    try {
      // This would sync with Supabase
      // For now, we'll simulate the sync
      console.log('Syncing attendance record:', record.id);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sync failed' 
      };
    }
  }

  // Storage Management
  private async storePendingRecord(record: AttendanceRecord): Promise<void> {
    this.pendingRecords.set(record.id, record);
    await this.savePendingRecords();
  }

  private async loadPendingRecords(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('attendance_pending_records');
      if (stored) {
        const records: AttendanceRecord[] = JSON.parse(stored);
        records.forEach(record => {
          this.pendingRecords.set(record.id, record);
        });
      }
    } catch (error) {
      console.error('Failed to load pending records:', error);
    }
  }

  private async savePendingRecords(): Promise<void> {
    try {
      const records = Array.from(this.pendingRecords.values());
      await AsyncStorage.setItem('attendance_pending_records', JSON.stringify(records));
    } catch (error) {
      console.error('Failed to save pending records:', error);
    }
  }

  private async loadConflicts(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('attendance_conflicts');
      if (stored) {
        const conflicts: AttendanceConflict[] = JSON.parse(stored);
        conflicts.forEach(conflict => {
          this.conflicts.set(conflict.id, conflict);
        });
      }
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  }

  private async saveConflict(conflict: AttendanceConflict): Promise<void> {
    try {
      this.conflicts.set(conflict.id, conflict);
      const conflicts = Array.from(this.conflicts.values());
      await AsyncStorage.setItem('attendance_conflicts', JSON.stringify(conflicts));
    } catch (error) {
      console.error('Failed to save conflict:', error);
    }
  }

  // Helper Methods
  private async getCurrentTeacherId(): Promise<string> {
    // This would get the current user's teacher ID
    return 'current_teacher_id';
  }

  private async getOrganizationId(): Promise<string> {
    // This would get the organization ID
    return 'organization_id';
  }

  private async getStudentInfo(studentId: string): Promise<{ name: string } | null> {
    // This would fetch student info
    return { name: 'Student Name' };
  }

  private async getClassInfo(classId: string): Promise<{ name: string } | null> {
    // This would fetch class info
    return { name: 'Class Name' };
  }

  private async getTeacherInfo(teacherId: string): Promise<{ name: string } | null> {
    // This would fetch teacher info
    return { name: 'Teacher Name' };
  }

  private async getTeacherAuthorityRank(teacherId: string): Promise<number> {
    // This would get teacher's authority rank for conflict resolution
    return 1; // Default rank
  }

  private async isIslamicEventDay(date: string): Promise<boolean> {
    // This would check against Islamic calendar
    return false;
  }

  private async isRamadanPeriod(date: string): Promise<boolean> {
    // This would check if date is during Ramadan
    return false;
  }

  private async isPrayerTimeRelated(): Promise<boolean> {
    // This would check if current time is close to prayer time
    return false;
  }

  private shouldConsiderFamilyCircumstances(
    localRecord: AttendanceRecord,
    serverRecord: any
  ): boolean {
    return localRecord.status === 'family_emergency' || 
           serverRecord.status === 'family_emergency' ||
           localRecord.excuseReason?.includes('family') ||
           serverRecord.excuse_reason?.includes('family');
  }

  private async processIncomingAttendance(attendanceData: any): Promise<void> {
    // Process incoming attendance update from real-time subscription
    this.emit('attendance_updated', attendanceData);
  }

  // Public API Methods
  public async getAttendanceSession(classId: string): Promise<AttendanceSession | null> {
    return this.activeSessions.get(classId) || null;
  }

  public async startAttendanceSession(
    classId: string,
    teacherId: string
  ): Promise<AttendanceSession> {
    const session: AttendanceSession = {
      id: `session_${classId}_${Date.now()}`,
      classId,
      teacherId,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toISOString(),
      studentsCount: await this.getClassStudentCount(classId),
      markedCount: 0,
      pendingCount: 0,
      conflictsCount: 0,
      isActive: true,
      offlineCapable: true,
      culturalSettings: {
        prayerTimeAware: this.config.culturalIntegrationEnabled,
        islamicCalendarAware: this.config.culturalIntegrationEnabled,
        familyPrivacyRespected: true,
      },
    };

    this.activeSessions.set(classId, session);
    this.emit('session_started', session);
    
    return session;
  }

  public async endAttendanceSession(classId: string): Promise<void> {
    const session = this.activeSessions.get(classId);
    
    if (session) {
      session.isActive = false;
      session.endTime = new Date().toISOString();
      
      this.emit('session_ended', session);
      this.activeSessions.delete(classId);
    }
  }

  public async getPendingRecords(): Promise<AttendanceRecord[]> {
    return Array.from(this.pendingRecords.values());
  }

  public async getConflicts(): Promise<AttendanceConflict[]> {
    return Array.from(this.conflicts.values()).filter(c => !c.resolvedAt);
  }

  public async resolveConflictManually(
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<void> {
    const conflict = this.conflicts.get(conflictId);
    
    if (conflict) {
      conflict.resolution = resolution;
      conflict.resolvedAt = new Date().toISOString();
      
      await this.saveConflict(conflict);
      this.emit('conflict_resolved', conflict);
    }
  }

  private async getClassStudentCount(classId: string): Promise<number> {
    // This would get the number of students in the class
    return 25; // Default
  }

  // Cleanup
  public async destroy(): Promise<void> {
    if (this.subscriptionId) {
      await this.realtimeService.unsubscribeFromEvents(this.subscriptionId);
    }
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    await this.savePendingRecords();
    
    this.removeAllListeners();
  }
}

// Export factory function
export function createAttendanceSyncService(
  realtimeService: RealtimeSubscriptionsService,
  config: AttendanceSyncConfig
): AttendanceSyncService {
  return new AttendanceSyncService(realtimeService, config);
}