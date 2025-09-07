/**
 * Simple Test Student Creation Script
 * Works with actual Supabase schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c';

async function createTestData() {
  console.log('🚀 Creating test data...\n');

  // 1. Create test teacher (minimal fields)
  console.log('Creating test teacher...');
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .insert({
      organization_id: ORG_ID,
      first_name: 'Test',
      last_name: 'Teacher',
      email: 'teacher@harry-school.test',
      specializations: ['English', 'Grammar'],
      phone: '+998901234999', // Try 'phone' instead of 'phone_number'
      is_active: true
    })
    .select()
    .single();

  if (teacherError) {
    console.log('Teacher error, trying without phone:', teacherError.message);
    // Try without phone field
    const { data: teacher2, error: teacher2Error } = await supabase
      .from('teachers')
      .insert({
        organization_id: ORG_ID,
        first_name: 'Test',
        last_name: 'Teacher',
        email: 'teacher@harry-school.test',
        specializations: ['English', 'Grammar'],
        is_active: true
      })
      .select()
      .single();
      
    if (teacher2Error) {
      console.log('❌ Failed to create teacher:', teacher2Error.message);
      return;
    }
    console.log('✅ Teacher created:', teacher2.id);
  } else {
    console.log('✅ Teacher created:', teacher.id);
  }

  // 2. Create test groups
  console.log('\nCreating test groups...');
  const groupsData = [
    { name: 'Beginner English A1', level: 'A1', capacity: 20 },
    { name: 'Intermediate English B1', level: 'B1', capacity: 15 },
    { name: 'Advanced English C1', level: 'C1', capacity: 10 }
  ];

  for (const groupData of groupsData) {
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        organization_id: ORG_ID,
        name: groupData.name,
        teacher_id: teacher?.id || teacher2?.id,
        capacity: groupData.capacity,
        current_size: 0,
        level: groupData.level,
        is_active: true
      })
      .select()
      .single();

    if (groupError) {
      console.log(`❌ Failed to create group ${groupData.name}:`, groupError.message);
    } else {
      console.log(`✅ Group created: ${group.name}`);
    }
  }

  // 3. Create test students with Supabase Auth
  console.log('\nCreating test students...');
  const testStudents = [
    {
      email: 'john.smith@harry-school.test',
      password: 'Harry2025!',
      first_name: 'John',
      last_name: 'Smith',
      username: 'student1'
    },
    {
      email: 'sarah.johnson@harry-school.test',
      password: 'Harry2025!',
      first_name: 'Sarah',
      last_name: 'Johnson',
      username: 'student2'
    },
    {
      email: 'demo@harry-school.test',
      password: 'Demo2025!',
      first_name: 'Demo',
      last_name: 'User',
      username: 'demo_student'
    }
  ];

  for (const studentData of testStudents) {
    // Create auth user
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
      console.log(`❌ Failed to create auth for ${studentData.username}:`, authError.message);
      continue;
    }

    // Create student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        organization_id: ORG_ID,
        first_name: studentData.first_name,
        last_name: studentData.last_name,
        email: studentData.email,
        phone: '+998901234567', // Try 'phone' field
        date_of_birth: '2005-01-01',
        enrollment_status: 'active',
        enrollment_date: '2024-09-01'
      })
      .select()
      .single();

    if (studentError) {
      console.log(`❌ Failed to create student ${studentData.username}:`, studentError.message);
      // Clean up auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
    } else {
      console.log(`✅ Student created: ${studentData.username} (${student.id})`);
      
      // Create student profile (auth bridge)
      const { error: profileError } = await supabase
        .from('student_profiles')
        .insert({
          id: authUser.user.id,
          student_id: student.id,
          organization_id: ORG_ID,
          username: studentData.username,
          password_visible: studentData.password,
          is_minor: false,
          is_active: true
        });

      if (profileError) {
        console.log(`⚠️ Warning: Failed to create profile for ${studentData.username}:`, profileError.message);
      }
    }
  }

  console.log('\n✅ Test data creation complete!');
  console.log('\nTest Credentials:');
  console.log('================');
  testStudents.forEach(s => {
    console.log(`Username: ${s.username}`);
    console.log(`Password: ${s.password}`);
    console.log('---');
  });
}

createTestData().catch(console.error);