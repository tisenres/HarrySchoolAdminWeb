# Harry School Student App - Backend Preparation Plan

## 🎯 Mission Critical: Prepare Admin Panel Backend for Student Mobile App

**Status**: IN PROGRESS  
**Priority**: HIGHEST  
**Timeline**: Must complete TODAY  
**Owner**: Backend Team  

---

## 📋 Executive Summary

The Student Mobile App is **BLOCKED** waiting for backend readiness. This document outlines all required backend preparations, API implementations, and data setup needed to unblock the mobile team.

---

## 🚨 CRITICAL BLOCKERS TO RESOLVE

### 1. Student Authentication System ✅
**Status**: READY (migrations 012, 013, 014 completed)
- [x] Student profiles table created
- [x] Auth bridge established
- [x] RLS policies configured
- [ ] Test accounts needed

### 2. Test Student Credentials 🔴
**Status**: NOT READY
**Required**: Create 5 test student accounts with known credentials

### 3. API Endpoints 🟡
**Status**: PARTIALLY READY
**Required**: Implement missing student-facing APIs

### 4. File Upload Strategy 🔴
**Status**: NOT CONFIGURED
**Required**: Configure Supabase Storage buckets

### 5. Privacy & Security 🟡
**Status**: NEEDS CONFIGURATION
**Required**: Minor protection policies

---

## 📝 DETAILED IMPLEMENTATION PLAN

## Phase 1: Test Data Setup (30 minutes)

### 1.1 Create Test Organization
```sql
-- Insert Harry School as test organization
INSERT INTO organizations (id, name, domain, settings)
VALUES (
    'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c',
    'Harry School Tashkent',
    'harry-school.uz',
    '{"language": "en", "timezone": "Asia/Tashkent"}'
);
```

### 1.2 Create Test Students
```typescript
// Test accounts to create:
const testStudents = [
    {
        username: 'student1',
        password: 'Harry2025!',
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@harry-school.test'
    },
    {
        username: 'student2',
        password: 'Harry2025!',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@harry-school.test'
    },
    {
        username: 'student3',
        password: 'Harry2025!',
        first_name: 'Michael',
        last_name: 'Brown',
        email: 'michael.brown@harry-school.test'
    },
    {
        username: 'minor_student',
        password: 'Harry2025!',
        first_name: 'Emma',
        last_name: 'Wilson',
        email: 'emma.wilson@harry-school.test',
        is_minor: true,
        date_of_birth: '2010-05-15'
    },
    {
        username: 'demo_student',
        password: 'Demo2025!',
        first_name: 'Demo',
        last_name: 'User',
        email: 'demo@harry-school.test'
    }
];
```

### 1.3 Create Test Groups & Enrollments
```sql
-- Create test groups
INSERT INTO groups (organization_id, name, teacher_id, capacity)
VALUES 
    (org_id, 'Beginner English A1', teacher_id, 20),
    (org_id, 'Intermediate B1', teacher_id, 15),
    (org_id, 'Advanced C1', teacher_id, 10);

-- Enroll students in groups
INSERT INTO student_group_enrollments (student_id, group_id, status)
VALUES 
    (student1_id, group1_id, 'active'),
    (student2_id, group1_id, 'active'),
    (student3_id, group2_id, 'active');
```

---

## Phase 2: API Implementation (2 hours)

### 2.1 Student Authentication API
**File**: `src/app/api/auth/student/route.ts`

```typescript
// POST /api/auth/student/login
export async function POST(request: Request) {
    const { username, password } = await request.json();
    
    // 1. Authenticate via Supabase
    // 2. Fetch student profile
    // 3. Check minor status
    // 4. Return session + student data
}
```

### 2.2 Student Profile API
**File**: `src/app/api/students/profile/route.ts`

```typescript
// GET /api/students/profile
// PUT /api/students/profile
// GET /api/students/[id]/ranking
```

### 2.3 Lessons API
**File**: `src/app/api/lessons/student/route.ts`

```typescript
// GET /api/lessons/upcoming
// GET /api/lessons/[id]
// POST /api/lessons/[id]/progress
// GET /api/lessons/[id]/materials
```

### 2.4 Homework API
**File**: `src/app/api/homework/student/route.ts`

```typescript
// GET /api/homework/assigned
// GET /api/homework/[id]
// POST /api/homework/[id]/submit
// GET /api/homework/[id]/submission
```

### 2.5 Vocabulary API
**File**: `src/app/api/vocabulary/student/route.ts`

```typescript
// GET /api/vocabulary/daily
// POST /api/vocabulary/review
// GET /api/vocabulary/progress
// GET /api/vocabulary/packs
```

### 2.6 Leaderboard API
**File**: `src/app/api/leaderboard/route.ts`

```typescript
// GET /api/leaderboard/weekly
// GET /api/leaderboard/monthly
// GET /api/leaderboard/all-time
// GET /api/leaderboard/class/[groupId]
```

---

## Phase 3: Storage Configuration (1 hour)

### 3.1 Create Storage Buckets
```sql
-- Via Supabase Dashboard or SQL
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('student-avatars', 'student-avatars', true),
    ('homework-submissions', 'homework-submissions', false),
    ('lesson-materials', 'lesson-materials', false);
```

### 3.2 Storage Policies
```sql
-- Student avatar upload/read
CREATE POLICY "Students can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'student-avatars' AND
    auth.uid() = owner
);

-- Homework submission upload
CREATE POLICY "Students can upload homework" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'homework-submissions' AND
    auth.uid() IN (
        SELECT sp.id FROM student_profiles sp
        WHERE sp.student_id = (storage.foldername(name)::uuid)
    )
);
```

### 3.3 File Upload Service
**File**: `src/lib/services/storage-service.ts`

```typescript
export class StorageService {
    async uploadStudentAvatar(studentId: string, file: File)
    async uploadHomeworkSubmission(submissionId: string, file: File)
    async getSignedUrl(bucket: string, path: string)
}
```

---

## Phase 4: Privacy & Security (30 minutes)

### 4.1 Minor Protection Settings
**File**: `src/lib/services/privacy-service.ts`

```typescript
export class PrivacyService {
    static isMinor(dateOfBirth: Date): boolean {
        const age = calculateAge(dateOfBirth);
        return age < 18;
    }
    
    static filterMinorData(student: Student) {
        if (this.isMinor(student.date_of_birth)) {
            // Remove sensitive fields
            delete student.phone_number;
            delete student.address;
            delete student.parent_phone;
            // Add privacy notice
            student.privacy_protected = true;
        }
        return student;
    }
}
```

### 4.2 RLS Policies for Minors
```sql
-- Additional privacy for minor students
CREATE POLICY "Hide minor personal data" ON students
FOR SELECT USING (
    CASE 
        WHEN date_of_birth > CURRENT_DATE - INTERVAL '18 years' THEN
            auth.uid() = (SELECT id FROM student_profiles WHERE student_id = students.id)
        ELSE true
    END
);
```

---

## Phase 5: Data Seeding (1 hour)

### 5.1 Vocabulary Data
```typescript
// Seed 100 common English words
const vocabularyWords = [
    { word: 'hello', definition: 'greeting', level: 'A1' },
    { word: 'goodbye', definition: 'farewell', level: 'A1' },
    // ... 98 more words
];
```

### 5.2 Sample Lessons
```typescript
// Create 10 sample lessons per group
const sampleLessons = [
    {
        title: 'Introduction to Present Simple',
        description: 'Learn basic present simple tense',
        content: { blocks: [...] },
        materials: [...]
    },
    // ... more lessons
];
```

### 5.3 Sample Homework
```typescript
// Create homework assignments
const sampleHomework = [
    {
        title: 'Present Simple Exercises',
        instructions: 'Complete all exercises',
        due_date: '2025-01-25',
        points_value: 10
    },
    // ... more homework
];
```

---

## Phase 6: Testing & Validation (1 hour)

### 6.1 API Testing Script
**File**: `scripts/test-student-apis.js`

```javascript
// Test all student endpoints
async function testStudentAPIs() {
    // 1. Test authentication
    await testLogin('student1', 'Harry2025!');
    
    // 2. Test profile fetch
    await testProfileFetch();
    
    // 3. Test lessons
    await testLessonsFetch();
    
    // 4. Test homework
    await testHomeworkSubmission();
    
    // 5. Test vocabulary
    await testVocabularyReview();
    
    // 6. Test leaderboard
    await testLeaderboard();
}
```

### 6.2 Postman Collection
Create comprehensive Postman collection with:
- Authentication flows
- All student endpoints
- Error scenarios
- File upload tests

---

## Phase 7: Documentation (30 minutes)

### 7.1 API Documentation
**File**: `docs/STUDENT_API_REFERENCE.md`

Document all endpoints with:
- Request/Response formats
- Authentication requirements
- Error codes
- Rate limits

### 7.2 Student App Integration Guide
**File**: `docs/STUDENT_APP_INTEGRATION.md`

Provide:
- Supabase connection details
- Authentication flow
- Data models
- Code examples

---

## 📊 Success Checklist

### Backend Readiness
- [ ] Test students created with credentials
- [ ] All student APIs implemented
- [ ] Storage buckets configured
- [ ] Privacy policies active
- [ ] Sample data seeded

### API Endpoints
- [ ] POST /api/auth/student/login
- [ ] GET /api/students/profile
- [ ] GET /api/lessons/upcoming
- [ ] GET /api/homework/assigned
- [ ] GET /api/vocabulary/daily
- [ ] GET /api/leaderboard/weekly

### Test Data
- [ ] 5 test students created
- [ ] 3 test groups created
- [ ] 100+ vocabulary words
- [ ] 30+ sample lessons
- [ ] 20+ homework assignments

### Documentation
- [ ] API reference complete
- [ ] Integration guide ready
- [ ] Postman collection exported
- [ ] Test credentials documented

---

## 🚀 Delivery to Mobile Team

### Package Contents
```
student-app-package/
├── credentials.json          # Test account credentials
├── api-reference.md         # Complete API documentation
├── postman-collection.json  # API testing collection
├── sample-data.sql         # Database seed script
└── integration-guide.md    # Step-by-step integration
```

### Handoff Message
```
Subject: ✅ Backend Ready for Student App Integration

Hi Mobile Team,

All backend blockers have been resolved:

1. ✅ Authentication system ready
2. ✅ Test accounts created (see credentials.json)
3. ✅ All required APIs implemented
4. ✅ File storage configured
5. ✅ Privacy settings active
6. ✅ Sample data seeded

Supabase Connection:
- URL: https://jhewccuoxjxdzyytvosc.supabase.co
- Anon Key: [provided in credentials.json]

Test Accounts:
- Username: student1 / Password: Harry2025!
- Username: demo_student / Password: Demo2025!

Please find complete documentation in the attached package.

Ready for integration!
```

---

## ⏱ Timeline

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Test Data Setup | 30 min | 🔴 Not Started |
| 2 | API Implementation | 2 hours | 🔴 Not Started |
| 3 | Storage Configuration | 1 hour | 🔴 Not Started |
| 4 | Privacy & Security | 30 min | 🔴 Not Started |
| 5 | Data Seeding | 1 hour | 🔴 Not Started |
| 6 | Testing & Validation | 1 hour | 🔴 Not Started |
| 7 | Documentation | 30 min | 🔴 Not Started |

**Total Time**: ~6.5 hours
**Target Completion**: End of Day

---

## 🎯 Next Immediate Actions

1. **RIGHT NOW**: Create test organization in database
2. **NEXT 30 MIN**: Implement student authentication API
3. **NEXT 1 HOUR**: Create all test accounts
4. **NEXT 2 HOURS**: Implement remaining APIs
5. **FINAL**: Test everything and package for mobile team

---

**LET'S UNBLOCK THE MOBILE TEAM! 🚀**