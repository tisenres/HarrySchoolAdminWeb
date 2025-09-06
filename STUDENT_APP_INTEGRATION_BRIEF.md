# Harry School CRM - Student App Integration Technical Brief

## 1. ROLE AND PERMISSION MAPPING

### Current Role Definitions
```sql
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'viewer');
```

**MISSING: Student role needs to be added**

```sql
-- Required migration
ALTER TYPE user_role ADD VALUE 'student';
```

### RLS Policy Requirements for Student Role

Student queries must include:
- `organization_id = get_user_organization()` 
- Student-specific filters: `student_id = get_current_student_id()`

**Required RLS helper function:**
```sql
CREATE OR REPLACE FUNCTION get_current_student_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id 
        FROM students 
        WHERE id = (
            SELECT student_id FROM student_profiles 
            WHERE profile_id = auth.uid()
        )
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 2. DATABASE SCHEMA ANALYSIS

### Existing Core Tables

#### students
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    student_id TEXT,
    enrollment_status TEXT DEFAULT 'active',
    -- ... full schema in migration 001
);
```

#### student_rankings 
```sql
CREATE TABLE student_rankings (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    student_id UUID NOT NULL,
    total_points INTEGER DEFAULT 0,
    available_coins INTEGER DEFAULT 0,
    spent_coins INTEGER DEFAULT 0,
    current_rank INTEGER,
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### points_transactions
```sql
CREATE TABLE points_transactions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    student_id UUID NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('earned', 'deducted', 'bonus', 'redeemed')),
    points_amount INTEGER NOT NULL,
    coins_earned INTEGER DEFAULT 0,
    reason TEXT NOT NULL,
    category TEXT DEFAULT 'manual',
    awarded_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Missing Tables Required for Student App

#### student_profiles (Auth bridge)
```sql
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- App-specific settings
    language_preference TEXT DEFAULT 'en',
    push_notifications_enabled BOOLEAN DEFAULT true,
    vocabulary_daily_goal INTEGER DEFAULT 5,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(profile_id),
    UNIQUE(student_id)
);
```

#### lessons
```sql
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    
    -- Lesson Details
    title TEXT NOT NULL,
    description TEXT,
    lesson_type TEXT DEFAULT 'regular',
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER,
    
    -- Location
    classroom TEXT,
    online_meeting_url TEXT,
    
    -- Content
    objectives JSONB DEFAULT '[]'::jsonb,
    materials JSONB DEFAULT '[]'::jsonb,
    homework_assigned JSONB DEFAULT '[]'::jsonb,
    
    -- Performance tracking
    attendance_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);
```

#### hometasks
```sql
CREATE TABLE hometasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    
    -- Task Details  
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions JSONB DEFAULT '[]'::jsonb,
    task_type TEXT DEFAULT 'assignment',
    
    -- Scheduling
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    estimated_duration_minutes INTEGER,
    
    -- Grading
    max_points INTEGER DEFAULT 100,
    grading_criteria JSONB DEFAULT '{}'::jsonb,
    auto_grading_enabled BOOLEAN DEFAULT false,
    
    -- Resources
    attachments JSONB DEFAULT '[]'::jsonb,
    external_links JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'published', 'due_soon', 'overdue', 'graded', 'archived')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);
```

#### student_hometask_submissions
```sql
CREATE TABLE student_hometask_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hometask_id UUID NOT NULL REFERENCES hometasks(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    -- Submission Details
    submission_text TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    submission_type TEXT DEFAULT 'text',
    
    -- Status & Timing
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded', 'returned', 'resubmitted')),
    submitted_at TIMESTAMPTZ,
    is_late BOOLEAN DEFAULT false,
    
    -- Grading
    score INTEGER,
    max_score INTEGER,
    percentage DECIMAL(5,2),
    grade_letter TEXT,
    feedback TEXT,
    graded_by UUID REFERENCES teachers(id),
    graded_at TIMESTAMPTZ,
    
    -- Attempts
    attempt_number INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(hometask_id, student_id, attempt_number)
);
```

#### vocabulary_words
```sql
CREATE TABLE vocabulary_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Word Details
    word TEXT NOT NULL,
    pronunciation TEXT,
    part_of_speech TEXT,
    
    -- Definitions (multilingual)
    definition_en TEXT NOT NULL,
    definition_ru TEXT,
    definition_uz TEXT,
    
    -- Examples
    example_sentences JSONB DEFAULT '[]'::jsonb,
    
    -- Learning metadata
    difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'elementary', 'intermediate', 'advanced', 'proficient')),
    cefr_level TEXT CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    frequency_rank INTEGER,
    
    -- Categorization
    topic_tags TEXT[] DEFAULT '{}',
    lesson_unit TEXT,
    vocabulary_pack_id UUID,
    
    -- Media
    image_url TEXT,
    audio_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    
    UNIQUE(word, organization_id)
);
```

#### student_vocabulary_progress
```sql
CREATE TABLE student_vocabulary_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    vocabulary_word_id UUID NOT NULL REFERENCES vocabulary_words(id) ON DELETE CASCADE,
    
    -- Learning Progress
    mastery_level TEXT DEFAULT 'new' CHECK (mastery_level IN ('new', 'learning', 'familiar', 'mastered')),
    confidence_score DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    
    -- Review Schedule (Spaced Repetition)
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    last_reviewed TIMESTAMPTZ,
    next_review_date DATE,
    
    -- Performance tracking
    streak_count INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    total_study_time_minutes INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, vocabulary_word_id)
);
```

#### attendance_records
```sql
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    -- Attendance Status
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused', 'partial')),
    arrival_time TIMESTAMPTZ,
    departure_time TIMESTAMPTZ,
    
    -- Additional Info
    notes TEXT,
    marked_by UUID NOT NULL REFERENCES teachers(id),
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Late/Early tracking
    minutes_late INTEGER DEFAULT 0,
    minutes_early_departure INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(lesson_id, student_id)
);
```

#### schedules
```sql
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    
    -- Schedule Pattern
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Date Range
    effective_from DATE NOT NULL,
    effective_until DATE,
    
    -- Location
    classroom TEXT,
    online_meeting_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);
```

## 3. TYPESCRIPT INTERFACES

### Core Student Types
```typescript
export interface Student {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  full_name: string
  student_id?: string
  enrollment_status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'expelled' | 'on_hold'
  profile_image_url?: string
  created_at: string
  updated_at: string
}

export interface StudentProfile {
  id: string
  profile_id: string
  student_id: string
  organization_id: string
  language_preference: 'en' | 'ru' | 'uz'
  push_notifications_enabled: boolean
  vocabulary_daily_goal: number
  created_at: string
  updated_at: string
}

export interface StudentRanking {
  id: string
  organization_id: string
  student_id: string
  total_points: number
  available_coins: number
  spent_coins: number
  current_rank?: number
  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface PointsTransaction {
  id: string
  organization_id: string
  student_id: string
  transaction_type: 'earned' | 'deducted' | 'bonus' | 'redeemed'
  points_amount: number
  coins_earned: number
  reason: string
  category: string
  awarded_by: string
  created_at: string
}
```

### Lesson & Homework Types
```typescript
export interface Lesson {
  id: string
  organization_id: string
  group_id: string
  teacher_id: string
  title: string
  description?: string
  lesson_type: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_date: string
  start_time: string
  end_time: string
  duration_minutes?: number
  classroom?: string
  online_meeting_url?: string
  objectives: string[]
  materials: Array<{name: string, url?: string}>
  homework_assigned: string[]
  attendance_count: number
  completion_rate?: number
  created_at: string
  updated_at: string
}

export interface Hometask {
  id: string
  organization_id: string
  lesson_id?: string
  group_id: string
  assigned_by: string
  title: string
  description: string
  instructions: Array<{step: number, instruction: string}>
  task_type: string
  assigned_date: string
  due_date: string
  estimated_duration_minutes?: number
  max_points: number
  grading_criteria: Record<string, any>
  attachments: Array<{name: string, url: string, type: string}>
  external_links: Array<{title: string, url: string}>
  status: 'assigned' | 'published' | 'due_soon' | 'overdue' | 'graded' | 'archived'
  created_at: string
  updated_at: string
}

export interface StudentHometaskSubmission {
  id: string
  organization_id: string
  hometask_id: string
  student_id: string
  submission_text?: string
  attachments: Array<{name: string, url: string, type: string}>
  submission_type: string
  status: 'draft' | 'submitted' | 'graded' | 'returned' | 'resubmitted'
  submitted_at?: string
  is_late: boolean
  score?: number
  max_score?: number
  percentage?: number
  grade_letter?: string
  feedback?: string
  graded_by?: string
  graded_at?: string
  attempt_number: number
  max_attempts: number
  created_at: string
  updated_at: string
}
```

### Vocabulary Types
```typescript
export interface VocabularyWord {
  id: string
  organization_id: string
  word: string
  pronunciation?: string
  part_of_speech?: string
  definition_en: string
  definition_ru?: string
  definition_uz?: string
  example_sentences: Array<{sentence: string, translation?: string}>
  difficulty_level: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'proficient'
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  frequency_rank?: number
  topic_tags: string[]
  lesson_unit?: string
  vocabulary_pack_id?: string
  image_url?: string
  audio_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StudentVocabularyProgress {
  id: string
  organization_id: string
  student_id: string
  vocabulary_word_id: string
  mastery_level: 'new' | 'learning' | 'familiar' | 'mastered'
  confidence_score: number
  review_count: number
  correct_count: number
  last_reviewed?: string
  next_review_date?: string
  streak_count: number
  best_streak: number
  total_study_time_minutes: number
  created_at: string
  updated_at: string
}
```

### Attendance Types
```typescript
export interface AttendanceRecord {
  id: string
  organization_id: string
  lesson_id: string
  student_id: string
  status: 'present' | 'absent' | 'late' | 'excused' | 'partial'
  arrival_time?: string
  departure_time?: string
  notes?: string
  marked_by: string
  marked_at: string
  minutes_late: number
  minutes_early_departure: number
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  organization_id: string
  group_id: string
  day_of_week: number // 0-6, Sunday = 0
  start_time: string
  end_time: string
  effective_from: string
  effective_until?: string
  classroom?: string
  online_meeting_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

## 4. API PATTERNS & QUERY SHAPES

### Authentication Pattern
```typescript
// All Student App queries must include RLS-safe organization filtering
const supabase = createClient()

// Get current user's student profile
const { data: studentProfile } = await supabase
  .from('student_profiles')
  .select('*')
  .eq('profile_id', user.id)
  .single()

// Use organization_id in all subsequent queries
```

### Student Ranking/Leaderboard Queries
```typescript
// Weekly leaderboard
const { data: weeklyLeaderboard } = await supabase
  .from('student_rankings')
  .select(`
    *,
    students!inner(full_name, profile_image_url)
  `)
  .eq('organization_id', organizationId)
  .order('total_points', { ascending: false })
  .limit(50)

// Student's current rank
const { data: studentRank } = await supabase
  .rpc('get_student_rank', {
    p_student_id: studentId,
    p_organization_id: organizationId
  })
```

### Vocabulary Queries
```typescript
// Daily 5 vocabulary selection
const { data: dailyVocab } = await supabase
  .rpc('get_daily_vocabulary', {
    p_student_id: studentId,
    p_limit: 5
  })

// Student vocabulary progress
const { data: vocabProgress } = await supabase
  .from('student_vocabulary_progress')
  .select(`
    *,
    vocabulary_words!inner(*)
  `)
  .eq('student_id', studentId)
  .eq('organization_id', organizationId)
  .order('last_reviewed', { ascending: true })
```

### Lessons & Homework Queries
```typescript
// Upcoming lessons for student
const { data: upcomingLessons } = await supabase
  .from('lessons')
  .select(`
    *,
    teachers(full_name),
    groups!inner(
      name,
      student_group_enrollments!inner(student_id)
    )
  `)
  .eq('groups.student_group_enrollments.student_id', studentId)
  .eq('organization_id', organizationId)
  .gte('scheduled_date', new Date().toISOString())
  .order('scheduled_date', { ascending: true })

// Student's homework assignments
const { data: homework } = await supabase
  .from('hometasks')
  .select(`
    *,
    student_hometask_submissions(*)
  `)
  .eq('group_id', groupId)
  .eq('organization_id', organizationId)
  .eq('status', 'assigned')
  .order('due_date', { ascending: true })
```

## 5. REQUIRED RLS POLICIES FOR STUDENTS

```sql
-- Student profiles policy
CREATE POLICY "Students can view their own profile" ON student_profiles
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Students can update their own profile" ON student_profiles
    FOR UPDATE USING (profile_id = auth.uid());

-- Student rankings policy (read-only leaderboard access)
CREATE POLICY "Students can view rankings in their organization" ON student_rankings
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM student_profiles 
            WHERE profile_id = auth.uid()
        )
    );

-- Points transactions policy (read-only)
CREATE POLICY "Students can view their own transactions" ON points_transactions
    FOR SELECT USING (
        student_id = get_current_student_id()
    );

-- Vocabulary policies
CREATE POLICY "Students can view vocabulary in their organization" ON vocabulary_words
    FOR SELECT USING (
        organization_id = get_user_organization() AND is_active = true
    );

CREATE POLICY "Students can view their vocabulary progress" ON student_vocabulary_progress
    FOR SELECT USING (student_id = get_current_student_id());

CREATE POLICY "Students can update their vocabulary progress" ON student_vocabulary_progress
    FOR ALL USING (student_id = get_current_student_id());

-- Lessons policy (read-only via group enrollment)
CREATE POLICY "Students can view lessons for their groups" ON lessons
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM student_group_enrollments 
            WHERE student_id = get_current_student_id() 
            AND status IN ('enrolled', 'active')
        )
    );

-- Homework policies
CREATE POLICY "Students can view homework for their groups" ON hometasks
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM student_group_enrollments 
            WHERE student_id = get_current_student_id() 
            AND status IN ('enrolled', 'active')
        )
    );

CREATE POLICY "Students can manage their homework submissions" ON student_hometask_submissions
    FOR ALL USING (student_id = get_current_student_id());

-- Attendance policy (read-only)
CREATE POLICY "Students can view their attendance" ON attendance_records
    FOR SELECT USING (student_id = get_current_student_id());
```

## 6. REQUIRED DATABASE FUNCTIONS/RPCs

### Daily Vocabulary Selection
```sql
CREATE OR REPLACE FUNCTION get_daily_vocabulary(
    p_student_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    word_id UUID,
    word TEXT,
    definition_en TEXT,
    definition_ru TEXT,
    definition_uz TEXT,
    mastery_level TEXT,
    review_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH student_org AS (
        SELECT organization_id FROM students WHERE id = p_student_id
    ),
    vocabulary_with_progress AS (
        SELECT 
            vw.id,
            vw.word,
            vw.definition_en,
            vw.definition_ru,
            vw.definition_uz,
            COALESCE(svp.mastery_level, 'new') as mastery_level,
            COALESCE(svp.review_count, 0) as review_count,
            COALESCE(svp.last_reviewed, '1970-01-01'::timestamptz) as last_reviewed,
            -- Priority scoring: new words and least reviewed first
            CASE 
                WHEN svp.mastery_level IS NULL THEN 1000 -- New words highest priority
                WHEN svp.mastery_level = 'new' THEN 900
                WHEN svp.mastery_level = 'learning' THEN 800
                WHEN svp.mastery_level = 'familiar' THEN 400
                WHEN svp.mastery_level = 'mastered' THEN 100
                ELSE 500
            END + (1000 - COALESCE(svp.review_count, 0)) as priority_score
        FROM vocabulary_words vw
        LEFT JOIN student_vocabulary_progress svp ON vw.id = svp.vocabulary_word_id 
            AND svp.student_id = p_student_id
        CROSS JOIN student_org so
        WHERE vw.organization_id = so.organization_id 
            AND vw.is_active = true
            AND vw.deleted_at IS NULL
    )
    SELECT 
        v.id as word_id,
        v.word,
        v.definition_en,
        v.definition_ru,
        v.definition_uz,
        v.mastery_level,
        v.review_count
    FROM vocabulary_with_progress v
    ORDER BY 
        v.priority_score DESC,
        v.last_reviewed ASC,
        RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Weekly/Monthly Leaderboard Views
```sql
CREATE MATERIALIZED VIEW weekly_leaderboard AS
WITH week_bounds AS (
    SELECT 
        date_trunc('week', CURRENT_DATE) as week_start,
        date_trunc('week', CURRENT_DATE) + INTERVAL '6 days' as week_end
),
weekly_points AS (
    SELECT 
        pt.organization_id,
        pt.student_id,
        SUM(pt.points_amount) as weekly_points,
        SUM(pt.coins_earned) as weekly_coins
    FROM points_transactions pt
    CROSS JOIN week_bounds wb
    WHERE pt.created_at >= wb.week_start 
        AND pt.created_at <= wb.week_end
        AND pt.deleted_at IS NULL
    GROUP BY pt.organization_id, pt.student_id
)
SELECT 
    wp.organization_id,
    wp.student_id,
    s.full_name,
    s.profile_image_url,
    wp.weekly_points,
    wp.weekly_coins,
    sr.total_points,
    sr.current_rank,
    ROW_NUMBER() OVER (
        PARTITION BY wp.organization_id 
        ORDER BY wp.weekly_points DESC
    ) as weekly_rank
FROM weekly_points wp
JOIN students s ON wp.student_id = s.id AND s.deleted_at IS NULL
LEFT JOIN student_rankings sr ON wp.student_id = sr.student_id
WHERE s.enrollment_status = 'active';

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_weekly_leaderboard()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW weekly_leaderboard;
END;
$$ LANGUAGE plpgsql;
```

### Points Transaction Trigger
```sql
CREATE OR REPLACE FUNCTION update_student_ranking_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert student ranking
    INSERT INTO student_rankings (organization_id, student_id, total_points, available_coins, last_activity_at)
    VALUES (
        NEW.organization_id, 
        NEW.student_id, 
        NEW.points_amount, 
        NEW.coins_earned,
        NOW()
    )
    ON CONFLICT (organization_id, student_id) 
    DO UPDATE SET
        total_points = student_rankings.total_points + NEW.points_amount,
        available_coins = CASE 
            WHEN NEW.transaction_type = 'redeemed' THEN student_rankings.available_coins
            ELSE student_rankings.available_coins + NEW.coins_earned
        END,
        last_activity_at = NOW(),
        updated_at = NOW();
        
    -- Update ranks
    WITH ranked_students AS (
        SELECT 
            student_id,
            ROW_NUMBER() OVER (ORDER BY total_points DESC, last_activity_at ASC) as new_rank
        FROM student_rankings 
        WHERE organization_id = NEW.organization_id
    )
    UPDATE student_rankings 
    SET current_rank = ranked_students.new_rank
    FROM ranked_students 
    WHERE student_rankings.student_id = ranked_students.student_id
        AND student_rankings.organization_id = NEW.organization_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ranking_after_transaction
    AFTER INSERT ON points_transactions
    FOR EACH ROW EXECUTE FUNCTION update_student_ranking_after_transaction();
```

## 7. ADMIN PANEL FLOWS

### Lesson Creation
```typescript
// POST /api/lessons
interface CreateLessonRequest {
  group_id: string
  teacher_id: string
  title: string
  description?: string
  scheduled_date: string
  start_time: string
  end_time: string
  classroom?: string
  objectives: string[]
  materials: Array<{name: string, url?: string}>
}

// Supabase query pattern
const { data: lesson } = await supabase
  .from('lessons')
  .insert({
    organization_id: organizationId,
    ...lessonData,
    created_by: adminId
  })
  .select()
  .single()
```

### Vocabulary Pack Import
```typescript
// POST /api/vocabulary/import
interface VocabularyImportRequest {
  vocabulary_pack_name: string
  words: Array<{
    word: string
    definition_en: string
    definition_ru?: string
    definition_uz?: string
    cefr_level?: string
    topic_tags: string[]
  }>
}

// Expected CSV format:
// word,definition_en,definition_ru,definition_uz,cefr_level,topic_tags
// "hello","greeting","привет","salom","A1","greetings,basic"
```

### Referral Management
```typescript
// Admin referral approval flow
const { data: referral } = await supabase
  .from('student_referrals')
  .update({
    status: 'enrolled',
    enrolled_student_id: newStudentId,
    processed_by: adminId,
    processed_at: new Date().toISOString()
  })
  .eq('id', referralId)
  .select()
  .single()

// Reward referrer with points
await supabase
  .from('points_transactions')
  .insert({
    organization_id: organizationId,
    student_id: referral.referrer_student_id,
    transaction_type: 'bonus',
    points_amount: 100,
    coins_earned: 10,
    reason: 'Successful referral',
    category: 'referral',
    awarded_by: adminId
  })
```

## 8. TEACHER APP FLOWS

### Attendance Marking
```typescript
// POST /api/attendance/mark
interface MarkAttendanceRequest {
  lesson_id: string
  attendance_records: Array<{
    student_id: string
    status: 'present' | 'absent' | 'late' | 'excused'
    notes?: string
    arrival_time?: string
  }>
}

// Bulk insert pattern
const { data: attendanceRecords } = await supabase
  .from('attendance_records')
  .insert(
    attendanceData.map(record => ({
      organization_id: organizationId,
      lesson_id: lessonId,
      marked_by: teacherId,
      marked_at: new Date().toISOString(),
      ...record
    }))
  )
  .select()
```

### Homework Grading
```typescript
// PUT /api/submissions/:id/grade
interface GradeSubmissionRequest {
  score: number
  max_score: number
  feedback: string
  grade_letter?: string
}

const { data: gradedSubmission } = await supabase
  .from('student_hometask_submissions')
  .update({
    score: gradeData.score,
    max_score: gradeData.max_score,
    percentage: (gradeData.score / gradeData.max_score) * 100,
    feedback: gradeData.feedback,
    grade_letter: gradeData.grade_letter,
    status: 'graded',
    graded_by: teacherId,
    graded_at: new Date().toISOString()
  })
  .eq('id', submissionId)
  .select()
  .single()
```

## 9. GAPS AND RECOMMENDATIONS

### Missing Components for Student App

1. **Authentication Bridge**: `student_profiles` table connects auth.users to students
2. **Lesson System**: Complete lesson management with scheduling
3. **Homework System**: Assignment, submission, and grading workflow
4. **Vocabulary Learning**: Spaced repetition system with progress tracking
5. **Attendance Tracking**: Student attendance history
6. **Push Notifications**: Mobile notification system
7. **Offline Support**: Local caching and sync capabilities

### Required Indexes for Performance
```sql
-- Vocabulary queries
CREATE INDEX idx_vocabulary_progress_student_review 
ON student_vocabulary_progress(student_id, last_reviewed, mastery_level);

CREATE INDEX idx_vocabulary_words_active_org 
ON vocabulary_words(organization_id, is_active) WHERE deleted_at IS NULL;

-- Leaderboard queries
CREATE INDEX idx_student_rankings_org_points 
ON student_rankings(organization_id, total_points DESC);

CREATE INDEX idx_points_transactions_student_date 
ON points_transactions(student_id, created_at DESC) WHERE deleted_at IS NULL;

-- Lesson/homework queries
CREATE INDEX idx_lessons_group_date 
ON lessons(group_id, scheduled_date) WHERE deleted_at IS NULL;

CREATE INDEX idx_hometasks_group_due_date 
ON hometasks(group_id, due_date, status) WHERE deleted_at IS NULL;
```

### Mobile App Sync Strategy
```typescript
// Offline-first approach with conflict resolution
interface SyncConfig {
  vocabulary_words: { lastSync: string, localChanges: number }
  student_rankings: { lastSync: string }
  lessons: { lastSync: string }
  homework: { lastSync: string, pendingSubmissions: string[] }
}

// Background sync RPC
CREATE OR REPLACE FUNCTION get_student_sync_data(
    p_student_id UUID,
    p_last_sync TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'vocabulary', (
            SELECT json_agg(vw.*)
            FROM vocabulary_words vw
            WHERE vw.organization_id = (SELECT organization_id FROM students WHERE id = p_student_id)
                AND vw.updated_at > p_last_sync
        ),
        'lessons', (
            SELECT json_agg(l.*)
            FROM lessons l
            JOIN student_group_enrollments sge ON l.group_id = sge.group_id
            WHERE sge.student_id = p_student_id
                AND l.updated_at > p_last_sync
        ),
        'homework', (
            SELECT json_agg(h.*)
            FROM hometasks h
            JOIN student_group_enrollments sge ON h.group_id = sge.group_id
            WHERE sge.student_id = p_student_id
                AND h.updated_at > p_last_sync
        ),
        'rankings', (
            SELECT row_to_json(sr.*)
            FROM student_rankings sr
            WHERE sr.student_id = p_student_id
                AND sr.updated_at > p_last_sync
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This technical brief provides the complete foundation for integrating the Student App with the existing Harry School CRM system. All schemas, APIs, and implementation patterns follow the established codebase conventions while adding the necessary student-facing functionality.