# Offline-First Patterns for Harry School Teacher App

## Overview

This guide documents the offline-first architecture patterns implemented in the Harry School Teacher App. The system is designed to work seamlessly in educational environments with unreliable connectivity, common in Uzbekistan schools.

## Core Principles

### 1. **Offline-First Mindset**
- All critical features work without internet connection
- Online connectivity enhances experience but isn't required
- Data is cached locally for immediate access
- Sync happens intelligently when connection is available

### 2. **Priority-Based Sync**
- **High Priority**: Today's attendance, urgent notifications
- **Medium Priority**: Performance records, notes from this week
- **Low Priority**: Historical data, statistical reports

### 3. **Conflict Resolution Strategy**
- **Attendance**: Last marked status wins (teacher override)
- **Performance**: Merge scores and feedback
- **Notes**: Overwrite with latest content

## Architecture Components

### Data Storage Layer

```typescript
// Local Storage Stack
├── AsyncStorage (React Native)
│   ├── Queue Management (Pending sync items)
│   ├── Cache Management (Recent data)
│   └── Settings & Preferences
├── Memory Cache Service
│   ├── TTL-based invalidation
│   ├── Teacher-specific caching
│   └── Multi-layer cache structure
└── Offline Queue Service
    ├── Priority-based queuing
    ├── Retry mechanisms
    └── Conflict resolution
```

### Network Layer

```typescript
// Network Management
├── NetInfo (Connection monitoring)
├── Supabase (Online database)
├── Intelligent Sync Service
└── Background Sync (when available)
```

## Implementation Patterns

### 1. Offline Queue Pattern

```typescript
// Add to offline queue with priority
await offlineQueueService.addToQueue(
  'attendance',
  attendanceRecord,
  'high', // Priority for attendance data
  { teacherId, groupId, date }
);

// Queue automatically syncs when online
// Handles retries and conflicts
```

**Benefits:**
- Ensures no data loss during offline periods
- Intelligent retry mechanisms
- Priority-based sync ordering

### 2. Cache-First Data Access

```typescript
// Always check cache first
const getCachedData = async (key: string) => {
  // 1. Check memory cache (fastest)
  let data = await memoryCache.get(key);
  if (data) return data;
  
  // 2. Check AsyncStorage (medium speed)
  data = await AsyncStorage.getItem(key);
  if (data) {
    // Update memory cache for next access
    await memoryCache.set(key, JSON.parse(data));
    return JSON.parse(data);
  }
  
  // 3. Fetch from network (slowest, if online)
  if (isOnline) {
    data = await fetchFromNetwork(key);
    // Cache for future use
    await AsyncStorage.setItem(key, JSON.stringify(data));
    await memoryCache.set(key, data);
  }
  
  return data;
};
```

### 3. Optimistic Updates

```typescript
// Update UI immediately, sync later
const markAttendance = async (studentId: string, status: string) => {
  // 1. Update local state immediately
  setStudentStatus(studentId, status);
  
  // 2. Save to local storage
  await saveToLocalStorage(studentId, status);
  
  // 3. Add to sync queue
  await offlineQueueService.addToQueue('attendance', {
    studentId,
    status,
    timestamp: Date.now()
  }, 'high');
  
  // 4. Show success feedback to user
  showSuccessMessage('Attendance marked');
};
```

### 4. Smart Sync Strategies

```typescript
// Sync priority order
const syncPriorities = {
  immediate: [
    'today_attendance',
    'urgent_notifications'
  ],
  high: [
    'this_week_attendance', 
    'student_performance',
    'teacher_notes'
  ],
  medium: [
    'last_month_data',
    'group_statistics'
  ],
  low: [
    'historical_reports',
    'archived_data'
  ]
};
```

## Data Models

### Offline Queue Record

```typescript
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
  validationStatus: 'valid' | 'invalid' | 'warning';
  metadata?: {
    teacherId?: string;
    groupId?: string;
    date?: string;
  };
}
```

### Attendance Cache Structure

```typescript
interface AttendanceCache {
  // Today's data (highest priority)
  today: {
    [groupId: string]: {
      students: StudentAttendance[];
      lastUpdated: number;
      synced: boolean;
    }
  };
  
  // Recent data (7 days)
  recent: {
    [date: string]: {
      [groupId: string]: AttendanceStats;
    }
  };
  
  // Historical data (30 days)
  historical: {
    [monthKey: string]: AttendanceHistoryRecord[];
  };
}
```

## Best Practices

### 1. **Data Validation**

```typescript
// Validate data before queuing
const validateAttendanceRecord = (record: any): boolean => {
  return !!(
    record.studentId &&
    record.date &&
    ['present', 'absent', 'late', 'excused'].includes(record.status)
  );
};
```

### 2. **Error Handling**

```typescript
// Graceful degradation
try {
  await syncToServer(data);
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // Add to queue for later sync
    await offlineQueueService.addToQueue('attendance', data, 'high');
    showMessage('Saved locally, will sync when online');
  } else {
    // Log error for debugging
    console.error('Sync error:', error);
    showError('Failed to save attendance');
  }
}
```

### 3. **Memory Management**

```typescript
// Regular cache cleanup
const cleanupOldData = async () => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  // Remove old cache entries
  await memoryCache.removeOlderThan(thirtyDaysAgo);
  
  // Clean up AsyncStorage
  const keys = await AsyncStorage.getAllKeys();
  const oldKeys = keys.filter(key => 
    key.includes('cache_') && 
    isOlderThan(key, thirtyDaysAgo)
  );
  
  await AsyncStorage.multiRemove(oldKeys);
};
```

## Performance Optimizations

### 1. **Batch Operations**

```typescript
// Process multiple records efficiently
const batchSyncAttendance = async (records: AttendanceRecord[]) => {
  const batchSize = 100;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await OptimizedAttendanceQueries.bulkUpsertAttendance(batch);
  }
};
```

### 2. **Database Indexing**

```sql
-- Optimized indexes for common queries
CREATE INDEX idx_student_attendance_class_date 
ON student_attendance(class_id, session_date);

CREATE INDEX idx_student_attendance_recent 
ON student_attendance(student_id, session_date DESC, attendance_status);
```

### 3. **Lazy Loading**

```typescript
// Load data on demand
const loadAttendanceHistory = async (page: number = 0) => {
  const cacheKey = `attendance_history_page_${page}`;
  
  let data = await memoryCache.get(cacheKey);
  if (!data) {
    data = await fetchAttendanceHistory(page);
    await memoryCache.set(cacheKey, data, 600); // 10 min TTL
  }
  
  return data;
};
```

## Error Recovery Strategies

### 1. **Connection Recovery**

```typescript
// Auto-retry when connection restored
NetInfo.addEventListener(state => {
  if (state.isConnected && state.isInternetReachable) {
    // Wait a moment for connection to stabilize
    setTimeout(async () => {
      await offlineQueueService.processPendingQueue();
      await syncCriticalData();
    }, 2000);
  }
});
```

### 2. **Data Corruption Recovery**

```typescript
// Validate and repair corrupted data
const repairCorruptedData = async () => {
  try {
    const queueData = await AsyncStorage.getItem('attendance_queue');
    JSON.parse(queueData); // Test if valid JSON
  } catch (error) {
    console.warn('Queue data corrupted, clearing...');
    await AsyncStorage.removeItem('attendance_queue');
    await initializeEmptyQueue();
  }
};
```

### 3. **Conflict Resolution**

```typescript
// Handle server-client conflicts
const resolveAttendanceConflict = (
  serverRecord: AttendanceRecord,
  localRecord: AttendanceRecord
): AttendanceRecord => {
  // For attendance, most recent timestamp wins
  return serverRecord.timestamp > localRecord.timestamp 
    ? serverRecord 
    : localRecord;
};
```

## Monitoring and Analytics

### 1. **Offline Usage Tracking**

```typescript
// Track offline vs online usage
const trackOfflineUsage = () => {
  const stats = {
    offlineTime: getOfflineTime(),
    onlineTime: getOnlineTime(),
    syncAttempts: getSyncAttempts(),
    failedSyncs: getFailedSyncs()
  };
  
  // Log for analytics when online
  logOfflineUsageStats(stats);
};
```

### 2. **Performance Metrics**

```typescript
// Monitor cache hit rates
const trackCachePerformance = () => {
  const metrics = {
    memoryHitRate: memoryCache.getHitRate(),
    storageHitRate: getStorageHitRate(),
    averageResponseTime: getAverageResponseTime()
  };
  
  console.log('Cache Performance:', metrics);
};
```

## Security Considerations

### 1. **Local Data Encryption**
- Sensitive data should be encrypted before storing in AsyncStorage
- Use device keychain/keystore for encryption keys
- Regular security audits of stored data

### 2. **Sync Validation**
- Validate all data before syncing to server
- Implement server-side validation
- Use checksums to detect data corruption

### 3. **Authentication Tokens**
- Store auth tokens securely
- Implement token refresh mechanisms
- Handle expired tokens gracefully

## Testing Strategies

### 1. **Offline Testing**

```typescript
// Mock network conditions
const testOfflineScenarios = () => {
  // Simulate poor connection
  NetInfo.mock({ isConnected: false });
  
  // Test queue functionality
  expect(offlineQueueService.pendingCount).toBeGreaterThan(0);
  
  // Test UI behavior
  expect(screen.getByText('Offline')).toBeVisible();
};
```

### 2. **Sync Testing**

```typescript
// Test sync scenarios
const testSyncScenarios = async () => {
  // Add test data to queue
  await offlineQueueService.addToQueue('attendance', testData, 'high');
  
  // Simulate connection restoration
  NetInfo.mock({ isConnected: true });
  
  // Verify sync completion
  await waitFor(() => {
    expect(offlineQueueService.pendingCount).toBe(0);
  });
};
```

## Deployment Considerations

### 1. **Bundle Size Optimization**
- Use code splitting for offline components
- Minimize AsyncStorage operations
- Compress cached data when possible

### 2. **Initial Data Sync**
- Preload critical data on app install
- Progressive sync for non-critical data
- User-initiated sync options

### 3. **Migration Strategies**
- Handle cache format changes
- Migrate offline queue data between versions
- Graceful fallbacks for unsupported data

## Conclusion

The offline-first architecture ensures the Harry School Teacher App remains functional and responsive even in challenging network conditions. By implementing these patterns, teachers can:

- Mark attendance reliably without internet
- Access student data instantly from cache
- Sync data intelligently when online
- Experience minimal disruption during network outages

This approach significantly improves the user experience in real-world educational environments while maintaining data consistency and reliability.

## Related Documentation

- [AsyncStorage Best Practices](./asyncstorage-patterns.md)
- [Supabase Sync Strategies](./supabase-integration.md)
- [Performance Monitoring](./performance-guide.md)
- [Security Guidelines](./security-practices.md)