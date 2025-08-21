# Authentication UI Design Specifications

## Overview

This document provides detailed user interface specifications for implementing the authentication flows identified in the UX research. The designs prioritize educational context usability while maintaining strong security standards.

## Design System Foundation

### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-green: #1d7452;
  --primary-green-light: #26a065;
  --primary-green-dark: #155c42;
  
  /* Authentication States */
  --success-color: #22c55e;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  --info-color: #3b82f6;
  
  /* Neutral Colors */
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-light: #9ca3af;
  --background: #ffffff;
  --surface: #f9fafb;
  --border: #e5e7eb;
  --border-focus: #1d7452;
}
```

### Typography Scale
```css
/* Authentication Typography */
.auth-title { font-size: 24px; font-weight: 700; }
.auth-subtitle { font-size: 16px; font-weight: 500; }
.auth-body { font-size: 14px; font-weight: 400; }
.auth-caption { font-size: 12px; font-weight: 400; }
.auth-button { font-size: 16px; font-weight: 600; }
.auth-error { font-size: 14px; font-weight: 500; color: var(--error-color); }
```

### Spacing System
```css
/* Spacing Scale (8px base) */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
```

## Screen Specifications

### 1. Welcome/Landing Screen

#### Layout Structure
```
┌─────────────────────────────────┐
│           Top Safe Area         │
├─────────────────────────────────┤
│                                 │
│         School Logo             │
│       (120x120px)              │
│                                 │
│    "Welcome to Harry School"    │
│        (auth-title)             │
│                                 │
│   "Sign in to access your       │
│    learning platform"          │
│       (auth-subtitle)           │
│                                 │
│                                 │
│     [Sign In Button]           │
│                                 │
│     Language Selector          │
│    🇺🇸 EN | 🇷🇺 RU | 🇺🇿 UZ     │
│                                 │
│                                 │
│        Bottom Safe Area        │
└─────────────────────────────────┘
```

#### Visual Specifications
- **Background**: Subtle gradient from `--surface` to white
- **Logo**: Centered, with subtle shadow
- **Button**: Full-width with 16px horizontal margins
- **Language Selector**: Horizontal tabs with flag icons

### 2. Role Selection Screen

#### Layout for Mixed User Types
```
┌─────────────────────────────────┐
│    [Back] "Choose Your Role"    │
├─────────────────────────────────┤
│                                 │
│     👨‍🏫 Teacher Access           │
│   ┌─────────────────────────┐   │
│   │  "Quick access with PIN  │   │
│   │   or biometric login"    │   │
│   └─────────────────────────┘   │
│                                 │
│     👨‍🎓 Student Access           │
│   ┌─────────────────────────┐   │
│   │ "Secure access to your   │   │
│   │   learning materials"    │   │
│   └─────────────────────────┘   │
│                                 │
│       Need help? Contact        │
│     your administrator         │
│                                 │
└─────────────────────────────────┘
```

#### Interaction Design
- **Card-based selection**: Large touch targets (minimum 88px height)
- **Visual hierarchy**: Icons, titles, and descriptions
- **Accessibility**: High contrast, screen reader friendly

### 3. Teacher Authentication Screens

#### Primary Login (PIN Entry)
```
┌─────────────────────────────────┐
│ [Back] "Quick Sign In" [Help]   │
├─────────────────────────────────┤
│                                 │
│     👨‍🏫 Welcome Back, Teacher     │
│                                 │
│      Enter your 4-digit PIN     │
│                                 │
│       ● ● ● ●                   │
│    [  ] [  ] [  ] [  ]         │
│                                 │
│     1   2   3                   │
│     4   5   6                   │
│     7   8   9                   │
│       * 0 #                     │
│                                 │
│   [👆 Use Fingerprint]          │
│                                 │
│   Forgot PIN? [Use Password]    │
│                                 │
└─────────────────────────────────┘
```

#### Biometric Prompt Overlay
```
┌─────────────────────────────────┐
│          Modal Overlay          │
│ ┌─────────────────────────────┐ │
│ │     👆 Touch Sensor         │ │
│ │                             │ │
│ │   Place your finger on      │ │
│ │   the sensor to sign in     │ │
│ │                             │ │
│ │     [Cancel] [Use PIN]      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### Email/Password Fallback
```
┌─────────────────────────────────┐
│  [Back] "Full Sign In" [Help]   │
├─────────────────────────────────┤
│                                 │
│   📧 Email Address              │
│   ┌─────────────────────────┐   │
│   │ teacher@harryschool.com │   │
│   └─────────────────────────┘   │
│                                 │
│   🔐 Password                   │
│   ┌─────────────────────────┐   │
│   │ ••••••••••••••••••••    │   │
│   └─────────────────────────┘   │
│                                 │
│   ☑️ Remember this device       │
│                                 │
│        [Sign In]               │
│                                 │
│     Forgot password?           │
│                                 │
└─────────────────────────────────┘
```

### 4. Student Authentication Screens

#### Age-Appropriate Design (Ages 10-12)
```
┌─────────────────────────────────┐
│    [Back] "Let's Sign In!" 🎓   │
├─────────────────────────────────┤
│                                 │
│       Hi there, Student! 👋     │
│                                 │
│     Draw your special pattern   │
│                                 │
│       ┌─ ─ ─ ─ ─ ─ ─ ─ ─┐       │
│       │ ○   ○   ○   ○   ○ │       │
│       │                   │       │
│       │ ○   ○   ○   ○   ○ │       │
│       │                   │       │
│       │ ○   ○   ○   ○   ○ │       │
│       └─ ─ ─ ─ ─ ─ ─ ─ ─┘       │
│                                 │
│      Need help? Ask your        │
│      teacher or parent! 👪      │
│                                 │
└─────────────────────────────────┘
```

#### Standard Design (Ages 13+)
```
┌─────────────────────────────────┐
│   [Back] "Student Sign In"      │
├─────────────────────────────────┤
│                                 │
│   📚 Ready to Learn?            │
│                                 │
│   📧 Your Email                 │
│   ┌─────────────────────────┐   │
│   │ student@email.com       │   │
│   └─────────────────────────┘   │
│                                 │
│   🔐 Password                   │
│   ┌─────────────────────────┐   │
│   │ ••••••••••••••••••••    │   │
│   └─────────────────────────┘   │
│                                 │
│        [Sign In] 🚀             │
│                                 │
│   [👆 Use Fingerprint] (if available) │
│                                 │
│     Trouble signing in?         │
│    Contact your teacher         │
│                                 │
└─────────────────────────────────┘
```

### 5. First-Time Setup Flows

#### Teacher PIN Setup
```
┌─────────────────────────────────┐
│      "Create Your Quick PIN"    │
│           Step 2 of 4           │
├─────────────────────────────────┤
│                                 │
│   Choose a 4-6 digit PIN for    │
│      quick daily access         │
│                                 │
│       ● ● ● ●                   │
│    [  ] [  ] [  ] [  ]         │
│                                 │
│     1   2   3                   │
│     4   5   6                   │
│     7   8   9                   │
│       * 0 #                     │
│                                 │
│   💡 Tips for a strong PIN:     │
│   • Don't use 1234 or 0000     │
│   • Avoid birthdays             │
│   • Make it memorable           │
│                                 │
│         [Continue]              │
│                                 │
└─────────────────────────────────┘
```

#### Biometric Enrollment
```
┌─────────────────────────────────┐
│    "Add Fingerprint Access"     │
│           Step 3 of 4           │
├─────────────────────────────────┤
│                                 │
│        👆 Fingerprint           │
│                                 │
│   Sign in even faster with      │
│      your fingerprint           │
│                                 │
│   ✓ More secure than PIN        │
│   ✓ No passwords to remember    │
│   ✓ Works when PIN is forgotten │
│                                 │
│     [Set Up Fingerprint]        │
│                                 │
│        [Skip for Now]           │
│                                 │
│   🔒 Your fingerprint data      │
│   stays on your device only     │
│                                 │
└─────────────────────────────────┘
```

## Component Specifications

### Input Fields

#### Standard Text Input
```css
.auth-input {
  height: 48px;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  background: white;
  transition: border-color 0.2s ease;
}

.auth-input:focus {
  border-color: var(--border-focus);
  outline: none;
  box-shadow: 0 0 0 3px rgba(29, 116, 82, 0.1);
}

.auth-input.error {
  border-color: var(--error-color);
  background: #fef2f2;
}
```

#### PIN Input Circles
```css
.pin-circle {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 50%;
  margin: 0 8px;
  background: white;
  transition: all 0.2s ease;
}

.pin-circle.filled {
  background: var(--primary-green);
  border-color: var(--primary-green);
}

.pin-circle.error {
  border-color: var(--error-color);
  animation: shake 0.3s ease-in-out;
}
```

### Buttons

#### Primary Button
```css
.auth-button-primary {
  height: 48px;
  padding: 0 24px;
  background: var(--primary-green);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  min-width: 120px;
}

.auth-button-primary:hover {
  background: var(--primary-green-dark);
}

.auth-button-primary:disabled {
  background: var(--text-light);
  cursor: not-allowed;
}
```

#### Biometric Button
```css
.biometric-button {
  height: 48px;
  padding: 0 20px;
  background: white;
  color: var(--primary-green);
  border: 2px solid var(--primary-green);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.biometric-button:hover {
  background: var(--primary-green);
  color: white;
}
```

### Error States

#### Error Message Display
```css
.error-message {
  color: var(--error-color);
  font-size: 14px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.error-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
```

#### Progressive Error Messaging
```javascript
const errorMessages = {
  attempt1: "Please check your credentials and try again.",
  attempt2: "Still having trouble? Make sure your email and password are correct.",
  attempt3: "Need help? Try using the 'Forgot Password' option below.",
  attempt4: "Having persistent issues? Contact your administrator for assistance.",
  lockout: "Account temporarily locked. Please try again in 15 minutes or contact support."
}
```

### Loading States

#### Spinner Component
```css
.auth-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--surface);
  border-top: 2px solid var(--primary-green);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## Accessibility Specifications

### Screen Reader Support
```html
<!-- Example accessible form -->
<form aria-label="Teacher sign in form">
  <label for="pin-input" class="sr-only">
    Enter your 4-digit PIN
  </label>
  <div role="group" aria-label="PIN entry">
    <input 
      id="pin-input" 
      type="password" 
      maxlength="1" 
      aria-describedby="pin-help"
    />
  </div>
  <div id="pin-help" class="sr-only">
    Enter digits one at a time using the number pad
  </div>
</form>
```

### Focus Management
```css
.focus-visible {
  outline: 2px solid var(--primary-green);
  outline-offset: 2px;
}

/* Skip to content link */
.skip-link {
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.skip-link:focus {
  position: fixed;
  top: 10px;
  left: 10px;
  width: auto;
  height: auto;
  padding: 8px 16px;
  background: var(--primary-green);
  color: white;
  z-index: 1000;
}
```

## Animation Specifications

### Micro-interactions

#### Success Animation
```css
@keyframes checkmark {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-checkmark {
  animation: checkmark 0.5s ease-out;
}
```

#### Error Shake Animation
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.input-error {
  animation: shake 0.3s ease-in-out;
}
```

#### Loading Pulse
```css
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.loading-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
```

## Responsive Design Breakpoints

### Mobile-First Approach
```css
/* Base styles for mobile (320px+) */
.auth-container {
  padding: var(--space-md);
  max-width: 100%;
}

/* Small tablets (576px+) */
@media (min-width: 576px) {
  .auth-container {
    max-width: 400px;
    margin: 0 auto;
    padding: var(--space-lg);
  }
}

/* Large tablets (768px+) */
@media (min-width: 768px) {
  .auth-container {
    max-width: 480px;
  }
}
```

## Platform-Specific Considerations

### iOS Specific
- Use native iOS keyboard for PIN entry
- Respect safe area insets
- Support iOS biometric prompts
- Follow iOS Human Interface Guidelines

### Android Specific
- Material Design 3 components where appropriate
- Support Android biometric prompts
- Handle navigation gestures
- Respect system theme preferences

## Testing Specifications

### Visual Testing Checklist
- [ ] All text is readable at minimum font sizes
- [ ] Color contrast ratios meet WCAG AA standards
- [ ] Touch targets are minimum 44px
- [ ] Error states are clearly visible
- [ ] Loading states provide adequate feedback
- [ ] Animations don't cause motion sickness

### Functional Testing Scenarios
- [ ] PIN entry with correct/incorrect codes
- [ ] Biometric authentication success/failure
- [ ] Password field show/hide functionality
- [ ] Form validation and error messaging
- [ ] Network connectivity issues
- [ ] Device rotation handling
- [ ] Keyboard appearance/dismissal

This specification provides the detailed visual and interaction design foundation needed to implement the authentication flows identified in the UX research, ensuring consistent, accessible, and user-friendly authentication experiences across both teacher and student applications.