/**
 * Create Test Students - Minimal Required Fields Only
 * Using only required fields discovered from schema testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c';

async function createMinimalTestData() {
  console.log('🚀 Creating test data with minimal required fields...\n');

  // 1. Create students with ONLY required fields
  console.log('Creating test students...');
  const testStudents = [
    {
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@harry-school.test',
      primary_phone: '+998901234567',
      date_of_birth: '2005-03-15',
      gender: 'male',
      grade_level: '10th',
      student_id: 'STU001'
    },
    {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@harry-school.test',
      primary_phone: '+998901234568',
      date_of_birth: '2006-07-22',
      gender: 'female',
      grade_level: '9th',
      student_id: 'STU002'
    },
    {
      first_name: 'Demo',
      last_name: 'User',
      email: 'demo@harry-school.test',
      primary_phone: '+998901234571',
      date_of_birth: '2005-01-01',
      gender: 'other',
      grade_level: '10th',
      student_id: 'DEMO001'
    }
  ];

  const createdStudents = [];
  
  for (const studentData of testStudents) {
    // Check if student exists
    const { data: existing } = await supabase
      .from('students')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('email', studentData.email)
      .single();

    if (existing) {
      console.log(`✅ Student exists: ${studentData.first_name} ${studentData.last_name}`);
      createdStudents.push(existing);
      continue;
    }

    // Create with minimal fields, let database handle computed columns
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        organization_id: ORG_ID,
        first_name: studentData.first_name,
        last_name: studentData.last_name,
        // full_name is computed, don't set it
        email: studentData.email,
        primary_phone: studentData.primary_phone,
        date_of_birth: studentData.date_of_birth,
        gender: studentData.gender,
        grade_level: studentData.grade_level,
        student_id: studentData.student_id,
        enrollment_date: '2024-09-01',
        enrollment_status: 'active',
        payment_status: 'current',
        tuition_fee: 500000,
        currency: 'UZS',
        is_active: true,
        // Set initial gamification values
        total_points: 100,
        current_level: 1,
        available_coins: 10,
        academic_score: 85,
        engagement_level: 90
      })
      .select()
      .single();

    if (studentError) {
      console.log(`❌ Failed to create student ${studentData.first_name}:`, studentError.message);
    } else {
      console.log(`✅ Student created: ${student.first_name} ${student.last_name} (${student.id})`);
      createdStudents.push(student);
    }
  }

  // 2. Create vocabulary words (simpler structure)
  console.log('\nCreating vocabulary words...');
  const vocabularyWords = [
    { word: 'Hello', definition: 'A greeting', level: 'A1' },
    { word: 'Goodbye', definition: 'A farewell', level: 'A1' },
    { word: 'Thank you', definition: 'Expression of gratitude', level: 'A1' },
    { word: 'Please', definition: 'Polite request', level: 'A1' },
    { word: 'Resilient', definition: 'Able to recover quickly', level: 'B1' }
  ];

  for (const wordData of vocabularyWords) {
    const { data: word, error: wordError } = await supabase
      .from('vocabulary_words')
      .insert({
        organization_id: ORG_ID,
        word: wordData.word,
        definition: wordData.definition,
        part_of_speech: 'word',
        difficulty_level: wordData.level,
        example_sentences: [`Example with ${wordData.word}`],
        synonyms: [],
        tags: ['vocabulary'],
        is_active: true
      })
      .select()
      .single();

    if (wordError) {
      console.log(`❌ Failed to create word ${wordData.word}:`, wordError.message);
    } else {
      console.log(`✅ Created vocabulary word: ${word.word}`);
    }
  }

  // 3. Create lessons with valid age groups
  console.log('\nCreating sample lessons...');
  
  // First, let's check what age_group values are valid
  const { data: sampleLesson, error: lessonCheckError } = await supabase
    .from('lessons')
    .insert({
      title: 'Test Lesson',
      description: 'Test',
      level: 'A1',
      subject: 'English',
      age_group: 'teens', // Try a simple value
      estimated_duration: 60,
      total_tasks: 5,
      difficulty_score: 3,
      learning_objectives: ['Learn'],
      is_published: true
    })
    .select()
    .single();

  if (lessonCheckError) {
    console.log('Age group test failed:', lessonCheckError.message);
    
    // Try with different age_group format
    const { data: lesson2, error: lesson2Error } = await supabase
      .from('lessons')
      .insert({
        title: 'Introduction to English',
        description: 'Basic English lesson',
        level: 'A1',
        subject: 'English',
        age_group: 'primary', // Try 'primary', 'secondary', etc.
        estimated_duration: 60,
        total_tasks: 5,
        difficulty_score: 1,
        learning_objectives: ['Learn basic greetings'],
        is_published: true
      })
      .select()
      .single();

    if (lesson2Error) {
      console.log('❌ Failed to create lesson:', lesson2Error.message);
    } else {
      console.log(`✅ Created lesson: ${lesson2.title}`);
    }
  } else {
    console.log(`✅ Created lesson: ${sampleLesson.title}`);
  }

  // 4. Get groups and enroll students
  console.log('\nEnrolling students in groups...');
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .eq('organization_id', ORG_ID)
    .limit(3);

  if (groups && groups.length > 0 && createdStudents.length > 0) {
    for (let i = 0; i < Math.min(createdStudents.length, groups.length); i++) {
      const student = createdStudents[i];
      const group = groups[i % groups.length];

      const { data: enrollment, error: enrollError } = await supabase
        .from('student_group_enrollments')
        .insert({
          organization_id: ORG_ID,
          student_id: student.id,
          group_id: group.id,
          enrollment_date: '2024-09-01',
          start_date: '2024-09-01',
          status: 'active',
          payment_status: 'paid',
          amount_paid: 500000,
          certificate_issued: false
        })
        .select()
        .single();

      if (enrollError) {
        if (enrollError.message.includes('duplicate')) {
          console.log(`✅ Enrollment exists: ${student.first_name} in ${group.name}`);
        } else {
          console.log(`❌ Failed to enroll:`, enrollError.message);
        }
      } else {
        console.log(`✅ Enrolled ${student.first_name} in ${group.name}`);
      }
    }
  }

  // 5. Create rankings for students
  console.log('\nCreating student rankings...');
  for (const student of createdStudents) {
    const { error: rankError } = await supabase
      .from('student_rankings')
      .insert({
        organization_id: ORG_ID,
        student_id: student.id,
        total_points: student.total_points || 100,
        total_coins: student.available_coins || 10,
        current_level: student.current_level || 1,
        level_progress: 25,
        current_rank: 1,
        class_rank: 1,
        current_streak: 3,
        longest_streak: 7,
        last_activity_date: new Date().toISOString(),
        points_to_next_level: 100,
        total_points_earned: 100,
        weekly_points: 50,
        monthly_points: 200,
        academic_year_points: 100,
        is_active: true
      });

    if (rankError) {
      if (rankError.message.includes('duplicate')) {
        console.log(`✅ Ranking exists for ${student.first_name}`);
      } else {
        console.log(`❌ Failed to create ranking:`, rankError.message);
      }
    } else {
      console.log(`✅ Created ranking for ${student.first_name}`);
    }
  }

  console.log('\n✅ Test data creation complete!');
  
  console.log('\n📋 Summary:');
  console.log('===========');
  console.log(`Students created: ${createdStudents.length}`);
  console.log(`Groups available: ${groups?.length || 0}`);
  
  console.log('\n🎓 Test Student Details:');
  console.log('========================');
  createdStudents.forEach(student => {
    console.log(`\nStudent: ${student.first_name} ${student.last_name}`);
    console.log(`  Email: ${student.email}`);
    console.log(`  ID: ${student.student_id}`);
    console.log(`  Database ID: ${student.id}`);
  });
}

createMinimalTestData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });