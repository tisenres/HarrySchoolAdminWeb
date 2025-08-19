# Notifications System Documentation

## Overview

The Harry School CRM includes a comprehensive real-time notifications system that provides admin users with instant updates about important events and system changes. The system is built with React, TypeScript, Supabase real-time subscriptions, and shadcn/ui components.

## Architecture

### Core Components

1. **NotificationService** (`src/lib/services/notification-service.ts`)
   - Handles all database operations for notifications
   - Extends BaseService for consistent API patterns
   - Provides methods for CRUD operations, filtering, and statistics

2. **useNotifications Hook** (`src/hooks/use-notifications.ts`)
   - Manages notification state and real-time subscriptions
   - Integrates with React Query for server state management
   - Provides UI state management and action handlers

3. **UI Components** (`src/components/admin/notifications/`)
   - **NotificationBell**: Main bell icon with dropdown trigger
   - **NotificationDropdown**: Dropdown containing notification list and filters
   - **NotificationItem**: Individual notification card component
   - **NotificationModal**: Detailed notification view modal
   - **NotificationSettings**: User preference management page

## Features

### Real-time Updates
- Supabase real-time subscriptions for instant notifications
- Auto-updating unread counts and notification lists
- Live status changes (read/unread, deletion)

### Rich Notification Types
- **System**: Platform updates, maintenance alerts
- **Enrollment**: Student registration and status changes
- **Payment**: Payment reminders and financial alerts
- **Schedule**: Class schedule modifications
- **Achievement**: Academic milestones and celebrations
- **Reminder**: Important date and task reminders
- **Alert**: Urgent notifications requiring immediate attention

### Priority Levels
- **Low**: General informational updates
- **Normal**: Standard notifications (default)
- **High**: Important notifications with visual emphasis
- **Urgent**: Critical alerts with prominent styling

### Advanced Features
- **Smart Filtering**: By type, priority, read status, date range, and search
- **Bulk Actions**: Mark all as read, batch operations
- **Related Entities**: Deep links to students, teachers, groups
- **Sound Notifications**: Optional audio alerts for new notifications
- **Contextual Actions**: Direct access to related records
- **Accessibility**: Full keyboard navigation and screen reader support

## Database Schema

The notifications system uses the existing `notifications` table with the following key fields:

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    role_target TEXT[],
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    action_url TEXT,
    related_student_id UUID,
    related_teacher_id UUID,
    related_group_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    delivery_method TEXT[] DEFAULT '{"in_app"}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);
```

## Implementation Guide

### Basic Usage

```tsx
import { NotificationBell } from '@/components/admin/notifications'

// Add to header or any component
<NotificationBell />
```

### Using the Hook

```tsx
import { useNotifications } from '@/hooks/use-notifications'

function MyComponent() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map(notification => (
        <div key={notification.id}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <button onClick={() => markAsRead(notification.id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  )
}
```

### Creating Notifications Programmatically

```tsx
import { NotificationService } from '@/lib/services/notification-service'

const notificationService = new NotificationService()

// Create a system notification
await notificationService.createSystemNotification(
  'System Maintenance',
  'Scheduled maintenance will occur tonight from 2-4 AM.',
  'high'
)

// Create an enrollment notification
await notificationService.createEnrollmentNotification(
  'New Student Enrolled',
  'John Doe has enrolled in Advanced Mathematics.',
  'student-id-123',
  'group-id-456'
)

// Create a payment notification
await notificationService.createPaymentNotification(
  'Payment Overdue',
  'Payment for Jane Smith is 7 days overdue.',
  'student-id-789',
  'urgent'
)
```

### Custom Notification Component

```tsx
import { NotificationItem } from '@/components/admin/notifications'
import type { NotificationWithRelations } from '@/types/notification'

interface CustomNotificationListProps {
  notifications: NotificationWithRelations[]
}

function CustomNotificationList({ notifications }: CustomNotificationListProps) {
  const handleNotificationClick = (notification: NotificationWithRelations) => {
    // Custom handling logic
    console.log('Clicked:', notification)
  }

  return (
    <div className="space-y-2">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClick={handleNotificationClick}
          onRead={markAsRead}
          onDelete={deleteNotification}
          compact={false}
          showActions={true}
        />
      ))}
    </div>
  )
}
```

## Styling and Theming

The notification components use Tailwind CSS classes and respect the application's design system:

### Color Scheme by Priority
- **Low**: Blue theme (`bg-blue-50`, `border-blue-200`, `text-blue-800`)
- **Normal**: Gray theme (`bg-gray-50`, `border-gray-200`, `text-gray-800`)
- **High**: Orange theme (`bg-orange-50`, `border-orange-200`, `text-orange-800`)
- **Urgent**: Red theme (`bg-red-50`, `border-red-200`, `text-red-800`)

### Customization
All components accept a `className` prop for custom styling:

```tsx
<NotificationBell className="custom-bell-styles" />
<NotificationItem 
  notification={notification}
  className="custom-item-styles"
  compact={true}
/>
```

## Performance Considerations

### Optimization Features
- **React Query Caching**: 30-second stale time for notifications
- **Real-time Subscriptions**: Efficient WebSocket connections
- **Pagination**: Load more functionality for large notification lists
- **Virtualization**: Recommended for lists with 100+ notifications

### Best Practices
1. **Limit Notification Volume**: Implement intelligent batching for bulk events
2. **Clean Up Expired Notifications**: Use the `expires_at` field appropriately
3. **Cache Management**: Invalidate queries strategically on mutations
4. **Error Handling**: Implement fallback UI states for network issues

## Security & Privacy

### Row Level Security (RLS)
- Users can only see notifications targeted to them or their role
- Organization isolation prevents cross-tenant data access
- Soft delete functionality maintains audit trail

### Data Retention
- Notifications can be automatically expired using `expires_at`
- Soft delete allows for data recovery and audit compliance
- Future feature: User-controlled data retention settings

## Accessibility Features

### Keyboard Navigation
- Full keyboard support for bell dropdown
- Arrow key navigation in notification lists
- Escape key to close modals and dropdowns

### Screen Reader Support
- Proper ARIA labels and descriptions
- Semantic HTML structure
- Live regions for dynamic content updates

### Visual Accessibility
- High contrast colors for priority levels
- Clear visual hierarchy and typography
- Responsive design for various screen sizes

## Testing Strategy

### Unit Tests
- Test notification service methods
- Test hook state management
- Test component rendering and interactions

### Integration Tests
- Test real-time subscription functionality
- Test notification creation and delivery
- Test filtering and search functionality

### E2E Tests
- Test complete notification workflows
- Test cross-browser compatibility
- Test accessibility compliance

## Monitoring & Analytics

### Key Metrics
- Notification delivery success rate
- User engagement (read rates, click-through rates)
- Real-time connection stability
- Performance metrics (load times, memory usage)

### Error Tracking
- Failed notification deliveries
- Real-time connection errors
- Database operation failures
- Client-side JavaScript errors

## Future Enhancements

### Planned Features
1. **Email Notifications**: SMTP integration for email delivery
2. **SMS Notifications**: Twilio integration for urgent alerts
3. **Push Notifications**: Browser push notifications
4. **Notification Templates**: Reusable notification templates
5. **Batch Operations**: Advanced bulk actions
6. **Analytics Dashboard**: Notification performance insights
7. **Custom Notification Rules**: User-defined notification triggers

### Technical Improvements
1. **Offline Support**: Service worker integration
2. **Advanced Filtering**: More sophisticated filter options
3. **Notification Scheduling**: Advanced scheduling options
4. **Integration APIs**: Webhook support for external systems
5. **Performance Optimization**: Virtual scrolling for large lists

## Troubleshooting

### Common Issues

#### Notifications Not Appearing
1. Check real-time connection status
2. Verify user permissions and RLS policies
3. Confirm notification targets (user_id or role_target)
4. Check browser console for JavaScript errors

#### Real-time Updates Not Working
1. Verify Supabase real-time is enabled
2. Check network connectivity and WebSocket support
3. Confirm channel subscription configuration
4. Review browser security settings

#### Performance Issues
1. Check notification list size and pagination
2. Review query complexity and indexing
3. Monitor memory usage and component re-renders
4. Consider implementing virtual scrolling

### Debug Tools
```tsx
// Enable debug logging
localStorage.setItem('debug_notifications', 'true')

// Check real-time connection status
console.log(supabase.realtime.channels)

// Monitor notification service calls
window.notificationService = notificationService
```

## Migration Guide

### From Static to Dynamic Notifications
1. Replace static bell icons with `<NotificationBell />`
2. Update notification creation logic to use NotificationService
3. Implement real-time subscriptions in existing components
4. Add notification preferences to user settings

### Database Migration
Run the following migration to ensure proper indexes:

```sql
-- Optimize notification queries
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_role_target ON notifications USING gin(role_target) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC) WHERE deleted_at IS NULL;
```

This documentation provides a comprehensive guide to implementing, customizing, and maintaining the notifications system in the Harry School CRM application.