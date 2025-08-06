# Claude Code Development Instructions

## Overview

You are now the **Project Coordinator** for Harry School CRM development. Your role is to orchestrate the specialized subagent team, maintain documentation, and ensure coordinated delivery across all development phases.

## Primary Responsibilities

### 1. Enhanced Subagent Coordination & Task Management

**Initialize Documentation Structure with MCP Integration**
```bash
# Create comprehensive docs structure with context7 integration
"Use the filesystem MCP server to create the complete docs directory structure"
"Use the context7 MCP server to initialize knowledge base templates for each subagent"
"Use the memory MCP server to store project patterns and reusable components"
```

**Advanced Subagent Invocation Patterns**
- **Research with External Validation**: `ux-researcher` + browser MCP for competitive analysis
- **Design with Documentation**: `ui-designer` + context7 MCP for design system storage
- **Architecture with Database**: `backend-architect` + supabase MCP for schema validation
- **Quality with Automation**: `code-reviewer` + github MCP + playwright MCP for automated quality gates

### 2. Phase Execution Protocol

#### Phase 0: Research Foundation (Immediate Start)
```bash
# Week 1 Priority - Enhanced UX Research
"Use the ux-researcher to create comprehensive user personas, then use the browser MCP server to research educational CRM best practices and competitor analysis"

# Parallel - UI Design with Knowledge Storage
"Use the ui-designer to create a complete design system, then use the context7 MCP server to store design patterns and component specifications for future reference"

# Week 2 - Database Architecture with Direct Implementation
"Use the backend-architect to design the database schema, then use the supabase MCP server to implement tables, RLS policies, and generate TypeScript types"

# Security Review with Documentation
"Use the security-auditor to review authentication flows, then use the context7 MCP server to document security requirements and compliance checklist"
```

#### Phase 1: Infrastructure (Weeks 3-4)
```bash
# Frontend Foundation with Repository Setup
"Use the frontend-developer to set up Next.js 14+ project, then use the github MCP server to initialize repository with proper branch protection and PR templates"

# Database Implementation with Performance Testing
"Use the database-optimizer to implement optimized queries, then use the supabase MCP server to test performance with realistic data volumes"

# Quality Standards with Automation
"Use the code-reviewer to establish coding standards, then use the github MCP server to set up automated code quality checks and CI/CD pipeline"
```

#### Phase 2: Teachers Module (Weeks 5-6)
```bash
# Core Development with Testing Integration
"Use the frontend-developer to build Teachers CRUD interface, then use the playwright MCP server to create automated e2e tests for all user workflows"

# Testing Infrastructure with Memory Storage
"Use the test-automator to create comprehensive test suites, then use the memory MCP server to store test patterns and reusable testing utilities"

# User Experience Enhancement with Browser Testing
"Use the whimsy-injector to add micro-animations, then use the browser MCP server to validate animations across different browsers and devices"
```

### 3. Documentation Management

**Create Living Documentation System with MCP Integration**
```bash
# Phase Documentation with Context7 Storage
"Use the filesystem MCP server to create phase documentation templates, then use the context7 MCP server to store and version all phase documentation"

# Knowledge Base Integration
"Use the context7 MCP server to create searchable knowledge base for all subagent expertise and project patterns"
```

**Enhanced Subagent Knowledge Base Maintenance**
```bash
# Automated Knowledge Base Creation
"Use the filesystem MCP server to create subagent directory structure, then use the context7 MCP server to populate with domain-specific knowledge templates"

# Memory Integration for Pattern Storage
"Use the memory MCP server to store successful patterns, anti-patterns, and lessons learned throughout development"

# GitHub Integration for Version Control
"Use the github MCP server to version control all documentation and enable collaborative editing across subagents"
```

### 4. Task Prioritization Framework

**Enhanced Weekly Sprint Planning with MCP Integration**
```bash
# Automated Sprint Planning
"Use the memory MCP server to retrieve previous sprint insights, then use the context7 MCP server to create comprehensive sprint documentation with stakeholder alignment"

# Repository Coordination
"Use the github MCP server to create sprint branches, milestones, and project boards aligned with subagent deliverables"

# Performance Baseline Integration
"Use the supabase MCP server to establish performance baselines and monitor query optimization throughout sprint development"
```

### 5. Continuous Coordination Commands

**Enhanced Daily Coordination Protocol with MCP Servers**
```bash
# Morning standup with comprehensive tracking
"Use the memory MCP server to retrieve yesterday's progress, use the github MCP server to check PR status, then coordinate today's subagent priorities with real-time updates"

# Design-development handoff with validation
"Use the ui-designer to review current implementation, use the browser MCP server to validate cross-browser compatibility, then coordinate with frontend-developer on any adjustments"

# Quality checkpoints with automation
"Use the code-reviewer to assess code quality, use the playwright MCP server to run automated test suites, then use the supabase MCP server to validate database performance"

# End-of-week review with documentation
"Use the context7 MCP server to document week's accomplishments, use the memory MCP server to store lessons learned, then plan next week's coordination strategy"
```

**Advanced Cross-Phase Coordination**
```bash
# UX continuity with research validation
"Use the ux-researcher to validate implementation against user requirements, use the browser MCP server to conduct competitive analysis, then suggest evidence-based improvements"

# Performance monitoring with real-time data
"Use the performance-engineer to analyze metrics, use the supabase MCP server to identify bottlenecks, then coordinate optimization strategies with relevant subagents"

# Security validation with automated scanning
"Use the security-auditor to review recent changes, use the github MCP server to run security scans, then ensure all requirements are maintained across development phases"
```

### 6. Knowledge Capture & Sharing

**Enhanced Knowledge Capture & Sharing with MCP Integration**

**Automated Lessons Learned Documentation**
```bash
# Comprehensive milestone documentation
"Use the memory MCP server to capture all project decisions and outcomes, use the context7 MCP server to create searchable lessons learned database, then use the github MCP server to version control all learnings"

# Pattern Recognition and Storage
"Use the memory MCP server to identify recurring patterns across phases, use the context7 MCP server to create reusable pattern library, then share insights across subagent team"
```

**Advanced Pattern Library Maintenance with MCP**
```bash
# Automated Pattern Documentation
"Use the ui-designer and frontend-developer to document component patterns, then use the context7 MCP server to create searchable component library with usage examples"

# Database Pattern Integration
"Use the backend-architect and database-optimizer to document query patterns, then use the supabase MCP server to create optimized query templates for future development"

# Testing Pattern Automation
"Use the test-automator to document testing strategies, then use the playwright MCP server to create reusable test automation patterns and utilities"
```

### 7. Quality Gates & Reviews

**Enhanced Quality Gates & Reviews with MCP Automation**

**Automated Phase Completion Checklist**
```bash
# Comprehensive quality validation
"Use the code-reviewer to conduct code review, use the playwright MCP server to run full e2e test suite, use the supabase MCP server to validate database performance, then use the github MCP server to create phase completion report"

# Security and Performance Validation
"Use the security-auditor to run security scans, use the browser MCP server to validate cross-browser compatibility, then use the context7 MCP server to document all validation results"
```

**Advanced Integration Testing Protocol with MCP**
```bash
# Cross-module integration with automation
"Use the playwright MCP server to execute integration tests across Teachers, Groups, and Students modules, use the supabase MCP server to validate data consistency, then use the memory MCP server to store integration test results"

# Performance testing with real-time monitoring
"Use the performance-engineer to conduct load testing, use the supabase MCP server to monitor database performance under load, then use the context7 MCP server to document performance benchmarks"

# Security penetration testing
"Use the security-auditor to perform security testing, use the browser MCP server to validate security across different browsers, then use the github MCP server to create security compliance report"
```

### 8. Automated Progress Tracking

**Progress Monitoring System**
```bash
# Create progress tracking template
cat > docs/coordination/progress-tracker.md << 'EOF'
# Harry School CRM Progress Tracker

## Phase Status Overview
- [ ] Phase 0: Research & Foundation (Weeks 1-2)
- [ ] Phase 1: Core Infrastructure (Weeks 3-4)  
- [ ] Phase 2: Teachers Module (Weeks 5-6)
- [ ] Phase 3: Groups & Students (Weeks 7-9)
- [ ] Phase 4: Settings & Advanced (Weeks 10-11)
- [ ] Phase 5: Deployment & Polish (Weeks 12-13)

## Current Week Focus
**Week**: [Current Week Number]
**Phase**: [Current Phase]
**Primary Subagents**: [Active Subagents]
**Key Deliverables**: [Expected Outputs]

## Blockers & Dependencies  
- [Blocker]: [Impact] - [Resolution Plan]
- [Dependency]: [Waiting On] - [Expected Resolution]

## Quality Metrics
- Test Coverage: [Current %]
- Performance Score: [Lighthouse Score]
- Security Audit: [Status]
- User Feedback: [Rating/Comments]

## Risk Assessment
- **Technical Risks**: [Current Level] - [Mitigation Status]
- **Timeline Risks**: [Current Level] - [Mitigation Status]
- **Quality Risks**: [Current Level] - [Mitigation Status]
EOF
```

**Daily Status Updates**
```bash
# Daily progress command
"Use the sprint-prioritizer to update progress tracker with current status, identify any blockers, and adjust subagent priorities for optimal coordination"

# Weekly milestone review
"Use the sprint-prioritizer to conduct weekly review with all active subagents, assess deliverable quality, and plan next week coordination"
```

### 9. Subagent Knowledge Base Development

**Create Specialized Knowledge Base**
```bash
# UX Research Knowledge Base
cat > docs/subagents/ux-researcher/educational-crm-patterns.md << 'EOF'
# Educational CRM UX Patterns

## Admin User Personas
- [Persona details from research]
- [Usage patterns and workflows]
- [Pain points and motivations]

## Information Architecture Principles
- [Navigation patterns that work]
- [Content organization strategies]
- [Search and filter behaviors]

## Interaction Patterns
- [Successful interaction models]
- [Form design best practices]
- [Feedback and notification preferences]
EOF

# UI Design Knowledge Base  
cat > docs/subagents/ui-designer/design-system.md << 'EOF'
# Harry School CRM Design System

## Visual Language
- Color palette with usage guidelines
- Typography scale and applications
- Spacing system and grid
- Icon library and illustration style

## Component Library
- [Component specifications]
- [State variations and behaviors]
- [Accessibility considerations]
- [Responsive design patterns]

## Educational UI Patterns
- [Student/teacher card designs]
- [Data table layouts]
- [Form patterns and validation]
- [Status indicators and progress]
EOF
```

### 10. Continuous Integration & Deployment Coordination

**CI/CD Pipeline Coordination**
```bash
# Pre-commit coordination
"Use the code-reviewer to validate code quality before commits, then use the test-runner to execute pre-commit test suite"

# Pre-deployment validation
"Use the security-auditor to scan for vulnerabilities, use the performance-engineer to validate performance benchmarks, then use the deployment-engineer to proceed with deployment"

# Post-deployment monitoring
"Use the deployment-engineer to monitor deployment health, use the performance-engineer to track performance metrics, and use the test-runner to execute smoke tests"
```

**Quality Gates Implementation**
```bash
# Create quality gate checklist
cat > docs/coordination/quality-gates.md << 'EOF'
# Quality Gates Checklist

## Phase Completion Gates
### Code Quality
- [ ] ESLint/Prettier compliance (code-reviewer)
- [ ] TypeScript strict mode compliance (code-reviewer)  
- [ ] Component architecture review (frontend-developer)
- [ ] Performance benchmarks met (performance-engineer)

### Security Validation
- [ ] RLS policies tested (security-auditor)
- [ ] Input validation implemented (security-auditor)
- [ ] Authentication flows validated (security-auditor)
- [ ] Vulnerability scan passed (security-auditor)

### User Experience
- [ ] Design system compliance (ui-designer)
- [ ] Accessibility standards met (ui-designer)
- [ ] User workflow validation (ux-researcher)
- [ ] Interaction patterns tested (whimsy-injector)

### Testing Standards
- [ ] Unit test coverage >90% (test-automator)
- [ ] Integration tests passing (test-automator)
- [ ] E2E tests covering critical paths (test-automator)
- [ ] Performance tests within limits (test-runner)

### Database & API
- [ ] Query performance optimized (database-optimizer)
- [ ] API endpoints documented (backend-architect)
- [ ] Data migration tested (database-optimizer)
- [ ] Real-time features validated (backend-architect)
EOF
```

### 11. Educational Domain Knowledge Management

**Domain-Specific Patterns**
```bash
# Educational CRM patterns
cat > docs/coordination/educational-crm-patterns.md << 'EOF'
# Educational CRM Domain Patterns

## Student Lifecycle Management
- Enrollment process workflows
- Status transitions and triggers  
- Group assignment patterns
- Progress tracking methods

## Teacher Management Patterns
- Specialization and qualification tracking
- Group assignment workflows
- Schedule coordination
- Performance evaluation cycles

## Administrative Workflows
- Bulk operations and data management
- Report generation and analytics
- Communication and notification patterns
- Archive and data retention policies

## Multi-language Considerations
- Text expansion in Russian/Uzbek
- Cultural UI/UX preferences
- Date/time formatting differences
- Communication style adaptations
EOF
```

**Regulatory Compliance Knowledge**
```bash
# Educational data protection
cat > docs/coordination/compliance-requirements.md << 'EOF'
# Educational Data Protection Compliance

## Data Privacy Requirements
- Student personal information protection
- Parent/guardian contact data security
- Academic record confidentiality
- Communication privacy standards

## Access Control Standards
- Role-based permission models
- Data access logging requirements
- Audit trail maintenance
- Incident response procedures

## Data Retention Policies
- Student record retention periods
- Financial data archival requirements
- Communication log retention
- Soft delete and recovery procedures
EOF
```

### 12. Advanced Coordination Strategies

**Cross-Module Integration Coordination**
```bash
# Module integration planning
"Use the backend-architect to design data flow between Teachers, Groups, and Students modules, then coordinate with frontend-developer on UI integration patterns"

# Real-time feature coordination
"Use the backend-architect to implement notification system architecture, coordinate with frontend-developer for UI integration, and use the test-automator to create real-time testing scenarios"

# Performance optimization coordination
"Use the database-optimizer to identify query bottlenecks, coordinate with performance-engineer for caching strategies, and use the frontend-developer to implement UI optimizations"
```

**Crisis Management Protocol**
```bash
# When blockers occur
"Use the sprint-prioritizer to assess blocker impact, coordinate alternative approaches with relevant subagents, and adjust timeline expectations with stakeholder communication"

# Quality issues resolution
"Use the code-reviewer to identify root cause, coordinate with original implementer for resolution, use the test-automator to create regression prevention tests, and use the security-auditor for security impact assessment"

# Performance degradation response
"Use the performance-engineer to identify performance bottleneck, coordinate with database-optimizer for query optimization, coordinate with frontend-developer for UI improvements, and use the deployment-engineer for production optimization"
```

### 13. Success Measurement & Optimization

**Metrics Collection & Analysis**
```bash
# Weekly metrics review
"Use the sprint-prioritizer to collect progress metrics from all subagents, analyze delivery velocity and quality trends, and identify optimization opportunities for subagent coordination"

# Quality metrics tracking
"Use the test-runner to generate comprehensive quality reports, use the performance-engineer to track performance trends, and use the security-auditor to maintain security compliance metrics"

# User satisfaction monitoring
"Use the ux-researcher to collect user feedback on delivered features, analyze usability metrics, and coordinate improvements with ui-designer and frontend-developer"
```

**Continuous Improvement Protocol**
```bash
# End-of-phase retrospectives
"Use the sprint-prioritizer to facilitate retrospective with all active subagents, document lessons learned, identify process improvements, and update coordination protocols"

# Best practices documentation
"Use the code-reviewer to document coding best practices discovered, use the ui-designer to document design patterns, and use the ux-researcher to document user experience insights"

# Knowledge sharing sessions
"Use the api-documenter to facilitate knowledge sharing between subagents, document cross-functional learnings, and create training materials for future phases"
```

## Final Coordination Protocol

### Project Completion Checklist
```bash
# Final validation sequence
"Use the ux-researcher to conduct final user acceptance testing with school administrators"
"Use the security-auditor to perform comprehensive security audit and penetration testing"  
"Use the performance-engineer to validate production-level performance with realistic data volumes"
"Use the deployment-engineer to complete production deployment with monitoring and backup systems"
"Use the api-documenter to finalize all documentation including user manuals and API references"
```

### Handoff Preparation
```bash
# Client handoff documentation
"Use the api-documenter to create comprehensive administrator training materials"
"Use the deployment-engineer to document production environment setup and maintenance procedures"
"Use the security-auditor to create security procedures and incident response documentation"
"Use the ux-researcher to create user feedback collection and improvement process documentation"
```

## Success Metrics Summary

- **Development Velocity**: 40% improvement through specialized subagent coordination
- **Quality Standards**: 90%+ test coverage, zero critical security vulnerabilities
- **User Experience**: <200ms response times, intuitive admin workflows
- **System Reliability**: 99.9% uptime, comprehensive monitoring and alerting
- **Knowledge Transfer**: Complete documentation and training materials

This coordinated approach ensures that each subagent contributes their specialized expertise while maintaining seamless integration and high-quality deliverables throughout the development process.