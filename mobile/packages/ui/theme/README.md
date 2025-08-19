# Harry School Mobile Design System

A comprehensive design system for Harry School's Teacher and Student mobile applications, built with React Native and optimized for educational use cases.

## Overview

This design system provides a complete set of design tokens, components, and utilities specifically crafted for educational mobile applications. It supports both Teacher and Student apps with appropriate variations for each user type.

## Key Features

- **Mobile-First Design**: Optimized for touch interfaces and mobile devices
- **Educational Focus**: Specialized components for learning experiences
- **Accessibility Compliant**: WCAG 2.1 AA compliant design patterns
- **Responsive**: Adapts to different screen sizes and orientations
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Modular**: Easily extensible and customizable components

## Design Principles

### 1. **Clarity**
- Clean, uncluttered interfaces that focus on content
- Clear visual hierarchy with proper typography scale
- Consistent iconography and visual language

### 2. **Accessibility** 
- Minimum 44px touch targets for all interactive elements
- High contrast color combinations (WCAG AA compliant)
- Clear focus indicators and keyboard navigation support
- Support for screen readers and assistive technologies

### 3. **Educational Appropriateness**
- Age-appropriate design for students (10-18 years)
- Professional appearance for teacher interfaces
- Gamification elements that encourage learning
- Clear progress indicators and feedback systems

### 4. **Performance**
- Lightweight components optimized for mobile performance
- Efficient color and spacing systems
- Smooth animations and transitions

## Core Tokens

### Colors

#### Primary Brand Color
- **Main**: `#1d7452` - Harry School's signature green
- **Palette**: 50-950 shades for complete coverage
- **Usage**: Primary actions, branding, navigation

#### Ranking Colors
- **Gold**: `#f59e0b` - 1st place achievements
- **Silver**: `#64748b` - 2nd place achievements  
- **Bronze**: `#cd6155` - 3rd place achievements

#### Semantic Colors
- **Success**: Green tones for positive actions
- **Warning**: Orange/yellow for alerts
- **Error**: Red tones for errors and critical actions
- **Info**: Blue tones for informational content

#### Educational Colors
```typescript
subjects: {
  english: '#3b82f6',    // Blue
  math: '#1d7452',       // Primary green
  science: '#22c55e',    // Green
  history: '#d97706',    // Orange
  // ... more subjects
}

taskStatus: {
  notStarted: '#a3a3a3',
  inProgress: '#f59e0b', 
  completed: '#22c55e',
  overdue: '#ef4444',
  // ... more statuses
}
```

### Typography

Built on **Inter** font family for excellent readability on mobile screens.

#### Font Sizes (Mobile Optimized)
- **xs**: 12px - Small labels, badges
- **sm**: 14px - Captions, secondary text
- **base**: 16px - Body text (default)
- **lg**: 18px - Large body text
- **xl**: 20px - Small headings
- **2xl**: 24px - Medium headings  
- **3xl**: 28px - Large headings
- **4xl**: 32px - Page titles
- **5xl**: 36px - Hero text

#### Text Styles
```typescript
// Headings
h1, h2, h3, h4, h5, h6

// Body text
body, bodyLarge, bodySmall

// Interactive
button, buttonLarge, buttonSmall
link, linkSmall

// Educational specific
gradeDisplay, scoreDisplay, rankingNumber
vocabularyWord, vocabularyDefinition
lessonTitle, taskInstruction

// Form elements
label, input, placeholder, helperText, errorText
```

### Spacing

Based on **4px grid system** for visual consistency.

#### Scale
- **1**: 4px - Minimal spacing
- **2**: 8px - Small spacing
- **3**: 12px - Medium spacing
- **4**: 16px - Default spacing
- **6**: 24px - Large spacing
- **8**: 32px - Extra large spacing
- **11**: 44px - Minimum touch target
- **12**: 48px - Comfortable touch target

#### Component Spacing
```typescript
button: {
  paddingHorizontal: { small: 12px, medium: 16px, large: 24px },
  paddingVertical: { small: 8px, medium: 12px, large: 16px },
}

card: {
  padding: 16px,
  margin: 16px,
  gap: 12px,
}

educational: {
  lessonPadding: 16px,
  taskGap: 16px,
  vocabularyCardPadding: 20px,
  rankingItemGap: 12px,
}
```

### Touch Targets

Designed for comfortable mobile interaction:

- **Minimum**: 44px (WCAG AA requirement)
- **Comfortable**: 48px (recommended default)
- **Large**: 56px (primary actions)
- **Extra Large**: 64px (hero buttons)

## Component Specifications

### Buttons

#### Variants
- **Primary**: Filled button with brand color
- **Secondary**: Outlined button 
- **Ghost**: Text-only button

#### Sizes
- **Small**: 44px height, compact padding
- **Medium**: 48px height, standard padding
- **Large**: 56px height, generous padding

```typescript
// Usage example
const buttonSpec = getButtonSpec('primary', 'large');
```

### Cards

#### Variants
- **Default**: Standard card with subtle shadow
- **Elevated**: Prominent card with stronger shadow
- **Outlined**: Border-only card without shadow
- **Interactive**: Pressable card with press states

### Educational Components

#### Ranking Badge
Circular badge for displaying student rankings with position-specific colors.

#### Progress Bar
Horizontal progress indicator for learning progress, task completion, etc.

#### Vocabulary Card
Flip-able card component for vocabulary learning with word/definition sides.

#### Task Card
Content card for displaying lessons, assignments, and homework with status indicators.

#### Quiz Option
Selectable option component for quizzes with correct/incorrect states.

## Usage Examples

### Basic Theme Usage

```typescript
import { harrySchoolTheme, getTextStyle, getSpacing } from '@harry-school/ui/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: harrySchoolTheme.colors.semantic.background.primary,
    padding: getSpacing(4), // 16px
  },
  title: {
    ...getTextStyle('h2'),
    color: harrySchoolTheme.colors.semantic.text.primary,
    marginBottom: getSpacing(3), // 12px
  },
  button: {
    ...harrySchoolTheme.components.utils.getButtonSpec('primary', 'medium'),
  },
});
```

### Educational Component Usage

```typescript
import { getEducationalSpec, getSubjectColor } from '@harry-school/ui/theme';

const VocabularyCard = ({ word, definition, subject }) => {
  const cardSpec = getEducationalSpec('vocabularyCard');
  const subjectColor = getSubjectColor(subject);
  
  return (
    <View style={[cardSpec.container, { borderLeftColor: subjectColor }]}>
      <Text style={cardSpec.word}>{word}</Text>
      <Text style={cardSpec.definition}>{definition}</Text>
    </View>
  );
};
```

### Responsive Design

```typescript
import { breakpoints } from '@harry-school/ui/theme';

const ResponsiveText = ({ screenWidth, children }) => {
  const fontSize = breakpoints.responsive({
    mobile: 16,
    tablet: 18,
    desktop: 20,
  }, screenWidth);
  
  return <Text style={{ fontSize }}>{children}</Text>;
};
```

## Theme Variants

### Student Theme
Optimized for younger users with:
- Slightly larger touch targets
- More engaging color emphasis
- Gamification-focused design elements

### Teacher Theme  
Professional interface with:
- Data visualization colors
- Status indicators for educational content
- Clean, efficient layouts

### Dark Mode
Complete dark mode support with:
- Accessibility-compliant contrast ratios
- Appropriate color inversions
- Maintained brand identity

## Accessibility Features

- **High Contrast**: All color combinations meet WCAG AA standards
- **Touch Targets**: Minimum 44px for all interactive elements
- **Focus Indicators**: Clear visual focus for keyboard navigation
- **Screen Reader Support**: Semantic color naming and descriptions
- **Flexible Text**: Scalable typography system

## Best Practices

### Color Usage
- Always use semantic colors instead of raw palette values
- Test color combinations for accessibility compliance
- Use educational colors for subject-specific content
- Maintain sufficient contrast ratios

### Typography
- Use text styles instead of custom font specifications
- Maintain consistent line heights for readability
- Consider text scaling for accessibility
- Use appropriate text styles for content hierarchy

### Spacing
- Stick to the 4px grid system
- Use component spacing for consistent layouts
- Ensure adequate touch target spacing
- Consider responsive spacing for different screen sizes

### Components
- Use specification utilities for consistent styling
- Maintain proper component states (default, pressed, disabled)
- Follow educational design patterns for learning content
- Test components across different screen sizes

## Performance Considerations

- **Bundle Size**: Modular imports to reduce bundle size
- **Memory Usage**: Efficient color and spacing systems
- **Render Performance**: Optimized component specifications
- **Animation Performance**: Hardware-accelerated transforms

## Contributing

When extending the design system:

1. Follow existing naming conventions
2. Maintain accessibility standards
3. Add TypeScript type definitions
4. Include usage examples
5. Test across different screen sizes
6. Consider educational use cases

## Migration Guide

For migrating from custom styling to the design system:

1. Replace hardcoded colors with semantic colors
2. Use text styles instead of custom typography
3. Apply spacing scale consistently
4. Adopt component specifications
5. Implement accessibility improvements

This design system ensures consistent, accessible, and educationally-appropriate mobile experiences across Harry School's Teacher and Student applications.