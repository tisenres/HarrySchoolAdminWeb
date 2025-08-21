# Harry School Mobile UI - Visual Component Examples

## Component Visual Previews

This document provides ASCII-style visual representations of how each component should appear with the specified design tokens.

---

## 1. Button Component

### Primary Button - Medium Size
```
┌─────────────────────────────────┐
│         🔵 Continue             │  ← bg: #1d7452, text: #ffffff
│                                 │    height: 44pt, padding: 12px 16px
└─────────────────────────────────┘    font: 14px Inter-SemiBold
     ^ shadow: 0px 2px 4px rgba(16,24,40,0.06)
```

### Secondary Button - Large Size  
```
┌─────────────────────────────────┐
│         📱 Add Student          │  ← border: 2px #1d7452, text: #1d7452
│                                 │    height: 52pt, bg: transparent
└─────────────────────────────────┘    font: 16px Inter-SemiBold
```

### Bulk Action Button (Teacher)
```
┌─────────────────────────────────┐
│    ☑️ Mark Present    [5]       │  ← bg: #2563eb, badge: white bg
│                                 │    shows selection count
└─────────────────────────────────┘
```

### Celebration Button (Student - after achievement)
```
┌─────────────────────────────────┐
│      🎉 Well Done! ✨           │  ← animated confetti burst
│                                 │    bounce animation: scale 1→1.2→1
└─────────────────────────────────┘
```

---

## 2. Card Component

### Default Card
```
╭─────────────────────────────────╮  ← borderRadius: 12px
│  Student Profile                │    bg: #ffffff
│  ───────────────                │    shadow: 0px 4px 8px rgba(16,24,40,0.08)
│                                 │    padding: 16px
│  Name: Sarah Johnson            │
│  Grade: 5th                     │
│  Status: ✅ Active              │
│                                 │
╰─────────────────────────────────╯
```

### Visual Card (Student-specific)
```
╭─────────────────────────────────╮  ← borderRadius: 16px
│ 🌟                              │    border: 2px #1d7452
│   VOCABULARY MASTER             │    gradient bg: #f0f9f4→#ffffff
│   ─────────────────             │    shadow: 0px 6px 12px rgba(29,116,82,0.1)
│                                 │
│   📚 Words Learned: 247         │
│   🎯 Streak: 12 days            │
│   🏆 Level: Intermediate        │
│                                 │
╰─────────────────────────────────╯
```

### Data Card (Teacher-specific)
```
╭─────────────────────────────────╮  ← borderRadius: 8px
│ Class 5A - Mathematics        🟢│    border: 1px #d0d5dd
│ ─────────────────────────────── │    sync indicator (top-right)
│                                 │
│ Students: 24                    │
│ Present: 22  Absent: 2          │
│ Completed HW: 18/24             │
│                                 │
│ [📝 Take Attendance] [📊 View]   │
╰─────────────────────────────────╯
```

---

## 3. Input Component

### Default Input - Focused State
```
┌─────────────────────────────────┐
│Student Name                     │  ← label: #667085, moved up/scaled
├─────────────────────────────────┤
│Sarah Johnson_                   │  ← border: 2px #1d7452 (focused)
└─────────────────────────────────┘    focus ring: 3px rgba(29,116,82,0.1)
  Helper text: Enter full name       ← 12px #667085
```

### Search Input
```
╭─────────────────────────────────╮  ← borderRadius: full (20px)
│ 🔍    Search students...    ✖️  │    bg: #f9fafb
╰─────────────────────────────────╯    left icon + right clear button
```

### Input with Error State
```
┌─────────────────────────────────┐
│Email Address                    │
├─────────────────────────────────┤  ← border: 2px #ef4444 (error)
│invalid-email                  ⚠️│
└─────────────────────────────────┘
  ❌ Please enter a valid email      ← 12px #dc2626
```

---

## 4. Avatar Component

### Size Variations
```
👤  👤   👤    👤     👤      👤
xs  sm   md    lg     xl      xxl
24  32   40    56     80      120pt
```

### With Status Indicators
```
    👤        👤        👤        👤
   🟢        🟡        🔴        ⚫
  online    away      busy     offline
```

### With Role Indicators  
```
  ╭─👤─╮      ╭─👤─╮      ╭─👤─╮
  │ 🎓 │      │ 📚 │      │ ⚡ │
  ╰────╯      ╰────╯      ╰────╯
  teacher     student     admin
  #1d7452     #3b82f6     #8b5cf6
```

---

## 5. Badge Component

### Notification Badges
```
📱●       📱[5]      📱[99+]
dot       number     overflow
red       red bg     red bg
8px       20px min   20px min
```

### Achievement Badges
```
  🥇          🥈          🥉
 GOLD       SILVER     BRONZE
#ffd700    #c0c0c0    #cd7f32
glow       shadow     shadow
```

### Status Badges
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ ACTIVE  │ │PENDING │ │INACTIVE │ │ ERROR   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
  #d1fae5     #fef3c7     #f3f4f6     #fee2e2
  #047857     #d97706     #6b7280     #dc2626
```

---

## 6. Tab Bar Component

```
╭─────────────────────────────────────────────────────╮
│  🏠     📚      👥      📊      ⚙️                  │  ← height: 64pt
│ Home  Lessons  Groups Reports Settings              │    icons: 24px
│  ●                                                  │    labels: 10px
╰─────────────────────────────────────────────────────╯
  ^active indicator (2px bar, #1d7452)

With Badge:
  📚●  ← red dot badge on Lessons tab
```

---

## 7. Header Component

### Default Header
```
╭─────────────────────────────────────────────────────╮
│ ←    Student Management                    ⋮  🔔   │  ← height: 56pt
╰─────────────────────────────────────────────────────╯    padding: 0 16px
back   title (center)                    actions
```

### Search Header - Expanded
```
╭─────────────────────────────────────────────────────╮
│                Search Students                      │
│ ╭─────────────────────────────────────────────────╮ │  ← height: 100pt
│ │ 🔍  Type to search...                        ✖️ │ │    expandable
│ ╰─────────────────────────────────────────────────╯ │
╰─────────────────────────────────────────────────────╯
```

### Contextual Header (Selection Mode)
```
╭─────────────────────────────────────────────────────╮
│ ✖️     5 selected                        📤  🗑️   │  ← bg: #1d7452
╰─────────────────────────────────────────────────────╯    text: white
```

### With Offline Indicator
```
╭─────────────────────────────────────────────────────╮
│ ←    Student List                         🔄  ⚙️   │
├─────────────────────────────────────────────────────┤
│              📡 Offline Mode                        │  ← height: 24pt
╰─────────────────────────────────────────────────────╯    bg: #fef3c7
```

---

## 8. Loading Screen Component

### Spinner Loading
```
            🔄
         Loading...         ← spinner: 32px #1d7452
      Please wait           rotation: 1s linear infinite
                           text: 14px #667085
```

### Progress Bar Loading
```
    Syncing student data...

██████████░░░░░░░░░░░░░░░░░░░░  ← height: 4px
           67%                   bg: #eaecf0, fill: #1d7452
   About 15 seconds remaining     percentage + time estimate
```

### Skeleton Loading
```
████████████████░░░░░░░░░░░░  ← shimmer animation
████████░░░░░░░░░░░░░░░░░░░░   left to right gradient
████████████████████░░░░░░░░   colors: #f2f4f7→#e5e7eb→#f2f4f7
                               duration: 1.5s infinite
```

### Educational Content Loading (Student)
```
             📚
         
        EXPLORE
    /ɪkˈsplɔːr/
    
  to travel through an area
  in order to learn about it
  
         ⭐ Fun Fact ⭐        ← cycles every 3s
    Explorers discovered      fade in/out animation
       new continents!
```

---

## 9. Empty State Component

### No Data State
```
        ╭─────────────────╮
        │                 │
        │       📭        │  ← illustration: 160x160px
        │                 │
        ╰─────────────────╯
        
      No students found     ← title: 18px #101828
   Add your first student   description: 14px #667085
      to get started

    ┌───────────────────┐
    │   Add Student     │   ← CTA button
    └───────────────────┘
```

### Error State
```
        ╭─────────────────╮
        │                 │
        │      ⚠️         │  ← illustration with error icon
        │                 │    title color: #dc2626
        ╰─────────────────╯
        
     Something went wrong
   Check your connection and
         try again

    ┌───────────────────┐
    │    Try Again      │
    └───────────────────┘
```

### Achievement State (Student)
```
        ╭─────────────────╮
        │                 │
        │      🏆         │  ← golden trophy
        │                 │    bg: #fef7cd (gold tint)
        ╰─────────────────╯
        
      Congratulations!      ← title: #eab308 (gold)
   You've completed your    
    first vocabulary set!

    ┌───────────────────┐
    │     Continue      │   ← confetti animation
    └───────────────────┘
```

---

## 10. Modal Component

### Alert Modal - Small
```
╭─────────────────────────╮
│          ⚠️            │  ← icon: 48px centered
│                         │    width: 280pt
│     Delete Student      │    title: 18px SemiBold
│                         │
│ Are you sure you want   │    message: 14px Regular
│ to delete Sarah Johnson │    
│ from the system?        │
│                         │
│    ┌─────┐ ┌─────────┐  │
│    │Cancel│ │ Delete  │  │  ← actions: right-aligned
│    └─────┘ └─────────┘  │
╰─────────────────────────╯
  ^ backdrop: rgba(16,24,40,0.7)
```

### Form Modal - Medium
```
╭───────────────────────────────╮
│ Add New Student          ✖️   │  ← header with close
├───────────────────────────────┤
│                               │  ← scrollable content
│ Full Name                     │    width: 320pt
│ ┌─────────────────────────┐   │
│ │ Enter student name      │   │
│ └─────────────────────────┘   │
│                               │
│ Email Address                 │
│ ┌─────────────────────────┐   │
│ │ student@email.com       │   │
│ └─────────────────────────┘   │
│                               │
│ Grade Level                   │
│ ┌─────────────────────────┐   │
│ │ Select grade ▼          │   │
│ └─────────────────────────┘   │
│                               │
├───────────────────────────────┤
│        ┌─────┐ ┌─────────┐    │  ← footer with actions
│        │Cancel│ │   Add   │    │
│        └─────┘ └─────────┘    │
╰───────────────────────────────╯
```

### Celebration Modal (Student)
```
         ✨ 🎉 ✨
╭─────────────────────────────╮
│            🏆              │  ← bounce animation + confetti
│                             │    gradient background
│      Achievement            │
│       Unlocked!             │
│                             │
│    📚 Vocabulary Master     │
│                             │
│   You've learned 100        │
│   new words this week!      │
│                             │
│      ┌─────────────┐        │
│      │  Awesome!   │        │  ← auto-dismiss after 3s
│      └─────────────┘        │
╰─────────────────────────────╯
         ✨ 🎉 ✨
```

---

## Theme Variations

### Teacher Theme (Professional)
- Colors: Darker greens (#175d42)
- Shadows: Subtle (xs, sm only) 
- Animations: Quick (150ms)
- Cards: Clean, data-focused
- Buttons: Efficiency-oriented

### Student Theme (Engaging)
- Colors: Standard brand (#1d7452)
- Shadows: Enhanced (md, lg)
- Animations: Full suite (300-500ms)
- Cards: Visual, gradient accents
- Buttons: Achievement celebrations

### Dark Mode
- Primary: Lighter (#339770)
- Backgrounds: #101828 base
- Text: #f9fafb primary
- Borders: #344054
- Maintains accessibility ratios

---

## Accessibility Features

### Focus Indicators
```
┌─────────────────────────────────┐
│         Continue                │  ← 2px #1d7452 ring
└─────────────────────────────────┘    offset: 2px
     ^^^^ visible focus ring
```

### High Contrast States
```
Default:  │ Button Text │  4.5:1 contrast
Enhanced: │ Button Text │  7:1 contrast  
Large:    │ Button Text │  3:1 contrast (18pt+)
```

### Touch Targets
```
Minimum:     [44×44pt]  ← WCAG AA compliant
Recommended: [48×48pt]  ← Material Design
Comfortable: [52×52pt]  ← Most users
Large:       [56×56pt]  ← Primary actions
```

---

## Performance Considerations

### Animation FPS Targets
- Smooth: 60 FPS maintained
- Optimized: GPU-accelerated transforms
- Reduced Motion: Respects user preference
- Battery Conscious: Efficient animations only

### Loading Priorities  
1. Critical UI (buttons, inputs): < 100ms
2. Content cards: < 200ms  
3. Educational content: < 300ms
4. Animations: After content loaded

### Memory Usage
- Image caching: 50 max items
- Component specs: Memoized objects
- Theme switching: Lazy evaluation
- Cleanup: Automatic on unmount

---

*This visual guide demonstrates the premium UI components designed for Harry School's mobile applications, optimized for both teacher efficiency and student engagement.*