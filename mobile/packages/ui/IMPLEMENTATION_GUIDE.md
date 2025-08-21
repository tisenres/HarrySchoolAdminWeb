# Harry School Mobile UI - Component Implementation Guide

## Quick Start

This guide shows developers how to implement the premium UI components using the detailed specifications from `components.ts` and design tokens.

---

## 1. Button Component Implementation

### Basic Usage
```tsx
import { buttonSpecs } from '../theme/components';
import { useState } from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'bulk';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'leading' | 'trailing';
  celebration?: boolean; // Student theme only
  children: React.ReactNode;
  onPress?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'leading',
  celebration = false,
  children,
  onPress,
}) => {
  const [pressed, setPressed] = useState(false);
  
  // Get specifications from theme
  const variantSpec = buttonSpecs[variant];
  const sizeSpec = buttonSpecs.sizes[size];
  
  // Combine styles based on state
  const containerStyle = [
    variantSpec.default,
    sizeSpec,
    pressed && variantSpec.pressed,
    disabled && variantSpec.disabled,
    loading && variantSpec.loading,
  ];
  
  const textStyle = [
    variantSpec.text.default,
    sizeSpec.text,
    disabled && variantSpec.text.disabled,
  ];

  return (
    <Pressable
      style={containerStyle}
      onPress={!disabled && !loading ? onPress : undefined}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variantSpec.text.default.color} 
        />
      ) : (
        <>
          {icon && iconPosition === 'leading' && icon}
          <Text style={textStyle}>{children}</Text>
          {icon && iconPosition === 'trailing' && icon}
          {variant === 'bulk' && (
            <Text style={variantSpec.badge}>5</Text>
          )}
        </>
      )}
    </Pressable>
  );
};
```

### Celebration Animation (Student Theme)
```tsx
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

const CelebrationButton: React.FC<ButtonProps> = ({ celebration, ...props }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const celebrate = () => {
    if (celebration) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Button {...props} onPress={() => { props.onPress?.(); celebrate(); }} />
    </Animated.View>
  );
};
```

---

## 2. Card Component Implementation

### Basic Card
```tsx
import { cardSpecs } from '../theme/components';
import { View, Text, Pressable } from 'react-native';

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'interactive' | 'data' | 'visual';
  size?: 'compact' | 'default' | 'expanded';
  interactive?: boolean;
  syncStatus?: 'synced' | 'syncing' | 'error' | 'offline';
  children: React.ReactNode;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'default',
  interactive = false,
  syncStatus,
  children,
  onPress,
}) => {
  const [pressed, setPressed] = useState(false);
  
  const variantSpec = cardSpecs[variant];
  const sizeSpec = cardSpecs.sizes[size];
  
  const containerStyle = [
    variantSpec,
    sizeSpec,
    interactive && pressed && cardSpecs.interactive.pressed,
  ];

  const syncIndicatorStyle = {
    ...cardSpecs.data.syncIndicator,
    backgroundColor: getSyncColor(syncStatus),
  };

  const CardComponent = interactive ? Pressable : View;

  return (
    <CardComponent
      style={containerStyle}
      onPress={onPress}
      onPressIn={() => interactive && setPressed(true)}
      onPressOut={() => interactive && setPressed(false)}
    >
      {variant === 'data' && syncStatus && (
        <View style={syncIndicatorStyle} />
      )}
      {children}
    </CardComponent>
  );
};

const getSyncColor = (status?: string) => {
  switch (status) {
    case 'synced': return '#10b981';
    case 'syncing': return '#f59e0b';
    case 'error': return '#ef4444';
    default: return '#6b7280';
  }
};
```

### Swipe Actions (Advanced)
```tsx
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';

interface SwipeableCardProps extends CardProps {
  leftAction?: { icon: React.ReactNode; color: string; onPress: () => void };
  rightAction?: { icon: React.ReactNode; color: string; onPress: () => void };
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  leftAction,
  rightAction,
  children,
  ...cardProps
}) => {
  const translateX = useSharedValue(0);
  
  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      translateX.value = event.translationX;
    },
    onEnd: (event) => {
      if (event.translationX > 100 && leftAction) {
        runOnJS(leftAction.onPress)();
      } else if (event.translationX < -100 && rightAction) {
        runOnJS(rightAction.onPress)();
      }
      translateX.value = 0;
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ overflow: 'hidden' }}>
      {/* Action backgrounds */}
      {leftAction && (
        <Animated.View style={[styles.actionLeft, { backgroundColor: leftAction.color }]}>
          {leftAction.icon}
        </Animated.View>
      )}
      {rightAction && (
        <Animated.View style={[styles.actionRight, { backgroundColor: rightAction.color }]}>
          {rightAction.icon}
        </Animated.View>
      )}
      
      {/* Swipeable card */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={animatedStyle}>
          <Card {...cardProps}>{children}</Card>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};
```

---

## 3. Input Component Implementation

### Basic Input
```tsx
import { inputSpecs } from '../theme/components';
import { TextInput, View, Text, Animated } from 'react-native';

interface InputProps {
  variant?: 'default' | 'filled' | 'outlined' | 'underlined' | 'search';
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  label,
  placeholder,
  helperText,
  error,
  disabled = false,
  multiline = false,
  leadingIcon,
  trailingIcon,
  value,
  onChangeText,
  onFocus,
  onBlur,
}) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const labelAnim = useRef(new Animated.Value(hasValue || focused ? 1 : 0)).current;

  const variantSpec = inputSpecs[variant];
  const labelSpec = inputSpecs.label;
  const helperSpec = inputSpecs.helperText;

  const containerStyle = [
    variantSpec.default,
    focused && variantSpec.focused,
    error && variantSpec.error,
    disabled && variantSpec.disabled,
  ];

  const animateLabel = (toValue: number) => {
    Animated.timing(labelAnim, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleFocus = () => {
    setFocused(true);
    animateLabel(1);
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    if (!hasValue) animateLabel(0);
    onBlur?.();
  };

  const handleChangeText = (text: string) => {
    setHasValue(!!text);
    onChangeText?.(text);
  };

  return (
    <View style={{ marginVertical: 8 }}>
      {/* Floating Label */}
      {label && (
        <Animated.Text
          style={[
            labelSpec.default,
            focused && labelSpec.focused,
            error && labelSpec.error,
            {
              transform: [
                {
                  translateY: labelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                {
                  scale: labelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.85],
                  }),
                },
              ],
            },
          ]}
        >
          {label}
        </Animated.Text>
      )}

      {/* Input Container */}
      <View style={[containerStyle, { flexDirection: 'row', alignItems: 'center' }]}>
        {leadingIcon && <View style={{ marginRight: 12 }}>{leadingIcon}</View>}
        
        <TextInput
          style={{ flex: 1, ...variantSpec.default }}
          placeholder={focused ? '' : placeholder}
          placeholderTextColor={variantSpec.placeholder?.color}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          multiline={multiline}
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
        />

        {trailingIcon && <View style={{ marginLeft: 12 }}>{trailingIcon}</View>}
      </View>

      {/* Helper/Error Text */}
      {(helperText || error) && (
        <Text
          style={[
            helperSpec.default,
            error && helperSpec.error,
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};
```

---

## 4. Avatar Component Implementation

### Basic Avatar
```tsx
import { avatarSpecs } from '../theme/components';
import { View, Text, Image } from 'react-native';

interface AvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  source?: { uri: string };
  name?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  role?: 'teacher' | 'student' | 'admin';
  shape?: 'circle' | 'rounded';
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  source,
  name = '',
  status,
  role,
  shape = 'circle',
}) => {
  const sizeSpec = avatarSpecs.sizes[size];
  const statusSpec = status ? avatarSpecs.status[status] : null;
  const roleSpec = role ? avatarSpecs.roles[role] : null;
  const shapeSpec = avatarSpecs.shapes[shape];

  const containerStyle = [
    sizeSpec.container,
    shapeSpec,
    roleSpec,
    avatarSpecs.fallback,
  ];

  const statusIndicatorStyle = [
    sizeSpec.status,
    statusSpec,
    {
      position: 'absolute',
      bottom: 0,
      right: 0,
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const generateColor = (name: string) => {
    // Generate consistent color from name
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <View style={{ position: 'relative' }}>
      <View style={[containerStyle, { backgroundColor: generateColor(name) }]}>
        {source ? (
          <Image
            source={source}
            style={[sizeSpec.container, shapeSpec]}
            accessibilityLabel={`${name}'s avatar`}
          />
        ) : (
          <Text style={[sizeSpec.text, { color: '#ffffff' }]}>
            {getInitials(name)}
          </Text>
        )}
      </View>

      {status && <View style={statusIndicatorStyle} />}
    </View>
  );
};
```

---

## 5. Badge Component Implementation

### Notification Badge
```tsx
import { badgeSpecs } from '../theme/components';
import { View, Text } from 'react-native';

interface BadgeProps {
  type?: 'notification' | 'achievement' | 'status';
  variant?: 'gold' | 'silver' | 'bronze' | 'active' | 'pending' | 'inactive' | 'error';
  size?: 'small' | 'medium' | 'large';
  count?: number;
  showDot?: boolean;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  type = 'notification',
  variant,
  size = 'medium',
  count,
  showDot = false,
  children,
}) => {
  if (type === 'notification') {
    if (showDot || !count) {
      return <View style={badgeSpecs.notification.dot} />;
    }

    const displayCount = count > 99 ? '99+' : count.toString();

    return (
      <View style={badgeSpecs.notification.number}>
        <Text style={badgeSpecs.notification.text}>
          {displayCount}
        </Text>
      </View>
    );
  }

  if (type === 'achievement' && variant) {
    const achievementSpec = badgeSpecs.achievement[variant as keyof typeof badgeSpecs.achievement];
    return (
      <View style={[achievementSpec, { padding: 8, borderRadius: 12 }]}>
        {children}
      </View>
    );
  }

  if (type === 'status' && variant) {
    const statusSpec = badgeSpecs.status[variant as keyof typeof badgeSpecs.status];
    const sizeSpec = badgeSpecs.sizes[size];
    
    return (
      <View style={[statusSpec, sizeSpec, { borderRadius: sizeSpec.borderRadius }]}>
        <Text style={{ color: statusSpec.color, fontSize: sizeSpec.fontSize }}>
          {children}
        </Text>
      </View>
    );
  }

  return null;
};
```

### Achievement Badge with Animation
```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

const AnimatedAchievementBadge: React.FC<BadgeProps> = ({ variant, children }) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const celebrate = () => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    
    rotation.value = withSequence(
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  };

  useEffect(() => {
    celebrate();
  }, []);

  return (
    <Animated.View style={animatedStyle}>
      <Badge type="achievement" variant={variant}>
        {children}
      </Badge>
    </Animated.View>
  );
};
```

---

## 6. Loading Screen Implementation

### Comprehensive Loading Component
```tsx
import { loadingScreenSpecs } from '../theme/components';
import { View, Text, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface LoadingScreenProps {
  type?: 'spinner' | 'progressBar' | 'skeleton' | 'educational';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  progress?: number; // 0-100 for progress bar
  message?: string;
  estimatedTime?: number; // seconds
  educationalContent?: {
    word: string;
    definition: string;
    tip?: string;
  };
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  type = 'spinner',
  size = 'medium',
  progress = 0,
  message,
  estimatedTime,
  educationalContent,
}) => {
  const spec = loadingScreenSpecs[type];

  if (type === 'spinner') {
    const spinnerSpec = spec.sizes[size];
    
    return (
      <View style={spec.container}>
        <ActivityIndicator
          size={spinnerSpec.size}
          color={spec.colors.primary}
        />
        {message && (
          <Text style={{ marginTop: 12, fontSize: 14, textAlign: 'center' }}>
            {message}
          </Text>
        )}
      </View>
    );
  }

  if (type === 'progressBar') {
    const progressWidth = `${Math.min(Math.max(progress, 0), 100)}%`;
    
    return (
      <View style={spec.container}>
        {message && <Text style={spec.text}>{message}</Text>}
        
        <View style={spec.container}>
          <Animated.View 
            style={[spec.fill, { width: progressWidth }]} 
          />
        </View>

        <Text style={spec.text}>{Math.round(progress)}%</Text>
        
        {estimatedTime && (
          <Text style={spec.estimatedTime}>
            About {estimatedTime} seconds remaining
          </Text>
        )}
      </View>
    );
  }

  if (type === 'educational' && educationalContent) {
    const opacity = useSharedValue(0);
    
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    useEffect(() => {
      opacity.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true
      );
    }, []);

    return (
      <View style={spec.container}>
        <ActivityIndicator size="large" color={spec.colors?.primary} />
        
        <Animated.View style={[spec.content, animatedStyle]}>
          <Text style={spec.word}>
            {educationalContent.word}
          </Text>
          <Text style={spec.definition}>
            {educationalContent.definition}
          </Text>
          {educationalContent.tip && (
            <Text style={spec.tip}>
              💡 {educationalContent.tip}
            </Text>
          )}
        </Animated.View>
      </View>
    );
  }

  return null;
};
```

### Skeleton Component
```tsx
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  variant?: 'text' | 'title' | 'image' | 'card' | 'avatar';
  width?: number | string;
  height?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height,
}) => {
  const spec = loadingScreenSpecs.skeleton;
  const variantSpec = spec.variants[variant];
  
  const shimmerAnim = useSharedValue(-1);
  
  useEffect(() => {
    shimmerAnim.value = withRepeat(
      withTiming(1, { duration: spec.animation.duration }),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shimmerAnim.value * 200 },
    ],
  }));

  return (
    <View style={[
      {
        width,
        height: height || variantSpec.height,
        backgroundColor: spec.backgroundColor,
        borderRadius: variantSpec.borderRadius || spec.borderRadius,
        overflow: 'hidden',
        marginVertical: variantSpec.marginVertical || 0,
      },
    ]}>
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={spec.shimmer.colors}
          locations={spec.shimmer.locations}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '200%', height: '100%' }}
        />
      </Animated.View>
    </View>
  );
};
```

---

## 7. Theme-Aware Usage

### Accessing Theme Context
```tsx
import { useTheme } from '../theme/ThemeProvider';
import { buttonSpecs, cardSpecs } from '../theme/components';

const ThemedComponent = () => {
  const { theme, themeVariant } = useTheme();
  
  // Get theme-specific styles
  const getButtonStyle = (variant: string) => {
    const baseStyle = buttonSpecs[variant];
    
    if (themeVariant === 'teacher') {
      // Teacher theme: more subdued
      return {
        ...baseStyle,
        shadowOpacity: baseStyle.shadowOpacity * 0.5,
        backgroundColor: theme.colors.primary[600], // Darker
      };
    }
    
    if (themeVariant === 'student') {
      // Student theme: more vibrant
      return {
        ...baseStyle,
        shadowOpacity: baseStyle.shadowOpacity * 1.5,
        backgroundColor: theme.colors.primary[500], // Standard
      };
    }
    
    return baseStyle;
  };

  return (
    <Button 
      variant="primary"
      style={getButtonStyle('primary')}
    >
      Theme-aware button
    </Button>
  );
};
```

### Responsive Design
```tsx
import { useDeviceOrientation, useDimensions } from '@react-native-community/hooks';

const ResponsiveCard = ({ children }) => {
  const { width } = useDimensions().window;
  const { portrait } = useDeviceOrientation();
  
  const cardStyle = {
    ...cardSpecs.default,
    width: portrait ? width - 32 : (width - 48) / 2,
    marginHorizontal: portrait ? 16 : 8,
  };

  return (
    <Card style={cardStyle}>
      {children}
    </Card>
  );
};
```

---

## 8. Accessibility Implementation

### Screen Reader Support
```tsx
import { AccessibilityInfo } from 'react-native';

const AccessibleButton = ({ children, onPress, ...props }) => {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setScreenReaderEnabled(enabled);
    };
    checkScreenReader();
  }, []);

  return (
    <Button
      {...props}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={typeof children === 'string' ? children : 'Button'}
      accessibilityHint="Double tap to activate"
      accessibilityState={{ 
        disabled: props.disabled,
        busy: props.loading 
      }}
      // Enhanced touch target for screen readers
      style={[
        props.style,
        screenReaderEnabled && {
          minWidth: 48,
          minHeight: 48,
        }
      ]}
    >
      {children}
    </Button>
  );
};
```

### High Contrast Support
```tsx
import { AccessibilityInfo, useColorScheme } from 'react-native';

const HighContrastText = ({ children, style, ...props }) => {
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Check for high contrast preference
    const checkHighContrast = async () => {
      const enabled = await AccessibilityInfo.isHighContrastEnabled?.() || false;
      setHighContrastEnabled(enabled);
    };
    checkHighContrast();
  }, []);

  const enhancedStyle = [
    style,
    highContrastEnabled && {
      color: colorScheme === 'dark' ? '#ffffff' : '#000000',
      fontWeight: '600',
    }
  ];

  return (
    <Text style={enhancedStyle} {...props}>
      {children}
    </Text>
  );
};
```

---

## 9. Performance Optimization

### Memoized Components
```tsx
import { memo } from 'react';

export const OptimizedCard = memo<CardProps>(({ children, ...props }) => {
  return <Card {...props}>{children}</Card>;
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.variant === nextProps.variant &&
    prevProps.size === nextProps.size &&
    prevProps.syncStatus === nextProps.syncStatus
  );
});
```

### Lazy Loading
```tsx
import { lazy, Suspense } from 'react';

const EducationalCard = lazy(() => import('./EducationalCard'));

const LazyEducationalContent = () => (
  <Suspense fallback={<Skeleton variant="card" />}>
    <EducationalCard />
  </Suspense>
);
```

---

## 10. Testing Components

### Unit Tests Example
```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders correctly with primary variant', () => {
    const { getByText } = render(
      <Button variant="primary">Test Button</Button>
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress}>Pressable</Button>
    );
    
    fireEvent.press(getByText('Pressable'));
    expect(onPress).toHaveBeenCalled();
  });

  it('applies correct styles for different variants', () => {
    const { getByTestId, rerender } = render(
      <Button testID="button" variant="primary">Primary</Button>
    );
    
    const button = getByTestId('button');
    expect(button.props.style).toMatchObject({
      backgroundColor: '#1d7452',
    });

    rerender(
      <Button testID="button" variant="secondary">Secondary</Button>
    );
    
    expect(button.props.style).toMatchObject({
      backgroundColor: 'transparent',
      borderColor: '#1d7452',
    });
  });
});
```

### Accessibility Tests
```tsx
import { render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

describe('Button Accessibility', () => {
  it('has correct accessibility attributes', () => {
    const { getByRole } = render(
      <Button disabled>Disabled Button</Button>
    );
    
    const button = getByRole('button');
    expect(button).toHaveAccessibilityState({ disabled: true });
  });

  it('meets touch target size requirements', () => {
    const { getByTestId } = render(
      <Button testID="button" size="small">Small</Button>
    );
    
    const button = getByTestId('button');
    const { width, height } = button.props.style;
    
    // Minimum 44pt touch target
    expect(width).toBeGreaterThanOrEqual(44);
    expect(height).toBeGreaterThanOrEqual(44);
  });
});
```

---

## Quick Reference

### Import Components
```tsx
// Import specifications
import { 
  buttonSpecs, 
  cardSpecs, 
  inputSpecs,
  avatarSpecs,
  badgeSpecs,
  tabBarSpecs,
  headerSpecs,
  emptyStateSpecs,
  modalSpecs,
  loadingScreenSpecs
} from '@harry-school/ui/theme/components';

// Import tokens
import { 
  colors, 
  typography, 
  spacing, 
  shadows,
  touchTargets 
} from '@harry-school/ui/theme/tokens';
```

### Common Patterns
```tsx
// Get component variant
const spec = buttonSpecs.primary;
const style = [spec.default, pressed && spec.pressed];

// Combine with size
const sizeSpec = buttonSpecs.sizes.large;
const finalStyle = { ...spec.default, ...sizeSpec };

// Theme-aware colors
const color = theme.colors.primary[themeVariant === 'teacher' ? 600 : 500];

// Responsive dimensions
const cardWidth = width > 768 ? (width - 64) / 2 : width - 32;
```

### Performance Tips
1. Memoize static styles outside components
2. Use `StyleSheet.create()` for better performance
3. Prefer transforms over layout changes
4. Use `getItemLayout` for long lists
5. Implement proper `keyExtractor` for FlatList

---

*This implementation guide provides everything developers need to build premium, accessible, and performant UI components using the Harry School design system.*