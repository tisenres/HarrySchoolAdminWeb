/**
 * Row Level Security (RLS) Policies for Harry School Mobile Apps
 * 
 * This module contains comprehensive RLS policy definitions for multi-tenant security,
 * ensuring complete data isolation between organizations and proper role-based access control.
 * 
 * Security Principles:
 * 1. Organization-based data isolation (multi-tenancy)
 * 2. Role-based access control (student, teacher, admin, superadmin)
 * 3. Soft delete pattern protection
 * 4. Audit trail preservation
 * 5. Performance-optimized policy queries
 */

export interface RLSPolicyDefinition {
  table: string;
  policy_name: string;
  policy_type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  role_based: boolean;
  organization_isolated: boolean;
  soft_delete_aware: boolean;
  sql: string;
  description: string;
  performance_notes?: string;
}

/**
 * Core RLS Policies for Educational Data Model
 */
export const RLS_POLICIES: RLSPolicyDefinition[] = [
  // Organizations Table Policies
  {
    table: 'organizations',
    policy_name: 'organizations_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "organizations_select_policy" ON organizations
      FOR SELECT USING (
        CASE 
          -- Superadmin can see all organizations
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'superadmin' THEN true
          -- Others can only see their own organization
          ELSE id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid
        END
      );
    `,
    description: 'Controls organization visibility based on user role and organization membership',
    performance_notes: 'Uses JWT metadata to avoid profile table joins'
  },
  
  // Profiles Table Policies
  {
    table: 'profiles',
    policy_name: 'profiles_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: true,
    sql: `
      CREATE POLICY "profiles_select_policy" ON profiles
      FOR SELECT USING (
        deleted_at IS NULL AND
        CASE 
          -- Users can see their own profile
          WHEN id = auth.uid() THEN true
          -- Admins can see profiles in their organization
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') 
            AND organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid 
            THEN true
          -- Teachers can see student profiles in their groups
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'teacher' 
            AND role = 'student'
            AND organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid
            THEN EXISTS (
              SELECT 1 FROM groups g 
              WHERE g.organization_id = profiles.organization_id
                AND auth.uid() = ANY(g.teacher_ids)
                AND profiles.id = ANY(g.student_ids)
                AND g.deleted_at IS NULL
            )
          ELSE false
        END
      );
    `,
    description: 'Multi-level profile access: own profile, admin org access, teacher-student relationships',
    performance_notes: 'Complex policy - consider materializing teacher-student relationships for performance'
  },

  {
    table: 'profiles',
    policy_name: 'profiles_update_policy',
    policy_type: 'UPDATE',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: true,
    sql: `
      CREATE POLICY "profiles_update_policy" ON profiles
      FOR UPDATE USING (
        deleted_at IS NULL AND
        CASE 
          -- Users can update their own profile (limited fields)
          WHEN id = auth.uid() THEN true
          -- Admins can update profiles in their organization
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') 
            AND organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid 
            THEN true
          ELSE false
        END
      );
    `,
    description: 'Profile updates: self-service and admin management within organization'
  },

  // Students Table Policies
  {
    table: 'students',
    policy_name: 'students_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: true,
    sql: `
      CREATE POLICY "students_select_policy" ON students
      FOR SELECT USING (
        deleted_at IS NULL AND
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Students can see their own record
          WHEN auth.uid()::text = id THEN true
          -- Admins can see all students in organization
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          -- Teachers can see students in their groups
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'teacher' THEN
            EXISTS (
              SELECT 1 FROM groups g 
              WHERE g.organization_id = students.organization_id
                AND auth.uid() = ANY(g.teacher_ids)
                AND students.id = ANY(g.student_ids)
                AND g.deleted_at IS NULL
            )
          ELSE false
        END
      );
    `,
    description: 'Student data access: self-access, admin oversight, teacher-student group relationships'
  },

  {
    table: 'students',
    policy_name: 'students_update_policy',
    policy_type: 'UPDATE',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: true,
    sql: `
      CREATE POLICY "students_update_policy" ON students
      FOR UPDATE USING (
        deleted_at IS NULL AND
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Students can update limited fields of their own record
          WHEN auth.uid()::text = id THEN true
          -- Admins can update all student records in organization
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          -- Teachers can update limited student fields in their groups
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'teacher' THEN
            EXISTS (
              SELECT 1 FROM groups g 
              WHERE g.organization_id = students.organization_id
                AND auth.uid() = ANY(g.teacher_ids)
                AND students.id = ANY(g.student_ids)
                AND g.deleted_at IS NULL
            )
          ELSE false
        END
      );
    `,
    description: 'Student updates: self-limited updates, admin full control, teacher group-based updates'
  },

  // Teachers Table Policies
  {
    table: 'teachers',
    policy_name: 'teachers_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: true,
    sql: `
      CREATE POLICY "teachers_select_policy" ON teachers
      FOR SELECT USING (
        deleted_at IS NULL AND
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Teachers can see their own record
          WHEN auth.uid()::text = id THEN true
          -- Admins can see all teachers in organization
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          -- Students can see their teachers (in shared groups)
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'student' THEN
            EXISTS (
              SELECT 1 FROM groups g 
              WHERE g.organization_id = teachers.organization_id
                AND teachers.id = ANY(g.teacher_ids)
                AND auth.uid() = ANY(g.student_ids)
                AND g.deleted_at IS NULL
            )
          -- Teachers can see colleagues in shared groups
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'teacher' THEN
            EXISTS (
              SELECT 1 FROM groups g 
              WHERE g.organization_id = teachers.organization_id
                AND teachers.id = ANY(g.teacher_ids)
                AND auth.uid() = ANY(g.teacher_ids)
                AND g.deleted_at IS NULL
            )
          ELSE false
        END
      );
    `,
    description: 'Teacher visibility: self-access, admin oversight, group-based student/colleague access'
  },

  // Groups Table Policies
  {
    table: 'groups',
    policy_name: 'groups_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: true,
    sql: `
      CREATE POLICY "groups_select_policy" ON groups
      FOR SELECT USING (
        deleted_at IS NULL AND
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Admins can see all groups in organization
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          -- Teachers can see their assigned groups
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'teacher' 
            AND auth.uid() = ANY(teacher_ids) THEN true
          -- Students can see their enrolled groups
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'student' 
            AND auth.uid() = ANY(student_ids) THEN true
          ELSE false
        END
      );
    `,
    description: 'Group access: admin full access, teacher assignment-based, student enrollment-based'
  },

  // Home Tasks Table Policies (Student App Specific)
  {
    table: 'home_tasks',
    policy_name: 'home_tasks_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "home_tasks_select_policy" ON home_tasks
      FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Students can see their own tasks
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'student' 
            AND student_id = auth.uid() THEN true
          -- Admins can see all tasks in organization
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          -- Teachers can see tasks for their students
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'teacher' THEN
            EXISTS (
              SELECT 1 FROM groups g 
              WHERE g.organization_id = home_tasks.organization_id
                AND auth.uid() = ANY(g.teacher_ids)
                AND home_tasks.student_id = ANY(g.student_ids)
                AND g.deleted_at IS NULL
            )
          ELSE false
        END
      );
    `,
    description: 'Home task access: student own tasks, admin full access, teacher group-based access'
  },

  {
    table: 'home_tasks',
    policy_name: 'home_tasks_update_policy',
    policy_type: 'UPDATE',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "home_tasks_update_policy" ON home_tasks
      FOR UPDATE USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Students can update their task completion and answers
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'student' 
            AND student_id = auth.uid() THEN true
          -- Admins can update all tasks
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          -- Teachers can update tasks for their students (grading, feedback)
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'teacher' THEN
            EXISTS (
              SELECT 1 FROM groups g 
              WHERE g.organization_id = home_tasks.organization_id
                AND auth.uid() = ANY(g.teacher_ids)
                AND home_tasks.student_id = ANY(g.student_ids)
                AND g.deleted_at IS NULL
            )
          ELSE false
        END
      );
    `,
    description: 'Home task updates: student completion, admin full control, teacher grading'
  },

  // Vocabulary Words Table Policies
  {
    table: 'vocabulary_words',
    policy_name: 'vocabulary_words_select_policy',
    policy_type: 'SELECT',
    role_based: false,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "vocabulary_words_select_policy" ON vocabulary_words
      FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid
      );
    `,
    description: 'Vocabulary words: organization-wide access for all authenticated users'
  },

  // Student Vocabulary Table Policies (Student Progress Tracking)
  {
    table: 'student_vocabulary',
    policy_name: 'student_vocabulary_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "student_vocabulary_select_policy" ON student_vocabulary
      FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Students can see their own vocabulary progress
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'student' 
            AND student_id = auth.uid() THEN true
          -- Admins can see all vocabulary progress
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          -- Teachers can see progress for their students
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'teacher' THEN
            EXISTS (
              SELECT 1 FROM groups g 
              WHERE g.organization_id = student_vocabulary.organization_id
                AND auth.uid() = ANY(g.teacher_ids)
                AND student_vocabulary.student_id = ANY(g.student_ids)
                AND g.deleted_at IS NULL
            )
          ELSE false
        END
      );
    `,
    description: 'Student vocabulary progress: self-access, admin oversight, teacher group-based monitoring'
  },

  {
    table: 'student_vocabulary',
    policy_name: 'student_vocabulary_update_policy',
    policy_type: 'UPDATE',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "student_vocabulary_update_policy" ON student_vocabulary
      FOR UPDATE USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Students can update their own vocabulary progress
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'student' 
            AND student_id = auth.uid() THEN true
          -- Admins can update all vocabulary progress
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          -- Teachers cannot directly update student vocabulary progress (read-only for analysis)
          ELSE false
        END
      );
    `,
    description: 'Vocabulary progress updates: student self-tracking, admin override capability'
  },

  // Attendance Table Policies (Teacher App Specific)
  {
    table: 'attendance',
    policy_name: 'attendance_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "attendance_select_policy" ON attendance
      FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Students can see their own attendance
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'student' 
            AND student_id = auth.uid() THEN true
          -- Admins can see all attendance records
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          -- Teachers can see attendance for their groups
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'teacher' THEN
            EXISTS (
              SELECT 1 FROM groups g 
              WHERE g.id = attendance.group_id
                AND g.organization_id = attendance.organization_id
                AND auth.uid() = ANY(g.teacher_ids)
                AND g.deleted_at IS NULL
            )
          ELSE false
        END
      );
    `,
    description: 'Attendance access: student self-view, admin full access, teacher group-based access'
  },

  {
    table: 'attendance',
    policy_name: 'attendance_insert_policy',
    policy_type: 'INSERT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "attendance_insert_policy" ON attendance
      FOR INSERT WITH CHECK (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Admins can create attendance records
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          -- Teachers can create attendance for their groups
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'teacher' THEN
            EXISTS (
              SELECT 1 FROM groups g 
              WHERE g.id = attendance.group_id
                AND g.organization_id = attendance.organization_id
                AND auth.uid() = ANY(g.teacher_ids)
                AND attendance.student_id = ANY(g.student_ids)
                AND g.deleted_at IS NULL
            )
          ELSE false
        END
      );
    `,
    description: 'Attendance creation: admin capability, teacher group-based marking'
  },

  // Feedback Table Policies
  {
    table: 'feedback',
    policy_name: 'feedback_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "feedback_select_policy" ON feedback
      FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Users can see feedback they sent or received
          WHEN from_user_id = auth.uid() OR to_user_id = auth.uid() THEN true
          -- Admins can see all feedback in organization
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          -- Teachers can see feedback related to their groups
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'teacher' AND group_id IS NOT NULL THEN
            EXISTS (
              SELECT 1 FROM groups g 
              WHERE g.id = feedback.group_id
                AND g.organization_id = feedback.organization_id
                AND auth.uid() = ANY(g.teacher_ids)
                AND g.deleted_at IS NULL
            )
          ELSE false
        END
      );
    `,
    description: 'Feedback access: sender/recipient access, admin oversight, teacher group-based access'
  },

  // Notifications Table Policies
  {
    table: 'notifications',
    policy_name: 'notifications_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "notifications_select_policy" ON notifications
      FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        (
          -- Users can see their own notifications
          user_id = auth.uid() OR
          -- Admins can see all notifications in organization
          auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin')
        )
      );
    `,
    description: 'Notifications: personal access, admin organization-wide access'
  },

  {
    table: 'notifications',
    policy_name: 'notifications_update_policy',
    policy_type: 'UPDATE',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "notifications_update_policy" ON notifications
      FOR UPDATE USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        (
          -- Users can mark their notifications as read
          user_id = auth.uid() OR
          -- Admins can update any notifications in organization
          auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin')
        )
      );
    `,
    description: 'Notification updates: personal read status, admin full control'
  },

  // Rankings Table Policies
  {
    table: 'rankings',
    policy_name: 'rankings_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "rankings_select_policy" ON rankings
      FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Users can see their own ranking
          WHEN user_id = auth.uid() THEN true
          -- Users can see rankings of others in their role category (leaderboard visibility)
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = user_type THEN true
          -- Admins can see all rankings
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          ELSE false
        END
      );
    `,
    description: 'Rankings: self-access, peer leaderboards, admin full access'
  },

  // Rewards Table Policies
  {
    table: 'rewards',
    policy_name: 'rewards_select_policy',
    policy_type: 'SELECT',
    role_based: false,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "rewards_select_policy" ON rewards
      FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        is_available = true
      );
    `,
    description: 'Rewards: organization-wide visibility for available rewards'
  },

  // Student Rewards Table Policies
  {
    table: 'student_rewards',
    policy_name: 'student_rewards_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "student_rewards_select_policy" ON student_rewards
      FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        (
          -- Students can see their own reward redemptions
          student_id = auth.uid() OR
          -- Admins can see all reward redemptions
          auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin')
        )
      );
    `,
    description: 'Student rewards: personal redemption history, admin oversight'
  },

  // Extra Lesson Requests Table Policies
  {
    table: 'extra_lesson_requests',
    policy_name: 'extra_lesson_requests_select_policy',
    policy_type: 'SELECT',
    role_based: true,
    organization_isolated: true,
    soft_delete_aware: false,
    sql: `
      CREATE POLICY "extra_lesson_requests_select_policy" ON extra_lesson_requests
      FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid AND
        CASE 
          -- Students can see their own requests
          WHEN student_id = auth.uid() THEN true
          -- Assigned teachers can see their assigned requests
          WHEN teacher_id = auth.uid() THEN true
          -- Admins can see all requests
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'superadmin') THEN true
          -- All teachers can see unassigned requests in their organization
          WHEN auth.jwt() ->> 'user_metadata' ->> 'role' = 'teacher' AND teacher_id IS NULL THEN true
          ELSE false
        END
      );
    `,
    description: 'Extra lesson requests: student own requests, teacher assignments, admin full access'
  }
];

/**
 * Performance Optimization Recommendations for RLS Policies
 */
export const PERFORMANCE_OPTIMIZATIONS = {
  indexes: [
    {
      table: 'profiles',
      columns: ['organization_id', 'role', 'deleted_at'],
      type: 'btree',
      purpose: 'Optimize role-based organization queries'
    },
    {
      table: 'groups',
      columns: ['organization_id', 'teacher_ids'],
      type: 'gin',
      purpose: 'Optimize teacher-group relationship queries'
    },
    {
      table: 'groups', 
      columns: ['organization_id', 'student_ids'],
      type: 'gin',
      purpose: 'Optimize student-group relationship queries'
    },
    {
      table: 'students',
      columns: ['organization_id', 'deleted_at'],
      type: 'btree',
      purpose: 'Optimize student organization queries'
    },
    {
      table: 'teachers',
      columns: ['organization_id', 'deleted_at'],
      type: 'btree',
      purpose: 'Optimize teacher organization queries'
    },
    {
      table: 'home_tasks',
      columns: ['organization_id', 'student_id'],
      type: 'btree',
      purpose: 'Optimize student task queries'
    },
    {
      table: 'attendance',
      columns: ['organization_id', 'group_id', 'date'],
      type: 'btree',
      purpose: 'Optimize attendance queries by group and date'
    },
    {
      table: 'notifications',
      columns: ['organization_id', 'user_id', 'created_at'],
      type: 'btree',
      purpose: 'Optimize notification queries'
    },
    {
      table: 'rankings',
      columns: ['organization_id', 'user_type', 'rank'],
      type: 'btree',
      purpose: 'Optimize leaderboard queries'
    }
  ],
  
  materializedViews: [
    {
      name: 'teacher_student_relationships',
      sql: `
        CREATE MATERIALIZED VIEW teacher_student_relationships AS
        SELECT DISTINCT 
          g.organization_id,
          unnest(g.teacher_ids) as teacher_id,
          unnest(g.student_ids) as student_id,
          g.id as group_id
        FROM groups g
        WHERE g.deleted_at IS NULL
        WITH DATA;
      `,
      purpose: 'Pre-compute teacher-student relationships for faster policy evaluation',
      refreshStrategy: 'ON_GROUP_CHANGES'
    }
  ],

  functions: [
    {
      name: 'is_teacher_of_student',
      sql: `
        CREATE OR REPLACE FUNCTION is_teacher_of_student(teacher_uuid uuid, student_uuid uuid)
        RETURNS boolean
        LANGUAGE sql
        SECURITY DEFINER
        STABLE
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM teacher_student_relationships
            WHERE teacher_id = teacher_uuid 
              AND student_id = student_uuid
              AND organization_id = (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid
          );
        $$;
      `,
      purpose: 'Optimized function for teacher-student relationship checks'
    }
  ]
};

/**
 * Security Audit Recommendations
 */
export const SECURITY_RECOMMENDATIONS = {
  auditTriggers: [
    {
      table: 'students',
      trigger_name: 'audit_student_changes',
      purpose: 'Track all student data modifications for compliance'
    },
    {
      table: 'teachers', 
      trigger_name: 'audit_teacher_changes',
      purpose: 'Track all teacher data modifications for compliance'
    },
    {
      table: 'groups',
      trigger_name: 'audit_group_changes',
      purpose: 'Track group enrollment changes for compliance'
    }
  ],
  
  encryptionFields: [
    'profiles.phone',
    'students.phone', 
    'teachers.phone',
    'students.date_of_birth'
  ],
  
  sensitiveDataHandling: {
    pii_fields: [
      'profiles.email',
      'students.email', 
      'teachers.email',
      'profiles.name',
      'students.name',
      'teachers.name'
    ],
    retention_policy: '7 years after account deletion',
    anonymization_strategy: 'Replace with hashed identifiers'
  }
};

/**
 * Testing Utilities for RLS Policies
 */
export const RLS_TESTING_QUERIES = {
  testOrganizationIsolation: `
    -- Test that users can only see data from their organization
    SELECT 
      'organizations' as table_name,
      count(*) as visible_records,
      count(DISTINCT organization_id) as organizations_visible
    FROM organizations
    UNION ALL
    SELECT 
      'students' as table_name,
      count(*) as visible_records, 
      count(DISTINCT organization_id) as organizations_visible
    FROM students;
  `,
  
  testRoleBasedAccess: `
    -- Test role-based access controls
    WITH current_user_info AS (
      SELECT 
        auth.uid() as user_id,
        auth.jwt() ->> 'user_metadata' ->> 'role' as user_role,
        (auth.jwt() ->> 'user_metadata' ->> 'organization_id')::uuid as org_id
    )
    SELECT 
      'profiles' as table_name,
      count(*) as accessible_records,
      array_agg(DISTINCT role) as roles_visible
    FROM profiles, current_user_info
    GROUP BY table_name;
  `
};

export default RLS_POLICIES;