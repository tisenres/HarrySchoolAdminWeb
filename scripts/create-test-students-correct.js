/**
 * Create Test Students with Correct Schema
 * Based on actual Supabase table structure discovery
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c';

async function createTestData() {
  console.log('🚀 Creating test data with correct schema...\n');

  const results = {
    teachers: [],
    groups: [],
    students: [],
    enrollments: [],
    vocabulary: [],
    lessons: [],
    errors: []
  };

  // 1. Get existing teacher (already created)
  console.log('Getting existing teacher...');
  const { data: teachers } = await supabase
    .from('teachers')
    .select('*')
    .eq('organization_id', ORG_ID)
    .limit(1);
  
  const teacher = teachers?.[0];
  if (teacher) {
    console.log('✅ Found teacher:', teacher.full_name);
    results.teachers.push(teacher);
  }

  // 2. Create test groups with correct schema
  console.log('\nCreating test groups...');
  const groupsData = [
    { 
      name: 'Beginner English A1',
      subject: 'English',
      level: 'A1',
      max_students: 20,
      classroom: 'Room 101'
    },
    { 
      name: 'Intermediate English B1',
      subject: 'English', 
      level: 'B1',
      max_students: 15,
      classroom: 'Room 102'
    },
    { 
      name: 'Advanced English C1',
      subject: 'English',
      level: 'C1',
      max_students: 10,
      classroom: 'Room 103'
    }
  ];

  for (const groupData of groupsData) {
    // Check if group exists
    const { data: existing } = await supabase
      .from('groups')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('name', groupData.name)
      .single();

    if (existing) {
      console.log(`✅ Group exists: ${groupData.name}`);
      results.groups.push(existing);
      continue;
    }

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        organization_id: ORG_ID,
        name: groupData.name,
        subject: groupData.subject,
        level: groupData.level,
        group_code: `GRP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        max_students: groupData.max_students,
        current_enrollment: 0,
        waiting_list_count: 0,
        status: 'active',
        group_type: 'regular',
        classroom: groupData.classroom,
        price_per_student: 500000,
        currency: 'UZS',
        payment_frequency: 'monthly',
        start_date: '2024-09-01',
        end_date: '2025-06-30',
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          time: '14:00-16:00'
        },
        required_materials: ['Textbook', 'Notebook', 'Pen'],
        is_active: true
      })
      .select()
      .single();

    if (groupError) {
      console.log(`❌ Failed to create group ${groupData.name}:`, groupError.message);
      results.errors.push(groupError.message);
    } else {
      console.log(`✅ Group created: ${group.name}`);
      results.groups.push(group);
    }
  }

  // 3. Create test students with correct schema
  console.log('\nCreating test students...');
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
      first_name: 'Michael',
      last_name: 'Brown',
      email: 'michael.brown@harry-school.test',
      primary_phone: '+998901234569',
      date_of_birth: '2004-11-08',
      gender: 'male',
      grade_level: '11th',
      student_id: 'STU003'
    },
    {
      first_name: 'Emma',
      last_name: 'Wilson',
      email: 'emma.wilson@harry-school.test',
      primary_phone: '+998901234570',
      date_of_birth: '2010-05-15',
      gender: 'female',
      grade_level: '5th',
      student_id: 'STU004'
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
      results.students.push(existing);
      continue;
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        organization_id: ORG_ID,
        first_name: studentData.first_name,
        last_name: studentData.last_name,
        full_name: `${studentData.first_name} ${studentData.last_name}`,
        email: studentData.email,
        primary_phone: studentData.primary_phone,
        date_of_birth: studentData.date_of_birth,
        gender: studentData.gender,
        grade_level: studentData.grade_level,
        student_id: studentData.student_id,
        enrollment_date: '2024-09-01',
        enrollment_status: 'active',
        address: {
          street: '123 Test Street',
          city: 'Tashkent',
          country: 'Uzbekistan'
        },
        parent_guardian_info: {
          name: `Parent of ${studentData.first_name}`,
          phone: studentData.primary_phone,
          relationship: 'Parent'
        },
        emergency_contacts: [{
          name: 'Emergency Contact',
          phone: '+998901234599',
          relationship: 'Relative'
        }],
        payment_status: 'current',
        tuition_fee: 500000,
        currency: 'UZS',
        is_active: true,
        total_points: Math.floor(Math.random() * 500) + 100,
        current_level: Math.floor(Math.random() * 5) + 1,
        available_coins: Math.floor(Math.random() * 50) + 10,
        academic_score: Math.floor(Math.random() * 30) + 70,
        engagement_level: Math.floor(Math.random() * 30) + 70,
        documents: []
      })
      .select()
      .single();

    if (studentError) {
      console.log(`❌ Failed to create student ${studentData.first_name}:`, studentError.message);
      results.errors.push(studentError.message);
    } else {
      console.log(`✅ Student created: ${student.full_name} (${student.id})`);
      results.students.push(student);
      
      // Create ranking entry
      const { error: rankError } = await supabase
        .from('student_rankings')
        .insert({
          organization_id: ORG_ID,
          student_id: student.id,
          total_points: student.total_points,
          total_coins: student.available_coins,
          current_level: student.current_level,
          level_progress: Math.random() * 100,
          current_rank: Math.floor(Math.random() * 10) + 1,
          class_rank: Math.floor(Math.random() * 5) + 1,
          current_streak: Math.floor(Math.random() * 7),
          longest_streak: Math.floor(Math.random() * 30),
          last_activity_date: new Date().toISOString(),
          points_to_next_level: 100,
          total_points_earned: student.total_points,
          weekly_points: Math.floor(Math.random() * 100),
          monthly_points: Math.floor(Math.random() * 500),
          academic_year_points: student.total_points,
          is_active: true
        });

      if (rankError) {
        console.log(`   ⚠️ Failed to create ranking for ${student.full_name}:`, rankError.message);
      }
    }
  }

  // 4. Enroll students in groups
  console.log('\nEnrolling students in groups...');
  if (results.students.length > 0 && results.groups.length > 0) {
    const enrollmentPairs = [
      { studentIndex: 0, groupIndex: 0 }, // John -> Beginner
      { studentIndex: 1, groupIndex: 0 }, // Sarah -> Beginner
      { studentIndex: 2, groupIndex: 1 }, // Michael -> Intermediate
      { studentIndex: 3, groupIndex: 0 }, // Emma -> Beginner
      { studentIndex: 4, groupIndex: 1 }, // Demo -> Intermediate
    ];

    for (const pair of enrollmentPairs) {
      if (pair.studentIndex >= results.students.length || pair.groupIndex >= results.groups.length) {
        continue;
      }

      const student = results.students[pair.studentIndex];
      const group = results.groups[pair.groupIndex];

      // Check if enrollment exists
      const { data: existing } = await supabase
        .from('student_group_enrollments')
        .select('*')
        .eq('student_id', student.id)
        .eq('group_id', group.id)
        .single();

      if (existing) {
        console.log(`✅ Enrollment exists: ${student.full_name} in ${group.name}`);
        continue;
      }

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
        console.log(`❌ Failed to enroll ${student.full_name}:`, enrollError.message);
        results.errors.push(enrollError.message);
      } else {
        console.log(`✅ Enrolled ${student.full_name} in ${group.name}`);
        results.enrollments.push(enrollment);
      }
    }
  }

  // 5. Create vocabulary words
  console.log('\nCreating vocabulary words...');
  const vocabularyWords = [
    { word: 'Perspicacious', definition: 'Having keen insight or discernment', level: 'C1' },
    { word: 'Ephemeral', definition: 'Lasting for a very short time', level: 'C1' },
    { word: 'Ubiquitous', definition: 'Present everywhere at the same time', level: 'B2' },
    { word: 'Serendipity', definition: 'Finding something good without looking for it', level: 'B2' },
    { word: 'Resilient', definition: 'Able to recover quickly from difficulties', level: 'B1' }
  ];

  for (const wordData of vocabularyWords) {
    const { data: word, error: wordError } = await supabase
      .from('vocabulary_words')
      .insert({
        organization_id: ORG_ID,
        word: wordData.word,
        definition: wordData.definition,
        part_of_speech: 'adjective',
        difficulty_level: wordData.level,
        phonetic_transcription: `/${wordData.word.toLowerCase()}/`,
        example_sentences: [
          `This is an example sentence using ${wordData.word}.`,
          `Another example with the word ${wordData.word}.`
        ],
        synonyms: ['similar1', 'similar2'],
        antonyms: ['opposite1', 'opposite2'],
        tags: ['vocabulary', 'english', wordData.level],
        is_active: true
      })
      .select()
      .single();

    if (wordError) {
      console.log(`❌ Failed to create word ${wordData.word}:`, wordError.message);
      results.errors.push(wordError.message);
    } else {
      console.log(`✅ Created vocabulary word: ${word.word}`);
      results.vocabulary.push(word);
    }
  }

  // 6. Create sample lessons
  console.log('\nCreating sample lessons...');
  const lessonsData = [
    {
      title: 'Introduction to Present Perfect',
      subject: 'English Grammar',
      level: 'B1',
      age_group: '13-17'
    },
    {
      title: 'Vocabulary Building: Technology',
      subject: 'English Vocabulary',
      level: 'B2',
      age_group: '14-18'
    },
    {
      title: 'Speaking Practice: Daily Routines',
      subject: 'English Speaking',
      level: 'A1',
      age_group: '10-14'
    }
  ];

  for (const lessonData of lessonsData) {
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        title: lessonData.title,
        description: `Learn about ${lessonData.title}`,
        level: lessonData.level,
        subject: lessonData.subject,
        age_group: lessonData.age_group,
        estimated_duration: 60,
        total_tasks: 5,
        difficulty_score: Math.floor(Math.random() * 5) + 1,
        learning_objectives: [
          'Understand the concept',
          'Apply in practice',
          'Master the skill'
        ],
        prerequisites: [],
        cultural_context: {
          region: 'Central Asia',
          language: 'English'
        },
        is_published: true
      })
      .select()
      .single();

    if (lessonError) {
      console.log(`❌ Failed to create lesson ${lessonData.title}:`, lessonError.message);
      results.errors.push(lessonError.message);
    } else {
      console.log(`✅ Created lesson: ${lesson.title}`);
      results.lessons.push(lesson);
    }
  }

  // Summary
  console.log('\n📊 Test Data Creation Summary:');
  console.log('================================');
  console.log(`✅ Teachers: ${results.teachers.length}`);
  console.log(`✅ Groups: ${results.groups.length}`);
  console.log(`✅ Students: ${results.students.length}`);
  console.log(`✅ Enrollments: ${results.enrollments.length}`);
  console.log(`✅ Vocabulary: ${results.vocabulary.length}`);
  console.log(`✅ Lessons: ${results.lessons.length}`);
  if (results.errors.length > 0) {
    console.log(`❌ Errors: ${results.errors.length}`);
  }

  console.log('\n🎓 Test Student Credentials:');
  console.log('============================');
  results.students.forEach(student => {
    console.log(`Name: ${student.full_name}`);
    console.log(`Email: ${student.email}`);
    console.log(`Student ID: ${student.student_id}`);
    console.log(`Points: ${student.total_points}`);
    console.log('---');
  });

  return results;
}

createTestData()
  .then(results => {
    console.log('\n✅ Test data creation complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });