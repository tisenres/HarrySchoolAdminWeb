# Harry School CRM Backend Documentation

## Overview

This directory contains comprehensive backend and API documentation for the Harry School CRM system. The documentation covers database design, API endpoints, security implementation, and system architecture.

## Documentation Structure

```
docs-backend/
├── README.md                   # This file
├── database/
│   └── schema.md              # Complete database schema documentation
├── api/
│   ├── overview.md            # API architecture and common patterns
│   ├── openapi.yaml           # OpenAPI 3.0 specification
│   └── teachers/
│       └── endpoints.md       # Detailed Teachers API documentation
├── backend/
│   └── architecture.md       # Backend system architecture
└── security/
    └── (future security docs)
```

## Quick Start

### For Developers

1. **API Reference**: Start with [API Overview](./api/overview.md) for authentication and common patterns
2. **Database Schema**: Review [Database Schema](./database/schema.md) for data model understanding
3. **System Architecture**: Read [Backend Architecture](./backend/architecture.md) for system design

### For API Consumers

1. **OpenAPI Spec**: Use [openapi.yaml](./api/openapi.yaml) with tools like Swagger UI or Postman
2. **Authentication**: All endpoints require JWT tokens from Supabase Auth
3. **Base URLs**:
   - Development: `http://localhost:3000/api`
   - Production: `https://your-domain.vercel.app/api`

## Key Features Documented

### Database Architecture
- **Multi-tenant Design**: Organization-based data isolation
- **Row Level Security**: Comprehensive RLS policies
- **Audit Trail**: Complete activity logging
- **Soft Deletes**: Data preservation with restore capability
- **Performance**: Optimized indexes and query patterns

### API Design
- **RESTful Architecture**: Standard HTTP methods and status codes
- **Authentication**: JWT-based with role-based access control
- **Validation**: Zod schema validation for all inputs
- **Error Handling**: Consistent error responses
- **Pagination**: Standardized pagination across list endpoints

### Core Resources
- **Teachers**: Complete CRUD with professional information
- **Students**: Enrollment management and academic tracking
- **Groups**: Class management with capacity control
- **Finance**: Invoice and payment processing (planned)
- **Settings**: System and organization configuration

## Authentication & Security

### User Roles
- **superadmin**: Full system access across all organizations
- **admin**: Complete CRUD operations within their organization
- **viewer**: Read-only access within their organization

### Security Features
- JWT authentication with Supabase Auth
- Row Level Security for multi-tenant data isolation
- Input validation and sanitization
- Audit logging for all data changes
- Rate limiting on all endpoints

## Development Standards

### Code Quality
- TypeScript strict mode enabled
- Zod schema validation for all inputs
- Comprehensive error handling
- Structured logging and monitoring

### Database Standards
- Consistent naming conventions
- Foreign key constraints
- Proper indexing for performance
- Migration versioning system

### API Standards
- RESTful design principles
- Consistent response formats
- Comprehensive OpenAPI documentation
- Integration test coverage

## Technology Stack

### Backend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (JWT)
- **Validation**: Zod schemas

### Infrastructure
- **Hosting**: Vercel (serverless)
- **Database**: Supabase (managed PostgreSQL)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Caching**: Redis (planned)

## API Endpoints Summary

### Core Resources

| Resource | Base Path | Methods | Description |
|----------|-----------|---------|-------------|
| Teachers | `/api/teachers` | GET, POST | Teacher management |
| Teachers | `/api/teachers/[id]` | GET, PUT, PATCH, DELETE | Individual teacher operations |
| Students | `/api/students` | GET, POST | Student management |
| Students | `/api/students/[id]` | GET, PUT, DELETE | Individual student operations |
| Groups | `/api/groups` | GET, POST | Group management |
| Groups | `/api/groups/[id]` | GET, PATCH, DELETE | Individual group operations |

### System Resources

| Resource | Base Path | Methods | Description |
|----------|-----------|---------|-------------|
| Profile | `/api/profile` | GET, PATCH | User profile management |
| Organizations | `/api/organizations` | GET, PUT | Organization settings |
| Settings | `/api/settings` | GET, PUT | System configuration |

### Future Modules

| Resource | Base Path | Status | Description |
|----------|-----------|---------|-------------|
| Finance | `/api/finance/*` | Planned | Financial management |
| Reports | `/api/reports/*` | Planned | Analytics and reporting |
| Export | `/api/export` | Planned | Data export functionality |
| Import | `/api/import` | Planned | Data import functionality |

## Database Schema Summary

### Core Tables
- **organizations**: Multi-tenant foundation
- **profiles**: User profiles with organization context
- **teachers**: Teacher professional information
- **students**: Student academic and personal data
- **groups**: Learning groups and classes

### Relationship Tables
- **teacher_group_assignments**: Teacher-group many-to-many
- **student_group_enrollments**: Student-group many-to-many with history

### System Tables
- **notifications**: Real-time notification system
- **activity_logs**: Comprehensive audit trail
- **system_settings**: Configuration management

### Finance Tables (Planned)
- **invoices**: Student billing
- **payments**: Payment processing
- **financial_transactions**: General ledger

## Performance Considerations

### Database Optimization
- Full-text search indexes for names and contact information
- Composite indexes for common filter combinations
- Partial indexes for active records
- GIN indexes for JSONB columns

### API Optimization
- Efficient select projections
- Batch operations for related data
- Connection pooling
- Query result caching (planned)

### Rate Limiting
- Standard endpoints: 100 requests/minute
- Authentication endpoints: 10 requests/minute
- Bulk operations: 10 requests/minute

## Monitoring & Observability

### Logging
- Structured JSON logging
- Activity audit trails
- Error tracking with context
- Performance metrics

### Monitoring (Planned)
- API response time tracking
- Database query performance
- Error rate monitoring
- User activity analytics

## Contributing to Documentation

### Documentation Standards
1. Keep documentation current with implementation
2. Include working code examples
3. Provide clear error scenarios
4. Document business rules and validation
5. Update OpenAPI spec with any changes

### Review Process
1. Documentation changes reviewed with code changes
2. Validate examples are functional
3. Ensure consistency across documents
4. Update related documentation

## Support & Maintenance

### Regular Updates
- Schema changes documented in migrations
- API changes reflected in OpenAPI spec
- Architecture updates as system evolves
- Performance optimization documentation

### Troubleshooting
- Common error responses documented
- Database constraint explanations
- Authentication troubleshooting guides
- Performance optimization tips

## Change Log

### Version 1.0.0 (Current)
- ✅ Complete database schema documentation
- ✅ API overview and authentication
- ✅ Teachers API endpoint documentation
- ✅ Backend architecture documentation
- ✅ OpenAPI 3.0 specification
- ✅ Multi-tenant security implementation

### Planned Updates
- [ ] Students API endpoint documentation
- [ ] Groups API endpoint documentation
- [ ] Finance module documentation
- [ ] Security policies documentation
- [ ] Deployment and infrastructure guides
- [ ] Integration testing documentation

---

**Last Updated**: January 2025  
**Documentation Version**: 1.0.0  
**System Version**: Harry School CRM v1.0.0

For questions or updates, please refer to the project's main documentation or contact the development team.