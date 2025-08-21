# UI Design Specifications: Harry School Vocabulary Module
Agent: ui-designer
Date: 2025-08-20

## Executive Summary

This comprehensive design specification document provides detailed visual design guidelines for the Harry School Vocabulary module, focusing on age-adaptive interfaces, cultural sensitivity, and educational micro-animations. The design system emphasizes accessibility compliance (WCAG 2.1 AA), multi-language support (English/Uzbek/Russian), and performance-optimized animations targeting 60fps on React Native.

**Key Design Principles:**
1. **Age-Adaptive Visual Design**: Three distinct interface modes for elementary (10-12), middle school (13-15), and high school (16-18)
2. **Cultural Authenticity**: Integration of Uzbekistan educational values and visual elements
3. **Educational Psychology**: Research-backed color psychology and gamification patterns
4. **Performance Excellence**: GPU-accelerated animations with fallback options
5. **Universal Accessibility**: WCAG 2.1 AA compliance with enhanced touch targets and voice navigation

---

## Design Token System

### Primary Color Palette

```css
/* Harry School Brand Colors */
--primary: #1d7452;           /* Main brand green - educational, trustworthy */
--primary-50: #f0f9f4;        /* Background tints */
--primary-100: #dcf2e4;       
--primary-200: #bce5ce;       
--primary-300: #8dd1a8;       
--primary-400: #5bb57d;       
--primary-500: #1d7452;       /* Primary brand */
--primary-600: #156040;       
--primary-700: #114d33;       
--primary-800: #0f3e2a;       
--primary-900: #0d3424;       

/* Age-Adaptive Primary Variations */
--primary-elementary: #2a9d6f;    /* Brighter, more playful */
--primary-secondary: #1d7452;     /* Standard professional */
--primary-high-school: #154d36;   /* Deeper, more serious */
```

### Semantic Color System

```css
/* Success States */
--success-elementary: #10b981;    /* Bright, celebratory green */
--success-secondary: #059669;     /* Balanced success green */
--success-high-school: #047857;   /* Professional success green */

/* Educational Feedback Colors */
--correct-answer: #10b981;        /* Positive reinforcement */
--incorrect-answer: #f59e0b;      /* Encouraging, not punitive */
--needs-practice: #3b82f6;        /* Supportive blue */
--mastered: #8b5cf6;              /* Achievement purple */

/* Cultural Context Colors */
--uzbek-blue: #0099cc;            /* Traditional Uzbek sky blue */
--uzbek-gold: #ffd700;            /* Traditional gold accent */
--family-warmth: #f97316;         /* Warm family connection orange */

/* Neutral Scale - High Contrast Compliant */
--gray-50: #fafafa;
--gray-100: #f4f4f5;
--gray-200: #e4e4e7;
--gray-300: #d4d4d8;
--gray-400: #a1a1aa;
--gray-500: #71717a;
--gray-600: #52525b;
--gray-700: #3f3f46;
--gray-800: #27272a;
--gray-900: #18181b;
```

### Typography System

```css
/* Font Families */
--font-primary: 'SF Pro Display', 'Roboto', system-ui, sans-serif;
--font-secondary: 'SF Pro Text', 'Roboto', system-ui, sans-serif;
--font-mono: 'SF Mono', 'JetBrains Mono', monospace;

/* Age-Adaptive Font Sizes (pt) */
--text-xs-elementary: 14;     --text-xs-secondary: 12;
--text-sm-elementary: 16;     --text-sm-secondary: 14;
--text-base-elementary: 18;   --text-base-secondary: 16;
--text-lg-elementary: 22;     --text-lg-secondary: 18;
--text-xl-elementary: 26;     --text-xl-secondary: 20;
--text-2xl-elementary: 32;    --text-2xl-secondary: 24;
--text-3xl-elementary: 40;    --text-3xl-secondary: 30;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Spacing System

```css
/* Age-Adaptive Spacing (px) */
--spacing-elementary-1: 6;    --spacing-secondary-1: 4;
--spacing-elementary-2: 12;   --spacing-secondary-2: 8;
--spacing-elementary-3: 18;   --spacing-secondary-3: 12;
--spacing-elementary-4: 24;   --spacing-secondary-4: 16;
--spacing-elementary-5: 30;   --spacing-secondary-5: 20;
--spacing-elementary-6: 36;   --spacing-secondary-6: 24;
--spacing-elementary-8: 48;   --spacing-secondary-8: 32;
--spacing-elementary-10: 60;  --spacing-secondary-10: 40;
--spacing-elementary-12: 72;  --spacing-secondary-12: 48;
--spacing-elementary-16: 96;  --spacing-secondary-16: 64;
```

### Touch Target Specifications

```css
/* WCAG 2.1 AA Compliant Touch Targets */
--touch-target-elementary: 52px;  /* Enhanced for younger users */
--touch-target-secondary: 48px;   /* Standard accessibility */
--touch-target-minimum: 44px;     /* Absolute minimum */

/* Interactive Element Spacing */
--interactive-spacing-elementary: 16px;  /* Between touch targets */
--interactive-spacing-secondary: 12px;
```

---

## Component Visual Specifications

### Flashcard Visual Design

#### Elementary Flashcard Layout (Ages 10-12)

```typescript
interface ElementaryFlashcardDesign {
  dimensions: {
    width: '90%';           // Screen width
    height: '65%';          // Screen height
    borderRadius: 24;       // Friendly, rounded corners
    elevation: 8;           // Strong shadow for depth
  };
  
  layout: {
    imageArea: '45%';       // Large visual space
    wordArea: '30%';        // Primary word display
    translationArea: '25%'; // Multi-language translations
  };
  
  typography: {
    primaryWord: {
      fontSize: 32;         // Large, readable
      fontWeight: 700;      // Bold for emphasis
      color: '--gray-900';
      letterSpacing: 0.5;
    };
    translation: {
      fontSize: 18;
      fontWeight: 500;
      color: '--gray-600';
      lineHeight: 1.4;
    };
  };
  
  visualElements: {
    backgroundGradient: [
      '--primary-50',
      '--primary-100'
    ];
    borderColor: '--primary-200';
    borderWidth: 2;
    
    imageStyle: {
      borderRadius: 16;
      aspectRatio: '16:9';
      marginBottom: 16;
    };
    
    audioButton: {
      size: 56;             // Large touch target
      backgroundColor: '--primary-elementary';
      iconSize: 28;
      borderRadius: 28;
      elevation: 4;
    };
  };
}
```

#### Secondary Flashcard Layout (Ages 16-18)

```typescript
interface SecondaryFlashcardDesign {
  dimensions: {
    width: '88%';
    height: '60%';
    borderRadius: 16;       // More mature, subtle rounding
    elevation: 4;           // Subtle shadow
  };
  
  layout: {
    headerArea: '15%';      // Efficient header
    contentArea: '70%';     // Definition and examples
    actionsArea: '15%';     // Quick actions
  };
  
  typography: {
    primaryWord: {
      fontSize: 24;
      fontWeight: 600;
      color: '--gray-900';
    };
    definition: {
      fontSize: 16;
      fontWeight: 400;
      color: '--gray-700';
      lineHeight: 1.5;
    };
    example: {
      fontSize: 14;
      fontWeight: 400;
      color: '--gray-600';
      fontStyle: 'italic';
    };
  };
  
  visualElements: {
    backgroundColor: '--gray-50';
    borderColor: '--gray-200';
    borderWidth: 1;
    
    progressIndicator: {
      height: 4;
      backgroundColor: '--primary-secondary';
      borderRadius: 2;
    };
  };
}
```

### Swipe Gesture Visual Feedback

#### React Native Reanimated Implementation

```typescript
interface SwipeGestureDesign {
  rightSwipe: {
    // "I know this word" - Positive feedback
    backgroundColor: '--success-elementary';  // Age-adaptive
    iconColor: 'white';
    icon: 'checkmark-circle';
    iconSize: 32;
    hapticFeedback: 'impact-heavy';
    
    animation: {
      scale: 'withSpring(1.1)';
      rotation: 'withSpring(5deg)';
      opacity: 'withTiming(0.9)';
      translateX: 'withDecay({velocity: velocityX})';
    };
    
    celebrationEffect: {
      confetti: true;
      sparkles: true;
      soundEffect: 'success-chime';
      duration: 800;
    };
  };
  
  leftSwipe: {
    // "I need practice" - Encouraging feedback
    backgroundColor: '--needs-practice';
    iconColor: 'white';
    icon: 'book-open';
    iconSize: 32;
    hapticFeedback: 'impact-light';
    
    animation: {
      scale: 'withSpring(1.05)';
      rotation: 'withSpring(-3deg)';
      opacity: 'withTiming(0.8)';
      translateX: 'withDecay({velocity: velocityX})';
    };
    
    encouragementEffect: {
      supportiveMessage: true;
      gentlePulse: true;
      soundEffect: 'gentle-ding';
      duration: 600;
    };
  };
  
  upSwipe: {
    // "Mark as challenging"
    backgroundColor: '--incorrect-answer';
    iconColor: 'white';
    icon: 'bookmark';
    iconSize: 28;
    hapticFeedback: 'impact-medium';
    
    animation: {
      translateY: 'withSpring(-100)';
      opacity: 'withTiming(0.7)';
      scale: 'withSpring(0.95)';
    };
  };
}
```

### Multi-Language Visual Integration

#### Typography Specifications for Trilingual Support

```typescript
interface MultilingualTypography {
  english: {
    fontFamily: '--font-primary';
    fontSize: 'age-adaptive-base';
    fontWeight: 600;
    lineHeight: '--leading-normal';
    color: '--gray-900';
  };
  
  uzbek: {
    fontFamily: '--font-primary';    // Latin script
    fontSize: 'age-adaptive-sm';
    fontWeight: 500;
    lineHeight: '--leading-relaxed'; // Better for second language
    color: '--gray-700';
  };
  
  russian: {
    fontFamily: '--font-primary';    // Cyrillic support
    fontSize: 'age-adaptive-sm';
    fontWeight: 500;
    lineHeight: '--leading-relaxed';
    color: '--gray-700';
  };
  
  culturalContext: {
    fontFamily: '--font-secondary';
    fontSize: 'age-adaptive-xs';
    fontWeight: 400;
    color: '--gray-600';
    fontStyle: 'italic';
  };
}
```

#### Language Switching Interface

```typescript
interface LanguageSwitcher {
  layout: {
    position: 'top-right';
    width: 120;
    height: 40;
    borderRadius: 20;
  };
  
  visualDesign: {
    backgroundColor: '--gray-100';
    activeBackgroundColor: '--primary-500';
    borderColor: '--gray-200';
    
    flags: {
      size: 20;
      borderRadius: 10;
      marginRight: 6;
    };
    
    activeIndicator: {
      width: 36;
      height: 36;
      borderRadius: 18;
      backgroundColor: '--primary-500';
      animationDuration: 200;
    };
  };
  
  languages: [
    { code: 'en', flag: 'UK', label: 'English' },
    { code: 'uz', flag: 'UZ', label: "O'zbek" },
    { code: 'ru', flag: 'RU', label: 'Русский' }
  ];
}
```

### Unit Organization Visual Hierarchy

#### Unit Card Design

```typescript
interface VocabularyUnitCard {
  dimensions: {
    width: '100%';
    height: 140;            // Elementary: 160, Secondary: 120
    borderRadius: 16;
    marginBottom: 16;
  };
  
  layout: {
    headerSection: '25%';    // Unit title and level
    progressSection: '35%';  // Visual progress indicator
    statsSection: '40%';     // Words learned, mastery level
  };
  
  visualDesign: {
    backgroundColor: '--gray-50';
    borderColor: '--primary-200';
    borderWidth: 1;
    
    headerGradient: [
      '--primary-100',
      '--primary-50'
    ];
    
    progressVisualization: {
      type: 'circular-progress'; // Elementary: tree-growth, Secondary: bar
      color: '--primary-500';
      backgroundColor: '--primary-100';
      thickness: 6;
      size: 60;
    };
    
    difficultyIndicator: {
      beginner: {
        color: '--success-elementary';
        icon: 'star-outline';
        label: 'Beginner';
      };
      intermediate: {
        color: '--needs-practice';
        icon: 'star-half';
        label: 'Intermediate';
      };
      advanced: {
        color: '--mastered';
        icon: 'star';
        label: 'Advanced';
      };
    };
  };
  
  animations: {
    onPress: {
      scale: 'withSpring(0.98)';
      opacity: 'withTiming(0.8, {duration: 100})';
    };
    
    progressUpdate: {
      scale: 'withSequence(withSpring(1.1), withSpring(1.0))';
      confetti: true; // For level completion
    };
  };
}
```

#### Thematic Grouping Visual Design

```typescript
interface ThematicGroup {
  visualCategories: {
    dailyLife: {
      primaryColor: '--family-warmth';
      icon: 'home';
      backgroundColor: '#fff7ed';
      illustration: 'uzbek-family-home';
    };
    
    academic: {
      primaryColor: '--primary-500';
      icon: 'academic-cap';
      backgroundColor: '--primary-50';
      illustration: 'uzbek-school-building';
    };
    
    cultural: {
      primaryColor: '--uzbek-blue';
      icon: 'flag';
      backgroundColor: '#eff6ff';
      illustration: 'uzbek-traditions';
    };
    
    professional: {
      primaryColor: '--gray-700';
      icon: 'briefcase';
      backgroundColor: '--gray-50';
      illustration: 'modern-office';
    };
  };
  
  groupHeader: {
    height: 60;
    borderRadius: 12;
    marginBottom: 16;
    
    typography: {
      title: {
        fontSize: 'age-adaptive-lg';
        fontWeight: 600;
        color: 'category-primary-color';
      };
      subtitle: {
        fontSize: 'age-adaptive-sm';
        fontWeight: 400;
        color: '--gray-600';
      };
    };
  };
}
```

### Practice Screen Visual Design

#### Adaptive Difficulty Visual Feedback

```typescript
interface DifficultyVisualization {
  progressRing: {
    elementary: {
      size: 120;
      strokeWidth: 12;
      backgroundColor: '--primary-100';
      progressColor: '--primary-elementary';
      
      centerContent: {
        icon: 'trophy';
        iconSize: 48;
        iconColor: '--primary-elementary';
      };
    };
    
    secondary: {
      size: 80;
      strokeWidth: 6;
      backgroundColor: '--gray-200';
      progressColor: '--primary-secondary';
      
      centerContent: {
        text: '87%';
        fontSize: 18;
        fontWeight: 600;
      };
    };
  };
  
  difficultyAdjustment: {
    increaseDifficulty: {
      backgroundColor: '--success-elementary';
      message: "Great job! Let's try harder words";
      animation: 'celebration-sparkles';
    };
    
    decreaseDifficulty: {
      backgroundColor: '--needs-practice';
      message: "Let's practice some easier words";
      animation: 'gentle-encouragement';
    };
    
    maintainDifficulty: {
      backgroundColor: '--primary-100';
      message: "Perfect pace! Keep going";
      animation: 'steady-progress';
    };
  };
}
```

#### Session Timer and Break Recommendations

```typescript
interface SessionTimer {
  elementary: {
    maxDuration: 18 * 60; // 18 minutes in seconds
    breakInterval: 8 * 60; // Break every 8 minutes
    
    visualDesign: {
      type: 'playful-clock';
      size: 80;
      backgroundColor: '--primary-100';
      progressColor: '--primary-elementary';
      
      breakNotification: {
        icon: 'moon';
        backgroundColor: '--family-warmth';
        message: "Time for a break! Great learning so far!";
        animation: 'gentle-pulse';
      };
    };
  };
  
  secondary: {
    maxDuration: 45 * 60; // 45 minutes
    breakInterval: 20 * 60; // Break every 20 minutes
    
    visualDesign: {
      type: 'minimal-progress-bar';
      height: 4;
      backgroundColor: '--gray-200';
      progressColor: '--primary-secondary';
      
      position: 'top-of-screen';
      
      breakNotification: {
        type: 'discrete-banner';
        backgroundColor: '--gray-100';
        textColor: '--gray-700';
        message: "Consider taking a short break";
      };
    };
  };
}
```

### Translator Interface Design

#### Clean Translation Layout

```typescript
interface TranslatorInterface {
  layout: {
    searchBar: {
      height: 56;
      borderRadius: 28;
      backgroundColor: '--gray-100';
      borderColor: '--gray-200';
      borderWidth: 1;
      
      placeholder: {
        elementary: "Type any word to translate";
        secondary: "Enter word or phrase";
      };
      
      voiceInput: {
        size: 40;
        backgroundColor: '--primary-500';
        iconColor: 'white';
        position: 'right-inside';
      };
    };
    
    resultCard: {
      marginTop: 20;
      borderRadius: 16;
      backgroundColor: 'white';
      borderColor: '--gray-200';
      borderWidth: 1;
      padding: 24;
      elevation: 2;
    };
    
    languageToggle: {
      height: 44;
      width: 120;
      borderRadius: 22;
      backgroundColor: '--primary-100';
      
      toggleButton: {
        size: 36;
        backgroundColor: '--primary-500';
        iconColor: 'white';
        animation: 'smooth-slide';
      };
    };
  };
  
  cameraTranslation: {
    overlay: {
      backgroundColor: 'rgba(0,0,0,0.7)';
      
      captureFrame: {
        borderColor: '--primary-500';
        borderWidth: 3;
        borderRadius: 12;
        borderStyle: 'dashed';
        
        animation: 'gentle-pulse';
      };
      
      captureButton: {
        size: 80;
        backgroundColor: '--primary-500';
        borderColor: 'white';
        borderWidth: 4;
        position: 'bottom-center';
      };
    };
  };
}
```

#### Audio Recording Interface

```typescript
interface AudioRecordingInterface {
  recordingButton: {
    idle: {
      size: 72;
      backgroundColor: '--primary-500';
      iconColor: 'white';
      icon: 'microphone';
      animation: 'gentle-breathe';
    };
    
    recording: {
      size: 96;
      backgroundColor: '#ef4444';
      iconColor: 'white';
      icon: 'stop';
      animation: 'pulse-recording';
      
      waveform: {
        height: 40;
        color: '#ef4444';
        backgroundColor: 'rgba(239, 68, 68, 0.1)';
        animation: 'audio-wave-visualization';
      };
    };
    
    playing: {
      size: 72;
      backgroundColor: '--success-elementary';
      iconColor: 'white';
      icon: 'play';
      
      progressIndicator: {
        type: 'circular';
        strokeWidth: 4;
        color: '--success-elementary';
      };
    };
  };
  
  pronunciationFeedback: {
    excellent: {
      backgroundColor: '--success-elementary';
      icon: 'check-circle';
      message: "Perfect pronunciation!";
      animation: 'celebration';
    };
    
    good: {
      backgroundColor: '--needs-practice';
      icon: 'thumbs-up';
      message: "Good! Try again for better pronunciation";
      animation: 'encouraging-nod';
    };
    
    needsPractice: {
      backgroundColor: '--incorrect-answer';
      icon: 'refresh';
      message: "Let's practice this sound together";
      animation: 'gentle-guidance';
    };
  };
}
```

---

## Age-Adaptive Design System

### Elementary Level (Ages 10-12) Visual Characteristics

```typescript
interface ElementaryDesignSystem {
  colorPalette: {
    primary: '#2a9d6f';     // Brighter, more energetic
    secondary: '#3b82f6';    // Friendly blue
    success: '#10b981';      // Celebration green
    warning: '#f59e0b';      // Warm, not alarming
    background: '#fefefe';   // Pure, clean white
    surface: '#f8fafc';      // Subtle surface tint
  };
  
  animations: {
    duration: 'longer';      // More time to appreciate
    easing: 'bounce';        // Playful spring effects
    celebrationIntensity: 'high'; // Confetti, sparkles, sounds
    
    microInteractions: [
      'button-bounce',
      'card-wiggle',
      'progress-sparkle',
      'achievement-explosion'
    ];
  };
  
  iconography: {
    style: 'outlined';       // Friendly, approachable
    weight: 'medium';        // Clear visibility
    size: 'larger';          // Easy recognition
    
    customIcons: [
      'smiling-book',
      'happy-microphone',
      'celebration-trophy',
      'friendly-lightbulb'
    ];
  };
  
  layout: {
    spacing: 'generous';     // More breathing room
    cornerRadius: 'rounded'; // Soft, friendly edges
    shadows: 'elevated';     // Clear depth hierarchy
    
    touchTargets: {
      minimum: 52;           // Enhanced accessibility
      preferred: 60;         // Optimal for small fingers
    };
  };
}
```

### Middle School Level (Ages 13-15) Visual Characteristics

```typescript
interface MiddleSchoolDesignSystem {
  colorPalette: {
    primary: '#1d7452';     // Balanced, mature
    secondary: '#6366f1';    // Sophisticated purple
    success: '#059669';      // Professional green
    warning: '#d97706';      // Balanced caution
    background: '#ffffff';
    surface: '#f9fafb';
  };
  
  animations: {
    duration: 'moderate';
    easing: 'ease-in-out';
    celebrationIntensity: 'medium';
    
    microInteractions: [
      'smooth-transitions',
      'progress-fills',
      'achievement-glow',
      'peer-comparison-highlights'
    ];
  };
  
  iconography: {
    style: 'mixed';          // Balance of filled and outlined
    weight: 'medium';
    size: 'standard';
    
    socialElements: [
      'peer-comparison',
      'collaboration-tools',
      'achievement-sharing',
      'progress-competition'
    ];
  };
  
  layout: {
    spacing: 'balanced';
    cornerRadius: 'moderate';
    shadows: 'subtle';
    
    touchTargets: {
      minimum: 48;
      preferred: 52;
    };
  };
}
```

### High School Level (Ages 16-18) Visual Characteristics

```typescript
interface HighSchoolDesignSystem {
  colorPalette: {
    primary: '#154d36';     // Professional, serious
    secondary: '#475569';    // Sophisticated gray
    success: '#047857';      // Academic achievement
    warning: '#c2410c';      // Clear, direct caution
    background: '#ffffff';
    surface: '#f8fafc';
  };
  
  animations: {
    duration: 'fast';
    easing: 'ease-out';
    celebrationIntensity: 'low';
    
    microInteractions: [
      'instant-feedback',
      'data-visualization',
      'efficiency-indicators',
      'goal-progress'
    ];
  };
  
  iconography: {
    style: 'minimal';        // Clean, professional
    weight: 'regular';
    size: 'compact';
    
    analyticsElements: [
      'performance-charts',
      'efficiency-metrics',
      'goal-tracking',
      'academic-progress'
    ];
  };
  
  layout: {
    spacing: 'efficient';
    cornerRadius: 'minimal';
    shadows: 'flat';
    
    touchTargets: {
      minimum: 44;
      preferred: 48;
    };
  };
}
```

---

## Cultural Design Elements

### Uzbekistan Cultural Integration

```typescript
interface CulturalDesignElements {
  colorPalette: {
    uzbekBlue: '#0099cc';    // Traditional sky blue
    uzbekGold: '#ffd700';    // Traditional gold
    uzbekRed: '#dc2626';     // National flag red
    
    // Cultural context backgrounds
    traditionPattern: 'rgba(0, 153, 204, 0.05)';
    familyWarmth: 'rgba(249, 115, 22, 0.05)';
    educationHonor: 'rgba(29, 116, 82, 0.05)';
  };
  
  patterns: {
    uzbekDecorative: {
      type: 'geometric-islamic';
      opacity: 0.1;
      usage: 'background-subtle';
      
      elements: [
        'star-octagon',
        'interlaced-bands',
        'floral-geometric'
      ];
    };
  };
  
  imagery: {
    culturalContexts: [
      'uzbek-family-gathering',
      'tashkent-cityscape',
      'traditional-foods',
      'educational-respect',
      'community-celebration'
    ];
    
    illustrationStyle: {
      approach: 'respectful-modern';
      colorTreatment: 'warm-authentic';
      composition: 'family-inclusive';
    };
  };
  
  familyEngagement: {
    progressSharing: {
      backgroundColor: '--family-warmth';
      iconColor: '--uzbek-gold';
      typography: {
        greeting: "Assalomu aleykum!";
        progressMessage: "Your child is doing excellently";
      };
    };
    
    achievementCelebration: {
      culturalPhrases: [
        "Juda yaxshi!" // Uzbek: Very good!
        "Отлично!"     // Russian: Excellent!
        "Excellent work!" // English
      ];
      
      visualCelebration: {
        colors: ['--uzbek-gold', '--success-elementary'];
        animation: 'traditional-celebration';
        duration: 2000;
      };
    };
  };
}
```

### Family Authority Integration

```typescript
interface FamilyAuthorityDesign {
  teacherFeedback: {
    avatar: {
      style: 'respectful-professional';
      borderColor: '--primary-500';
      borderWidth: 2;
      size: 48;
    };
    
    messageCard: {
      backgroundColor: '--primary-50';
      borderColor: '--primary-200';
      borderLeftWidth: 4;
      borderLeftColor: '--primary-500';
      
      typography: {
        teacherName: {
          fontSize: 'age-adaptive-sm';
          fontWeight: 600;
          color: '--primary-700';
        };
        feedback: {
          fontSize: 'age-adaptive-base';
          fontWeight: 400;
          color: '--gray-700';
          lineHeight: 1.6;
        };
      };
    };
  };
  
  parentalProgress: {
    weeklyReport: {
      headerGradient: [
        '--family-warmth',
        'rgba(249, 115, 22, 0.1)'
      ];
      
      achievements: {
        iconSize: 32;
        iconColor: '--uzbek-gold';
        backgroundColor: 'rgba(255, 215, 0, 0.1)';
        
        celebrationText: {
          uzbek: "Farzandingiz ajoyib ishladi!";
          russian: "Ваш ребёнок отлично поработал!";
          english: "Your child did excellent work!";
        };
      };
    };
  };
}
```

---

## Accessibility Design Requirements

### WCAG 2.1 AA Compliance

```typescript
interface AccessibilitySpecs {
  colorContrast: {
    textPrimary: '7.2:1';   // AAA level for primary text
    textSecondary: '4.8:1'; // Above AA requirement
    uiElements: '3.2:1';    // Above minimum for UI
    
    highContrastMode: {
      textPrimary: '15:1';
      textSecondary: '7:1';
      backgrounds: 'pure-white-black-only';
    };
  };
  
  touchTargets: {
    elementary: {
      minimum: 52;          // Enhanced for motor skills
      preferred: 60;        // Optimal size
      spacing: 16;          // Clear separation
    };
    
    secondary: {
      minimum: 48;          // Standard accessibility
      preferred: 52;
      spacing: 12;
    };
  };
  
  typography: {
    scalability: '200%';    // Dynamic text sizing
    fontWeights: 'minimum-400'; // Avoid thin fonts
    
    languageSupport: {
      latin: 'full-unicode-support';
      cyrillic: 'full-unicode-support';
      arabic: 'basic-numerals-support';
    };
  };
  
  animations: {
    reducedMotion: {
      respectSystemPreference: true;
      fallbackToStaticStates: true;
      essentialMotionOnly: true;
    };
    
    vestibularSafety: {
      noParallaxScrolling: true;
      noAutoplayingAnimations: true;
      noFlashingElements: true;
      maxAnimationDuration: 500; // milliseconds
    };
  };
}
```

### Screen Reader Optimization

```typescript
interface ScreenReaderOptimization {
  semanticMarkup: {
    headingHierarchy: 'proper-h1-h6-structure';
    landmarkRegions: 'main-nav-aside-footer';
    listStructures: 'proper-ul-ol-usage';
    
    flashcardAccessibility: {
      role: 'button';
      ariaLabel: 'Vocabulary flashcard: {word} means {translation}';
      ariaDescription: 'Swipe right if you know this word, left to practice more';
      ariaLive: 'polite'; // For progress updates
    };
    
    progressIndicators: {
      role: 'progressbar';
      ariaValueMin: 0;
      ariaValueMax: 100;
      ariaValueNow: 'dynamic';
      ariaLabel: 'Learning progress: {percentage} complete';
    };
  };
  
  voiceNavigation: {
    voiceCommands: [
      'next card',
      'repeat audio',
      'mark as known',
      'need practice',
      'show translation',
      'back to menu'
    ];
    
    feedbackAnnouncements: {
      correct: 'Correct! Well done.';
      incorrect: 'Let\'s practice this more.';
      levelUp: 'Congratulations! You\'ve unlocked the next level.';
    };
  };
}
```

### Voice Navigation Support

```typescript
interface VoiceNavigationDesign {
  visualIndicators: {
    listeningState: {
      backgroundColor: 'rgba(59, 130, 246, 0.1)';
      borderColor: '--needs-practice';
      borderWidth: 2;
      animation: 'gentle-pulse';
      
      microphoneIcon: {
        size: 24;
        color: '--needs-practice';
        animation: 'audio-wave';
      };
    };
    
    processingState: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)';
      spinnerColor: '--success-elementary';
      message: 'Understanding your command...';
    };
    
    confirmationState: {
      backgroundColor: '--success-elementary';
      textColor: 'white';
      icon: 'check-circle';
      duration: 2000;
    };
  };
  
  commandFeedback: {
    visual: true;
    audio: true;
    haptic: true;
    
    confirmationMessages: {
      navigation: 'Moving to {destination}';
      action: 'Executing {action}';
      error: 'Could not understand. Please try again.';
    };
  };
}
```

---

## Animation Specifications

### React Native Reanimated Implementation

```typescript
interface AnimationSpecifications {
  celebrationAnimations: {
    confetti: {
      particleCount: 50;
      colors: ['--uzbek-gold', '--success-elementary', '--primary-500'];
      gravity: 0.3;
      spread: 45;
      startVelocity: 45;
      decay: 0.9;
      duration: 3000;
    };
    
    sparkles: {
      particleCount: 20;
      colors: ['--uzbek-gold', 'white'];
      size: { min: 4, max: 8 };
      opacity: { start: 1, end: 0 };
      duration: 2000;
      easing: 'ease-out';
    };
    
    cardFlip: {
      rotateY: 'withSpring(180deg)';
      duration: 800;
      easing: 'ease-in-out';
      
      elementary: {
        bounceEffect: true;
        overshoot: 1.2;
      };
      
      secondary: {
        bounceEffect: false;
        overshoot: 1.0;
      };
    };
  };
  
  gestureAnimations: {
    swipeRecognition: {
      threshold: {
        horizontal: 80; // pixels
        vertical: 60;
      };
      
      velocityThreshold: {
        fast: 300;      // pixels/second
        medium: 200;
        slow: 100;
      };
    };
    
    feedbackTiming: {
      immediate: 0;     // Visual feedback
      haptic: 50;       // Haptic feedback delay
      audio: 100;       // Audio feedback delay
      completion: 300;  // Animation completion
    };
  };
  
  microAnimations: {
    buttonPress: {
      scale: 'withSpring(0.95)';
      duration: 150;
    };
    
    progressUpdate: {
      elementary: 'withSequence(withSpring(1.1), withSpring(1.0))';
      secondary: 'withTiming(finalValue, {duration: 300})';
    };
    
    achievementUnlock: {
      scale: 'withSequence(withSpring(0.8), withSpring(1.2), withSpring(1.0))';
      rotation: 'withSpring(360deg)';
      duration: 1200;
    };
  };
}
```

### Performance Optimization

```typescript
interface AnimationPerformance {
  gpuAcceleration: {
    transforms: ['translateX', 'translateY', 'scale', 'rotate'];
    opacity: true;
    elevation: false; // Use shadow props instead
  };
  
  optimization: {
    useNativeDriver: true;
    renderToHardware: true;
    shouldRasterize: false;
    
    memoryManagement: {
      animationCleanup: 'automatic';
      listenerRemoval: 'component-unmount';
      sharedValueReset: 'session-end';
    };
  };
  
  fallbacks: {
    reducedMotion: {
      disableTransitions: false;
      reduceAnimationDuration: true;
      removeDecorative: true;
      keepFunctional: true;
    };
    
    lowPerformance: {
      simplifyAnimations: true;
      reduceParticleCount: true;
      lowerFramerate: 30; // fps
    };
  };
}
```

---

## Dark Mode Adaptations

### Age-Adaptive Dark Mode

```typescript
interface DarkModeSpecifications {
  elementary: {
    // Softer dark mode to reduce eye strain
    backgroundColor: '#1a1d23';      // Warm dark gray
    surfaceColor: '#252830';         // Elevated surfaces
    primaryColor: '#34d399';         // Brighter green for visibility
    
    textColors: {
      primary: '#f8fafc';           // Pure white for clarity
      secondary: '#cbd5e1';         // Light gray
      muted: '#94a3b8';            // Muted text
    };
    
    cardDesign: {
      backgroundColor: '#2d3142';
      borderColor: '#475569';
      elevation: 8; // Higher elevation in dark mode
    };
  };
  
  secondary: {
    // True dark mode for focus
    backgroundColor: '#0f172a';      // Deep dark blue
    surfaceColor: '#1e293b';
    primaryColor: '#22c55e';
    
    textColors: {
      primary: '#f1f5f9';
      secondary: '#cbd5e1';
      muted: '#8a9bb0';
    };
    
    cardDesign: {
      backgroundColor: '#1e293b';
      borderColor: '#334155';
      elevation: 2; // Minimal elevation
    };
  };
  
  animations: {
    transitionDuration: 200;
    easing: 'ease-in-out';
    respectSystemPreference: true;
    
    themeToggle: {
      icon: 'moon-to-sun-rotation';
      duration: 400;
      delay: 100;
    };
  };
}
```

---

## Responsive Design Breakpoints

### Mobile-First Responsive System

```typescript
interface ResponsiveBreakpoints {
  // React Native dimensions
  phone: {
    small: { width: 320, height: 568 };    // iPhone SE
    medium: { width: 375, height: 667 };   // iPhone 8
    large: { width: 414, height: 896 };    // iPhone 11 Pro Max
  };
  
  tablet: {
    small: { width: 768, height: 1024 };   // iPad Mini
    large: { width: 1024, height: 1366 };  // iPad Pro
  };
  
  adaptiveScaling: {
    phone: {
      cardWidth: '90%';
      fontSize: 'base-scale';
      spacing: 'compact';
      touchTargets: 'standard';
    };
    
    tablet: {
      cardWidth: '70%';
      fontSize: 'scale-1.2x';
      spacing: 'generous';
      touchTargets: 'enhanced';
      
      layout: 'two-column-when-landscape';
    };
  };
}
```

---

## Implementation Notes for Developers

### React Native Component Structure

```typescript
interface VocabularyComponentArchitecture {
  components: {
    'FlashcardComponent': {
      ageAdaptive: true;
      animations: ['swipe-gestures', 'flip-animation', 'celebration'];
      accessibility: 'full-wcag-compliance';
      
      props: {
        word: 'string';
        translations: 'TrilingualTranslation';
        imageUrl: 'string';
        audioUrl: 'string';
        difficulty: 'beginner | intermediate | advanced';
        onSwipeRight: 'function';
        onSwipeLeft: 'function';
        onAudioPlay: 'function';
      };
    };
    
    'VocabularyUnitCard': {
      responsiveDesign: true;
      progressVisualization: true;
      culturalTheming: true;
      
      variants: ['daily-life', 'academic', 'cultural', 'professional'];
    };
    
    'TranslatorInterface': {
      multimodal: ['text', 'voice', 'camera'];
      offline: 'prioritized';
      realtimeTranslation: true;
    };
  };
  
  hooks: {
    'useAgeAdaptiveDesign': 'returns age-specific styling and behavior';
    'useVocabularyAnimations': 'manages gesture and celebration animations';
    'useCulturalContext': 'provides cultural design elements';
    'useAccessibilityFeatures': 'manages screen reader and voice navigation';
  };
}
```

### Asset Requirements

```typescript
interface AssetSpecifications {
  images: {
    vocabulary: {
      format: 'WebP with PNG fallback';
      resolution: '2x, 3x for Retina displays';
      size: '16:9 aspect ratio, 400x225 base';
      compression: 'optimized for mobile bandwidth';
    };
    
    cultural: {
      uzbekistan: ['family-scenes', 'traditional-foods', 'cultural-celebrations'];
      style: 'respectful-authentic-modern';
      colorTreatment: 'warm-welcoming';
    };
  };
  
  audio: {
    pronunciations: {
      format: 'AAC (iOS), OGG (Android fallback)';
      bitrate: '64kbps';
      sampleRate: '44.1kHz';
      speakers: 'native-english-speakers';
    };
    
    soundEffects: {
      success: 'celebration-chime.aac';
      encouragement: 'gentle-ding.aac';
      levelUp: 'achievement-fanfare.aac';
      error: 'supportive-tone.aac'; // Not punitive
    };
  };
  
  animations: {
    lottie: {
      confetti: 'celebration-particles.json';
      loading: 'vocabulary-book-loading.json';
      achievement: 'trophy-unlock.json';
      progress: 'progress-tree-growth.json';
    };
  };
}
```

### Performance Targets

```typescript
interface PerformanceTargets {
  rendering: {
    targetFPS: 60;
    minimumFPS: 30;
    animationBudget: '16ms per frame';
  };
  
  memory: {
    peakUsage: '<150MB during intensive sessions';
    audioCache: '<50MB stored pronunciations';
    imageCache: '<100MB vocabulary images';
  };
  
  battery: {
    sessionImpact: '<5% per hour active use';
    backgroundUsage: '<1% per 24 hours';
    animationOptimization: 'GPU-accelerated transforms only';
  };
  
  loading: {
    appLaunch: '<2 seconds cold start';
    cardTransition: '<100ms swipe response';
    audioPlayback: '<200ms tap to sound';
  };
}
```

---

## Conclusion

This comprehensive UI design specification provides the foundation for implementing a culturally-sensitive, age-adaptive, and accessible vocabulary learning system. The design system emphasizes:

**Core Achievements:**
1. **Age-Specific Visual Design**: Three distinct interface modes optimized for cognitive development stages
2. **Cultural Integration**: Respectful incorporation of Uzbekistan educational values and visual elements
3. **Accessibility Excellence**: WCAG 2.1 AA compliance with enhanced features for diverse learning needs
4. **Performance Optimization**: 60fps animations with intelligent fallbacks for various device capabilities
5. **Multi-Language Support**: Seamless trilingual integration with proper typography and cultural context

**Implementation Priorities:**
- **Phase 1**: Core flashcard component with age-adaptive styling
- **Phase 2**: Gesture animation system with cultural celebrations
- **Phase 3**: Translator interface with offline capabilities
- **Phase 4**: Advanced analytics and family engagement features

The specifications ensure that the vocabulary module will provide an engaging, effective, and culturally appropriate learning experience that honors both educational excellence and Uzbekistan's rich cultural heritage.

---

## Design System References

### Research Sources
- Modern flashcard app designs (Dribbble analysis)
- Educational mobile interface patterns
- React Native Reanimated gesture animation best practices
- WCAG 2.1 accessibility guidelines
- Color psychology in educational applications
- Uzbekistan cultural design sensitivity research

### Technical References
- React Native Reanimated 3 documentation
- shadcn/ui component patterns
- Mobile accessibility testing methodologies
- Cross-cultural design pattern libraries
- Educational gamification psychology research

### Cultural Consultation
- Uzbekistan educational system cultural norms
- Family engagement patterns in Central Asian education
- Multi-language learning interface design
- Islamic design principles and color theory
- Community (mahalla) integration in educational applications