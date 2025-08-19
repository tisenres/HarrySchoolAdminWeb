# Harry School Mobile Apps - Complete Architecture & Implementation Plan

## 📱 Repository Structure

```
harry-school-crm/
├── admin-panel/           # Existing Next.js Admin Panel
├── mobile/               # Mobile Apps Root Directory
│   ├── apps/
│   │   ├── teacher/     # Teacher App
│   │   │   ├── app.json
│   │   │   ├── App.tsx
│   │   │   ├── metro.config.js
│   │   │   └── package.json
│   │   └── student/     # Student App
│   │       ├── app.json
│   │       ├── App.tsx
│   │       ├── metro.config.js
│   │       └── package.json
│   ├── packages/
│   │   ├── shared/      # Shared Components & Logic
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── ui/          # Design System
│   │   │   ├── components/
│   │   │   ├── theme/
│   │   │   └── assets/
│   │   └── api/         # Supabase Integration
│   │       ├── auth/
│   │       ├── database/
│   │       └── realtime/
│   └── package.json     # Monorepo Root
```

## 🎨 Design System & UI Architecture

### Core Design Tokens
```typescript
// packages/ui/theme/tokens.ts
export const colors = {
  primary: {
    50: '#e6f2ed',
    100: '#cce5db',
    200: '#99cbb7',
    300: '#66b194',
    400: '#339770',
    500: '#1d7452', // Primary brand color
    600: '#175d42',
    700: '#124631',
    800: '#0c2f21',
    900: '#061810',
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
  ranking: {
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
  }
}

export const typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  }
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
}

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
}
```

## 🏗️ Student App Architecture

### Navigation Structure
```typescript
// apps/student/src/navigation/AppNavigator.tsx
const StudentAppStructure = {
  OnboardingStack: {
    screens: ['Welcome', 'Features', 'LoginSetup']
  },
  AuthStack: {
    screens: ['Login', 'ForgotPassword']
  },
  MainTabs: {
    Home: {
      screens: ['Dashboard', 'Notifications', 'Achievements']
    },
    Lessons: {
      screens: ['LessonList', 'LessonDetail', 'Quiz', 'Speaking', 'Listening', 'Writing']
    },
    Schedule: {
      screens: ['Calendar', 'ClassDetail', 'Attendance']
    },
    Vocabulary: {
      screens: ['WordLists', 'Flashcards', 'Practice', 'Translator']
    },
    Profile: {
      screens: ['ProfileMain', 'Settings', 'Feedback', 'Referrals', 'Support']
    }
  }
}
```

### Core Features Implementation

#### 1. Student Dashboard
```typescript
interface StudentDashboard {
  // Ranking Section
  ranking: {
    currentRank: number;
    totalPoints: number;
    availableCoins: number;
    level: number;
    nextLevelProgress: number;
    leaderboardPosition: number;
  };
  
  // Today's Schedule
  todaySchedule: {
    upcomingClasses: Class[];
    homework: Assignment[];
    deadlines: Deadline[];
  };
  
  // Quick Stats
  stats: {
    attendanceRate: number;
    averageGrade: number;
    completedHomework: number;
    streakDays: number;
  };
  
  // Recent Achievements
  achievements: Achievement[];
  
  // Notifications
  notifications: Notification[];
}
```

#### 2. Home Tasks Module
```typescript
interface HomeTask {
  id: string;
  type: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing' | 'mixed';
  title: string;
  description: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  coins: number;
  dueDate: Date;
  estimatedTime: number; // minutes
  
  content: {
    // Text Lessons
    textContent?: {
      passages: TextPassage[];
      questions: Question[];
    };
    
    // Quiz
    quizContent?: {
      questions: QuizQuestion[];
      timeLimit?: number;
    };
    
    // Speaking (Whisper API)
    speakingContent?: {
      prompt: string;
      targetPhrases: string[];
      pronunciationGuide: AudioFile;
      recordingDuration: number;
    };
    
    // Listening
    listeningContent?: {
      audioFile: AudioFile;
      transcript?: string;
      questions: Question[];
    };
    
    // Writing
    writingContent?: {
      prompt: string;
      wordLimit: { min: number; max: number };
      rubric: WritingRubric;
    };
    
    // Interactive Elements
    interactiveElements?: {
      images: Image[];
      videos: Video[];
      dragDrop: DragDropElement[];
      matching: MatchingPair[];
    };
  };
  
  aiGenerated: boolean;
  aiCheckingEnabled: boolean;
}
```

#### 3. Vocabulary Module
```typescript
interface VocabularySystem {
  wordLists: {
    byUnit: WordList[];
    personal: WordList[];
    favorites: Word[];
  };
  
  flashcards: {
    decks: FlashcardDeck[];
    studyModes: ['classic', 'spaced_repetition', 'quick_review'];
    progress: StudyProgress;
  };
  
  translator: {
    languages: ['en', 'ru', 'uz'];
    history: Translation[];
    savedTranslations: SavedTranslation[];
  };
  
  practice: {
    modes: ['spelling', 'meaning', 'usage', 'pronunciation'];
    difficulty: AdaptiveDifficulty;
    achievements: VocabularyAchievement[];
  };
}
```

#### 4. Ranking & Rewards
```typescript
interface RankingSystem {
  leaderboards: {
    global: Leaderboard;
    group: Leaderboard;
    weekly: Leaderboard;
    monthly: Leaderboard;
  };
  
  rewards: {
    catalog: Reward[];
    redemptions: Redemption[];
    availableCoins: number;
  };
  
  achievements: {
    unlocked: Achievement[];
    inProgress: Achievement[];
    locked: Achievement[];
  };
  
  points: {
    history: PointTransaction[];
    sources: PointSource[];
    multipliers: Multiplier[];
  };
}
```

#### 5. Referral System
```typescript
interface ReferralSystem {
  referralCode: string;
  referralLink: string;
  
  stats: {
    totalReferrals: number;
    successfulEnrollments: number;
    pendingReferrals: number;
    totalRewards: number;
  };
  
  rewards: {
    perReferral: number;
    bonusThresholds: BonusThreshold[];
    claimedRewards: ClaimedReward[];
  };
  
  sharing: {
    methods: ['whatsapp', 'telegram', 'sms', 'email', 'copy_link'];
    templates: MessageTemplate[];
  };
}
```

## 👩‍🏫 Teacher App Architecture

### Navigation Structure
```typescript
const TeacherAppStructure = {
  OnboardingStack: {
    screens: ['Welcome', 'Features', 'Setup']
  },
  AuthStack: {
    screens: ['Login']
  },
  MainTabs: {
    Home: {
      screens: ['Dashboard', 'Notifications', 'QuickActions']
    },
    Groups: {
      screens: ['GroupList', 'GroupDetail', 'StudentList', 'GroupAnalytics']
    },
    Schedule: {
      screens: ['Calendar', 'ClassDetail', 'Attendance']
    },
    Feedback: {
      screens: ['FeedbackList', 'CreateFeedback', 'FeedbackHistory']
    },
    Profile: {
      screens: ['ProfileMain', 'Settings', 'Performance']
    }
  }
}
```

### Core Features Implementation

#### 1. Groups & Students Management
```typescript
interface GroupManagement {
  groups: {
    assigned: Group[];
    schedule: GroupSchedule[];
    capacity: GroupCapacity[];
  };
  
  students: {
    byGroup: Map<string, Student[]>;
    totalCount: number;
    activeCount: number;
    performance: StudentPerformance[];
  };
  
  actions: {
    viewStudentProfile: (studentId: string) => StudentProfile;
    markAttendance: (groupId: string, date: Date) => AttendanceSheet;
    assignHomework: (groupId: string, task: HomeTask) => void;
    sendNotification: (recipients: string[], message: string) => void;
  };
}
```

#### 2. Attendance Management
```typescript
interface AttendanceSystem {
  marking: {
    quickMark: (groupId: string, session: Session) => void;
    bulkMark: (groupId: string, status: AttendanceStatus) => void;
    individualMark: (studentId: string, status: AttendanceStatus) => void;
  };
  
  statuses: {
    present: 'present';
    absent: 'absent';
    late: 'late';
    excused: 'excused';
  };
  
  history: {
    byGroup: (groupId: string) => AttendanceHistory;
    byStudent: (studentId: string) => AttendanceHistory;
    statistics: AttendanceStatistics;
  };
  
  reports: {
    generate: (period: DateRange) => AttendanceReport;
    export: (format: 'pdf' | 'excel') => File;
  };
}
```

#### 3. Student Feedback System
```typescript
interface FeedbackSystem {
  templates: {
    academic: FeedbackTemplate[];
    behavioral: FeedbackTemplate[];
    custom: FeedbackTemplate[];
  };
  
  creation: {
    individual: (studentId: string, feedback: Feedback) => void;
    bulk: (studentIds: string[], feedback: Feedback) => void;
    scheduled: (schedule: FeedbackSchedule) => void;
  };
  
  categories: {
    performance: ['excellent', 'good', 'satisfactory', 'needs_improvement'];
    behavior: ['exemplary', 'good', 'acceptable', 'concerning'];
    participation: ['active', 'moderate', 'passive', 'disengaged'];
    homework: ['complete', 'partial', 'missing', 'late'];
  };
  
  impact: {
    pointsAwarded: number;
    rankingEffect: RankingChange;
    parentNotification: boolean;
  };
}
```

#### 4. Additional Tasks Management
```typescript
interface AdditionalTasks {
  aiGeneration: {
    generate: (params: TaskGenerationParams) => HomeTask;
    customize: (task: HomeTask) => HomeTask;
    difficulty: AdaptiveDifficulty;
  };
  
  assignment: {
    toStudent: (studentId: string, task: HomeTask) => void;
    toGroup: (groupId: string, task: HomeTask) => void;
    scheduled: (schedule: TaskSchedule) => void;
  };
  
  monitoring: {
    completion: TaskCompletion[];
    performance: TaskPerformance[];
    analytics: TaskAnalytics;
  };
}
```

## 🔧 Technical Implementation

### Supabase Integration
```typescript
// packages/api/database/client.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

### Real-time Features
```typescript
// packages/api/realtime/subscriptions.ts
export const useRealtimeNotifications = (userId: string) => {
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Handle new notification
          showPushNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};

export const useRealtimeRanking = (studentId: string) => {
  const [ranking, setRanking] = useState<StudentRanking | null>(null);
  
  useEffect(() => {
    const channel = supabase
      .channel('ranking_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_rankings',
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          setRanking(payload.new as StudentRanking);
          
          // Show achievement notification if level increased
          if (payload.old.current_level < payload.new.current_level) {
            showLevelUpAnimation(payload.new.current_level);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);
  
  return ranking;
};
```

### AI Integration
```typescript
// packages/api/ai/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export class AITaskGenerator {
  async generateHomeTask(params: {
    subject: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    type: TaskType;
    studentLevel: number;
  }): Promise<HomeTask> {
    const prompt = this.buildPrompt(params);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an educational content creator for Harry School. Generate engaging, age-appropriate tasks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });
    
    return this.parseTaskResponse(completion.choices[0].message.content);
  }
  
  async checkTask(submission: {
    task: HomeTask;
    studentAnswer: any;
  }): Promise<TaskResult> {
    const evaluation = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an educational assessment system. Evaluate student work fairly and provide constructive feedback."
        },
        {
          role: "user",
          content: JSON.stringify(submission)
        }
      ],
    });
    
    return this.parseEvaluation(evaluation.choices[0].message.content);
  }
}

// Whisper API for Speaking Tasks
export class SpeechEvaluator {
  async evaluateSpeech(audioBlob: Blob, targetText: string): Promise<SpeechResult> {
    const transcription = await openai.audio.transcriptions.create({
      file: audioBlob,
      model: "whisper-1",
      language: "en",
    });
    
    const evaluation = await this.comparePronunciation(
      transcription.text,
      targetText
    );
    
    return {
      transcription: transcription.text,
      accuracy: evaluation.accuracy,
      feedback: evaluation.feedback,
      score: evaluation.score,
    };
  }
}
```

## 🎭 Onboarding Experience

### Student App Onboarding
```typescript
const StudentOnboarding = [
  {
    screen: 'Welcome',
    title: 'Welcome to Harry School',
    subtitle: 'Your journey to excellence starts here',
    visual: 'animated_logo',
    action: 'Next'
  },
  {
    screen: 'Features',
    slides: [
      {
        title: 'Learn & Earn',
        description: 'Complete lessons and earn points',
        icon: '🎯',
        visual: 'lesson_preview'
      },
      {
        title: 'Track Progress',
        description: 'Monitor your ranking and achievements',
        icon: '📊',
        visual: 'ranking_preview'
      },
      {
        title: 'Build Vocabulary',
        description: 'Master new words with smart flashcards',
        icon: '📚',
        visual: 'vocabulary_preview'
      },
      {
        title: 'Earn Rewards',
        description: 'Redeem coins for exciting rewards',
        icon: '🎁',
        visual: 'rewards_preview'
      }
    ]
  },
  {
    screen: 'Permissions',
    requests: ['notifications', 'camera', 'microphone'],
    title: 'Enable Features',
    description: 'Allow permissions for the best experience'
  },
  {
    screen: 'Login',
    title: 'Sign In',
    description: 'Use your Harry School credentials',
    methods: ['email', 'phone']
  }
];
```

### Teacher App Onboarding
```typescript
const TeacherOnboarding = [
  {
    screen: 'Welcome',
    title: 'Harry School Teacher Portal',
    subtitle: 'Empowering educators, inspiring students',
    visual: 'teacher_hero',
    action: 'Get Started'
  },
  {
    screen: 'Features',
    slides: [
      {
        title: 'Manage Groups',
        description: 'Organize students and track performance',
        icon: '👥',
        visual: 'groups_preview'
      },
      {
        title: 'Track Attendance',
        description: 'Quick and easy attendance marking',
        icon: '✅',
        visual: 'attendance_preview'
      },
      {
        title: 'Provide Feedback',
        description: 'Give meaningful feedback to students',
        icon: '💬',
        visual: 'feedback_preview'
      },
      {
        title: 'Assign Tasks',
        description: 'Create and assign AI-powered homework',
        icon: '📝',
        visual: 'tasks_preview'
      }
    ]
  },
  {
    screen: 'Setup',
    steps: ['Profile', 'Preferences', 'Notifications'],
    title: 'Quick Setup',
    description: 'Customize your experience'
  }
];
```

## 📊 Database Schema Extensions

### Mobile-Specific Tables
```sql
-- Home Tasks (Lessons)
CREATE TABLE home_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  -- Task Metadata
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(20) CHECK (type IN ('text', 'quiz', 'speaking', 'listening', 'writing', 'mixed')),
  subject VARCHAR(50),
  difficulty VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- Content Storage
  content JSONB NOT NULL, -- Structured lesson content
  media_urls JSONB, -- Images, audio, video URLs
  
  -- AI Configuration
  ai_generated BOOLEAN DEFAULT false,
  ai_checking_enabled BOOLEAN DEFAULT true,
  ai_parameters JSONB,
  
  -- Points & Rewards
  points INTEGER DEFAULT 10,
  coins INTEGER DEFAULT 1,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Assignments
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES home_tasks(id),
  student_id UUID REFERENCES students(id),
  group_id UUID REFERENCES groups(id),
  
  -- Assignment Details
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Completion Status
  status VARCHAR(20) DEFAULT 'assigned',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER, -- minutes
  
  -- Results
  submission JSONB,
  score DECIMAL(5,2),
  feedback TEXT,
  points_earned INTEGER,
  coins_earned INTEGER,
  
  -- AI Evaluation
  ai_evaluation JSONB,
  manual_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id),
  
  UNIQUE(task_id, student_id)
);

-- Vocabulary System
CREATE TABLE vocabulary_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  -- Word Information
  word VARCHAR(100) NOT NULL,
  translation_ru VARCHAR(200),
  translation_uz VARCHAR(200),
  pronunciation VARCHAR(200),
  audio_url TEXT,
  
  -- Categorization
  unit VARCHAR(50),
  level VARCHAR(20),
  category VARCHAR(50),
  tags TEXT[],
  
  -- Usage
  definition TEXT,
  example_sentences JSONB,
  synonyms TEXT[],
  antonyms TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Vocabulary Progress
CREATE TABLE student_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  word_id UUID REFERENCES vocabulary_words(id),
  
  -- Learning Status
  status VARCHAR(20) DEFAULT 'new',
  familiarity_level INTEGER DEFAULT 0,
  
  -- Practice Statistics
  times_reviewed INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  next_review TIMESTAMP WITH TIME ZONE,
  
  -- Personal
  is_favorite BOOLEAN DEFAULT false,
  personal_notes TEXT,
  
  UNIQUE(student_id, word_id)
);

-- Extra Lesson Requests
CREATE TABLE extra_lesson_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  teacher_id UUID REFERENCES teachers(id),
  group_id UUID REFERENCES groups(id),
  
  -- Request Details
  request_type VARCHAR(20) CHECK (request_type IN ('lesson', 'homework')),
  subject VARCHAR(50),
  topic TEXT,
  preferred_date DATE,
  message TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  teacher_response TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);
```

## 🚀 Development Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Setup monorepo structure with Expo
- [ ] Configure shared packages
- [ ] Implement design system
- [ ] Setup Supabase integration
- [ ] Create authentication flow

### Phase 2: Core Features - Student App (Week 3-4)
- [ ] Student dashboard
- [ ] Home tasks module
- [ ] Basic vocabulary system
- [ ] Schedule view
- [ ] Attendance tracking

### Phase 3: Core Features - Teacher App (Week 3-4)
- [ ] Teacher dashboard
- [ ] Groups management
- [ ] Student lists
- [ ] Attendance marking
- [ ] Basic feedback system

### Phase 4: Advanced Features (Week 5-6)
- [ ] AI task generation
- [ ] Speech evaluation (Whisper)
- [ ] Real-time notifications
- [ ] Ranking system integration
- [ ] Reward catalog

### Phase 5: Polish & Testing (Week 7-8)
- [ ] Onboarding flows
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Bug fixes
- [ ] App store preparation

## 🔒 Security Considerations

1. **Authentication**: Supabase Auth with RLS policies
2. **Data Protection**: Encrypted storage for sensitive data
3. **API Security**: Secure API keys management
4. **Session Management**: Automatic token refresh
5. **Input Validation**: Comprehensive validation on all inputs
6. **Privacy**: GDPR-compliant data handling

## 📱 Performance Optimization

1. **Lazy Loading**: Components and screens
2. **Image Optimization**: Cached and compressed images
3. **Data Caching**: Strategic caching with AsyncStorage
4. **Bundle Size**: Code splitting and tree shaking
5. **Animation Performance**: Native driver usage
6. **List Optimization**: FlatList with proper keys

## 🌍 Internationalization

```typescript
// packages/shared/i18n/translations.ts
export const translations = {
  en: {
    common: {
      login: 'Login',
      logout: 'Logout',
      save: 'Save',
      cancel: 'Cancel',
      // ...
    },
    student: {
      dashboard: 'Dashboard',
      lessons: 'Lessons',
      vocabulary: 'Vocabulary',
      // ...
    },
    teacher: {
      groups: 'Groups',
      attendance: 'Attendance',
      feedback: 'Feedback',
      // ...
    }
  },
  ru: {
    // Russian translations
  },
  uz: {
    // Uzbek Latin translations
  }
};
```

## 🎯 Success Metrics

1. **User Engagement**: Daily active users, session duration
2. **Feature Adoption**: Usage of key features
3. **Performance**: App load time, crash rate
4. **Learning Outcomes**: Task completion rates, vocabulary retention
5. **Teacher Efficiency**: Time saved on administrative tasks
6. **Student Progress**: Ranking improvements, achievement unlocks

This comprehensive architecture provides a solid foundation for building world-class mobile applications for Harry School that seamlessly integrate with the existing admin panel and backend infrastructure.