# Design System - Harry School CRM

## Overview

The Harry School CRM design system provides a comprehensive foundation for building consistent, accessible, and culturally appropriate admin interfaces for educational management in Central Asia.

## Design Principles

### 1. Educational Context First
- Prioritize clarity and efficiency for busy administrators
- Support quick decision-making with clear visual hierarchy
- Accommodate varying levels of technical expertise

### 2. Cultural Sensitivity
- Respect Central Asian design preferences and cultural norms
- Support multiple scripts (Latin, Cyrillic) with equal prominence
- Consider local administrative workflows and expectations

### 3. Accessibility by Default
- WCAG 2.1 AA compliance across all components
- Support for assistive technologies
- Keyboard navigation as first-class citizen

### 4. Multi-language Ready
- Flexible layouts for text expansion (Russian ~30% longer)
- Consistent spacing regardless of language
- Cultural adaptation of icons and symbols

## Typography System

### Font Selection
**Primary Font Stack**: Inter
- Excellent Cyrillic support
- Optimized for screen reading
- Professional appearance suitable for admin interfaces
- Good character spacing for multilingual content

**Fallback Stack**:
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 
             'Segoe UI Emoji', 'Segoe UI Symbol';
```

### Type Scale

#### Headings
- **H1**: 32px (2rem) / Bold / Line-height: 1.2
  - Usage: Page titles, main headings
  - Letter-spacing: -0.02em

- **H2**: 24px (1.5rem) / Semibold / Line-height: 1.3
  - Usage: Section headings, card titles
  - Letter-spacing: -0.01em

- **H3**: 20px (1.25rem) / Semibold / Line-height: 1.4
  - Usage: Subsection headings, modal titles

- **H4**: 18px (1.125rem) / Medium / Line-height: 1.4
  - Usage: Component headings, form sections

#### Body Text
- **Large**: 16px (1rem) / Regular / Line-height: 1.6
  - Usage: Primary body text, descriptions

- **Base**: 14px (0.875rem) / Regular / Line-height: 1.5
  - Usage: Default UI text, form labels

- **Small**: 12px (0.75rem) / Regular / Line-height: 1.4
  - Usage: Captions, secondary information

#### UI Text
- **Button Large**: 16px / Medium / Line-height: 1
- **Button Base**: 14px / Medium / Line-height: 1
- **Button Small**: 12px / Medium / Line-height: 1

### Multi-language Considerations
- **Russian Text**: Increase line-height by 0.1 for better readability
- **Uzbek Latin**: Standard spacing works well
- **English**: Optimize for shorter text strings

## Spacing System

### Base Unit: 4px
All spacing follows multiples of 4px for consistency:

- **0**: 0px
- **1**: 4px
- **2**: 8px
- **3**: 12px
- **4**: 16px
- **5**: 20px
- **6**: 24px
- **8**: 32px
- **10**: 40px
- **12**: 48px
- **16**: 64px
- **20**: 80px
- **24**: 96px

### Component Spacing Guidelines
- **Form elements**: 16px vertical spacing
- **Card content**: 24px padding
- **Button padding**: 12px horizontal, 8px vertical (base)
- **Input padding**: 12px horizontal, 8px vertical
- **Table cells**: 16px horizontal, 12px vertical

## Layout System

### Grid Foundation
- **Max width**: 1440px (desktop)
- **Container padding**: 24px (desktop), 16px (mobile)
- **Column gaps**: 24px (desktop), 16px (mobile)

### Responsive Breakpoints
```css
/* Mobile First Approach */
sm: 640px    /* Small tablets */
md: 768px    /* Tablets */
lg: 1024px   /* Small desktop */
xl: 1280px   /* Desktop */
2xl: 1536px  /* Large desktop */
```

### Admin Layout Structure
```
┌─────────────────────────────────────────┐
│ Top Navigation (64px height)            │
├─────────────────────────────────────────┤
│ Sidebar │ Main Content Area             │
│ (240px) │                              │
│ (320px  │                              │
│ expand) │                              │
│         │                              │
└─────────────────────────────────────────┘
```

## Component Architecture

### Design Tokens
Following shadcn/ui structure with educational customizations:

```css
:root {
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### Component Hierarchy
1. **Base Components** (shadcn/ui)
   - Button, Input, Select, Card, etc.
   
2. **Admin Components** (Custom built on base)
   - DataTable, FilterBar, StatusBadge, etc.
   
3. **Domain Components** (Education-specific)
   - TeacherCard, StudentProfile, GroupSchedule, etc.

## Animation & Motion

### Micro-interactions
- **Duration**: 150-300ms for UI feedback
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` for natural feel
- **Hover states**: 150ms transition on all interactive elements

### Page Transitions
- **Route changes**: 200ms fade with slight vertical movement
- **Modal/drawer**: 250ms slide with backdrop fade
- **Loading states**: Skeleton animations at 1.5s cycle

### Educational Context Animations
- **Success states**: Subtle bounce for positive feedback
- **Progress indicators**: Smooth fill animations for completion
- **Data updates**: Gentle highlight fade for new information

## Iconography

### Icon System
- **Library**: Lucide React (consistent, open-source)
- **Sizes**: 16px, 20px, 24px, 32px
- **Style**: Outlined, 2px stroke weight
- **Educational icons**: Custom additions for school-specific concepts

### Icon Usage Guidelines
- **Navigation**: 20px icons with 16px text
- **Buttons**: 16px icons with text, 20px icon-only
- **Status indicators**: 16px with color coding
- **Headers**: 24px for emphasis

### Cultural Icon Considerations
- Avoid religious symbols
- Use universal education symbols (book, graduation cap, etc.)
- Consider local preferences for directional indicators

## Interaction States

### Standard States
1. **Default**: Base appearance
2. **Hover**: Subtle color shift, shadow increase
3. **Active**: Pressed appearance, color darkening
4. **Focus**: 2px outline with primary color
5. **Disabled**: 50% opacity, no interactions

### Form States
1. **Default**: Neutral border
2. **Focus**: Primary color border, subtle shadow
3. **Error**: Red border, error icon, error message
4. **Success**: Green border, checkmark icon
5. **Loading**: Spinner animation, disabled interaction

## Accessibility Features

### Keyboard Navigation
- **Tab order**: Logical flow through interface
- **Focus indicators**: Visible 2px outlines
- **Skip links**: Jump to main content
- **Escape actions**: Close modals, cancel operations

### Screen Reader Support
- **ARIA labels**: Descriptive labels for all interactive elements
- **Live regions**: Announce dynamic content changes
- **Landmark roles**: Proper semantic structure
- **Alt text**: Descriptive text for all images

### Color Accessibility
- **High contrast**: All text meets WCAG AA standards
- **Color independence**: Information not conveyed by color alone
- **Focus indicators**: Work in high contrast mode
- **Custom high contrast**: Optional enhanced contrast theme

## Quality Assurance

### Design Review Checklist
- [ ] Consistent spacing using 4px grid
- [ ] Typography hierarchy followed
- [ ] Color accessibility verified
- [ ] Multi-language layout tested
- [ ] Interactive states defined
- [ ] Animation performance optimized
- [ ] Icon consistency maintained
- [ ] Cultural sensitivity reviewed

### Testing Requirements
- **Visual regression**: Automated screenshot comparison
- **Accessibility audit**: Automated and manual testing
- **Multi-language QA**: Test all supported languages
- **Device testing**: Desktop, tablet, mobile viewports
- **Performance**: Animation frame rates, load times

## Implementation Guidelines

### CSS Architecture
```scss
// 1. Design tokens (CSS custom properties)
// 2. Base styles (reset, typography)
// 3. Layout utilities (grid, flexbox)
// 4. Component styles (isolated, reusable)
// 5. Page-specific styles (minimal, scoped)
```

### Component Development
1. Start with design tokens
2. Build mobile-first responsive
3. Include all interaction states
4. Add accessibility attributes
5. Test with multilingual content
6. Optimize animations for performance

### Handoff Process
1. Design specifications in Figma
2. Component documentation with examples
3. Accessibility requirements checklist
4. Multi-language testing scenarios
5. Animation specifications and easing curves