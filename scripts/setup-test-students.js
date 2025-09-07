/**
 * Test Student Setup Script
 * Creates test student accounts for mobile app integration testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test organization ID (Harry School Tashkent)
const TEST_ORG_ID = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c';
const TEST_ORG_NAME = 'Harry School Tashkent';

const TEST_STUDENTS = [
  {
    username: 'student1',
    password: 'Harry2025!',
    email: 'john.smith@harry-school.test',
    first_name: 'John',
    last_name: 'Smith',
    date_of_birth: '2005-03-15',
    phone_number: '+998901234567',
    is_minor: false
  },
  {
    username: 'student2', 
    password: 'Harry2025!',
    email: 'sarah.johnson@harry-school.test',
    first_name: 'Sarah',
    last_name: 'Johnson',
    date_of_birth: '2006-07-22',
    phone_number: '+998901234568',
    is_minor: false
  },
  {
    username: 'student3',
    password: 'Harry2025!',
    email: 'michael.brown@harry-school.test',
    first_name: 'Michael',
    last_name: 'Brown',
    date_of_birth: '2004-11-08',
    phone_number: '+998901234569',
    is_minor: false
  },
  {
    username: 'minor_student',
    password: 'Harry2025!',
    email: 'emma.wilson@harry-school.test',
    first_name: 'Emma',
    last_name: 'Wilson',
    date_of_birth: '2010-05-15',
    phone_number: '+998901234570',
    is_minor: true,
    guardian_email: 'parent.wilson@gmail.com'
  },
  {
    username: 'demo_student',
    password: 'Demo2025!',
    email: 'demo@harry-school.test',
    first_name: 'Demo',
    last_name: 'User',
    date_of_birth: '2005-01-01',
    phone_number: '+998901234571',
    is_minor: false
  }
];

async function setupTestOrganization() {
  console.log('🏫 Setting up test organization...');
  
  // Check if organization exists
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', TEST_ORG_ID)
    .single();

  if (existingOrg) {
    console.log('✅ Test organization already exists');
    return TEST_ORG_ID;
  }

  // Create organization
  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      id: TEST_ORG_ID,
      name: TEST_ORG_NAME,
      domain: 'harry-school.uz',
      address: 'Tashkent, Uzbekistan',
      settings: {
        language: 'en',
        timezone: 'Asia/Tashkent',
        currency: 'UZS',
        academic_year_start: '2024-09-01'
      },
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create organization:', error.message);
    throw error;
  }

  console.log('✅ Test organization created:', org.name);
  return org.id;
}

async function createTestStudent(studentData) {
  console.log(`👤 Creating student: ${studentData.username}...`);

  try {
    // 1. Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: studentData.email,
      password: studentData.password,
      email_confirm: true,
      user_metadata: {
        role: 'student',
        full_name: `${studentData.first_name} ${studentData.last_name}`
      }
    });

    if (authError) {
      console.error(`❌ Failed to create auth user for ${studentData.username}:`, authError.message);
      return null;
    }

    // 2. Create student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        organization_id: TEST_ORG_ID,
        first_name: studentData.first_name,
        last_name: studentData.last_name,
        email: studentData.email,
        phone_number: studentData.phone_number,
        date_of_birth: studentData.date_of_birth,
        enrollment_status: 'active',
        enrollment_date: new Date().toISOString().split('T')[0],
        guardian_email: studentData.guardian_email || null
      })
      .select()
      .single();

    if (studentError) {
      console.error(`❌ Failed to create student record for ${studentData.username}:`, studentError.message);
      // Clean up auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return null;
    }

    // 3. Create student profile (auth bridge)
    const { error: profileError } = await supabase
      .from('student_profiles')
      .insert({
        id: authUser.user.id,
        student_id: student.id,
        organization_id: TEST_ORG_ID,
        username: studentData.username,
        password_visible: studentData.password,
        is_minor: studentData.is_minor,
        guardian_email: studentData.guardian_email || null,
        is_active: true
      });

    if (profileError) {
      console.error(`❌ Failed to create student profile for ${studentData.username}:`, profileError.message);
      // Clean up
      await supabase.from('students').delete().eq('id', student.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return null;
    }

    // 4. Initialize student ranking
    const { error: rankingError } = await supabase
      .from('student_rankings')
      .insert({
        organization_id: TEST_ORG_ID,
        student_id: student.id,
        total_points: Math.floor(Math.random() * 500) + 100, // Random starting points
        available_coins: Math.floor(Math.random() * 50) + 10,
        spent_coins: 0,
        current_rank: null // Will be calculated by trigger
      });

    if (rankingError) {
      console.warn(`⚠️ Warning: Failed to create ranking for ${studentData.username}:`, rankingError.message);
    }

    console.log(`✅ Student created successfully: ${studentData.username}`);
    return {
      auth_id: authUser.user.id,
      student_id: student.id,
      username: studentData.username,
      email: studentData.email,
      password: studentData.password
    };

  } catch (error) {
    console.error(`❌ Unexpected error creating student ${studentData.username}:`, error.message);
    return null;
  }
}

async function createTestGroups() {
  console.log('📚 Creating test groups...');

  // First, we need a test teacher
  let testTeacher;
  const { data: existingTeacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('organization_id', TEST_ORG_ID)
    .limit(1)
    .single();

  if (existingTeacher) {
    testTeacher = existingTeacher;
  } else {
    // Create a test teacher
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .insert({
        organization_id: TEST_ORG_ID,
        first_name: 'Test',
        last_name: 'Teacher',
        email: 'teacher@harry-school.test',
        phone_number: '+998901234999',
        specializations: ['English', 'Grammar'],
        employment_type: 'full_time',
        is_active: true
      })
      .select()
      .single();

    if (teacherError) {
      console.error('❌ Failed to create test teacher:', teacherError.message);
      return [];
    }
    testTeacher = teacher;
  }

  const testGroups = [
    {
      name: 'Beginner English A1',
      description: 'Beginner level English course',
      level: 'A1',
      capacity: 20,
      schedule: 'Mon, Wed, Fri - 10:00-11:30'
    },
    {
      name: 'Intermediate English B1', 
      description: 'Intermediate level English course',
      level: 'B1',
      capacity: 15,
      schedule: 'Tue, Thu - 14:00-15:30'
    },
    {
      name: 'Advanced English C1',
      description: 'Advanced level English course',
      level: 'C1',
      capacity: 10,
      schedule: 'Sat - 09:00-12:00'
    }
  ];

  const createdGroups = [];
  
  for (const groupData of testGroups) {
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        organization_id: TEST_ORG_ID,
        name: groupData.name,
        description: groupData.description,
        teacher_id: testTeacher.id,
        capacity: groupData.capacity,
        current_size: 0,
        level: groupData.level,
        schedule_description: groupData.schedule,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create group ${groupData.name}:`, error.message);
    } else {
      console.log(`✅ Group created: ${group.name}`);
      createdGroups.push(group);
    }
  }

  return createdGroups;
}

async function enrollStudentsInGroups(students, groups) {
  if (students.length === 0 || groups.length === 0) {
    console.log('⚠️ No students or groups to enroll');
    return;
  }

  console.log('📝 Enrolling students in groups...');

  // Distribute students across groups
  const enrollments = [
    { student: students[0], group: groups[0] }, // student1 -> Beginner
    { student: students[1], group: groups[0] }, // student2 -> Beginner 
    { student: students[2], group: groups[1] }, // student3 -> Intermediate
    { student: students[3], group: groups[0] }, // minor_student -> Beginner
    { student: students[4], group: groups[1] }, // demo_student -> Intermediate
  ];

  for (const enrollment of enrollments) {
    if (!enrollment.student || !enrollment.group) continue;

    const { error } = await supabase
      .from('student_group_enrollments')
      .insert({
        organization_id: TEST_ORG_ID,
        student_id: enrollment.student.student_id,
        group_id: enrollment.group.id,
        status: 'enrolled',
        enrollment_date: new Date().toISOString().split('T')[0],
        academic_year: '2024-2025'
      });

    if (error) {
      console.error(`❌ Failed to enroll ${enrollment.student.username}:`, error.message);
    } else {
      console.log(`✅ Enrolled ${enrollment.student.username} in ${enrollment.group.name}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting test student setup...\n');

  try {
    // Phase 1: Setup organization
    await setupTestOrganization();

    // Phase 2: Create test students
    const createdStudents = [];
    for (const studentData of TEST_STUDENTS) {
      const student = await createTestStudent(studentData);
      if (student) {
        createdStudents.push(student);
      }
    }

    // Phase 3: Create test groups
    const createdGroups = await createTestGroups();

    // Phase 4: Enroll students in groups
    await enrollStudentsInGroups(createdStudents, createdGroups);

    // Phase 5: Output summary
    console.log('\n🎉 Test setup complete!');
    console.log('\n📋 Test Accounts Created:');
    console.log('============================');
    
    createdStudents.forEach(student => {
      console.log(`👤 ${student.username}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   Password: ${student.password}`);
      console.log(`   Student ID: ${student.student_id}`);
      console.log('');
    });

    console.log('🏫 Organization ID:', TEST_ORG_ID);
    console.log('🌐 Supabase URL:', supabaseUrl);
    console.log('\n✅ Backend is ready for student mobile app integration!');

    // Write credentials to file
    const credentials = {
      organization_id: TEST_ORG_ID,
      organization_name: TEST_ORG_NAME,
      supabase_url: supabaseUrl,
      supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      test_accounts: createdStudents.map(s => ({
        username: s.username,
        password: s.password,
        email: s.email,
        student_id: s.student_id
      })),
      groups: createdGroups.map(g => ({
        id: g.id,
        name: g.name,
        level: g.level
      }))
    };

    require('fs').writeFileSync(
      'docs/test-credentials.json',
      JSON.stringify(credentials, null, 2)
    );

    console.log('💾 Credentials saved to docs/test-credentials.json');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}