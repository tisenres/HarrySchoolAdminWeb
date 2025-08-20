# Harry School Mobile Design System Documentation

## Overview
Comprehensive mobile design system for Harry School's educational applications, optimized for Teacher efficiency and Student engagement based on UX research findings.

## Design System Architecture

### Core Principles
1. **Educational Context**: Designed specifically for private education center in Tashkent
2. **Dual User Focus**: Teacher (efficiency) and Student (engagement) variants
3. **Mobile-First**: Touch-optimized with 44pt minimum touch targets
4. **Accessibility**: WCAG 2.1 AA compliant throughout
5. **Performance**: <2s launch, <300ms transitions, <1s data loading

### Token System (400+ tokens)

#### Colors
- **Primary Brand**: #1d7452 (Harry School green) with 12-shade system
- **Educational Rankings**: Gold (#f59e0b), Silver (#64748b), Bronze (#cd6155)
- **Task Status**: Not started, In progress, Completed, Overdue
- **Subject Colors**: English (blue), Math (green), Science (green), History (orange)
- **Accessibility**: All combinations meet 4.5:1 contrast ratio

#### Typography (Inter Font)
- **Mobile Optimized**: 12px-36px range with 1.2-1.6 line heights
- **Text Styles**: 20+ semantic styles (h1-h6, body, caption, button)
- **Multilingual Support**: Uzbek, Russian, English with expansion factors
- **Readability**: Optimized for mobile screens and educational content

#### Spacing (8pt Grid)
- **Touch Targets**: 44pt minimum (iOS), 48pt recommended
- **Educational Context**: Special spacing for vocabulary cards, progress bars
- **Component Spacing**: Form fields, lists, cards with proper breathing room
- **Thumb Zone**: Optimized for one-handed mobile usage

### Theme Variants

#### Teacher Theme (Efficiency-Focused)
- **Colors**: Professional, muted tones (#175d42 primary)
- **Shadows**: Subtle elevation for clean appearance
- **Animations**: 100-150ms for quick feedback
- **Touch Targets**: Larger for speed between classes
- **Components**: Attendance buttons, quick actions, data visualizations

#### Student Theme (Engagement-Focused)
- **Colors**: Vibrant, motivational (#1d7452 primary)
- **Shadows**: Enhanced depth for visual appeal
- **Animations**: 300-800ms celebrations and achievements
- **Gamification**: Points, badges, progress indicators
- **Components**: Achievement cards, vocabulary flashcards, ranking displays

#### Dark Mode
- **Accessibility**: Maintains contrast ratios in dark theme
- **Educational Appropriateness**: Reduced eye strain for extended study
- **Auto-switching**: Respects system preferences

### Component Library (44+ Components)

#### Navigation
- **Bottom Tab Bar**: 5 sections per app (optimized for thumb navigation)
- **Teacher Tabs**: Dashboard, Students, Attendance, AI Tools, Profile
- **Student Tabs**: Learn, Vocabulary, Progress, Rewards, Profile

#### Educational Components
- **Vocabulary Cards**: Flip animations, spaced repetition indicators
- **Progress Indicators**: Circular and linear with percentage display
- **Achievement Badges**: Gold, silver, bronze with unlock animations
- **Ranking Cards**: Position changes with smooth transitions
- **Task Cards**: Status-based styling (not started, in progress, completed, overdue)

#### Interactive Elements
- **Buttons**: Primary, secondary, outline, ghost, destructive variants
- **Forms**: Input fields with focus states, validation feedback
- **Cards**: Elevated, outlined, filled, interactive variants
- **Modals**: Slide-up transitions with backdrop

### Animation System

#### Teacher Animations (Efficiency)
- **Duration**: 100-150ms for immediate feedback
- **Attendance Marking**: Quick checkmark confirmations
- **Data Loading**: Minimal skeleton screens
- **Navigation**: Fast tab transitions without delay

#### Student Animations (Engagement)
- **Achievement Celebrations**: Confetti, badge reveals (500-800ms)
- **Progress Tracking**: Smooth bar fills with counters
- **Vocabulary Learning**: Card flip animations (300ms)
- **Milestone Moments**: Special celebrations for learning achievements

#### Performance Optimization
- **GPU Acceleration**: Transform and opacity only
- **Reduced Motion**: Respects accessibility preferences
- **Battery Awareness**: Scales animations based on battery level
- **Memory Efficient**: Proper cleanup and object pooling

### Accessibility Features

#### Visual Accessibility
- **High Contrast Mode**: Alternative color system
- **Color Blind Support**: Pattern and icon redundancy
- **Text Scaling**: Supports dynamic type up to 200%
- **Focus Indicators**: Clear, high-contrast focus rings

#### Motor Accessibility
- **Touch Targets**: 44pt minimum, 48pt recommended
- **Gesture Alternatives**: All swipe gestures have button alternatives
- **One-Handed Usage**: Thumb-zone optimization
- **Error Prevention**: Clear validation and confirmation dialogs

#### Cognitive Accessibility
- **Simple Language**: Educational content at appropriate reading levels
- **Consistent Patterns**: Familiar UI patterns throughout
- **Progress Indicators**: Clear feedback on task completion
- **Learning Differences**: Support for dyslexia, ADHD considerations

### Performance Standards

#### Target Metrics
- **App Launch**: <2 seconds from cold start
- **Screen Transitions**: <300ms between screens
- **Data Loading**: <1 second for standard queries
- **Memory Usage**: <100MB baseline, <200MB peak
- **Bundle Size**: <500KB for design system package

#### Optimization Strategies
- **Code Splitting**: Lazy load components by app section
- **Image Optimization**: WebP format with fallbacks
- **Caching**: LRU cache for frequently accessed data
- **Tree Shaking**: Remove unused design tokens

### Educational Context Considerations

#### Cultural Sensitivity
- **Tashkent Context**: Appropriate for Uzbekistan educational environment
- **Professional Standards**: Maintains dignity of educational setting
- **Age Appropriateness**: Suitable for 10-18 year student demographic

#### Learning Psychology
- **Immediate Feedback**: Visual confirmation of actions
- **Progress Visualization**: Clear advancement indicators
- **Achievement Recognition**: Meaningful celebration of milestones
- **Gamification Balance**: Motivating without being distracting

### Implementation Guidelines

#### File Structure
```
mobile/packages/ui/theme/
├── tokens.ts              # 400+ design tokens
├── variants.ts            # Theme variants (teacher/student/dark)
├── components.ts          # Component specifications
├── animations.ts          # Educational micro-animations
├── accessibility.ts       # WCAG compliance guidelines
├── performance.ts         # Performance optimization
└── README.md              # Comprehensive documentation
```

#### Usage Examples
```typescript
// Teacher Theme
import { teacherTheme, useTheme } from '@harry-school/ui';

<ThemeProvider variant="teacher">
  <AttendanceButton studentId="123" />
</ThemeProvider>

// Student Theme  
import { studentTheme } from '@harry-school/ui';

<ThemeProvider variant="student">
  <AchievementBadge type="gold" />
</ThemeProvider>
```

#### Best Practices
1. **Use Semantic Tokens**: Prefer semantic over hardcoded values
2. **Component Composition**: Build complex UIs from base components
3. **Theme Variants**: Always specify appropriate theme for user type
4. **Accessibility Testing**: Test with screen readers and keyboard navigation
5. **Performance Monitoring**: Track bundle size and render performance

### Quality Assurance

#### Testing Requirements
- **Accessibility**: WCAG 2.1 AA compliance verification
- **Performance**: Regular performance audits and monitoring
- **Cross-Platform**: iOS and Android compatibility testing
- **User Testing**: Regular feedback from teachers and students
- **Responsive**: Testing across different screen sizes

#### Success Metrics
- **Teacher Efficiency**: <2 minutes for common tasks
- **Student Engagement**: >80% task completion rates
- **Accessibility Score**: 100% WCAG AA compliance
- **Performance Score**: >90 Lighthouse mobile score
- **Adoption Rate**: >95% component usage vs custom styling

This design system provides a comprehensive foundation for Harry School's mobile applications, ensuring consistent, accessible, and educationally-appropriate user experiences across both Teacher and Student applications.