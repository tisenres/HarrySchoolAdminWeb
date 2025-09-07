# Harry School CRM Development Guide

## 🎯 Project Overview

**Harry School CRM** is a comprehensive educational management system for a private education center in Tashkent, focusing on:
- **Admin Panel**: Web-based management system (Next.js + Vercel)

## 🛠 Technology Stack

| Component | Technology |
|-----------|------------|
| **Web Frontend** | Next.js 14+ (App Router), TypeScript, shadcn/ui, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL, Auth, RLS, Storage) |
| **State Management** | Zustand (client), React Query (server) |
| **AI Services** | OpenAI GPT-4, Whisper API |
| **Deployment** | Vercel (web) |
| **Development** | Claude Code with MCP servers + Subagents |

## 📁 Context Management Strategy

### Shared Context File
All agents use `/docs/tasks/context.md` for maintaining project continuity.

```markdown
# Project Context: [Feature Name]
Last Updated: [timestamp]

## Current Status
- Phase: [planning/development/testing/complete]
- Active Agent: [agent-name]

## Completed Work
- [timestamp] [agent-name]: [summary]

## Research Reports
- backend-architecture.md
- frontend-design.md
- ai-integration.md

## Next Steps
- [ ] Task 1
- [ ] Task 2
```

### Agent Workflow

1. **Before Work**: Read `/docs/tasks/context.md`
2. **During Work**: Research and plan (never implement)
3. **After Work**: Update context file and save research

## 🤖 Subagent Team

### Core Development Agents
| Agent | Specialization | Color |
|-------|---------------|--------|
| `backend-architect` | Database schemas, API design, RLS policies | Blue |
| `frontend-developer` | React components, state management | Yellow |
| `mobile-developer` | *Not applicable - mobile apps removed* | Orange |
| `ui-designer` | Design systems, visual specifications | Pink |
| `whimsy-injector` | Animations, micro-interactions | Purple |

### Quality & Security Agents
| Agent | Specialization | Color |
|-------|---------------|--------|
| `security-auditor` | Security analysis, compliance | Red |
| `test-automator` | Test strategies, coverage planning | Purple |
| `test-runner` | CI/CD pipelines, execution plans | Cyan |
| `database-optimizer` | Query optimization, indexing | Green |
| `performance-analyzer` | Web performance optimization, caching | Yellow |

### Coordination & Deployment Agents
| Agent | Specialization | Color |
|-------|---------------|--------|
| `sprint-prioritizer` | Task breakdown, agent coordination | Pink |
| `ux-researcher` | User workflows, information architecture | Green |
| `ai-engineer` | LLM integration, prompt engineering | Blue |
| `deployment-strategist` | Vercel deployment, CI/CD | Blue |

## 🔧 MCP Server Configuration

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase@latest", "--project-ref=xlcsegukheumsadygmgh"]
    },
    "context7": {
      "command": "npx",
      "args": ["@upstash/context7-mcp@latest"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "./"]
    },
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"]
    },
    "playwright-enhanced": {
      "command": "npx",
      "args": ["@executeautomation/playwright-mcp-server"]
    },
    "browser": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-puppeteer"]
    },
    "memory": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-memory"]
    },
    "shadcn-ui": {
      "command": "npx",
      "args": ["@jpisnice/shadcn-ui-mcp-server"]
    }
  }
}
```

## 📋 Development Workflow

### 1️⃣ Planning Phase
```bash
# Create context and plan sprint
"Create context file at /docs/tasks/context.md for [feature]"
"Use sprint-prioritizer to plan research tasks"
```

### 2️⃣ Research Phase
```bash
# Architecture research
"Use backend-architect to design database schema"
"Use frontend-developer to plan component architecture"
"Focus on admin panel component architecture"

# UX and design research
"Use ux-researcher to analyze user workflows"
"Use ui-designer to create design specifications"
"Use whimsy-injector to plan micro-interactions"

# Quality research
"Use security-auditor to assess security requirements"
"Use test-automator to plan testing strategy"
"Use performance-analyzer to identify optimizations"
```

### 3️⃣ Implementation Phase
```bash
# Main agent implements based on research
"Implement [feature] using research from /docs/tasks/"
```

### 4️⃣ Deployment Phase
```bash
# Deployment preparation
"Use deployment-strategist to plan release strategy"
"Use test-runner to configure CI/CD pipeline"
```

## 🚀 Quick Commands

### Feature Development
```bash
# Complete feature with all agents
"Plan and research the student enrollment feature using relevant subagents, then implement based on their research"
```

### Performance Optimization
```bash
# Optimize existing feature
"Use performance-analyzer to analyze the student list performance, then implement optimizations"
```

### Security Audit
```bash
# Security review
"Use security-auditor to review the authentication system, then implement necessary security improvements"
```


## 📊 Development Phases

| Phase | Duration | Focus | Key Agents |
|-------|----------|-------|------------|
| **Foundation** | Weeks 1-2 | Database, Auth, UI Framework | backend-architect, security-auditor, ui-designer |
| **Core Modules** | Weeks 3-6 | Teachers, Students, Groups | frontend-developer, backend-architect |
| **Advanced** | Weeks 7-8 | Notifications, Search, Performance | performance-analyzer, database-optimizer |
| **Polish** | Weeks 9-10 | Testing, Deployment | test-automator, deployment-strategist |

## ✅ Best Practices

### DO
- ✅ Always use context file (`/docs/tasks/context.md`)
- ✅ Let subagents research, main agent implements
- ✅ Document all research in `/docs/tasks/`
- ✅ Use appropriate MCP servers for each task
- ✅ Update context after each work session

### DON'T
- ❌ Let subagents implement code
- ❌ Skip reading context file
- ❌ Lose research between sessions
- ❌ Ignore previous decisions
- ❌ Forget to update context

## 🎯 Success Metrics

- **Code Coverage**: ≥90%
- **Performance**: LCP <2.5s, FID <100ms
- **Bundle Size**: <500KB initial
- **API Response**: <200ms
- **Security**: OWASP compliant

## 📚 Core Features

### Admin Panel
- Teachers Management (CRUD + specializations)
- Students Management (enrollment, ranking)
- Groups Management (scheduling, capacity)
- Settings (users, configuration, archives)


## 🔐 Key Configurations

### Database
- Multi-tenant with organization isolation
- Soft delete pattern (deleted_at, deleted_by)
- Comprehensive audit trails
- RLS policies on all tables

### Authentication
- Admin-only access (no self-registration)
- Role hierarchy (superadmin, admin)
- Supabase Auth with JWT
- Session management

### Internationalization
- English (default)
- Russian
- Uzbek (Latin)

## 🚨 CRITICAL: Honesty and Status Reporting

### NEVER claim something is "ready" or "production-ready" unless:
- ✅ ALL functionality has been implemented AND tested
- ✅ Backend integration is complete and working
- ✅ All buttons and UI elements are functional
- ✅ Error handling is implemented
- ✅ Data validation is working
- ✅ Authentication/authorization is properly implemented

### ALWAYS be explicit about what IS and ISN'T working:
- ❌ "The feature is ready" (when only UI exists)
- ✅ "The UI components are implemented, but backend integration is needed"
- ❌ "Everything is working"
- ✅ "The form renders correctly, but submission isn't connected to the database yet"

### Status Classification:
- 🔴 **Concept/Design Only**: No working code
- 🟡 **UI Shell**: Components exist but no functionality
- 🟠 **Partial Implementation**: Some features work, others don't
- 🟢 **Feature Complete**: All functionality implemented and tested
- ✅ **Production Ready**: Fully tested, integrated, and deployed

### Always specify current status when reporting progress

## 📝 Notes

- **Primary Color**: #1d7452
- **Target Users**: Harry School administrators and teachers
- **Location**: Tashkent, Uzbekistan
- **Scale**: 500+ students, 25+ groups, 50+ teachers