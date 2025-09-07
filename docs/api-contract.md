# Harry School Admin Panel - API Contract for Student App Integration

## Authentication

### ✅ IMPLEMENTED: Student & Teacher Authentication
- **Auto-Generated Credentials**: Students and teachers get auto-generated login credentials when created
- **Username Format**: First 3 letters of name + 3 digits (e.g., "ali123", "jan456")
- **Password Format**: 6 random alphanumeric characters (e.g., "a7x9m2", "k3p8s1")
- **Admin Visibility**: Credentials are stored and retrievable for admin display

### Supabase Configuration
- **Database**: `https://jhewccuoxjxdzyytvosc.supabase.co`
- **Providers**: `["email"]`
- **User Types**: Admin, Student, Teacher
- **User Fields**: `["id", "email", "created_at"]`
- **Session Claims**: `["sub", "email", "role", "organization_id"]`

### Security Policies
- Organization-based multi-tenancy isolation
- Role-based access control (superadmin, admin, viewer, student, teacher)
- Soft delete pattern with audit trail
- Row-level security on all tables
- Student/Teacher access restricted to own data and enrolled groups

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
  - `id` ← `student_profiles.student_id` (one-to-one)
- **RLS Policies**:
  - Users can view students in their organization
  - Admins can manage students
  - **✅ Students can view their own data**
  - **✅ Students can update limited contact fields**

### ✅ Student Profiles (Authentication Bridge)
- **Source**: `supabase/migrations/012_student_teacher_auth.sql`
- **Columns**:
  - `id` (uuid, not null) → `auth.users.id`
  - `student_id` (uuid, not null) → `students.id`
  - `organization_id` (uuid, not null)
  - `username` (varchar, not null, unique)
  - `password_visible` (varchar, not null) - For admin display
  - `is_minor` (boolean, default true)
  - `guardian_consent_date` (timestamptz, nullable)
  - `guardian_email` (text, nullable)
  - `last_login_at` (timestamptz, nullable)
  - `login_count` (integer, default 0)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz, default now)
- **Relations**:
  - `id` → `auth.users.id` (one-to-one)
  - `student_id` → `students.id` (one-to-one)
  - `organization_id` → `organizations.id` (many-to-one)

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
  - `id` ← `teacher_profiles.teacher_id` (one-to-one)
- **RLS Policies**:
  - Users can view teachers in their organization
  - Admins can manage teachers
  - **✅ Teachers can view lessons/hometasks in their groups**
  - **✅ Teachers can manage content for assigned groups**

### ✅ Teacher Profiles (Authentication Bridge)
- **Source**: `supabase/migrations/012_student_teacher_auth.sql`
- **Columns**:
  - `id` (uuid, not null) → `auth.users.id`
  - `teacher_id` (uuid, not null) → `teachers.id`
  - `organization_id` (uuid, not null)
  - `username` (varchar, not null, unique)
  - `password_visible` (varchar, not null) - For admin display
  - `last_login_at` (timestamptz, nullable)
  - `login_count` (integer, default 0)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz, default now)
- **Relations**:
  - `id` → `auth.users.id` (one-to-one)
  - `teacher_id` → `teachers.id` (one-to-one)
  - `organization_id` → `organizations.id` (many-to-one)

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
  - **✅ Students can view their own enrollments**
  - **✅ Teachers can view enrollments in their assigned groups**

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

### ✅ Student App Tables (All Implemented)

#### Lessons
- **Source**: `supabase/migrations/013_student_app_tables.sql`
- **Columns**: `id`, `organization_id`, `group_id`, `title`, `description`, `content` (jsonb), `materials` (jsonb), `objectives`, `order_index`, `duration_minutes`, `lesson_type`, `is_published`
- **Student Access**: Can view published lessons in enrolled groups
- **Teacher Access**: Can create/edit lessons for assigned groups

#### Hometasks (Homework)
- **Source**: `supabase/migrations/013_student_app_tables.sql`
- **Columns**: `id`, `organization_id`, `lesson_id`, `group_id`, `title`, `instructions`, `due_date`, `points_value`, `max_attempts`, `auto_grade`, `difficulty_level`, `task_type`, `is_published`
- **Student Access**: Can view published hometasks in enrolled groups
- **Teacher Access**: Can create/manage hometasks for assigned groups

#### Student Hometask Submissions
- **Source**: `supabase/migrations/013_student_app_tables.sql`
- **Columns**: `id`, `organization_id`, `student_id`, `hometask_id`, `attempt_number`, `submission_text`, `submission_files` (jsonb), `submitted_at`, `score`, `max_score`, `feedback`, `graded_by`, `graded_at`, `status`, `late_submission`
- **Student Access**: Can create/view own submissions
- **Teacher Access**: Can view/grade submissions from assigned groups

#### Vocabulary Words
- **Source**: `supabase/migrations/013_student_app_tables.sql`
- **Columns**: `id`, `organization_id`, `word`, `definition`, `part_of_speech`, `phonetics`, `example_sentence`, `translation_uzbek`, `translation_russian`, `difficulty_level`, `category`, `image_url`, `audio_url`, `synonyms`, `antonyms`, `usage_frequency`, `is_active`
- **Student Access**: Can view active vocabulary in organization
- **Teacher Access**: Can manage vocabulary for organization

#### Student Vocabulary Progress
- **Source**: `supabase/migrations/013_student_app_tables.sql`
- **Columns**: `id`, `organization_id`, `student_id`, `word_id`, `mastery_level`, `is_favorite`, `review_count`, `correct_count`, `incorrect_count`, `last_reviewed`, `next_review`, `streak_count`, `difficulty_rating`, `notes`
- **Student Access**: Can manage own vocabulary progress
- **Teacher Access**: Can view progress of assigned students

#### Schedules
- **Source**: `supabase/migrations/013_student_app_tables.sql`
- **Columns**: `id`, `organization_id`, `student_id`, `group_id`, `lesson_id`, `day_of_week`, `start_time`, `end_time`, `room`, `is_online`, `meeting_url`, `is_recurring`, `valid_from`, `valid_until`
- **Student Access**: Can view own schedules
- **Teacher Access**: Can view schedules of assigned students

#### Referrals
- **Source**: `supabase/migrations/013_student_app_tables.sql`
- **Columns**: `id`, `organization_id`, `referrer_student_id`, `referral_code`, `referred_email`, `referred_student_id`, `referred_name`, `referred_phone`, `status`, `points_earned`, `bonus_awarded`, `expires_at`, `completed_at`, `notes`
- **Student Access**: Can create/manage own referrals
- **Teacher Access**: Can view referrals in organization

#### Referral Rewards
- **Source**: `supabase/migrations/013_student_app_tables.sql`
- **Columns**: `id`, `organization_id`, `referral_id`, `student_id`, `reward_type`, `reward_value`, `reward_description`, `claimed_at`, `expires_at`, `is_claimed`
- **Student Access**: Can view/claim own referral rewards

#### Student Rankings (From Rewards Migration)
- **Source**: `supabase/migrations/011_rewards_schema.sql`
- **Columns**: `id`, `organization_id`, `student_id`, `points_total`, `rank`, `level`, `badges` (jsonb), `updated_at`
- **Student Access**: Can view own ranking and leaderboard

#### Points Transactions (From Rewards Migration)
- **Source**: `supabase/migrations/011_rewards_schema.sql`
- **Columns**: `id`, `organization_id`, `student_id`, `points`, `transaction_type`, `reason`, `metadata` (jsonb), `created_at`
- **Student Access**: Can view own points transactions

## RPC Procedures

### ✅ Student/Teacher Authentication Helpers
- `get_current_student_id()` - Get student ID for current auth user
- `get_current_teacher_id()` - Get teacher ID for current auth user
- `is_student()` - Check if current user is a student
- `is_teacher()` - Check if current user is a teacher
- `get_student_organization()` - Get organization ID for current student
- `get_teacher_organization()` - Get organization ID for current teacher

### ✅ Vocabulary Functions
- `calculate_next_review(mastery_level, correct_streak)` - Calculate next vocabulary review date using spaced repetition

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

## ✅ Student App API Contract (Fully Implemented)

### Authentication
- **Login**: Standard Supabase auth with username/password
- **Session Management**: JWT tokens with student/teacher role claims
- **Organization Scoping**: All queries automatically scoped to user's organization

### Lessons
- **Reads**: 
  - `lessons.*` (published lessons in enrolled groups)
  - `lessons.content` (JSONB with lesson materials)
  - `lessons.materials` (JSONB with file URLs)
- **Writes**: None (read-only for students)

### Hometasks (Homework)
- **Reads**: 
  - `hometasks.*` (published assignments in enrolled groups)
  - `student_hometask_submissions.*` (own submissions)
- **Writes**: 
  - `student_hometask_submissions` (create/update own submissions)
  - Can submit text, files, mark as draft/submitted
  - Cannot modify after teacher grading

### Vocabulary Learning
- **Reads**: 
  - `vocabulary_words.*` (active words in organization)
  - `student_vocabulary_progress.*` (own progress tracking)
- **Writes**: 
  - `student_vocabulary_progress` (update mastery, favorites, review data)
  - Supports spaced repetition algorithm
  - Track correct/incorrect attempts

### Schedule
- **Reads**: 
  - `schedules.*` (own class schedules)
  - `groups.name`, `groups.classroom` (via enrollments)
  - Day/time, online meeting URLs, recurring patterns
- **Writes**: None (managed by admin/teachers)

### Points & Rankings
- **Reads**: 
  - `student_rankings.*` (own ranking and leaderboard)
  - `points_transactions.*` (own points history)
  - `achievements.*` and `student_achievements.*`
- **Writes**: None (points awarded by system/teachers)

### Referrals
- **Reads**: 
  - `referrals.*` (own referrals)
  - `referral_rewards.*` (own rewards)
- **Writes**: 
  - `referrals` (create new referral codes)
  - `referral_rewards` (claim rewards)

### Profile
- **Reads**: 
  - `students.*` (own profile data)
  - `student_profiles.*` (auth-related data)
- **Writes**: 
  - `students.primary_phone`, `students.secondary_phone`
  - `students.email`
  - `students.profile_image_url`
  - Limited contact info updates only

## ✅ Previously Identified Gaps - Now RESOLVED

1. **✅ RESOLVED: Dedicated lessons/curriculum content tables** - `lessons` table with JSONB content and materials
2. **✅ RESOLVED: Vocabulary management tables** - `vocabulary_words` and `student_vocabulary_progress` with spaced repetition
3. **✅ RESOLVED: Homework/assignment submission tables** - `hometasks` and `student_hometask_submissions` with grading
4. **✅ RESOLVED: Student progress/grades detail tables** - Points, rankings, achievements, vocabulary mastery tracking
5. **✅ RESOLVED: Student authentication mechanism** - Auto-generated credentials, bridge tables, RLS policies
6. **✅ RESOLVED: Student-specific API endpoints** - Complete RLS-based access control system
7. **✅ RESOLVED: Student schedule management** - Individual `schedules` table
8. **✅ RESOLVED: Referral system** - `referrals` and `referral_rewards` tables

### Remaining Optional Enhancements
1. **Push notification tokens storage** - Could add `device_tokens` table if needed
2. **Attendance tracking table** - Currently uses percentage in enrollments (sufficient for MVP)
3. **Test/quiz/assessment tables** - Can be built on top of existing `hometasks` system

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

### ✅ Student App Specific Enums

### enrollment_status
- `active`
- `inactive`
- `graduated`
- `transferred`
- `expelled`
- `on_hold`

### lesson_type
- `regular`
- `review`
- `test`
- `project`

### task_type
- `written`
- `multiple_choice`
- `file_upload`
- `audio`
- `video`

### submission_status
- `draft`
- `submitted`
- `graded`
- `returned`
- `late`

### points_transaction_type
- `earned`
- `spent`
- `bonus`
- `penalty`

### referral_status
- `pending`
- `completed`
- `expired`
- `cancelled`

### reward_type
- `points`
- `discount`
- `free_lesson`
- `certificate`

## Environment Configuration

```env
# ✅ Current Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://jhewccuoxjxdzyytvosc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdjY3VveGp4ZHp5eXR2b3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTIzNjUsImV4cCI6MjA2ODY2ODM2NX0.FIpEjUftHXFc0YF_Ji5OR6rgfoZsQjINBtK2gWHrYUw

# For student app
NEXT_PUBLIC_APP_TYPE=student
NEXT_PUBLIC_DEFAULT_ORG=harry-school-tashkent
```

## Quick Start for Student App Development

1. **Install Supabase**: `npm install @supabase/supabase-js`
2. **Configure client** with URL and anon key above
3. **Authentication**: Use username/password login (credentials provided by admin)
4. **Organization scoping**: All queries automatically scoped via RLS policies
5. **Test with**: API endpoints at `/api/check-db` and `/api/test-auth`