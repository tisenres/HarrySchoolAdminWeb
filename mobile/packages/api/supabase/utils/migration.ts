/**
 * Database Migration Utilities for Harry School Mobile Apps
 * 
 * Provides utilities for generating SQL migrations, database schema validation,
 * and educational context-aware migration strategies.
 */

import type { Database } from '../types/database';
import { RLS_POLICIES, PERFORMANCE_OPTIMIZATIONS } from '../policies';

/**
 * Migration types and interfaces
 */
export interface MigrationStep {
  id: string;
  description: string;
  sql: string;
  rollback?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  educational_context?: string;
}

export interface MigrationPlan {
  version: string;
  description: string;
  steps: MigrationStep[];
  dependencies: string[];
  educational_features: string[];
  estimated_duration: number;
}

/**
 * Generate comprehensive SQL migration for Harry School database
 */
export function generateMigrationSQL(options: {
  version: string;
  includeRLS?: boolean;
  includeIndexes?: boolean;
  includeConstraints?: boolean;
  includeTriggers?: boolean;
  includeViews?: boolean;
  target_environment?: 'development' | 'staging' | 'production';
}): MigrationPlan {
  const {
    version,
    includeRLS = true,
    includeIndexes = true,
    includeConstraints = true,
    includeTriggers = true,
    includeViews = true,
    target_environment = 'production'
  } = options;

  const steps: MigrationStep[] = [];

  // Step 1: Create core tables
  steps.push({
    id: 'create_core_tables',
    description: 'Create core educational tables (organizations, profiles, students, teachers, groups)',
    priority: 'critical',
    educational_context: 'foundation',
    sql: generateCoreTablesSQL(),
    rollback: generateCoreTablesRollback()
  });

  // Step 2: Create educational feature tables
  steps.push({
    id: 'create_educational_tables',
    description: 'Create educational feature tables (tasks, vocabulary, attendance, feedback)',
    priority: 'high',
    educational_context: 'learning_management',
    sql: generateEducationalTablesSQL(),
    rollback: generateEducationalTablesRollback()
  });

  // Step 3: Create ranking and reward tables
  steps.push({
    id: 'create_gamification_tables',
    description: 'Create gamification tables (rankings, rewards, achievements)',
    priority: 'medium',
    educational_context: 'gamification',
    sql: generateGamificationTablesSQL(),
    rollback: generateGamificationTablesRollback()
  });

  // Step 4: Add constraints and foreign keys
  if (includeConstraints) {
    steps.push({
      id: 'add_constraints',
      description: 'Add foreign key constraints and check constraints',
      priority: 'high',
      educational_context: 'data_integrity',
      sql: generateConstraintsSQL(),
      rollback: generateConstraintsRollback()
    });
  }

  // Step 5: Create indexes for performance
  if (includeIndexes) {
    steps.push({
      id: 'create_indexes',
      description: 'Create performance indexes for educational queries',
      priority: 'medium',
      educational_context: 'performance',
      sql: generateIndexesSQL(),
      rollback: generateIndexesRollback()
    });
  }

  // Step 6: Create functions and triggers
  if (includeTriggers) {
    steps.push({
      id: 'create_functions_triggers',
      description: 'Create educational business logic functions and triggers',
      priority: 'high',
      educational_context: 'business_logic',
      sql: generateFunctionsTriggersSQL(),
      rollback: generateFunctionsTriggersRollback()
    });
  }

  // Step 7: Create materialized views
  if (includeViews) {
    steps.push({
      id: 'create_views',
      description: 'Create materialized views for educational analytics',
      priority: 'low',
      educational_context: 'analytics',
      sql: generateViewsSQL(),
      rollback: generateViewsRollback()
    });
  }

  // Step 8: Enable Row Level Security
  if (includeRLS) {
    steps.push({
      id: 'enable_rls',
      description: 'Enable Row Level Security and create educational RLS policies',
      priority: 'critical',
      educational_context: 'security',
      sql: generateRLSSQL(),
      rollback: generateRLSRollback()
    });
  }

  // Step 9: Insert seed data for development/staging
  if (target_environment !== 'production') {
    steps.push({
      id: 'insert_seed_data',
      description: 'Insert educational seed data for testing',
      priority: 'low',
      educational_context: 'testing',
      sql: generateSeedDataSQL(),
      rollback: generateSeedDataRollback()
    });
  }

  return {
    version,
    description: `Harry School Educational Database Migration v${version}`,
    steps,
    dependencies: [],
    educational_features: [
      'multi_tenant_organizations',
      'role_based_access_control',
      'student_teacher_management',
      'group_enrollment_system',
      'task_assignment_tracking',
      'vocabulary_learning_system',
      'attendance_management',
      'feedback_system',
      'ranking_gamification',
      'reward_system',
      'real_time_notifications'
    ],
    estimated_duration: calculateEstimatedDuration(steps)
  };
}

/**
 * Generate core tables SQL
 */
function generateCoreTablesSQL(): string {
  return `
-- Organizations table (multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 200),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (unified user management)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin', 'superadmin')),
  avatar_url TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'ru', 'uz')),
  notification_preferences JSONB DEFAULT '{
    "push_enabled": true,
    "email_enabled": true,
    "ranking_updates": true,
    "group_updates": true,
    "feedback_received": true
  }',
  app_preferences JSONB DEFAULT '{
    "theme": "auto",
    "sound_enabled": true,
    "haptic_feedback": true
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_by UUID REFERENCES profiles(id)
);

-- Students table (educational context)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
  phone TEXT CHECK (phone IS NULL OR length(phone) >= 10),
  date_of_birth DATE,
  group_ids UUID[] DEFAULT '{}',
  ranking_points INTEGER DEFAULT 0 CHECK (ranking_points >= 0),
  ranking_coins INTEGER DEFAULT 0 CHECK (ranking_coins >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  avatar_url TEXT,
  referral_code TEXT UNIQUE DEFAULT upper(substring(md5(random()::text) from 1 for 8)),
  referrals_count INTEGER DEFAULT 0 CHECK (referrals_count >= 0),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_by UUID REFERENCES profiles(id)
);

-- Teachers table (educational context)
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
  phone TEXT CHECK (phone IS NULL OR length(phone) >= 10),
  specializations TEXT[] DEFAULT '{}' CHECK (array_length(specializations, 1) > 0),
  group_ids UUID[] DEFAULT '{}',
  ranking_points INTEGER DEFAULT 0 CHECK (ranking_points >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  avatar_url TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_by UUID REFERENCES profiles(id)
);

-- Groups table (classes/courses)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  description TEXT CHECK (description IS NULL OR length(description) <= 500),
  level TEXT CHECK (level IS NULL OR length(level) <= 20),
  subject TEXT NOT NULL CHECK (length(subject) >= 2 AND length(subject) <= 50),
  teacher_ids UUID[] DEFAULT '{}',
  student_ids UUID[] DEFAULT '{}',
  schedule JSONB NOT NULL DEFAULT '{}',
  classroom TEXT CHECK (classroom IS NULL OR length(classroom) <= 50),
  max_students INTEGER DEFAULT 30 CHECK (max_students > 0 AND max_students <= 100),
  current_enrollment INTEGER GENERATED ALWAYS AS (array_length(student_ids, 1)) STORED,
  start_date DATE NOT NULL,
  end_date DATE CHECK (end_date IS NULL OR end_date > start_date),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_by UUID REFERENCES profiles(id)
);
`;
}

/**
 * Generate educational tables SQL
 */
function generateEducationalTablesSQL(): string {
  return `
-- Home tasks table (assignments)
CREATE TABLE IF NOT EXISTS home_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 2 AND length(title) <= 200),
  description TEXT NOT NULL CHECK (length(description) >= 10 AND length(description) <= 1000),
  task_type TEXT NOT NULL CHECK (task_type IN ('text', 'quiz', 'speaking', 'listening', 'writing')),
  content JSONB NOT NULL DEFAULT '{}',
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  feedback TEXT CHECK (feedback IS NULL OR length(feedback) <= 1000),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Vocabulary words table
CREATE TABLE IF NOT EXISTS vocabulary_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL CHECK (length(word) >= 1 AND length(word) <= 100),
  translation TEXT NOT NULL CHECK (length(translation) >= 1 AND length(translation) <= 200),
  pronunciation TEXT CHECK (pronunciation IS NULL OR length(pronunciation) <= 100),
  example_sentence TEXT CHECK (example_sentence IS NULL OR length(example_sentence) <= 500),
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  category TEXT NOT NULL CHECK (length(category) >= 1 AND length(category) <= 50),
  audio_url TEXT,
  image_url TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student vocabulary progress
CREATE TABLE IF NOT EXISTS student_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  is_learned BOOLEAN DEFAULT FALSE,
  practice_count INTEGER DEFAULT 0 CHECK (practice_count >= 0),
  last_practiced TIMESTAMPTZ,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 3),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, word_id)
);

-- Attendance tracking
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 500),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(student_id, group_id, date)
);

-- Feedback system
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'constructive', 'concern')),
  subject TEXT NOT NULL CHECK (length(subject) >= 2 AND length(subject) <= 200),
  content TEXT NOT NULL CHECK (length(content) >= 10 AND length(content) <= 2000),
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  is_read BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  message TEXT NOT NULL CHECK (length(message) >= 1 AND length(message) <= 1000),
  type TEXT NOT NULL CHECK (type IN ('ranking', 'feedback', 'task', 'attendance', 'general')),
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  is_push_sent BOOLEAN DEFAULT FALSE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;
}

/**
 * Generate gamification tables SQL
 */
function generateGamificationTablesSQL(): string {
  return `
-- Rankings table
CREATE TABLE IF NOT EXISTS rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'teacher')),
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  coins INTEGER DEFAULT 0 CHECK (coins >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  rank INTEGER CHECK (rank > 0),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, user_type, organization_id)
);

-- Rewards catalog
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  description TEXT NOT NULL CHECK (length(description) >= 10 AND length(description) <= 500),
  cost_coins INTEGER NOT NULL CHECK (cost_coins > 0),
  category TEXT NOT NULL CHECK (category IN ('physical', 'digital', 'privilege')),
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student reward redemptions
CREATE TABLE IF NOT EXISTS student_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 500),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Extra lesson requests
CREATE TABLE IF NOT EXISTS extra_lesson_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  subject TEXT NOT NULL CHECK (length(subject) >= 2 AND length(subject) <= 50),
  description TEXT NOT NULL CHECK (length(description) >= 10 AND length(description) <= 1000),
  preferred_schedule JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'scheduled', 'completed')),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 500),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;
}

/**
 * Generate constraints SQL
 */
function generateConstraintsSQL(): string {
  return `
-- Add foreign key constraints with proper cascading
-- These are mostly already included in table definitions above, but here are additional constraints

-- Ensure teachers are assigned to their groups
ALTER TABLE groups ADD CONSTRAINT check_teacher_group_consistency 
  CHECK (teacher_ids <@ (SELECT array_agg(id) FROM teachers WHERE organization_id = groups.organization_id));

-- Ensure students are enrolled in their groups  
ALTER TABLE groups ADD CONSTRAINT check_student_group_consistency
  CHECK (student_ids <@ (SELECT array_agg(id) FROM students WHERE organization_id = groups.organization_id));

-- Ensure attendance records match group membership
ALTER TABLE attendance ADD CONSTRAINT check_attendance_group_membership
  CHECK (EXISTS (
    SELECT 1 FROM groups 
    WHERE id = attendance.group_id 
    AND attendance.student_id = ANY(student_ids)
    AND organization_id = attendance.organization_id
  ));

-- Ensure home tasks are assigned to students
ALTER TABLE home_tasks ADD CONSTRAINT check_task_student_organization
  CHECK (EXISTS (
    SELECT 1 FROM students 
    WHERE id = home_tasks.student_id 
    AND organization_id = home_tasks.organization_id
    AND deleted_at IS NULL
  ));

-- Ensure vocabulary progress belongs to valid students and words
ALTER TABLE student_vocabulary ADD CONSTRAINT check_vocabulary_organization
  CHECK (EXISTS (
    SELECT 1 FROM students s, vocabulary_words w
    WHERE s.id = student_vocabulary.student_id 
    AND w.id = student_vocabulary.word_id
    AND s.organization_id = student_vocabulary.organization_id
    AND w.organization_id = student_vocabulary.organization_id
  ));
`;
}

/**
 * Generate RLS SQL
 */
function generateRLSSQL(): string {
  let rlsSQL = `
-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_lesson_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies from our policies module
`;

  // Add each RLS policy from our policies module
  RLS_POLICIES.forEach(policy => {
    rlsSQL += `\n-- ${policy.description}\n${policy.sql}\n`;
  });

  return rlsSQL;
}

/**
 * Generate indexes SQL for performance optimization
 */
function generateIndexesSQL(): string {
  let indexSQL = '-- Performance indexes for educational queries\n\n';

  PERFORMANCE_OPTIMIZATIONS.indexes.forEach(index => {
    const indexName = `idx_${index.table}_${index.columns.join('_').replace(/[^\w]/g, '_')}`;
    
    if (index.type === 'gin') {
      indexSQL += `CREATE INDEX IF NOT EXISTS ${indexName} ON ${index.table} USING GIN (${index.columns.join(', ')});\n`;
    } else {
      indexSQL += `CREATE INDEX IF NOT EXISTS ${indexName} ON ${index.table} (${index.columns.join(', ')});\n`;
    }
    
    indexSQL += `-- ${index.purpose}\n\n`;
  });

  return indexSQL;
}

/**
 * Generate functions and triggers SQL
 */
function generateFunctionsTriggersSQL(): string {
  return `
-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers for all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_home_tasks_updated_at BEFORE UPDATE ON home_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vocabulary_words_updated_at BEFORE UPDATE ON vocabulary_words FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_vocabulary_updated_at BEFORE UPDATE ON student_vocabulary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rankings_updated_at BEFORE UPDATE ON rankings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_extra_lesson_requests_updated_at BEFORE UPDATE ON extra_lesson_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update student ranking points
CREATE OR REPLACE FUNCTION update_student_ranking_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update rankings table when student points change
  INSERT INTO rankings (user_id, user_type, points, coins, level, organization_id)
  VALUES (NEW.id, 'student', NEW.ranking_points, NEW.ranking_coins, NEW.level, NEW.organization_id)
  ON CONFLICT (user_id, user_type, organization_id) 
  DO UPDATE SET 
    points = NEW.ranking_points,
    coins = NEW.ranking_coins,
    level = NEW.level,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_student_ranking_update 
  AFTER INSERT OR UPDATE OF ranking_points, ranking_coins, level ON students
  FOR EACH ROW EXECUTE FUNCTION update_student_ranking_points();

-- Function to update teacher ranking points
CREATE OR REPLACE FUNCTION update_teacher_ranking_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update rankings table when teacher points change
  INSERT INTO rankings (user_id, user_type, points, level, organization_id)
  VALUES (NEW.id, 'teacher', NEW.ranking_points, NEW.level, NEW.organization_id)
  ON CONFLICT (user_id, user_type, organization_id) 
  DO UPDATE SET 
    points = NEW.ranking_points,
    level = NEW.level,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_teacher_ranking_update 
  AFTER INSERT OR UPDATE OF ranking_points, level ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_teacher_ranking_points();

-- Function to create notification on feedback
CREATE OR REPLACE FUNCTION create_feedback_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, data, organization_id)
  VALUES (
    NEW.to_user_id,
    'New Feedback Received',
    'You have received new feedback: ' || NEW.subject,
    'feedback',
    json_build_object('feedback_id', NEW.id, 'feedback_type', NEW.feedback_type),
    NEW.organization_id
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_feedback_notification 
  AFTER INSERT ON feedback
  FOR EACH ROW EXECUTE FUNCTION create_feedback_notification();
`;
}

/**
 * Generate materialized views SQL
 */
function generateViewsSQL(): string {
  return `
-- Materialized view for teacher-student relationships (performance optimization)
${PERFORMANCE_OPTIMIZATIONS.materializedViews[0].sql}

CREATE INDEX IF NOT EXISTS idx_teacher_student_relationships_teacher ON teacher_student_relationships(teacher_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_teacher_student_relationships_student ON teacher_student_relationships(student_id, organization_id);

-- Materialized view for student analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS student_analytics AS
SELECT 
  s.id,
  s.name,
  s.organization_id,
  s.ranking_points,
  s.ranking_coins,
  s.level,
  COUNT(ht.id) as total_tasks,
  COUNT(ht.id) FILTER (WHERE ht.completed_at IS NOT NULL) as completed_tasks,
  AVG(ht.score) FILTER (WHERE ht.score IS NOT NULL) as average_score,
  COUNT(a.id) as attendance_records,
  COUNT(a.id) FILTER (WHERE a.status = 'present') as present_count,
  COUNT(sv.id) as vocabulary_words,
  COUNT(sv.id) FILTER (WHERE sv.is_learned = true) as learned_words,
  s.updated_at
FROM students s
LEFT JOIN home_tasks ht ON ht.student_id = s.id
LEFT JOIN attendance a ON a.student_id = s.id
LEFT JOIN student_vocabulary sv ON sv.student_id = s.id
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.name, s.organization_id, s.ranking_points, s.ranking_coins, s.level, s.updated_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_analytics_id ON student_analytics(id);
CREATE INDEX IF NOT EXISTS idx_student_analytics_org ON student_analytics(organization_id);

-- Materialized view for group analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS group_analytics AS
SELECT 
  g.id,
  g.name,
  g.organization_id,
  g.subject,
  g.level,
  array_length(g.student_ids, 1) as student_count,
  array_length(g.teacher_ids, 1) as teacher_count,
  COUNT(a.id) as attendance_records,
  COUNT(a.id) FILTER (WHERE a.status = 'present') as present_count,
  CASE 
    WHEN COUNT(a.id) > 0 THEN 
      ROUND((COUNT(a.id) FILTER (WHERE a.status = 'present')::decimal / COUNT(a.id)) * 100, 2)
    ELSE 0 
  END as attendance_rate,
  g.updated_at
FROM groups g
LEFT JOIN attendance a ON a.group_id = g.id
WHERE g.deleted_at IS NULL
GROUP BY g.id, g.name, g.organization_id, g.subject, g.level, g.student_ids, g.teacher_ids, g.updated_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_analytics_id ON group_analytics(id);
CREATE INDEX IF NOT EXISTS idx_group_analytics_org ON group_analytics(organization_id);
`;
}

/**
 * Generate seed data SQL (for development/testing)
 */
function generateSeedDataSQL(): string {
  return `
-- Educational seed data for development and testing

-- Insert default organization
INSERT INTO organizations (id, name, settings) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Harry School Tashkent', '{
    "timezone": "Asia/Tashkent",
    "languages": ["en", "ru", "uz"],
    "academic_year": "2024-2025"
  }')
ON CONFLICT (id) DO NOTHING;

-- Insert default vocabulary categories and words
INSERT INTO vocabulary_words (word, translation, category, difficulty_level, organization_id) VALUES
  ('hello', 'salom', 'greetings', 1, '00000000-0000-0000-0000-000000000001'),
  ('goodbye', 'xayr', 'greetings', 1, '00000000-0000-0000-0000-000000000001'),
  ('thank you', 'rahmat', 'politeness', 1, '00000000-0000-0000-0000-000000000001'),
  ('please', 'iltimos', 'politeness', 1, '00000000-0000-0000-0000-000000000001'),
  ('good morning', 'xayrli tong', 'greetings', 2, '00000000-0000-0000-0000-000000000001'),
  ('education', 'ta\'lim', 'academic', 3, '00000000-0000-0000-0000-000000000001'),
  ('knowledge', 'bilim', 'academic', 3, '00000000-0000-0000-0000-000000000001'),
  ('university', 'universitet', 'academic', 2, '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Insert default rewards
INSERT INTO rewards (name, description, cost_coins, category, organization_id) VALUES
  ('Extra Break Time', '5 additional minutes during break', 50, 'privilege', '00000000-0000-0000-0000-000000000001'),
  ('Choose Your Seat', 'Pick any seat in the classroom for a week', 75, 'privilege', '00000000-0000-0000-0000-000000000001'),
  ('Homework Pass', 'Skip one homework assignment', 100, 'privilege', '00000000-0000-0000-0000-000000000001'),
  ('Harry School Pen', 'Official Harry School branded pen', 150, 'physical', '00000000-0000-0000-0000-000000000001'),
  ('Certificate of Achievement', 'Personalized achievement certificate', 200, 'physical', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
`;
}

/**
 * Generate rollback SQL functions
 */
function generateCoreTablesRollback(): string {
  return `
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
`;
}

function generateEducationalTablesRollback(): string {
  return `
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS student_vocabulary CASCADE;
DROP TABLE IF EXISTS vocabulary_words CASCADE;
DROP TABLE IF EXISTS home_tasks CASCADE;
`;
}

function generateGamificationTablesRollback(): string {
  return `
DROP TABLE IF EXISTS extra_lesson_requests CASCADE;
DROP TABLE IF EXISTS student_rewards CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS rankings CASCADE;
`;
}

function generateConstraintsRollback(): string {
  return `
ALTER TABLE groups DROP CONSTRAINT IF EXISTS check_teacher_group_consistency;
ALTER TABLE groups DROP CONSTRAINT IF EXISTS check_student_group_consistency;
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS check_attendance_group_membership;
ALTER TABLE home_tasks DROP CONSTRAINT IF EXISTS check_task_student_organization;
ALTER TABLE student_vocabulary DROP CONSTRAINT IF EXISTS check_vocabulary_organization;
`;
}

function generateIndexesRollback(): string {
  let rollbackSQL = '-- Drop performance indexes\n\n';
  
  PERFORMANCE_OPTIMIZATIONS.indexes.forEach(index => {
    const indexName = `idx_${index.table}_${index.columns.join('_').replace(/[^\w]/g, '_')}`;
    rollbackSQL += `DROP INDEX IF EXISTS ${indexName};\n`;
  });

  return rollbackSQL;
}

function generateFunctionsTriggersRollback(): string {
  return `
-- Drop triggers
DROP TRIGGER IF EXISTS trigger_feedback_notification ON feedback;
DROP TRIGGER IF EXISTS trigger_teacher_ranking_update ON teachers;
DROP TRIGGER IF EXISTS trigger_student_ranking_update ON students;
DROP TRIGGER IF EXISTS update_extra_lesson_requests_updated_at ON extra_lesson_requests;
DROP TRIGGER IF EXISTS update_rewards_updated_at ON rewards;
DROP TRIGGER IF EXISTS update_rankings_updated_at ON rankings;
DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
DROP TRIGGER IF EXISTS update_student_vocabulary_updated_at ON student_vocabulary;
DROP TRIGGER IF EXISTS update_vocabulary_words_updated_at ON vocabulary_words;
DROP TRIGGER IF EXISTS update_home_tasks_updated_at ON home_tasks;
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Drop functions
DROP FUNCTION IF EXISTS create_feedback_notification();
DROP FUNCTION IF EXISTS update_teacher_ranking_points();
DROP FUNCTION IF EXISTS update_student_ranking_points();
DROP FUNCTION IF EXISTS update_updated_at_column();
`;
}

function generateViewsRollback(): string {
  return `
DROP MATERIALIZED VIEW IF EXISTS group_analytics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS student_analytics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS teacher_student_relationships CASCADE;
`;
}

function generateRLSRollback(): string {
  return `
-- Disable RLS on all tables
ALTER TABLE extra_lesson_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_vocabulary DISABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_words DISABLE ROW LEVEL SECURITY;
ALTER TABLE home_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies (they will be dropped automatically when RLS is disabled)
`;
}

function generateSeedDataRollback(): string {
  return `
-- Remove seed data
DELETE FROM rewards WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM vocabulary_words WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001';
`;
}

/**
 * Calculate estimated duration based on migration steps
 */
function calculateEstimatedDuration(steps: MigrationStep[]): number {
  const durations = {
    'create_core_tables': 30,
    'create_educational_tables': 45,
    'create_gamification_tables': 30,
    'add_constraints': 60,
    'create_indexes': 90,
    'create_functions_triggers': 45,
    'create_views': 120,
    'enable_rls': 60,
    'insert_seed_data': 15
  };

  return steps.reduce((total, step) => {
    return total + (durations[step.id as keyof typeof durations] || 30);
  }, 0);
}

/**
 * Validate migration plan
 */
export function validateMigrationPlan(plan: MigrationPlan): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required steps
  const requiredSteps = ['create_core_tables', 'enable_rls'];
  const planStepIds = plan.steps.map(s => s.id);
  
  for (const required of requiredSteps) {
    if (!planStepIds.includes(required)) {
      errors.push(`Missing required migration step: ${required}`);
    }
  }

  // Check step dependencies
  if (planStepIds.includes('create_educational_tables') && !planStepIds.includes('create_core_tables')) {
    errors.push('create_educational_tables depends on create_core_tables');
  }

  if (planStepIds.includes('enable_rls') && planStepIds.indexOf('enable_rls') < planStepIds.indexOf('create_core_tables')) {
    warnings.push('RLS should be enabled after creating core tables');
  }

  // Validate SQL syntax (basic checks)
  for (const step of plan.steps) {
    if (!step.sql.trim()) {
      errors.push(`Empty SQL in step: ${step.id}`);
    }
    
    if (step.sql.includes('DROP TABLE') && step.priority === 'critical') {
      warnings.push(`Critical step ${step.id} contains DROP TABLE statements`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}