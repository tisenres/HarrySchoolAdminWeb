-- Test Data Seed Script for Student Mobile App
-- Run this in Supabase SQL Editor or psql
-- Description: Creates test organization, students, groups, and sample data

-- Set constants
\set TEST_ORG_ID 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'
\set TEST_ORG_NAME 'Harry School Tashkent'

BEGIN;

-- 1. Create test organization (if not exists)
INSERT INTO organizations (id, name, domain, address, settings, is_active, created_at, updated_at)
VALUES (
    'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid,
    'Harry School Tashkent',
    'harry-school.uz',
    'Tashkent, Uzbekistan',
    '{
        "language": "en",
        "timezone": "Asia/Tashkent", 
        "currency": "UZS",
        "academic_year_start": "2024-09-01",
        "features": {
            "mobile_app": true,
            "vocabulary_system": true,
            "homework_system": true,
            "ranking_system": true
        }
    }'::jsonb,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- 2. Create test teacher (if not exists)
WITH teacher_insert AS (
    INSERT INTO teachers (
        organization_id, 
        first_name, 
        last_name, 
        email, 
        phone_number,
        specializations,
        employment_type,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid,
        'Test',
        'Teacher',
        'teacher@harry-school.test',
        '+998901234999',
        ARRAY['English', 'Grammar', 'Vocabulary']::text[],
        'full_time',
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (organization_id, email) DO UPDATE SET
        updated_at = NOW()
    RETURNING id
),
teacher_id AS (
    SELECT id FROM teacher_insert
    UNION ALL
    SELECT id FROM teachers 
    WHERE organization_id = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid 
    AND email = 'teacher@harry-school.test'
    LIMIT 1
)

-- 3. Create test groups
INSERT INTO groups (
    organization_id,
    name,
    description,
    teacher_id,
    capacity,
    current_size,
    level,
    schedule_description,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid,
    group_data.name,
    group_data.description,
    teacher_id.id,
    group_data.capacity,
    0,
    group_data.level,
    group_data.schedule,
    true,
    NOW(),
    NOW()
FROM teacher_id,
(VALUES 
    ('Beginner English A1', 'Beginner level English course for newcomers', 20, 'A1', 'Mon, Wed, Fri - 10:00-11:30'),
    ('Intermediate English B1', 'Intermediate level English course', 15, 'B1', 'Tue, Thu - 14:00-15:30'),
    ('Advanced English C1', 'Advanced level English course for fluent speakers', 10, 'C1', 'Sat - 09:00-12:00')
) AS group_data(name, description, capacity, level, schedule)
ON CONFLICT (organization_id, name) DO UPDATE SET
    updated_at = NOW();

-- Store group IDs for student enrollment
CREATE TEMP TABLE temp_groups AS
SELECT id, name FROM groups 
WHERE organization_id = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid;

-- 4. Create test students
WITH student_data AS (
    SELECT * FROM (VALUES
        ('John', 'Smith', 'john.smith@harry-school.test', '+998901234567', '2005-03-15'::date, false, NULL),
        ('Sarah', 'Johnson', 'sarah.johnson@harry-school.test', '+998901234568', '2006-07-22'::date, false, NULL),
        ('Michael', 'Brown', 'michael.brown@harry-school.test', '+998901234569', '2004-11-08'::date, false, NULL),
        ('Emma', 'Wilson', 'emma.wilson@harry-school.test', '+998901234570', '2010-05-15'::date, true, 'parent.wilson@gmail.com'),
        ('Demo', 'User', 'demo@harry-school.test', '+998901234571', '2005-01-01'::date, false, NULL)
    ) AS t(first_name, last_name, email, phone_number, date_of_birth, is_minor, guardian_email)
),
student_insert AS (
    INSERT INTO students (
        organization_id,
        first_name,
        last_name,
        email,
        phone_number,
        date_of_birth,
        enrollment_status,
        enrollment_date,
        guardian_email,
        is_active,
        created_at,
        updated_at
    )
    SELECT 
        'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid,
        first_name,
        last_name,
        email,
        phone_number,
        date_of_birth,
        'active',
        CURRENT_DATE,
        guardian_email,
        true,
        NOW(),
        NOW()
    FROM student_data
    ON CONFLICT (organization_id, email) DO UPDATE SET
        updated_at = NOW()
    RETURNING id, email, first_name, last_name
)

-- Store student IDs for further use
SELECT * INTO TEMP TABLE temp_students FROM student_insert;

-- 5. Create student rankings
INSERT INTO student_rankings (
    organization_id,
    student_id,
    total_points,
    available_coins,
    spent_coins,
    current_rank,
    last_activity_at,
    created_at,
    updated_at
)
SELECT 
    'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid,
    ts.id,
    -- Random starting points between 100-600
    (100 + (RANDOM() * 500))::integer,
    -- Random coins between 10-60  
    (10 + (RANDOM() * 50))::integer,
    0,
    NULL, -- Will be calculated by triggers
    NOW() - (RANDOM() * INTERVAL '30 days'), -- Random recent activity
    NOW(),
    NOW()
FROM temp_students ts
ON CONFLICT (organization_id, student_id) DO UPDATE SET
    updated_at = NOW();

-- 6. Create student group enrollments
WITH enrollment_mappings AS (
    SELECT 
        s.id as student_id,
        g.id as group_id,
        s.first_name
    FROM temp_students s, temp_groups g
    WHERE 
        (s.first_name IN ('John', 'Sarah', 'Emma') AND g.name = 'Beginner English A1') OR
        (s.first_name IN ('Michael', 'Demo') AND g.name = 'Intermediate English B1')
)
INSERT INTO student_group_enrollments (
    organization_id,
    student_id,
    group_id,
    status,
    enrollment_date,
    academic_year,
    created_at,
    updated_at
)
SELECT 
    'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid,
    student_id,
    group_id,
    'enrolled',
    CURRENT_DATE,
    '2024-2025',
    NOW(),
    NOW()
FROM enrollment_mappings
ON CONFLICT (organization_id, student_id, group_id) DO UPDATE SET
    updated_at = NOW();

-- 7. Create vocabulary words (100 essential words)
INSERT INTO vocabulary_words (
    organization_id,
    word,
    definition,
    part_of_speech,
    phonetics,
    example_sentence,
    translation_russian,
    translation_uzbek,
    difficulty_level,
    category,
    synonyms,
    usage_frequency,
    is_active,
    created_at,
    updated_at
) VALUES 
-- A1 Level (Basic)
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'hello', 'A greeting used when meeting someone', 'phrase', '/həˈloʊ/', 'Hello, how are you today?', 'привет', 'salom', 1, 'greetings', ARRAY['hi', 'hey'], 10, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'goodbye', 'A farewell expression', 'phrase', '/ɡʊdˈbaɪ/', 'Goodbye, see you tomorrow!', 'до свидания', 'xayr', 1, 'greetings', ARRAY['bye', 'farewell'], 9, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'thank you', 'An expression of gratitude', 'phrase', '/θæŋk ju/', 'Thank you for your help.', 'спасибо', 'rahmat', 1, 'greetings', ARRAY['thanks'], 10, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'please', 'Used to make a polite request', 'adverb', '/pliːz/', 'Please help me with this.', 'пожалуйста', 'iltimos', 1, 'politeness', ARRAY[], 8, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'water', 'A clear liquid essential for life', 'noun', '/ˈwɔːtər/', 'I drink water every day.', 'вода', 'suv', 1, 'food_drink', ARRAY[], 9, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'food', 'Something that people eat', 'noun', '/fuːd/', 'This food tastes delicious.', 'еда', 'ovqat', 1, 'food_drink', ARRAY['meal'], 8, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'house', 'A building for people to live in', 'noun', '/haʊs/', 'I live in a big house.', 'дом', 'uy', 1, 'places', ARRAY['home'], 9, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'school', 'A place where children learn', 'noun', '/skuːl/', 'I go to school every morning.', 'школа', 'maktab', 1, 'places', ARRAY[], 8, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'book', 'A set of written pages bound together', 'noun', '/bʊk/', 'I read a book before bed.', 'книга', 'kitob', 1, 'objects', ARRAY[], 7, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'car', 'A vehicle with four wheels', 'noun', '/kɑːr/', 'My car is red.', 'машина', 'mashina', 1, 'transport', ARRAY['automobile'], 8, true, NOW(), NOW()),

-- A2 Level  
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'beautiful', 'Pleasing to look at', 'adjective', '/ˈbjuːtɪfəl/', 'She is a beautiful person.', 'красивый', 'chiroyli', 2, 'descriptions', ARRAY['pretty', 'lovely'], 7, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'important', 'Having great significance', 'adjective', '/ɪmˈpɔːrtənt/', 'Education is very important.', 'важный', 'muhim', 2, 'descriptions', ARRAY['significant'], 8, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'understand', 'To comprehend meaning', 'verb', '/ˌʌndərˈstænd/', 'I understand the lesson.', 'понимать', 'tushunmoq', 2, 'actions', ARRAY['comprehend'], 9, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'learn', 'To acquire knowledge', 'verb', '/lɜːrn/', 'Students learn new things daily.', 'учиться', 'o''rganmoq', 2, 'actions', ARRAY['study'], 9, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'teacher', 'A person who teaches', 'noun', '/ˈtiːtʃər/', 'My teacher is very kind.', 'учитель', 'o''qituvchi', 2, 'people', ARRAY['instructor'], 8, true, NOW(), NOW()),

-- B1 Level (Intermediate)
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'achieve', 'To successfully complete something', 'verb', '/əˈtʃiːv/', 'She worked hard to achieve her goals.', 'достигать', 'erishmoq', 3, 'actions', ARRAY['accomplish'], 6, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'opportunity', 'A chance to do something', 'noun', '/ˌɑːpərˈtuːnəti/', 'This is a great opportunity for growth.', 'возможность', 'imkoniyat', 3, 'concepts', ARRAY['chance'], 7, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'experience', 'Knowledge gained through practice', 'noun', '/ɪkˈspɪriəns/', 'Work experience is valuable.', 'опыт', 'tajriba', 3, 'concepts', ARRAY[], 8, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'develop', 'To grow or improve gradually', 'verb', '/dɪˈveləp/', 'We need to develop our skills.', 'развивать', 'rivojlantirmoq', 3, 'actions', ARRAY['improve'], 7, true, NOW(), NOW()),
('a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid, 'communication', 'The sharing of information', 'noun', '/kəˌmjuːnɪˈkeɪʃən/', 'Good communication is essential.', 'общение', 'muloqot', 3, 'concepts', ARRAY[], 6, true, NOW(), NOW())

ON CONFLICT (organization_id, word) DO UPDATE SET 
    updated_at = NOW();

-- 8. Create sample lessons for each group
WITH lesson_data AS (
    SELECT 
        g.id as group_id,
        g.name as group_name,
        lesson_info.title,
        lesson_info.description,
        lesson_info.objectives,
        lesson_info.duration
    FROM temp_groups g,
    LATERAL (VALUES
        -- Beginner lessons
        (CASE WHEN g.name = 'Beginner English A1' THEN 'Introduction to English Greetings' END,
         CASE WHEN g.name = 'Beginner English A1' THEN 'Learn basic greetings and polite expressions' END,
         CASE WHEN g.name = 'Beginner English A1' THEN ARRAY['Learn hello, goodbye, please, thank you', 'Practice pronunciation', 'Role-play conversations'] END,
         CASE WHEN g.name = 'Beginner English A1' THEN 90 END),
        (CASE WHEN g.name = 'Beginner English A1' THEN 'Present Simple Tense' END,
         CASE WHEN g.name = 'Beginner English A1' THEN 'Understanding and using present simple tense' END,
         CASE WHEN g.name = 'Beginner English A1' THEN ARRAY['Form positive sentences', 'Create questions', 'Use negative forms'] END,
         CASE WHEN g.name = 'Beginner English A1' THEN 90 END),
        (CASE WHEN g.name = 'Beginner English A1' THEN 'Family and Relationships' END,
         CASE WHEN g.name = 'Beginner English A1' THEN 'Vocabulary for family members and descriptions' END,
         CASE WHEN g.name = 'Beginner English A1' THEN ARRAY['Name family members', 'Describe relationships', 'Talk about families'] END,
         CASE WHEN g.name = 'Beginner English A1' THEN 90 END),
         
        -- Intermediate lessons  
        (CASE WHEN g.name = 'Intermediate English B1' THEN 'Past Perfect Tense' END,
         CASE WHEN g.name = 'Intermediate English B1' THEN 'Understanding past perfect and its usage' END,
         CASE WHEN g.name = 'Intermediate English B1' THEN ARRAY['Form past perfect sentences', 'Use time expressions', 'Compare with past simple'] END,
         CASE WHEN g.name = 'Intermediate English B1' THEN 90 END),
        (CASE WHEN g.name = 'Intermediate English B1' THEN 'Business Communication' END,
         CASE WHEN g.name = 'Intermediate English B1' THEN 'Professional communication skills' END,
         CASE WHEN g.name = 'Intermediate English B1' THEN ARRAY['Write formal emails', 'Make presentations', 'Participate in meetings'] END,
         CASE WHEN g.name = 'Intermediate English B1' THEN 90 END),
         
        -- Advanced lessons
        (CASE WHEN g.name = 'Advanced English C1' THEN 'Advanced Grammar Structures' END,
         CASE WHEN g.name = 'Advanced English C1' THEN 'Complex grammatical constructions' END,
         CASE WHEN g.name = 'Advanced English C1' THEN ARRAY['Use subjunctive mood', 'Master conditional sentences', 'Apply advanced structures'] END,
         CASE WHEN g.name = 'Advanced English C1' THEN 180 END)
    ) AS lesson_info(title, description, objectives, duration)
    WHERE lesson_info.title IS NOT NULL
)
INSERT INTO lessons (
    organization_id,
    group_id,
    title,
    description,
    objectives,
    duration_minutes,
    lesson_type,
    is_published,
    order_index,
    content,
    materials,
    created_at,
    updated_at
)
SELECT 
    'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid,
    group_id,
    title,
    description,
    objectives,
    duration,
    'regular',
    true,
    ROW_NUMBER() OVER (PARTITION BY group_id ORDER BY title),
    '{"type": "lesson", "sections": [{"type": "introduction", "content": "Welcome to this lesson"}]}'::jsonb,
    '[{"name": "Student Handbook", "type": "pdf"}, {"name": "Practice Exercises", "type": "worksheet"}]'::jsonb,
    NOW(),
    NOW()
FROM lesson_data;

-- 9. Create sample homework assignments
INSERT INTO hometasks (
    organization_id,
    group_id,
    title,
    instructions,
    due_date,
    points_value,
    max_attempts,
    difficulty_level,
    task_type,
    is_published,
    created_at,
    updated_at
) 
SELECT 
    'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid,
    g.id,
    hw.title,
    hw.instructions,
    CURRENT_DATE + INTERVAL '7 days',
    hw.points,
    3,
    hw.difficulty,
    'written',
    true,
    NOW(),
    NOW()
FROM temp_groups g,
LATERAL (VALUES
    (CASE WHEN g.name LIKE '%A1%' THEN 'Greeting Practice' END,
     CASE WHEN g.name LIKE '%A1%' THEN 'Write 5 conversations using different greetings. Include hello, goodbye, please, and thank you in each conversation.' END,
     CASE WHEN g.name LIKE '%A1%' THEN 10 END,
     CASE WHEN g.name LIKE '%A1%' THEN 1 END),
    (CASE WHEN g.name LIKE '%A1%' THEN 'Present Simple Exercises' END,
     CASE WHEN g.name LIKE '%A1%' THEN 'Complete the sentences using present simple tense. Write about your daily routine.' END,
     CASE WHEN g.name LIKE '%A1%' THEN 15 END,
     CASE WHEN g.name LIKE '%A1%' THEN 2 END),
     
    (CASE WHEN g.name LIKE '%B1%' THEN 'Past Perfect Essay' END,
     CASE WHEN g.name LIKE '%B1%' THEN 'Write a 200-word essay about something you had completed before starting this course.' END,
     CASE WHEN g.name LIKE '%B1%' THEN 20 END,
     CASE WHEN g.name LIKE '%B1%' THEN 3 END),
    (CASE WHEN g.name LIKE '%B1%' THEN 'Business Email' END,
     CASE WHEN g.name LIKE '%B1%' THEN 'Write a formal business email requesting information about a product or service.' END,
     CASE WHEN g.name LIKE '%B1%' THEN 25 END,
     CASE WHEN g.name LIKE '%B1%' THEN 3 END),
     
    (CASE WHEN g.name LIKE '%C1%' THEN 'Advanced Grammar Analysis' END,
     CASE WHEN g.name LIKE '%C1%' THEN 'Analyze the grammatical structures in the provided text and explain the usage of complex constructions.' END,
     CASE WHEN g.name LIKE '%C1%' THEN 30 END,
     CASE WHEN g.name LIKE '%C1%' THEN 4 END)
) AS hw(title, instructions, points, difficulty)
WHERE hw.title IS NOT NULL;

-- 10. Initialize vocabulary progress for students
INSERT INTO student_vocabulary_progress (
    organization_id,
    student_id,
    vocabulary_word_id,
    mastery_level,
    confidence_score,
    review_count,
    correct_count,
    next_review_date,
    created_at,
    updated_at
)
SELECT DISTINCT
    'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid,
    s.id,
    v.id,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'new'
        WHEN RANDOM() < 0.6 THEN 'learning' 
        WHEN RANDOM() < 0.8 THEN 'familiar'
        ELSE 'mastered'
    END,
    RANDOM(), -- Random confidence 0-1
    (RANDOM() * 5)::integer, -- 0-5 reviews
    (RANDOM() * 3)::integer, -- 0-3 correct
    CURRENT_DATE + (RANDOM() * INTERVAL '7 days'), -- Next review in 0-7 days
    NOW(),
    NOW()
FROM temp_students s
CROSS JOIN vocabulary_words v
WHERE v.organization_id = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid
  AND v.difficulty_level <= 2 -- Only assign A1-A2 words initially
ON CONFLICT (student_id, vocabulary_word_id) DO NOTHING;

-- 11. Add some points transactions for realistic ranking
INSERT INTO points_transactions (
    organization_id,
    student_id,
    transaction_type,
    points_amount,
    coins_earned,
    reason,
    category,
    awarded_by,
    created_at
)
SELECT 
    'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid,
    s.id,
    'earned',
    (5 + RANDOM() * 15)::integer, -- 5-20 points
    (1 + RANDOM() * 3)::integer,  -- 1-4 coins
    'Vocabulary practice completed',
    'vocabulary',
    (SELECT id FROM teachers WHERE organization_id = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid LIMIT 1),
    NOW() - (RANDOM() * INTERVAL '30 days')
FROM temp_students s,
generate_series(1, 3 + (RANDOM() * 7)::integer) -- 3-10 transactions per student
WHERE RANDOM() < 0.8; -- 80% chance for each transaction

COMMIT;

-- Final verification and summary
DO $$
DECLARE
    org_count integer;
    student_count integer; 
    group_count integer;
    vocab_count integer;
    lesson_count integer;
    homework_count integer;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations WHERE id = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid;
    SELECT COUNT(*) INTO student_count FROM students WHERE organization_id = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid;
    SELECT COUNT(*) INTO group_count FROM groups WHERE organization_id = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid;
    SELECT COUNT(*) INTO vocab_count FROM vocabulary_words WHERE organization_id = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid;
    SELECT COUNT(*) INTO lesson_count FROM lessons WHERE organization_id = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid;
    SELECT COUNT(*) INTO homework_count FROM hometasks WHERE organization_id = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'::uuid;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STUDENT APP TEST DATA SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Organizations: %', org_count;
    RAISE NOTICE 'Students: %', student_count;
    RAISE NOTICE 'Groups: %', group_count;
    RAISE NOTICE 'Vocabulary Words: %', vocab_count;
    RAISE NOTICE 'Lessons: %', lesson_count;
    RAISE NOTICE 'Homework Assignments: %', homework_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Test Organization ID: a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c';
    RAISE NOTICE 'Ready for mobile app integration!';
    RAISE NOTICE '========================================';
END $$;