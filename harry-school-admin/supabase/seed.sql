-- Harry School CRM Seed Data
-- Development and testing data for comprehensive system testing

-- Clear existing data (in correct order to respect foreign key constraints)
TRUNCATE TABLE activity_logs CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE student_group_enrollments CASCADE;
TRUNCATE TABLE teacher_group_assignments CASCADE;
TRUNCATE TABLE groups CASCADE;
TRUNCATE TABLE students CASCADE;
TRUNCATE TABLE teachers CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE organizations CASCADE;
TRUNCATE TABLE system_settings CASCADE;

-- Create Organizations
INSERT INTO organizations (id, name, slug, logo_url, address, contact_info, settings, subscription_plan, subscription_status, max_students, max_teachers, max_groups) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Harry School of Excellence',
    'harry-school',
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200',
    '{"street": "123 Education Avenue", "city": "Tashkent", "region": "Tashkent Region", "postal_code": "100000", "country": "Uzbekistan"}',
    '{"phone": "+998712345678", "email": "info@harryschool.uz", "website": "https://harryschool.uz"}',
    '{"academic_year": "2024-2025", "grading_system": "percentage", "languages": ["en", "ru", "uz"], "timezone": "Asia/Tashkent"}',
    'premium',
    'active',
    1000,
    100,
    50
),
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Elite Learning Center',
    'elite-learning',
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200',
    '{"street": "456 Knowledge Street", "city": "Samarkand", "region": "Samarkand Region", "postal_code": "140000", "country": "Uzbekistan"}',
    '{"phone": "+998662345678", "email": "contact@elitelearning.uz", "website": "https://elitelearning.uz"}',
    '{"academic_year": "2024-2025", "grading_system": "letter", "languages": ["en", "uz"], "timezone": "Asia/Tashkent"}',
    'basic',
    'active',
    500,
    50,
    25
),
(
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'International Academy',
    'international-academy',
    'https://images.unsplash.com/photo-1562774053-701939374585?w=200',
    '{"street": "789 Global Plaza", "city": "Bukhara", "region": "Bukhara Region", "postal_code": "200000", "country": "Uzbekistan"}',
    '{"phone": "+998652345678", "email": "admin@intlacademy.uz", "website": "https://intlacademy.uz"}',
    '{"academic_year": "2024-2025", "grading_system": "ib", "languages": ["en", "ru"], "timezone": "Asia/Tashkent"}',
    'premium',
    'trial',
    750,
    75,
    40
);

-- Create sample profiles (admin users) - Note: These would normally be created through auth
-- For testing purposes, we'll create mock auth user IDs
INSERT INTO profiles (id, organization_id, email, full_name, avatar_url, phone, role, language_preference, timezone, notification_preferences, login_count) VALUES
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@harryschool.uz',
    'John Administrator',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    '+998901234567',
    'admin',
    'en',
    'Asia/Tashkent',
    '{"email_notifications": true, "system_notifications": true, "student_updates": true, "payment_reminders": true}',
    25
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'director@harryschool.uz',
    'Sarah Director',
    'https://images.unsplash.com/photo-1494790108755-2616b612b750?w=150',
    '+998901234568',
    'superadmin',
    'en',
    'Asia/Tashkent',
    '{"email_notifications": true, "system_notifications": true, "student_updates": false, "payment_reminders": true}',
    15
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'admin@elitelearning.uz',
    'Ahmad Karimov',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    '+998901234569',
    'admin',
    'uz',
    'Asia/Tashkent',
    '{"email_notifications": true, "system_notifications": true, "student_updates": true, "payment_reminders": true}',
    10
);

-- Create Teachers for Harry School
INSERT INTO teachers (id, organization_id, first_name, last_name, email, phone, date_of_birth, gender, employee_id, hire_date, employment_status, contract_type, salary_amount, salary_currency, qualifications, specializations, certifications, languages_spoken, address, emergency_contact, notes, profile_image_url, created_by, updated_by) VALUES
(
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Michael',
    'Thompson',
    'michael.thompson@harryschool.uz',
    '+998901111111',
    '1985-03-15',
    'male',
    'TEA001',
    '2020-09-01',
    'active',
    'full_time',
    3500000,
    'UZS',
    '[{"degree": "Bachelor of Science", "institution": "MIT", "year": 2007, "field_of_study": "Mathematics", "grade": "Magna Cum Laude"}, {"degree": "Master of Education", "institution": "Harvard University", "year": 2009, "field_of_study": "Secondary Education"}]',
    ARRAY['Mathematics', 'Physics', 'Statistics'],
    '[{"name": "Certified Mathematics Educator", "issuer": "National Education Association", "issue_date": "2010-06-15", "credential_id": "CME-2010-1234"}]',
    ARRAY['English', 'Spanish', 'Russian'],
    '{"street": "15 Teachers Lane", "city": "Tashkent", "region": "Tashkent Region", "postal_code": "100001", "country": "Uzbekistan"}',
    '{"name": "Emily Thompson", "relationship": "spouse", "phone": "+998901111112", "email": "emily.t@email.com"}',
    'Excellent mathematics teacher with 15+ years experience. Known for innovative teaching methods.',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Maria',
    'Rodriguez',
    'maria.rodriguez@harryschool.uz',
    '+998901111113',
    '1990-07-22',
    'female',
    'TEA002',
    '2021-01-15',
    'active',
    'full_time',
    3200000,
    'UZS',
    '[{"degree": "Bachelor of Arts", "institution": "Cambridge University", "year": 2012, "field_of_study": "English Literature", "grade": "First Class Honours"}, {"degree": "TESOL Certification", "institution": "Trinity College London", "year": 2013}]',
    ARRAY['English', 'Literature', 'Creative Writing'],
    '[{"name": "TESOL Certification", "issuer": "Trinity College London", "issue_date": "2013-08-20", "credential_id": "TESOL-2013-5678"}]',
    ARRAY['English', 'Spanish', 'Italian'],
    '{"street": "22 Literature Street", "city": "Tashkent", "region": "Tashkent Region", "postal_code": "100002", "country": "Uzbekistan"}',
    '{"name": "Carlos Rodriguez", "relationship": "brother", "phone": "+998901111114", "email": "carlos.r@email.com"}',
    'Dynamic English teacher specializing in literature and creative writing. Published author.',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'David',
    'Chen',
    'david.chen@harryschool.uz',
    '+998901111115',
    '1988-11-10',
    'male',
    'TEA003',
    '2019-08-20',
    'active',
    'full_time',
    3800000,
    'UZS',
    '[{"degree": "Bachelor of Science", "institution": "Stanford University", "year": 2010, "field_of_study": "Computer Science", "grade": "Summa Cum Laude"}, {"degree": "Master of Science", "institution": "Carnegie Mellon", "year": 2012, "field_of_study": "Software Engineering"}]',
    ARRAY['Computer Science', 'Programming', 'Web Development', 'Database Design'],
    '[{"name": "Certified Software Developer", "issuer": "IEEE", "issue_date": "2012-12-01", "credential_id": "CSD-2012-9999"}]',
    ARRAY['English', 'Mandarin', 'Korean'],
    '{"street": "88 Tech Boulevard", "city": "Tashkent", "region": "Tashkent Region", "postal_code": "100003", "country": "Uzbekistan"}',
    '{"name": "Linda Chen", "relationship": "wife", "phone": "+998901111116", "email": "linda.c@email.com"}',
    'Expert computer science instructor. Former Silicon Valley engineer with startup experience.',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Sophie',
    'Laurent',
    'sophie.laurent@harryschool.uz',
    '+998901111117',
    '1992-04-05',
    'female',
    'TEA004',
    '2022-02-01',
    'active',
    'part_time',
    2000000,
    'UZS',
    '[{"degree": "Bachelor of Arts", "institution": "Sorbonne University", "year": 2014, "field_of_study": "French Language and Literature"}, {"degree": "Master of Arts", "institution": "University of Oxford", "year": 2016, "field_of_study": "Comparative Literature"}]',
    ARRAY['French', 'European Literature', 'Translation'],
    '[{"name": "Native French Speaker Certification", "issuer": "Alliance Française", "issue_date": "2014-09-15"}]',
    ARRAY['French', 'English', 'German'],
    '{"street": "5 International Avenue", "city": "Tashkent", "region": "Tashkent Region", "postal_code": "100004", "country": "Uzbekistan"}',
    '{"name": "Jean Laurent", "relationship": "father", "phone": "+33123456789", "email": "jean.l@email.com"}',
    'Native French speaker. Specializes in advanced French literature and conversation.',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Create Groups for Harry School
INSERT INTO groups (id, organization_id, name, description, group_code, subject, level, curriculum, schedule, start_date, end_date, duration_weeks, max_students, status, group_type, price_per_student, currency, classroom, required_materials, notes, created_by, updated_by) VALUES
(
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Advanced Calculus',
    'Advanced calculus course covering limits, derivatives, integrals, and applications',
    'CALC-ADV-001',
    'Mathematics',
    'Advanced',
    '{"topics": ["Limits and Continuity", "Derivatives", "Applications of Derivatives", "Integrals", "Applications of Integrals", "Infinite Series"], "learning_objectives": ["Master calculus concepts", "Solve complex problems", "Apply to real-world scenarios"], "prerequisites": ["Pre-Calculus", "Trigonometry"]}',
    '{"days": ["Monday", "Wednesday", "Friday"], "start_time": "10:00", "end_time": "11:30", "timezone": "Asia/Tashkent"}',
    '2024-09-01',
    '2025-01-15',
    20,
    15,
    'active',
    'regular',
    800000,
    'UZS',
    'Room 201',
    '["Scientific Calculator", "Graphing Paper", "Textbook: Advanced Calculus by Smith"]',
    'Intensive calculus preparation for university entrance exams.',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'English Literature Honors',
    'Comprehensive study of English and American literature from medieval to contemporary periods',
    'ENG-LIT-HON',
    'English',
    'Advanced',
    '{"topics": ["Medieval Literature", "Renaissance Drama", "Romantic Poetry", "Victorian Novels", "Modern American Literature", "Contemporary Works"], "learning_objectives": ["Analyze literary works", "Develop critical thinking", "Improve writing skills"], "prerequisites": ["Intermediate English", "Basic Literature"]}',
    '{"days": ["Tuesday", "Thursday"], "start_time": "14:00", "end_time": "16:00", "timezone": "Asia/Tashkent"}',
    '2024-09-05',
    '2025-01-20',
    20,
    12,
    'active',
    'regular',
    750000,
    'UZS',
    'Room 105',
    '["Literature Anthology", "Writing Journal", "Dictionary", "Style Guide"]',
    'For students preparing for literature competitions and university entrance.',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Web Development Bootcamp',
    'Intensive web development course covering modern technologies and frameworks',
    'WEB-DEV-001',
    'Computer Science',
    'Intermediate',
    '{"topics": ["HTML5 & CSS3", "JavaScript ES6+", "React.js", "Node.js", "Database Design", "API Development"], "learning_objectives": ["Build responsive websites", "Develop full-stack applications", "Deploy to production"], "prerequisites": ["Basic Programming", "Computer Literacy"]}',
    '{"days": ["Monday", "Wednesday", "Friday"], "start_time": "16:00", "end_time": "18:30", "timezone": "Asia/Tashkent"}',
    '2024-09-10',
    '2024-12-15',
    14,
    10,
    'active',
    'intensive',
    1200000,
    'UZS',
    'Computer Lab A',
    '["Laptop", "Code Editor", "GitHub Account", "Project Portfolio"]',
    'Hands-on bootcamp with real-world projects and industry mentorship.',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'French Conversation Advanced',
    'Advanced French conversation and culture immersion class',
    'FR-CONV-ADV',
    'French',
    'Advanced',
    '{"topics": ["Advanced Grammar", "French Culture", "Business French", "Literature Discussion", "Current Events", "Pronunciation"], "learning_objectives": ["Achieve fluency", "Understand cultural context", "Professional communication"], "prerequisites": ["Intermediate French", "Basic Conversation Skills"]}',
    '{"days": ["Tuesday", "Thursday", "Saturday"], "start_time": "09:00", "end_time": "10:30", "timezone": "Asia/Tashkent"}',
    '2024-09-03',
    '2024-12-20',
    16,
    8,
    'active',
    'regular',
    600000,
    'UZS',
    'Room 301',
    '["French-English Dictionary", "Cultural Reader", "Audio Materials"]',
    'Small class size for personalized attention and maximum speaking practice.',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Create Students for Harry School
INSERT INTO students (id, organization_id, first_name, last_name, date_of_birth, gender, student_id, enrollment_date, enrollment_status, grade_level, primary_phone, email, address, parent_guardian_info, emergency_contacts, previous_education, payment_plan, tuition_fee, currency, payment_status, profile_image_url, notes, created_by, updated_by) VALUES
(
    's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Alice',
    'Johnson',
    '2006-03-12',
    'female',
    'STU-2024-001',
    '2024-08-15',
    'active',
    'Grade 12',
    '+998901222221',
    'alice.johnson@student.harryschool.uz',
    '{"street": "45 Student Avenue", "city": "Tashkent", "region": "Tashkent Region", "postal_code": "100010", "country": "Uzbekistan"}',
    '[{"name": "Robert Johnson", "relationship": "father", "phone": "+998901222222", "email": "robert.j@email.com", "occupation": "Engineer", "is_primary_contact": true}, {"name": "Mary Johnson", "relationship": "mother", "phone": "+998901222223", "email": "mary.j@email.com", "occupation": "Doctor", "is_primary_contact": false}]',
    '[{"name": "Robert Johnson", "relationship": "father", "phone": "+998901222222", "email": "robert.j@email.com"}, {"name": "Sarah Wilson", "relationship": "aunt", "phone": "+998901222224", "email": "sarah.w@email.com"}]',
    '[{"institution": "City High School", "level": "Secondary", "start_date": "2020-09-01", "end_date": "2024-06-15", "completed": true, "grades": {"Mathematics": "A", "English": "A-", "Science": "B+"}}]',
    'monthly',
    500000,
    'UZS',
    'current',
    'https://images.unsplash.com/photo-1494790108755-2616b612b750?w=150',
    'Excellent student with strong academic performance. Planning to study engineering.',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Benjamin',
    'Park',
    '2005-09-28',
    'male',
    'STU-2024-002',
    '2024-08-20',
    'active',
    'Grade 12',
    '+998901333331',
    'benjamin.park@student.harryschool.uz',
    '{"street": "78 Academic Road", "city": "Tashkent", "region": "Tashkent Region", "postal_code": "100011", "country": "Uzbekistan"}',
    '[{"name": "James Park", "relationship": "father", "phone": "+998901333332", "email": "james.p@email.com", "occupation": "Business Owner", "is_primary_contact": true}]',
    '[{"name": "James Park", "relationship": "father", "phone": "+998901333332", "email": "james.p@email.com"}, {"name": "Linda Park", "relationship": "mother", "phone": "+998901333333", "email": "linda.p@email.com"}]',
    '[{"institution": "International School", "level": "Secondary", "start_date": "2019-09-01", "end_date": "2024-06-15", "completed": true, "grades": {"Literature": "A+", "History": "A", "Philosophy": "A-"}}]',
    'quarterly',
    1500000,
    'UZS',
    'current',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'Passionate about literature and writing. Editor of school newspaper.',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Catherine',
    'Kim',
    '2007-01-15',
    'female',
    'STU-2024-003',
    '2024-08-25',
    'active',
    'Grade 11',
    '+998901444441',
    'catherine.kim@student.harryschool.uz',
    '{"street": "23 Innovation Street", "city": "Tashkent", "region": "Tashkent Region", "postal_code": "100012", "country": "Uzbekistan"}',
    '[{"name": "Daniel Kim", "relationship": "father", "phone": "+998901444442", "email": "daniel.k@email.com", "occupation": "Software Engineer", "is_primary_contact": true}, {"name": "Susan Kim", "relationship": "mother", "phone": "+998901444443", "email": "susan.k@email.com", "occupation": "Graphic Designer", "is_primary_contact": false}]',
    '[{"name": "Daniel Kim", "relationship": "father", "phone": "+998901444442", "email": "daniel.k@email.com"}]',
    '[{"institution": "Tech Academy", "level": "Secondary", "start_date": "2021-09-01", "end_date": "2024-06-15", "completed": true, "grades": {"Computer Science": "A+", "Mathematics": "A", "Physics": "A-"}}]',
    'monthly',
    800000,
    'UZS',
    'current',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    'Tech-savvy student interested in software development and AI. Active in coding competitions.',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Emma',
    'Dubois',
    '2006-07-03',
    'female',
    'STU-2024-004',
    '2024-09-01',
    'active',
    'Grade 12',
    '+998901555551',
    'emma.dubois@student.harryschool.uz',
    '{"street": "67 Cultural Boulevard", "city": "Tashkent", "region": "Tashkent Region", "postal_code": "100013", "country": "Uzbekistan"}',
    '[{"name": "Pierre Dubois", "relationship": "father", "phone": "+998901555552", "email": "pierre.d@email.com", "occupation": "Diplomat", "is_primary_contact": true}]',
    '[{"name": "Pierre Dubois", "relationship": "father", "phone": "+998901555552", "email": "pierre.d@email.com"}, {"name": "Marie Dubois", "relationship": "mother", "phone": "+33123456789", "email": "marie.d@email.com"}]',
    '[{"institution": "French Lyceum", "level": "Secondary", "start_date": "2020-09-01", "end_date": "2024-06-15", "completed": true, "grades": {"French": "A+", "Literature": "A", "European History": "A+"}}]',
    'annual',
    6000000,
    'UZS',
    'paid_ahead',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    'Bilingual student (French/English) with excellent language skills. Planning to study international relations.',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Create Teacher Group Assignments
INSERT INTO teacher_group_assignments (id, organization_id, teacher_id, group_id, role, start_date, compensation_rate, compensation_type, status, created_by, updated_by) VALUES
(
    'ta1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'primary',
    '2024-09-01',
    150000,
    'per_session',
    'active',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'ta2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'primary',
    '2024-09-05',
    120000,
    'per_session',
    'active',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'ta3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'primary',
    '2024-09-10',
    200000,
    'per_session',
    'active',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'ta4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'primary',
    '2024-09-03',
    100000,
    'per_session',
    'active',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Create Student Group Enrollments
INSERT INTO student_group_enrollments (id, organization_id, student_id, group_id, enrollment_date, start_date, status, tuition_amount, amount_paid, payment_status, created_by, updated_by) VALUES
(
    'se1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '2024-08-15',
    '2024-09-01',
    'active',
    800000,
    800000,
    'paid',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'se2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    '2024-08-20',
    '2024-09-05',
    'active',
    750000,
    750000,
    'paid',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'se3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    '2024-08-25',
    '2024-09-10',
    'active',
    1200000,
    600000,
    'partial',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'se4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    '2024-09-01',
    '2024-09-03',
    'active',
    600000,
    600000,
    'paid',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Create System Settings
INSERT INTO system_settings (id, organization_id, category, key, value, description, data_type, is_public, created_by, updated_by) VALUES
(
    'set1ebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'general',
    'school_name',
    '"Harry School of Excellence"',
    'Official name of the school',
    'string',
    true,
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'set2ebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'academic',
    'grading_system',
    '"percentage"',
    'Primary grading system used',
    'string',
    true,
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'set3ebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'financial',
    'default_currency',
    '"UZS"',
    'Default currency for all transactions',
    'string',
    true,
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'set4ebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'notification',
    'email_notifications',
    'true',
    'Enable email notifications',
    'boolean',
    false,
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'set5ebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    NULL,
    'system',
    'maintenance_mode',
    'false',
    'System maintenance mode',
    'boolean',
    true,
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
);

-- Create Sample Notifications
INSERT INTO notifications (id, organization_id, user_id, type, title, message, priority, delivery_method, related_student_id, related_teacher_id, related_group_id, is_read, metadata) VALUES
(
    'not1ebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'enrollment',
    'New Student Enrollment',
    'Emma Dubois has enrolled in French Conversation Advanced class',
    'normal',
    ARRAY['in_app', 'email'],
    's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    false,
    '{"enrollment_date": "2024-09-01", "class_start": "2024-09-03"}'
),
(
    'not2ebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'payment',
    'Payment Received',
    'Payment received for Alice Johnson - Advanced Calculus course',
    'low',
    ARRAY['in_app'],
    's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    NULL,
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    true,
    '{"amount": 800000, "currency": "UZS", "payment_method": "bank_transfer"}'
),
(
    'not3ebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'system',
    'New Teacher Added',
    'Sophie Laurent has been added as a French teacher',
    'normal',
    ARRAY['in_app', 'email'],
    NULL,
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    NULL,
    false,
    '{"hire_date": "2022-02-01", "specializations": ["French", "European Literature"]}'
);

-- Create Sample Activity Logs
INSERT INTO activity_logs (id, organization_id, user_id, user_email, user_name, user_role, action, resource_type, resource_id, resource_name, description, old_values, new_values, success, metadata) VALUES
(
    'log1ebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@harryschool.uz',
    'John Administrator',
    'admin',
    'CREATE',
    'teachers',
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'Sophie Laurent',
    'Created new teacher: Sophie Laurent',
    NULL,
    '{"first_name": "Sophie", "last_name": "Laurent", "specializations": ["French", "European Literature"]}',
    true,
    '{"ip_address": "192.168.1.10", "user_agent": "Mozilla/5.0"}'
),
(
    'log2ebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@harryschool.uz',
    'John Administrator',
    'admin',
    'CREATE',
    'groups',
    'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'French Conversation Advanced',
    'Created new group: French Conversation Advanced',
    NULL,
    '{"name": "French Conversation Advanced", "subject": "French", "max_students": 8}',
    true,
    '{"ip_address": "192.168.1.10", "user_agent": "Mozilla/5.0"}'
),
(
    'log3ebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@harryschool.uz',
    'John Administrator',
    'admin',
    'ENROLL',
    'student_group_enrollments',
    'se4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'Emma Dubois enrolled in French Conversation Advanced',
    'Enrolled student Emma Dubois in French Conversation Advanced',
    NULL,
    '{"student_name": "Emma Dubois", "group_name": "French Conversation Advanced", "tuition_amount": 600000}',
    true,
    '{"ip_address": "192.168.1.10", "user_agent": "Mozilla/5.0"}'
);

-- Update group enrollment counts (trigger should handle this, but let's be explicit)
UPDATE groups SET current_enrollment = (
    SELECT COUNT(*) 
    FROM student_group_enrollments 
    WHERE group_id = groups.id 
    AND deleted_at IS NULL 
    AND status IN ('enrolled', 'active')
);

-- Final verification queries
SELECT 'Organizations created:' as info, COUNT(*) as count FROM organizations WHERE deleted_at IS NULL;
SELECT 'Profiles created:' as info, COUNT(*) as count FROM profiles WHERE deleted_at IS NULL;
SELECT 'Teachers created:' as info, COUNT(*) as count FROM teachers WHERE deleted_at IS NULL;
SELECT 'Students created:' as info, COUNT(*) as count FROM students WHERE deleted_at IS NULL;
SELECT 'Groups created:' as info, COUNT(*) as count FROM groups WHERE deleted_at IS NULL;
SELECT 'Enrollments created:' as info, COUNT(*) as count FROM student_group_enrollments WHERE deleted_at IS NULL;
SELECT 'Assignments created:' as info, COUNT(*) as count FROM teacher_group_assignments WHERE deleted_at IS NULL;
SELECT 'System settings created:' as info, COUNT(*) as count FROM system_settings;
SELECT 'Notifications created:' as info, COUNT(*) as count FROM notifications WHERE deleted_at IS NULL;
SELECT 'Activity logs created:' as info, COUNT(*) as count FROM activity_logs;