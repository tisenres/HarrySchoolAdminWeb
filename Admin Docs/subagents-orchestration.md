### Daily Workflow Commands with MCP Integration:

```bash
# Morning sprint planning with MCP servers
"Use the sprint-prioritizer to plan today's development priorities, then use the context7 MCP server to store sprint documentation and github MCP server to create feature branches"

# Design and development with documentation
"Use the ui-designer to create mockups and store them in context7 MCP server, then the frontend-developer to implement with whimsy-injector adding micro-animations"

# Database work with direct Supabase integration
"Use the backend-architect to design schemas, then use the supabase MCP server to implement tables and RLS policies directly"

# Security validation with automated tools
"Use the security-auditor to review RLS policies via supabase MCP server, then document findings in context7 MCP server"

# Quality assurance with GitHub integration
"Use the test-automator to write tests, then the test-runner to execute them and push results to github MCP server"
```

## Enhanced Agent Interaction Examples with MCP Integration

### **Complete Feature Development Workflow with MCP Servers**

**Example: Building the Teachers Module with Full MCP Integration**

```bash
# Week 1: Architecture & Design Phase
"Use the sprint-prioritizer to plan the Teachers module sprint, then store the sprint plan in context7 MCP server"

"Use the ui-designer to create teacher card mockups, then store design specs in context7 MCP server"

"Use the backend-architect to design the teachers table schema, then implement it directly using the supabase MCP server"

"Use the security-auditor to test RLS policies for teachers table via supabase MCP server, then document findings in context7 MCP"

# Week 2: Development & Testing Phase
"Use the frontend-developer to build the teachers CRUD interface, then commit changes via github MCP server"

"Use the database-optimizer to create indexes for teacher search queries using supabase MCP server"

"Use the test-automator to create comprehensive tests, then use test-runner to execute them via github MCP server CI/CD"

"Use the whimsy-injector to add micro-animations, then validate performance impact using supabase MCP server"

# Week 3: Quality Assurance & Documentation
"Use the code-reviewer to review all teachers module code via github MCP server PR reviews"

"Use the test-runner to execute full test suite and store results in context7 MCP server"

"Use the api-documenter to create teachers API documentation and store in context7 MCP server"
```

## Advanced MCP Integration Patterns

### **Database-First Development with Supabase MCP**
```bash
# Design and implement database schema
"Use the backend-architect to design teachers schema, then immediately implement in Supabase using supabase MCP server"

# Test and optimize database performance
"Use the database-optimizer to analyze teacher queries performance via supabase MCP server, then implement optimizations"

# Validate security policies
"Use the security-auditor to test RLS policies directly using supabase MCP server with different user roles"
```

### **Documentation-Driven Development with Context7 MCP**
```bash
# Store and version all project knowledge
"Use the ui-designer to create design system documentation and store in context7 MCP server for team reference"

# Maintain architectural decision records
"Use the backend-architect to document API design decisions in context7 MCP server"

# Track sprint progress and blockers
"Use the sprint-prioritizer to update sprint status and store progress reports in context7 MCP server"
```

### **Continuous Integration with GitHub MCP**
```bash
# Automated testing and deployment
"Use the test-runner to execute tests via github MCP server actions, then deploy staging environment"

# Code review coordination
"Use the code-reviewer to review PR changes via github MCP server and coordinate with other agents"

# Release management
"Use the deployment-strategist to manage releases and version tags via github MCP server"
```# Harry School CRM - Subagent Team Configuration

## Core Development Team (6 Essential Agents)

### 1. **backend-architect** 
**Role**: Database schema design, API architecture, Supabase configuration
- Design the core education CRM schema (teachers, students, groups, notifications)
- Set up Row Level Security policies
- Design REST API endpoints for CRUD operations
- Handle multi-tenant organization structure

### 2. **frontend-developer**
**Role**: React components, shadcn/ui integration, responsive layouts
- Build the admin dashboard layout with sidebar navigation
- Create data tables for Teachers, Groups, Students sections
- Implement forms with React Hook Form + Zod validation
- Handle responsive design and mobile optimization

### 3. **database-optimizer**
**Role**: Supabase optimization, RLS policies, query performance
- Optimize queries for large datasets (473+ students)
- Design efficient indexes for search and filtering
- Implement soft delete patterns across all tables
- Set up database triggers for notifications

### 4. **security-auditor**
**Role**: Authentication, authorization, data protection
- Review Row Level Security implementation
- Audit authentication flows (admin-only access)
- Ensure OWASP compliance for educational data
- Validate input sanitization and CSRF protection

### 5. **test-automator**
**Role**: Comprehensive testing strategy
- Create unit tests for components and utilities
- Set up integration tests for API routes
- Implement e2e tests for critical user flows
- Configure GitHub Actions CI/CD pipeline

### 6. **code-reviewer**
**Role**: Code quality, TypeScript best practices, maintainability
- Review all code for quality and consistency
- Ensure TypeScript best practices
- Validate component structure and reusability
- Check for potential bugs and performance issues

## Creative & Management Team (5 New Agents)

### 11. **ui-designer**
**Role**: Visual design, component aesthetics, design system consistency
- Create beautiful, modern admin interface designs
- Design consistent color palettes and typography systems
- Create intuitive iconography and visual hierarchy
- Ensure accessibility and visual consistency across modules

### 12. **ux-researcher**
**Role**: User experience optimization, usability testing, workflow analysis
- Analyze admin user workflows and pain points
- Design intuitive navigation and information architecture
- Create user personas for school administrators
- Optimize forms and data entry experiences

### 13. **sprint-prioritizer**
**Role**: Project management, feature prioritization, sprint planning
- Break down features into manageable sprint tasks
- Prioritize development based on user value and technical dependencies
- Coordinate between different agents and workstreams
- Track progress and adjust timelines based on complexity

### 14. **whimsy-injector**
**Role**: Delightful interactions, micro-animations, user engagement
- Add tasteful micro-animations and transitions
- Create engaging loading states and feedback animations
- Design celebration moments for completed actions
- Implement smooth hover effects and interactive elements

### 15. **test-runner**
**Role**: Automated test execution, CI/CD integration, quality gates
- Execute comprehensive test suites automatically
- Monitor test results and generate reports
- Integrate with CI/CD pipeline for continuous testing
- Identify and flag test failures with detailed diagnostics

## Specialized Support Team (4 Strategic Agents)

### 7. **performance-engineer**
**Role**: App performance, caching, optimization
- Optimize Next.js App Router performance
- Implement caching strategies for frequently accessed data
- Profile and optimize large data tables
- Set up monitoring and performance metrics

### 8. **deployment-strategist**
**Role**: CI/CD, Vercel deployment, environment management
- Configure multi-environment setup (dev/staging/prod)
- Set up automated deployments with Vercel
- Manage environment variables and secrets
- Configure preview deployments for PRs

### 9. **api-documenter**
**Role**: Documentation, developer guides, API specs
- Create comprehensive API documentation
- Write setup and deployment guides
- Document component usage and patterns
- Create user manuals for the admin interface

### 10. **debugger**
**Role**: Issue resolution, error handling, troubleshooting
- Debug complex authentication issues
- Handle Supabase integration problems
- Resolve Next.js App Router edge cases
- Fix real-time notification issues

## Implementation Strategy - Phase-by-Phase Agent Deployment

### Phase 1: Foundation (Weeks 1-2)
**Primary Agents**: backend-architect, security-auditor, code-reviewer, sprint-prioritizer, ui-designer
1. **sprint-prioritizer**: Create detailed sprint backlog and feature prioritization
2. **backend-architect**: Design complete database schema with RLS
3. **ui-designer**: Create design system and component library mockups
4. **security-auditor**: Review authentication and authorization setup
5. **code-reviewer**: Establish code standards and project structure

### Phase 2: Core Development (Weeks 3-6)
**Primary Agents**: frontend-developer, database-optimizer, test-automator, ux-researcher, whimsy-injector
1. **ux-researcher**: Analyze admin workflows and optimize user experience
2. **frontend-developer**: Build Teachers, Groups, Students modules
3. **whimsy-injector**: Add delightful interactions and micro-animations
4. **database-optimizer**: Optimize queries and implement efficient filtering
5. **test-automator**: Create test suites for each module
6. **test-runner**: Execute automated tests in CI/CD pipeline

### Phase 3: Advanced Features (Weeks 7-8)
**Primary Agents**: performance-engineer, deployment-strategist, debugger, ui-designer
1. **performance-engineer**: Optimize for large datasets and real-time features
2. **ui-designer**: Refine visual design and ensure consistency
3. **deployment-strategist**: Set up production deployment pipeline
4. **debugger**: Handle complex integration issues

### Phase 4: Documentation & Launch (Weeks 9-10)
**Primary Agents**: api-documenter, security-auditor, code-reviewer, sprint-prioritizer
1. **sprint-prioritizer**: Coordinate final sprint and launch preparation
2. **api-documenter**: Complete all documentation
3. **security-auditor**: Final security audit
4. **code-reviewer**: Final code review and optimization

## Agent Interaction Patterns

### Sequential Workflow
```
backend-architect → database-optimizer → security-auditor → frontend-developer → test-automator → code-reviewer
```

### Creative Collaboration
- **ui-designer** + **whimsy-injector**: Visual design with delightful interactions
- **ux-researcher** + **frontend-developer**: User-centered component development
- **sprint-prioritizer** + **test-runner**: Coordinated development and quality assurance

### Quality Assurance Pipeline
- **test-automator**: Creates comprehensive test suites
- **test-runner**: Executes tests automatically in CI/CD
- **code-reviewer**: Reviews all code changes
- **security-auditor**: Reviews security-critical changes
- **debugger**: Called when issues arise

## Explicit Agent Invocation Commands

### Creative Workflow Commands
```bash
# Design phase
"Use the ui-designer to create the teacher profile card design with photo and contact info"

# User experience optimization
"Use the ux-researcher to analyze the student enrollment workflow and suggest improvements"

# Project management
"Use the sprint-prioritizer to break down the Groups module into 3-day development tasks"

# Add delightful interactions
"Use the whimsy-injector to add smooth transitions to the data table sorting and filtering"

# Test execution
"Use the test-runner to execute the full test suite and generate a coverage report"
```

### Quality Assurance Commands
```bash
# Comprehensive testing
"Use the test-automator to create tests, then the test-runner to execute them in CI/CD"

# Design validation
"Use the ui-designer to review the current interface for consistency, then the ux-researcher to validate the user workflow"

# Sprint coordination
"Use the sprint-prioritizer to coordinate the backend-architect and frontend-developer work on the Teachers module"
```

### Deployment Commands
```bash
# Deployment setup
"Use the deployment-strategist to configure the Vercel production deployment"

# Documentation
"Use the api-documenter to create the API reference for teachers endpoints"
```

## Agent Configuration Files

### Priority Agents to Set Up First
1. `~/.claude/agents/backend-architect.md`
2. `~/.claude/agents/frontend-developer.md`
3. `~/.claude/agents/database-optimizer.md`
4. `~/.claude/agents/security-auditor.md`

### Custom Agent Specializations

Each agent should be configured with specific context about the Harry School CRM:
- **Technologies**: Next.js 14+, Supabase, shadcn/ui, TypeScript
- **Domain**: Education CRM, multi-language support, admin-only access
- **Requirements**: Soft deletes, real-time notifications, role-based access

## Success Metrics

### Development Efficiency
- 40% faster development with specialized agents
- Consistent code quality across all modules
- Automated testing coverage > 90%

### Code Quality
- Zero security vulnerabilities
- TypeScript strict mode compliance
- Performance benchmarks met

### Deployment Reliability
- Automated CI/CD pipeline
- Zero-downtime deployments
- Comprehensive monitoring and alerts

This subagent team configuration ensures comprehensive coverage of all aspects of the Harry School CRM development, from database design to deployment, while maintaining high code quality and security standards.