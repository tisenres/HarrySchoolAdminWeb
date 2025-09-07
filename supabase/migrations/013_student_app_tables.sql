-- Migration: Student App Required Tables  
-- Description: Creates tables needed for student mobile application
-- Version: 013
-- Author: Claude Code
-- Date: 2025-01-20

-- Create lessons table if not exists
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB DEFAULT '{}'::jsonb,
    materials JSONB DEFAULT '[]'::jsonb,
    objectives TEXT[],
    order_index INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 60,
    lesson_type TEXT DEFAULT 'regular' CHECK (lesson_type IN ('regular', 'review', 'test', 'project')),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Create hometasks table if not exists
CREATE TABLE IF NOT EXISTS hometasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
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
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Create student_hometask_submissions table if not exists
CREATE TABLE IF NOT EXISTS student_hometask_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    hometask_id UUID NOT NULL REFERENCES hometasks(id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    submission_text TEXT,
    submission_files JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    score INTEGER CHECK (score >= 0),
    max_score INTEGER,
    feedback TEXT,
    graded_by UUID REFERENCES teachers(id),
    graded_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded', 'returned', 'late')),
    late_submission BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, hometask_id, attempt_number)
);

-- Create vocabulary_words table if not exists
CREATE TABLE IF NOT EXISTS vocabulary_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    part_of_speech TEXT CHECK (part_of_speech IN ('noun', 'verb', 'adjective', 'adverb', 'phrase', 'idiom')),
    phonetics TEXT, -- IPA pronunciation
    example_sentence TEXT,
    translation_uzbek TEXT,
    translation_russian TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    category TEXT DEFAULT 'general',
    image_url TEXT,
    audio_url TEXT,
    synonyms TEXT[],
    antonyms TEXT[],
    usage_frequency INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    UNIQUE(organization_id, word)
);

-- Create student_vocabulary_progress table if not exists
CREATE TABLE IF NOT EXISTS student_vocabulary_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    word_id UUID NOT NULL REFERENCES vocabulary_words(id) ON DELETE CASCADE,
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 100),
    is_favorite BOOLEAN DEFAULT false,
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    last_reviewed TIMESTAMPTZ,
    next_review TIMESTAMPTZ,
    streak_count INTEGER DEFAULT 0,
    difficulty_rating INTEGER DEFAULT 3 CHECK (difficulty_rating BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, word_id)
);

-- Create schedules table if not exists (for individual student schedules)
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    is_online BOOLEAN DEFAULT false,
    meeting_url TEXT,
    is_recurring BOOLEAN DEFAULT true,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Create referrals table if not exists
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    referrer_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE NOT NULL,
    referred_email TEXT,
    referred_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    referred_name TEXT,
    referred_phone TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
    points_earned INTEGER DEFAULT 0,
    bonus_awarded BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create referral_rewards table if not exists
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reward_type TEXT DEFAULT 'points' CHECK (reward_type IN ('points', 'discount', 'free_lesson', 'certificate')),
    reward_value INTEGER NOT NULL,
    reward_description TEXT,
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
-- Lessons indexes
CREATE INDEX idx_lessons_organization ON lessons(organization_id);
CREATE INDEX idx_lessons_group ON lessons(group_id);
CREATE INDEX idx_lessons_published ON lessons(is_published) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_order ON lessons(order_index);

-- Hometasks indexes
CREATE INDEX idx_hometasks_organization ON hometasks(organization_id);
CREATE INDEX idx_hometasks_group ON hometasks(group_id);
CREATE INDEX idx_hometasks_lesson ON hometasks(lesson_id);
CREATE INDEX idx_hometasks_due_date ON hometasks(due_date);
CREATE INDEX idx_hometasks_published ON hometasks(is_published) WHERE deleted_at IS NULL;

-- Submissions indexes
CREATE INDEX idx_submissions_student_status ON student_hometask_submissions(student_id, status);
CREATE INDEX idx_submissions_hometask ON student_hometask_submissions(hometask_id);
CREATE INDEX idx_submissions_submitted ON student_hometask_submissions(submitted_at);
CREATE INDEX idx_submissions_graded ON student_hometask_submissions(graded_at);

-- Vocabulary indexes
CREATE INDEX idx_vocabulary_organization ON vocabulary_words(organization_id);
CREATE INDEX idx_vocabulary_difficulty ON vocabulary_words(difficulty_level);
CREATE INDEX idx_vocabulary_category ON vocabulary_words(category);
CREATE INDEX idx_vocabulary_active ON vocabulary_words(is_active) WHERE deleted_at IS NULL;

-- Progress indexes
CREATE INDEX idx_vocabulary_progress_student ON student_vocabulary_progress(student_id);
CREATE INDEX idx_vocabulary_progress_mastery ON student_vocabulary_progress(mastery_level);
CREATE INDEX idx_vocabulary_progress_review ON student_vocabulary_progress(next_review);
CREATE INDEX idx_vocabulary_progress_favorite ON student_vocabulary_progress(is_favorite) WHERE is_favorite = true;

-- Schedule indexes
CREATE INDEX idx_schedules_student_day ON schedules(student_id, day_of_week);
CREATE INDEX idx_schedules_group ON schedules(group_id);
CREATE INDEX idx_schedules_valid_period ON schedules(valid_from, valid_until);

-- Referral indexes
CREATE INDEX idx_referrals_referrer ON referrals(referrer_student_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_expires ON referrals(expires_at);

-- Enable RLS on all new tables
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hometasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_hometask_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_vocabulary_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_lessons_updated_at 
    BEFORE UPDATE ON lessons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hometasks_updated_at 
    BEFORE UPDATE ON hometasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at 
    BEFORE UPDATE ON student_hometask_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vocabulary_updated_at 
    BEFORE UPDATE ON vocabulary_words 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vocabulary_progress_updated_at 
    BEFORE UPDATE ON student_vocabulary_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at 
    BEFORE UPDATE ON schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at 
    BEFORE UPDATE ON referrals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_rewards_updated_at 
    BEFORE UPDATE ON referral_rewards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate next vocabulary review date based on mastery level
CREATE OR REPLACE FUNCTION calculate_next_review(mastery_level INTEGER, correct_streak INTEGER)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    -- Spaced repetition algorithm
    -- Higher mastery = longer intervals
    CASE 
        WHEN mastery_level <= 20 THEN RETURN NOW() + INTERVAL '1 day';
        WHEN mastery_level <= 40 THEN RETURN NOW() + INTERVAL '3 days';
        WHEN mastery_level <= 60 THEN RETURN NOW() + INTERVAL '7 days';
        WHEN mastery_level <= 80 THEN RETURN NOW() + INTERVAL '14 days';
        ELSE RETURN NOW() + INTERVAL '30 days';
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comments for documentation
COMMENT ON TABLE lessons IS 'Lesson content for groups - can be viewed by enrolled students';
COMMENT ON TABLE hometasks IS 'Homework assignments for students in groups';
COMMENT ON TABLE student_hometask_submissions IS 'Student homework submissions with grading';
COMMENT ON TABLE vocabulary_words IS 'Vocabulary database for language learning';
COMMENT ON TABLE student_vocabulary_progress IS 'Individual student progress on vocabulary items';
COMMENT ON TABLE schedules IS 'Individual student class schedules';
COMMENT ON TABLE referrals IS 'Student referral system for new student acquisition';
COMMENT ON TABLE referral_rewards IS 'Rewards earned from successful referrals';

COMMENT ON FUNCTION calculate_next_review IS 'Calculate next review date for vocabulary using spaced repetition';