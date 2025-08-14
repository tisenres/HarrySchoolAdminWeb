# Harry School CRM - Unified Ranking System (Students + Teachers) PRD

## Executive Summary

This PRD extends the existing Student Ranking System to include Teacher Performance Ranking within the same unified architecture. Teachers will be evaluated using similar points, efficiency, and quality metrics, with their performance directly impacting salary and bonus calculations. All functionality will be integrated into the existing "Rankings" section and current database architecture.

## 🎯 Unified Ranking System Overview

### Shared Architecture Benefits
- **Unified Rankings Section** - Single navigation section for both student and teacher rankings
- **Consistent UI Components** - Reuse existing ranking cards, tables, and interfaces
- **Shared Database Tables** - Extend existing ranking tables to support both students and teachers
- **Common Analytics** - Integrated dashboard showing both student and teacher performance
- **Unified Workflows** - Same point award, achievement, and goal-setting processes

### Teacher-Specific Extensions
- **Performance Evaluation** - Formal assessment criteria and weighted scoring
- **Compensation Integration** - Salary and bonus calculations based on performance
- **Professional Goals** - Career development and improvement targets
- **Administrative Oversight** - Approval workflows for performance-based adjustments

## 📊 Database Schema Extensions (Existing Tables)

### Extend Existing student_rankings Table
```sql
-- Add user_type to differentiate students and teachers
ALTER TABLE student_rankings ADD COLUMN user_type VARCHAR(10) DEFAULT 'student' CHECK (user_type IN ('student', 'teacher'));
ALTER TABLE student_rankings ADD COLUMN efficiency_percentage DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE student_rankings ADD COLUMN quality_score DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE student_rankings ADD COLUMN performance_tier VARCHAR(20) DEFAULT 'standard';

-- Rename table to be more generic
ALTER TABLE student_rankings RENAME TO user_rankings;

-- Update indexes for both students and teachers
CREATE INDEX idx_user_rankings_type_org ON user_rankings(user_type, organization_id, total_points DESC);
```

### Extend Existing points_transactions Table
```sql
-- Extend existing table to support teacher transactions
ALTER TABLE points_transactions ADD COLUMN user_type VARCHAR(10) DEFAULT 'student' CHECK (user_type IN ('student', 'teacher'));
ALTER TABLE points_transactions ADD COLUMN efficiency_impact DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE points_transactions ADD COLUMN quality_impact DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE points_transactions ADD COLUMN affects_salary BOOLEAN DEFAULT false;
ALTER TABLE points_transactions ADD COLUMN monetary_impact DECIMAL(10,2);

-- Rename student_id to user_id for generic usage
ALTER TABLE points_transactions RENAME COLUMN student_id TO user_id;
```

### Extend Existing achievements Table
```sql
-- Add teacher-specific achievement types
ALTER TABLE achievements ADD COLUMN target_user_type VARCHAR(10) DEFAULT 'both' CHECK (target_user_type IN ('student', 'teacher', 'both'));
ALTER TABLE achievements ADD COLUMN professional_development BOOLEAN DEFAULT false;
```

### Extend Existing student_goals Table
```sql
-- Make goals table generic for both students and teachers
ALTER TABLE student_goals RENAME TO user_goals;
ALTER TABLE user_goals RENAME COLUMN student_id TO user_id;
ALTER TABLE user_goals ADD COLUMN user_type VARCHAR(10) DEFAULT 'student' CHECK (user_type IN ('student', 'teacher'));
ALTER TABLE user_goals ADD COLUMN affects_compensation BOOLEAN DEFAULT false;
```

### New Teacher-Specific Tables (Minimal)
```sql
-- Teacher evaluation criteria (reuses existing achievement structure)
CREATE TABLE evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    criteria_name VARCHAR(100) NOT NULL,
    description TEXT,
    weight_percentage DECIMAL(5,2) DEFAULT 0.00,
    max_points INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id)
);

-- Teacher compensation tracking (extends existing structure)
CREATE TABLE compensation_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(30),
    amount DECIMAL(10,2) NOT NULL,
    performance_score DECIMAL(5,2),
    approved_by UUID REFERENCES profiles(id),
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id)
);
```

## 🎨 Extended UI Architecture (Existing Components)

### 1. Enhanced Rankings Navigation (Single Section)
**Extend existing "Rankings" section with tabs:**
- **Student Rankings** - Existing student leaderboard functionality
- **Teacher Rankings** - New teacher performance leaderboard  
- **Combined Analytics** - Unified dashboard with both student and teacher metrics
- **Point Management** - Extended to handle both student and teacher point awards
- **Achievement System** - Extended for both student and teacher achievements

### 2. Unified Ranking Components (Extend Existing)
```typescript
// Extend existing StudentRankingCard
interface UnifiedRankingCardProps {
  user: Student | Teacher
  userType: 'student' | 'teacher'
  ranking: UserRanking
  showTeacherMetrics?: boolean // efficiency, quality, compensation
}

// Extend existing leaderboard
interface UnifiedLeaderboardProps {
  userType: 'student' | 'teacher' | 'combined'
  sortBy: 'points' | 'level' | 'efficiency' | 'quality'
  showCompensationImpact?: boolean
}
```

### 3. Extended Profile Integration
**Student Profiles (Existing):**
- Keep existing ranking tab unchanged
- Add "Feedback Given" section for teacher feedback

**Teacher Profiles (New):**
- **Performance Tab** - Reuse existing student ranking tab structure
- Show points, efficiency percentage, quality score, rank
- Teacher-specific achievements and goals
- Compensation impact summary

### 4. Unified Point Management (Extend Existing)
**Enhanced Point Award Interface:**
- User type selector (Student/Teacher)
- Preset reasons for both students and teachers
- Teacher-specific categories (Professional Development, Teaching Quality, Administrative Tasks)
- Compensation impact calculator for teacher points
- Bulk operations for both user types

## 🔧 Implementation Strategy (Minimal Changes)

### Phase 1: Database Extensions (Week 1)
- Extend existing ranking tables with teacher support
- Add user_type fields and teacher-specific metrics
- Create minimal teacher-specific tables (evaluation criteria, compensation)
- Update existing triggers and calculations

### Phase 2: UI Component Extensions (Week 2)  
- Add userType parameter to existing ranking components
- Extend existing leaderboard to show teacher rankings
- Add teacher tab to existing Rankings navigation
- Extend point management interface for teachers

### Phase 3: Teacher Profile Integration (Week 3)
- Add performance tab to existing teacher profiles
- Implement teacher evaluation interface
- Add compensation calculation to existing point system
- Extend existing analytics dashboard

### Phase 4: Integration & Testing (Week 4)
- Test unified system with both students and teachers
- Validate compensation calculations
- Performance optimization for combined datasets
- Documentation updates

## 🎯 Unified User Experience

### Shared Workflows
1. **Point Awards** - Same interface for both students and teachers with type-specific reasons
2. **Achievement System** - Extended categories for professional achievements
3. **Goal Setting** - Same interface with teacher-specific professional development goals
4. **Analytics** - Combined dashboard showing organizational performance

### Teacher-Specific Features
1. **Performance Evaluation** - Formal assessment using existing achievement structure
2. **Compensation Calculation** - Automatic salary/bonus calculation based on points and performance
3. **Professional Development** - Career goals using existing goal system
4. **Administrative Approval** - Enhanced workflow for compensation adjustments

## 📈 Unified Analytics Dashboard

### Combined Metrics
- **Total Points Awarded** - Students and teachers combined
- **Top Performers** - Mixed leaderboard showing both students and teachers
- **Achievement Distribution** - Both academic and professional achievements
- **Engagement Trends** - Participation across both user types

### Teacher-Specific Analytics
- **Performance Distribution** - Teacher efficiency and quality scores
- **Compensation Impact** - Budget analysis for performance-based adjustments
- **Professional Development** - Goal completion and career progress
- **Correlation Analysis** - Teacher performance vs student outcomes

## 🔐 Security & Permissions (Extended)

### Role-Based Access (Enhanced)
- **Superadmin**: Full access to student and teacher rankings, compensation management
- **Admin**: Student rankings + teacher evaluation + bonus recommendations
- **Teacher**: Personal performance view + student ranking management for their classes
- **Student**: Personal ranking view only (future external app)

### Data Protection
- **Compensation Data**: Enhanced encryption for salary information
- **Performance Evaluation**: Sensitive teacher data with audit trails
- **Cross-User Privacy**: Students cannot see teacher compensation, teachers cannot see other teachers' salary data

## 📋 Success Criteria

### Technical Integration
- ✅ Single codebase supporting both student and teacher rankings
- ✅ Unified UI components with minimal duplication
- ✅ Shared database architecture with type-specific extensions
- ✅ Performance optimization for combined datasets

### Business Impact  
- ✅ Transparent teacher performance evaluation with fair compensation
- ✅ Unified ranking system reducing administrative complexity
- ✅ Consistent user experience across student and teacher management
- ✅ Data-driven insights for organizational improvement

This unified approach will extend the existing Student Ranking system to include comprehensive Teacher Performance Management while maintaining architectural consistency and minimizing code duplication.