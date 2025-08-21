/**
 * Dashboard Actions Component
 * Harry School Student Mobile App
 * 
 * Floating Action Button with quick actions menu
 * Age-adaptive design and functionality
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import { QuickActionButton } from '@harry-school/ui';
import type { StudentAgeGroup } from '../../navigation/types';
import { theme } from '@harry-school/ui/theme';

interface DashboardActionsProps {
  ageGroup: StudentAgeGroup;
  onQuickAction: (action: string) => void;
  style?: ViewStyle;
  testID?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const DashboardActions: React.FC<DashboardActionsProps> = ({
  ageGroup,
  onQuickAction,
  style,
  testID,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Animation values
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  
  // Age-specific quick actions
  const quickActions = useMemo(() => {
    const isElementary = ageGroup === '10-12';
    
    const baseActions: QuickAction[] = [
      {
        id: 'homework',
        label: isElementary ? 'Homework' : 'Assignments',
        icon: '📝',
        color: theme.colors.educational.subjects.english,
        description: 'View and complete homework',
      },
      {
        id: 'practice',
        label: isElementary ? 'Fun Practice' : 'Practice',
        icon: '🎯',
        color: theme.colors.educational.subjects.math,
        description: 'Practice vocabulary and skills',
      },
      {
        id: 'progress',
        label: 'My Progress',
        icon: '📊',
        color: theme.colors.educational.subjects.science,
        description: 'View learning progress',
      },
    ];

    if (isElementary) {
      // Add games for elementary students
      baseActions.splice(1, 0, {
        id: 'games',
        label: 'Games',
        icon: '🎮',
        color: theme.colors.educational.subjects.arts,
        description: 'Play educational games',
      });
    } else {
      // Add study planner for secondary students
      baseActions.push({
        id: 'planner',
        label: 'Study Plan',
        icon: '📅',
        color: theme.colors.educational.subjects.history,
        description: 'Plan study sessions',
      });
    }

    return baseActions;
  }, [ageGroup]);

  // Main action configuration
  const mainAction = useMemo(() => {
    const isElementary = ageGroup === '10-12';
    
    return {
      icon: isExpanded ? '✕' : '+',
      backgroundColor: isExpanded 
        ? theme.colors.semantic.error.main 
        : theme.colors.primary.main,
      size: isElementary ? 'large' : 'medium',
    };
  }, [ageGroup, isExpanded]);

  // Toggle expansion
  const toggleExpansion = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // Animate main button rotation
    Animated.timing(rotateAnimation, {
      toValue: newExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Animate quick actions scale
    Animated.stagger(50, 
      quickActions.map((_, index) => 
        Animated.timing(scaleAnimation, {
          toValue: newExpanded ? 1 : 0,
          duration: 200,
          delay: newExpanded ? index * 50 : 0,
          useNativeDriver: true,
        })
      )
    ).start();
  };

  // Handle quick action press
  const handleQuickActionPress = (actionId: string) => {
    onQuickAction(actionId);
    
    // Collapse menu after selection
    setTimeout(() => {
      setIsExpanded(false);
      Animated.timing(rotateAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      Animated.timing(scaleAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, 100);
  };

  // Rotation interpolation
  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Quick Actions Menu */}
      {isExpanded && (
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action, index) => (
            <Animated.View
              key={action.id}
              style={[
                styles.quickActionWrapper,
                {
                  transform: [{ scale: scaleAnimation }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.quickActionButton,
                  { backgroundColor: action.color },
                ]}
                onPress={() => handleQuickActionPress(action.id)}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                accessibilityHint={action.description}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
              </TouchableOpacity>
              
              <View style={styles.quickActionLabel}>
                <Text style={styles.quickActionText}>{action.label}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Background Overlay */}
      {isExpanded && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setIsExpanded(false)}
          activeOpacity={1}
        />
      )}

      {/* Main FAB */}
      <TouchableOpacity
        style={[
          styles.mainButton,
          {
            backgroundColor: mainAction.backgroundColor,
            width: mainAction.size === 'large' ? 64 : 56,
            height: mainAction.size === 'large' ? 64 : 56,
            borderRadius: mainAction.size === 'large' ? 32 : 28,
          },
        ]}
        onPress={toggleExpansion}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? 'Close quick actions' : 'Open quick actions'}
        accessibilityHint="Quick access to common actions"
        accessibilityState={{ expanded: isExpanded }}
      >
        <Animated.View
          style={{
            transform: [{ rotate: rotateInterpolate }],
          }}
        >
          <Text style={[
            styles.mainButtonIcon,
            { fontSize: mainAction.size === 'large' ? 28 : 24 }
          ]}>
            {mainAction.icon}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  
  overlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: -1,
  },
  
  quickActionsContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    zIndex: 1,
  },
  
  quickActionWrapper: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  quickActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  
  quickActionIcon: {
    fontSize: 20,
  },
  
  quickActionLabel: {
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: theme.spacing.xs,
    elevation: 2,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  
  mainButton: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 2,
  },
  
  mainButtonIcon: {
    color: theme.colors.text.inverse,
    fontWeight: 'bold',
  },
});

export default DashboardActions;