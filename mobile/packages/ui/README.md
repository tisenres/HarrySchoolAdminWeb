# Harry School Mobile Design System

A comprehensive design system for the Harry School mobile applications, providing design tokens, components, and theming capabilities optimized for educational apps.

## 🎨 Design Tokens

The design system is built around a comprehensive set of design tokens that ensure consistency across all components and applications.

### Colors

```typescript
import { colors } from '@harry-school/ui';

// Primary brand colors
colors.primary[500] // #1d7452 (Primary brand color)
colors.primary[300] // Lighter variant
colors.primary[700] // Darker variant

// Semantic colors
colors.semantic.success // #10b981
colors.semantic.warning // #f59e0b
colors.semantic.error   // #ef4444
colors.semantic.info    // #3b82f6

// Educational ranking colors
colors.ranking.gold   // #FFD700
colors.ranking.silver // #C0C0C0
colors.ranking.bronze // #CD7F32
```

### Typography

Based on the Inter font family with mobile-optimized sizes:

```typescript
import { typography } from '@harry-school/ui';

// Font sizes (in pixels)
typography.fontSize.xs   // 12
typography.fontSize.base // 16
typography.fontSize.xl   // 20
typography.fontSize['4xl'] // 36

// Font weights
typography.fontWeight.regular  // '400'
typography.fontWeight.medium   // '500'
typography.fontWeight.semibold // '600'
typography.fontWeight.bold     // '700'
```

### Spacing

Consistent spacing scale for layouts:

```typescript
import { spacing } from '@harry-school/ui';

// Spacing values (in pixels)
spacing.xs   // 4
spacing.sm   // 8
spacing.md   // 16
spacing.lg   // 24
spacing.xl   // 32
spacing['2xl'] // 48
```

### Border Radius

```typescript
import { borderRadius } from '@harry-school/ui';

borderRadius.sm   // 4
borderRadius.md   // 8
borderRadius.lg   // 12
borderRadius.xl   // 16
borderRadius.full // 9999
```

### Shadows

Cross-platform shadow system with both iOS and Android support:

```typescript
import { shadows } from '@harry-school/ui';

// Each shadow includes shadowColor, shadowOffset, shadowOpacity, shadowRadius, and elevation
shadows.sm // Subtle shadow
shadows.md // Medium shadow
shadows.lg // Large shadow
shadows.xl // Extra large shadow
```

## 🎭 Theme Provider

The `ThemeProvider` component provides theme context to your entire application with support for multiple variants and automatic dark mode detection.

### Basic Setup

```typescript
import React from 'react';
import { ThemeProvider } from '@harry-school/ui';

export default function App() {
  return (
    <ThemeProvider variant="student">
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

### Theme Variants

- `default`: Standard Harry School theme
- `student`: Vibrant colors optimized for student engagement
- `teacher`: Professional colors for educator interface
- `dark`: Dark mode theme
- `auto`: Automatically switches based on system preference

### Using Theme Context

```typescript
import { useTheme, useColors, useTypography, useSpacing } from '@harry-school/ui';

function MyComponent() {
  // Access full theme object
  const { theme, variant, isDark } = useTheme();
  
  // Or use specific hooks for better performance
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();
  
  return (
    <View style={{
      backgroundColor: colors.background.primary,
      padding: spacing.md,
      borderRadius: theme.tokens.borderRadius.lg,
    }}>
      <Text style={[typography.textStyles.heading3]}>
        Hello World
      </Text>
    </View>
  );
}
```

## 🎯 Educational App Integration

### Student App Setup

```typescript
import { ThemeProvider } from '@harry-school/ui';

export default function StudentApp() {
  return (
    <ThemeProvider variant="student">
      {/* Student app components */}
    </ThemeProvider>
  );
}
```

### Teacher App Setup

```typescript
import { ThemeProvider } from '@harry-school/ui';

export default function TeacherApp() {
  return (
    <ThemeProvider variant="teacher">
      {/* Teacher app components */}
    </ThemeProvider>
  );
}
```

### Educational-Specific Components

The design system includes components optimized for educational use:

```typescript
import { RankingBadge, VocabularyCard, TaskCard } from '@harry-school/ui';

// Ranking badge for student achievements
<RankingBadge variant="gold" rank={1} />

// Vocabulary flashcard
<VocabularyCard
  word="Hello"
  translation="Здравствуйте"
  onFlip={() => {}}
/>

// Task status card
<TaskCard
  variant="inProgress"
  title="Complete Chapter 5"
  dueDate="2024-01-15"
/>
```

## 📱 Touch Targets & Accessibility

All components follow WCAG AA guidelines with proper touch targets:

```typescript
import { touchTargets } from '@harry-school/ui';

// Minimum touch target (44px for iOS compliance)
touchTargets.minimum // 44

// Recommended touch target (48px for Material Design)
touchTargets.recommended // 48
```

## 🎨 Component Styling

Access pre-defined component styles through the theme:

```typescript
import { useComponents } from '@harry-school/ui';

function CustomButton() {
  const components = useComponents();
  
  return (
    <TouchableOpacity style={components.Button.variants.primary}>
      <Text>Primary Button</Text>
    </TouchableOpacity>
  );
}
```

## 🌙 Dark Mode Support

The design system automatically handles dark mode:

```typescript
import { useTheme } from '@harry-school/ui';

function ThemedComponent() {
  const { isDark, colors } = useTheme();
  
  return (
    <View style={{
      backgroundColor: colors.background.primary, // Automatically switches
    }}>
      {isDark ? '🌙' : '☀️'}
    </View>
  );
}
```

## 🎬 Animation Integration

Pre-configured animations work seamlessly with the theme:

```typescript
import { useAnimations } from '@harry-school/ui';
import { Animated } from 'react-native';

function AnimatedComponent() {
  const animations = useAnimations();
  
  const fadeIn = () => {
    Animated.timing(opacity, {
      ...animations.fade,
      toValue: 1,
    }).start();
  };
  
  return <Animated.View style={{ opacity }} />;
}
```

## 📦 Package Structure

```
mobile/packages/ui/
├── theme/
│   ├── tokens.ts          # Core design tokens
│   ├── colors.ts          # Color system
│   ├── typography.ts      # Typography system
│   ├── spacing.ts         # Spacing utilities
│   ├── animations.ts      # Animation presets
│   ├── theme.ts           # Main theme object
│   ├── ThemeProvider.tsx  # React context provider
│   └── index.ts           # Theme exports
├── components/            # UI components
├── assets/               # Static assets
└── index.ts              # Main package exports
```

## 🚀 Best Practices

1. **Always use the ThemeProvider** at the root of your app
2. **Use theme hooks** instead of importing tokens directly
3. **Follow the spacing scale** for consistent layouts
4. **Use semantic colors** for better maintainability
5. **Test in both light and dark modes**
6. **Ensure touch targets meet minimum sizes**
7. **Use educational variants** for app-specific theming

## 📚 Examples

Check the `/examples` directory for complete implementation examples and usage patterns.

## 🔧 Contributing

When adding new tokens or components:

1. Follow the existing naming conventions
2. Ensure accessibility compliance
3. Test across different theme variants
4. Update documentation and examples
5. Consider both Student and Teacher app use cases