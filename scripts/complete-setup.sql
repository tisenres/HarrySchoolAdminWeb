-- Complete Setup Script for Harry School Student App
-- Run this in Supabase SQL Editor

-- 1. Create student_profiles table if not exists
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
    deleted_by UUID,
    UNIQUE(student_id)
);

-- 2. Create hometasks table if not exists
CREATE TABLE IF NOT EXISTS hometasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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

-- 3. Create student_hometask_submissions table if not exists
CREATE TABLE IF NOT EXISTS student_hometask_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_organization ON student_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_student ON student_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_username ON student_profiles(username);
CREATE INDEX IF NOT EXISTS idx_hometasks_organization ON hometasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_hometasks_group ON hometasks(group_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON student_hometask_submissions(student_id);

-- 5. Insert student profiles for existing students
DO $$
DECLARE
    org_id UUID := 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c';
    student_rec RECORD;
    profile_count INTEGER := 0;
BEGIN
    -- Create profiles for John, Sarah, and Demo
    FOR student_rec IN 
        SELECT * FROM students 
        WHERE organization_id = org_id 
        AND email IN ('john.smith@harry-school.test', 'sarah.johnson@harry-school.test', 'demo@harry-school.test')
    LOOP
        -- Check if profile exists
        IF NOT EXISTS (SELECT 1 FROM student_profiles WHERE student_id = student_rec.id) THEN
            INSERT INTO student_profiles (
                student_id,
                organization_id,
                username,
                password_visible,
                is_minor,
                vocabulary_daily_goal,
                is_active
            ) VALUES (
                student_rec.id,
                org_id,
                CASE 
                    WHEN student_rec.email = 'john.smith@harry-school.test' THEN 'student1'
                    WHEN student_rec.email = 'sarah.johnson@harry-school.test' THEN 'student2'
                    WHEN student_rec.email = 'demo@harry-school.test' THEN 'demo_student'
                END,
                CASE 
                    WHEN student_rec.email = 'demo@harry-school.test' THEN 'Demo2025!'
                    ELSE 'Harry2025!'
                END,
                EXTRACT(YEAR FROM AGE(student_rec.date_of_birth)) < 18,
                5,
                true
            );
            profile_count := profile_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Created % student profiles', profile_count;
END $$;

-- 6. Insert sample homework
INSERT INTO hometasks (
    organization_id,
    group_id,
    title,
    instructions,
    due_date,
    points_value,
    task_type,
    difficulty_level,
    is_published
)
SELECT 
    'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c',
    g.id,
    'Practice Essay: My Daily Routine',
    'Write a 150-word essay describing your daily routine. Use present simple tense.',
    NOW() + INTERVAL '5 days',
    20,
    'written',
    2,
    true
FROM groups g
WHERE g.organization_id = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'
LIMIT 1;

-- 7. Create sample vocabulary words (simplified schema)
INSERT INTO vocabulary_words (
    organization_id,
    word,
    part_of_speech,
    phonetics,
    example_sentence,
    translation_uzbek,
    translation_russian,
    difficulty_level,
    is_active
) VALUES 
    ('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c', 'Accomplish', 'verb', '/əˈkʌmplɪʃ/', 'She hopes to accomplish her goals this year.', 'erishmoq', 'достигать', 2, true),
    ('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c', 'Brilliant', 'adjective', '/ˈbrɪljənt/', 'That was a brilliant idea!', 'ajoyib', 'блестящий', 1, true),
    ('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c', 'Challenge', 'noun', '/ˈtʃælɪndʒ/', 'Learning a new language is a challenge.', 'qiyinchilik', 'вызов', 2, true)
ON CONFLICT (organization_id, word) DO NOTHING;

-- 8. Display created credentials
SELECT 
    s.first_name || ' ' || s.last_name AS full_name,
    s.email,
    s.student_id,
    sp.username,
    sp.password_visible AS password
FROM students s
LEFT JOIN student_profiles sp ON sp.student_id = s.id
WHERE s.organization_id = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'
AND s.email IN ('john.smith@harry-school.test', 'sarah.johnson@harry-school.test', 'demo@harry-school.test');

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Setup complete! Tables created and test data inserted.';
    RAISE NOTICE '📱 Use /api/auth/student-simple for authentication';
    RAISE NOTICE '📝 Test with email or username from the results above';
END $$;