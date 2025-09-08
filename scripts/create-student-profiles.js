/**
 * Create Student Profiles for Testing
 * Links existing students to auth profiles
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c';

async function createStudentProfiles() {
  console.log('🎓 Creating Student Profiles...\n');

  // Get existing students
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('is_active', true);

  if (studentsError || !students || students.length === 0) {
    console.log('❌ No students found to create profiles for');
    return;
  }

  console.log(`Found ${students.length} students\n`);

  // Profile data for each student
  const profileData = [
    { username: 'student1', password: 'Harry2025!' },
    { username: 'student2', password: 'Harry2025!' },
    { username: 'demo_student', password: 'Demo2025!' }
  ];

  for (let i = 0; i < students.length && i < profileData.length; i++) {
    const student = students[i];
    const profile = profileData[i];

    // Check if profile already exists
    const { data: existing } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('student_id', student.id)
      .single();

    if (existing) {
      console.log(`✅ Profile exists for ${student.first_name} ${student.last_name} (username: ${existing.username})`);
      continue;
    }

    // Calculate if minor
    const birthDate = new Date(student.date_of_birth);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const isMinor = age < 18;

    // Create profile
    const { data: newProfile, error: profileError } = await supabase
      .from('student_profiles')
      .insert({
        student_id: student.id,
        organization_id: ORG_ID,
        username: profile.username,
        password_visible: profile.password,
        is_minor: isMinor,
        guardian_email: isMinor ? student.parent_guardian_info?.email || null : null,
        privacy_level: isMinor ? 'protected' : 'standard',
        vocabulary_daily_goal: 5,
        notification_preferences: {
          email: true,
          push: true,
          homework_reminders: true,
          lesson_reminders: true
        },
        preferred_language: 'en',
        is_active: true
      })
      .select()
      .single();

    if (profileError) {
      console.log(`❌ Failed to create profile for ${student.first_name}:`, profileError.message);
    } else {
      console.log(`✅ Created profile for ${student.first_name} ${student.last_name}`);
      console.log(`   Username: ${profile.username}`);
      console.log(`   Password: ${profile.password}`);
      console.log(`   Minor: ${isMinor}`);
    }
  }

  // Create some test homework
  console.log('\n📝 Creating Test Homework...');
  
  // Get groups
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .eq('organization_id', ORG_ID)
    .limit(3);

  if (groups && groups.length > 0) {
    const homeworkTasks = [
      {
        title: 'Write about your weekend',
        instructions: 'Write a 200-word essay about what you did last weekend. Use past tense verbs.',
        group_id: groups[0].id,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        points_value: 20,
        task_type: 'written'
      },
      {
        title: 'Vocabulary Practice',
        instructions: 'Complete the vocabulary exercises in Unit 5. Learn 10 new words.',
        group_id: groups[0].id,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        points_value: 15,
        task_type: 'written'
      }
    ];

    for (const task of homeworkTasks) {
      const { data: homework, error: hwError } = await supabase
        .from('hometasks')
        .insert({
          organization_id: ORG_ID,
          ...task,
          difficulty_level: 2,
          max_attempts: 3,
          is_published: true
        })
        .select()
        .single();

      if (hwError) {
        console.log(`❌ Failed to create homework:`, hwError.message);
      } else {
        console.log(`✅ Created homework: ${task.title}`);
      }
    }
  }

  // Create some vocabulary words with correct schema
  console.log('\n📚 Creating Vocabulary Words...');
  
  const vocabWords = [
    {
      word: 'Serendipity',
      part_of_speech: 'noun',
      phonetics: '/ˌserənˈdɪpɪti/',
      example_sentence: 'Finding that book was pure serendipity.',
      difficulty_level: 3,
      category: 'abstract'
    },
    {
      word: 'Resilient',
      part_of_speech: 'adjective',
      phonetics: '/rɪˈzɪliənt/',
      example_sentence: 'She remained resilient despite the challenges.',
      difficulty_level: 2,
      category: 'personality'
    },
    {
      word: 'Ephemeral',
      part_of_speech: 'adjective',
      phonetics: '/ɪˈfemərəl/',
      example_sentence: 'The beauty of cherry blossoms is ephemeral.',
      difficulty_level: 4,
      category: 'time'
    }
  ];

  for (const word of vocabWords) {
    const { error: vocabError } = await supabase
      .from('vocabulary_words')
      .insert({
        organization_id: ORG_ID,
        ...word,
        translation_uzbek: `${word.word} (UZ)`,
        translation_russian: `${word.word} (RU)`,
        synonyms: [],
        is_active: true
      });

    if (vocabError) {
      console.log(`❌ Failed to create word ${word.word}:`, vocabError.message);
    } else {
      console.log(`✅ Created vocabulary word: ${word.word}`);
    }
  }

  console.log('\n✅ Setup Complete!');
  console.log('\n🔐 Test Credentials:');
  console.log('===================');
  
  for (let i = 0; i < Math.min(students.length, profileData.length); i++) {
    const student = students[i];
    const profile = profileData[i];
    console.log(`\n${i + 1}. ${student.first_name} ${student.last_name}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   Username: ${profile.username}`);
    console.log(`   Password: ${profile.password}`);
    console.log(`   Student ID: ${student.student_id}`);
  }

  console.log('\n📱 Mobile Team Instructions:');
  console.log('============================');
  console.log('1. Use /api/auth/student-simple for authentication');
  console.log('2. Send POST with { "email": "..." } or { "username": "..." }');
  console.log('3. Token returned is base64 encoded (simplified auth)');
  console.log('4. Use token in Authorization: Bearer <token> header');
}

createStudentProfiles()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });