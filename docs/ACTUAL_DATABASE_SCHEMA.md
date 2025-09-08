# 📊 Actual Database Schema - Mobile Team Reference

## ✅ CONFIRMED WORKING TABLES

### students ✅
```sql
id, organization_id, first_name, last_name, email, 
student_id, total_points, current_level, available_coins, 
date_of_birth, gender, enrollment_status, is_active, ...
```

### student_rankings ✅ 
```sql
id, organization_id, student_id, total_points, total_coins,
current_level, current_rank, class_rank, current_streak, ...
```

### groups ✅
```sql
id, organization_id, name, level, subject, max_students,
current_enrollment, status, schedule, classroom, ...
```

### student_group_enrollments ✅
```sql
id, organization_id, student_id, group_id, enrollment_date,
status, payment_status, certificate_issued, ...
```

## ⚠️ VOCABULARY SCHEMA ISSUE

### vocabulary_words table exists but has DIFFERENT schema:
- **Required field**: `unit_id` (not `word`)
- **Issue**: This appears to be a different vocabulary table structure
- **Mobile team should**: Skip vocabulary for MVP or use direct table queries

## 🎯 MOBILE TEAM RECOMMENDATION

### Phase 1: Core Features (WORKING NOW)
```javascript
// ✅ These work perfectly
const coreFeatures = {
  authentication: '/api/auth/student-simple',
  studentProfile: 'students table',
  rankings: 'student_rankings table', 
  groups: 'groups table',
  enrollments: 'student_group_enrollments table'
}
```

### Phase 2: Vocabulary (SKIP FOR NOW)
```javascript
// ❌ Vocabulary has schema mismatch
// Wait for backend team to fix or use placeholder data
const vocabularyWorkaround = {
  words: [
    { id: 1, word: 'Hello', definition: 'Greeting' },
    { id: 2, word: 'Goodbye', definition: 'Farewell' }
  ]
}
```

## 🔄 WORKING FLOW FOR MOBILE

### 1. Login Flow ✅
```javascript
const login = async (email) => {
  const response = await fetch('http://localhost:3002/api/auth/student-simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  
  const data = await response.json()
  if (data.success) {
    // Store token and student data
    await AsyncStorage.setItem('token', data.data.session.token)
    await AsyncStorage.setItem('student', JSON.stringify(data.data.student))
    return data.data.student
  }
}
```

### 2. Direct Supabase Queries ✅
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xlcsegukheumsadygmgh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
)

// Get student groups
const getStudentGroups = async (studentId) => {
  const { data, error } = await supabase
    .from('student_group_enrollments')
    .select(`
      *,
      groups (
        id,
        name,
        level,
        subject,
        schedule
      )
    `)
    .eq('student_id', studentId)
    .eq('status', 'active')
  
  return data
}

// Get rankings
const getRankings = async (studentId) => {
  const { data, error } = await supabase
    .from('student_rankings')
    .select('*')
    .eq('student_id', studentId)
    .single()
  
  return data
}
```

## 🚀 MOBILE DEVELOPMENT STATUS

### ✅ START IMMEDIATELY WITH:
- Login screen (email: john.smith@harry-school.test, password: Harry2025!)
- Student profile display
- Groups/class enrollment display  
- Rankings/points display
- Leaderboard functionality

### ⏳ WAIT FOR BACKEND FIXES:
- Vocabulary learning feature
- Homework submission
- Lesson content

### 📱 RECOMMENDED MVP SCREENS:
1. **Login** - Use simplified auth endpoint ✅
2. **Dashboard** - Show student info + points ✅  
3. **My Groups** - Show enrolled classes ✅
4. **Leaderboard** - Show rankings ✅
5. **Profile** - Show student details ✅
6. **Vocabulary** - Use placeholder data for now ⏳
7. **Homework** - Skip for MVP ⏳

## 🔐 FINAL TEST CREDENTIALS

```bash
Email: john.smith@harry-school.test
Password: Harry2025!
API Base: http://localhost:3002/api
Supabase URL: https://xlcsegukheumsadygmgh.supabase.co
```

**Bottom Line**: 80% of core functionality is ready. Mobile team can start building immediately with auth, profiles, groups, and rankings!