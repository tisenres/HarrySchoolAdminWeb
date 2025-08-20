# Harry School Mobile API Package

A comprehensive, mobile-optimized Supabase client and API layer designed specifically for Harry School mobile applications (Student and Teacher apps).

## Features

- **Mobile-Optimized**: Built specifically for React Native with AsyncStorage integration
- **Offline Support**: Intelligent offline queue with conflict resolution
- **Performance Optimization**: Smart caching, query batching, and network-aware strategies
- **Security**: Comprehensive session management, secure token storage, and security monitoring
- **Error Handling**: User-friendly error messages with automatic retry mechanisms
- **Real-time**: Optimized real-time subscriptions with mobile-specific settings
- **TypeScript**: Full TypeScript support with generated database types

## Installation

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

## Quick Start

### 1. Environment Setup

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### 2. Initialize the API

```typescript
import { setupHarrySchoolApi } from '@harry-school/api';

// Initialize with default configuration
const { api, signIn, signOut, getConnectionStatus } = setupHarrySchoolApi();

// Or with custom configuration
const { api } = setupHarrySchoolApi({
  enableOfflineQueue: true,
  enablePerformanceMonitoring: true,
  cacheConfig: {
    defaultTTL: 300000, // 5 minutes
    maxSize: 10 * 1024 * 1024, // 10MB
  }
});
```

### 3. Authentication

```typescript
// Sign in
try {
  const result = await signIn('user@example.com', 'password');
  if (result.error) {
    console.error('Sign in failed:', result.error.message);
  } else {
    console.log('Signed in successfully:', result.data.user);
  }
} catch (error) {
  console.error('Authentication error:', error);
}

// Sign out
await signOut();

// Get current user
const user = await api.getCurrentUser();
```

### 4. Querying Data

```typescript
import { api } from './api-setup';

// Basic query with caching
const getStudents = async () => {
  const result = await api.query(
    (client) => client
      .from('students')
      .select('*')
      .eq('organization_id', organizationId)
      .limit(20),
    {
      enableCache: true,
      ttl: 300000, // Cache for 5 minutes
      priority: 'medium'
    }
  );
  
  if (result.error) {
    console.error('Failed to fetch students:', result.error.message);
    return [];
  }
  
  return result.data || [];
};

// Query with pagination
const getStudentsPaginated = async (page = 1, pageSize = 20) => {
  const offset = (page - 1) * pageSize;
  
  return api.query(
    (client) => client
      .from('students')
      .select('*, groups(*)', { count: 'exact' })
      .range(offset, offset + pageSize - 1)
      .order('name', { ascending: true })
  );
};
```

### 5. Real-time Subscriptions

```typescript
// Subscribe to ranking updates
const unsubscribeRankings = api.subscribe(
  {
    table: 'rankings',
    event: '*',
    filter: `organization_id=eq.${organizationId}`
  },
  (event) => {
    console.log('Ranking update:', event);
    // Update your app state
    updateRankings(event.new);
  }
);

// Subscribe to notifications
const unsubscribeNotifications = api.subscribe(
  {
    table: 'notifications',
    event: 'INSERT',
    filter: `user_id=eq.${userId}`
  },
  (event) => {
    showNotification(event.new);
  }
);

// Clean up subscriptions
unsubscribeRankings();
unsubscribeNotifications();
```

### 6. Offline Support

```typescript
// Check connection status
const connectionStatus = api.getConnectionStatus();
console.log('Connection:', connectionStatus); // 'connected', 'disconnected', etc.

// Listen for connection changes
const unsubscribeConnection = api.onConnectionStatusChange((status) => {
  if (status === 'connected') {
    console.log('Back online! Syncing data...');
  } else if (status === 'disconnected') {
    console.log('Gone offline. Operations will be queued.');
  }
});

// Get offline queue status
const queueStatus = await api.getQueueStatus();
console.log('Pending operations:', queueStatus.totalOperations);
```

## Advanced Usage

### Custom Error Handling

```typescript
import { ErrorHandler, ApiUtils } from '@harry-school/api';

const errorHandler = new ErrorHandler();

const handleApiError = async (error: any) => {
  const userFriendlyError = errorHandler.getUserFriendlyError(error);
  
  // Show user-friendly message
  Alert.alert(userFriendlyError.title, userFriendlyError.message);
  
  // Log detailed error
  await errorHandler.logError('STUDENT_FETCH_ERROR', error, {
    screen: 'StudentList',
    timestamp: Date.now()
  });
  
  // Check if error is retryable
  if (errorHandler.isRetryableError(error)) {
    // Implement retry logic
    setTimeout(() => retryOperation(), 2000);
  }
};
```

### Performance Monitoring

```typescript
import { PerformanceManager } from '@harry-school/api';

const performanceManager = new PerformanceManager();

// Get cache statistics
const cacheStats = performanceManager.getCacheStats();
console.log('Cache hit rate:', cacheStats.hitRate);

// Get performance metrics
const metrics = await performanceManager.getPerformanceMetrics();
console.log('Average query time:', metrics.averageQueryTime);

// Listen to performance events
const unsubscribePerf = performanceManager.addEventListener((metrics) => {
  if (metrics.duration > 2000) {
    console.warn('Slow query detected:', metrics.queryKey);
  }
});
```

### Security Features

```typescript
import { SecurityManager } from '@harry-school/api';

const securityManager = new SecurityManager();

// Validate current session
const isValid = await securityManager.validateCurrentSession();
if (!isValid) {
  // Redirect to login
  router.push('/login');
}

// Get security events
const securityEvents = await securityManager.getSecurityEvents(10);
const criticalEvents = securityEvents.filter(e => e.severity === 'critical');

if (criticalEvents.length > 0) {
  console.warn('Critical security events detected');
}
```

### Student App Specific Examples

```typescript
// Get student dashboard data
const getStudentDashboard = async (studentId: string) => {
  const [student, tasks, rankings, notifications] = await Promise.all([
    // Student profile
    api.query(client => 
      client.from('students').select('*').eq('id', studentId).single()
    ),
    
    // Pending home tasks
    api.query(client =>
      client.from('home_tasks')
        .select('*')
        .eq('student_id', studentId)
        .is('completed_at', null)
        .order('due_date', { ascending: true })
    ),
    
    // Current ranking
    api.query(client =>
      client.from('rankings')
        .select('*')
        .eq('user_id', studentId)
        .eq('user_type', 'student')
        .single()
    ),
    
    // Unread notifications
    api.query(client =>
      client.from('notifications')
        .select('*')
        .eq('user_id', studentId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
    )
  ]);
  
  return {
    student: student.data,
    pendingTasks: tasks.data || [],
    ranking: rankings.data,
    notifications: notifications.data || []
  };
};

// Submit vocabulary practice
const submitVocabularyPractice = async (studentId: string, wordId: string, correct: boolean) => {
  return api.query(async (client) => {
    // Update practice count and mastery level
    const { data: vocab } = await client
      .from('student_vocabulary')
      .select('*')
      .eq('student_id', studentId)
      .eq('word_id', wordId)
      .single();
    
    const newPracticeCount = (vocab?.practice_count || 0) + 1;
    const newMasteryLevel = correct 
      ? Math.min((vocab?.mastery_level || 0) + 1, 3)
      : Math.max((vocab?.mastery_level || 0) - 1, 0);
    
    return client
      .from('student_vocabulary')
      .upsert({
        student_id: studentId,
        word_id: wordId,
        practice_count: newPracticeCount,
        mastery_level: newMasteryLevel,
        last_practiced: new Date().toISOString(),
        is_learned: newMasteryLevel >= 3
      });
  });
};
```

### Teacher App Specific Examples

```typescript
// Mark attendance for a group
const markAttendance = async (groupId: string, date: string, attendance: Array<{
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}>) => {
  return api.query(async (client) => {
    const attendanceRecords = attendance.map(record => ({
      student_id: record.studentId,
      group_id: groupId,
      date,
      status: record.status,
      notes: record.notes,
      organization_id: organizationId,
      created_by: teacherId
    }));
    
    return client.from('attendance').upsert(attendanceRecords);
  });
};

// Get teacher dashboard
const getTeacherDashboard = async (teacherId: string) => {
  return api.query(async (client) => {
    // Get teacher with groups
    const { data: teacher } = await client
      .from('teachers')
      .select(`
        *,
        groups:groups(*)
      `)
      .eq('id', teacherId)
      .single();
    
    if (!teacher) throw new Error('Teacher not found');
    
    // Get today's classes
    const today = new Date().toISOString().split('T')[0];
    const todayClasses = teacher.groups.filter((group: any) => {
      // Check if group has class today based on schedule
      return group.schedule?.some((schedule: any) => 
        schedule.day === new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase()
      );
    });
    
    return {
      teacher,
      todayClasses,
      totalStudents: teacher.groups.reduce((sum: number, group: any) => 
        sum + (group.student_ids?.length || 0), 0
      )
    };
  });
};
```

## Configuration Options

### Cache Configuration

```typescript
const config = {
  cacheConfig: {
    defaultTTL: 300000,        // Default cache time-to-live (5 minutes)
    maxSize: 10 * 1024 * 1024, // Maximum cache size (10MB)
    maxEntries: 1000,          // Maximum number of cached entries
    cleanupInterval: 120000,   // Cache cleanup interval (2 minutes)
  }
};
```

### Retry Configuration

```typescript
const config = {
  retryConfig: {
    maxRetries: 3,    // Maximum retry attempts
    baseDelay: 1000,  // Base delay between retries (1 second)
    maxDelay: 5000,   // Maximum delay between retries (5 seconds)
  }
};
```

### Security Configuration

```typescript
const config = {
  securityConfig: {
    sessionTimeout: 14400000,  // Session timeout (4 hours)
    maxInactiveTime: 1800000,  // Max inactive time (30 minutes)
    maxLoginAttempts: 5,       // Max failed login attempts
  }
};
```

## Error Handling

The API provides comprehensive error handling with user-friendly messages:

```typescript
// Network errors
{
  title: 'Connection Problem',
  message: 'Unable to connect to the server. Please check your internet connection.',
  action: { label: 'Retry', type: 'retry' },
  severity: 'medium'
}

// Authentication errors
{
  title: 'Session Expired',
  message: 'Your session has expired. Please sign in again.',
  action: { label: 'Sign In', type: 'refresh' },
  severity: 'high'
}

// Permission errors
{
  title: 'Access Denied',
  message: 'You don\'t have permission to perform this action.',
  severity: 'medium'
}
```

## Best Practices

### 1. Use Appropriate Cache TTL

```typescript
// Short-lived data (rankings, notifications)
const rankings = await api.query(getRankings, { ttl: 60000 }); // 1 minute

// Medium-lived data (student/teacher profiles)
const profile = await api.query(getProfile, { ttl: 300000 }); // 5 minutes

// Long-lived data (vocabulary words, subjects)
const vocabulary = await api.query(getVocabulary, { ttl: 3600000 }); // 1 hour
```

### 2. Handle Offline States

```typescript
const ConnectionStatus = () => {
  const [status, setStatus] = useState(api.getConnectionStatus());
  
  useEffect(() => {
    return api.onConnectionStatusChange(setStatus);
  }, []);
  
  if (status === 'disconnected') {
    return <OfflineBanner message="You're offline. Changes will sync when reconnected." />;
  }
  
  return null;
};
```

### 3. Implement Proper Error Boundaries

```typescript
const ApiErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      onError={(error) => {
        errorHandler.logError('COMPONENT_ERROR', error);
      }}
      fallback={<ErrorFallbackComponent />}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### 4. Use Query Keys Consistently

```typescript
// Create consistent query keys
const QUERY_KEYS = {
  students: (orgId: string) => `students_${orgId}`,
  studentTasks: (studentId: string) => `tasks_${studentId}`,
  groupAttendance: (groupId: string, date: string) => `attendance_${groupId}_${date}`,
};
```

## Performance Tips

1. **Batch Queries**: Use `Promise.all()` for multiple independent queries
2. **Prefetch Data**: Use `prefetchData()` for anticipated user actions
3. **Optimize Subscriptions**: Only subscribe to data you actually need
4. **Cache Invalidation**: Invalidate cache when data changes
5. **Pagination**: Always paginate large datasets

## Troubleshooting

### Common Issues

**1. "Missing Supabase environment variables"**
```typescript
// Ensure environment variables are set
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**2. "Client not initialized"**
```typescript
// Initialize the client before using the API
const { api } = setupHarrySchoolApi();
// Wait for initialization if needed
await new Promise(resolve => setTimeout(resolve, 100));
```

**3. Cache not working**
```typescript
// Check cache configuration
const cacheStats = performanceManager.getCacheStats();
console.log('Cache entries:', cacheStats.entries);
console.log('Cache hit rate:', cacheStats.hitRate);
```

## Contributing

See the main project's CONTRIBUTING.md for development guidelines.

## License

This package is part of the Harry School project and follows the same license terms.