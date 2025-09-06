#!/usr/bin/env node

// Script to create test data via API
const BASE_URL = 'http://localhost:3001/api';

// Helper function to generate random phone number
const generatePhone = () => {
  const digits = Math.floor(Math.random() * 900000000) + 100000000;
  return `+998${digits}`;
};

// Create teachers
async function createTeachers() {
  console.log('Creating 10 test teachers...');
  const teachers = [];
  
  for (let i = 1; i <= 10; i++) {
    const teacher = {
      first_name: `Teacher${i}`,
      last_name: `Test${i}`,
      phone: generatePhone(),
      email: `teacher${i}@test.com`,
      employment_status: 'active',
      specializations: ['English', 'Math', 'Science'][Math.floor(Math.random() * 3)]
    };
    
    try {
      const response = await fetch(`${BASE_URL}/teachers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teacher)
      });
      
      const result = await response.json();
      if (result.success) {
        console.log(`✓ Created teacher: ${teacher.first_name} ${teacher.last_name}`);
        teachers.push(result.data);
      } else {
        console.error(`✗ Failed to create teacher ${i}:`, result.error);
      }
    } catch (error) {
      console.error(`✗ Error creating teacher ${i}:`, error.message);
    }
  }
  
  return teachers;
}

// Create students
async function createStudents() {
  console.log('\nCreating 10 test students...');
  const students = [];
  
  for (let i = 1; i <= 10; i++) {
    const student = {
      first_name: `Student${i}`,
      last_name: `Demo${i}`,
      phone: generatePhone(),
      email: `student${i}@test.com`,
      status: 'active',
      payment_status: ['paid', 'pending', 'overdue'][Math.floor(Math.random() * 3)],
      current_level: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)]
    };
    
    try {
      const response = await fetch(`${BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(student)
      });
      
      const result = await response.json();
      if (result.success) {
        console.log(`✓ Created student: ${student.first_name} ${student.last_name}`);
        students.push(result.data);
      } else {
        console.error(`✗ Failed to create student ${i}:`, result.error);
      }
    } catch (error) {
      console.error(`✗ Error creating student ${i}:`, error.message);
    }
  }
  
  return students;
}

// Create groups
async function createGroups() {
  console.log('\nCreating 10 test groups...');
  const groups = [];
  
  const subjects = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology'];
  const levels = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Proficiency'];
  const types = ['regular', 'intensive', 'online', 'hybrid'];
  
  for (let i = 1; i <= 10; i++) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    
    const group = {
      name: `${subject} ${level} ${i}`,
      group_code: `GRP${Date.now()}${i}`,
      subject: subject,
      level: level,
      type: types[Math.floor(Math.random() * types.length)],
      max_students: Math.floor(Math.random() * 10) + 10, // 10-20 students
      price_per_student: (Math.floor(Math.random() * 5) + 3) * 100000, // 300k - 800k UZS
      start_date: new Date().toISOString().split('T')[0],
      schedule: {
        days: ['Monday/Wednesday/Friday', 'Tuesday/Thursday', 'Saturday/Sunday'][Math.floor(Math.random() * 3)],
        time: ['09:00-11:00', '14:00-16:00', '17:00-19:00'][Math.floor(Math.random() * 3)]
      },
      status: 'active'
    };
    
    try {
      const response = await fetch(`${BASE_URL}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(group)
      });
      
      const result = await response.json();
      if (result.success) {
        console.log(`✓ Created group: ${group.name}`);
        groups.push(result.data);
      } else {
        console.error(`✗ Failed to create group ${i}:`, result.error);
      }
    } catch (error) {
      console.error(`✗ Error creating group ${i}:`, error.message);
    }
  }
  
  return groups;
}

// Main function
async function main() {
  console.log('🚀 Starting test data creation...\n');
  console.log('Server: http://localhost:3001');
  console.log('================================\n');
  
  try {
    // Create all test data
    const teachers = await createTeachers();
    const students = await createStudents();
    const groups = await createGroups();
    
    // Summary
    console.log('\n================================');
    console.log('✅ Test Data Creation Complete!');
    console.log('================================');
    console.log(`Teachers created: ${teachers.length}/10`);
    console.log(`Students created: ${students.length}/10`);
    console.log(`Groups created: ${groups.length}/10`);
    console.log('\nYou can now check the data at http://localhost:3001');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the script
main();