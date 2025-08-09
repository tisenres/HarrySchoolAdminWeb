# Dashboard Architecture

## Overview

The Harry School CRM Dashboard provides real-time insights into key educational metrics, financial performance, and operational activities. Built with Next.js 14+ and Supabase, it delivers instant updates through server-side rendering and efficient caching strategies.

## Core Components

### 1. Statistics Module (`/lib/dashboard/statistics.ts`)

#### Primary Functions

- **`getDashboardStatistics()`**: Fetches core metrics with 60-second cache
  - Total/Active Students
  - Total/Active Teachers  
  - Total/Active Groups
  - Monthly Revenue & Outstanding Payments
  - Recent Enrollments (30-day window)
  - Upcoming Classes (7-day forecast)

- **`getRecentActivity()`**: Returns latest system activities
  - Enrollments
  - Payments
  - Group Creation
  - Teacher Assignments

- **`getEnrollmentTrends()`**: Monthly enrollment data for trend analysis
- **`getRevenueOverview()`**: Financial breakdown by month
- **`getGroupDistribution()`**: Group capacity utilization metrics
- **`getTeacherWorkload()`**: Teacher assignment distribution

### 2. Visual Components

#### Stats Cards (`/components/admin/dashboard/stats-card.tsx`)
- Displays primary metrics with icons
- Supports trend indicators (percentage changes)
- Color-coded by metric type
- Responsive grid layout

#### Enrollment Chart (`/components/admin/dashboard/enrollment-chart.tsx`)
- Line chart visualization using Recharts
- 6-month historical trend
- Interactive tooltips
- Responsive container

#### Revenue Chart (`/components/admin/dashboard/revenue-chart.tsx`)
- Stacked bar chart for financial data
- Collected vs Outstanding breakdown
- Monthly comparison view
- Currency formatting

#### Activity Feed (`/components/admin/dashboard/activity-feed.tsx`)
- Real-time activity stream
- Icon-based activity types
- Relative timestamp display
- Fallback to constructed activities

### 3. Page Component (`/app/[locale]/(dashboard)/page.tsx`)

Server Component that:
- Fetches all data in parallel using Promise.all
- Renders statistics cards with live data
- Displays interactive charts
- Provides quick action buttons
- Supports internationalization

## Database Schema Integration

### Primary Tables Used

```sql
-- Student metrics
students (id, status, created_at, deleted_at)
student_group_enrollments (student_id, group_id, created_at)

-- Teacher metrics  
teachers (id, status, first_name, last_name)
teacher_group_assignments (teacher_id, group_id)

-- Group metrics
groups (id, name, status, capacity, start_date)

-- Financial metrics
financial_transactions (amount, status, created_at)
payments (amount, student_id, created_at)
outstanding_balances (student_id, balance)

-- Activity tracking
activity_logs (action_type, description, created_at, metadata)
```

## Performance Optimizations

### 1. Caching Strategy
```typescript
unstable_cache(fetchFunction, ['cache-key'], { 
  revalidate: 60 // 1 minute cache
})
```

### 2. Parallel Data Fetching
```typescript
const [stats, activities, trends, revenue] = await Promise.all([
  getDashboardStatistics(),
  getRecentActivity(),
  getEnrollmentTrends(),
  getRevenueOverview()
])
```

### 3. Database Query Optimization
- Use of `count` aggregations
- Selective field queries
- Index utilization on date fields
- Soft delete filtering (`deleted_at IS NULL`)

## Security Considerations

### Row Level Security (RLS)
All queries respect Supabase RLS policies:
- Organization-based data isolation
- Role-based access control
- Soft delete visibility rules

### Data Sanitization
- No direct SQL injection possible (Supabase client)
- Type-safe TypeScript interfaces
- Server-side data fetching only

## Internationalization

Dashboard supports three languages:
- English (default)
- Russian
- Uzbek Latin

Translation keys in `/messages/[locale]/dashboard.json`:
```json
{
  "title": "Dashboard",
  "totalStudents": "Total Students",
  "activeGroups": "Active Groups",
  "totalTeachers": "Teachers",
  "recentActivity": "Recent Activity",
  "quickActions": "Quick Actions"
}
```

## Real-time Updates (Future Enhancement)

### Planned WebSocket Integration
```typescript
// Future implementation
const supabase = createClient()
supabase
  .channel('dashboard-updates')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public' 
  }, handleRealtimeUpdate)
  .subscribe()
```

## Error Handling

### Graceful Degradation
- Fallback to zero values for missing data
- Activity feed constructs from available data
- Chart components handle empty datasets

### Error Boundaries
```typescript
try {
  const data = await fetchData()
  return data
} catch (error) {
  console.error('Dashboard fetch error:', error)
  return defaultValues
}
```

## Monitoring & Analytics

### Key Metrics to Track
- Page load time
- Data fetch latency
- Chart render performance
- Cache hit rates
- Error rates

### Recommended Tools
- Vercel Analytics
- Supabase Dashboard
- Custom OpenTelemetry integration

## Future Enhancements

### Phase 4 Features
1. **Predictive Analytics**
   - Enrollment forecasting
   - Revenue projections
   - Churn prediction

2. **Custom Widgets**
   - User-configurable dashboard
   - Drag-and-drop layout
   - Widget marketplace

3. **Advanced Filtering**
   - Date range selection
   - Department/branch filtering
   - Custom metric builders

4. **Export Capabilities**
   - PDF reports
   - Excel downloads
   - Scheduled email reports

5. **Mobile App Dashboard**
   - React Native implementation
   - Push notifications
   - Offline support

## Testing Strategy

### Unit Tests
```typescript
describe('Dashboard Statistics', () => {
  test('calculates correct student totals', async () => {
    const stats = await getDashboardStatistics()
    expect(stats.totalStudents).toBeGreaterThanOrEqual(0)
  })
})
```

### Integration Tests
- Database connection verification
- Cache invalidation testing
- Chart rendering validation

### E2E Tests
- Full dashboard load test
- Interactive chart testing
- Quick action navigation

## Deployment Checklist

- [ ] Database indexes created
- [ ] RLS policies configured
- [ ] Environment variables set
- [ ] Cache headers configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Backup strategy implemented

## Support & Maintenance

### Common Issues

1. **Slow Dashboard Load**
   - Check database indexes
   - Verify cache configuration
   - Review query performance

2. **Incorrect Statistics**
   - Validate RLS policies
   - Check soft delete filters
   - Verify date calculations

3. **Chart Rendering Issues**
   - Update Recharts library
   - Check data format
   - Validate responsive containers

### Contact
For dashboard-related issues, consult the backend-architect and performance-engineer subagents.