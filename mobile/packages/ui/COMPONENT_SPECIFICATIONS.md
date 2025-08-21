# Harry School Mobile UI Component Specifications

## Design System Overview

**Brand Identity**
- Primary Color: `#1d7452` (Professional Green)
- Font Family: Inter (optimized for mobile readability)
- Target Users: Teachers (efficiency-focused) and Students (engagement-focused)
- Design Philosophy: Clean, accessible, educational, mobile-first

**Core Design Principles**
1. **Touch-Optimized**: Minimum 44pt touch targets (iOS/WCAG AA)
2. **Theme-Aware**: Teacher (professional) vs Student (engaging) themes
3. **Accessibility-First**: 4.5:1 minimum contrast ratios
4. **Performance-Focused**: Smooth 60fps animations
5. **Offline-Capable**: Clear sync status indicators

---

## 1. Button Component

### Design Specifications

#### Variants

**Primary Button**
```
Background: #1d7452
Text: #ffffff
Border: none
Shadow: 0px 2px 4px rgba(16, 24, 40, 0.06)
States:
  - Default: bg-#1d7452
  - Pressed: bg-#124631, scale(0.98)
  - Disabled: bg-#d0d5dd, opacity(0.38)
  - Loading: spinner overlay
```

**Secondary Button**
```
Background: transparent
Text: #1d7452
Border: 2px solid #1d7452
Shadow: none
States:
  - Default: border-#1d7452
  - Pressed: bg-#f0f9f4, border-#124631
  - Disabled: border-#d0d5dd, text-#98a2b3
```

**Outline Button**
```
Background: #ffffff
Text: #344054
Border: 1px solid #d0d5dd
Shadow: 0px 1px 2px rgba(16, 24, 40, 0.05)
States:
  - Default: border-#d0d5dd
  - Pressed: bg-#f9fafb, border-#98a2b3
  - Disabled: opacity(0.38)
```

**Ghost Button**
```
Background: transparent
Text: #1d7452
Border: none
Shadow: none
States:
  - Default: text-#1d7452
  - Pressed: bg-#f0f9f4
  - Disabled: text-#d0d5dd
```

**Destructive Button**
```
Background: #ef4444
Text: #ffffff
Border: none
Shadow: 0px 2px 4px rgba(239, 68, 68, 0.1)
States:
  - Default: bg-#ef4444
  - Pressed: bg-#dc2626, scale(0.98)
  - Disabled: bg-#fee2e2, text-#fca5a5
```

**Bulk Action Button** (Teacher-specific)
```
Background: #2563eb
Text: #ffffff
Border: none
Icon: checkbox indicator
Shadow: 0px 2px 4px rgba(37, 99, 235, 0.1)
Special: Shows selection count badge
```

#### Sizes

```
Small:
  - Height: 36pt
  - Padding: 8px 12px
  - Font: 12px/16px Inter-SemiBold
  - Icon: 16px

Medium (Default):
  - Height: 44pt
  - Padding: 12px 16px
  - Font: 14px/20px Inter-SemiBold
  - Icon: 20px

Large:
  - Height: 52pt
  - Padding: 14px 20px
  - Font: 16px/24px Inter-SemiBold
  - Icon: 24px

XLarge (CTA):
  - Height: 60pt
  - Padding: 16px 24px
  - Font: 18px/28px Inter-Bold
  - Icon: 28px
```

#### Special Features

**Celebration Animation** (Student Achievement)
```typescript
// Confetti burst on success
animation: {
  scale: [1, 1.2, 0.9, 1.05, 1],
  duration: 500ms,
  particles: confetti burst
}
```

**Icon Support**
```
Leading Icon: margin-right: 8px
Trailing Icon: margin-left: 8px
Icon-Only: width = height, centered
```

#### Accessibility
- Focus Ring: 2px solid #1d7452, offset 2px
- Disabled State: opacity 0.38, cursor not-allowed
- Loading State: aria-busy="true", spinner visible
- Touch Target: minimum 44x44pt

---

## 2. Card Component

### Design Specifications

#### Variants

**Elevated Card**
```
Background: #ffffff
Border: none
BorderRadius: 12px
Shadow: 0px 4px 8px rgba(16, 24, 40, 0.08)
Padding: 16px
```

**Outlined Card**
```
Background: #ffffff
Border: 1px solid #eaecf0
BorderRadius: 12px
Shadow: none
Padding: 16px
```

**Filled Card**
```
Background: #f9fafb
Border: none
BorderRadius: 12px
Shadow: none
Padding: 16px
```

**Interactive Card**
```
Background: #ffffff
Border: 1px solid #eaecf0
BorderRadius: 12px
Shadow: 0px 2px 4px rgba(16, 24, 40, 0.06)
States:
  - Default: scale(1)
  - Pressed: scale(0.98), bg-#f9fafb
  - Focused: border-#1d7452
```

**Data Card** (Teacher-specific)
```
Background: #ffffff
Border: 1px solid #d0d5dd
BorderRadius: 8px
Shadow: 0px 1px 2px rgba(16, 24, 40, 0.05)
Features:
  - Sync indicator (top-right)
  - Quick actions menu
  - Data grid layout
```

**Visual Card** (Student-specific)
```
Background: gradient(#f0f9f4, #ffffff)
Border: 2px solid #1d7452
BorderRadius: 16px
Shadow: 0px 6px 12px rgba(29, 116, 82, 0.1)
Features:
  - Large imagery
  - Progress indicators
  - Achievement badges
```

#### Sizes

```
Compact:
  - Padding: 12px
  - MinHeight: 80px
  - Font: 12px body

Default:
  - Padding: 16px
  - MinHeight: 120px
  - Font: 14px body

Expanded:
  - Padding: 20px
  - MinHeight: 160px
  - Font: 16px body
```

#### Special Features

**Sync Status Indicator**
```
Position: top-right, 8px margin
States:
  - Synced: green dot (4px)
  - Syncing: animated orange spinner
  - Offline: gray icon
  - Error: red exclamation
```

**Swipe Actions**
```
Left Swipe: Primary action (bg-#1d7452)
Right Swipe: Destructive action (bg-#ef4444)
Animation: spring damping: 20, stiffness: 120
```

---

## 3. Input Component

### Design Specifications

#### Variants

**Default Input**
```
Background: #ffffff
Border: 1px solid #d0d5dd
BorderRadius: 8px
Padding: 12px
Height: 44pt
Font: 14px/20px Inter-Regular
```

**Filled Input**
```
Background: #f9fafb
Border: none
BorderBottom: 2px solid #d0d5dd
BorderRadius: 8px 8px 0 0
Padding: 12px
```

**Outlined Input**
```
Background: transparent
Border: 2px solid #d0d5dd
BorderRadius: 8px
Padding: 12px
```

**Underlined Input**
```
Background: transparent
Border: none
BorderBottom: 1px solid #d0d5dd
Padding: 8px 0
```

#### States

```
Default:
  - Border: #d0d5dd
  - Background: #ffffff

Focused:
  - Border: #1d7452 (2px)
  - Shadow: 0px 0px 0px 3px rgba(29, 116, 82, 0.1)
  - Label: scaled(0.85), translated(-12px)

Error:
  - Border: #ef4444 (2px)
  - Helper text: #dc2626
  - Icon: error-circle (red)

Disabled:
  - Background: #f2f4f7
  - Text: #98a2b3
  - Border: #eaecf0
  - Opacity: 0.6

Valid:
  - Border: #10b981
  - Icon: check-circle (green)
```

#### Features

**Label Animation**
```
Floating Label:
  - Initial: inside input, #98a2b3
  - Focused/Filled: above input, #667085, scale(0.85)
  - Animation: 200ms ease-out
```

**Helper Text**
```
Position: below input, 4px margin
Font: 12px/16px Inter-Regular
Colors:
  - Default: #667085
  - Error: #dc2626
  - Success: #059669
```

**Icons**
```
Leading Icon: 
  - Position: left, 12px
  - Size: 20px
  - Color: #667085

Trailing Icon:
  - Position: right, 12px
  - Size: 20px
  - Actions: clear, visibility toggle
```

#### Types

```
Text: standard keyboard
Number: numeric keyboard, increment/decrement buttons
Password: secure entry, visibility toggle
Multiline: expandable, min 2 lines, max 5 lines
Search: search icon, clear button, rounded corners
```

---

## 4. Avatar Component

### Design Specifications

#### Sizes

```
XS (24pt):
  - Dimensions: 24x24
  - Font: 10px
  - Border: 1px
  - Status: 6px dot

SM (32pt):
  - Dimensions: 32x32
  - Font: 12px
  - Border: 1.5px
  - Status: 8px dot

MD (40pt):
  - Dimensions: 40x40
  - Font: 14px
  - Border: 2px
  - Status: 10px dot

LG (56pt):
  - Dimensions: 56x56
  - Font: 18px
  - Border: 2px
  - Status: 12px dot

XL (80pt):
  - Dimensions: 80x80
  - Font: 24px
  - Border: 3px
  - Status: 14px dot

XXL (120pt):
  - Dimensions: 120x120
  - Font: 36px
  - Border: 4px
  - Status: 16px dot
```

#### Status Indicators

```
Online:
  - Color: #10b981
  - Animation: none
  - Position: bottom-right

Away:
  - Color: #f59e0b
  - Animation: none
  - Position: bottom-right

Busy:
  - Color: #ef4444
  - Animation: none
  - Position: bottom-right

Offline:
  - Color: #6b7280
  - Animation: none
  - Position: bottom-right
```

#### Role Indicators

```
Teacher:
  - Border: 2px solid #1d7452
  - Badge: graduation-cap icon
  - Background: subtle gradient

Student:
  - Border: 2px solid #3b82f6
  - Badge: book icon
  - Background: standard

Admin:
  - Border: 2px solid #8b5cf6
  - Badge: shield icon
  - Background: subtle glow
```

#### Fallbacks

```
Initials:
  - Background: generated from name hash
  - Text: white, bold
  - Max: 2 characters

Placeholder:
  - Background: #f2f4f7
  - Icon: user-circle
  - Color: #98a2b3
```

---

## 5. Badge Component

### Design Specifications

#### Types

**Notification Badge**
```
Style: Red dot or number
Dimensions: 
  - Dot: 8px circle
  - Number: min 20px height, padding 4px 6px
Background: #ef4444
Text: #ffffff, 10px bold
Position: top-right, -4px offset
Animation: pulse 2s infinite
```

**Achievement Badge**
```
Gold:
  - Background: linear-gradient(135deg, #ffd700, #ffed4e)
  - Border: 2px solid #eab308
  - Shadow: 0px 4px 8px rgba(234, 179, 8, 0.3)
  - Icon: star

Silver:
  - Background: linear-gradient(135deg, #c0c0c0, #e5e7eb)
  - Border: 2px solid #64748b
  - Shadow: 0px 4px 8px rgba(100, 116, 139, 0.2)
  - Icon: star

Bronze:
  - Background: linear-gradient(135deg, #cd7f32, #f59e0b)
  - Border: 2px solid #ea580c
  - Shadow: 0px 4px 8px rgba(234, 88, 12, 0.25)
  - Icon: star
```

**Status Badge**
```
Active:
  - Background: #d1fae5
  - Text: #047857
  - Border: 1px solid #a7f3d0

Pending:
  - Background: #fef3c7
  - Text: #d97706
  - Border: 1px solid #fde68a

Inactive:
  - Background: #f3f4f6
  - Text: #6b7280
  - Border: 1px solid #e5e7eb

Error:
  - Background: #fee2e2
  - Text: #dc2626
  - Border: 1px solid #fca5a5
```

#### Animations

```
Pulse (Notifications):
  - Scale: [1, 1.2, 1]
  - Opacity: [1, 0.8, 1]
  - Duration: 2000ms
  - Iteration: infinite

Celebration (Achievements):
  - Rotate: [0, -10deg, 10deg, -10deg, 0]
  - Scale: [1, 1.1, 1]
  - Duration: 500ms
  - Particles: confetti burst
```

---

## 6. TabBar Component

### Design Specifications

#### Layout

```
Container:
  - Height: 64pt (56pt bar + 8pt safe area)
  - Background: #ffffff
  - BorderTop: 1px solid #eaecf0
  - Shadow: 0px -2px 4px rgba(16, 24, 40, 0.05)
  - Position: fixed bottom

Tab Items:
  - MinWidth: 60pt
  - MaxWidth: 168pt
  - Height: 56pt
  - Flex: 1
  - Padding: 8px 4px
```

#### Tab Item States

```
Inactive:
  - Icon: #667085, 24px
  - Label: #667085, 10px
  - Background: transparent

Active:
  - Icon: #1d7452, 24px
  - Label: #1d7452, 10px
  - Background: #f0f9f4 (subtle)
  - Indicator: 2px bar top, #1d7452

Pressed:
  - Scale: 0.95
  - Background: #f9fafb
```

#### Active Indicator

```
Style: Top bar
Height: 2px
Color: #1d7452
Animation: 
  - Slide: 300ms ease-out
  - Width: match tab width
```

#### Badge Support

```
Position: top-right of icon
Offset: -4px horizontal, -2px vertical
Max Count: 99+
Style: See Badge Component specs
```

---

## 7. Header Component

### Design Specifications

#### Variants

**Default Header**
```
Height: 56pt
Background: #ffffff
BorderBottom: 1px solid #eaecf0
Shadow: none
Padding: 0 16px
Layout: [back] [title/subtitle] [actions]
```

**Search Header**
```
Height: 56pt expandable to 100pt
Background: #ffffff
Search Bar: embedded, expandable
Animation: slide down 200ms
```

**Minimal Header**
```
Height: 44pt
Background: transparent
BorderBottom: none
Shadow: none
Content: back button + title only
```

**Contextual Header**
```
Height: 56pt
Background: #1d7452 (branded)
Text: #ffffff
Special: selection count, bulk actions
```

#### Features

**Offline Indicator**
```
Position: below main header
Height: 24pt
Background: #fef3c7
Text: "Offline Mode" + sync icon
Animation: slide down 200ms
```

**Sync Status**
```
Position: right side
States:
  - Syncing: animated spinner
  - Synced: check icon (green)
  - Error: exclamation (red)
```

**Actions**
```
Max Count: 3 visible (more in menu)
Icon Size: 24px
Touch Target: 44x44pt
Spacing: 8px between
```

---

## 8. LoadingScreen Component

### Design Specifications

#### Types

**Spinner**
```
Default:
  - Size: 24px
  - Color: #1d7452
  - Animation: rotate 1s linear infinite
  - Background: transparent

Overlay:
  - Size: 32px
  - Color: #ffffff
  - Background: rgba(16, 24, 40, 0.7)
  - Position: centered
```

**Progress Bar**
```
Container:
  - Height: 4px
  - Background: #eaecf0
  - BorderRadius: 2px

Fill:
  - Height: 100%
  - Background: #1d7452
  - Animation: width transition 200ms
  - Text: percentage below (optional)
```

**Skeleton**
```
Background: linear-gradient(90deg, #f2f4f7 25%, #e5e7eb 50%, #f2f4f7 75%)
Animation: shimmer 1.5s infinite
BorderRadius: 4px
Variants:
  - Text: height 12px
  - Title: height 20px
  - Image: aspect ratio preserved
  - Card: full card layout
```

**Educational Content** (Student-specific)
```
Layout: Center screen
Content Types:
  - Vocabulary word + definition
  - Daily tip
  - Achievement progress
  - Fun fact
Animation: fade in/out 3s cycle
```

#### Features

```
Progress Percentage:
  - Position: below spinner/bar
  - Font: 14px Inter-Medium
  - Color: #667085

Estimated Time:
  - Position: below percentage
  - Font: 12px Inter-Regular
  - Color: #98a2b3
  - Format: "About X seconds remaining"
```

---

## 9. EmptyState Component

### Design Specifications

#### Variants

**No Data**
```
Illustration: custom vector (160x160)
Title: 18px Inter-SemiBold, #101828
Description: 14px Inter-Regular, #667085
CTA: Primary button (optional)
Padding: 32px
```

**Error**
```
Illustration: error illustration (160x160)
Title: 18px Inter-SemiBold, #dc2626
Description: 14px Inter-Regular, #667085
CTA: "Try Again" button
Icon: exclamation-triangle
```

**Offline**
```
Illustration: cloud-off illustration
Title: "You're Offline"
Description: "Check your connection"
CTA: "Retry" button
Background: #fef3c7 (subtle warning)
```

**First Time**
```
Illustration: welcome illustration
Title: "Welcome! Let's get started"
Description: Onboarding message
CTA: "Create First [Item]" button
Animation: subtle float animation
```

**Achievement** (Student-specific)
```
Illustration: trophy/medal
Title: "Congratulations!"
Description: Achievement details
CTA: "Share" or "Continue" button
Animation: confetti burst
```

#### Tone Guidelines

```
Teacher App:
  - Professional, informative
  - Action-oriented CTAs
  - Minimal illustrations

Student App:
  - Encouraging, positive
  - Gamified language
  - Vibrant illustrations
```

---

## 10. Modal Component

### Design Specifications

#### Sizes

**Small (280pt width)**
```
Width: 280pt
MaxHeight: 400pt
Padding: 20px
Use Cases: alerts, confirmations
```

**Medium (320pt width)**
```
Width: 320pt
MaxHeight: 600pt
Padding: 24px
Use Cases: forms, detailed info
```

**Large (Fullscreen - 40pt margins)**
```
Width: calc(100% - 40px)
MaxHeight: calc(100% - 80px)
Padding: 24px
Use Cases: complex forms, media
```

#### Types

**Alert Modal**
```
Layout: icon + title + message + actions
Icon: 48px, centered
Title: 18px SemiBold
Message: 14px Regular
Actions: 1-2 buttons, right-aligned
```

**Confirmation Modal**
```
Layout: title + message + actions
Destructive: red accents for delete
Actions: Cancel (secondary) + Confirm (primary)
```

**Form Modal**
```
Layout: header + scrollable content + footer
Header: title + close button
Content: form fields with validation
Footer: Cancel + Submit buttons
```

**Celebration Modal** (Student)
```
Background: gradient overlay
Animation: scale in + confetti
Content: achievement details
Auto-dismiss: after 3 seconds
```

#### Features

**Backdrop**
```
Color: rgba(16, 24, 40, 0.7)
Animation: fade in 200ms
Dismissible: tap to close (optional)
```

**Close Button**
```
Position: top-right, 12px
Size: 32x32pt
Icon: x-mark, 20px
Color: #667085
```

**Focus Trap**
```
Tab Navigation: cycles within modal
Escape Key: closes modal
Initial Focus: first interactive element
```

#### Animations

```
Enter:
  - Slide Up: translateY(100%) to translateY(0)
  - Fade In: opacity 0 to 1
  - Duration: 300ms ease-out

Exit:
  - Slide Down: translateY(0) to translateY(100%)
  - Fade Out: opacity 1 to 0
  - Duration: 200ms ease-in

Celebration:
  - Bounce: scale(0.8) to scale(1.1) to scale(1)
  - Duration: 500ms spring
  - Particles: confetti burst
```

---

## Implementation Notes

### Color Usage by Theme

**Teacher Theme**
- Primary actions: #175d42 (darker green)
- Backgrounds: More whites/grays
- Shadows: Subtle (xs, sm)
- Animations: Minimal, quick (150ms)

**Student Theme**
- Primary actions: #1d7452 (standard green)
- Backgrounds: Gradient accents
- Shadows: Enhanced (md, lg)
- Animations: Full suite (300-500ms)

**Dark Mode**
- Primary: #339770 (lighter for contrast)
- Backgrounds: #101828 base
- Borders: #344054
- Text: #f9fafb primary

### Spacing System

Based on 4pt grid:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Typography Scale

```
Display: 36px/48px
Headline: 24px/36px
Title: 20px/32px
Body: 14px/20px
Caption: 12px/16px
Label: 10px/12px
```

### Accessibility Checklist

- [ ] All interactive elements ≥ 44x44pt
- [ ] Text contrast ≥ 4.5:1 (normal), ≥ 3:1 (large)
- [ ] Focus indicators visible
- [ ] Screen reader labels present
- [ ] Reduced motion alternatives
- [ ] Error messages clear and actionable
- [ ] Loading states announced
- [ ] Keyboard navigation supported

### Performance Targets

- Initial render: < 100ms
- Animation FPS: 60fps
- Touch response: < 50ms
- Image loading: progressive
- Bundle size: < 50KB per component

### Platform Considerations

**iOS**
- Safe areas respected
- Haptic feedback on key actions
- Native scroll bounce
- System font fallbacks

**Android**
- Material elevation system
- Ripple effects on touch
- Back gesture handling
- System UI color matching

---

## Component Development Priority

### Phase 1 (Core)
1. Button
2. Input
3. Card
4. LoadingScreen
5. Header

### Phase 2 (Enhanced)
6. TabBar
7. Modal
8. Avatar
9. Badge
10. EmptyState

### Phase 3 (Educational)
- VocabularyCard
- ProgressBar
- AchievementBadge
- RankingBadge
- QuizOption

---

## Quality Assurance

### Testing Requirements
- Unit tests for all variants
- Accessibility audit (WCAG AA)
- Performance profiling
- Cross-device testing
- Theme switching validation
- Offline mode testing
- RTL language support

### Documentation Requirements
- Component API documentation
- Usage examples
- Accessibility guidelines
- Performance best practices
- Migration guides
- Storybook stories

---

*Last Updated: 2024*
*Design System Version: 1.0.0*
*Platform: React Native + Expo*