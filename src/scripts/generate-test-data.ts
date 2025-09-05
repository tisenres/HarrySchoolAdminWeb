/**
 * Script to generate bulk test data for performance testing
 * Run with: npx tsx src/scripts/generate-test-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuration
const CONFIG = {
  STUDENTS_TO_CREATE: 500,
  TEACHERS_TO_CREATE: 50,
  GROUPS_TO_CREATE: 25,
  BATCH_SIZE: 50, // Insert in batches for better performance
  ORGANIZATION_ID: 'default-org' // Update this with your org ID
}

// Helper functions
function generatePhoneNumber(): string {
  const prefix = '+99890'
  const number = Math.floor(Math.random() * 9000000) + 1000000
  return `${prefix}${number}`
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@test.harryschool.uz`
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString()
}

// Data arrays
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']
const subjects = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'IELTS Preparation', 'TOEFL Preparation', 'Business English', 'Academic Writing']
const levels = ['Beginner (A1)', 'Elementary (A2)', 'Intermediate (B1)', 'Upper-Intermediate (B2)', 'Advanced (C1)', 'Proficiency (C2)']
const regions = ['Toshkent shahar', 'Samarqand viloyati', 'Buxoro viloyati', 'Andijon viloyati', 'Farg\'ona viloyati', 'Namangan viloyati']
const specializations = ['General English', 'Business English', 'IELTS', 'TOEFL', 'Academic Writing', 'Conversation', 'Grammar', 'Young Learners', 'ESP', 'Cambridge Exams']
const employmentStatuses = ['full_time', 'part_time', 'contract']
const groupTypes = ['regular', 'intensive', 'exam_prep', 'summer_camp', 'weekend']

async function generateStudents() {
  console.log(`\n📚 Creating ${CONFIG.STUDENTS_TO_CREATE} students...`)
  
  const students = []
  for (let i = 1; i <= CONFIG.STUDENTS_TO_CREATE; i++) {
    const firstName = getRandomElement(firstNames)
    const lastName = getRandomElement(lastNames)
    const birthDate = getRandomDate(new Date(2005, 0, 1), new Date(2015, 11, 31))
    
    students.push({
      organization_id: CONFIG.ORGANIZATION_ID,
      first_name: `${firstName}${i}`,
      last_name: lastName,
      full_name: `${firstName}${i} ${lastName}`,
      email: generateEmail(firstName, lastName, i),
      primary_phone: generatePhoneNumber(),
      birth_date: birthDate,
      gender: getRandomElement(['male', 'female']),
      address: `Test Street ${i}, ${getRandomElement(regions)}`,
      region: getRandomElement(regions),
      district: 'Test District',
      enrollment_date: getRandomDate(new Date(2023, 0, 1), new Date()),
      enrollment_status: getRandomElement(['active', 'inactive', 'graduated', 'on_hold']),
      current_level: getRandomElement(levels),
      preferred_subjects: [getRandomElement(subjects), getRandomElement(subjects)],
      emergency_contact_name: `Parent of ${firstName}${i}`,
      emergency_contact_phone: generatePhoneNumber(),
      emergency_contact_relationship: getRandomElement(['Father', 'Mother', 'Guardian']),
      medical_conditions: i % 10 === 0 ? 'Allergies' : null,
      is_active: Math.random() > 0.1,
      payment_status: getRandomElement(['paid', 'pending', 'overdue']),
      balance: Math.floor(Math.random() * 1000000),
      total_hours_studied: Math.floor(Math.random() * 200),
      attendance_rate: Math.floor(Math.random() * 30) + 70,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Insert in batches
    if (students.length >= CONFIG.BATCH_SIZE || i === CONFIG.STUDENTS_TO_CREATE) {
      const { error } = await supabase.from('students').insert(students)
      if (error) {
        console.error(`❌ Error inserting students batch: ${error.message}`)
      } else {
        console.log(`✅ Inserted batch of ${students.length} students (${i}/${CONFIG.STUDENTS_TO_CREATE})`)
      }
      students.length = 0 // Clear array
    }
  }
}

async function generateTeachers() {
  console.log(`\n👨‍🏫 Creating ${CONFIG.TEACHERS_TO_CREATE} teachers...`)
  
  const teachers = []
  for (let i = 1; i <= CONFIG.TEACHERS_TO_CREATE; i++) {
    const firstName = getRandomElement(firstNames)
    const lastName = getRandomElement(lastNames)
    
    teachers.push({
      organization_id: CONFIG.ORGANIZATION_ID,
      first_name: `Teacher${firstName}${i}`,
      last_name: lastName,
      full_name: `Teacher${firstName}${i} ${lastName}`,
      email: `teacher${i}@harryschool.uz`,
      phone: generatePhoneNumber(),
      birth_date: getRandomDate(new Date(1970, 0, 1), new Date(1995, 11, 31)),
      gender: getRandomElement(['male', 'female']),
      address: `Teacher Street ${i}, ${getRandomElement(regions)}`,
      hire_date: getRandomDate(new Date(2020, 0, 1), new Date()),
      employment_status: getRandomElement(employmentStatuses),
      specializations: [getRandomElement(specializations), getRandomElement(specializations)],
      qualifications: ['Bachelor of Education', 'TESOL Certificate'],
      experience_years: Math.floor(Math.random() * 15) + 1,
      salary: Math.floor(Math.random() * 10000000) + 3000000,
      is_active: Math.random() > 0.05,
      rating: Math.floor(Math.random() * 20) / 4 + 3, // 3.0 to 5.0
      total_hours_taught: Math.floor(Math.random() * 1000),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Insert in batches
    if (teachers.length >= CONFIG.BATCH_SIZE || i === CONFIG.TEACHERS_TO_CREATE) {
      const { error } = await supabase.from('teachers').insert(teachers)
      if (error) {
        console.error(`❌ Error inserting teachers batch: ${error.message}`)
      } else {
        console.log(`✅ Inserted batch of ${teachers.length} teachers (${i}/${CONFIG.TEACHERS_TO_CREATE})`)
      }
      teachers.length = 0
    }
  }
}

async function generateGroups() {
  console.log(`\n📝 Creating ${CONFIG.GROUPS_TO_CREATE} groups...`)
  
  const groups = []
  for (let i = 1; i <= CONFIG.GROUPS_TO_CREATE; i++) {
    const subject = getRandomElement(subjects)
    const level = getRandomElement(levels)
    const groupCode = `${subject.substring(0, 3).toUpperCase()}-${level.substring(0, 2).toUpperCase()}-${i.toString().padStart(3, '0')}`
    
    groups.push({
      organization_id: CONFIG.ORGANIZATION_ID,
      name: `${subject} ${level} Group ${i}`,
      group_code: groupCode,
      subject: subject,
      level: level,
      group_type: getRandomElement(groupTypes),
      max_students: getRandomElement([12, 15, 18, 20]),
      min_students: getRandomElement([5, 6, 8]),
      current_enrollment: 0,
      waiting_list_count: 0,
      schedule: {
        days: ['Monday', 'Wednesday', 'Friday'],
        time: '15:00-16:30',
        room: `Room ${Math.floor(Math.random() * 20) + 1}`
      },
      start_date: getRandomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)),
      end_date: null,
      status: getRandomElement(['active', 'upcoming', 'completed']),
      is_active: Math.random() > 0.1,
      price_per_month: Math.floor(Math.random() * 500000) + 500000,
      price_per_lesson: Math.floor(Math.random() * 50000) + 50000,
      total_lessons: getRandomElement([24, 36, 48, 60]),
      completed_lessons: Math.floor(Math.random() * 20),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Insert in batches
    if (groups.length >= CONFIG.BATCH_SIZE || i === CONFIG.GROUPS_TO_CREATE) {
      const { error } = await supabase.from('groups').insert(groups)
      if (error) {
        console.error(`❌ Error inserting groups batch: ${error.message}`)
      } else {
        console.log(`✅ Inserted batch of ${groups.length} groups (${i}/${CONFIG.GROUPS_TO_CREATE})`)
      }
      groups.length = 0
    }
  }
}

async function assignTeachersToGroups() {
  console.log(`\n👥 Assigning teachers to groups...`)
  
  // Get all teachers and groups
  const { data: teachers } = await supabase
    .from('teachers')
    .select('id')
    .eq('organization_id', CONFIG.ORGANIZATION_ID)
    .eq('is_active', true)
    .limit(CONFIG.TEACHERS_TO_CREATE)
  
  const { data: groups } = await supabase
    .from('groups')
    .select('id')
    .eq('organization_id', CONFIG.ORGANIZATION_ID)
    .eq('is_active', true)
    .limit(CONFIG.GROUPS_TO_CREATE)
  
  if (!teachers || !groups) {
    console.error('❌ Could not fetch teachers or groups')
    return
  }
  
  const assignments = []
  for (const group of groups) {
    const teacher = getRandomElement(teachers)
    assignments.push({
      organization_id: CONFIG.ORGANIZATION_ID,
      teacher_id: teacher.id,
      group_id: group.id,
      role: 'primary',
      assigned_date: new Date().toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  const { error } = await supabase.from('teacher_group_assignments').insert(assignments)
  if (error) {
    console.error(`❌ Error assigning teachers: ${error.message}`)
  } else {
    console.log(`✅ Assigned ${assignments.length} teachers to groups`)
  }
}

async function enrollStudentsInGroups() {
  console.log(`\n🎓 Enrolling students in groups...`)
  
  // Get all students and groups
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('organization_id', CONFIG.ORGANIZATION_ID)
    .eq('is_active', true)
    .limit(CONFIG.STUDENTS_TO_CREATE)
  
  const { data: groups } = await supabase
    .from('groups')
    .select('id, max_students')
    .eq('organization_id', CONFIG.ORGANIZATION_ID)
    .eq('is_active', true)
    .limit(CONFIG.GROUPS_TO_CREATE)
  
  if (!students || !groups) {
    console.error('❌ Could not fetch students or groups')
    return
  }
  
  const enrollments = []
  let studentIndex = 0
  
  for (const group of groups) {
    const studentsPerGroup = Math.min(group.max_students || 15, Math.floor(students.length / groups.length))
    
    for (let i = 0; i < studentsPerGroup && studentIndex < students.length; i++) {
      enrollments.push({
        organization_id: CONFIG.ORGANIZATION_ID,
        student_id: students[studentIndex].id,
        group_id: group.id,
        enrollment_date: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      studentIndex++
    }
  }
  
  // Insert in batches
  for (let i = 0; i < enrollments.length; i += CONFIG.BATCH_SIZE) {
    const batch = enrollments.slice(i, i + CONFIG.BATCH_SIZE)
    const { error } = await supabase.from('student_group_enrollments').insert(batch)
    if (error) {
      console.error(`❌ Error enrolling students batch: ${error.message}`)
    } else {
      console.log(`✅ Enrolled batch of ${batch.length} students (${i + batch.length}/${enrollments.length})`)
    }
  }
}

async function generateTestData() {
  console.log('🚀 Starting bulk test data generation...')
  console.log(`Configuration:`)
  console.log(`  - Students: ${CONFIG.STUDENTS_TO_CREATE}`)
  console.log(`  - Teachers: ${CONFIG.TEACHERS_TO_CREATE}`)
  console.log(`  - Groups: ${CONFIG.GROUPS_TO_CREATE}`)
  console.log(`  - Batch Size: ${CONFIG.BATCH_SIZE}`)
  
  try {
    // Generate data in order
    await generateStudents()
    await generateTeachers()
    await generateGroups()
    await assignTeachersToGroups()
    await enrollStudentsInGroups()
    
    // Print summary
    console.log('\n✨ Test data generation complete!')
    console.log('Summary:')
    
    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', CONFIG.ORGANIZATION_ID)
    
    const { count: teacherCount } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', CONFIG.ORGANIZATION_ID)
    
    const { count: groupCount } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', CONFIG.ORGANIZATION_ID)
    
    console.log(`  - Total Students: ${studentCount}`)
    console.log(`  - Total Teachers: ${teacherCount}`)
    console.log(`  - Total Groups: ${groupCount}`)
    
  } catch (error) {
    console.error('❌ Error generating test data:', error)
  }
}

// Run the script
generateTestData()
  .then(() => {
    console.log('\n👋 Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })