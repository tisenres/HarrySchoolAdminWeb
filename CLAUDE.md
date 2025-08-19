# Harry School CRM & Mobile Apps

## Project Overview

**Harry School CRM** is a comprehensive educational management ecosystem consisting of:
- **Admin Panel**: Web-based management system for school administrators
- **Teacher App**: Mobile application for educators (React Native + Expo)
- **Student App**: Mobile application for learners (React Native + Expo)

All three applications share a unified backend (Supabase) and work together to provide a seamless educational experience.

## Architecture & Tech Stack

### Admin Panel (Web)
- **Frontend**: Next.js 14+ with App Router, TypeScript
- **UI Framework**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand (client) + React Query (server state)
- **Internationalization**: next-intl (English, Russian, Uzbek Latin)
- **Deployment**: Vercel with automated CI/CD

### Mobile Apps (Teacher & Student)
- **Framework**: React Native + Expo SDK 49+
- **Language**: TypeScript 5.0+
- **Navigation**: React Navigation 6.0+
- **UI Library**: NativeWind (Tailwind for RN) + Custom Design System
- **State Management**: Zustand + React Query
- **Animations**: React Native Reanimated + Lottie

### Shared Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (no self-registration)
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for files
- **AI Services**: OpenAI GPT-4 + Whisper API

### Development Environment
- **IDE**: Claude Code with MCP servers
- **Monorepo**: Turbo for mobile apps
- **Version Control**: Git
- **Testing**: Jest + React Testing Library + Detox

## Core Modules

### Admin Panel Features
1. **Teachers** - Full CRUD with specializations and performance tracking
2. **Students** - Complete lifecycle management with ranking system
3. **Groups** - Class management with scheduling
4. **Rankings** - Unified point system for students and teachers
5. **Feedback** - Bidirectional feedback system
6. **Settings** - User management and configuration

### Teacher App Features
1. **Dashboard** - Daily overview and quick actions
2. **Groups Management** - Student rosters and performance
3. **Attendance** - Quick marking with multiple states
4. **Schedule** - Class timetable and planning
5. **Feedback System** - Create and track student feedback
6. **AI Tasks** - Generate and assign homework with AI
7. **Analytics** - Performance insights and trends

### Student App Features
1. **Dashboard** - Ranking, schedule, and achievements
2. **Home Tasks** - Interactive lessons (text, quiz, speaking, listening, writing)
3. **Vocabulary** - Flashcards and translator
4. **Schedule** - Classes and attendance
5. **Ranking System** - Points, coins, leaderboards
6. **Rewards Catalog** - Redeem earned coins
7. **Referral Program** - Invite friends for rewards
8. **Extra Learning** - Request additional lessons/homework
9. **Feedback** - Rate teachers and courses

## MCP Server Configuration

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "${NEXT_PUBLIC_SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "browser": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-context7"],
      "env": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    }
  }
}
```

## Subagent Team Structure

### Mobile Development Team
- `mobile-architect` - React Native architecture, navigation, state management
- `ui-designer` - Mobile UI/UX, animations, design system
- `api-integrator` - Supabase integration, real-time features
- `ai-specialist` - OpenAI/Whisper integration, task generation
- `performance-optimizer` - Mobile performance, caching, offline support
- `test-automator` - Jest, Detox, E2E testing for mobile

### Existing Teams (Admin Panel)
- `backend-architect` - Database schema, API design
- `frontend-developer` - React components, admin interfaces
- `security-auditor` - RLS policies, authentication
- `database-optimizer` - Query optimization, indexing

### Cross-Platform Team
- `ux-researcher` - User workflows across all platforms
- `sprint-prioritizer` - Feature coordination across apps
- `deployment-engineer` - CI/CD, app store deployment

## Claude Code Commands with Subagents and MCP Servers

### Mobile App Development Commands

```bash
# Initial Setup with Mobile Architect and MCP Servers
"Use the mobile-architect to create a React Native Expo monorepo structure for Teacher and Student apps. Use the filesystem MCP server to organize the folder structure, then use git MCP server to initialize version control with proper .gitignore."

# UI Design System with Context Documentation
"Use the ui-designer to create a premium mobile design system with primary color #1d7452. Store design specifications in context7 MCP server for reference, then use filesystem MCP server to organize components in packages/ui."

# Database Schema Extension
"Use the backend-architect to extend the existing schema for mobile features. Use supabase MCP server to create tables for home_tasks, vocabulary_words, student_vocabulary, and extra_lesson_requests with proper RLS policies."

# Student App Dashboard with Real-time
"Use the mobile-architect and ui-designer together to implement the Student Dashboard. Use supabase MCP server for real-time subscriptions to ranking updates, then store component patterns in context7 MCP server."

# AI Integration with OpenAI
"Use the ai-specialist to implement OpenAI GPT-4 integration for task generation. Create task generation service with proper prompts, store AI patterns in context7 MCP server, then test with supabase MCP server for data persistence."

# Teacher Attendance System with Offline Support
"Use the mobile-architect to build the attendance marking system. Implement offline queue with memory MCP server for temporary storage, then sync with supabase MCP server when online."

# Vocabulary Module with Animations
"Use the ui-designer and mobile-architect to create the vocabulary flashcard system. Use filesystem MCP server to organize vocabulary assets, implement swipe animations, and store progress in supabase MCP server."

# Real-time Features Implementation
"Use the api-integrator to implement Supabase real-time subscriptions. Use supabase MCP server for notifications and ranking updates, then document patterns in context7 MCP server."

# Performance Optimization and Testing
"Use the performance-optimizer to implement caching with MMKV. Use playwright MCP server for E2E testing, then store performance benchmarks in context7 MCP server."

# Testing Setup with Automated Runs
"Use the test-automator to set up Jest and Detox tests. Use playwright MCP server for browser testing, github MCP server for CI/CD integration, then store test reports in context7 MCP server."
```

### Cross-Platform Coordination Commands

```bash
# Morning Sprint Planning
"Use the sprint-prioritizer to plan today's mobile development priorities. Use memory MCP server to retrieve yesterday's progress, check PR status with github MCP server, then document sprint plan in context7 MCP server."

# Design Consistency Check
"Use the ui-designer to ensure design consistency between Admin Panel, Teacher App, and Student App. Use browser MCP server to compare implementations, then create unified design language document in context7 MCP server."

# Database Performance Optimization
"Use the database-optimizer with supabase MCP server to analyze query performance from mobile apps. Create indexes for frequently accessed mobile data, then store optimization patterns in context7 MCP server."

# Security Audit for Mobile
"Use the security-auditor to review mobile app authentication and token storage. Test RLS policies with supabase MCP server, review code with github MCP server, then document security findings in context7 MCP server."

# End-to-End Feature Testing
"Use the test-runner with playwright MCP server to test complete user flows across Admin Panel and Mobile Apps. Verify data consistency through supabase MCP server, then store test results in context7 MCP server."

# Weekly Progress Review
"Use memory MCP server to compile week's accomplishments, review PRs with github MCP server, analyze performance metrics from supabase MCP server, then create comprehensive report in context7 MCP server."

# Documentation and Knowledge Sharing
"Use the api-documenter to create API documentation for mobile endpoints. Store in context7 MCP server, version control with git MCP server, then share patterns across team using memory MCP server."

# Performance Monitoring
"Use the performance-engineer to analyze mobile app metrics. Monitor API response times with supabase MCP server, run performance tests with playwright MCP server, then track improvements in context7 MCP server."

# Deployment Preparation
"Use the deployment-engineer to prepare mobile apps for store submission. Use filesystem MCP server to organize build artifacts, github MCP server for release tags, then document deployment process in context7 MCP server."

# UX Research and Validation
"Use the ux-researcher to validate mobile app workflows. Use browser MCP server for competitive analysis, test with real users using playwright MCP server, then store findings in context7 MCP server."
```

### Advanced MCP Integration Patterns

```bash
# Complete Feature Development with Full MCP Integration
"Develop the Student Vocabulary module using:
1. ui-designer for flashcard UI design (store in context7)
2. mobile-architect for state management architecture
3. supabase MCP for vocabulary tables and progress tracking
4. filesystem MCP for organizing vocabulary assets
5. git MCP for version control
6. playwright MCP for E2E testing
7. memory MCP for caching frequently used words
8. context7 MCP for documentation and patterns"

# AI-Powered Homework System
"Implement AI homework generation using:
1. ai-specialist for OpenAI integration design
2. backend-architect for task storage schema (supabase MCP)
3. mobile-architect for task rendering components
4. filesystem MCP for organizing task types
5. context7 MCP for prompt engineering documentation
6. github MCP for collaborative development
7. playwright MCP for testing AI responses"

# Real-time Ranking System
"Build the unified ranking system using:
1. backend-architect for ranking schema (supabase MCP)
2. api-integrator for real-time subscriptions
3. ui-designer for leaderboard animations
4. performance-optimizer for efficient updates
5. memory MCP for caching leaderboard data
6. context7 MCP for ranking algorithm documentation
7. playwright MCP for performance testing"

# Offline-First Architecture
"Implement comprehensive offline support using:
1. mobile-architect for offline queue design
2. memory MCP for temporary data storage
3. filesystem MCP for cached content
4. supabase MCP for sync strategies
5. test-automator for offline scenario testing
6. context7 MCP for sync conflict resolution docs"

# Security Implementation
"Secure both mobile apps using:
1. security-auditor for threat assessment
2. supabase MCP for RLS policy implementation
3. github MCP for security code reviews
4. filesystem MCP for security certificates
5. context7 MCP for security documentation
6. playwright MCP for security testing"
```

### Daily Workflow Commands

```bash
# Morning Setup
"Use memory MCP server to load yesterday's context, check github MCP server for overnight PRs, review tasks in context7 MCP server, then plan today's mobile development priorities."

# Development Session
"Use the mobile-architect with filesystem MCP server to implement new features, test with supabase MCP server for data persistence, commit changes with git MCP server, then document patterns in context7 MCP server."

# Testing Session
"Use test-automator with playwright MCP server to run E2E tests, verify data integrity with supabase MCP server, check coverage reports, then store results in context7 MCP server."

# End of Day Review
"Use memory MCP server to save today's progress, push changes with github MCP server, update documentation in context7 MCP server, then plan tomorrow's tasks."
```