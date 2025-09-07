/**
 * Student API Testing Script
 * Tests all student-facing API endpoints
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3002'; // Adjust port as needed
const TEST_CREDENTIALS = {
  username: 'student1',
  password: 'Harry2025!'
};

let authToken = null;
let studentData = null;

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();
  
  console.log(`\n📡 ${options.method || 'GET'} ${endpoint}`);
  console.log(`Status: ${response.status} ${response.statusText}`);
  
  if (data.success) {
    console.log('✅ Success');
    if (data.data) {
      console.log(`Data keys: ${Object.keys(data.data).join(', ')}`);
    }
  } else {
    console.log('❌ Failed');
    console.log(`Error: ${data.error}`);
  }

  return { response, data };
}

// Test functions
async function testAuthentication() {
  console.log('\n🔐 Testing Student Authentication');
  console.log('================================');

  // Test login
  const { response, data } = await apiCall('/api/auth/student', {
    method: 'POST',
    body: JSON.stringify(TEST_CREDENTIALS)
  });

  if (data.success && data.data) {
    authToken = data.data.session.access_token;
    studentData = data.data.student;
    console.log(`✅ Logged in as: ${studentData.first_name} ${studentData.last_name}`);
    console.log(`📊 Points: ${studentData.ranking.total_points}, Coins: ${studentData.ranking.available_coins}`);
    console.log(`🏫 Groups: ${studentData.group_enrollments.map(g => g.groups.name).join(', ')}`);
  } else {
    console.log('❌ Login failed, cannot continue tests');
    process.exit(1);
  }

  // Test profile fetch
  await apiCall('/api/auth/student', { method: 'GET' });
}

async function testVocabulary() {
  console.log('\n📚 Testing Vocabulary API');
  console.log('==========================');

  // Get daily vocabulary
  await apiCall('/api/student/vocabulary?type=daily&limit=5');

  // Get all vocabulary with stats
  await apiCall('/api/student/vocabulary?type=all&limit=10');

  // Test vocabulary review submission
  const reviewSession = [
    {
      word_id: 'test-word-id', // This will fail since we don't have real word IDs
      correct: true,
      time_spent_seconds: 30,
      review_type: 'definition'
    }
  ];

  await apiCall('/api/student/vocabulary/review', {
    method: 'POST',
    body: JSON.stringify(reviewSession)
  });
}

async function testLessons() {
  console.log('\n📖 Testing Lessons API');
  console.log('=======================');

  // Get all lessons
  await apiCall('/api/student/lessons');

  // Get upcoming lessons
  await apiCall('/api/student/lessons?status=upcoming');

  // Get completed lessons
  await apiCall('/api/student/lessons?status=completed');
}

async function testHomework() {
  console.log('\n📝 Testing Homework API');
  console.log('========================');

  // Get all homework
  await apiCall('/api/student/homework');

  // Get pending homework
  await apiCall('/api/student/homework?status=pending');

  // Get graded homework
  await apiCall('/api/student/homework?status=graded');
}

async function testLeaderboard() {
  console.log('\n🏆 Testing Leaderboard API');
  console.log('===========================');

  // Get organization leaderboard
  await apiCall('/api/student/leaderboard');

  // Get group leaderboard
  if (studentData?.group_enrollments?.[0]?.groups?.id) {
    const groupId = studentData.group_enrollments[0].groups.id;
    await apiCall(`/api/student/leaderboard?scope=group&group_id=${groupId}`);
  }

  // Get weekly leaderboard (will fall back to all-time)
  await apiCall('/api/student/leaderboard?period=weekly');
}

async function testErrorHandling() {
  console.log('\n🚫 Testing Error Handling');
  console.log('==========================');

  // Test without authentication
  const originalToken = authToken;
  authToken = null;

  await apiCall('/api/student/vocabulary');
  await apiCall('/api/student/lessons');

  // Test with invalid token
  authToken = 'invalid-token';
  await apiCall('/api/auth/student');

  // Restore valid token
  authToken = originalToken;

  // Test invalid endpoints
  await apiCall('/api/student/nonexistent');
}

async function runAllTests() {
  console.log('🚀 Starting Student API Tests');
  console.log('==============================');

  try {
    await testAuthentication();
    await testVocabulary();
    await testLessons();
    await testHomework(); 
    await testLeaderboard();
    await testErrorHandling();

    console.log('\n✅ All tests completed!');
    console.log('\n📊 Test Summary:');
    console.log('- Authentication: Tested login and profile fetch');
    console.log('- Vocabulary: Tested daily words and review submission');
    console.log('- Lessons: Tested lesson listing and filtering');
    console.log('- Homework: Tested homework listing and status filtering');
    console.log('- Leaderboard: Tested rankings and statistics');
    console.log('- Error handling: Tested authentication and invalid requests');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Additional utility functions for mobile team
async function generateTestData() {
  console.log('\n🔧 Generating Test Data Summary');
  console.log('================================');

  if (!studentData) {
    console.log('❌ No student data available. Run authentication test first.');
    return;
  }

  const testData = {
    student_profile: {
      id: studentData.id,
      name: `${studentData.first_name} ${studentData.last_name}`,
      email: studentData.email,
      organization_id: studentData.organization_id
    },
    credentials: TEST_CREDENTIALS,
    groups: studentData.group_enrollments.map(e => ({
      id: e.groups.id,
      name: e.groups.name,
      level: e.groups.level
    })),
    ranking: studentData.ranking,
    api_endpoints: {
      auth: '/api/auth/student',
      vocabulary: '/api/student/vocabulary',
      lessons: '/api/student/lessons', 
      homework: '/api/student/homework',
      leaderboard: '/api/student/leaderboard'
    }
  };

  console.log(JSON.stringify(testData, null, 2));

  // Save to file for mobile team
  const fs = require('fs');
  fs.writeFileSync('docs/api-test-results.json', JSON.stringify(testData, null, 2));
  console.log('\n💾 Test data saved to docs/api-test-results.json');
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllTests()
    .then(() => generateTestData())
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  generateTestData,
  apiCall
};