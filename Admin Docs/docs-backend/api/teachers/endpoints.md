# Teachers API Endpoints

## Overview

The Teachers API provides complete CRUD operations for managing teacher profiles, including professional information, qualifications, and group assignments.

## Base URL

```
/api/teachers
```

## Authentication

All endpoints require authentication with `admin` or `superadmin` role.

---

## GET /api/teachers

Retrieve a paginated list of teachers with optional filtering and sorting.

### Request

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 20 | Number of items per page (max: 100) |
| `sort_by` | string | 'created_at' | Field to sort by |
| `sort_order` | string | 'desc' | Sort order: 'asc' or 'desc' |
| `query` | string | - | Search across name, email, phone |
| `employment_status` | string | - | Filter by employment status |
| `specializations` | string | - | Comma-separated specializations |
| `hire_date_from` | string | - | Filter by hire date (YYYY-MM-DD) |
| `hire_date_to` | string | - | Filter by hire date (YYYY-MM-DD) |
| `is_active` | boolean | - | Filter by active status |

### Response

**Success (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "organization_id": "org-123",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+998901234567",
      "date_of_birth": "1985-06-15",
      "gender": "male",
      "employee_id": "EMP-001",
      "hire_date": "2023-01-15",
      "employment_status": "active",
      "contract_type": "full_time",
      "salary_amount": 5000000.00,
      "salary_currency": "UZS",
      "qualifications": [
        {
          "id": "qual-1",
          "degree": "Bachelor's",
          "institution": "University of Tashkent",
          "year": 2007,
          "field_of_study": "English Literature"
        }
      ],
      "specializations": ["English", "Literature"],
      "certifications": [],
      "languages_spoken": ["English", "Uzbek", "Russian"],
      "address": {
        "street": "123 Main St",
        "city": "Tashkent",
        "region": "Tashkent",
        "country": "Uzbekistan"
      },
      "emergency_contact": {
        "name": "Jane Doe",
        "relationship": "spouse",
        "phone": "+998901234568"
      },
      "notes": "Excellent teacher with strong communication skills",
      "profile_image_url": null,
      "is_active": true,
      "created_at": "2023-01-15T09:00:00Z",
      "updated_at": "2023-01-15T09:00:00Z",
      "created_by": "user-123",
      "updated_by": "user-123",
      "deleted_at": null,
      "deleted_by": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### Example Request

```bash
curl -X GET "https://api.example.com/api/teachers?query=john&employment_status=active&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## POST /api/teachers

Create a new teacher profile.

### Request

**Method**: `POST`

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_JWT_TOKEN`

**Body**:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+998901234567",
  "date_of_birth": "1985-06-15",
  "gender": "male",
  "employee_id": "EMP-001",
  "hire_date": "2023-01-15",
  "employment_status": "active",
  "contract_type": "full_time",
  "salary_amount": 5000000,
  "salary_currency": "UZS",
  "qualifications": [
    {
      "degree": "Bachelor's Degree",
      "institution": "University of Tashkent",
      "year": 2007,
      "field_of_study": "English Literature"
    }
  ],
  "specializations": ["English", "Literature"],
  "languages_spoken": ["English", "Uzbek", "Russian"],
  "address": {
    "street": "123 Main St",
    "city": "Tashkent",
    "region": "Tashkent",
    "country": "Uzbekistan"
  },
  "emergency_contact": {
    "name": "Jane Doe",
    "relationship": "spouse",
    "phone": "+998901234568",
    "email": "jane.doe@example.com"
  },
  "notes": "Excellent teacher with strong communication skills",
  "is_active": true
}
```

### Response

**Success (201)**:

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "organization_id": "org-123",
    // ... full teacher object as in GET response
  },
  "message": "Teacher created successfully"
}
```

**Validation Error (400)**:

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["first_name"],
      "message": "First name is required"
    }
  ]
}
```

### Example Request

```bash
curl -X POST "https://api.example.com/api/teachers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+998901234567",
    "hire_date": "2023-01-15",
    "specializations": ["English"]
  }'
```

---

## GET /api/teachers/[id]

Retrieve a specific teacher by ID.

### Request

**Method**: `GET`

**Path Parameters**:
- `id` (string, required): Teacher UUID

### Response

**Success (200)**:

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    // ... full teacher object
  }
}
```

**Not Found (404)**:

```json
{
  "success": false,
  "error": "Teacher not found"
}
```

### Example Request

```bash
curl -X GET "https://api.example.com/api/teachers/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## PUT /api/teachers/[id]

Update a teacher profile (full replacement).

### Request

**Method**: `PUT`

**Path Parameters**:
- `id` (string, required): Teacher UUID

**Body**: Same as POST request (all fields required)

### Response

**Success (200)**:

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    // ... updated teacher object
  },
  "message": "Teacher updated successfully"
}
```

---

## PATCH /api/teachers/[id]

Partially update a teacher profile.

### Request

**Method**: `PATCH`

**Path Parameters**:
- `id` (string, required): Teacher UUID

**Body** (partial update):

```json
{
  "employment_status": "on_leave",
  "notes": "Updated notes about the teacher",
  "specializations": ["English", "Literature", "Creative Writing"]
}
```

### Response

**Success (200)**:

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    // ... updated teacher object
  },
  "message": "Teacher updated successfully"
}
```

### Example Request

```bash
curl -X PATCH "https://api.example.com/api/teachers/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "employment_status": "on_leave",
    "notes": "Teacher is on maternity leave"
  }'
```

---

## DELETE /api/teachers/[id]

Soft delete a teacher (marks as deleted but preserves data).

### Request

**Method**: `DELETE`

**Path Parameters**:
- `id` (string, required): Teacher UUID

### Response

**Success (200)**:

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    // ... teacher object with deleted_at timestamp
  },
  "message": "Teacher deleted successfully"
}
```

**Not Found (404)**:

```json
{
  "success": false,
  "error": "Teacher not found"
}
```

### Example Request

```bash
curl -X DELETE "https://api.example.com/api/teachers/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Data Models

### Teacher Object

```typescript
interface Teacher {
  id: string                    // UUID
  organization_id: string       // Organization UUID
  first_name: string           // Required
  last_name: string            // Required
  full_name: string            // Generated field
  email?: string               // Optional
  phone: string                // Required, format: +998XXXXXXXXX
  date_of_birth?: string       // ISO date
  gender?: 'male' | 'female' | 'other'
  employee_id?: string         // Unique within organization
  hire_date: string            // ISO date, required
  employment_status: 'active' | 'inactive' | 'on_leave' | 'terminated'
  contract_type?: 'full_time' | 'part_time' | 'contract' | 'substitute'
  salary_amount?: number       // Decimal
  salary_currency: string      // Default: 'UZS'
  qualifications: Qualification[]
  specializations: string[]    // Subject areas
  certifications: Certification[]
  languages_spoken: string[]
  address?: Address
  emergency_contact?: EmergencyContact
  documents?: Document[]       // File attachments
  notes?: string
  profile_image_url?: string
  is_active: boolean          // Default: true
  created_at: string          // ISO timestamp
  updated_at: string          // ISO timestamp
  created_by: string          // User UUID
  updated_by: string          // User UUID
  deleted_at?: string         // ISO timestamp (soft delete)
  deleted_by?: string         // User UUID
}
```

### Supporting Models

```typescript
interface Qualification {
  id: string
  degree: string
  institution: string
  year: number
  field_of_study?: string
  gpa?: number
  country?: string
}

interface Certification {
  id: string
  name: string
  institution: string
  issue_date: string
  expiry_date?: string
  credential_id?: string
  verification_url?: string
}

interface Address {
  street?: string
  city?: string
  region?: string
  postal_code?: string
  country?: string
}

interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
  address?: Address
}
```

## Business Rules

### Validation Rules

1. **Phone Format**: Must match `+998XXXXXXXXX` pattern
2. **Email**: Must be valid email format when provided
3. **Hire Date**: Cannot be in the future
4. **Employee ID**: Must be unique within organization
5. **Names**: Only letters and spaces, 1-100 characters
6. **Salary**: Must be positive when provided

### Employment Status Transitions

```
active → on_leave → active
active → inactive → active
active → terminated (final)
inactive → terminated (final)
```

### Soft Delete Behavior

- Deleted teachers are not returned in list queries
- Related assignments are also soft deleted
- Data can be restored by setting `deleted_at` to null
- Hard delete requires superadmin privileges

## Error Handling

### Common Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Validation error | Invalid input data |
| 401 | Authentication required | Missing or invalid JWT token |
| 403 | Insufficient permissions | User lacks required role |
| 404 | Teacher not found | Teacher ID not found or soft deleted |
| 409 | Conflict | Duplicate employee_id or email |
| 500 | Internal server error | Unexpected server error |

### Rate Limiting

- **List Operations**: 60 requests per minute
- **Create/Update**: 30 requests per minute
- **Delete Operations**: 10 requests per minute

## Related Endpoints

- [Teacher Groups API](../groups/teacher-assignments.md)
- [Teacher Statistics API](./statistics.md)
- [Activity Logs API](../system/activity-logs.md)