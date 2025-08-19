# Harry School CRM - Student Referral System PRD

## Executive Summary

This PRD defines a Student Referral System that integrates seamlessly into the existing Student Ranking infrastructure. Students earn points and bonuses for successfully referring new students to Harry School, with referral tracking embedded within existing student profiles and ranking calculations.

## 🎯 Integrated Referral Philosophy

### Ranking System Integration
- **Referral Points**: Extend existing student point system with referral rewards
- **Referral Achievements**: Add referral badges to existing achievement system
- **Leaderboard Integration**: Include referral statistics in existing student rankings
- **Goal Setting**: Referral targets within existing student goal system

### Seamless User Experience
- **Profile Integration**: Referral tracking within existing student profiles
- **Natural Discovery**: Referral options embedded in existing student interfaces
- **Progressive Rewards**: Referral bonuses through existing point and coin systems
- **Social Recognition**: Referral achievements through existing badge system

## 📊 Database Schema Integration

### Extend Existing Student Ranking Tables
```sql
-- Add referral tracking to existing user_rankings table
ALTER TABLE user_rankings ADD COLUMN total_referrals INTEGER DEFAULT 0;
ALTER TABLE user_rankings ADD COLUMN successful_referrals INTEGER DEFAULT 0;
ALTER TABLE user_rankings ADD COLUMN referral_points_earned INTEGER DEFAULT 0;
ALTER TABLE user_rankings ADD COLUMN top_referrer_badge BOOLEAN DEFAULT false;

-- Extend existing points_transactions for referral rewards
-- (use existing category field with 'referral' category)

-- Main referral tracking table
CREATE TABLE student_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Referrer information
    referrer_student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    referrer_name VARCHAR(200), -- Cache for display
    
    -- Referred prospect information
    referred_name VARCHAR(200) NOT NULL,
    referred_phone VARCHAR(20) NOT NULL,
    referred_email VARCHAR(100),
    
    -- Referral context
    referral_source VARCHAR(50), -- 'word_of_mouth', 'social_media', 'family_friend', 'other'
    referral_method VARCHAR(50), -- 'direct_contact', 'referral_link', 'event_invitation'
    notes TEXT, -- Additional context from referrer
    
    -- Conversion tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'enrolled', 'declined', 'expired')),
    contact_date DATE,
    enrollment_date DATE,
    decline_reason VARCHAR(200),
    
    -- Reward tracking
    points_awarded INTEGER DEFAULT 0,
    coins_awarded INTEGER DEFAULT 0,
    bonus_applied BOOLEAN DEFAULT false,
    reward_tier VARCHAR(20) DEFAULT 'standard', -- 'standard', 'premium', 'platinum'
    
    -- Administrative tracking
    contacted_by UUID REFERENCES profiles(id), -- Admin who contacted the referral
    enrolled_as_student_id UUID REFERENCES students(id), -- If converted to student
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id)
);

-- Referral campaigns and bonus structures
CREATE TABLE referral_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Campaign details
    campaign_name VARCHAR(100) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(30), -- 'ongoing', 'limited_time', 'seasonal', 'milestone'
    
    -- Reward structure
    base_points_reward INTEGER DEFAULT 50,
    base_coins_reward INTEGER DEFAULT 25,
    bonus_multiplier DECIMAL(3,2) DEFAULT 1.00,
    
    -- Tier-based rewards
    tier_1_threshold INTEGER DEFAULT 1, -- Number of referrals for tier 1
    tier_1_bonus INTEGER DEFAULT 0,
    tier_2_threshold INTEGER DEFAULT 3,
    tier_2_bonus INTEGER DEFAULT 50,
    tier_3_threshold INTEGER DEFAULT 5,
    tier_3_bonus INTEGER DEFAULT 100,
    
    -- Campaign period
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Administrative
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id)
);

-- Referral achievements (extend existing achievements)
-- Use existing achievements table with new achievement_type = 'referral'
INSERT INTO achievements (organization_id, name, description, achievement_type, points_reward, coins_reward) VALUES
(organization_uuid, 'First Referral', 'Successfully referred your first student to Harry School', 'referral', 25, 10),
(organization_uuid, 'Referral Ambassador', 'Successfully referred 3 students', 'referral', 75, 50),
(organization_uuid, 'Referral Champion', 'Successfully referred 5 students', 'referral', 150, 100),
(organization_uuid, 'Referral Legend', 'Successfully referred 10 students', 'referral', 300, 200);
```

## 🎨 Integrated UI Architecture

### 1. Student Profile Referral Integration
**Add "Referrals" section to existing Student profile "Ranking" tab:**
```typescript
interface StudentReferralProfileView {
  referralSummary: {
    totalReferrals: number
    successfulReferrals: number
    pendingReferrals: number
    conversionRate: number
    totalPointsEarned: number
    currentTier: string
  }
  recentReferrals: StudentReferral[]
  referralAchievements: Achievement[]
  nextMilestone: {
    referralsNeeded: number
    rewardPoints: number
    achievementName: string
  }
}
```

### 2. Student Rankings Integration
**Extend existing student leaderboard with referral metrics:**
- **Referral Champion Leaderboard**: Top referrers with conversion rates
- **Monthly Referral Leaders**: Recent referral activity integration
- **Referral Achievement Badges**: Display referral achievements in existing badge system
- **Points Integration**: Include referral points in existing point calculations

### 3. Admin Referral Management (Within Existing Student Management)
**Add referral tracking to existing Students section:**
```typescript
interface AdminReferralManagementView {
  pendingReferrals: {
    referralId: string
    referrerName: string
    referredName: string
    referredPhone: string
    daysOld: number
    priority: 'high' | 'normal' | 'low'
  }[]
  conversionTracking: {
    contactedReferrals: number
    enrolledStudents: number
    conversionRate: number
    averageConversionTime: number
  }
  referralCampaigns: ReferralCampaign[]
  topReferrers: StudentReferralSummary[]
}
```

## 🔧 Seamless UI Components

### 1. Referral Submission Widget (Embedded in Student Profiles)
```typescript
interface ReferralSubmissionWidgetProps {
  studentId: string
  currentCampaign?: ReferralCampaign
  onSubmit: (referral: ReferralSubmission) => void
  showRewards?: boolean
  compactMode?: boolean
}
```

### 2. Referral Progress Tracker (Ranking Integration)
```typescript
interface ReferralProgressTrackerProps {
  studentReferrals: StudentReferralSummary
  nextAchievement: Achievement
  currentTier: ReferralTier
  showPointsEarned?: boolean
}
```

### 3. Referral Impact Indicator (Points Integration)
```typescript
interface ReferralImpactIndicatorProps {
  referralPoints: number
  rankingImpact: number
  nextMilestone: ReferralMilestone
  achievementProgress: number
}
```

### 4. Admin Referral Quick Actions (Student Management Integration)
```typescript
interface AdminReferralActionsProps {
  pendingReferrals: PendingReferral[]
  onContactReferral: (referralId: string) => void
  onMarkEnrolled: (referralId: string, studentId: string) => void
  onDeclineReferral: (referralId: string, reason: string) => void
}
```

## 🎯 Referral Reward Structure

### Integrated Point System
```typescript
interface ReferralRewardStructure {
  baseRewards: {
    referralSubmission: 10 // Points for submitting a referral
    referralContacted: 25  // Points when referral is contacted
    referralEnrolled: 100  // Points when referral enrolls
  }
  
  tierBonuses: {
    tier1: { threshold: 1, bonus: 0, title: 'New Referrer' }
    tier2: { threshold: 3, bonus: 50, title: 'Referral Ambassador' }
    tier3: { threshold: 5, bonus: 150, title: 'Referral Champion' }
    tier4: { threshold: 10, bonus: 300, title: 'Referral Legend' }
  }
  
  campaignMultipliers: {
    backToSchool: 1.5 // 50% bonus during campaign
    summerSpecial: 2.0 // 100% bonus during summer campaign
    friendlyCompetition: 1.25 // 25% bonus during competition
  }
}
```

### Achievement Integration
**Extend existing achievement system with referral badges:**
- **First Referral** - Submit your first referral (+25 points, +10 coins)
- **Referral Contact** - Your referral was successfully contacted (+15 points)
- **Successful Conversion** - Your referral enrolled as a student (+100 points, +50 coins)
- **Referral Ambassador** - 3 successful referrals (+75 points, achievement badge)
- **Referral Champion** - 5 successful referrals (+150 points, special badge)
- **Monthly Top Referrer** - Most referrals in a month (bonus achievement)

## 🔄 Workflow Integration

### Student Experience (Within Existing Ranking System)
1. **Referral Discovery**: Referral option within existing student profile ranking tab
2. **Easy Submission**: Quick referral form integrated into existing interface
3. **Progress Tracking**: Referral progress within existing goal and achievement tracking
4. **Reward Recognition**: Referral points and achievements within existing ranking system

### Admin Experience (Within Existing Student Management)
1. **Referral Queue**: Pending referrals within existing student management workflow
2. **Contact Tracking**: Mark referrals as contacted within existing communication tracking
3. **Enrollment Process**: Convert referral to student within existing enrollment workflow
4. **Performance Analytics**: Referral success rates within existing performance dashboards

### Referral Conversion Process
1. **Student Submits Referral**: Through existing student profile interface
2. **Admin Notification**: Alert within existing notification system
3. **Contact Management**: Track outreach within existing communication workflow
4. **Enrollment Tracking**: Convert to student within existing enrollment process
5. **Reward Distribution**: Automatic points/achievements through existing ranking system

## 📈 Ranking System Integration

### Student Ranking Impact
```typescript
interface ReferralRankingImpact {
  referralPoints: number // Direct points from referrals
  referralAchievements: Achievement[] // Referral-specific achievements
  referralTier: string // Current referral tier status
  monthlyReferralBonus: number // Additional monthly rewards
  leaderboardPosition: number // Position in referral leaderboard
}
```

### Leaderboard Integration
**Extend existing student rankings with referral metrics:**
- **Overall Rankings**: Include referral points in total point calculations
- **Referral Leaderboard**: Dedicated view within existing rankings section
- **Monthly Champions**: Top referrers with special recognition
- **Conversion Leaders**: Students with highest referral-to-enrollment rates

## 📊 Analytics Integration

### Existing Dashboard Extensions
**Add referral metrics to existing student analytics:**
- **Referral Volume**: Number of referrals submitted over time
- **Conversion Rates**: Successful referral-to-enrollment percentages
- **Top Referrers**: Students generating most successful referrals
- **Campaign Performance**: Effectiveness of different referral campaigns
- **Revenue Impact**: Financial value generated through student referrals

### Reporting Integration
- **Monthly Referral Reports**: Include in existing student performance reports
- **Individual Referral Tracking**: Referral sections in existing student evaluations
- **Organizational Growth**: Referral contribution to existing enrollment analytics
- **ROI Analysis**: Referral program cost-effectiveness within existing budget reports

## 🔐 Privacy & Data Protection

### Existing Security Extension
- **RLS Policies**: Extend existing organization-based policies for referral data
- **Student Privacy**: Protect referrer identity if requested
- **Contact Information**: Secure handling of referred prospect data
- **GDPR Compliance**: Proper consent and data handling for referred contacts

### Data Management
- **Contact Retention**: Appropriate data retention for unconverted referrals
- **Opt-out Handling**: Process for referred prospects to decline contact
- **Data Anonymization**: Anonymize declined referrals after retention period
- **Access Controls**: Limit referral data access to authorized administrators

## 🚀 Implementation Phases

### Phase 1: Core Referral System (Week 1)
- Extend existing ranking database schema with referral tracking
- Integrate referral points into existing point calculation system
- Add basic referral submission to existing student profiles

### Phase 2: Referral Management (Week 2)
- Add referral tracking to existing admin student management interface
- Implement referral conversion workflow within existing enrollment process
- Extend existing notification system with referral alerts

### Phase 3: Advanced Features (Week 3)
- Add referral leaderboard to existing rankings section
- Implement referral campaigns and tier-based rewards
- Extend existing analytics dashboard with referral metrics

### Phase 4: Optimization & Polish (Week 4)
- Optimize referral queries within existing performance optimization
- Complete testing within existing test suites
- Documentation updates for integrated referral functionality

## 📋 Success Criteria

### Seamless Integration
- ✅ Referral system feels native within existing student ranking functionality
- ✅ No disruption to existing student profile and ranking workflows
- ✅ Referral tracking enhances existing performance and analytics systems
- ✅ Students discover referral opportunities organically within existing interface

### Performance Integration
- ✅ Referral data loads seamlessly within existing student profile performance
- ✅ Referral analytics enhance existing dashboard without complexity
- ✅ Referral submission feels effortless within existing student workflows
- ✅ Referral management integrates naturally with existing admin tasks

### Business Value
- ✅ Increased student enrollment through existing student network engagement
- ✅ Enhanced student loyalty through existing reward and recognition systems
- ✅ Reduced marketing costs through organic word-of-mouth promotion
- ✅ Improved student engagement through existing gamification and achievement systems

### Measurable Outcomes
- ✅ 20% increase in student referral submissions within 3 months
- ✅ 15% improvement in referral-to-enrollment conversion rates
- ✅ 25% of new student enrollments coming from referral program
- ✅ High student satisfaction with referral reward integration

This integrated approach ensures the referral system becomes a natural extension of existing student engagement rather than a separate program requiring additional complexity.