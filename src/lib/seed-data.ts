import { createAdminClient } from '@/lib/supabase-server'

export async function seedDatabase() {
  const supabase = createAdminClient()
  
  try {
    // Get or create organization
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
      .single()
    
    if (!org) {
      console.error('No organization found. Please create an organization first.')
      return
    }
    
    const organizationId = org.id
    
    // Create sample teachers
    const teachers = [
      {
        organization_id: organizationId,
        first_name: 'John',
        last_name: 'Smith',
        full_name: 'John Smith',
        email: 'john.smith@harryschool.com',
        phone: '+998901234567',
        gender: 'male',
        date_of_birth: '1985-05-15',
        employee_id: 'EMP001',
        specializations: ['Mathematics', 'Physics'],
        qualifications: ['Masters in Mathematics', 'Teaching Certificate'],
        employment_status: 'active',
        contract_type: 'full_time',
        hire_date: '2020-01-15',
        is_active: true,
      },
      {
        organization_id: organizationId,
        first_name: 'Sarah',
        last_name: 'Johnson',
        full_name: 'Sarah Johnson',
        email: 'sarah.johnson@harryschool.com',
        phone: '+998901234568',
        gender: 'female',
        date_of_birth: '1990-08-22',
        employee_id: 'EMP002',
        specializations: ['English', 'Literature'],
        qualifications: ['BA in English', 'TESOL Certificate'],
        employment_status: 'active',
        contract_type: 'full_time',
        hire_date: '2021-03-10',
        is_active: true,
      },
      {
        organization_id: organizationId,
        first_name: 'Michael',
        last_name: 'Brown',
        full_name: 'Michael Brown',
        email: 'michael.brown@harryschool.com',
        phone: '+998901234569',
        gender: 'male',
        date_of_birth: '1988-12-03',
        employee_id: 'EMP003',
        specializations: ['Chemistry', 'Biology'],
        qualifications: ['PhD in Chemistry'],
        employment_status: 'active',
        contract_type: 'part_time',
        hire_date: '2022-06-01',
        is_active: true,
      },
    ]
    
    console.log('Seeding teachers...')
    const { data: insertedTeachers, error: teacherError } = await supabase
      .from('teachers')
      .insert(teachers)
      .select()
    
    if (teacherError) {
      console.error('Error seeding teachers:', teacherError)
    } else {
      console.log(`Inserted ${insertedTeachers?.length} teachers`)
    }
    
    // Create sample groups
    const groups = [
      {
        organization_id: organizationId,
        name: 'Mathematics Advanced',
        subject: 'Mathematics',
        level: 'Advanced',
        group_code: 'MATH-ADV-2024',
        group_type: 'regular',
        status: 'active',
        start_date: '2024-01-15',
        end_date: '2024-06-15',
        max_students: 15,
        current_enrollment: 0,
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          time: '14:00-16:00',
        },
        classroom: 'Room 101',
        price_per_student: 500000,
        currency: 'UZS',
        payment_frequency: 'monthly',
        is_active: true,
      },
      {
        organization_id: organizationId,
        name: 'English Beginners',
        subject: 'English',
        level: 'Beginner',
        group_code: 'ENG-BEG-2024',
        group_type: 'regular',
        status: 'active',
        start_date: '2024-02-01',
        end_date: '2024-07-01',
        max_students: 12,
        current_enrollment: 0,
        schedule: {
          days: ['Tuesday', 'Thursday'],
          time: '10:00-12:00',
        },
        classroom: 'Room 201',
        price_per_student: 450000,
        currency: 'UZS',
        payment_frequency: 'monthly',
        is_active: true,
      },
      {
        organization_id: organizationId,
        name: 'Chemistry Intensive',
        subject: 'Chemistry',
        level: 'Intermediate',
        group_code: 'CHEM-INT-2024',
        group_type: 'intensive',
        status: 'active',
        start_date: '2024-01-20',
        end_date: '2024-04-20',
        max_students: 10,
        current_enrollment: 0,
        schedule: {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          time: '16:00-18:00',
        },
        classroom: 'Lab 1',
        price_per_student: 800000,
        currency: 'UZS',
        payment_frequency: 'monthly',
        is_active: true,
      },
    ]
    
    console.log('Seeding groups...')
    const { data: insertedGroups, error: groupError } = await supabase
      .from('groups')
      .insert(groups)
      .select()
    
    if (groupError) {
      console.error('Error seeding groups:', groupError)
    } else {
      console.log(`Inserted ${insertedGroups?.length} groups`)
    }
    
    // Create sample students
    const students = [
      {
        organization_id: organizationId,
        student_id: 'STU2024001',
        first_name: 'Alice',
        last_name: 'Williams',
        full_name: 'Alice Williams',
        email: 'alice.williams@example.com',
        phone: '+998901234570',
        gender: 'female',
        date_of_birth: '2008-03-15',
        grade: '10th',
        address: '123 Main St, Tashkent',
        parent_name: 'Robert Williams',
        parent_phone: '+998901234571',
        parent_email: 'robert.williams@example.com',
        emergency_contact: '+998901234571',
        student_status: 'active',
        payment_status: 'current',
        enrollment_date: '2024-01-10',
        is_active: true,
        total_debt: 0,
      },
      {
        organization_id: organizationId,
        student_id: 'STU2024002',
        first_name: 'Bob',
        last_name: 'Davis',
        full_name: 'Bob Davis',
        email: 'bob.davis@example.com',
        phone: '+998901234572',
        gender: 'male',
        date_of_birth: '2009-07-22',
        grade: '9th',
        address: '456 Oak Ave, Tashkent',
        parent_name: 'Jennifer Davis',
        parent_phone: '+998901234573',
        parent_email: 'jennifer.davis@example.com',
        emergency_contact: '+998901234573',
        student_status: 'active',
        payment_status: 'current',
        enrollment_date: '2024-01-15',
        is_active: true,
        total_debt: 0,
      },
      {
        organization_id: organizationId,
        student_id: 'STU2024003',
        first_name: 'Carol',
        last_name: 'Martinez',
        full_name: 'Carol Martinez',
        email: 'carol.martinez@example.com',
        phone: '+998901234574',
        gender: 'female',
        date_of_birth: '2008-11-05',
        grade: '10th',
        address: '789 Pine Rd, Tashkent',
        parent_name: 'Maria Martinez',
        parent_phone: '+998901234575',
        parent_email: 'maria.martinez@example.com',
        emergency_contact: '+998901234575',
        student_status: 'active',
        payment_status: 'overdue',
        enrollment_date: '2024-02-01',
        is_active: true,
        total_debt: 500000,
      },
      {
        organization_id: organizationId,
        student_id: 'STU2024004',
        first_name: 'David',
        last_name: 'Taylor',
        full_name: 'David Taylor',
        email: 'david.taylor@example.com',
        phone: '+998901234576',
        gender: 'male',
        date_of_birth: '2007-05-18',
        grade: '11th',
        address: '321 Elm St, Tashkent',
        parent_name: 'James Taylor',
        parent_phone: '+998901234577',
        parent_email: 'james.taylor@example.com',
        emergency_contact: '+998901234577',
        student_status: 'active',
        payment_status: 'current',
        enrollment_date: '2024-01-05',
        is_active: true,
        total_debt: 0,
      },
      {
        organization_id: organizationId,
        student_id: 'STU2024005',
        first_name: 'Emma',
        last_name: 'Anderson',
        full_name: 'Emma Anderson',
        email: 'emma.anderson@example.com',
        phone: '+998901234578',
        gender: 'female',
        date_of_birth: '2009-09-30',
        grade: '9th',
        address: '654 Maple Dr, Tashkent',
        parent_name: 'Linda Anderson',
        parent_phone: '+998901234579',
        parent_email: 'linda.anderson@example.com',
        emergency_contact: '+998901234579',
        student_status: 'on_hold',
        payment_status: 'suspended',
        enrollment_date: '2024-01-20',
        is_active: false,
        total_debt: 1000000,
      },
    ]
    
    console.log('Seeding students...')
    const { data: insertedStudents, error: studentError } = await supabase
      .from('students')
      .insert(students)
      .select()
    
    if (studentError) {
      console.error('Error seeding students:', studentError)
    } else {
      console.log(`Inserted ${insertedStudents?.length} students`)
    }
    
    // Create teacher-group assignments if we have data
    if (insertedTeachers && insertedGroups && insertedTeachers.length >= 3 && insertedGroups.length >= 4) {
      const assignments = [
        {
          organization_id: organizationId,
          teacher_id: insertedTeachers[0]!.id, // John Smith -> Math
          group_id: insertedGroups[0]!.id, // Mathematics Advanced
          role: 'primary',
          status: 'active',
          assigned_date: '2024-01-15',
        },
        {
          organization_id: organizationId,
          teacher_id: insertedTeachers[1]!.id, // Sarah Johnson -> English
          group_id: insertedGroups[1]!.id, // English Beginners
          role: 'primary',
          status: 'active',
          assigned_date: '2024-02-01',
        },
        {
          organization_id: organizationId,
          teacher_id: insertedTeachers[2]!.id, // Michael Brown -> Chemistry
          group_id: insertedGroups[2]!.id, // Chemistry Intensive
          role: 'primary',
          status: 'active',
          assigned_date: '2024-01-20',
        },
      ]
      
      console.log('Creating teacher-group assignments...')
      const { error: assignmentError } = await supabase
        .from('teacher_group_assignments')
        .insert(assignments)
      
      if (assignmentError) {
        console.error('Error creating assignments:', assignmentError)
      } else {
        console.log('Teacher-group assignments created')
      }
    }
    
    // Create student enrollments if we have data
    if (insertedStudents && insertedGroups) {
      const enrollments = [
        {
          organization_id: organizationId,
          student_id: insertedStudents[0]!.id, // Alice -> Math
          group_id: insertedGroups[0]!.id,
          enrollment_date: '2024-01-15',
          status: 'active',
        },
        {
          organization_id: organizationId,
          student_id: insertedStudents[1]!.id, // Bob -> English
          group_id: insertedGroups[1]!.id,
          enrollment_date: '2024-02-01',
          status: 'active',
        },
        {
          organization_id: organizationId,
          student_id: insertedStudents[2]!.id, // Carol -> Chemistry
          group_id: insertedGroups[2]!.id,
          enrollment_date: '2024-01-20',
          status: 'active',
        },
        {
          organization_id: organizationId,
          student_id: insertedStudents[3]!.id, // David -> Math
          group_id: insertedGroups[0]!.id,
          enrollment_date: '2024-01-15',
          status: 'active',
        },
        {
          organization_id: organizationId,
          student_id: insertedStudents[3]!.id, // David -> Chemistry
          group_id: insertedGroups[2]!.id,
          enrollment_date: '2024-01-20',
          status: 'active',
        },
      ]
      
      console.log('Creating student enrollments...')
      const { error: enrollmentError } = await supabase
        .from('student_group_enrollments')
        .insert(enrollments)
      
      if (enrollmentError) {
        console.error('Error creating enrollments:', enrollmentError)
      } else {
        console.log('Student enrollments created')
        
        // Update group enrollment counts
        await supabase
          .from('groups')
          .update({ current_enrollment: 2 })
          .eq('id', insertedGroups[0]!.id)
        
        await supabase
          .from('groups')
          .update({ current_enrollment: 1 })
          .eq('id', insertedGroups[1]!.id)
        
        await supabase
          .from('groups')
          .update({ current_enrollment: 2 })
          .eq('id', insertedGroups[2]!.id)
      }
    }
    
    console.log('Database seeding completed!')
    
  } catch (error) {
    console.error('Error seeding database:', error)
  }
}