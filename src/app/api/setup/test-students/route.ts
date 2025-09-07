/**
 * API endpoint to create test student accounts
 * POST /api/setup/test-students
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Test organization data
const TEST_ORG_ID = 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'
const TEST_ORG_NAME = 'Harry School Tashkent'

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
]

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results = {
      organization: null as any,
      students: [] as any[],
      groups: [] as any[],
      enrollments: [] as any[],
      errors: [] as string[]
    }

    // 1. Setup test organization
    console.log('Setting up test organization...')
    
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', TEST_ORG_ID)
      .single()

    if (existingOrg) {
      results.organization = existingOrg
    } else {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          id: TEST_ORG_ID,
          name: TEST_ORG_NAME,
          slug: 'harry-school',
          address: 'Tashkent, Uzbekistan',
          settings: {
            language: 'en',
            timezone: 'Asia/Tashkent',
            currency: 'UZS',
            academic_year_start: '2024-09-01'
          },
          subscription_plan: 'premium',
          subscription_status: 'active',
          max_students: 1000,
          max_teachers: 100,
          max_groups: 100
        })
        .select()
        .single()

      if (orgError) {
        results.errors.push(`Failed to create organization: ${orgError.message}`)
        return NextResponse.json(results, { status: 500 })
      }

      results.organization = org
    }

    // 2. Create test teacher (if needed)
    let testTeacher
    const { data: existingTeacher } = await supabase
      .from('teachers')
      .select('id, first_name, last_name')
      .eq('organization_id', TEST_ORG_ID)
      .limit(1)
      .single()

    if (existingTeacher) {
      testTeacher = existingTeacher
    } else {
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
        .single()

      if (teacherError) {
        results.errors.push(`Failed to create test teacher: ${teacherError.message}`)
      } else {
        testTeacher = teacher
      }
    }

    // 3. Create test groups
    if (testTeacher) {
      const testGroupsData = [
        {
          name: 'Beginner English A1',
          description: 'Beginner level English course',
          level: 'A1',
          capacity: 20
        },
        {
          name: 'Intermediate English B1',
          description: 'Intermediate level English course',
          level: 'B1', 
          capacity: 15
        },
        {
          name: 'Advanced English C1',
          description: 'Advanced level English course',
          level: 'C1',
          capacity: 10
        }
      ]

      for (const groupData of testGroupsData) {
        const { data: existingGroup } = await supabase
          .from('groups')
          .select('id, name')
          .eq('organization_id', TEST_ORG_ID)
          .eq('name', groupData.name)
          .single()

        if (!existingGroup) {
          const { data: group, error: groupError } = await supabase
            .from('groups')
            .insert({
              organization_id: TEST_ORG_ID,
              name: groupData.name,
              description: groupData.description,
              teacher_id: testTeacher.id,
              capacity: groupData.capacity,
              current_size: 0,
              level: groupData.level,
              is_active: true
            })
            .select()
            .single()

          if (groupError) {
            results.errors.push(`Failed to create group ${groupData.name}: ${groupError.message}`)
          } else {
            results.groups.push(group)
          }
        } else {
          results.groups.push(existingGroup)
        }
      }
    }

    // 4. Create test students
    for (const studentData of TEST_STUDENTS) {
      try {
        // Check if student already exists
        const { data: existingProfile } = await supabase
          .from('student_profiles')
          .select('username, student_id')
          .eq('username', studentData.username)
          .single()

        if (existingProfile) {
          results.students.push({
            username: studentData.username,
            student_id: existingProfile.student_id,
            status: 'already_exists'
          })
          continue
        }

        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: studentData.email,
          password: studentData.password,
          email_confirm: true,
          user_metadata: {
            role: 'student',
            full_name: `${studentData.first_name} ${studentData.last_name}`
          }
        })

        if (authError) {
          results.errors.push(`Failed to create auth user for ${studentData.username}: ${authError.message}`)
          continue
        }

        // Create student record
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
          .single()

        if (studentError) {
          results.errors.push(`Failed to create student record for ${studentData.username}: ${studentError.message}`)
          // Clean up auth user
          await supabase.auth.admin.deleteUser(authUser.user.id)
          continue
        }

        // Create student profile
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
          })

        if (profileError) {
          results.errors.push(`Failed to create student profile for ${studentData.username}: ${profileError.message}`)
          // Clean up
          await supabase.from('students').delete().eq('id', student.id)
          await supabase.auth.admin.deleteUser(authUser.user.id)
          continue
        }

        // Initialize student ranking
        await supabase
          .from('student_rankings')
          .insert({
            organization_id: TEST_ORG_ID,
            student_id: student.id,
            total_points: Math.floor(Math.random() * 500) + 100,
            available_coins: Math.floor(Math.random() * 50) + 10,
            spent_coins: 0
          })

        results.students.push({
          username: studentData.username,
          email: studentData.email,
          password: studentData.password,
          student_id: student.id,
          auth_id: authUser.user.id,
          status: 'created'
        })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Unexpected error creating student ${studentData.username}: ${errorMessage}`)
      }
    }

    // 5. Enroll students in groups
    if (results.students.length > 0 && results.groups.length > 0) {
      const enrollmentPairs = [
        { studentIndex: 0, groupIndex: 0 }, // student1 -> Beginner
        { studentIndex: 1, groupIndex: 0 }, // student2 -> Beginner
        { studentIndex: 2, groupIndex: 1 }, // student3 -> Intermediate
        { studentIndex: 3, groupIndex: 0 }, // minor_student -> Beginner
        { studentIndex: 4, groupIndex: 1 }, // demo_student -> Intermediate
      ]

      for (const pair of enrollmentPairs) {
        const student = results.students[pair.studentIndex]
        const group = results.groups[pair.groupIndex]

        if (student && group && student.student_id) {
          const { data: enrollment, error: enrollError } = await supabase
            .from('student_group_enrollments')
            .insert({
              organization_id: TEST_ORG_ID,
              student_id: student.student_id,
              group_id: group.id,
              status: 'enrolled',
              enrollment_date: new Date().toISOString().split('T')[0],
              academic_year: '2024-2025'
            })
            .select()
            .single()

          if (enrollError) {
            results.errors.push(`Failed to enroll ${student.username} in ${group.name}: ${enrollError.message}`)
          } else {
            results.enrollments.push({
              student: student.username,
              group: group.name,
              status: 'enrolled'
            })
          }
        }
      }
    }

    // 6. Generate credentials summary
    const credentials = {
      organization_id: TEST_ORG_ID,
      organization_name: TEST_ORG_NAME,
      supabase_url: supabaseUrl,
      supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      test_accounts: results.students
        .filter(s => s.status === 'created' || s.status === 'already_exists')
        .map(s => ({
          username: s.username,
          password: s.password || 'Harry2025!', // Default for existing accounts
          email: s.email,
          student_id: s.student_id
        })),
      groups: results.groups.map(g => ({
        id: g.id,
        name: g.name,
        level: g.level || 'General'
      })),
      summary: {
        students_created: results.students.filter(s => s.status === 'created').length,
        students_existing: results.students.filter(s => s.status === 'already_exists').length,
        groups_available: results.groups.length,
        enrollments_created: results.enrollments.length,
        errors_count: results.errors.length
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test students setup completed',
      data: results,
      credentials
    }, { status: 200 })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Setup error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to setup test students',
      error: errorMessage
    }, { status: 500 })
  }
}

// GET method to check setup status
export async function GET() {
  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

    // Check organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', TEST_ORG_ID)
      .single()

    // Check students
    const { data: students, count: studentCount } = await supabase
      .from('student_profiles')
      .select('username, is_active', { count: 'exact' })
      .eq('organization_id', TEST_ORG_ID)

    // Check groups
    const { data: groups, count: groupCount } = await supabase
      .from('groups')
      .select('name, is_active', { count: 'exact' })
      .eq('organization_id', TEST_ORG_ID)

    return NextResponse.json({
      success: true,
      status: {
        organization: org ? 'exists' : 'missing',
        students_count: studentCount || 0,
        groups_count: groupCount || 0,
        students: students || [],
        groups: groups || []
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
}