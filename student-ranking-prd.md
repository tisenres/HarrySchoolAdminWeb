# Harry School CRM - Admin Student Ranking Feature PRD

## Executive Summary

This PRD defines the Student Ranking feature for the Harry School CRM admin panel. The system allows administrators to track student performance through points, achievements, and rankings, providing motivation tools and performance analytics within the existing admin interface.

## 🎯 Feature Overview

### Core Functionality
- **Student Points System**: Award and track points for homework, attendance, and behavior
- **Achievement Badges**: Create and award visual achievements for milestones
- **Student Rankings**: Automated leaderboards and performance tracking
- **Rewards Management**: Coin-based reward system for student motivation
- **Admin Analytics**: Performance insights and engagement metrics

### Integration Points
- **Extends existing Students module** with ranking data
- **Adds new "Rankings" section** to admin navigation
- **Enhances student profiles** with points and achievement displays
- **Integrates with notification system** for achievement alerts

## 📊 Database Schema Requirements

### New Tables for Admin Ranking System

```sql
-- Core student ranking data
CREATE TABLE student_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    available_coins INTEGER DEFAULT 0,
    spent_coins INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    current_rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, organization_id)
);

-- Points transaction history for audit trail
CREATE TABLE points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('earned', 'deducted', 'bonus')),
    points_amount INTEGER NOT NULL,
    coins_earned INTEGER DEFAULT 0,
    reason VARCHAR(500) NOT NULL,
    category VARCHAR(50), -- 'homework', 'attendance', 'behavior', 'achievement', 'manual'
    awarded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id)
);

-- Achievement definitions (admin-created badges)
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50), -- Icon identifier for UI
    badge_color VARCHAR(7), -- Hex color code
    points_reward INTEGER DEFAULT 0,
    coins_reward INTEGER DEFAULT 0,
    achievement_type VARCHAR(30), -- 'homework', 'attendance', 'streak', 'milestone', 'special'
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id)
);

-- Student achievements (earned badges tracking)
CREATE TABLE student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    awarded_by UUID REFERENCES profiles(id),
    notes TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id),
    UNIQUE(student_id, achievement_id)
);

-- Rewards catalog for coin redemption
CREATE TABLE rewards_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    coin_cost INTEGER NOT NULL,
    reward_type VARCHAR(30), -- 'privilege', 'certificate', 'recognition'
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id)
);

-- Reward redemptions tracking
CREATE TABLE reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards_catalog(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    coins_spent INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'approved', -- 'approved', 'delivered', 'cancelled'
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES profiles(id),
    notes TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id)
);
```

## 🎨 Admin Interface Requirements

### 1. Enhanced Student List View
**Extend existing Students table with:**
- Points column showing total points
- Level badge display
- Quick point award action button
- Ranking position indicator

### 2. Student Detail Page Enhancements
**Add new "Ranking" tab to student profiles:**
```typescript
interface StudentRankingView {
  rankingOverview: {
    totalPoints: number
    availableCoins: number
    currentLevel: number
    currentRank: number
  }
  recentTransactions: PointsTransaction[]
  earnedAchievements: StudentAchievement[]
  quickActions: {
    awardPoints: boolean
    awardAchievement: boolean
    redeemReward: boolean
  }
}
```

### 3. New Rankings Navigation Section
**Add "Rankings" to main admin navigation with subsections:**
- **Leaderboard**: Top student rankings with filters
- **Point Management**: Bulk point operations
- **Achievements**: Create and manage achievement badges
- **Rewards**: Manage reward catalog and redemptions
- **Analytics**: Performance and engagement metrics

### 4. Point Management Interface
**Quick point award system:**
- Preset reason buttons (Homework Completed +10, Perfect Attendance +5, Good Behavior +3)
- Custom point input with reason text
- Bulk point operations for multiple students
- Point deduction with reason requirement
- Transaction history view with filters

### 5. Achievement Management
**Achievement creation and management:**
- Achievement builder form with icon selection
- Badge customization (colors, names, descriptions)
- Manual achievement award to students
- Achievement analytics (most earned, completion rates)
- Achievement gallery view

### 6. Rewards Management
**Coin-based reward system:**
- Reward catalog creation (privileges, certificates, recognition)
- Coin cost assignment for rewards
- Student redemption approval workflow
- Redemption history and analytics
- Reward popularity tracking

## 🔧 UI Components Needed

### 1. Student Ranking Card
```typescript
interface StudentRankingCardProps {
  student: Student & {
    ranking: StudentRanking
    recentAchievements: Achievement[]
  }
  showQuickActions?: boolean
  compact?: boolean
}
```

### 2. Points Award Modal
```typescript
interface PointsAwardModalProps {
  studentIds: string[]
  presetReasons: { label: string; points: number }[]
  onSubmit: (data: PointsAwardData) => void
}
```

### 3. Achievement Badge Component
```typescript
interface AchievementBadgeProps {
  achievement: Achievement
  earned?: boolean
  earnedDate?: Date
  size: 'small' | 'medium' | 'large'
}
```

### 4. Leaderboard Table
```typescript
interface LeaderboardTableProps {
  students: StudentWithRanking[]
  sortBy: 'points' | 'level' | 'achievements'
  timeframe: 'week' | 'month' | 'all'
  groupFilter?: string
}
```

## 📈 Analytics Dashboard Requirements

### Key Metrics to Display
- **Daily Point Activity**: Points awarded per day/week/month
- **Top Performers**: Highest point earners and most improved
- **Achievement Distribution**: Most/least earned achievements
- **Engagement Trends**: Student participation over time
- **Teacher Activity**: Which admins award most points
- **Category Breakdown**: Points by homework/attendance/behavior

### Visual Components
- **Point Trends Chart**: Line chart showing point awards over time
- **Achievement Completion**: Pie chart of achievement categories
- **Student Engagement**: Bar chart of active vs inactive students
- **Leaderboard Widget**: Top 10 students quick view
- **Recent Activity Feed**: Latest point awards and achievements

## 🔐 Security & Permissions

### Role-Based Access Control
- **Superadmin**: Full ranking system management, create/delete achievements and rewards
- **Admin**: Award points, grant achievements, approve reward redemptions
- **Teacher**: Limited point awards for their assigned students only

### Data Protection
- All ranking data isolated by organization using RLS
- Point transactions require admin authentication
- Achievement awards logged with admin attribution
- Audit trail for all ranking modifications
- Soft delete for all ranking data with restore capability

## 🎯 User Stories

### Admin User Stories
1. **As an admin**, I want to quickly award points to students for completed homework so I can motivate continued engagement
2. **As an admin**, I want to see which students are most engaged so I can identify successful strategies
3. **As an admin**, I want to create custom achievements so I can recognize specific school milestones
4. **As an admin**, I want to bulk award points to an entire group so I can efficiently manage rewards
5. **As an admin**, I want to see point award history so I can track student progress over time

### Superadmin User Stories
1. **As a superadmin**, I want to create reward items so students have motivation goals
2. **As a superadmin**, I want to analyze ranking engagement so I can measure system effectiveness
3. **As a superadmin**, I want to manage achievement categories so I can align with school values
4. **As a superadmin**, I want to export ranking data so I can create performance reports

## 🚀 Implementation Phases

### Phase 1: Design & Database (Week 1)
- UI/UX design for all ranking interfaces
- Database schema implementation with RLS
- Basic ranking calculation algorithms

### Phase 2: Core Features (Week 2)
- Student profile ranking integration
- Point award and transaction system
- Basic leaderboard functionality

### Phase 3: Advanced Management (Week 3)
- Achievement creation and management
- Rewards catalog and redemption system
- Bulk operations interface

### Phase 4: Analytics & Polish (Week 4)
- Analytics dashboard implementation
- Performance optimization
- Comprehensive testing and documentation

## 📋 Success Criteria

### Functional Requirements
- ✅ Admins can award points with reasons in under 30 seconds
- ✅ Student rankings update automatically after point awards
- ✅ Achievement system supports custom badges and automatic awards
- ✅ Leaderboard displays accurately with real-time updates
- ✅ Bulk operations handle 100+ students efficiently
- ✅ Analytics provide actionable insights for administrators

### Performance Requirements
- ✅ Leaderboard loads in under 2 seconds for 500+ students
- ✅ Point award actions complete in under 1 second
- ✅ Analytics dashboard loads in under 3 seconds
- ✅ Bulk operations process without blocking UI

### Security Requirements
- ✅ All ranking data restricted by organization
- ✅ Point transactions require admin authentication
- ✅ Achievement awards logged with full audit trail
- ✅ No unauthorized access to student ranking data

This Student Ranking feature will enhance the Harry School CRM admin panel with powerful motivation tools while maintaining focus on administrative efficiency and student engagement tracking.