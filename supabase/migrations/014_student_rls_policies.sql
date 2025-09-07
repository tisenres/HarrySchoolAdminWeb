-- Migration: Student and Teacher RLS Policies
-- Description: Row Level Security policies for student and teacher access to app tables
-- Version: 014
-- Author: Claude Code
-- Date: 2025-01-20

-- Helper functions for student and teacher identification
CREATE OR REPLACE FUNCTION get_current_student_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT student_id 
        FROM student_profiles 
        WHERE id = auth.uid() AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_teacher_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT teacher_id 
        FROM teacher_profiles 
        WHERE id = auth.uid() AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM student_profiles 
        WHERE id = auth.uid() AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM teacher_profiles 
        WHERE id = auth.uid() AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_student_organization()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM student_profiles 
        WHERE id = auth.uid() AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_teacher_organization()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM teacher_profiles 
        WHERE id = auth.uid() AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated students table policies to include student self-access
DROP POLICY IF EXISTS "Students can view their own data" ON students;
CREATE POLICY "Students can view their own data" ON students
    FOR SELECT USING (
        is_student() AND id = get_current_student_id()
    );

DROP POLICY IF EXISTS "Students can update their own contact info" ON students;
CREATE POLICY "Students can update their own contact info" ON students
    FOR UPDATE USING (
        is_student() AND id = get_current_student_id()
    )
    WITH CHECK (
        -- Only allow updating specific safe fields
        primary_phone IS NOT NULL OR 
        secondary_phone IS NOT NULL OR 
        email IS NOT NULL OR
        profile_image_url IS NOT NULL
    );

-- Lessons policies
CREATE POLICY "Students can view published lessons in their groups" ON lessons
    FOR SELECT USING (
        is_student() AND 
        is_published = true AND 
        organization_id = get_student_organization() AND
        (group_id IS NULL OR group_id IN (
            SELECT group_id FROM student_group_enrollments 
            WHERE student_id = get_current_student_id() 
            AND status IN ('enrolled', 'active')
            AND deleted_at IS NULL
        ))
    );

CREATE POLICY "Teachers can view lessons in their organization" ON lessons
    FOR SELECT USING (
        is_teacher() AND organization_id = get_teacher_organization()
    );

CREATE POLICY "Teachers can manage lessons in their groups" ON lessons
    FOR ALL USING (
        is_teacher() AND 
        organization_id = get_teacher_organization() AND
        (group_id IS NULL OR group_id IN (
            SELECT group_id FROM teacher_group_assignments 
            WHERE teacher_id = get_current_teacher_id() 
            AND status = 'active'
            AND deleted_at IS NULL
        ))
    );

-- Hometasks policies
CREATE POLICY "Students can view hometasks in their groups" ON hometasks
    FOR SELECT USING (
        is_student() AND 
        is_published = true AND 
        organization_id = get_student_organization() AND
        group_id IN (
            SELECT group_id FROM student_group_enrollments 
            WHERE student_id = get_current_student_id() 
            AND status IN ('enrolled', 'active')
            AND deleted_at IS NULL
        )
    );

CREATE POLICY "Teachers can view hometasks in their organization" ON hometasks
    FOR SELECT USING (
        is_teacher() AND organization_id = get_teacher_organization()
    );

CREATE POLICY "Teachers can manage hometasks in their groups" ON hometasks
    FOR ALL USING (
        is_teacher() AND 
        organization_id = get_teacher_organization() AND
        group_id IN (
            SELECT group_id FROM teacher_group_assignments 
            WHERE teacher_id = get_current_teacher_id() 
            AND status = 'active'
            AND deleted_at IS NULL
        )
    );

-- Student homework submissions policies
CREATE POLICY "Students can manage their own submissions" ON student_hometask_submissions
    FOR ALL USING (
        is_student() AND 
        student_id = get_current_student_id() AND
        organization_id = get_student_organization()
    );

CREATE POLICY "Teachers can view submissions in their groups" ON student_hometask_submissions
    FOR SELECT USING (
        is_teacher() AND 
        organization_id = get_teacher_organization() AND
        hometask_id IN (
            SELECT h.id FROM hometasks h
            JOIN teacher_group_assignments tga ON h.group_id = tga.group_id
            WHERE tga.teacher_id = get_current_teacher_id()
            AND tga.status = 'active'
            AND tga.deleted_at IS NULL
        )
    );

CREATE POLICY "Teachers can grade submissions in their groups" ON student_hometask_submissions
    FOR UPDATE USING (
        is_teacher() AND 
        organization_id = get_teacher_organization() AND
        hometask_id IN (
            SELECT h.id FROM hometasks h
            JOIN teacher_group_assignments tga ON h.group_id = tga.group_id
            WHERE tga.teacher_id = get_current_teacher_id()
            AND tga.status = 'active'
            AND tga.deleted_at IS NULL
        )
    );

-- Vocabulary words policies
CREATE POLICY "Students can view vocabulary in their organization" ON vocabulary_words
    FOR SELECT USING (
        is_student() AND 
        is_active = true AND
        organization_id = get_student_organization()
    );

CREATE POLICY "Teachers can view vocabulary in their organization" ON vocabulary_words
    FOR SELECT USING (
        is_teacher() AND organization_id = get_teacher_organization()
    );

CREATE POLICY "Teachers can manage vocabulary in their organization" ON vocabulary_words
    FOR ALL USING (
        is_teacher() AND organization_id = get_teacher_organization()
    );

-- Student vocabulary progress policies
CREATE POLICY "Students can manage their own vocabulary progress" ON student_vocabulary_progress
    FOR ALL USING (
        is_student() AND 
        student_id = get_current_student_id() AND
        organization_id = get_student_organization()
    );

CREATE POLICY "Teachers can view vocabulary progress of their students" ON student_vocabulary_progress
    FOR SELECT USING (
        is_teacher() AND 
        organization_id = get_teacher_organization() AND
        student_id IN (
            SELECT sge.student_id FROM student_group_enrollments sge
            JOIN teacher_group_assignments tga ON sge.group_id = tga.group_id
            WHERE tga.teacher_id = get_current_teacher_id()
            AND tga.status = 'active'
            AND sge.status IN ('enrolled', 'active')
            AND tga.deleted_at IS NULL
            AND sge.deleted_at IS NULL
        )
    );

-- Schedules policies
CREATE POLICY "Students can view their own schedules" ON schedules
    FOR SELECT USING (
        is_student() AND 
        student_id = get_current_student_id() AND
        organization_id = get_student_organization()
    );

CREATE POLICY "Teachers can view schedules of their students" ON schedules
    FOR SELECT USING (
        is_teacher() AND 
        organization_id = get_teacher_organization() AND
        (student_id IN (
            SELECT sge.student_id FROM student_group_enrollments sge
            JOIN teacher_group_assignments tga ON sge.group_id = tga.group_id
            WHERE tga.teacher_id = get_current_teacher_id()
            AND tga.status = 'active'
            AND sge.status IN ('enrolled', 'active')
            AND tga.deleted_at IS NULL
            AND sge.deleted_at IS NULL
        ) OR group_id IN (
            SELECT group_id FROM teacher_group_assignments 
            WHERE teacher_id = get_current_teacher_id()
            AND status = 'active'
            AND deleted_at IS NULL
        ))
    );

-- Referrals policies
CREATE POLICY "Students can manage their own referrals" ON referrals
    FOR ALL USING (
        is_student() AND 
        referrer_student_id = get_current_student_id() AND
        organization_id = get_student_organization()
    );

CREATE POLICY "Teachers can view referrals in their organization" ON referrals
    FOR SELECT USING (
        is_teacher() AND organization_id = get_teacher_organization()
    );

-- Referral rewards policies
CREATE POLICY "Students can view their own referral rewards" ON referral_rewards
    FOR SELECT USING (
        is_student() AND 
        student_id = get_current_student_id() AND
        organization_id = get_student_organization()
    );

CREATE POLICY "Students can claim their own referral rewards" ON referral_rewards
    FOR UPDATE USING (
        is_student() AND 
        student_id = get_current_student_id() AND
        organization_id = get_student_organization()
    )
    WITH CHECK (
        -- Only allow updating claim status
        is_claimed IS NOT NULL OR claimed_at IS NOT NULL
    );

-- Student rankings policies (from existing migration)
DROP POLICY IF EXISTS "Students can view their own ranking" ON student_rankings;
CREATE POLICY "Students can view their own ranking" ON student_rankings
    FOR SELECT USING (
        is_student() AND 
        student_id = get_current_student_id() AND
        organization_id = get_student_organization()
    );

CREATE POLICY "Students can view organization leaderboard" ON student_rankings
    FOR SELECT USING (
        is_student() AND 
        organization_id = get_student_organization()
    );

-- Points transactions policies (from existing migration)
DROP POLICY IF EXISTS "Students can view their own points transactions" ON points_transactions;
CREATE POLICY "Students can view their own points transactions" ON points_transactions
    FOR SELECT USING (
        is_student() AND 
        student_id = get_current_student_id() AND
        organization_id = get_student_organization()
    );

-- Student achievements policies (from existing migration)
DROP POLICY IF EXISTS "Students can view their own achievements" ON student_achievements;
CREATE POLICY "Students can view their own achievements" ON student_achievements
    FOR SELECT USING (
        is_student() AND 
        student_id = get_current_student_id() AND
        organization_id = get_student_organization()
    );

-- Achievements policies (from existing migration)
CREATE POLICY "Students can view active achievements" ON achievements
    FOR SELECT USING (
        is_student() AND 
        is_active = true AND
        organization_id = get_student_organization()
    );

-- Groups policies - allow students to view their enrolled groups
DROP POLICY IF EXISTS "Students can view their enrolled groups" ON groups;
CREATE POLICY "Students can view their enrolled groups" ON groups
    FOR SELECT USING (
        is_student() AND 
        organization_id = get_student_organization() AND
        id IN (
            SELECT group_id FROM student_group_enrollments 
            WHERE student_id = get_current_student_id() 
            AND status IN ('enrolled', 'active')
            AND deleted_at IS NULL
        )
    );

-- Student group enrollments - students can view their own enrollments
DROP POLICY IF EXISTS "Students can view their own enrollments" ON student_group_enrollments;
CREATE POLICY "Students can view their own enrollments" ON student_group_enrollments
    FOR SELECT USING (
        is_student() AND 
        student_id = get_current_student_id() AND
        organization_id = get_student_organization()
    );

-- Teachers can view enrollments in their groups
CREATE POLICY "Teachers can view enrollments in their groups" ON student_group_enrollments
    FOR SELECT USING (
        is_teacher() AND 
        organization_id = get_teacher_organization() AND
        group_id IN (
            SELECT group_id FROM teacher_group_assignments 
            WHERE teacher_id = get_current_teacher_id()
            AND status = 'active'
            AND deleted_at IS NULL
        )
    );

-- Comments
COMMENT ON FUNCTION get_current_student_id IS 'Get the student ID for the current authenticated student user';
COMMENT ON FUNCTION get_current_teacher_id IS 'Get the teacher ID for the current authenticated teacher user';
COMMENT ON FUNCTION is_student IS 'Check if current user is a student';
COMMENT ON FUNCTION is_teacher IS 'Check if current user is a teacher';
COMMENT ON FUNCTION get_student_organization IS 'Get organization ID for current student';
COMMENT ON FUNCTION get_teacher_organization IS 'Get organization ID for current teacher';