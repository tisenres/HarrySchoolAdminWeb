# Harry School Admin Panel - API Contract for Student App Integration

## Authentication

### Supabase Configuration
- **Providers**: `["email"]`
- **User Fields**: `["id", "email", "created_at"]`
- **Session Claims**: `["sub", "email", "role", "organization_id"]`

### Security Policies
- Organization-based multi-tenancy isolation
- Role-based access control (superadmin, admin, viewer)
- Soft delete pattern with audit trail
- Row-level security on all tables

## Database Tables

### Organizations
- **Source**: `harry-school-admin/src/types/database.generated.ts`
- **Columns**:
  - `id` (uuid, not null)
  - `name` (text, not null)
  - `slug` (text, not null)
  - `settings` (jsonb, nullable)
  - `max_students` (integer, nullable)
  - `created_at` (timestamptz, nullable)
  - `deleted_at` (timestamptz, nullable)
- **Indexes**: `slug_unique`
- **RLS Policies**: 
  - Users can view their organization
  - Admins can update their organization

### Profiles
- **Source**: `supabase/migrations/001_initial_schema.sql`
- **Columns**:
  - `id` (uuid, not null)
  - `organization_id` (uuid, not null)
  - `email` (text, not null)
  - `full_name` (text, not null)
  - `role` (user_role, not null)
  - `language_preference` (text, nullable)
  - `notification_preferences` (jsonb, nullable)
- **Indexes**: `organization_id`, `email_organization_unique`
- **Relations**:
  - `id` → `auth.users.id` (one-to-one)
  - `organization_id` → `organizations.id` (many-to-one)
- **RLS Policies**:
  - Users can view profiles in their organization
  - Users can update own profile

### Students
- **Source**: `supabase/migrations/001_initial_schema.sql`
- **Columns**:
  - `id` (uuid, not null)
  - `organization_id` (uuid, not null)
  - `first_name` (text, not null)
  - `last_name` (text, not null)
  - `full_name` (text, not null)
  - `date_of_birth` (date, not null)
  - `enrollment_status` (text, nullable)
  - `primary_phone` (text, nullable)
  - `email` (text, nullable)
  - `parent_guardian_info` (jsonb, nullable)
  - `payment_status` (text, nullable)
  - `deleted_at` (timestamptz, nullable)
- **Indexes**: `organization_id`, `student_id_unique`, `email_unique`
- **Relations**:
  - `organization_id` → `organizations.id` (many-to-one)
- **RLS Policies**:
  - Users can view students in their organization
  - Admins can manage students

### Teachers
- **Source**: `supabase/migrations/001_initial_schema.sql`
- **Columns**:
  - `id` (uuid, not null)
  - `organization_id` (uuid, not null)
  - `first_name` (text, not null)
  - `last_name` (text, not null)
  - `full_name` (text, not null)
  - `email` (text, nullable)
  - `phone` (text, not null)
  - `specializations` (text[], nullable)
  - `employment_status` (text, nullable)
  - `deleted_at` (timestamptz, nullable)
- **Indexes**: `organization_id`, `employee_id_unique`
- **Relations**:
  - `organization_id` → `organizations.id` (many-to-one)
- **RLS Policies**:
  - Users can view teachers in their organization
  - Admins can manage teachers

### Groups
- **Source**: `supabase/migrations/001_initial_schema.sql`
- **Columns**:
  - `id` (uuid, not null)
  - `organization_id` (uuid, not null)
  - `name` (text, not null)
  - `subject` (text, not null)
  - `schedule` (jsonb, not null)
  - `start_date` (date, not null)
  - `end_date` (date, nullable)
  - `max_students` (integer, not null)
  - `current_enrollment` (integer, nullable)
  - `status` (text, nullable)
  - `deleted_at` (timestamptz, nullable)
- **Indexes**: `organization_id`, `group_code_unique`
- **Relations**:
  - `organization_id` → `organizations.id` (many-to-one)
- **RLS Policies**:
  - Users can view groups in their organization
  - Admins can manage groups

### Student Group Enrollments
- **Source**: `supabase/migrations/001_initial_schema.sql`
- **Columns**:
  - `id` (uuid, not null)
  - `organization_id` (uuid, not null)
  - `student_id` (uuid, not null)
  - `group_id` (uuid, not null)
  - `enrollment_date` (date, not null)
  - `status` (text, nullable)
  - `attendance_rate` (decimal, nullable)
  - `payment_status` (text, nullable)
- **Indexes**: `organization_id`, `student_id`, `group_id`
- **Relations**:
  - `student_id` → `students.id` (many-to-one)
  - `group_id` → `groups.id` (many-to-one)
- **RLS Policies**:
  - Users can view enrollments in their organization

### Invoices
- **Source**: `harry-school-admin/src/types/database.generated.ts`
- **Columns**:
  - `id` (uuid, not null)
  - `organization_id` (uuid, not null)
  - `student_id` (uuid, nullable)
  - `invoice_number` (text, not null)
  - `invoice_date` (text, not null)
  - `due_date` (text, not null)
  - `total_amount` (number, not null)
  - `paid_amount` (number, nullable)
  - `status` (invoice_status, nullable)
- **Indexes**: `organization_id`, `student_id`, `invoice_number`
- **Relations**:
  - `student_id` → `students.id` (many-to-one)
  - `organization_id` → `organizations.id` (many-to-one)
- **RLS Policies**: Organization-based access control

### Payments
- **Source**: `harry-school-admin/src/types/database.generated.ts`
- **Columns**:
  - `id` (uuid, not null)
  - `organization_id` (uuid, not null)
  - `student_id` (uuid, nullable)
  - `invoice_id` (uuid, nullable)
  - `payment_number` (text, not null)
  - `amount` (number, not null)
  - `payment_date` (text, nullable)
  - `payment_method_type` (payment_method, not null)
  - `status` (payment_status, nullable)
- **Indexes**: `organization_id`, `student_id`, `invoice_id`
- **Relations**:
  - `student_id` → `students.id` (many-to-one)
  - `invoice_id` → `invoices.id` (many-to-one)
- **RLS Policies**: Organization-based access control

## RPC Procedures

### calculate_student_balance
- **Arguments**: 
  - `student_uuid` (uuid)
  - `org_uuid` (uuid)
- **Returns**: record
- **Security Definer**: false
- **Source**: `harry-school-admin/src/types/database.generated.ts`

### calculate_invoice_totals
- **Arguments**: 
  - `inv_id` (uuid)
- **Returns**: void
- **Security Definer**: false
- **Source**: `harry-school-admin/src/types/database.generated.ts`

### get_user_organization
- **Arguments**: none
- **Returns**: uuid
- **Security Definer**: true
- **Source**: `supabase/migrations/004_rls_policies.sql`

### get_user_role
- **Arguments**: none
- **Returns**: user_role
- **Security Definer**: true
- **Source**: `supabase/migrations/004_rls_policies.sql`

## UI Contract for Student App

### Lessons
- **Reads**: 
  - `groups.schedule`
  - `groups.curriculum`
  - `student_group_enrollments`
- **Writes**: None

### Tests
- **Reads**: None
- **Writes**: None

### Vocabulary
- **Reads**: None
- **Writes**: None

### Schedule
- **Reads**: 
  - `groups.schedule`
  - `student_group_enrollments.group_id`
  - `groups.start_date`
  - `groups.end_date`
  - `groups.classroom`
  - `groups.online_meeting_url`
- **Writes**: None

### Attendance
- **Reads**: 
  - `student_group_enrollments.attendance_rate`
- **Writes**: None

### Profile
- **Reads**: 
  - `students.*`
  - `profiles.notification_preferences`
  - `profiles.language_preference`
- **Writes**: 
  - `profiles.notification_preferences`
  - `profiles.language_preference`
  - `students.primary_phone`
  - `students.email`

## Identified Gaps for Mobile App

1. **No dedicated lessons/curriculum content tables** - Only JSONB in `groups.curriculum`
2. **No vocabulary management tables** for student learning
3. **No test/quiz/assessment tables**
4. **No attendance tracking table** - Only percentage in enrollments
5. **No homework/assignment submission tables**
6. **No student progress/grades detail tables**
7. **No push notification tokens storage**
8. **No student authentication mechanism** - Only admin auth exists
9. **No student-specific API endpoints or services**

## Enums

### user_role
- `superadmin`
- `admin`
- `viewer`

### discount_type
- `percentage`
- `fixed_amount`

### installment_status
- `pending`
- `due`
- `paid`
- `overdue`
- `cancelled`

### invoice_status
- `draft`
- `sent`
- `viewed`
- `paid`
- `partially_paid`
- `overdue`
- `cancelled`
- `refunded`

### payment_method
- `cash`
- `card`
- `bank_transfer`
- `online`
- `mobile_money`
- `crypto`

### payment_status
- `pending`
- `processing`
- `completed`
- `failed`
- `cancelled`
- `refunded`

### scholarship_type
- `full`
- `partial`
- `need_based`
- `merit_based`

### transaction_type
- `income`
- `expense`
- `refund`
- `adjustment`
- `fee`
- `discount`
- `scholarship`