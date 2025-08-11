# Harry School CRM Database Schema

## Overview

The Harry School CRM uses a PostgreSQL database via Supabase with comprehensive multi-tenant architecture. This document provides complete schema documentation including tables, relationships, constraints, and indexes.

## Schema Versions

| Version | Description | Applied |
|---------|-------------|---------|
| 1.0.0 | Initial Harry School CRM schema | ✅ |
| 1.0.1 | Added indexes and data validation constraints | ✅ |
| 1.0.2 | Added database functions and triggers for automation | ✅ |
| 1.0.3 | Added Row Level Security policies for multi-tenant isolation | ✅ |
| 1.1.0 | Finance module schema with payment processing | ✅ |
| 1.2.0 | Settings module with system configuration | ✅ |

## Core Entities

### organizations

**Description**: Multi-tenant foundation table storing organization details and subscription information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique organization identifier |
| name | text | NOT NULL | Organization display name |
| slug | text | UNIQUE NOT NULL | URL-friendly organization identifier |
| logo_url | text | NULL | Organization logo image URL |
| address | jsonb | NULL | Structured address information |
| contact_info | jsonb | NULL | Phone, email, and other contact details |
| settings | jsonb | DEFAULT '{}' | Organization-specific configuration |
| subscription_plan | text | DEFAULT 'basic' | Current subscription tier |
| subscription_status | text | DEFAULT 'active' | Subscription status |
| max_students | integer | DEFAULT 500 | Student capacity limit |
| max_teachers | integer | DEFAULT 50 | Teacher capacity limit |
| max_groups | integer | DEFAULT 50 | Group capacity limit |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| created_by | uuid | FOREIGN KEY (auth.users.id) | User who created record |
| updated_by | uuid | FOREIGN KEY (auth.users.id) | User who last updated record |
| deleted_at | timestamptz | NULL | Soft delete timestamp |
| deleted_by | uuid | FOREIGN KEY (auth.users.id) | User who deleted record |

**Indexes**:
- `idx_organizations_slug` on (slug)
- `idx_organizations_active` on (id) WHERE deleted_at IS NULL

### profiles

**Description**: User profiles extending Supabase auth.users with organization-specific information and preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, FOREIGN KEY (auth.users.id) | User identifier from auth.users |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| email | text | NOT NULL | User email address |
| full_name | text | NOT NULL | User's full name |
| avatar_url | text | NULL | Profile image URL |
| phone | text | NULL | Contact phone number |
| role | user_role | NOT NULL DEFAULT 'admin' | User role (superadmin/admin/viewer) |
| language_preference | text | DEFAULT 'en' | UI language (en/ru/uz) |
| timezone | text | DEFAULT 'Asia/Tashkent' | User timezone |
| notification_preferences | jsonb | DEFAULT notification settings | Email/system notification settings |
| last_login_at | timestamptz | NULL | Last successful login |
| login_count | integer | DEFAULT 0 | Total login count |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| created_by | uuid | FOREIGN KEY (auth.users.id) | User who created record |
| updated_by | uuid | FOREIGN KEY (auth.users.id) | User who last updated record |
| deleted_at | timestamptz | NULL | Soft delete timestamp |
| deleted_by | uuid | FOREIGN KEY (auth.users.id) | User who deleted record |

**Constraints**:
- UNIQUE(email, organization_id)

**Indexes**:
- `idx_profiles_organization` on (organization_id)
- `idx_profiles_role` on (role)
- `idx_profiles_active` on (organization_id, id) WHERE deleted_at IS NULL

### teachers

**Description**: Teacher profiles with professional information, qualifications, and employment details.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique teacher identifier |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| first_name | text | NOT NULL | Teacher's first name |
| last_name | text | NOT NULL | Teacher's last name |
| full_name | text | GENERATED ALWAYS AS (first_name ‖ ' ' ‖ last_name) STORED | Full name (computed) |
| email | text | NULL | Teacher's email address |
| phone | text | NOT NULL | Primary contact number |
| date_of_birth | date | NULL | Date of birth |
| gender | text | CHECK (gender IN ('male', 'female', 'other')) | Gender |
| employee_id | text | NULL | Unique employee identifier |
| hire_date | date | NOT NULL DEFAULT CURRENT_DATE | Employment start date |
| employment_status | text | DEFAULT 'active' | Employment status |
| contract_type | text | CHECK (contract_type IN ('full_time', 'part_time', 'contract', 'substitute')) | Contract type |
| salary_amount | decimal(10,2) | NULL | Salary amount |
| salary_currency | text | DEFAULT 'UZS' | Salary currency |
| qualifications | jsonb | DEFAULT '[]' | Education and qualifications |
| specializations | text[] | DEFAULT '{}' | Subject specializations |
| certifications | jsonb | DEFAULT '[]' | Professional certifications |
| languages_spoken | text[] | DEFAULT '{}' | Languages spoken |
| address | jsonb | NULL | Address information |
| emergency_contact | jsonb | NULL | Emergency contact details |
| documents | jsonb | DEFAULT '[]' | Document attachments |
| notes | text | NULL | Additional notes |
| profile_image_url | text | NULL | Profile picture URL |
| is_active | boolean | DEFAULT true | Active status flag |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| created_by | uuid | FOREIGN KEY (auth.users.id) | User who created record |
| updated_by | uuid | FOREIGN KEY (auth.users.id) | User who last updated record |
| deleted_at | timestamptz | NULL | Soft delete timestamp |
| deleted_by | uuid | FOREIGN KEY (auth.users.id) | User who deleted record |

**Constraints**:
- UNIQUE(employee_id, organization_id)
- UNIQUE(email, organization_id) WHERE email IS NOT NULL
- CHECK phone format: `phone ~ '^\+998[0-9]{9}$'`
- CHECK email format: `email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`
- CHECK hire_date <= CURRENT_DATE

**Indexes**:
- `idx_teachers_organization` on (organization_id)
- `idx_teachers_full_name` on full_text_search(full_name)
- `idx_teachers_phone` on (phone)
- `idx_teachers_employee_id` on (employee_id)
- `idx_teachers_active` on (organization_id, id) WHERE deleted_at IS NULL AND is_active = true
- `idx_teachers_specializations` on GIN(specializations)
- `idx_teachers_search` on full_text_search

### students

**Description**: Student records with personal, academic, and financial information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique student identifier |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| first_name | text | NOT NULL | Student's first name |
| last_name | text | NOT NULL | Student's last name |
| full_name | text | GENERATED ALWAYS AS (first_name ‖ ' ' ‖ last_name) STORED | Full name (computed) |
| date_of_birth | date | NOT NULL | Date of birth |
| gender | text | CHECK (gender IN ('male', 'female', 'other')) | Gender |
| nationality | text | NULL | Nationality |
| student_id | text | NULL | Unique student identifier |
| enrollment_date | date | NOT NULL DEFAULT CURRENT_DATE | Initial enrollment date |
| enrollment_status | text | DEFAULT 'active' | Current enrollment status |
| grade_level | text | NULL | Current grade or level |
| primary_phone | text | NULL | Primary contact number |
| secondary_phone | text | NULL | Secondary contact number |
| email | text | NULL | Student's email address |
| address | jsonb | NULL | Address information |
| parent_guardian_info | jsonb | DEFAULT '[]' | Parent/guardian details |
| emergency_contacts | jsonb | DEFAULT '[]' | Emergency contact information |
| family_notes | text | NULL | Family-related notes |
| previous_education | jsonb | NULL | Previous education history |
| special_needs | text | NULL | Special needs information |
| medical_notes | text | NULL | Medical considerations |
| allergies | text | NULL | Known allergies |
| payment_plan | text | CHECK (payment_plan IN ('monthly', 'quarterly', 'annual', 'custom')) | Payment schedule |
| tuition_fee | decimal(10,2) | NULL | Standard tuition amount |
| currency | text | DEFAULT 'UZS' | Currency for financial data |
| payment_status | text | DEFAULT 'current' | Payment status |
| profile_image_url | text | NULL | Profile picture URL |
| documents | jsonb | DEFAULT '[]' | Document attachments |
| notes | text | NULL | Additional notes |
| is_active | boolean | DEFAULT true | Active status flag |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| created_by | uuid | FOREIGN KEY (auth.users.id) | User who created record |
| updated_by | uuid | FOREIGN KEY (auth.users.id) | User who last updated record |
| deleted_at | timestamptz | NULL | Soft delete timestamp |
| deleted_by | uuid | FOREIGN KEY (auth.users.id) | User who deleted record |

**Constraints**:
- UNIQUE(student_id, organization_id)
- UNIQUE(email, organization_id) WHERE email IS NOT NULL
- CHECK phone format: `primary_phone ~ '^\+998[0-9]{9}$'`
- CHECK email format
- CHECK enrollment_date <= CURRENT_DATE

**Indexes**:
- `idx_students_organization` on (organization_id)
- `idx_students_full_name` on full_text_search(full_name)
- `idx_students_primary_phone` on (primary_phone)
- `idx_students_student_id` on (student_id)
- `idx_students_enrollment_status` on (enrollment_status)
- `idx_students_active` on (organization_id, id) WHERE deleted_at IS NULL AND is_active = true
- `idx_students_payment_status` on (payment_status)
- `idx_students_search` on full_text_search

### groups

**Description**: Learning groups/classes with scheduling, capacity management, and curriculum information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique group identifier |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| name | text | NOT NULL | Group display name |
| description | text | NULL | Group description |
| group_code | text | NULL | Unique group code |
| subject | text | NOT NULL | Primary subject taught |
| level | text | NULL | Difficulty or grade level |
| curriculum | jsonb | NULL | Curriculum details |
| schedule | jsonb | NOT NULL | Class schedule information |
| start_date | date | NOT NULL | Group start date |
| end_date | date | NULL | Group end date |
| duration_weeks | integer | NULL | Planned duration in weeks |
| max_students | integer | NOT NULL DEFAULT 15 | Maximum student capacity |
| current_enrollment | integer | DEFAULT 0 | Current enrolled count |
| waiting_list_count | integer | DEFAULT 0 | Waiting list count |
| status | text | DEFAULT 'active' | Group status |
| group_type | text | CHECK (group_type IN ('regular', 'intensive', 'private', 'online', 'hybrid')) | Group type |
| price_per_student | decimal(10,2) | NULL | Standard price per student |
| currency | text | DEFAULT 'UZS' | Currency for pricing |
| payment_frequency | text | CHECK (payment_frequency IN ('monthly', 'per_session', 'full_course')) | Payment frequency |
| classroom | text | NULL | Physical classroom location |
| online_meeting_url | text | NULL | Online meeting URL |
| required_materials | jsonb | DEFAULT '[]' | Required materials list |
| is_active | boolean | DEFAULT true | Active status flag |
| notes | text | NULL | Additional notes |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| created_by | uuid | FOREIGN KEY (auth.users.id) | User who created record |
| updated_by | uuid | FOREIGN KEY (auth.users.id) | User who last updated record |
| deleted_at | timestamptz | NULL | Soft delete timestamp |
| deleted_by | uuid | FOREIGN KEY (auth.users.id) | User who deleted record |

**Constraints**:
- UNIQUE(group_code, organization_id)
- CHECK max_students > 0 AND max_students <= 100

**Indexes**:
- `idx_groups_organization` on (organization_id)
- `idx_groups_name` on full_text_search(name)
- `idx_groups_subject` on (subject)
- `idx_groups_status` on (status)
- `idx_groups_active` on (organization_id, id) WHERE deleted_at IS NULL AND is_active = true
- `idx_groups_schedule` on GIN(schedule)
- `idx_groups_search` on full_text_search

## Relationship Tables

### teacher_group_assignments

**Description**: Many-to-many relationship between teachers and groups with assignment details.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique assignment identifier |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| teacher_id | uuid | NOT NULL, FOREIGN KEY (teachers.id) | Teacher reference |
| group_id | uuid | NOT NULL, FOREIGN KEY (groups.id) | Group reference |
| role | text | DEFAULT 'primary' | Teacher role in group |
| start_date | date | NOT NULL DEFAULT CURRENT_DATE | Assignment start date |
| end_date | date | NULL | Assignment end date |
| compensation_rate | decimal(10,2) | NULL | Compensation per unit |
| compensation_type | text | CHECK (compensation_type IN ('per_hour', 'per_session', 'per_student', 'fixed')) | Compensation structure |
| status | text | DEFAULT 'active' | Assignment status |
| notes | text | NULL | Assignment notes |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| created_by | uuid | FOREIGN KEY (auth.users.id) | User who created record |
| updated_by | uuid | FOREIGN KEY (auth.users.id) | User who last updated record |
| deleted_at | timestamptz | NULL | Soft delete timestamp |
| deleted_by | uuid | FOREIGN KEY (auth.users.id) | User who deleted record |

**Constraints**:
- UNIQUE(teacher_id, group_id, organization_id, start_date)

### student_group_enrollments

**Description**: Many-to-many relationship between students and groups with enrollment history and performance tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique enrollment identifier |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| student_id | uuid | NOT NULL, FOREIGN KEY (students.id) | Student reference |
| group_id | uuid | NOT NULL, FOREIGN KEY (groups.id) | Group reference |
| enrollment_date | date | NOT NULL DEFAULT CURRENT_DATE | Enrollment date |
| start_date | date | NOT NULL | Class participation start |
| end_date | date | NULL | Class participation end |
| completion_date | date | NULL | Course completion date |
| status | text | DEFAULT 'enrolled' | Enrollment status |
| attendance_rate | decimal(5,2) | NULL | Attendance percentage |
| progress_notes | text | NULL | Academic progress notes |
| tuition_amount | decimal(10,2) | NULL | Total tuition for this enrollment |
| amount_paid | decimal(10,2) | DEFAULT 0 | Amount paid so far |
| payment_status | text | DEFAULT 'pending' | Payment status |
| final_grade | text | NULL | Final grade or score |
| certificate_issued | boolean | DEFAULT false | Certificate issued flag |
| certificate_number | text | NULL | Certificate number if issued |
| notes | text | NULL | Enrollment notes |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| created_by | uuid | FOREIGN KEY (auth.users.id) | User who created record |
| updated_by | uuid | FOREIGN KEY (auth.users.id) | User who last updated record |
| deleted_at | timestamptz | NULL | Soft delete timestamp |
| deleted_by | uuid | FOREIGN KEY (auth.users.id) | User who deleted record |

**Constraints**:
- UNIQUE(student_id, group_id, enrollment_date, organization_id)

## System Tables

### notifications

**Description**: System notifications and alerts for users with delivery tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique notification identifier |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| user_id | uuid | FOREIGN KEY (auth.users.id) | Target user (null for broadcast) |
| role_target | text[] | NULL | Target roles for broadcast |
| type | text | NOT NULL | Notification type |
| title | text | NOT NULL | Notification title |
| message | text | NOT NULL | Notification content |
| action_url | text | NULL | Action URL for notification |
| related_student_id | uuid | FOREIGN KEY (students.id) | Related student |
| related_teacher_id | uuid | FOREIGN KEY (teachers.id) | Related teacher |
| related_group_id | uuid | FOREIGN KEY (groups.id) | Related group |
| is_read | boolean | DEFAULT false | Read status |
| read_at | timestamptz | NULL | Read timestamp |
| delivery_method | text[] | DEFAULT '{"in_app"}' | Delivery channels |
| priority | text | DEFAULT 'normal' | Priority level |
| scheduled_for | timestamptz | NULL | Scheduled delivery time |
| expires_at | timestamptz | NULL | Expiration time |
| metadata | jsonb | DEFAULT '{}' | Additional metadata |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| deleted_at | timestamptz | NULL | Soft delete timestamp |
| deleted_by | uuid | FOREIGN KEY (auth.users.id) | User who deleted record |

### activity_logs

**Description**: Comprehensive audit trail for all system activities and data changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique log identifier |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| user_id | uuid | FOREIGN KEY (auth.users.id) | Acting user |
| user_email | text | NULL | User email at time of action |
| user_name | text | NULL | User name at time of action |
| user_role | text | NULL | User role at time of action |
| action | text | NOT NULL | Action performed |
| resource_type | text | NOT NULL | Type of resource affected |
| resource_id | uuid | NULL | ID of affected resource |
| resource_name | text | NULL | Name of affected resource |
| old_values | jsonb | NULL | Previous values |
| new_values | jsonb | NULL | New values |
| changed_fields | text[] | NULL | List of changed fields |
| description | text | NULL | Human-readable description |
| ip_address | text | NULL | Client IP address |
| user_agent | text | NULL | Client user agent |
| session_id | text | NULL | Session identifier |
| metadata | jsonb | DEFAULT '{}' | Additional context |
| success | boolean | DEFAULT true | Operation success flag |
| error_message | text | NULL | Error message if failed |
| created_at | timestamptz | DEFAULT NOW() | Action timestamp |

## Finance Module Tables

### payment_methods

**Description**: Available payment methods and gateway configurations for the organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique method identifier |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| name | text | NOT NULL | Payment method name |
| type | payment_method_type | NOT NULL | Method type enum |
| is_active | boolean | DEFAULT true | Active status |
| gateway_config | jsonb | NULL | Gateway configuration |
| processing_fee_percentage | numeric(5,2) | DEFAULT 0 | Percentage processing fee |
| processing_fee_fixed | numeric(10,2) | DEFAULT 0 | Fixed processing fee |
| display_order | integer | DEFAULT 0 | Display order |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| created_by | uuid | FOREIGN KEY (profiles.id) | User who created record |
| updated_by | uuid | FOREIGN KEY (profiles.id) | User who last updated record |
| deleted_at | timestamptz | NULL | Soft delete timestamp |
| deleted_by | uuid | FOREIGN KEY (profiles.id) | User who deleted record |

### invoices

**Description**: Student invoices with line items and payment tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique invoice identifier |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| invoice_number | text | NOT NULL | Human-readable invoice number |
| student_id | uuid | NOT NULL, FOREIGN KEY (students.id) | Student reference |
| group_id | uuid | FOREIGN KEY (groups.id) | Related group |
| status | invoice_status | DEFAULT 'draft' | Invoice status |
| issue_date | date | NOT NULL DEFAULT CURRENT_DATE | Invoice issue date |
| due_date | date | NOT NULL | Payment due date |
| currency | text | DEFAULT 'USD' | Invoice currency |
| subtotal | numeric(10,2) | DEFAULT 0 | Subtotal amount |
| tax_percentage | numeric(5,2) | DEFAULT 0 | Tax percentage |
| tax_amount | numeric(10,2) | DEFAULT 0 | Tax amount |
| discount_id | uuid | FOREIGN KEY (discounts.id) | Applied discount |
| discount_amount | numeric(10,2) | DEFAULT 0 | Discount amount |
| scholarship_id | uuid | FOREIGN KEY (scholarships.id) | Applied scholarship |
| scholarship_amount | numeric(10,2) | DEFAULT 0 | Scholarship amount |
| total_amount | numeric(10,2) | NOT NULL | Final total amount |
| paid_amount | numeric(10,2) | DEFAULT 0 | Amount paid so far |
| notes | text | NULL | Invoice notes |
| payment_schedule_id | uuid | FOREIGN KEY (payment_schedules.id) | Installment schedule |
| sent_at | timestamptz | NULL | Invoice sent timestamp |
| paid_at | timestamptz | NULL | Full payment timestamp |
| cancelled_at | timestamptz | NULL | Cancellation timestamp |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| created_by | uuid | FOREIGN KEY (profiles.id) | User who created record |
| updated_by | uuid | FOREIGN KEY (profiles.id) | User who last updated record |
| deleted_at | timestamptz | NULL | Soft delete timestamp |
| deleted_by | uuid | FOREIGN KEY (profiles.id) | User who deleted record |

### payments

**Description**: Payment records with gateway integration and processing details.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique payment identifier |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| payment_number | text | NOT NULL | Human-readable payment number |
| student_id | uuid | NOT NULL, FOREIGN KEY (students.id) | Student reference |
| invoice_id | uuid | FOREIGN KEY (invoices.id) | Related invoice |
| payment_method_id | uuid | FOREIGN KEY (payment_methods.id) | Payment method used |
| amount | numeric(10,2) | NOT NULL, CHECK (amount > 0) | Payment amount |
| currency | text | DEFAULT 'USD' | Payment currency |
| exchange_rate | numeric(10,4) | DEFAULT 1 | Exchange rate if different currency |
| status | payment_status | DEFAULT 'pending' | Payment status |
| gateway_transaction_id | text | NULL | Gateway transaction ID |
| gateway_response | jsonb | NULL | Full gateway response |
| processing_fee | numeric(10,2) | DEFAULT 0 | Processing fee charged |
| net_amount | numeric(10,2) | NULL | Net amount after fees |
| payment_date | timestamptz | DEFAULT now() | Payment timestamp |
| notes | text | NULL | Payment notes |
| receipt_url | text | NULL | Receipt document URL |
| refund_amount | numeric(10,2) | DEFAULT 0 | Refunded amount |
| refund_reason | text | NULL | Refund reason |
| refunded_at | timestamptz | NULL | Refund timestamp |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| created_by | uuid | FOREIGN KEY (profiles.id) | User who created record |
| updated_by | uuid | FOREIGN KEY (profiles.id) | User who last updated record |
| deleted_at | timestamptz | NULL | Soft delete timestamp |
| deleted_by | uuid | FOREIGN KEY (profiles.id) | User who deleted record |

## Settings Module Tables

### organization_settings

**Description**: Extended organization configuration and visual preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique settings identifier |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| name | text | NULL | Organization display name |
| description | text | NULL | Organization description |
| email | text | NULL | Primary contact email |
| phone | text | NULL | Primary contact phone |
| address | text | NULL | Primary address |
| city | text | NULL | City location |
| timezone | text | DEFAULT 'Asia/Tashkent' | Organization timezone |
| currency | text | DEFAULT 'UZS' | Default currency |
| default_language | text | DEFAULT 'en' | Default system language |
| logo_url | text | NULL | Organization logo URL |
| primary_color | text | DEFAULT '#16a34a' | Brand primary color |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| created_by | uuid | FOREIGN KEY (auth.users.id) | User who created record |
| updated_by | uuid | FOREIGN KEY (auth.users.id) | User who last updated record |

### system_settings

**Description**: System-wide configuration including security, backup, and feature flags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique settings identifier |
| organization_id | uuid | NOT NULL, FOREIGN KEY (organizations.id) | Organization association |
| maintenance_mode | boolean | DEFAULT false | System maintenance flag |
| maintenance_message | text | DEFAULT 'System is under maintenance. Please try again later.' | Maintenance message |
| automated_backups | boolean | DEFAULT true | Auto backup enabled |
| backup_frequency | text | DEFAULT 'daily' | Backup frequency |
| backup_time | time | DEFAULT '02:00' | Backup time |
| backup_retention_days | integer | DEFAULT 30 | Backup retention period |
| include_attachments | boolean | DEFAULT true | Include attachments in backup |
| password_min_length | integer | DEFAULT 8 | Minimum password length |
| password_require_uppercase | boolean | DEFAULT true | Require uppercase in passwords |
| password_require_lowercase | boolean | DEFAULT true | Require lowercase in passwords |
| password_require_numbers | boolean | DEFAULT true | Require numbers in passwords |
| password_require_symbols | boolean | DEFAULT false | Require symbols in passwords |
| password_expiry_days | integer | DEFAULT 90 | Password expiry period |
| password_history_count | integer | DEFAULT 3 | Password history count |
| session_timeout_minutes | integer | DEFAULT 480 | Session timeout |
| max_login_attempts | integer | DEFAULT 5 | Max failed login attempts |
| lockout_duration_minutes | integer | DEFAULT 30 | Account lockout duration |
| require_captcha_after_attempts | integer | DEFAULT 3 | CAPTCHA threshold |
| require_2fa | boolean | DEFAULT false | Require two-factor auth |
| allow_backup_codes | boolean | DEFAULT true | Allow 2FA backup codes |
| backup_codes_count | integer | DEFAULT 10 | Number of backup codes |
| ip_whitelist_enabled | boolean | DEFAULT false | IP whitelist enabled |
| allowed_ips | text[] | DEFAULT '{}' | Allowed IP addresses |
| email_notifications | boolean | DEFAULT true | Email notifications enabled |
| push_notifications | boolean | DEFAULT true | Push notifications enabled |
| admin_notifications | boolean | DEFAULT true | Admin notifications enabled |
| advanced_reporting | boolean | DEFAULT true | Advanced reporting feature |
| bulk_operations | boolean | DEFAULT true | Bulk operations feature |
| api_access | boolean | DEFAULT false | API access feature |
| created_at | timestamptz | DEFAULT NOW() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |
| created_by | uuid | FOREIGN KEY (auth.users.id) | User who created record |
| updated_by | uuid | FOREIGN KEY (auth.users.id) | User who last updated record |

## Database Functions

### update_group_enrollment_count()

**Purpose**: Automatically updates group enrollment counts when student enrollments change.

**Trigger**: Fires on INSERT, UPDATE, or DELETE on student_group_enrollments

**Logic**: Counts active enrollments (status = 'enrolled' or 'active') and updates groups.current_enrollment

### soft_delete_cascade()

**Purpose**: Handles cascading soft deletes for related records.

**Trigger**: Fires when teachers, students, or groups are soft deleted

**Logic**: Automatically marks related assignments and enrollments as deleted with same timestamp and user

### update_updated_at_column()

**Purpose**: Automatically updates the updated_at timestamp on record modifications.

**Trigger**: Fires BEFORE UPDATE on all tables with updated_at column

## Custom Types

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'viewer');

-- Finance types
CREATE TYPE payment_method_type AS ENUM ('cash', 'card', 'bank_transfer', 'online', 'mobile_money', 'crypto', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'refund', 'adjustment', 'transfer');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');
CREATE TYPE scholarship_status AS ENUM ('active', 'expired', 'suspended', 'completed');
CREATE TYPE installment_status AS ENUM ('scheduled', 'paid', 'late', 'cancelled', 'written_off');
```

## Entity Relationship Summary

### Primary Relationships

- **Organizations** (1) → (many) **Profiles, Teachers, Students, Groups**
- **Teachers** (many) ↔ (many) **Groups** via teacher_group_assignments
- **Students** (many) ↔ (many) **Groups** via student_group_enrollments
- **Students** (1) → (many) **Invoices, Payments**
- **Invoices** (1) → (many) **Payments** (partial payments)

### Audit Relationships

- **Profiles** (1) → (many) **Activity Logs** (created_by, updated_by, deleted_by on all tables)
- **Organizations** (1) → (many) **Activity Logs, Notifications**

### Financial Relationships

- **Organizations** (1) → (many) **Payment Methods, Invoices, Payments**
- **Students** (1) → (many) **Invoices, Payments, Student Accounts**
- **Invoices** (1) → (many) **Invoice Line Items, Payment Installments**

## Performance Considerations

### Full-Text Search Indexes

- **Students**: `idx_students_search` on (full_name, primary_phone, email)
- **Teachers**: `idx_teachers_search` on (full_name, phone, email)  
- **Groups**: `idx_groups_search` on (name, subject, description)

### Composite Indexes

- **Active Records**: Filtered indexes on (organization_id, id) WHERE deleted_at IS NULL
- **User Notifications**: `idx_notifications_user_unread` on (user_id, is_read, created_at DESC)
- **Activity Logs**: Multiple indexes for efficient audit queries

### JSONB Indexes

- **GIN Indexes**: On specializations, schedule, and other JSONB columns for efficient queries

## Data Validation

### Phone Number Format
- UZ format: `^+998[0-9]{9}$`
- Applied to teachers.phone and students.primary_phone

### Email Format
- Standard email regex validation
- Applied to all email fields

### Business Rules
- enrollment_date and hire_date cannot be future dates
- Group max_students must be between 1 and 100
- Payment amounts must be positive
- Unique constraints prevent duplicate enrollments and assignments

## Security Implementation

All tables implement comprehensive Row Level Security (RLS) policies. See [RLS Policies Documentation](./rls-policies.md) for detailed security implementation.