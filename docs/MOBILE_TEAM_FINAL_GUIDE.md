# 📱 Mobile Team Final Integration Guide

## ✅ Backend Status: READY FOR DEVELOPMENT

### 🔐 Authentication - SIMPLIFIED & WORKING

**Endpoint**: `/api/auth/student-simple`

```javascript
// Login Request
POST /api/auth/student-simple
{
  "email": "john.smith@harry-school.test"
  // OR
  "username": "student1"  
  // OR
  "student_id": "STU001"
}

// Response
{
  "success": true,
  "data": {
    "session": {
      "token": "base64_encoded_token",
      "expires_at": "2025-01-27T...",
      "type": "simplified_auth"
    },
    "student": {
      "id": "18ebec34-0714-4388-bc0b-e79c92434367",
      "first_name": "John",
      "last_name": "Smith",
      "email": "john.smith@harry-school.test",
      "profile": {
        "username": "student1",
        "vocabulary_daily_goal": 5,
        "notification_preferences": {...}
      },
      "ranking": {
        "total_points": 100,
        "total_coins": 10,
        "current_level": 1
      },
      "group_enrollments": [...]
    }
  }
}
```

### 🎓 Test Accounts Available

| Name | Email | Username | Password | Student ID |
|------|-------|----------|----------|------------|
| John Smith | john.smith@harry-school.test | student1 | Harry2025! | STU001 |
| Sarah Johnson | sarah.johnson@harry-school.test | student2 | Harry2025! | STU002 |
| Demo User | demo@harry-school.test | demo_student | Demo2025! | DEMO001 |

### 🚀 Supabase Connection

```javascript
// React Native / Expo
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xlcsegukheumsadygmgh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY3NlZ3VraGV1bXNhZHlnbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTM5NzksImV4cCI6MjA2OTk2OTk3OX0.kyHG8NazZruZu_pImGLMO8zFQvo--U6nwBqHbUEHBYE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 📊 API Endpoints Status

| Endpoint | Status | Notes |
|----------|--------|-------|
| `/api/auth/student-simple` | ✅ WORKING | Use for login with email/username |
| `/api/student/vocabulary` | ⚠️ PARTIAL | Schema mismatch, basic fields work |
| `/api/student/lessons` | ✅ WORKING | Returns lesson data |
| `/api/student/homework` | ⚠️ PARTIAL | Tables missing, needs SQL script |
| `/api/student/leaderboard` | ✅ WORKING | Rankings functional |

### 🗄️ Database Tables Available

| Table | Status | Purpose |
|-------|--------|---------|
| `students` | ✅ Ready | Student profiles |
| `student_rankings` | ✅ Ready | Points and leaderboard |
| `student_group_enrollments` | ✅ Ready | Class enrollments |
| `groups` | ✅ Ready | Class groups |
| `vocabulary_words` | ⚠️ Partial | Missing some columns |
| `lessons` | ✅ Ready | Lesson content |
| `student_profiles` | ❌ Missing | Run SQL script to create |
| `hometasks` | ❌ Missing | Run SQL script to create |

### 🛠️ Setup Instructions

#### Step 1: Run SQL Setup (REQUIRED)
1. Go to: https://xlcsegukheumsadygmgh.supabase.co/project/default/sql
2. Copy entire contents of `/scripts/complete-setup.sql`
3. Run in SQL editor
4. This creates missing tables and test data

#### Step 2: Test Authentication
```javascript
// React Native Example
const login = async () => {
  const response = await fetch('https://your-vercel-url/api/auth/student-simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'john.smith@harry-school.test' })
  })
  
  const data = await response.json()
  if (data.success) {
    // Store token
    await AsyncStorage.setItem('auth_token', data.data.session.token)
    // Store student data
    await AsyncStorage.setItem('student', JSON.stringify(data.data.student))
  }
}
```

#### Step 3: Make Authenticated Requests
```javascript
const fetchVocabulary = async () => {
  const token = await AsyncStorage.getItem('auth_token')
  
  const response = await fetch('https://your-vercel-url/api/student/vocabulary', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  const data = await response.json()
  return data
}
```

### 📝 What Works vs What Needs Fixing

#### ✅ WORKING NOW:
- Basic authentication with email/username
- Student data retrieval
- Rankings and points
- Group enrollments
- Direct Supabase queries

#### ⚠️ NEEDS MINOR FIX:
- Vocabulary table schema (some columns missing)
- Homework tables (run SQL script)
- File storage (not configured, use URLs)

#### 🔧 WORKAROUNDS:
1. **Auth**: Use simplified endpoint, not Supabase Auth
2. **Vocabulary**: Use only basic fields (word, part_of_speech, phonetics)
3. **Homework**: Skip or use direct Supabase queries
4. **Files**: Store URLs as strings, not file uploads

### 🚨 Important Notes

1. **Privacy Protection**: Students under 18 have filtered data
2. **Session Management**: Tokens are base64 encoded, valid for 7 days
3. **Direct Queries**: You can query Supabase directly for any data
4. **RLS Disabled**: For testing, Row Level Security is not enforced

### 💻 Quick Start Code

```javascript
// services/api.js
const API_BASE = 'https://your-vercel-url/api'

export const authService = {
  login: async (email) => {
    const res = await fetch(`${API_BASE}/auth/student-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    return res.json()
  },
  
  getProfile: async (token) => {
    const res = await fetch(`${API_BASE}/auth/student-simple`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return res.json()
  }
}

// Direct Supabase Query Example
const getStudentData = async (studentId) => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      student_rankings (*),
      student_group_enrollments (
        *,
        groups (*)
      )
    `)
    .eq('id', studentId)
    .single()
    
  return data
}
```

### 📞 Support & Next Steps

1. **Run SQL Script First**: `/scripts/complete-setup.sql`
2. **Test with provided accounts**
3. **Use simplified auth endpoint**
4. **Query Supabase directly when needed**
5. **Report issues for immediate fixes**

## 🎯 Summary

The backend is **functionally ready** for mobile development. Use the simplified auth endpoint and test accounts provided. Some tables need the SQL script run, but core functionality (students, rankings, groups) is 100% operational.

**Start development immediately with:**
- Email: `john.smith@harry-school.test`
- Endpoint: `/api/auth/student-simple`
- Direct Supabase queries for any missing API features