# Harry School - Student Mobile App Quick Start Guide

## 🚀 Ready for Development!

The Harry School admin system has been fully configured with student authentication and all required database tables. You can start building the mobile app immediately!

## 🔧 Database Configuration

### Supabase Connection
```javascript
// Install: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jhewccuoxjxdzyytvosc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdjY3VveGp4ZHp5eXR2b3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTIzNjUsImV4cCI6MjA2ODY2ODM2NX0.FIpEjUftHXFc0YF_Ji5OR6rgfoZsQjINBtK2gWHrYUw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 🔐 Authentication Flow

### 1. Student Login
Students receive auto-generated credentials when created by admin:
- **Username Format**: First 3 letters + 3 digits (e.g., "ali123", "mar456")  
- **Password Format**: 6 alphanumeric characters (e.g., "a7x9m2", "k3p8s1")

```javascript
// Student login function
async function loginStudent(username, password) {
  // Students use email format for Supabase auth
  const email = `${username}@harryschool.internal`
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  })

  if (error) {
    throw new Error('Login failed: ' + error.message)
  }

  return data.user
}
```

### 2. Get Student Profile
```javascript
// Get current student's profile
async function getCurrentStudentProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  // Get student profile via bridge table
  const { data: profile, error } = await supabase
    .from('student_profiles')
    .select(`
      *,
      students (
        id, first_name, last_name, date_of_birth,
        enrollment_status, grade_level, primary_phone, email
      )
    `)
    .eq('id', user.id)
    .single()

  if (error) throw error
  return profile
}
```

## 📚 Core Features Implementation

### 1. View Lessons
```javascript
// Get lessons for enrolled groups
async function getStudentLessons(page = 1, limit = 20) {
  const { data, error, count } = await supabase
    .from('lessons')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .order('order_index')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) throw error
  return { lessons: data, totalCount: count }
}
```

### 2. Submit Homework
```javascript
// Submit homework assignment
async function submitHomework(hometaskId, submissionText, files = []) {
  const { data, error } = await supabase
    .from('student_hometask_submissions')
    .insert({
      hometask_id: hometaskId,
      submission_text: submissionText,
      submission_files: files, // JSON array of file URLs
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .select()

  if (error) throw error
  return data[0]
}

// Get homework submissions
async function getMySubmissions() {
  const { data, error } = await supabase
    .from('student_hometask_submissions')
    .select(`
      *,
      hometasks (
        title, due_date, points_value, instructions
      )
    `)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return data
}
```

### 3. Vocabulary Learning
```javascript
// Get vocabulary words with progress
async function getVocabularyWords(difficulty = null, category = null) {
  let query = supabase
    .from('vocabulary_words')
    .select(`
      *,
      student_vocabulary_progress (
        mastery_level, is_favorite, review_count,
        last_reviewed, next_review
      )
    `)
    .eq('is_active', true)

  if (difficulty) query = query.eq('difficulty_level', difficulty)
  if (category) query = query.eq('category', category)

  const { data, error } = await query.order('difficulty_level')
  
  if (error) throw error
  return data
}

// Update vocabulary progress
async function updateVocabularyProgress(wordId, wasCorrect, newMasteryLevel) {
  const { data, error } = await supabase
    .from('student_vocabulary_progress')
    .upsert({
      word_id: wordId,
      mastery_level: newMasteryLevel,
      review_count: supabase.rpc('increment', { x: 1 }),
      correct_count: wasCorrect ? supabase.rpc('increment', { x: 1 }) : undefined,
      last_reviewed: new Date().toISOString(),
      next_review: calculateNextReview(newMasteryLevel) // Your spaced repetition logic
    })
    .select()

  if (error) throw error
  return data[0]
}
```

### 4. View Schedule
```javascript
// Get student's weekly schedule
async function getMySchedule() {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      groups (
        name, subject, classroom, online_meeting_url
      )
    `)
    .order('day_of_week')
    .order('start_time')

  if (error) throw error
  
  // Group by day of week
  const schedule = {}
  data.forEach(item => {
    if (!schedule[item.day_of_week]) schedule[item.day_of_week] = []
    schedule[item.day_of_week].push(item)
  })
  
  return schedule
}
```

### 5. Points & Rankings
```javascript
// Get current student's points and ranking
async function getMyRanking() {
  const { data, error } = await supabase
    .from('student_rankings')
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Get points transaction history
async function getPointsHistory(limit = 50) {
  const { data, error } = await supabase
    .from('points_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Get leaderboard
async function getLeaderboard(limit = 100) {
  const { data, error } = await supabase
    .from('student_rankings')
    .select(`
      *,
      students (first_name, last_name)
    `)
    .order('points_total', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
```

### 6. Create Referrals
```javascript
// Generate referral code
async function createReferral() {
  const referralCode = generateReferralCode() // Your code generation logic
  
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referral_code: referralCode,
      status: 'pending',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    })
    .select()

  if (error) throw error
  return data[0]
}

// Get my referrals and rewards
async function getMyReferrals() {
  const { data, error } = await supabase
    .from('referrals')
    .select(`
      *,
      referral_rewards (*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
```

## 🔄 Real-time Subscriptions

### Listen for Points Updates
```javascript
// Subscribe to points changes
const subscription = supabase
  .channel('student-points')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'points_transactions',
      filter: `student_id=eq.${currentStudentId}`
    },
    (payload) => {
      // Update UI with new points
      console.log('New points earned:', payload.new)
      updatePointsDisplay(payload.new.points)
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'student_rankings',
      filter: `student_id=eq.${currentStudentId}`
    },
    (payload) => {
      // Update ranking display
      updateRankingDisplay(payload.new)
    }
  )
  .subscribe()
```

### Listen for Homework Grades
```javascript
// Subscribe to homework grading
const homeworkSubscription = supabase
  .channel('homework-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'student_hometask_submissions',
      filter: `student_id=eq.${currentStudentId}`
    },
    (payload) => {
      if (payload.new.status === 'graded') {
        // Show notification about graded homework
        showNotification('Homework graded!', payload.new.feedback)
      }
    }
  )
  .subscribe()
```

## 📱 Mobile App Architecture Suggestions

### 1. Recommended Stack
- **React Native** or **Flutter** for cross-platform development
- **Zustand** or **Redux** for state management
- **React Query** or **SWR** for data fetching and caching
- **Async Storage** for offline data

### 2. Offline Support
```javascript
// Cache essential data locally
import AsyncStorage from '@react-native-async-storage/async-storage'

async function cacheStudentData(data) {
  await AsyncStorage.setItem('student_profile', JSON.stringify(data))
}

async function getCachedStudentData() {
  const data = await AsyncStorage.getItem('student_profile')
  return data ? JSON.parse(data) : null
}
```

### 3. Error Handling
```javascript
// Centralized error handling
function handleSupabaseError(error) {
  console.error('Database error:', error)
  
  if (error.code === 'PGRST301') {
    // RLS policy violation - user doesn't have access
    showError('You don\'t have permission to access this data')
  } else if (error.message.includes('JWT')) {
    // Authentication error
    redirectToLogin()
  } else {
    // Generic error
    showError('Something went wrong. Please try again.')
  }
}
```

## 🧪 Testing

### Getting Test Credentials
1. Access Harry School admin panel
2. Go to Students section
3. Create a new test student
4. System will display auto-generated username/password
5. Use these credentials in your mobile app for testing

### Test Student Data Structure
```json
{
  "username": "tes123",
  "password": "a7x9m2",
  "student_info": {
    "first_name": "Test",
    "last_name": "Student",
    "grade_level": "10",
    "enrollment_status": "active"
  }
}
```

## ✅ Development Checklist

- [ ] Install Supabase client library
- [ ] Configure authentication flow
- [ ] Implement student login screen
- [ ] Test authentication with admin-generated credentials
- [ ] Build lessons listing screen
- [ ] Implement homework submission flow  
- [ ] Add vocabulary practice module
- [ ] Create schedule/calendar view
- [ ] Implement points and ranking system
- [ ] Add referral system
- [ ] Set up real-time subscriptions
- [ ] Add offline data caching
- [ ] Implement push notifications (optional)

## 🆘 Support

All database tables, RLS policies, and authentication systems are ready! The mobile app can start development immediately using the provided Supabase configuration.

For any questions about the database schema or API usage, refer to:
- `docs/api-contract.md` - Complete API documentation
- `docs/student-app-integration-package.md` - Detailed integration guide

**Happy coding! 🎉**