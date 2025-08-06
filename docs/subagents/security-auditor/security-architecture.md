# Harry School CRM Security Architecture

## Overview
Comprehensive security framework for educational data protection with admin-only access, multi-tenant isolation, and compliance with educational privacy standards.

## Authentication Framework

### Admin-Only Access Model
- **No Self-Registration**: All users created by superadmin invitation
- **Supabase Auth Integration**: Custom claims for role management
- **Session Security**: 24-hour tokens with refresh rotation
- **MFA Implementation**: TOTP-based two-factor authentication

### Role-Based Access Control
```sql
-- User roles enum
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'viewer');

-- Custom claims structure
{
  "role": "admin",
  "org_id": "uuid",
  "permissions": ["read_students", "write_teachers", "manage_groups"]
}
```

## Authorization Matrix

| Resource | Superadmin | Admin | Viewer |
|----------|------------|-------|--------|
| Organizations | CRUD | Read Own | Read Own |
| Teachers | CRUD All | CRUD Own Org | Read Own Org |
| Students | CRUD All | CRUD Own Org | Read Own Org |
| Groups | CRUD All | CRUD Own Org | Read Own Org |
| Users | CRUD All | Read Own Org | Read Own |

## Data Protection & Privacy

### Educational Data Compliance
- **COPPA Compliance**: Under-13 student data protection
- **FERPA Considerations**: Educational records privacy
- **Uzbekistan Data Laws**: Local regulatory compliance
- **GDPR Alignment**: EU citizen data protection

### Encryption Strategy
- **Data at Rest**: AES-256 encryption via Supabase
- **Data in Transit**: TLS 1.3 for all communications
- **PII Hashing**: bcrypt for passwords, SHA-256 for sensitive IDs
- **File Encryption**: Client-side encryption for uploaded documents

### Privacy Controls
```sql
-- Anonymization function for archived students
CREATE FUNCTION anonymize_student_data(student_id UUID) 
RETURNS VOID AS $$
BEGIN
  UPDATE students SET
    first_name = 'Anonymous',
    last_name = 'Student',
    phone = '***-***-****',
    email = 'anonymous@example.com'
  WHERE id = student_id AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
```

## Input Validation & Security

### Validation Strategy
```typescript
// Comprehensive Zod schemas for all entities
export const TeacherSchema = z.object({
  first_name: z.string().min(1).max(100).regex(/^[a-zA-Zа-яёА-ЯЁ\s]+$/),
  phone: z.string().regex(/^\+998\d{9}$/).optional(),
  email: z.string().email().max(255),
  // Additional validation rules
});
```

### SQL Injection Prevention
- **Parameterized Queries**: All database interactions
- **Supabase RLS**: Row-level security as primary defense
- **Input Sanitization**: HTML and script tag removal
- **Prepared Statements**: No dynamic SQL construction

### XSS Protection
- **Content Security Policy**: Strict CSP headers
- **Output Encoding**: All user data properly escaped
- **DOM Purification**: DOMPurify for rich text content
- **File Upload Validation**: Whitelist-based file type validation

## Network & Infrastructure Security

### API Security
```typescript
// Rate limiting configuration
export const rateLimits = {
  auth: { requests: 5, window: '1m' },
  search: { requests: 100, window: '1m' },
  crud: { requests: 50, window: '1m' },
  bulk: { requests: 10, window: '5m' }
};
```

### Environment Security
- **Secrets Management**: Vercel environment variables
- **Database Security**: Connection string encryption
- **API Key Protection**: Service role key access restrictions
- **CORS Configuration**: Strict origin validation

## Monitoring & Incident Response

### Security Monitoring
```sql
-- Security event logging
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Automated Alerts
- **Failed Login Attempts**: >5 attempts in 15 minutes
- **Privilege Escalation**: Unauthorized role changes
- **Data Access Anomalies**: Unusual bulk data access
- **System Modifications**: Schema or RLS policy changes

## Implementation Checklist

### Phase 1 Security Tasks
- [ ] Implement authentication flows with custom claims
- [ ] Deploy RLS policies with comprehensive testing
- [ ] Set up input validation schemas
- [ ] Configure security headers and CSP
- [ ] Implement rate limiting middleware

### Phase 2 Security Tasks
- [ ] Add MFA for superadmin accounts
- [ ] Implement file upload security validation
- [ ] Set up automated vulnerability scanning
- [ ] Create security testing suite
- [ ] Deploy security monitoring and alerting

### Phase 3 Security Tasks
- [ ] Conduct penetration testing
- [ ] Complete compliance audit
- [ ] Implement advanced threat detection
- [ ] Create incident response playbooks
- [ ] Train administrators on security procedures