# Component Specifications - Harry School CRM

## Teacher Profile Card

### Design Specifications
```
┌─────────────────────────────────────────────┐
│ [Photo] Name                    [Status]    │
│         Email • Phone                       │
│         Specializations                     │
│         Groups: Mathematics A, Physics B    │
│         ┌─────────┐ ┌─────────┐ ┌─────────┐│
│         │ Contact │ │ Edit    │ │ Archive ││
│         └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────────────┘
```

### Visual Properties
- **Dimensions**: 400px width × 280px height (minimum)
- **Padding**: 24px all sides
- **Border radius**: 12px
- **Background**: White with subtle border (#e2e8f0)
- **Shadow**: Soft drop shadow (--shadow-md)

### Elements Breakdown

#### Profile Photo
- **Size**: 64px × 64px circle
- **Position**: Top-left, 24px from edges
- **Fallback**: Initials with primary color background
- **Border**: 2px solid background color for separation

#### Name & Status
- **Name**: H3 typography (20px, semibold)
- **Status Badge**: 
  - Active: Green background (#e8f5f0), green text (#1d7452)
  - Inactive: Gray background (#f1f5f9), gray text (#6b7280)
  - On Leave: Amber background (#fef3c7), amber text (#d97706)

#### Contact Information
- **Layout**: Horizontal row with bullet separator
- **Typography**: Base size (14px), gray-600 color
- **Icons**: 16px Lucide icons (mail, phone) with 8px spacing

#### Specializations
- **Display**: Comma-separated tags
- **Style**: Small pills with light background
- **Colors**: Different background tints for variety
- **Max display**: 3 specializations, "+2 more" for overflow

#### Groups Assignment
- **Format**: "Groups: " + comma-separated list
- **Style**: Regular text with group names as links
- **Truncation**: Max 2 lines with ellipsis

#### Action Buttons
- **Layout**: Three-button horizontal row
- **Button type**: Secondary outline style
- **Icons**: 16px icons with text labels
- **Spacing**: 8px gap between buttons

### States & Interactions

#### Default State
- Clean, professional appearance
- Subtle hover effect on entire card (shadow increase)
- Individual button hover states

#### Hover State
- **Card**: Shadow increases to --shadow-lg
- **Buttons**: Background color shift, icon color change
- **Duration**: 150ms ease-out transition

#### Loading State
- **Skeleton**: Animated placeholders for all content
- **Photo**: Gray circle with pulse animation
- **Text**: Gray bars with shimmer effect

#### Error State
- **Indicator**: Red left border (4px width)
- **Message**: Small error text at bottom
- **Actions**: Retry button replaces normal actions

### Multi-language Considerations
- **Name field**: Accommodate longer Uzbek/Russian names
- **Flexible height**: Card expands vertically as needed
- **Button text**: Minimum 80px width for translated labels
- **Right-to-left**: Future RTL support with mirrored layout

---

## Student Profile Card

### Design Specifications
```
┌─────────────────────────────────────────────┐
│ [Photo] Student Name            [Status]    │
│         Parent: John Doe                    │
│         Phone: +998 XX XXX XX XX           │
│         Groups: English A1, Math B2        │
│         Balance: $150 • Next: Jan 15       │
│         ┌─────────┐ ┌─────────┐ ┌─────────┐│
│         │ Profile │ │ Payment │ │ Archive ││
│         └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────────────┘
```

### Visual Properties
- **Dimensions**: 400px width × 320px height (minimum)
- **Layout**: Similar to teacher card with student-specific fields
- **Status colors**: 
  - Active: Green (#059669)
  - Inactive: Gray (#6b7280)
  - On Hold: Amber (#d97706)
  - Graduated: Blue (#2563eb)

### Student-Specific Elements

#### Parent Information
- **Label**: "Parent:" in gray-500
- **Name**: Clickable link to parent contact
- **Icon**: User icon (16px) for visual context

#### Financial Information
- **Balance**: Formatted currency with color coding
  - Positive: Green text
  - Negative: Red text with minus sign
  - Zero: Neutral gray
- **Next payment**: Date with calendar icon

#### Group Enrollment
- **Display**: Active groups only
- **Style**: Clickable badges with group colors
- **Schedule info**: Hover tooltip with class times

---

## Group Management Card

### Design Specifications
```
┌─────────────────────────────────────────────┐
│ Group Name                      [Capacity]  │
│ Teacher: Alice Johnson                      │
│ Schedule: Mon/Wed/Fri 14:00-15:30          │
│ Students: 12/15 enrolled                   │
│ ┌─────────────────────────────────────────┐ │
│ │ [Student avatars...]            +3 more │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │ Manage  │ │ Schedule│ │ Reports │       │
│ └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────┘
```

### Visual Properties
- **Dimensions**: 400px width × 300px height
- **Emphasis**: Group name as primary heading
- **Capacity indicator**: Visual progress bar

### Group-Specific Elements

#### Capacity Indicator
- **Format**: "12/15" with progress bar
- **Visual**: Horizontal bar showing fill percentage
- **Colors**: 
  - Under 80%: Primary green
  - 80-100%: Amber warning
  - Full: Success green

#### Student Avatars
- **Size**: 32px circles in overlapping row
- **Max display**: 8 avatars + count for overflow
- **Hover**: Individual student name tooltips
- **Empty**: Gray placeholder circles

#### Schedule Display
- **Format**: Days + time range
- **Abbreviations**: Mon/Tue/Wed format for space
- **Time**: 24-hour format (local preference)

---

## Data Table Component

### Design Specifications
```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────┐ Search... [Filter] [Export] [Add New]  │
│ └─[Quick filters]─┘                                        │
├─────────────────────────────────────────────────────────────┤
│ ☐ Name ↕        Phone           Status      Actions        │
├─────────────────────────────────────────────────────────────┤
│ ☐ Alice Johnson +998901234567   Active      [...] [...] [X]│
│ ☐ Bob Smith     +998901234568   Inactive    [...] [...] [X]│
│ ☐ Carol Davis   +998901234569   On Leave    [...] [...] [X]│
├─────────────────────────────────────────────────────────────┤
│ Showing 1-10 of 156    [<] [1] [2] [3] [>]    10 per page │
└─────────────────────────────────────────────────────────────┘
```

### Header Section
- **Height**: 80px with search and filters
- **Search**: Full-width input with search icon
- **Filters**: Dropdown with multi-select capability
- **Actions**: Right-aligned button group

### Table Structure
- **Row height**: 64px for comfortable content
- **Alternating rows**: Subtle background on even rows
- **Sticky header**: Remains visible during scroll
- **Responsive**: Horizontal scroll on mobile

### Column Specifications

#### Selection Column
- **Width**: 48px fixed
- **Content**: Checkbox with indeterminate state support
- **Header**: "Select all" functionality

#### Data Columns
- **Sortable indicators**: Up/down arrows on hover
- **Active sort**: Bold arrow with primary color
- **Resize handles**: Drag to adjust column width
- **Minimum width**: 120px per column

#### Actions Column
- **Width**: 120px fixed, right-aligned
- **Content**: Dropdown menu (3-dot icon)
- **Items**: View, Edit, Archive, Delete
- **Permissions**: Role-based action visibility

### States & Interactions

#### Loading State
- **Skeleton rows**: 10 animated placeholder rows
- **Shimmer effect**: Left-to-right loading animation
- **Duration**: While data fetches

#### Empty State
- **Illustration**: Simple education-themed graphic
- **Message**: Contextual empty state text
- **CTA**: "Add your first [entity]" button

#### Error State
- **Message bar**: Red background with error text
- **Retry action**: Button to reload data
- **Fallback**: Show cached data if available

---

## Form Components

### Input Field Specification
```
Label *
┌─────────────────────────────────────┐
│ Placeholder text               [icon]│
└─────────────────────────────────────┘
Helper text or error message
```

### Visual Properties
- **Height**: 44px for comfortable touch targets
- **Padding**: 12px horizontal, 10px vertical
- **Border**: 1px solid gray-300, 2px primary on focus
- **Typography**: 14px base size

### States
1. **Default**: Gray border, placeholder text
2. **Focus**: Primary border, no placeholder
3. **Filled**: Dark text, helper text below
4. **Error**: Red border, error message, warning icon
5. **Success**: Green border, checkmark icon
6. **Disabled**: Gray background, gray text, no interaction

### Multi-language Form Considerations
- **Label positioning**: Above input for text expansion
- **Error messages**: Multi-line support for translations
- **Required indicators**: Asterisk placement varies by language
- **Input width**: Flexible to accommodate longer text

---

## Modal & Drawer Specifications

### Modal Design
```
        Backdrop (rgba(0,0,0,0.5))
    ┌─────────────────────────────────────┐
    │ Title                          [X]  │
    ├─────────────────────────────────────┤
    │                                     │
    │        Content Area                 │
    │                                     │
    ├─────────────────────────────────────┤
    │              [Cancel] [Save]        │
    └─────────────────────────────────────┘
```

### Properties
- **Max width**: 600px for forms, 800px for data
- **Backdrop**: Semi-transparent black with blur
- **Animation**: 250ms scale + fade entrance
- **Close actions**: X button, backdrop click, ESC key

### Drawer Design (Mobile/Tablet)
- **Position**: Right slide-in for details
- **Width**: 400px on desktop, full-width on mobile
- **Animation**: 300ms slide transition
- **Overlay**: Darker backdrop than modal

---

## Navigation Components

### Sidebar Navigation
```
┌─────────────────────────┐
│ [Logo] Harry School     │
├─────────────────────────┤
│ 📊 Dashboard           │
│ 👥 Teachers            │
│ 👨‍🎓 Students             │
│ 📚 Groups              │
│ ⚙️ Settings            │
├─────────────────────────┤
│ [Avatar] Admin User     │
│ Sign Out                │
└─────────────────────────┘
```

### Properties
- **Width**: 240px default, 320px expanded, 64px collapsed
- **Background**: White with subtle border
- **Active state**: Primary color background with white text
- **Hover state**: Light gray background

### Top Navigation Bar
- **Height**: 64px fixed
- **Content**: Breadcrumb navigation, user menu, notifications
- **Background**: White with bottom border
- **Sticky**: Remains at top during scroll

---

## Status Badge Component

### Variations
```
Active    Inactive    On Hold    Graduated    Archived
[Green]   [Gray]      [Amber]    [Blue]       [Red]
```

### Properties
- **Height**: 24px
- **Padding**: 6px horizontal
- **Typography**: 12px medium weight
- **Border radius**: 12px (pill shape)
- **Icon**: Optional 14px icon with 4px spacing

### Implementation
```typescript
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'on-hold' | 'graduated' | 'archived';
  size?: 'sm' | 'md' | 'lg';
  icon?: boolean;
  className?: string;
}
```

---

## Loading States

### Skeleton Components
- **Cards**: Gray rectangles with rounded corners
- **Text**: Multiple gray bars of varying widths
- **Images**: Gray circles or rectangles
- **Animation**: Subtle left-to-right shimmer

### Progress Indicators
- **Linear**: Horizontal bar for page/form loading
- **Circular**: Spinner for button states
- **Step progress**: Multi-step form indicators

### Performance Considerations
- **Skeleton duration**: Show for minimum 300ms
- **Animation frame rate**: 60fps for smooth shimmer
- **Reduced motion**: Respect user preference settings