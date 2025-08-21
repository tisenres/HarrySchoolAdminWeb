# Attendance Management Offline Patterns Documentation

## Architecture Overview

The Harry School Teacher App implements a comprehensive offline-first attendance management system designed for the unreliable internet connectivity common in Uzbekistan schools (73% experience intermittent access). This documentation outlines the proven patterns and best practices for offline data management in educational environments.

## Core Offline Patterns

### 1. Network State Management Pattern

```typescript
// Network detection using @react-native-community/netinfo
import NetInfo from '@react-native-community/netinfo';

class NetworkManager {
  private isOnline = true;
  private callbacks: ((isOnline: boolean) => void)[] = [];

  constructor() {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      // Notify callbacks of network state change
      this.callbacks.forEach(callback => callback(this.isOnline));
      
      // Auto-sync when network returns
      if (wasOffline && this.isOnline) {
        this.triggerAutoSync();
      }
    });
  }

  // Cultural consideration: Respect prayer times for sync operations
  private triggerAutoSync() {
    const currentHour = new Date().getHours();
    const prayerTimes = [5, 12, 15, 18, 20]; // Approximate prayer times
    const isNearPrayerTime = prayerTimes.some(time => Math.abs(currentHour - time) < 1);
    
    if (!isNearPrayerTime) {
      setTimeout(() => this.startSyncProcess(), 1000);
    } else {
      // Delay sync until after prayer time
      setTimeout(() => this.triggerAutoSync(), 30 * 60 * 1000); // Check again in 30 minutes
    }
  }
}
```

### 2. Offline Queue Management Pattern

```typescript
// Priority-based offline queue with conflict resolution
interface OfflineQueueRecord {
  id: string;
  type: 'attendance' | 'performance' | 'note';
  data: any;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  syncStatus: 'pending' | 'syncing' | 'failed' | 'synced';
  conflictResolution: 'overwrite' | 'merge' | 'skip';
  culturalContext?: {
    prayerTimeConflict?: boolean;
    emergencyFlag?: boolean;
  };
}

class OfflineQueueManager {
  async addToQueue(
    type: 'attendance' | 'performance' | 'note',
    data: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> {
    const record: OfflineQueueRecord = {
      id: uuid(),
      type,
      data,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.getMaxRetries(priority),
      syncStatus: 'pending',
      conflictResolution: this.getConflictResolution(type),
      culturalContext: this.getCulturalContext(data)
    };

    await this.saveRecord(record);
    
    // Immediate sync attempt if online and high priority
    if (this.isOnline && priority === 'high') {
      setTimeout(() => this.processPendingQueue(), 100);
    }

    return record.id;
  }

  private getMaxRetries(priority: 'high' | 'medium' | 'low'): number {
    // Cultural consideration: Emergency attendance (family/medical) gets more retries
    switch (priority) {
      case 'high': return 5;
      case 'medium': return 3;
      case 'low': return 2;
      default: return 3;
    }
  }

  private getCulturalContext(data: any) {
    return {
      prayerTimeConflict: this.isDuringPrayerTime(),
      emergencyFlag: data.status === 'emergency' || data.notes?.includes('family') || data.notes?.includes('medical')
    };
  }
}
```

### 3. Conflict Resolution Pattern

```typescript
// Teacher authority-based conflict resolution for attendance
class ConflictResolutionManager {
  async resolveAttendanceConflict(
    localRecord: AttendanceRecord,
    serverRecord: AttendanceRecord
  ): Promise<AttendanceRecord> {
    // Rule 1: Teacher authority - last teacher marking wins
    if (localRecord.marked_by_teacher && serverRecord.marked_by_teacher) {
      return localRecord.marked_at > serverRecord.marked_at ? localRecord : serverRecord;
    }

    // Rule 2: Teacher overrides student self-marking
    if (localRecord.marked_by_teacher && !serverRecord.marked_by_teacher) {
      return localRecord;
    }

    // Rule 3: Emergency status always takes priority
    if (localRecord.attendance_status === 'emergency') {
      return localRecord;
    }

    // Rule 4: Cultural consideration - family emergencies respected
    if (localRecord.notes?.includes('family emergency') || 
        localRecord.notes?.includes('medical emergency')) {
      return localRecord;
    }

    // Default: Latest timestamp wins
    return localRecord.updated_at > serverRecord.updated_at ? localRecord : serverRecord;
  }
}
```

### 4. Optimistic Updates Pattern

```typescript
// Immediate UI updates with rollback capability
class OptimisticUpdateManager {
  private pendingUpdates = new Map<string, any>();

  async markAttendanceOptimistically(
    studentId: string, 
    status: AttendanceStatus,
    groupId: string,
    date: string
  ) {
    const updateKey = `${studentId}_${date}`;
    const previousState = this.getCurrentState(studentId, date);
    
    // Store for potential rollback
    this.pendingUpdates.set(updateKey, {
      previous: previousState,
      timestamp: Date.now()
    });

    // Update UI immediately
    this.updateUIState(studentId, status);

    try {
      // Add to offline queue
      const queueId = await this.offlineQueue.addToQueue('attendance', {
        student_id: studentId,
        attendance_status: status,
        class_id: groupId,
        session_date: date,
        marked_at: new Date().toISOString(),
        marked_by_teacher: true
      }, 'high');

      // Attempt immediate sync if online
      if (this.networkManager.isOnline) {
        await this.syncManager.syncRecord(queueId);
        this.pendingUpdates.delete(updateKey);
      }
    } catch (error) {
      // Rollback UI on failure
      this.rollbackUpdate(updateKey);
      throw error;
    }
  }

  private rollbackUpdate(updateKey: string) {
    const pending = this.pendingUpdates.get(updateKey);
    if (pending) {
      this.restoreUIState(pending.previous);
      this.pendingUpdates.delete(updateKey);
    }
  }
}
```

### 5. Cultural Adaptation Pattern

```typescript
// Uzbekistan educational context integration
class CulturalAdaptationManager {
  // Islamic calendar integration for attendance context
  getIslamicCalendarContext(date: string) {
    const hijriDate = this.convertToHijri(date);
    const islamicEvents = this.getIslamicEvents(hijriDate);
    
    return {
      hijriDate,
      islamicEvents,
      isRamadan: this.isRamadan(hijriDate),
      prayerTimes: this.getPrayerTimes(date),
      culturalConsiderations: this.getCulturalConsiderations(date)
    };
  }

  // Multilingual error messages for offline scenarios
  getOfflineMessage(language: 'en' | 'ru' | 'uz'): string {
    const messages = {
      'en': 'Working offline. Changes will sync when connection returns.',
      'ru': 'Работаем офлайн. Изменения синхронизируются при восстановлении соединения.',
      'uz': 'Oflayn ishlayapman. O\'zgarishlar aloqa tiklanganida sinxronlashadi.'
    };
    return messages[language];
  }

  // Family communication patterns for attendance notifications
  generateFamilyNotification(
    studentName: string,
    status: AttendanceStatus,
    language: 'en' | 'ru' | 'uz',
    culturalContext: any
  ): string {
    const respectfulGreeting = this.getCulturalGreeting(language);
    const statusMessage = this.getStatusMessage(status, language);
    const culturalClosing = this.getCulturalClosing(language);

    return `${respectfulGreeting}\n\n${statusMessage}\n\nStudent: ${studentName}\nDate: ${new Date().toLocaleDateString()}\n\n${culturalClosing}`;
  }

  private getCulturalGreeting(language: 'en' | 'ru' | 'uz'): string {
    const greetings = {
      'en': 'Peace be upon you. I hope this message finds you and your family in good health.',
      'ru': 'Ассалому алейкум. Надеюсь, это сообщение застанет вас и вашу семью в добром здравии.',
      'uz': 'Assalomu alaykum. Umid qilamanki, bu xabar sizni va oilangizni sog\'lik-omon topadi.'
    };
    return greetings[language];
  }
}
```

### 6. Performance Optimization Pattern

```typescript
// Memory and battery optimization for offline operations
class PerformanceOptimizer {
  private cacheManager = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private syncBatch: any[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  // Intelligent batching to reduce battery usage
  async addToBatch(operation: any) {
    this.syncBatch.push(operation);

    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Batch operations for efficiency
    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, 5000); // 5-second batching window

    // Immediate processing for high-priority items
    if (operation.priority === 'high' || this.syncBatch.length >= 50) {
      this.processBatch();
    }
  }

  // Memory-efficient caching with TTL
  setCache(key: string, data: any, ttlMinutes: number = 10) {
    this.cacheManager.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });

    // Cleanup expired entries periodically
    this.cleanupExpiredCache();
  }

  getCache(key: string): any | null {
    const cached = this.cacheManager.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cacheManager.delete(key);
      return null;
    }

    return cached.data;
  }

  // Background sync with exponential backoff
  async backgroundSync() {
    let retryDelay = 1000; // Start with 1 second
    const maxRetryDelay = 300000; // Max 5 minutes

    while (this.hasPendingOperations()) {
      try {
        await this.syncPendingOperations();
        break; // Success - exit retry loop
      } catch (error) {
        console.warn('Background sync failed, retrying in', retryDelay, 'ms');
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Exponential backoff with jitter
        retryDelay = Math.min(retryDelay * 2 + Math.random() * 1000, maxRetryDelay);
      }
    }
  }
}
```

### 7. Data Validation Pattern

```typescript
// Comprehensive validation for offline data integrity
class OfflineDataValidator {
  validateAttendanceRecord(record: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!record.student_id) errors.push('Student ID is required');
    if (!record.session_date) errors.push('Session date is required');
    if (!record.attendance_status) errors.push('Attendance status is required');

    // Status validation
    const validStatuses = ['present', 'absent', 'late', 'excused', 'emergency'];
    if (record.attendance_status && !validStatuses.includes(record.attendance_status)) {
      errors.push('Invalid attendance status');
    }

    // Date validation
    if (record.session_date) {
      const sessionDate = new Date(record.session_date);
      const today = new Date();
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      if (sessionDate > today) {
        warnings.push('Future date detected - please verify');
      }

      if (sessionDate < oneWeekAgo) {
        warnings.push('Old date detected - please verify');
      }
    }

    // Cultural validation
    if (record.session_date && this.isDuringRamadan(record.session_date)) {
      warnings.push('Ramadan period - consider adjusted schedule');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      severity: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success'
    };
  }

  // Cross-reference validation for consistency
  async validateConsistency(records: AttendanceRecord[]): Promise<ConsistencyReport> {
    const inconsistencies: string[] = [];

    // Check for duplicate entries
    const duplicates = this.findDuplicateEntries(records);
    if (duplicates.length > 0) {
      inconsistencies.push(`Found ${duplicates.length} duplicate entries`);
    }

    // Check for conflicting statuses
    const conflicts = this.findConflictingStatuses(records);
    if (conflicts.length > 0) {
      inconsistencies.push(`Found ${conflicts.length} conflicting status updates`);
    }

    // Check attendance patterns
    const patterns = this.analyzeAttendancePatterns(records);
    if (patterns.suspiciousPatterns.length > 0) {
      inconsistencies.push(`Unusual attendance patterns detected`);
    }

    return {
      isConsistent: inconsistencies.length === 0,
      issues: inconsistencies,
      suggestions: this.generateSuggestions(inconsistencies)
    };
  }
}
```

### 8. Security Pattern for Offline Data

```typescript
// Secure offline storage with encryption
class SecureOfflineStorage {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = this.generateEncryptionKey();
  }

  async secureStore(key: string, data: any): Promise<void> {
    try {
      // Encrypt sensitive data before storing
      const encryptedData = await this.encrypt(JSON.stringify(data));
      
      // Add integrity hash
      const hash = await this.generateHash(encryptedData);
      
      const securePackage = {
        data: encryptedData,
        hash,
        timestamp: Date.now(),
        version: '1.0'
      };

      await AsyncStorage.setItem(key, JSON.stringify(securePackage));
    } catch (error) {
      console.error('Secure storage failed:', error);
      throw new Error('Failed to securely store data');
    }
  }

  async secureRetrieve(key: string): Promise<any | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const securePackage = JSON.parse(stored);
      
      // Verify integrity
      const expectedHash = await this.generateHash(securePackage.data);
      if (expectedHash !== securePackage.hash) {
        console.warn('Data integrity check failed for key:', key);
        return null;
      }

      // Decrypt and return
      const decryptedData = await this.decrypt(securePackage.data);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      return null;
    }
  }

  // FERPA-compliant data sanitization
  sanitizeForOfflineStorage(studentData: any): any {
    return {
      id: studentData.id,
      firstName: studentData.firstName,
      lastInitial: studentData.lastName?.charAt(0) || '',
      attendanceStatus: studentData.attendanceStatus,
      // Remove sensitive information
      // Do not store: full names, addresses, family info, medical data
    };
  }
}
```

## Best Practices Summary

### 1. Network Management
- **Always check network state** before sync operations
- **Implement exponential backoff** for failed sync attempts
- **Respect cultural timing** (prayer times, Ramadan schedules)
- **Use connection quality assessment** for optimal sync timing

### 2. Data Integrity
- **Validate all data** before offline storage
- **Implement conflict resolution** based on teacher authority
- **Use optimistic updates** for immediate UI feedback
- **Maintain audit trails** for all offline operations

### 3. Performance Optimization
- **Batch operations** to reduce battery usage
- **Implement intelligent caching** with TTL management
- **Use memory-efficient storage** patterns
- **Prioritize critical updates** (attendance over notes)

### 4. Cultural Sensitivity
- **Integrate Islamic calendar** for context awareness
- **Provide multilingual support** for error messages
- **Respect family communication** protocols
- **Consider prayer time conflicts** in sync scheduling

### 5. Security & Privacy
- **Encrypt sensitive data** in offline storage
- **Follow FERPA compliance** guidelines
- **Implement data sanitization** for offline scenarios
- **Use integrity checks** for stored data

### 6. Error Handling
- **Graceful degradation** when sync fails
- **Clear user feedback** about offline status
- **Automatic retry mechanisms** with limits
- **Rollback capabilities** for failed optimistic updates

## Implementation Checklist

### Essential Components
- [ ] Network state monitoring with @react-native-community/netinfo
- [ ] Priority-based offline queue with AsyncStorage
- [ ] Conflict resolution algorithm for attendance data
- [ ] Optimistic UI updates with rollback capability
- [ ] Cultural context integration (Islamic calendar, multilingual)
- [ ] Performance optimization (batching, caching, memory management)
- [ ] Data validation and integrity checks
- [ ] Secure offline storage with encryption

### Integration Points
- [ ] Supabase real-time subscriptions for online sync
- [ ] React Native Reanimated for smooth offline indicators
- [ ] Islamic calendar library (Hebcal) for cultural context
- [ ] Haptic feedback for offline confirmation
- [ ] Background app state management for iOS sync issues

### Testing Requirements
- [ ] Network connectivity simulation (airplane mode)
- [ ] Conflict resolution scenarios
- [ ] Performance testing with large datasets (50+ students)
- [ ] Cultural integration validation
- [ ] Security and privacy compliance verification

This offline pattern documentation provides a comprehensive foundation for implementing robust, culturally-sensitive, and performant offline attendance management in educational environments with unreliable connectivity.