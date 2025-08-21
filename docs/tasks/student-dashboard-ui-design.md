# Student Dashboard UI Design Specifications

**Agent**: ui-designer  
**Date**: August 20, 2025  
**Project**: Harry School Student Mobile App Dashboard Visual Design  
**Based on**: UX Research (`student-dashboard-ux.md`) and Architecture (`student-dashboard-architecture.md`)

---

## Executive Summary

This document provides comprehensive visual design specifications for the Harry School Student Dashboard, implementing age-appropriate educational micro-animations, cultural sensitivity for the Uzbekistan context, and accessibility-first design principles. The design system balances motivation psychology with performance optimization for 60fps interactions.

**Key Design Decisions:**
- Age-adaptive visual complexity (elementary: vibrant/gamified, secondary: sophisticated/analytical)
- Educational micro-animations with celebration effects for achievements
- Harry School brand color (#1d7452) integrated throughout design system
- Accessibility-compliant touch targets and animations
- Cultural sensitivity with multilingual typography support
- Performance-optimized animations targeting 60fps

---

## Design Token System

### Color Palette
```css
/* Harry School Brand Colors */
--hs-primary: #1d7452;           /* Main brand green */
--hs-primary-light: #2a9d6f;     /* Hover and active states */
--hs-primary-dark: #154d36;      /* Pressed states */
--hs-primary-subtle: #e8f5f0;    /* Background tints */

/* Educational Status Colors */
--hs-success: #10b981;           /* Achievement green */
--hs-warning: #f59e0b;           /* Attention amber */
--hs-error: #ef4444;             /* Error red */
--hs-info: #3b82f6;              /* Information blue */

/* Age-Specific Color Variations */
/* Elementary (10-12): Higher saturation, warmer tones */
--hs-elementary-primary: #22c55e;
--hs-elementary-success: #16a34a;
--hs-elementary-celebration: #fbbf24;

/* Secondary (13-18): Professional tones, lower saturation */
--hs-secondary-primary: #1d7452;
--hs-secondary-success: #059669;
--hs-secondary-professional: #374151;

/* Neutral Scale */
--hs-gray-50: #fafafa;
--hs-gray-100: #f4f4f5;
--hs-gray-200: #e4e4e7;
--hs-gray-300: #d4d4d8;
--hs-gray-400: #a1a1aa;
--hs-gray-500: #71717a;
--hs-gray-600: #52525b;
--hs-gray-700: #3f3f46;
--hs-gray-800: #27272a;
--hs-gray-900: #18181b;

/* Cultural Color Adaptations */
--hs-cultural-blue: #0ea5e9;     /* Preferred in Uzbekistan culture */
--hs-cultural-gold: #eab308;     /* Traditional gold accents */
--hs-uzbek-flag-blue: #0099ff;   /* National identity reference */
```

### Typography Scale
```css
/* Font Families */
--hs-font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--hs-font-display: "Inter", sans-serif;
--hs-font-mono: "SF Mono", "Monaco", "Consolas", monospace;

/* Age-Adaptive Font Sizes */
/* Elementary (10-12): Larger, more readable */
--hs-text-xs-elem: 14px;         /* Larger than standard 12px */
--hs-text-sm-elem: 16px;         /* Body text minimum */
--hs-text-base-elem: 18px;       /* Primary content */
--hs-text-lg-elem: 20px;         /* Subheadings */
--hs-text-xl-elem: 24px;         /* Card titles */
--hs-text-2xl-elem: 28px;        /* Section headers */
--hs-text-3xl-elem: 32px;        /* Display text */

/* Secondary (13-18): Standard sizing for information density */
--hs-text-xs-sec: 12px;
--hs-text-sm-sec: 14px;
--hs-text-base-sec: 16px;
--hs-text-lg-sec: 18px;
--hs-text-xl-sec: 20px;
--hs-text-2xl-sec: 24px;
--hs-text-3xl-sec: 30px;

/* Font Weights */
--hs-font-light: 300;
--hs-font-normal: 400;
--hs-font-medium: 500;
--hs-font-semibold: 600;
--hs-font-bold: 700;
--hs-font-extrabold: 800;

/* Line Heights */
--hs-leading-tight: 1.25;
--hs-leading-snug: 1.375;
--hs-leading-normal: 1.5;
--hs-leading-relaxed: 1.625;
--hs-leading-loose: 2;
```

### Spacing System
```css
/* Base Spacing Scale */
--hs-space-0: 0;
--hs-space-1: 4px;
--hs-space-2: 8px;
--hs-space-3: 12px;
--hs-space-4: 16px;
--hs-space-5: 20px;
--hs-space-6: 24px;
--hs-space-8: 32px;
--hs-space-10: 40px;
--hs-space-12: 48px;
--hs-space-16: 64px;
--hs-space-20: 80px;

/* Age-Adaptive Touch Targets */
--hs-touch-min: 44px;            /* iOS/Android minimum */
--hs-touch-elementary: 52px;     /* Enhanced for ages 10-12 */
--hs-touch-comfortable: 48px;    /* Comfortable for all ages */

/* Card Spacing */
--hs-card-padding-elem: 24px;    /* Elementary: More generous */
--hs-card-padding-sec: 16px;     /* Secondary: Efficient */
--hs-card-gap: 16px;             /* Between cards */
--hs-card-radius: 16px;          /* Friendly, modern radius */
```

### Animation Specifications
```css
/* Educational Micro-Animation Durations */
--hs-duration-instant: 0ms;
--hs-duration-fast: 150ms;       /* Quick feedback */
--hs-duration-normal: 300ms;     /* Standard transitions */
--hs-duration-slow: 500ms;       /* Celebration animations */
--hs-duration-celebration: 800ms; /* Achievement unlocks */

/* Easing Functions */
--hs-ease-linear: cubic-bezier(0, 0, 1, 1);
--hs-ease-in: cubic-bezier(0.4, 0, 1, 1);
--hs-ease-out: cubic-bezier(0, 0, 0.2, 1);
--hs-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--hs-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--hs-ease-celebration: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Spring Animations for Achievement Celebrations */
--hs-spring-gentle: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--hs-spring-bouncy: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

---

## Component Visual Specifications

### 1. RankingCard with Animated Counters

#### Elementary Version (Ages 10-12)
```css
.ranking-card-elementary {
  /* Container */
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
  border: 2px solid var(--hs-elementary-celebration);
  border-radius: var(--hs-card-radius);
  padding: var(--hs-card-padding-elem);
  min-height: 180px;
  position: relative;
  overflow: hidden;
  
  /* Celebration Sparkles Background */
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(251, 191, 36, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%);
  
  /* Animated gradient border */
  position: relative;
}

.ranking-card-elementary::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, 
    var(--hs-elementary-celebration) 0%,
    var(--hs-elementary-primary) 25%,
    var(--hs-elementary-success) 50%,
    var(--hs-elementary-celebration) 75%,
    var(--hs-elementary-primary) 100%
  );
  border-radius: var(--hs-card-radius);
  z-index: -1;
  animation: border-rotate 3s linear infinite;
}

@keyframes border-rotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.ranking-position-elementary {
  font-size: 48px;
  font-weight: var(--hs-font-extrabold);
  color: var(--hs-elementary-primary);
  text-align: center;
  margin-bottom: var(--hs-space-3);
  
  /* Celebration bounce animation */
  animation: position-celebrate 2s var(--hs-ease-bounce) infinite;
}

@keyframes position-celebrate {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
  60% { transform: translateY(-4px); }
}

.points-counter-elementary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--hs-space-2);
  margin-bottom: var(--hs-space-4);
}

.points-number {
  font-size: var(--hs-text-2xl-elem);
  font-weight: var(--hs-font-bold);
  color: var(--hs-elementary-success);
  
  /* Counter animation */
  animation: points-increment 0.8s var(--hs-ease-out);
}

@keyframes points-increment {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); color: var(--hs-elementary-celebration); }
  100% { transform: scale(1); }
}

.points-icon {
  width: 24px;
  height: 24px;
  background: var(--hs-elementary-celebration);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: coin-flip 1.5s ease-in-out infinite alternate;
}

@keyframes coin-flip {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(180deg); }
}

.streak-indicator-elementary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--hs-space-2);
  background: var(--hs-primary-subtle);
  padding: var(--hs-space-3);
  border-radius: var(--hs-space-4);
}

.fire-icon {
  animation: fire-flicker 1s ease-in-out infinite alternate;
}

@keyframes fire-flicker {
  0% { transform: scale(1) rotate(-2deg); filter: hue-rotate(0deg); }
  50% { transform: scale(1.1) rotate(2deg); filter: hue-rotate(10deg); }
  100% { transform: scale(1) rotate(-1deg); filter: hue-rotate(0deg); }
}

.mascot-character {
  position: absolute;
  bottom: var(--hs-space-4);
  right: var(--hs-space-4);
  width: 48px;
  height: 48px;
  animation: mascot-cheer 3s ease-in-out infinite;
}

@keyframes mascot-cheer {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-4px) rotate(-5deg); }
  50% { transform: translateY(-8px) rotate(0deg); }
  75% { transform: translateY(-4px) rotate(5deg); }
}
```

#### Secondary Version (Ages 13-18)
```css
.ranking-card-secondary {
  background: var(--hs-gray-50);
  border: 1px solid var(--hs-gray-200);
  border-radius: var(--hs-card-radius);
  padding: var(--hs-card-padding-sec);
  min-height: 140px;
  transition: all var(--hs-duration-normal) var(--hs-ease-out);
}

.ranking-card-secondary:hover {
  border-color: var(--hs-primary-light);
  box-shadow: 0 8px 32px rgba(29, 116, 82, 0.12);
  transform: translateY(-2px);
}

.ranking-header-secondary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--hs-space-4);
}

.ranking-position-secondary {
  font-size: var(--hs-text-xl-sec);
  font-weight: var(--hs-font-semibold);
  color: var(--hs-secondary-primary);
}

.privacy-toggle {
  background: var(--hs-gray-100);
  border: none;
  border-radius: var(--hs-space-3);
  padding: var(--hs-space-2) var(--hs-space-3);
  font-size: var(--hs-text-xs-sec);
  color: var(--hs-gray-600);
  transition: all var(--hs-duration-fast) var(--hs-ease-out);
}

.privacy-toggle:hover {
  background: var(--hs-primary-subtle);
  color: var(--hs-primary);
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--hs-space-4);
  margin-top: var(--hs-space-4);
}

.metric-item {
  text-align: center;
}

.metric-value {
  font-size: var(--hs-text-lg-sec);
  font-weight: var(--hs-font-semibold);
  color: var(--hs-gray-900);
  margin-bottom: var(--hs-space-1);
}

.metric-label {
  font-size: var(--hs-text-xs-sec);
  color: var(--hs-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.improvement-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--hs-space-1);
  font-size: var(--hs-text-xs-sec);
  color: var(--hs-success);
  margin-top: var(--hs-space-1);
}
```

### 2. TodaySchedule Component

#### Elementary Version (Ages 10-12)
```css
.schedule-card-elementary {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 2px solid var(--hs-info);
  border-radius: var(--hs-card-radius);
  padding: var(--hs-card-padding-elem);
  min-height: 160px;
}

.schedule-header-elementary {
  display: flex;
  align-items: center;
  gap: var(--hs-space-3);
  margin-bottom: var(--hs-space-5);
}

.time-display-elementary {
  font-size: var(--hs-text-3xl-elem);
  font-weight: var(--hs-font-bold);
  color: var(--hs-info);
  animation: time-pulse 2s ease-in-out infinite;
}

@keyframes time-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.schedule-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--hs-space-4);
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: var(--hs-space-4);
  padding: var(--hs-space-3);
  background: white;
  border-radius: var(--hs-space-3);
  border-left: 4px solid var(--hs-info);
  transition: all var(--hs-duration-normal) var(--hs-ease-out);
}

.timeline-item.current {
  border-left-color: var(--hs-elementary-celebration);
  background: var(--hs-primary-subtle);
  animation: current-glow 2s ease-in-out infinite;
}

@keyframes current-glow {
  0%, 100% { box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
  50% { box-shadow: 0 0 16px rgba(251, 191, 36, 0.3); }
}

.subject-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--hs-space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  animation: icon-bounce 0.5s var(--hs-ease-bounce);
}

.subject-icon.math { background: #fecaca; }
.subject-icon.english { background: #fed7d7; }
.subject-icon.science { background: #d1fae5; }

.completion-checkmark {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--hs-elementary-success);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: checkmark-appear 0.6s var(--hs-ease-celebration);
}

@keyframes checkmark-appear {
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  50% { transform: scale(1.3) rotate(0deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
```

#### Secondary Version (Ages 13-18)
```css
.schedule-card-secondary {
  background: white;
  border: 1px solid var(--hs-gray-200);
  border-radius: var(--hs-card-radius);
  padding: var(--hs-card-padding-sec);
}

.schedule-tabs {
  display: flex;
  gap: var(--hs-space-2);
  margin-bottom: var(--hs-space-4);
  background: var(--hs-gray-100);
  border-radius: var(--hs-space-2);
  padding: var(--hs-space-1);
}

.schedule-tab {
  flex: 1;
  background: transparent;
  border: none;
  padding: var(--hs-space-2) var(--hs-space-3);
  border-radius: var(--hs-space-1);
  font-size: var(--hs-text-sm-sec);
  font-weight: var(--hs-font-medium);
  color: var(--hs-gray-600);
  transition: all var(--hs-duration-fast) var(--hs-ease-out);
}

.schedule-tab.active {
  background: white;
  color: var(--hs-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.schedule-list-secondary {
  display: flex;
  flex-direction: column;
  gap: var(--hs-space-3);
}

.schedule-item-secondary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--hs-space-3);
  border-radius: var(--hs-space-2);
  transition: background-color var(--hs-duration-fast) var(--hs-ease-out);
}

.schedule-item-secondary:hover {
  background: var(--hs-gray-50);
}

.schedule-item-secondary.current {
  background: var(--hs-primary-subtle);
  border-left: 3px solid var(--hs-primary);
}

.priority-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: var(--hs-space-2);
}

.priority-indicator.high { background: var(--hs-error); }
.priority-indicator.medium { background: var(--hs-warning); }
.priority-indicator.low { background: var(--hs-success); }

.time-remaining {
  font-size: var(--hs-text-xs-sec);
  color: var(--hs-gray-500);
  background: var(--hs-gray-100);
  padding: var(--hs-space-1) var(--hs-space-2);
  border-radius: var(--hs-space-1);
}
```

### 3. PendingTasks Component

#### Elementary Version (Quest-Style)
```css
.tasks-card-elementary {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  border: 2px solid #a855f7;
  border-radius: var(--hs-card-radius);
  padding: var(--hs-card-padding-elem);
  position: relative;
  overflow: hidden;
}

.tasks-card-elementary::before {
  content: '⭐';
  position: absolute;
  top: var(--hs-space-4);
  right: var(--hs-space-4);
  font-size: 24px;
  animation: star-twinkle 2s ease-in-out infinite;
}

@keyframes star-twinkle {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.quest-header {
  text-align: center;
  margin-bottom: var(--hs-space-5);
}

.quest-title {
  font-size: var(--hs-text-xl-elem);
  font-weight: var(--hs-font-bold);
  color: #7c3aed;
  margin-bottom: var(--hs-space-2);
}

.quest-subtitle {
  font-size: var(--hs-text-sm-elem);
  color: #6b21a8;
  opacity: 0.8;
}

.quest-list {
  display: flex;
  flex-direction: column;
  gap: var(--hs-space-3);
}

.quest-item {
  background: white;
  border: 2px dashed transparent;
  border-radius: var(--hs-space-3);
  padding: var(--hs-space-4);
  transition: all var(--hs-duration-normal) var(--hs-ease-out);
  cursor: pointer;
  position: relative;
}

.quest-item:hover {
  border-color: #a855f7;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(168, 85, 247, 0.2);
}

.quest-difficulty {
  display: flex;
  gap: var(--hs-space-1);
  margin-bottom: var(--hs-space-2);
}

.difficulty-star {
  width: 16px;
  height: 16px;
  background: #fbbf24;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  animation: star-shine 0.5s ease-out;
}

@keyframes star-shine {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.reward-preview {
  position: absolute;
  top: var(--hs-space-2);
  right: var(--hs-space-2);
  background: #fbbf24;
  color: white;
  font-size: var(--hs-text-xs-elem);
  padding: var(--hs-space-1) var(--hs-space-2);
  border-radius: var(--hs-space-1);
  font-weight: var(--hs-font-semibold);
}

.quest-progress {
  width: 100%;
  height: 8px;
  background: #e9d5ff;
  border-radius: 4px;
  overflow: hidden;
  margin-top: var(--hs-space-3);
}

.quest-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #a855f7, #c084fc);
  border-radius: 4px;
  transition: width var(--hs-duration-slow) var(--hs-ease-out);
}
```

#### Secondary Version (Productivity-Style)
```css
.tasks-card-secondary {
  background: white;
  border: 1px solid var(--hs-gray-200);
  border-radius: var(--hs-card-radius);
  padding: var(--hs-card-padding-sec);
}

.tasks-header-secondary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--hs-space-4);
}

.tasks-filter {
  display: flex;
  gap: var(--hs-space-2);
}

.filter-chip {
  background: var(--hs-gray-100);
  border: none;
  padding: var(--hs-space-1) var(--hs-space-3);
  border-radius: var(--hs-space-4);
  font-size: var(--hs-text-xs-sec);
  font-weight: var(--hs-font-medium);
  color: var(--hs-gray-600);
  transition: all var(--hs-duration-fast) var(--hs-ease-out);
}

.filter-chip.active {
  background: var(--hs-primary);
  color: white;
}

.priority-matrix {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--hs-space-3);
  margin-bottom: var(--hs-space-4);
}

.matrix-quadrant {
  padding: var(--hs-space-3);
  border-radius: var(--hs-space-2);
  border-left: 3px solid;
}

.matrix-quadrant.urgent-important {
  background: #fef2f2;
  border-left-color: var(--hs-error);
}

.matrix-quadrant.important-not-urgent {
  background: #fefbf2;
  border-left-color: var(--hs-warning);
}

.quadrant-header {
  font-size: var(--hs-text-xs-sec);
  font-weight: var(--hs-font-semibold);
  color: var(--hs-gray-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--hs-space-2);
}

.task-item-secondary {
  display: flex;
  align-items: center;
  gap: var(--hs-space-3);
  padding: var(--hs-space-2);
  border-radius: var(--hs-space-1);
  transition: background-color var(--hs-duration-fast) var(--hs-ease-out);
}

.task-item-secondary:hover {
  background: var(--hs-gray-50);
}

.task-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--hs-gray-300);
  border-radius: var(--hs-space-1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--hs-duration-fast) var(--hs-ease-out);
}

.task-checkbox:hover {
  border-color: var(--hs-primary);
}

.task-checkbox.completed {
  background: var(--hs-success);
  border-color: var(--hs-success);
  animation: checkbox-complete 0.3s var(--hs-ease-celebration);
}

@keyframes checkbox-complete {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.task-details {
  flex: 1;
}

.task-title-secondary {
  font-size: var(--hs-text-sm-sec);
  font-weight: var(--hs-font-medium);
  color: var(--hs-gray-900);
  margin-bottom: var(--hs-space-1);
}

.task-meta {
  display: flex;
  gap: var(--hs-space-3);
  font-size: var(--hs-text-xs-sec);
  color: var(--hs-gray-500);
}

.due-date {
  display: flex;
  align-items: center;
  gap: var(--hs-space-1);
}

.due-date.overdue {
  color: var(--hs-error);
  font-weight: var(--hs-font-medium);
}

.collaboration-indicator {
  display: flex;
  align-items: center;
  gap: var(--hs-space-1);
}

.collaborator-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--hs-primary);
}
```

### 4. RecentAchievements Component

#### Elementary Version (Badge Gallery)
```css
.achievements-card-elementary {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid var(--hs-elementary-celebration);
  border-radius: var(--hs-card-radius);
  padding: var(--hs-card-padding-elem);
  position: relative;
  overflow: hidden;
}

.achievements-card-elementary::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, 
    transparent 30%, 
    rgba(255, 255, 255, 0.3) 50%, 
    transparent 70%
  );
  animation: shine-sweep 3s ease-in-out infinite;
}

@keyframes shine-sweep {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
}

.achievement-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--hs-space-4);
  margin-bottom: var(--hs-space-5);
}

.achievement-badge {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  cursor: pointer;
  transition: all var(--hs-duration-normal) var(--hs-ease-out);
  animation: badge-float 3s ease-in-out infinite;
}

.achievement-badge:nth-child(2) { animation-delay: 0.5s; }
.achievement-badge:nth-child(3) { animation-delay: 1s; }

@keyframes badge-float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.05); }
}

.achievement-badge:hover {
  transform: scale(1.2);
  box-shadow: 0 8px 32px rgba(251, 191, 36, 0.4);
}

.achievement-badge.new {
  animation: new-badge-celebrate 1s var(--hs-ease-celebration);
}

@keyframes new-badge-celebrate {
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  50% { transform: scale(1.3) rotate(0deg); opacity: 1; }
  70% { transform: scale(0.9) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.achievement-glow {
  position: absolute;
  inset: -8px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.treasure-chest {
  text-align: center;
  margin-top: var(--hs-space-4);
}

.chest-title {
  font-size: var(--hs-text-lg-elem);
  font-weight: var(--hs-font-bold);
  color: #b45309;
  margin-bottom: var(--hs-space-2);
}

.collection-progress {
  background: white;
  border-radius: var(--hs-space-2);
  padding: var(--hs-space-3);
  display: flex;
  align-items: center;
  gap: var(--hs-space-3);
}

.progress-ring {
  width: 40px;
  height: 40px;
  position: relative;
}

.progress-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    var(--hs-elementary-celebration) 0deg,
    var(--hs-elementary-celebration) calc(var(--progress, 75) * 3.6deg),
    var(--hs-gray-200) calc(var(--progress, 75) * 3.6deg),
    var(--hs-gray-200) 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--hs-text-sm-elem);
  font-weight: var(--hs-font-bold);
  color: white;
}
```

#### Secondary Version (Portfolio Integration)
```css
.achievements-card-secondary {
  background: white;
  border: 1px solid var(--hs-gray-200);
  border-radius: var(--hs-card-radius);
  padding: var(--hs-card-padding-sec);
}

.achievement-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--hs-space-4);
}

.achievement-item-secondary {
  display: flex;
  gap: var(--hs-space-4);
  padding: var(--hs-space-4);
  border-radius: var(--hs-space-2);
  transition: all var(--hs-duration-fast) var(--hs-ease-out);
}

.achievement-item-secondary:hover {
  background: var(--hs-gray-50);
}

.achievement-icon-secondary {
  width: 48px;
  height: 48px;
  border-radius: var(--hs-space-2);
  background: var(--hs-primary-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--hs-primary);
  flex-shrink: 0;
}

.achievement-content {
  flex: 1;
}

.achievement-title-secondary {
  font-size: var(--hs-text-base-sec);
  font-weight: var(--hs-font-semibold);
  color: var(--hs-gray-900);
  margin-bottom: var(--hs-space-1);
}

.achievement-description {
  font-size: var(--hs-text-sm-sec);
  color: var(--hs-gray-600);
  margin-bottom: var(--hs-space-2);
}

.achievement-meta-secondary {
  display: flex;
  gap: var(--hs-space-3);
  align-items: center;
}

.skill-tags {
  display: flex;
  gap: var(--hs-space-2);
}

.skill-tag {
  background: var(--hs-gray-100);
  color: var(--hs-gray-700);
  font-size: var(--hs-text-xs-sec);
  padding: var(--hs-space-1) var(--hs-space-2);
  border-radius: var(--hs-space-1);
  font-weight: var(--hs-font-medium);
}

.share-options {
  display: flex;
  gap: var(--hs-space-2);
  margin-left: auto;
}

.share-button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--hs-gray-300);
  border-radius: var(--hs-space-1);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--hs-gray-600);
  transition: all var(--hs-duration-fast) var(--hs-ease-out);
}

.share-button:hover {
  border-color: var(--hs-primary);
  color: var(--hs-primary);
}

.portfolio-connection {
  background: var(--hs-primary-subtle);
  border-radius: var(--hs-space-2);
  padding: var(--hs-space-3);
  margin-top: var(--hs-space-4);
  text-align: center;
}

.portfolio-title {
  font-size: var(--hs-text-sm-sec);
  font-weight: var(--hs-font-semibold);
  color: var(--hs-primary);
  margin-bottom: var(--hs-space-2);
}

.portfolio-button {
  background: var(--hs-primary);
  color: white;
  border: none;
  padding: var(--hs-space-2) var(--hs-space-4);
  border-radius: var(--hs-space-1);
  font-size: var(--hs-text-sm-sec);
  font-weight: var(--hs-font-medium);
  transition: all var(--hs-duration-fast) var(--hs-ease-out);
}

.portfolio-button:hover {
  background: var(--hs-primary-dark);
  transform: translateY(-1px);
}
```

### 5. QuickStats Component

#### Elementary Version (Simple Charts)
```css
.stats-card-elementary {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 2px solid var(--hs-elementary-success);
  border-radius: var(--hs-card-radius);
  padding: var(--hs-card-padding-elem);
}

.stats-grid-elementary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--hs-space-5);
  margin-bottom: var(--hs-space-5);
}

.stat-item-elementary {
  text-align: center;
  background: white;
  padding: var(--hs-space-4);
  border-radius: var(--hs-space-3);
  transition: all var(--hs-duration-normal) var(--hs-ease-out);
}

.stat-item-elementary:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
}

.stat-icon-elementary {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--hs-elementary-success);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--hs-space-3);
  font-size: 24px;
  color: white;
  animation: stat-icon-bounce 2s ease-in-out infinite;
}

@keyframes stat-icon-bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
  60% { transform: translateY(-2px); }
}

.stat-value-elementary {
  font-size: var(--hs-text-2xl-elem);
  font-weight: var(--hs-font-bold);
  color: var(--hs-elementary-success);
  margin-bottom: var(--hs-space-2);
  animation: stat-count-up 1s var(--hs-ease-out);
}

@keyframes stat-count-up {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.stat-label-elementary {
  font-size: var(--hs-text-sm-elem);
  color: var(--hs-gray-600);
  font-weight: var(--hs-font-medium);
}

.encouragement-message {
  background: white;
  padding: var(--hs-space-4);
  border-radius: var(--hs-space-3);
  text-align: center;
  border: 2px dashed var(--hs-elementary-success);
}

.encouragement-text {
  font-size: var(--hs-text-base-elem);
  font-weight: var(--hs-font-semibold);
  color: var(--hs-elementary-success);
  margin-bottom: var(--hs-space-2);
}

.parent-share-button {
  background: var(--hs-elementary-celebration);
  color: white;
  border: none;
  padding: var(--hs-space-3) var(--hs-space-5);
  border-radius: var(--hs-space-2);
  font-size: var(--hs-text-base-elem);
  font-weight: var(--hs-font-semibold);
  display: flex;
  align-items: center;
  gap: var(--hs-space-2);
  margin: 0 auto;
  transition: all var(--hs-duration-normal) var(--hs-ease-out);
}

.parent-share-button:hover {
  background: #f59e0b;
  transform: scale(1.05);
}
```

#### Secondary Version (Advanced Analytics)
```css
.stats-card-secondary {
  background: white;
  border: 1px solid var(--hs-gray-200);
  border-radius: var(--hs-card-radius);
  padding: var(--hs-card-padding-sec);
}

.stats-tabs-secondary {
  display: flex;
  gap: var(--hs-space-1);
  margin-bottom: var(--hs-space-5);
  background: var(--hs-gray-100);
  border-radius: var(--hs-space-2);
  padding: var(--hs-space-1);
}

.stats-tab {
  flex: 1;
  background: transparent;
  border: none;
  padding: var(--hs-space-2) var(--hs-space-3);
  border-radius: var(--hs-space-1);
  font-size: var(--hs-text-sm-sec);
  font-weight: var(--hs-font-medium);
  color: var(--hs-gray-600);
  transition: all var(--hs-duration-fast) var(--hs-ease-out);
}

.stats-tab.active {
  background: white;
  color: var(--hs-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.analytics-dashboard {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--hs-space-5);
  margin-bottom: var(--hs-space-5);
}

.main-chart {
  background: var(--hs-gray-50);
  border-radius: var(--hs-space-2);
  padding: var(--hs-space-4);
  height: 200px;
  position: relative;
}

.chart-title {
  font-size: var(--hs-text-base-sec);
  font-weight: var(--hs-font-semibold);
  color: var(--hs-gray-900);
  margin-bottom: var(--hs-space-4);
}

.trend-indicators {
  display: flex;
  flex-direction: column;
  gap: var(--hs-space-3);
}

.trend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--hs-space-3);
  background: var(--hs-gray-50);
  border-radius: var(--hs-space-2);
}

.trend-label {
  font-size: var(--hs-text-sm-sec);
  color: var(--hs-gray-700);
}

.trend-value {
  font-weight: var(--hs-font-semibold);
  color: var(--hs-gray-900);
}

.trend-change {
  display: flex;
  align-items: center;
  gap: var(--hs-space-1);
  font-size: var(--hs-text-xs-sec);
  margin-top: var(--hs-space-1);
}

.trend-change.positive {
  color: var(--hs-success);
}

.trend-change.negative {
  color: var(--hs-error);
}

.insights-section {
  background: var(--hs-primary-subtle);
  border-radius: var(--hs-space-2);
  padding: var(--hs-space-4);
}

.insights-title {
  font-size: var(--hs-text-base-sec);
  font-weight: var(--hs-font-semibold);
  color: var(--hs-primary);
  margin-bottom: var(--hs-space-3);
}

.insight-list {
  display: flex;
  flex-direction: column;
  gap: var(--hs-space-2);
}

.insight-item {
  font-size: var(--hs-text-sm-sec);
  color: var(--hs-gray-700);
  padding: var(--hs-space-2) 0;
  border-bottom: 1px solid var(--hs-gray-200);
}

.insight-item:last-child {
  border-bottom: none;
}

.goal-tracking {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--hs-space-4);
}

.goal-item {
  background: white;
  border: 1px solid var(--hs-gray-200);
  border-radius: var(--hs-space-2);
  padding: var(--hs-space-4);
  text-align: center;
}

.goal-progress-ring {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--hs-space-3);
  position: relative;
}

.progress-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-circle-bg {
  fill: none;
  stroke: var(--hs-gray-200);
  stroke-width: 8;
}

.progress-circle-fill {
  fill: none;
  stroke: var(--hs-primary);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset var(--hs-duration-slow) var(--hs-ease-out);
}

.goal-title {
  font-size: var(--hs-text-sm-sec);
  font-weight: var(--hs-font-semibold);
  color: var(--hs-gray-900);
  margin-bottom: var(--hs-space-1);
}

.goal-target {
  font-size: var(--hs-text-xs-sec);
  color: var(--hs-gray-500);
}
```

---

## Micro-Animations & Celebrations

### Achievement Unlock Animation
```css
@keyframes achievement-unlock {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  20% {
    transform: scale(1.2) rotate(-90deg);
    opacity: 0.7;
  }
  40% {
    transform: scale(0.9) rotate(0deg);
    opacity: 1;
  }
  60% {
    transform: scale(1.1) rotate(10deg);
  }
  80% {
    transform: scale(0.95) rotate(-5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.achievement-unlock {
  animation: achievement-unlock 1.2s var(--hs-ease-celebration);
}
```

### Points Counter Animation
```css
@keyframes points-celebration {
  0% { 
    transform: scale(1);
    color: var(--hs-primary);
  }
  25% { 
    transform: scale(1.3) translateY(-8px);
    color: var(--hs-elementary-celebration);
  }
  50% {
    transform: scale(1.1) translateY(-4px);
    color: var(--hs-success);
  }
  75% {
    transform: scale(1.2) translateY(-2px);
    color: var(--hs-elementary-celebration);
  }
  100% {
    transform: scale(1) translateY(0);
    color: var(--hs-primary);
  }
}

.points-increment {
  animation: points-celebration 0.8s var(--hs-ease-celebration);
}
```

### Streak Fire Animation
```css
@keyframes fire-dance {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    filter: hue-rotate(0deg) brightness(1);
  }
  25% {
    transform: scale(1.1) rotate(-2deg);
    filter: hue-rotate(10deg) brightness(1.1);
  }
  50% {
    transform: scale(1.05) rotate(2deg);
    filter: hue-rotate(20deg) brightness(1.2);
  }
  75% {
    transform: scale(1.08) rotate(-1deg);
    filter: hue-rotate(10deg) brightness(1.1);
  }
}

.streak-fire {
  animation: fire-dance 1.5s ease-in-out infinite;
}
```

### Progress Bar Fill Animation
```css
@keyframes progress-fill {
  0% {
    width: 0%;
    background: var(--hs-gray-300);
  }
  50% {
    background: var(--hs-warning);
  }
  100% {
    width: var(--progress-width);
    background: var(--hs-success);
  }
}

.progress-bar-animated {
  animation: progress-fill 1.5s var(--hs-ease-out) forwards;
}
```

### Task Completion Celebration
```css
@keyframes task-complete-celebration {
  0% {
    transform: scale(1);
    background: transparent;
    border-color: var(--hs-gray-300);
  }
  20% {
    transform: scale(1.2);
    background: var(--hs-success);
    border-color: var(--hs-success);
  }
  40% {
    transform: scale(0.9);
  }
  60% {
    transform: scale(1.1);
  }
  80% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
    background: var(--hs-success);
    border-color: var(--hs-success);
  }
}

.task-completion {
  animation: task-complete-celebration 0.6s var(--hs-ease-celebration);
}
```

---

## Accessibility Features

### Screen Reader Optimizations
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: var(--hs-space-2);
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### High Contrast Mode Support
```css
@media (prefers-contrast: high) {
  .dashboard-card {
    border-width: 2px;
    border-color: var(--hs-gray-900);
  }
  
  .achievement-badge {
    border: 3px solid var(--hs-gray-900);
  }
  
  .progress-bar {
    border: 2px solid var(--hs-gray-900);
  }
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .achievement-badge,
  .points-counter,
  .streak-fire,
  .mascot-character {
    animation: none;
  }
  
  .card-hover-effect {
    transform: none;
    transition: box-shadow var(--hs-duration-fast) var(--hs-ease-out);
  }
  
  .progress-bar-animated {
    animation-duration: 0.1s;
  }
}
```

### Focus Management
```css
.dashboard-card:focus {
  outline: 3px solid var(--hs-primary);
  outline-offset: 2px;
  border-color: var(--hs-primary);
}

.achievement-badge:focus {
  outline: 3px solid var(--hs-elementary-celebration);
  outline-offset: 4px;
  transform: scale(1.05);
}

.task-item:focus {
  background: var(--hs-primary-subtle);
  outline: 2px solid var(--hs-primary);
  outline-offset: 1px;
}
```

### Touch Target Enhancements
```css
/* Elementary students get larger touch targets */
.age-elementary .interactive-element {
  min-height: var(--hs-touch-elementary);
  min-width: var(--hs-touch-elementary);
  padding: var(--hs-space-3);
}

.age-elementary .achievement-badge {
  width: 72px;
  height: 72px;
  touch-action: manipulation;
}

/* Secondary students get standard sizing */
.age-secondary .interactive-element {
  min-height: var(--hs-touch-min);
  min-width: var(--hs-touch-min);
  padding: var(--hs-space-2);
}
```

---

## Cultural Adaptations

### Multilingual Typography
```css
/* Latin script (English/Uzbek Latin) */
.lang-latin {
  font-family: var(--hs-font-sans);
  letter-spacing: normal;
}

/* Cyrillic script (Russian/Uzbek Cyrillic) */
.lang-cyrillic {
  font-family: "Inter", "Segoe UI", "Roboto", sans-serif;
  letter-spacing: 0.01em;
}

/* RTL support for future Arabic script */
.lang-arabic {
  direction: rtl;
  text-align: right;
}

.lang-arabic .card-layout {
  flex-direction: row-reverse;
}
```

### Cultural Color Preferences
```css
/* Traditional Uzbek colors */
.cultural-theme-uzbek {
  --primary: var(--hs-uzbek-flag-blue);
  --accent: var(--hs-cultural-gold);
  --success: #16a34a;
}

/* Professional education theme */
.cultural-theme-professional {
  --primary: var(--hs-primary);
  --accent: var(--hs-cultural-blue);
  --neutral: var(--hs-gray-600);
}
```

### Family Integration Features
```css
.parent-sharing-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
  border: 2px solid var(--hs-cultural-gold);
  text-align: center;
  padding: var(--hs-space-5);
}

.family-celebration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--hs-space-2);
  font-size: var(--hs-text-lg-elem);
  font-weight: var(--hs-font-bold);
  color: var(--hs-cultural-gold);
  margin-bottom: var(--hs-space-3);
}
```

---

## Performance Optimizations

### CSS-Only Animations for 60fps
```css
/* Use transform and opacity for GPU acceleration */
.gpu-optimized-animation {
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* Avoid animating layout properties */
.performance-safe-hover {
  transition: transform var(--hs-duration-fast) var(--hs-ease-out),
              box-shadow var(--hs-duration-fast) var(--hs-ease-out);
}

.performance-safe-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

### Lazy Loading Classes
```css
.lazy-load-card {
  opacity: 0;
  transform: translateY(20px);
  transition: all var(--hs-duration-normal) var(--hs-ease-out);
}

.lazy-load-card.loaded {
  opacity: 1;
  transform: translateY(0);
}
```

### Container Queries for Responsive Cards
```css
@container (max-width: 300px) {
  .dashboard-card {
    padding: var(--hs-space-3);
    font-size: var(--hs-text-sm-sec);
  }
  
  .achievement-badge {
    width: 48px;
    height: 48px;
    font-size: 16px;
  }
}
```

---

## Implementation Examples

### React Native StyleSheet Implementation
```typescript
// Age-adaptive styles example
const getCardStyles = (ageGroup: '10-12' | '13-18') => StyleSheet.create({
  container: {
    backgroundColor: ageGroup === '10-12' ? '#fef3c7' : '#ffffff',
    borderRadius: 16,
    padding: ageGroup === '10-12' ? 24 : 16,
    borderWidth: ageGroup === '10-12' ? 2 : 1,
    borderColor: ageGroup === '10-12' ? '#fbbf24' : '#e4e4e7',
    minHeight: ageGroup === '10-12' ? 180 : 140,
  },
  
  title: {
    fontSize: ageGroup === '10-12' ? 24 : 20,
    fontWeight: '700',
    color: ageGroup === '10-12' ? '#22c55e' : '#1d7452',
    marginBottom: ageGroup === '10-12' ? 16 : 12,
  },
  
  touchTarget: {
    minHeight: ageGroup === '10-12' ? 52 : 44,
    minWidth: ageGroup === '10-12' ? 52 : 44,
  },
});
```

### Animation Hook Example
```typescript
const useEducationalAnimation = (trigger: boolean, type: 'celebration' | 'progress' | 'achievement') => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (trigger) {
      const animations = {
        celebration: Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1.2,
            duration: 200,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        
        progress: Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        
        achievement: Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1.3,
            duration: 300,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      };
      
      animations[type].start();
    }
  }, [trigger, type, animatedValue]);
  
  return animatedValue;
};
```

---

## Conclusion

This visual design specification creates a comprehensive system for the Harry School Student Dashboard that:

1. **Respects Educational Psychology**: Age-appropriate visual complexity and motivation systems
2. **Celebrates Learning**: Educational micro-animations that enhance rather than distract from learning
3. **Ensures Accessibility**: WCAG 2.1 AA compliance with comprehensive assistive technology support
4. **Honors Cultural Context**: Multilingual support and Uzbekistan educational values integration
5. **Optimizes Performance**: 60fps animations with GPU-accelerated transforms
6. **Scales Appropriately**: Seamless adaptation between elementary and secondary student needs

The design system balances vibrant, engaging visuals for younger students with sophisticated, professional aesthetics for older students, all while maintaining the Harry School brand identity and ensuring inclusive access for all learners.

**Next Steps:**
1. Create interactive prototypes based on these specifications
2. Conduct usability testing with target age groups
3. Validate accessibility with assistive technology users  
4. Implement performance benchmarking
5. Refine animations based on user feedback

---

**Design Specifications Prepared By**: ui-designer  
**Visual Framework**: Age-Adaptive Educational Design System  
**Performance Target**: 60fps animations, <2s load times  
**Accessibility Standard**: WCAG 2.1 AA compliant  
**Cultural Adaptation**: Multilingual Uzbekistan educational context