/**
 * Harry School Mobile Design System - Accessibility Guidelines
 * 
 * WCAG AA compliant accessibility specifications for mobile educational apps
 * Based on UX research findings for inclusive design
 */

import { colors, spacing, typography, touchTargets, opacity } from './tokens';

// WCAG AA Compliance Standards
export const accessibilityStandards = {
  // Contrast ratios (WCAG AA minimum requirements)
  contrast: {
    normalText: 4.5,      // Minimum for normal text
    largeText: 3.0,       // Minimum for large text (18pt+)
    enhanced: 7.0,        // AAA level for enhanced accessibility
    nonText: 3.0,         // UI components and graphical objects
  },
  
  // Touch target requirements
  touchTargets: {
    minimum: 44,          // iOS minimum (9mm)
    recommended: 48,      // Material Design recommendation
    spacing: 8,           // Minimum spacing between targets
  },
  
  // Motion and animation
  motion: {
    duration: {
      maximum: 5000,      // 5 seconds max for any animation
      attention: 3000,    // 3 seconds for attention-getting animations
    },
    reducedMotion: {
      respectPreference: true,
      fallbackDuration: 0,
    },
  },
  
  // Text requirements
  text: {
    minimumSize: 12,      // Minimum readable text size
    recommendedSize: 16,  // Recommended body text size
    lineHeight: 1.5,      // Minimum line height ratio
    characterSpacing: 0.12, // Minimum letter spacing
    wordSpacing: 0.16,    // Minimum word spacing
  },
};

// High Contrast Theme Colors (for accessibility preferences)
export const highContrastColors = {
  // Pure black and white for maximum contrast
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    inverse: '#000000',
  },
  
  text: {
    primary: '#000000',   // 21:1 contrast ratio
    secondary: '#212121', // 16:1 contrast ratio
    inverse: '#FFFFFF',
    disabled: '#757575',  // 4.6:1 contrast ratio (AA compliant)
  },
  
  // High contrast UI elements
  ui: {
    focus: '#005FCC',     // High contrast focus indicator
    error: '#D32F2F',     // High contrast error
    success: '#2E7D32',   // High contrast success
    warning: '#F57C00',   // High contrast warning
  },
  
  // High contrast borders
  border: {
    primary: '#000000',
    secondary: '#424242',
    focus: '#005FCC',
  },
};

// Focus Management
export const focusManagement = {
  // Focus indicator styles
  focusIndicator: {
    width: 2,
    color: colors.accessibility.focus,
    offset: 2,
    borderRadius: 4,
    opacity: 1,
    // Ensure focus is visible on all backgrounds
    boxShadow: `0 0 0 2px ${colors.accessibility.focus}, 0 0 0 4px ${colors.accessibility.focusRing}`,
  },
  
  // Focus order for educational components
  focusOrder: {
    // Navigation elements first
    navigation: 1,
    // Main content area
    content: 2,
    // Secondary actions
    secondary: 3,
    // Tertiary elements (footer, etc.)
    tertiary: 4,
  },
  
  // Skip links for keyboard navigation
  skipLinks: {
    container: {
      position: 'absolute',
      top: -40,
      left: 6,
      backgroundColor: colors.background.primary,
      color: colors.text.primary,
      padding: spacing.sm,
      borderRadius: 4,
      zIndex: 9999,
      textDecoration: 'none',
    },
    focused: {
      top: 6,
    },
  },
};

// Screen Reader Support
export const screenReaderSupport = {
  // Semantic roles for educational components
  roles: {
    vocabularyCard: 'article',
    taskCard: 'article',
    progressIndicator: 'progressbar',
    rankingList: 'list',
    rankingItem: 'listitem',
    achievementBadge: 'img', // Will have alt text
    quiz: 'form',
    quizQuestion: 'group',
    quizOption: 'radio',
  },
  
  // ARIA labels for common educational interactions
  ariaLabels: {
    // Teacher app labels
    attendanceButton: 'Mark attendance for {studentName}',
    gradeInput: 'Enter grade for {studentName} in {subject}',
    generateHomework: 'Generate homework using AI for {groupName}',
    viewProgress: 'View progress for {studentName}',
    
    // Student app labels
    startLesson: 'Start lesson: {lessonTitle}',
    practiceVocabulary: 'Practice vocabulary: {wordCount} words',
    checkProgress: 'Check your progress in {skill}',
    viewAchievements: 'View your achievements',
    playAudio: 'Play pronunciation for {word}',
    nextCard: 'Go to next vocabulary card',
    previousCard: 'Go to previous vocabulary card',
    
    // Progress indicators
    skillProgress: '{skill} progress: {percentage}% complete',
    lessonProgress: 'Lesson progress: {completed} of {total} activities completed',
    streakCounter: 'Learning streak: {days} days',
    rankingPosition: 'Your ranking: {position} out of {total} students',
  },
  
  // Descriptive text for complex UI elements
  descriptions: {
    progressRing: 'Circular progress indicator showing {percentage}% completion',
    rankingBadge: 'Ranking badge showing position {position} with {medal} medal',
    achievementBadge: 'Achievement unlocked: {title} - {description}',
    vocabularyCard: 'Vocabulary card showing word {word} with definition {definition}',
  },
};

// Motor Accessibility
export const motorAccessibility = {
  // Touch target specifications
  touchTargets: {
    // Enhanced touch targets for motor disabilities
    minimum: touchTargets.minimum,
    comfortable: touchTargets.recommended,
    accessible: 56, // Larger for motor accessibility
    
    // Spacing requirements
    spacing: {
      minimum: 8,     // Minimum space between targets
      comfortable: 16, // Comfortable spacing
    },
  },
  
  // Gesture alternatives
  gestures: {
    // Provide alternatives to complex gestures
    swipeAlternatives: true,    // Tap buttons instead of swipes
    pinchAlternatives: true,    // Zoom buttons instead of pinch
    dragAlternatives: true,     // Click/tap instead of drag
    longPressAlternatives: true, // Double tap instead of long press
  },
  
  // Timing considerations
  timing: {
    // Extended time limits for motor disabilities
    defaultTimeout: 30000,     // 30 seconds default
    extendedTimeout: 120000,   // 2 minutes extended
    noTimeLimit: true,         // Option to disable time limits
  },
};

// Cognitive Accessibility
export const cognitiveAccessibility = {
  // Simple language guidelines
  language: {
    // Use simple, clear language
    complexityLevel: 'elementary', // Target elementary reading level
    sentenceLength: 20,        // Maximum words per sentence
    paragraphLength: 3,        // Maximum sentences per paragraph
    
    // Avoid jargon
    useSimpleWords: true,
    provideGlossary: true,
    
    // Clear instructions
    instructionFormat: 'step-by-step',
    useExamples: true,
    provideContext: true,
  },
  
  // Error prevention and recovery
  errorHandling: {
    // Prevent errors where possible
    validation: 'real-time',
    confirmations: true,
    undoActions: true,
    
    // Clear error messages
    errorMessages: {
      specific: true,           // Specific, not generic
      constructive: true,       // Tell user how to fix
      polite: true,            // Friendly tone
    },
    
    // Recovery assistance
    autoSave: true,
    recoverSession: true,
    helpAvailable: true,
  },
  
  // Consistent interface patterns
  consistency: {
    navigation: 'identical',    // Same navigation throughout
    terminology: 'consistent',  // Same words for same concepts
    layout: 'predictable',     // Consistent layout patterns
    feedback: 'standardized',   // Consistent feedback patterns
  },
};

// Visual Accessibility
export const visualAccessibility = {
  // Color considerations
  color: {
    // Never use color alone to convey information
    colorAlone: false,
    
    // Provide multiple visual cues
    useIcons: true,
    usePatterns: true,
    useText: true,
    
    // Color blind friendly palette
    colorBlindSafe: true,
    
    // High contrast options
    highContrastAvailable: true,
    customContrastSettings: true,
  },
  
  // Typography for visual accessibility
  typography: {
    // Scalable text
    respectSystemFontSize: true,
    maximumScale: 200,         // Support up to 200% scaling
    minimumContrast: accessibilityStandards.contrast.normalText,
    
    // Font characteristics
    readableFonts: true,       // Use highly readable fonts
    avoidDecorative: true,     // Avoid decorative fonts for body text
    
    // Spacing for readability
    lineSpacing: 1.5,          // Minimum line spacing
    paragraphSpacing: 2,       // Space between paragraphs
    letterSpacing: 'normal',   // Don't compress letters
  },
};

// Audio Accessibility
export const audioAccessibility = {
  // For pronunciation and audio content
  audioControls: {
    playPause: true,           // Always provide play/pause
    volumeControl: true,       // Volume adjustment
    speedControl: true,        // Playback speed (0.5x to 2x)
    
    // Visual indicators
    visualPlayback: true,      // Visual indication of playback
    captions: true,           // Captions where appropriate
    transcripts: true,        // Text transcripts available
  },
  
  // Audio alternatives
  alternatives: {
    textEquivalent: true,     // Text version of all audio
    visualCues: true,         // Visual cues for audio feedback
    hapticFeedback: true,     // Vibration for audio cues
  },
};

// Platform-Specific Accessibility
export const platformAccessibility = {
  // iOS accessibility features
  ios: {
    voiceOver: true,          // VoiceOver support
    switchControl: true,      // Switch Control support
    assistiveTouch: true,     // AssistiveTouch support
    dynamicType: true,        // Dynamic Type support
    reduceMotion: true,       // Reduce Motion support
    increaseContrast: true,   // Increase Contrast support
  },
  
  // Android accessibility features
  android: {
    talkBack: true,           // TalkBack support
    selectToSpeak: true,      // Select to Speak support
    switchAccess: true,       // Switch Access support
    fontSizeScaling: true,    // Font size scaling
    removeAnimations: true,   // Remove animations option
    highContrastText: true,   // High contrast text
  },
};

// Testing Guidelines
export const accessibilityTesting = {
  // Automated testing
  automated: {
    // Tools to use
    tools: ['axe-core', 'react-native-accessibility-engine'],
    frequency: 'continuous',
    coverage: 'all-screens',
  },
  
  // Manual testing checklist
  manual: {
    screenReader: true,       // Test with screen readers
    keyboardNavigation: true, // Test keyboard-only navigation
    colorContrast: true,      // Verify color contrast ratios
    textScaling: true,        // Test at 200% text size
    reducedMotion: true,      // Test with reduced motion
    highContrast: true,       // Test in high contrast mode
  },
  
  // User testing
  userTesting: {
    withDisabilities: true,   // Include users with disabilities
    diverseAbilities: true,   // Test various disability types
    realDevices: true,        // Test on actual devices
    assistiveTech: true,      // Test with assistive technologies
  },
};

// Educational Context Accessibility
export const educationalAccessibility = {
  // Learning differences support
  learningDifferences: {
    // Multiple learning styles
    visual: true,             // Visual learning support
    auditory: true,           // Auditory learning support
    kinesthetic: true,        // Interactive learning support
    
    // Dyslexia support
    dyslexiaFriendly: {
      fonts: ['OpenDyslexic', 'Arial', 'Verdana'],
      spacing: 'increased',
      colors: 'high-contrast',
      lineLength: 'short',
    },
    
    // ADHD support
    adhdFriendly: {
      distractions: 'minimal',
      focus: 'single-task',
      breaks: 'regular',
      progress: 'frequent-feedback',
    },
  },
  
  // Language learning accessibility
  languageLearning: {
    // Multiple modalities for vocabulary
    pronunciation: true,      // Audio pronunciation
    visualCues: true,        // Images and icons
    translation: true,        // Native language support
    
    // Adaptive difficulty
    personalizedPacing: true, // Adjust to user's pace
    repeatOptions: true,      // Easy repetition
    progressTracking: true,   // Clear progress indicators
  },
};

// Utility Functions
export const accessibilityUtils = {
  // Check if color combination meets contrast requirements
  checkContrast: (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA') => {
    // This would implement actual contrast calculation
    // Placeholder for demonstration
    return {
      ratio: 4.5,
      passes: true,
      level: level,
    };
  },
  
  // Generate accessible color combinations
  getAccessibleColors: (baseColor: string) => {
    return {
      background: baseColor,
      text: colors.text.primary,
      border: colors.border.medium,
      focus: colors.accessibility.focus,
    };
  },
  
  // Get appropriate touch target size based on context
  getTouchTargetSize: (context: 'teacher' | 'student', importance: 'primary' | 'secondary') => {
    if (context === 'teacher') {
      return importance === 'primary' ? touchTargets.teacher.bulkAction : touchTargets.teacher.quickMark;
    }
    return importance === 'primary' ? touchTargets.student.gamification : touchTargets.student.learning;
  },
  
  // Generate ARIA labels with context
  generateAriaLabel: (template: string, context: Record<string, string>) => {
    return template.replace(/\{(\w+)\}/g, (match, key) => context[key] || match);
  },
};

// Export all accessibility specifications
export default {
  standards: accessibilityStandards,
  colors: highContrastColors,
  focus: focusManagement,
  screenReader: screenReaderSupport,
  motor: motorAccessibility,
  cognitive: cognitiveAccessibility,
  visual: visualAccessibility,
  audio: audioAccessibility,
  platform: platformAccessibility,
  testing: accessibilityTesting,
  educational: educationalAccessibility,
  utils: accessibilityUtils,
};