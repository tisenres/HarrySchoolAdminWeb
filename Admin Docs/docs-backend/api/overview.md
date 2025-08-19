# Harry School CRM API Documentation

## Overview

The Harry School CRM API provides RESTful endpoints for managing educational institution data including teachers, students, groups, and financial information. All endpoints are protected with JWT-based authentication and implement organization-based multi-tenancy with Row Level Security.

## Base URL

```
Development: http://localhost:3000/api
Production: https://[your-domain].vercel.app/api
```

## Authentication

### JWT Authentication

All API endpoints require a valid JWT token obtained through Supabase Auth. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Role-Based Access Control

The API implements three user roles:

- **superadmin**: Full system access across all organizations
- **admin**: Full access within their organization
- **viewer**: Read-only access within their organization

### Authentication Middleware

The API uses the `withAuth()` middleware function that provides:

- JWT token validation
- User profile retrieval with organization context
- Role-based authorization
- Automatic error handling for authentication failures

```typescript
// Authentication levels available
withAuth(handler, 'auth')       // Any authenticated user
withAuth(handler, 'admin')      // Admin or superadmin only
withAuth(handler, 'superadmin') // Superadmin only
```

## Response Format

All API endpoints return responses in a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {}, // The requested data
  "message": "Optional success message",
  "pagination": {} // For paginated responses
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Validation errors when applicable
}
```

### Pagination Response

For list endpoints that support pagination:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

## HTTP Status Codes

The API uses standard HTTP status codes:

- **200 OK**: Successful GET, PATCH requests
- **201 Created**: Successful POST requests
- **400 Bad Request**: Validation errors, malformed requests
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

## Common Query Parameters

### Pagination

Most list endpoints support pagination:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort_by`: Field to sort by
- `sort_order`: `asc` or `desc` (default: `desc`)

### Filtering

List endpoints support various filters:

- `query`: Text search across relevant fields
- `status`: Filter by status
- `is_active`: Filter by active status (true/false)

### Examples

```http
GET /api/students?page=2&limit=50&sort_by=full_name&sort_order=asc
GET /api/teachers?query=john&employment_status=active
GET /api/groups?status=active&subject=english&is_active=true
```

## Data Validation

All input data is validated using Zod schemas:

### Phone Number Format
- Must follow Uzbekistan format: `+998XXXXXXXXX`
- Example: `+998901234567`

### Email Format
- Standard email validation
- Optional fields can be empty string or null

### Date Format
- ISO 8601 format: `YYYY-MM-DD`
- Dates cannot be in the future where specified

### Name Validation
- Only letters and spaces allowed
- 1-100 characters length
- Supports Cyrillic and Latin characters

## Organization Multi-tenancy

All resources are scoped to organizations:

- Users can only access data within their organization
- Superadmins can access data across all organizations
- Organization ID is automatically applied to all queries

## Audit Logging

The API automatically logs all significant actions:

- User actions and changes
- Resource modifications
- Authentication events
- Error occurrences

Audit logs include:
- User information (ID, email, name, role)
- Action performed
- Resource affected
- Old and new values for updates
- Timestamp and client information

## Rate Limiting

API endpoints implement rate limiting:

- **Standard endpoints**: 100 requests per minute per user
- **Authentication endpoints**: 10 requests per minute per IP
- **Bulk operations**: 10 requests per minute per user

## Error Handling

The API implements comprehensive error handling:

### Validation Errors (400)

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Authentication Errors (401)

```json
{
  "success": false,
  "error": "Authentication required"
}
```

### Authorization Errors (403)

```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### Resource Not Found (404)

```json
{
  "success": false,
  "error": "Resource not found"
}
```

### Server Errors (500)

```json
{
  "success": false,
  "error": "Internal server error"
}
```

## API Endpoints Overview

### Core Resources

| Endpoint | Methods | Description | Auth Level |
|----------|---------|-------------|------------|
| `/api/teachers` | GET, POST | Teacher management | admin |
| `/api/teachers/[id]` | GET, PUT, PATCH, DELETE | Individual teacher operations | admin |
| `/api/students` | GET, POST | Student management | admin |
| `/api/students/[id]` | GET, PUT, DELETE | Individual student operations | admin |
| `/api/groups` | GET, POST | Group management | admin |
| `/api/groups/[id]` | GET, PATCH, DELETE | Individual group operations | admin |

### Profile & Settings

| Endpoint | Methods | Description | Auth Level |
|----------|---------|-------------|------------|
| `/api/profile` | GET, PATCH | User profile management | auth |
| `/api/organizations` | GET, PUT | Organization management | admin |
| `/api/settings` | GET, PUT | System settings | admin |

### Financial Management

| Endpoint | Methods | Description | Auth Level |
|----------|---------|-------------|------------|
| `/api/finance/invoices` | GET, POST | Invoice management | admin |
| `/api/finance/payments` | GET, POST | Payment processing | admin |
| `/api/finance/reports` | GET | Financial reporting | admin |

### Utility & Reports

| Endpoint | Methods | Description | Auth Level |
|----------|---------|-------------|------------|
| `/api/export` | POST | Data export functionality | admin |
| `/api/import` | POST | Data import functionality | admin |
| `/api/reports` | GET | Various system reports | admin |
| `/api/templates` | GET | Document templates | admin |

## Webhooks & Real-time Updates

The API integrates with Supabase Realtime for live updates:

### Subscription Endpoints

```javascript
// Subscribe to real-time changes
supabase
  .channel('students')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'students' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe()
```

### Available Channels

- `students`: Student record changes
- `teachers`: Teacher record changes
- `groups`: Group record changes
- `notifications`: New notifications

## Development Guidelines

### API Route Structure

```typescript
// Standard API route pattern
export const GET = withAuth(async (request: NextRequest, context) => {
  // Extract query parameters
  const searchParams = request.nextUrl.searchParams
  
  // Validate input
  const validatedData = schema.parse(data)
  
  // Business logic with organization context
  const organizationId = context.profile.organization_id
  
  // Return consistent response
  return NextResponse.json({
    success: true,
    data: result
  })
}, 'admin')
```

### Service Layer Integration

API routes delegate business logic to service classes:

```typescript
const teacherService = new TeacherService()
const teacher = await teacherService.create(validatedData)
```

Service classes handle:
- Database operations
- Business rule validation
- Error handling
- Audit logging

## Testing

### Unit Tests

```bash
npm run test:api
```

### Integration Tests

```bash
npm run test:integration
```

### API Documentation Tests

```bash
npm run test:api-docs
```

## Security Considerations

### Data Protection

- All sensitive data is encrypted at rest
- JWT tokens have configurable expiration
- Rate limiting prevents abuse
- SQL injection protection through parameterized queries

### CORS Configuration

```typescript
// CORS settings for production
const corsOptions = {
  origin: ['https://your-domain.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### Input Sanitization

- All inputs validated with Zod schemas
- XSS prevention through output encoding
- File upload restrictions and scanning

## Performance Optimization

### Database Optimization

- Efficient indexes on frequently queried fields
- Query optimization with select projections
- Connection pooling
- Read replicas for reports

### Caching Strategy

- Redis caching for frequently accessed data
- CDN for static assets
- Browser caching headers
- Query result caching

### Monitoring

- API response time monitoring
- Error rate tracking
- Database query performance
- Rate limit monitoring

## Migration Guide

### Breaking Changes

When breaking changes are introduced:

1. Version the API (`/api/v1/`, `/api/v2/`)
2. Maintain backward compatibility
3. Provide migration documentation
4. Deprecation notices with timelines

### Client Library Updates

Official client libraries are available:

- JavaScript/TypeScript SDK
- React hooks library
- Mobile SDK (React Native)

For detailed endpoint documentation, see:
- [Teachers API](./teachers/endpoints.md)
- [Students API](./students/endpoints.md)
- [Groups API](./groups/endpoints.md)
- [Authentication](./authentication.md)