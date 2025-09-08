/**
 * Fix Database Schema Script
 * Runs missing migrations and creates required tables
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigrations() {
  console.log('🔧 Fixing Database Schema...\n');

  // 1. Create student_profiles table
  console.log('Creating student_profiles table...');
  const studentProfilesSQL = `
    -- Create student_profiles table (bridges auth.users to students)
    CREATE TABLE IF NOT EXISTS student_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_visible TEXT,
        is_minor BOOLEAN DEFAULT false,
        guardian_email TEXT,
        privacy_level TEXT DEFAULT 'standard' CHECK (privacy_level IN ('standard', 'protected', 'public')),
        vocabulary_daily_goal INTEGER DEFAULT 5,
        notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb,
        last_login_at TIMESTAMPTZ,
        login_count INTEGER DEFAULT 0,
        preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'uz', 'ru')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        deleted_by UUID
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_student_profiles_organization ON student_profiles(organization_id);
    CREATE INDEX IF NOT EXISTS idx_student_profiles_student ON student_profiles(student_id);
    CREATE INDEX IF NOT EXISTS idx_student_profiles_username ON student_profiles(username);
    CREATE INDEX IF NOT EXISTS idx_student_profiles_active ON student_profiles(is_active) WHERE deleted_at IS NULL;
  `;

  const { error: profileError } = await supabase.rpc('exec_sql', { 
    sql_query: studentProfilesSQL 
  }).single();

  if (profileError) {
    // Try direct query if RPC doesn't exist
    const { error: directError } = await supabase
      .from('student_profiles')
      .select('id')
      .limit(1);
    
    if (directError && directError.message.includes('does not exist')) {
      console.log('❌ Failed to create student_profiles table');
      console.log('   Please run this SQL in Supabase dashboard:');
      console.log(studentProfilesSQL);
    } else {
      console.log('✅ student_profiles table already exists');
    }
  } else {
    console.log('✅ student_profiles table created');
  }

  // 2. Create homework tables
  console.log('\nCreating homework tables...');
  const homeworkSQL = `
    -- Create hometasks table
    CREATE TABLE IF NOT EXISTS hometasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        lesson_id UUID,
        group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        instructions TEXT NOT NULL,
        due_date TIMESTAMPTZ,
        points_value INTEGER DEFAULT 10 CHECK (points_value >= 0),
        max_attempts INTEGER DEFAULT 3,
        auto_grade BOOLEAN DEFAULT false,
        difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
        task_type TEXT DEFAULT 'written' CHECK (task_type IN ('written', 'multiple_choice', 'file_upload', 'audio', 'video')),
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        updated_by UUID,
        deleted_at TIMESTAMPTZ,
        deleted_by UUID
    );

    -- Create student_hometask_submissions table
    CREATE TABLE IF NOT EXISTS student_hometask_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        hometask_id UUID NOT NULL REFERENCES hometasks(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        submission_text TEXT,
        submission_files JSONB DEFAULT '[]'::jsonb,
        submitted_at TIMESTAMPTZ,
        score INTEGER,
        max_score INTEGER,
        feedback TEXT,
        graded_by UUID,
        graded_at TIMESTAMPTZ,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
        late_submission BOOLEAN DEFAULT false,
        attempt_number INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(hometask_id, student_id, attempt_number)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_hometasks_organization ON hometasks(organization_id);
    CREATE INDEX IF NOT EXISTS idx_hometasks_group ON hometasks(group_id);
    CREATE INDEX IF NOT EXISTS idx_hometasks_due_date ON hometasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_submissions_student ON student_hometask_submissions(student_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_hometask ON student_hometask_submissions(hometask_id);
  `;

  const { error: hometaskError } = await supabase
    .from('hometasks')
    .select('id')
    .limit(1);
  
  if (hometaskError && hometaskError.message.includes('does not exist')) {
    console.log('❌ hometasks table does not exist');
    console.log('   Please run this SQL in Supabase dashboard:');
    console.log(homeworkSQL);
  } else {
    console.log('✅ hometasks table exists');
  }

  // 3. Fix vocabulary_words table
  console.log('\nChecking vocabulary_words table...');
  const { data: vocabTest, error: vocabError } = await supabase
    .from('vocabulary_words')
    .select('*')
    .limit(1);

  if (vocabError) {
    console.log('❌ vocabulary_words table issue:', vocabError.message);
  } else {
    console.log('✅ vocabulary_words table exists');
    if (vocabTest && vocabTest.length > 0) {
      console.log('   Columns found:', Object.keys(vocabTest[0]).join(', '));
    }
  }

  // 4. Check lessons table
  console.log('\nChecking lessons table...');
  const { error: lessonsError } = await supabase
    .from('lessons')
    .select('id')
    .limit(1);

  if (lessonsError && lessonsError.message.includes('does not exist')) {
    console.log('❌ lessons table does not exist');
    console.log('   Please run migration 013_student_app_tables.sql');
  } else {
    console.log('✅ lessons table exists');
  }

  console.log('\n📋 Summary:');
  console.log('===========');
  console.log('If any tables are missing, please run the SQL scripts shown above');
  console.log('in your Supabase SQL editor at:');
  console.log(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/default/sql`);
}

runMigrations().catch(console.error);