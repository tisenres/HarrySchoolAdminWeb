# Harry School Student App - Navigation Wireframes

## Overview
These wireframes illustrate the optimal navigation patterns and information architecture for the Harry School Student app, designed specifically for students aged 10-18 with multilingual support (English/Russian/Uzbek).

## Primary Navigation: Bottom Tab Bar

```
┌────────────────────────────────────────────────────────┐
│                    Status Bar                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│                  Main Content Area                     │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
├────────────────────────────────────────────────────────┤
│  🏠      📚       📅        🔤        👤              │
│ Home   Lessons  Schedule  Vocabulary  Profile         │
│ ●        ○        ○         ○         ○               │
└────────────────────────────────────────────────────────┘
```

### Tab Bar Specifications:
- **Height**: 83pt (includes safe area)
- **Icon Size**: 24pt × 24pt
- **Touch Target**: 64pt × 64pt
- **Label Font**: 10pt, Medium weight
- **Active State**: Primary color (#1d7452) with filled icon
- **Inactive State**: Gray (60% opacity) with outline icon

## Tab 1: Home Dashboard

```
┌────────────────────────────────────────────────────────┐
│  👋 Good morning, Alex!        🔔 2    ⚙️             │
├────────────────────────────────────────────────────────┤
│ ┌─ Daily Streak ─────────────────────────────────────┐ │
│ │  🔥 7 Day Streak!    📊 This Week: 5/7 days       │ │
│ │  ▓▓▓▓▓▓▓░░░  Progress: 75%                        │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌─ Continue Learning ────────────────────────────────┐ │
│ │ 📖 English Grammar                    ⏱️ 15 min   │ │
│ │ Unit 3: Present Perfect Tense                      │ │
│ │ ▓▓▓▓▓░░░ 5/8 questions               📱 Continue  │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌─ Today's Schedule ─────────────────────────────────┐ │
│ │ 📅 Mathematics        10:00 - 11:30               │ │
│ │ 📅 Science           14:00 - 15:30               │ │
│ │ 📅 Homework Due      🔴 English Essay             │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌─ Recent Achievements ──────────────────────────────┐ │
│ │ 🏆 Grammar Master     🎯 Perfect Score             │ │
│ │ 📈 Week Warrior       ⭐ Vocab Expert             │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ 💡 Quick Actions                                       │
│ [📝 Start Practice] [📖 Browse Lessons] [📊 Progress] │
└────────────────────────────────────────────────────────┘
```

### Home Tab Features:
- **Personalized Greeting**: Time-based welcome message
- **Streak Tracking**: Visual progress with fire emoji motivation
- **Continue Learning**: Largest card, prominent "Continue" button
- **Schedule Preview**: Today's classes and urgent tasks
- **Achievement Showcase**: Recent accomplishments
- **Quick Actions**: Direct access to common tasks

## Tab 2: Lessons (Learning Hub)

```
┌────────────────────────────────────────────────────────┐
│ 🔍 Search lessons, topics, skills...                  │
├────────────────────────────────────────────────────────┤
│ ┌─ Recommended for You ──────────────────────────────┐ │
│ │ 📚 Continue English    🧮 Math Review               │ │
│ │ 🔬 Science Lab        📜 History Quiz              │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ 📋 Subjects                                            │
│ ┌─────────────┬─────────────┬─────────────┐           │
│ │ 📖 English  │ 🧮 Math     │ 🔬 Science   │           │
│ │ 15 lessons  │ 12 lessons  │ 8 lessons   │           │
│ │ ▓▓▓░░ 60%   │ ▓▓▓▓░ 80%   │ ▓▓░░░ 40%   │           │
│ └─────────────┴─────────────┴─────────────┘           │
│ ┌─────────────┬─────────────┬─────────────┐           │
│ │ 🌍 Geography│ 📜 History  │ 🎨 Art      │           │
│ │ 6 lessons   │ 10 lessons  │ 4 lessons   │           │
│ │ ▓▓▓▓▓ 100%  │ ▓▓▓░░ 30%   │ ▓░░░░ 20%   │           │
│ └─────────────┴─────────────┴─────────────┘           │
│                                                        │
│ 📈 Learning Path                                       │
│ ┌────────────────────────────────────────────────────┐ │
│ │ English Fundamentals → Grammar → Advanced Writing   │ │
│ │ ✅ Basics      ✅ Present   🔄 Perfect    ⏸️ Future │ │
│ │              Tense        Tense         Tense      │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ 🎯 Practice Zone                                       │
│ [🔤 Vocabulary] [🗣️ Speaking] [👂 Listening] [✍️ Writing]│
└────────────────────────────────────────────────────────┘
```

### Lessons Tab Features:
- **Search Function**: Prominent search bar for content discovery
- **AI Recommendations**: Personalized lesson suggestions
- **Subject Grid**: Visual progress indicators for each subject
- **Learning Paths**: Sequential progression with clear milestones
- **Practice Modes**: Different skill-based practice options

## Tab 3: Schedule (Time Management)

```
┌────────────────────────────────────────────────────────┐
│ 📅 Today, March 15          ← Week View →   📊 Stats  │
├────────────────────────────────────────────────────────┤
│ ┌─ Current Class ────────────────────────────────────┐ │
│ │ 🔴 LIVE: Mathematics                10:00 - 11:30  │ │
│ │ Room 205 • Teacher: Mrs. Johnson                   │ │
│ │ 📚 Today: Algebra Equations        [📱 Join Class] │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ⏰ Upcoming Today                                      │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 11:45  🍽️ Lunch Break                              │ │
│ │ 14:00  🔬 Science Lab                              │ │
│ │        Room 301 • Lab Safety Review               │ │
│ │ 15:30  📝 Study Period                             │ │
│ │        Library • Self-directed learning           │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ 📋 Assignments Due                                     │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 🔴 Today     English Essay - "Climate Change"      │ │
│ │              📝 Draft complete ✅ • Submit by 5PM  │ │
│ │ 🟡 Tomorrow  Math Homework - Chapter 5             │ │
│ │              📊 3/10 problems done • 7 remaining   │ │
│ │ 🟢 Next Week Biology Report - Cell Structure       │ │
│ │              📖 Research phase • Due March 22      │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ 📊 Attendance                                          │
│ This Week: 18/20 classes ▓▓▓▓▓▓▓▓▓░ 90%              │
│ [📅 View Calendar] [📈 Attendance History]             │
└────────────────────────────────────────────────────────┘
```

### Schedule Tab Features:
- **Current Status**: Live class indicator with join button
- **Timeline View**: Chronological list of day's events
- **Assignment Tracking**: Color-coded urgency with progress
- **Attendance Overview**: Visual progress tracking
- **Calendar Integration**: Week view and historical data

## Tab 4: Vocabulary (Language Learning)

```
┌────────────────────────────────────────────────────────┐
│ 🔤 Vocabulary Builder                    ⚙️ Settings   │
├────────────────────────────────────────────────────────┤
│ ┌─ Daily Practice ───────────────────────────────────┐ │
│ │ 🎯 Today's Goal: 10 new words                      │ │
│ │ ▓▓▓▓▓▓▓░░░ 7/10 completed         🔥 3 day streak │ │
│ │ [📱 Continue Practice]                             │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ 🎮 Practice Modes                                      │
│ ┌─────────────┬─────────────┬─────────────┐           │
│ │ 🃏 Flashcards│ 🎯 Quiz     │ 🗣️ Speaking  │           │
│ │ Learn new   │ Test your   │ Practice    │           │
│ │ words       │ knowledge   │ pronunciation│           │
│ └─────────────┴─────────────┴─────────────┘           │
│ ┌─────────────┬─────────────┬─────────────┐           │
│ │ 👂 Listening │ ✍️ Writing   │ 🔄 Review   │           │
│ │ Audio       │ Spelling    │ Difficult   │           │
│ │ recognition │ practice    │ words       │           │
│ └─────────────┴─────────────┴─────────────┘           │
│                                                        │
│ 📚 Word Collections                                    │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 📖 Academic Words        127 words    📊 78% mastery│ │
│ │ 🔬 Science Terms         45 words     📊 65% mastery│ │
│ │ 🏠 Daily Life           89 words     📊 92% mastery│ │
│ │ 🎨 Art & Culture        34 words     📊 45% mastery│ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ 🔧 Tools                                               │
│ [🔍 Dictionary] [📸 Photo Translator] [🎙️ Voice Search] │
└────────────────────────────────────────────────────────┘
```

### Vocabulary Tab Features:
- **Daily Goals**: Clear targets with progress tracking
- **Practice Variety**: Multiple learning modes for different skills
- **Word Collections**: Organized by topic with mastery percentages
- **Learning Tools**: Dictionary, translator, and voice features
- **Progress Visualization**: Detailed mastery tracking

## Tab 5: Profile (Personal Progress)

```
┌────────────────────────────────────────────────────────┐
│ 👤 Alex Thompson                         ⚙️ Settings   │
├────────────────────────────────────────────────────────┤
│ ┌─ Current Ranking ──────────────────────────────────┐ │
│ │ 🏆 Rank #12 in Class 9A                           │ │
│ │ 📊 2,847 points    💰 156 coins                    │ │
│ │ 📈 +127 points this week                          │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ 🎯 Achievements                                        │
│ ┌─────────────┬─────────────┬─────────────┐           │
│ │ 🏆 Scholar   │ 🔥 Streak    │ 💯 Perfectionist│        │
│ │ ✅ Earned    │ ✅ Earned    │ 🔄 In Progress │        │
│ │ Master 5     │ 7 day       │ Get 100% on  │        │
│ │ subjects     │ streak      │ 10 tests     │        │
│ └─────────────┴─────────────┴─────────────┘           │
│ ┌─────────────┬─────────────┬─────────────┐           │
│ │ 📚 Reader    │ 🗣️ Speaker   │ 🤝 Helper    │           │
│ │ ⏳ 67%       │ ⏳ 23%       │ 🔒 Locked    │           │
│ │ Read 50      │ Record 25   │ Help 10      │           │
│ │ articles     │ words       │ classmates   │           │
│ └─────────────┴─────────────┴─────────────┘           │
│                                                        │
│ 🎁 Rewards Store                                       │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 🎧 Headphones (200 coins)    ⭐ Avatar (50 coins)  │ │
│ │ 📚 E-book (150 coins)        🎨 Theme (30 coins)   │ │
│ │ 🍕 Lunch Credit (100 coins)  💫 Badge (20 coins)   │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ 📊 Statistics                                          │
│ This Month: 45 hours studied • 234 lessons completed  │
│ [📈 Detailed Stats] [📅 Study Calendar] [👥 Leaderboard]│
└────────────────────────────────────────────────────────┘
```

### Profile Tab Features:
- **Ranking Display**: Clear position and point totals
- **Achievement Grid**: Visual progress with completion states
- **Rewards System**: Coin-based store with real rewards
- **Statistics Overview**: Study time and completion metrics
- **Social Elements**: Class leaderboard access

## Navigation Interaction Patterns

### Swipe Gestures
```
┌─ Lesson Card Navigation ─────────────────────────────┐
│                                                      │
│  ◄── Swipe Left: Previous    Swipe Right: Next ──►  │
│                                                      │
│      [Lesson Content Card - Swipeable]              │
│                                                      │
│           ● ○ ○ ○   (Progress Dots)                  │
└──────────────────────────────────────────────────────┘
```

### Floating Action Button (Context-Aware)
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                    Main Content                       │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                                        │
│                                              ┌───┐     │
│                                              │ + │     │
│                                              └───┘     │
├────────────────────────────────────────────────────────┤
│                    Tab Bar                             │
└────────────────────────────────────────────────────────┘
```

**Context-Aware FAB Actions:**
- **Home Tab**: Quick start new lesson
- **Lessons Tab**: Add lesson to favorites
- **Schedule Tab**: Add assignment reminder
- **Vocabulary Tab**: Add new word
- **Profile Tab**: Share achievement

### Pull-to-Refresh Pattern
```
┌────────────────────────────────────────────────────────┐
│                    ↓ ↓ ↓                               │
│                  🔄 Loading...                         │
│                                                        │
│  ┌─ Refreshed Content ────────────────────────────────┐ │
│  │                                                    │ │
│  │  Updated data appears here after refresh          │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

## Error States & Empty States

### Network Error
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                      📡 ❌                             │
│                                                        │
│               No Internet Connection                   │
│                                                        │
│        Some content may not be up to date.           │
│         Check your connection and try again.          │
│                                                        │
│                 [🔄 Try Again]                         │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Empty Lessons State
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                      📚 ✨                             │
│                                                        │
│               Ready to Start Learning?                │
│                                                        │
│         Choose your first subject to begin            │
│            your learning journey!                     │
│                                                        │
│                [🚀 Browse Subjects]                    │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Loading States

### Skeleton Screen (Lessons Loading)
```
┌────────────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓              │
├────────────────────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓      ▓▓▓▓▓▓▓▓▓      ▓▓▓▓▓▓▓▓▓           │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓      ▓▓▓▓▓▓▓▓▓      ▓▓▓▓▓▓▓▓▓           │
│ ▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓        ▓▓▓▓▓▓             │
│                                                        │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓      ▓▓▓▓▓▓▓▓▓      ▓▓▓▓▓▓▓▓▓           │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓      ▓▓▓▓▓▓▓▓▓      ▓▓▓▓▓▓▓▓▓           │
│ ▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓        ▓▓▓▓▓▓             │
│                                                        │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │
└────────────────────────────────────────────────────────┘
```

## Accessibility Features

### Voice Navigation Overlay
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│     🎤 Voice Control Active                           │
│                                                        │
│  Say: "Go to lessons" or "Start practice"             │
│  Say: "Help" for more commands                        │
│                                                        │
│                [🔇 Disable Voice]                      │
│                                                        │
│                    Main Content                       │
│                   (Dimmed 50%)                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### High Contrast Mode
```
┌────────────────────────────────────────────────────────┐
│ ████████████████████████████████████████████████████   │
│ ██                                                ██   │
│ ██  HIGH CONTRAST: Content with maximum          ██   │
│ ██  contrast ratios for better visibility        ██   │
│ ██                                                ██   │
│ ██  [████████ WHITE BUTTON ████████]             ██   │
│ ██                                                ██   │
│ ████████████████████████████████████████████████████   │
└────────────────────────────────────────────────────────┘
```

These wireframes provide the foundation for implementing a student-centered navigation system that prioritizes learning efficiency, accessibility, and engagement while accommodating the diverse needs of students aged 10-18 in multilingual educational contexts.