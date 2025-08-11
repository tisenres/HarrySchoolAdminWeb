# Notifications API Documentation

## Overview

The Notifications API provides comprehensive functionality for managing real-time notifications in the Harry School CRM system. It handles notification creation, delivery, status management, and real-time updates through Supabase.

## Base Service Architecture

All notification operations extend the `BaseService` class, providing:
- Automatic organization isolation
- User authentication and authorization
- Row Level Security (RLS) enforcement
- Audit logging and soft delete functionality

## API Methods

### NotificationService Class

#### Constructor
```typescript
constructor()
```
Initializes the notification service with the 'notifications' table.

#### getNotifications()
```typescript
async getNotifications(
  filters: NotificationFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<{
  data: NotificationWithRelations[]
  count: number
  hasMore: boolean
}>
```

**Description**: Retrieves paginated notifications with optional filtering.

**Parameters**:
- `filters`: Optional filtering criteria
  - `type`: Array of notification types to include
  - `priority`: Array of priority levels to include
  - `is_read`: Boolean to filter by read status
  - `date_from`: ISO date string for start date filter
  - `date_to`: ISO date string for end date filter
  - `search`: Text search across title and message
- `page`: Page number for pagination (1-based)
- `limit`: Number of notifications per page

**Returns**: Object containing notifications array, total count, and hasMore flag.

**Example**:
```typescript
const { data, count, hasMore } = await notificationService.getNotifications({
  type: ['enrollment', 'payment'],
  is_read: false,
  priority: ['high', 'urgent']
}, 1, 10)
```

#### getUnreadCount()
```typescript
async getUnreadCount(): Promise<number>
```

**Description**: Returns the count of unread notifications for the current user.

**Returns**: Number of unread notifications.

**Example**:
```typescript
const unreadCount = await notificationService.getUnreadCount()
```

#### getStats()
```typescript
async getStats(): Promise<NotificationStats>
```

**Description**: Returns comprehensive statistics about notifications.

**Returns**: Object containing:
- `total_count`: Total number of notifications
- `unread_count`: Number of unread notifications
- `by_type`: Count breakdown by notification type
- `by_priority`: Count breakdown by priority level

**Example**:
```typescript
const stats = await notificationService.getStats()
console.log(`Total: ${stats.total_count}, Unread: ${stats.unread_count}`)
```

#### createNotification()
```typescript
async createNotification(request: CreateNotificationRequest): Promise<Tables<'notifications'>>
```

**Description**: Creates a new notification.

**Parameters**:
- `request`: Notification creation request object
  - `type`: Notification type (required)
  - `title`: Notification title (required)
  - `message`: Notification message (required)
  - `priority`: Priority level (optional, defaults to 'normal')
  - `action_url`: Optional URL for action button
  - `user_id`: Target specific user (optional)
  - `role_target`: Target specific roles (optional)
  - `related_student_id`: Link to student record (optional)
  - `related_teacher_id`: Link to teacher record (optional)
  - `related_group_id`: Link to group record (optional)
  - `scheduled_for`: Schedule notification for future delivery (optional)
  - `expires_at`: Expiration timestamp (optional)
  - `metadata`: Additional data (optional)

**Returns**: Created notification object.

**Example**:
```typescript
const notification = await notificationService.createNotification({
  type: 'enrollment',
  title: 'New Student Enrolled',
  message: 'John Doe has been enrolled in Mathematics Group A',
  priority: 'normal',
  related_student_id: 'student-uuid',
  related_group_id: 'group-uuid',
  role_target: ['admin', 'superadmin']
})
```

#### markAsRead()
```typescript
async markAsRead(notificationId: string): Promise<Tables<'notifications'>>
```

**Description**: Marks a notification as read.

**Parameters**:
- `notificationId`: UUID of the notification

**Returns**: Updated notification object.

**Example**:
```typescript
await notificationService.markAsRead('notification-uuid')
```

#### markAsUnread()
```typescript
async markAsUnread(notificationId: string): Promise<Tables<'notifications'>>
```

**Description**: Marks a notification as unread.

**Parameters**:
- `notificationId`: UUID of the notification

**Returns**: Updated notification object.

#### markAllAsRead()
```typescript
async markAllAsRead(): Promise<number>
```

**Description**: Marks all notifications as read for the current user.

**Returns**: Number of notifications marked as read.

#### deleteNotification()
```typescript
async deleteNotification(notificationId: string): Promise<Tables<'notifications'>>
```

**Description**: Soft deletes a notification.

**Parameters**:
- `notificationId`: UUID of the notification

**Returns**: Deleted notification object.

#### getNotificationById()
```typescript
async getNotificationById(notificationId: string): Promise<NotificationWithRelations | null>
```

**Description**: Retrieves a single notification by ID with related entity data.

**Parameters**:
- `notificationId`: UUID of the notification

**Returns**: Notification object with relations, or null if not found.

### Convenience Methods

#### createSystemNotification()
```typescript
async createSystemNotification(
  title: string,
  message: string,
  priority: NotificationPriority = 'normal',
  metadata?: Record<string, any>
): Promise<Tables<'notifications'>>
```

**Description**: Creates a system notification targeted at all admins.

**Example**:
```typescript
await notificationService.createSystemNotification(
  'System Maintenance',
  'Scheduled maintenance tonight from 2-4 AM',
  'high',
  { maintenance_window: '2024-01-01T02:00:00Z' }
)
```

#### createEnrollmentNotification()
```typescript
async createEnrollmentNotification(
  title: string,
  message: string,
  studentId: string,
  groupId?: string,
  priority: NotificationPriority = 'normal'
): Promise<Tables<'notifications'>>
```

**Description**: Creates an enrollment-related notification.

**Example**:
```typescript
await notificationService.createEnrollmentNotification(
  'New Enrollment',
  'Student enrolled in Advanced Mathematics',
  'student-uuid',
  'group-uuid',
  'normal'
)
```

#### createPaymentNotification()
```typescript
async createPaymentNotification(
  title: string,
  message: string,
  studentId: string,
  priority: NotificationPriority = 'high'
): Promise<Tables<'notifications'>>
```

**Description**: Creates a payment-related notification.

**Example**:
```typescript
await notificationService.createPaymentNotification(
  'Payment Overdue',
  'Student payment is 5 days overdue',
  'student-uuid',
  'urgent'
)
```

## Real-time Subscriptions

### Supabase Real-time Channel

The notification system uses Supabase real-time subscriptions to provide instant updates:

```typescript
const channel = supabase
  .channel('notifications_channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'notifications'
    },
    (payload) => {
      handleRealtimeUpdate(payload)
    }
  )
  .subscribe()
```

### Event Types

- **INSERT**: New notification created
- **UPDATE**: Notification status changed (read/unread)
- **DELETE**: Notification deleted

### Payload Structure

```typescript
interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  old?: NotificationRecord
  new?: NotificationRecord
  schema: 'public'
  table: 'notifications'
}
```

## Data Types

### NotificationWithRelations
```typescript
interface NotificationWithRelations extends NotificationRow {
  related_student?: {
    id: string
    full_name: string
    student_id: string | null
  }
  related_teacher?: {
    id: string
    full_name: string
    employee_id: string | null
  }
  related_group?: {
    id: string
    name: string
    group_code: string | null
  }
}
```

### NotificationFilters
```typescript
interface NotificationFilters {
  type?: NotificationType[]
  priority?: NotificationPriority[]
  is_read?: boolean
  date_from?: string
  date_to?: string
  search?: string
}
```

### CreateNotificationRequest
```typescript
interface CreateNotificationRequest {
  type: NotificationType
  title: string
  message: string
  priority?: NotificationPriority
  action_url?: string
  user_id?: string
  role_target?: string[]
  related_student_id?: string
  related_teacher_id?: string
  related_group_id?: string
  scheduled_for?: string
  expires_at?: string
  metadata?: Record<string, any>
}
```

### NotificationStats
```typescript
interface NotificationStats {
  total_count: number
  unread_count: number
  by_type: Record<NotificationType, number>
  by_priority: Record<NotificationPriority, number>
}
```

## Error Handling

### Common Error Patterns

#### Authentication Errors
```typescript
try {
  await notificationService.getNotifications()
} catch (error) {
  if (error.message === 'User not authenticated') {
    // Redirect to login
  }
}
```

#### Permission Errors
```typescript
try {
  await notificationService.createSystemNotification(title, message)
} catch (error) {
  if (error.message === 'Insufficient permissions') {
    // Show permission error
  }
}
```

#### Validation Errors
```typescript
try {
  await notificationService.createNotification(request)
} catch (error) {
  if (error.message.includes('validation')) {
    // Handle validation error
  }
}
```

## Security Considerations

### Row Level Security (RLS)

All notifications are protected by RLS policies:

1. **Read Access**: Users can only read notifications where:
   - `user_id` matches their user ID, OR
   - Their role is included in `role_target`

2. **Write Access**: Users can create notifications if:
   - They have admin or superadmin role
   - The notification targets their organization

3. **Update Access**: Users can update notifications if:
   - They are the target recipient (for read status)
   - They have admin permissions (for other fields)

### Data Validation

- All input is validated against TypeScript interfaces
- SQL injection protection through parameterized queries
- XSS protection through proper escaping

### Rate Limiting

Consider implementing rate limiting for notification creation:

```typescript
// Example rate limiting logic
const rateLimitKey = `notifications:${userId}:${Date.now()}`
const requestCount = await redis.incr(rateLimitKey)
if (requestCount > 100) {
  throw new Error('Rate limit exceeded')
}
```

## Performance Optimization

### Database Indexes

Ensure these indexes exist for optimal performance:

```sql
-- Primary query patterns
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_role_target ON notifications USING gin(role_target) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_type_priority ON notifications(type, priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL AND deleted_at IS NULL;

-- Related entity lookups
CREATE INDEX idx_notifications_related_student ON notifications(related_student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_related_teacher ON notifications(related_teacher_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_related_group ON notifications(related_group_id) WHERE deleted_at IS NULL;
```

### Caching Strategy

- Use React Query for client-side caching
- Set appropriate stale times for different data types
- Implement cache invalidation on mutations

```typescript
// Example caching configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds for notifications
      cacheTime: 300000, // 5 minutes in cache
    },
  },
})
```

### Pagination Best Practices

- Use cursor-based pagination for large datasets
- Implement virtual scrolling for UI performance
- Consider infinite scroll for better UX

## Integration Examples

### Webhook Integration
```typescript
// Example: Create notification from webhook
export async function POST(request: Request) {
  const payload = await request.json()
  
  await notificationService.createNotification({
    type: 'system',
    title: payload.title,
    message: payload.message,
    role_target: ['admin'],
    metadata: { source: 'webhook', ...payload.metadata }
  })
  
  return Response.json({ success: true })
}
```

### Background Job Integration
```typescript
// Example: Process scheduled notifications
export async function processScheduledNotifications() {
  const scheduledNotifications = await supabase
    .from('notifications')
    .select('*')
    .lte('scheduled_for', new Date().toISOString())
    .is('delivered_at', null)
  
  for (const notification of scheduledNotifications.data || []) {
    // Process delivery logic
    await deliverNotification(notification)
  }
}
```

This API documentation provides comprehensive coverage of the notification system's backend functionality, ensuring developers can effectively implement and maintain the notification features.