# API Endpoints - Harry School CRM

## API Architecture Overview

The Harry School CRM API is built using Next.js 14+ App Router with RESTful endpoints and real-time subscriptions. All endpoints enforce Row Level Security through Supabase and provide consistent error handling, validation, and response formats.

## API Design Principles

1. **RESTful Design**: Standard HTTP methods with predictable URL patterns
2. **Multi-tenant**: All endpoints are organization-scoped automatically through RLS
3. **Role-based Access**: Enforced at the database level through RLS policies
4. **Performance Optimized**: Pagination, filtering, and search capabilities
5. **Type Safe**: Full TypeScript integration with generated Supabase types
6. **Real-time Ready**: WebSocket subscriptions for live updates

## Authentication & Authorization

### Authentication Headers

All API requests must include authentication headers:

```typescript
// Required headers for authenticated requests
{
  "Authorization": "Bearer <supabase_access_token>",
  "apikey": "<supabase_anon_key>",
  "Content-Type": "application/json"
}
```

### Authentication Endpoints

#### POST /api/auth/login
Admin login with email and password.

```typescript
// Request
{
  "email": "admin@school.uz",
  "password": "secure_password"
}

// Response 200
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@school.uz",
      "role": "admin"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token",
      "expires_at": 1640995200
    },
    "profile": {
      "id": "uuid",
      "organization_id": "uuid",
      "full_name": "Admin User",
      "role": "admin",
      "language_preference": "en"
    }
  }
}

// Response 401 - Invalid credentials
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

#### POST /api/auth/logout
Logout current user session.

```typescript
// Response 200
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/auth/me
Get current user profile information.

```typescript
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "organization_id": "uuid",
    "email": "admin@school.uz",
    "full_name": "Admin User",
    "role": "admin",
    "language_preference": "en",
    "last_login_at": "2024-01-15T10:30:00Z"
  }
}
```

## Organization Management

### GET /api/organizations/current
Get current user's organization details.

```typescript
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Harry School",
    "slug": "harry-school",
    "logo_url": "https://...",
    "address": {
      "street": "123 Education St",
      "city": "Tashkent",
      "country": "Uzbekistan",
      "postal_code": "100000"
    },
    "contact_info": {
      "phone": "+998901234567",
      "email": "info@harryschool.uz",
      "website": "https://harryschool.uz"
    },
    "settings": {
      "default_language": "uz",
      "timezone": "Asia/Tashkent",
      "academic_year_start": "09-01",
      "currency": "UZS"
    }
  }
}
```

### PUT /api/organizations/current
Update current organization (admin only).

```typescript
// Request
{
  "name": "Harry School Updated",
  "contact_info": {
    "phone": "+998901234567",
    "email": "info@harryschool.uz"
  },
  "settings": {
    "default_language": "en",
    "timezone": "Asia/Tashkent"
  }
}

// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Harry School Updated",
    // ... updated organization data
  }
}
```

## Student Management

### GET /api/students
List students with pagination, filtering, and search.

```typescript
// Query Parameters
{
  "page": 1,              // Page number (default: 1)
  "limit": 20,            // Items per page (default: 20, max: 100)
  "search": "john",       // Search in name, phone, email
  "status": "active",     // Filter by enrollment status
  "group_id": "uuid",     // Filter by group enrollment
  "payment_status": "current", // Filter by payment status
  "sort": "full_name",    // Sort field
  "order": "asc"          // Sort order (asc/desc)
}

// Response 200
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "uuid",
        "student_id": "STU001",
        "full_name": "John Smith",
        "first_name": "John",
        "last_name": "Smith",
        "date_of_birth": "2005-03-15",
        "gender": "male",
        "primary_phone": "+998901234567",
        "email": "john.smith@email.uz",
        "enrollment_date": "2024-01-15",
        "enrollment_status": "active",
        "grade_level": "10",
        "payment_status": "current",
        "profile_image_url": "https://...",
        "current_groups": [
          {
            "id": "uuid",
            "name": "Mathematics A1",
            "subject": "Mathematics"
          }
        ],
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8,
      "has_next": true,
      "has_previous": false
    }
  }
}
```

### POST /api/students
Create a new student (admin only).

```typescript
// Request
{
  "first_name": "John",
  "last_name": "Smith",
  "date_of_birth": "2005-03-15",
  "gender": "male",
  "primary_phone": "+998901234567",
  "email": "john.smith@email.uz",
  "enrollment_date": "2024-01-15",
  "grade_level": "10",
  "address": {
    "street": "123 Student St",
    "city": "Tashkent",
    "district": "Yunusabad",
    "postal_code": "100000"
  },
  "parent_guardian_info": [
    {
      "name": "Jane Smith",
      "relationship": "mother",
      "phone": "+998901234568",
      "email": "jane.smith@email.uz",
      "is_primary": true
    }
  ],
  "payment_plan": "monthly",
  "tuition_fee": 500000,
  "notes": "Transferred from previous school"
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "STU001", // Auto-generated
    "full_name": "John Smith",
    // ... complete student data
  }
}

// Response 400 - Validation error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "first_name": ["First name is required"],
      "primary_phone": ["Phone number format is invalid"]
    }
  }
}
```

### GET /api/students/[id]
Get student details by ID.

```typescript
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "STU001",
    "full_name": "John Smith",
    "first_name": "John",
    "last_name": "Smith",
    "date_of_birth": "2005-03-15",
    "gender": "male",
    "nationality": "Uzbek",
    "primary_phone": "+998901234567",
    "secondary_phone": "+998901234568",
    "email": "john.smith@email.uz",
    "address": {
      "street": "123 Student St",
      "city": "Tashkent",
      "district": "Yunusabad",
      "postal_code": "100000"
    },
    "parent_guardian_info": [
      {
        "name": "Jane Smith",
        "relationship": "mother",
        "phone": "+998901234568",
        "email": "jane.smith@email.uz",
        "is_primary": true
      }
    ],
    "enrollment_date": "2024-01-15",
    "enrollment_status": "active",
    "grade_level": "10",
    "payment_plan": "monthly",
    "tuition_fee": 500000,
    "payment_status": "current",
    "profile_image_url": "https://...",
    "documents": [
      {
        "id": "uuid",
        "name": "Birth Certificate",
        "type": "birth_certificate",
        "url": "https://...",
        "uploaded_at": "2024-01-15T10:30:00Z"
      }
    ],
    "group_enrollments": [
      {
        "id": "uuid",
        "group": {
          "id": "uuid",
          "name": "Mathematics A1",
          "subject": "Mathematics",
          "teacher": {
            "id": "uuid",
            "full_name": "Dr. Ahmed Karim"
          }
        },
        "enrollment_date": "2024-01-15",
        "status": "active",
        "attendance_rate": 95.5,
        "progress_notes": "Excellent performance"
      }
    ],
    "notes": "Transferred from previous school",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}

// Response 404 - Student not found
{
  "success": false,
  "error": {
    "code": "STUDENT_NOT_FOUND",
    "message": "Student not found"
  }
}
```

### PUT /api/students/[id]
Update student information (admin only).

```typescript
// Request (partial update supported)
{
  "first_name": "John Updated",
  "primary_phone": "+998901234569",
  "enrollment_status": "active",
  "payment_status": "current",
  "notes": "Updated information"
}

// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    // ... updated student data
  }
}
```

### DELETE /api/students/[id]
Soft delete student (admin only).

```typescript
// Response 200
{
  "success": true,
  "message": "Student deleted successfully"
}
```

## Teacher Management

### GET /api/teachers
List teachers with pagination, filtering, and search.

```typescript
// Query Parameters
{
  "page": 1,
  "limit": 20,
  "search": "ahmed",         // Search in name, phone, email
  "specialization": "mathematics", // Filter by specialization
  "employment_status": "active",   // Filter by employment status
  "sort": "full_name",
  "order": "asc"
}

// Response 200
{
  "success": true,
  "data": {
    "teachers": [
      {
        "id": "uuid",
        "employee_id": "TCH001",
        "full_name": "Dr. Ahmed Karim",
        "first_name": "Ahmed",
        "last_name": "Karim",
        "email": "ahmed.karim@harryschool.uz",
        "phone": "+998901234567",
        "hire_date": "2023-09-01",
        "employment_status": "active",
        "contract_type": "full_time",
        "specializations": ["mathematics", "physics"],
        "languages_spoken": ["uz", "ru", "en"],
        "active_groups": [
          {
            "id": "uuid",
            "name": "Mathematics A1",
            "subject": "Mathematics",
            "student_count": 15
          }
        ],
        "profile_image_url": "https://...",
        "created_at": "2023-09-01T08:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "total_pages": 2,
      "has_next": true,
      "has_previous": false
    }
  }
}
```

### POST /api/teachers
Create a new teacher (admin only).

```typescript
// Request
{
  "first_name": "Ahmed",
  "last_name": "Karim",
  "email": "ahmed.karim@harryschool.uz",
  "phone": "+998901234567",
  "date_of_birth": "1985-07-20",
  "gender": "male",
  "hire_date": "2023-09-01",
  "employment_status": "active",
  "contract_type": "full_time",
  "salary_amount": 3000000,
  "specializations": ["mathematics", "physics"],
  "qualifications": [
    {
      "degree": "PhD",
      "field": "Mathematics",
      "institution": "National University of Uzbekistan",
      "year": 2015
    }
  ],
  "languages_spoken": ["uz", "ru", "en"],
  "address": {
    "street": "456 Teacher Ave",
    "city": "Tashkent",
    "district": "Mirobod",
    "postal_code": "100000"
  }
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "TCH001", // Auto-generated
    // ... complete teacher data
  }
}
```

### GET /api/teachers/[id]
Get teacher details by ID.

```typescript
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "TCH001",
    "full_name": "Dr. Ahmed Karim",
    "first_name": "Ahmed",
    "last_name": "Karim",
    "email": "ahmed.karim@harryschool.uz",
    "phone": "+998901234567",
    "date_of_birth": "1985-07-20",
    "gender": "male",
    "hire_date": "2023-09-01",
    "employment_status": "active",
    "contract_type": "full_time",
    "salary_amount": 3000000,
    "salary_currency": "UZS",
    "specializations": ["mathematics", "physics"],
    "qualifications": [
      {
        "degree": "PhD",
        "field": "Mathematics",
        "institution": "National University of Uzbekistan",
        "year": 2015
      }
    ],
    "certifications": [
      {
        "name": "Advanced Teaching Certificate",
        "issuer": "Ministry of Education",
        "issue_date": "2020-06-15",
        "expiry_date": "2025-06-15"
      }
    ],
    "languages_spoken": ["uz", "ru", "en"],
    "address": {
      "street": "456 Teacher Ave",
      "city": "Tashkent",
      "district": "Mirobod",
      "postal_code": "100000"
    },
    "group_assignments": [
      {
        "id": "uuid",
        "group": {
          "id": "uuid",
          "name": "Mathematics A1",
          "subject": "Mathematics",
          "current_enrollment": 15,
          "max_students": 20
        },
        "role": "primary",
        "start_date": "2023-09-01",
        "status": "active"
      }
    ],
    "documents": [
      {
        "id": "uuid",
        "name": "Teaching License",
        "type": "license",
        "url": "https://...",
        "uploaded_at": "2023-09-01T08:00:00Z"
      }
    ],
    "profile_image_url": "https://...",
    "notes": "Excellent mathematics teacher",
    "created_at": "2023-09-01T08:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

## Group Management

### GET /api/groups
List groups with pagination, filtering, and search.

```typescript
// Query Parameters
{
  "page": 1,
  "limit": 20,
  "search": "mathematics",    // Search in name, subject, description
  "subject": "mathematics",   // Filter by subject
  "status": "active",         // Filter by status
  "teacher_id": "uuid",       // Filter by assigned teacher
  "level": "intermediate",    // Filter by level
  "sort": "name",
  "order": "asc"
}

// Response 200
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": "uuid",
        "group_code": "MATH-A1-2024",
        "name": "Mathematics A1",
        "subject": "Mathematics",
        "level": "intermediate",
        "description": "Advanced mathematics course",
        "start_date": "2024-01-15",
        "end_date": "2024-06-15",
        "duration_weeks": 22,
        "status": "active",
        "group_type": "regular",
        "max_students": 20,
        "current_enrollment": 15,
        "waiting_list_count": 3,
        "price_per_student": 600000,
        "classroom": "Room 101",
        "schedule": {
          "days": ["monday", "wednesday", "friday"],
          "time": "10:00-11:30",
          "timezone": "Asia/Tashkent"
        },
        "teachers": [
          {
            "id": "uuid",
            "full_name": "Dr. Ahmed Karim",
            "role": "primary"
          }
        ],
        "created_at": "2023-12-01T08:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "total_pages": 1,
      "has_next": false,
      "has_previous": false
    }
  }
}
```

### POST /api/groups
Create a new group (admin only).

```typescript
// Request
{
  "name": "Mathematics A1",
  "subject": "Mathematics",
  "level": "intermediate",
  "description": "Advanced mathematics course",
  "start_date": "2024-01-15",
  "end_date": "2024-06-15",
  "max_students": 20,
  "price_per_student": 600000,
  "classroom": "Room 101",
  "group_type": "regular",
  "schedule": {
    "days": ["monday", "wednesday", "friday"],
    "time": "10:00-11:30",
    "timezone": "Asia/Tashkent"
  },
  "curriculum": {
    "topics": ["Algebra", "Geometry", "Calculus"],
    "learning_objectives": ["Master algebraic equations", "Understand geometric principles"]
  },
  "required_materials": [
    {
      "name": "Mathematics Textbook",
      "type": "book",
      "required": true
    }
  ]
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "group_code": "MATH-A1-2024", // Auto-generated
    // ... complete group data
  }
}
```

### GET /api/groups/[id]
Get group details by ID.

```typescript
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "group_code": "MATH-A1-2024",
    "name": "Mathematics A1",
    "subject": "Mathematics",
    "level": "intermediate",
    "description": "Advanced mathematics course",
    "start_date": "2024-01-15",
    "end_date": "2024-06-15",
    "duration_weeks": 22,
    "status": "active",
    "group_type": "regular",
    "max_students": 20,
    "current_enrollment": 15,
    "waiting_list_count": 3,
    "price_per_student": 600000,
    "payment_frequency": "monthly",
    "classroom": "Room 101",
    "online_meeting_url": "https://zoom.us/j/123456789",
    "schedule": {
      "days": ["monday", "wednesday", "friday"],
      "time": "10:00-11:30",
      "timezone": "Asia/Tashkent"
    },
    "curriculum": {
      "topics": ["Algebra", "Geometry", "Calculus"],
      "learning_objectives": ["Master algebraic equations", "Understand geometric principles"],
      "progress": 35.5
    },
    "required_materials": [
      {
        "name": "Mathematics Textbook",
        "type": "book",
        "required": true
      }
    ],
    "teachers": [
      {
        "id": "uuid",
        "full_name": "Dr. Ahmed Karim",
        "role": "primary",
        "start_date": "2024-01-15",
        "compensation_rate": 50000,
        "compensation_type": "per_session"
      }
    ],
    "students": [
      {
        "id": "uuid",
        "full_name": "John Smith",
        "enrollment_date": "2024-01-15",
        "status": "active",
        "attendance_rate": 95.5,
        "payment_status": "current"
      }
    ],
    "notes": "High-performing group",
    "created_at": "2023-12-01T08:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

## Assignment Management

### POST /api/groups/[id]/assign-teacher
Assign teacher to group (admin only).

```typescript
// Request
{
  "teacher_id": "uuid",
  "role": "primary", // primary, assistant, substitute, observer
  "start_date": "2024-01-15",
  "end_date": "2024-06-15",
  "compensation_rate": 50000,
  "compensation_type": "per_session"
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "teacher_id": "uuid",
    "group_id": "uuid",
    "role": "primary",
    "start_date": "2024-01-15",
    "end_date": "2024-06-15",
    "status": "active",
    "teacher": {
      "id": "uuid",
      "full_name": "Dr. Ahmed Karim"
    }
  }
}
```

### POST /api/groups/[id]/enroll-student
Enroll student in group (admin only).

```typescript
// Request
{
  "student_id": "uuid",
  "start_date": "2024-01-15",
  "tuition_amount": 600000,
  "payment_status": "pending"
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "uuid",
    "group_id": "uuid",
    "enrollment_date": "2024-01-15",
    "start_date": "2024-01-15",
    "status": "enrolled",
    "tuition_amount": 600000,
    "payment_status": "pending",
    "student": {
      "id": "uuid",
      "full_name": "John Smith"
    }
  }
}

// Response 400 - Group full
{
  "success": false,
  "error": {
    "code": "GROUP_FULL",
    "message": "Group has reached maximum capacity"
  }
}
```

## Search & Analytics

### GET /api/search
Global search across all entities.

```typescript
// Query Parameters
{
  "q": "john",           // Search query
  "type": "students",    // Entity type filter (optional)
  "limit": 20            // Results limit
}

// Response 200
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "student",
        "id": "uuid",
        "title": "John Smith",
        "subtitle": "Student ID: STU001",
        "description": "Active student in Mathematics A1",
        "url": "/students/uuid",
        "image_url": "https://...",
        "metadata": {
          "enrollment_status": "active",
          "payment_status": "current"
        }
      },
      {
        "type": "teacher",
        "id": "uuid",
        "title": "John Doe",
        "subtitle": "Mathematics Teacher",
        "description": "Teaching 3 active groups",
        "url": "/teachers/uuid",
        "image_url": "https://...",
        "metadata": {
          "employment_status": "active",
          "specializations": ["mathematics"]
        }
      }
    ],
    "total": 2,
    "query": "john",
    "execution_time_ms": 45
  }
}
```

### GET /api/analytics/dashboard
Dashboard analytics data.

```typescript
// Response 200
{
  "success": true,
  "data": {
    "overview": {
      "total_students": 150,
      "active_students": 135,
      "total_teachers": 25,
      "active_teachers": 23,
      "total_groups": 12,
      "active_groups": 10
    },
    "enrollment_stats": {
      "new_this_month": 8,
      "enrollment_trend": [
        { "month": "2023-12", "count": 142 },
        { "month": "2024-01", "count": 150 }
      ]
    },
    "payment_stats": {
      "current": 120,
      "overdue": 15,
      "total_revenue_this_month": 75000000,
      "payment_trend": [
        { "month": "2023-12", "amount": 70000000 },
        { "month": "2024-01", "amount": 75000000 }
      ]
    },
    "group_stats": {
      "capacity_utilization": 75.5,
      "average_group_size": 15.2,
      "most_popular_subjects": [
        { "subject": "Mathematics", "count": 45 },
        { "subject": "English", "count": 38 }
      ]
    }
  }
}
```

## Notification System

### GET /api/notifications
Get user notifications.

```typescript
// Query Parameters
{
  "page": 1,
  "limit": 20,
  "unread_only": true,  // Filter unread notifications
  "type": "enrollment"  // Filter by notification type
}

// Response 200
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "enrollment",
        "title": "New Student Enrollment",
        "message": "John Smith has been enrolled in Mathematics A1",
        "action_url": "/students/uuid",
        "is_read": false,
        "priority": "normal",
        "related_student_id": "uuid",
        "related_group_id": "uuid",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "total_pages": 1,
      "has_next": false,
      "has_previous": false
    },
    "unread_count": 3
  }
}
```

### PUT /api/notifications/[id]/mark-read
Mark notification as read.

```typescript
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_read": true,
    "read_at": "2024-01-15T10:35:00Z"
  }
}
```

## Error Handling

### Standard Error Response Format

```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",           // Machine-readable error code
    "message": "Human readable message", // User-friendly error message
    "details": {                    // Additional error details (optional)
      "field": ["Validation message"]
    },
    "request_id": "uuid",          // For debugging (optional)
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|------------|------------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (duplicate) |
| 422 | UNPROCESSABLE_ENTITY | Business logic error |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

## Rate Limiting

All API endpoints are subject to rate limiting:

- **Authenticated users**: 1000 requests per hour
- **Search endpoints**: 100 requests per 15 minutes
- **Bulk operations**: 10 requests per minute
- **File uploads**: 50 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## File Upload

### POST /api/upload
Upload files (images, documents).

```typescript
// Request (multipart/form-data)
{
  "file": File,
  "type": "profile_image", // profile_image, document, certificate
  "entity_type": "student", // student, teacher, group, organization
  "entity_id": "uuid"
}

// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "profile.jpg",
    "original_name": "john_profile.jpg",
    "mime_type": "image/jpeg",
    "size": 1024000,
    "url": "https://storage.supabase.co/...",
    "thumbnail_url": "https://storage.supabase.co/...", // For images
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
}
```

## Real-time Subscriptions

### WebSocket Connection

Connect to real-time updates using Supabase Realtime:

```typescript
// JavaScript/TypeScript client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, anonKey)

// Subscribe to student changes
const studentSubscription = supabase
  .channel('students')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'students',
      filter: `organization_id=eq.${organizationId}`
    }, 
    (payload) => {
      console.log('Student change:', payload)
    }
  )
  .subscribe()

// Subscribe to notifications
const notificationSubscription = supabase
  .channel('notifications')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New notification:', payload.new)
    }
  )
  .subscribe()
```

This comprehensive API design provides:

1. **RESTful endpoints** for all CRUD operations with consistent patterns
2. **Advanced search and filtering** capabilities for efficient data retrieval
3. **Real-time subscriptions** for live updates and notifications
4. **Comprehensive error handling** with standardized error responses
5. **Performance optimization** through pagination and efficient queries
6. **Security enforcement** through RLS and role-based access control
7. **Type safety** with full TypeScript integration
8. **File handling** capabilities for documents and images

The API is designed to support all user workflows identified in the UX research while providing scalable performance for 1000+ students with <200ms response times.