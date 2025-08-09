# Harry School CRM

## Project Overview

**Harry School CRM** is a comprehensive admin panel for managing a private education center in Tashkent. The system provides full CRUD operations for Teachers, Groups, and Students with advanced filtering, search, and multi-language support.

## Architecture & Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Storage, Realtime)
- **UI Framework**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand (client) + React Query (server state)
- **Internationalization**: next-intl (English, Russian, Uzbek Latin)
- **Authentication**: Supabase Auth (admin-only access)
- **Deployment**: Vercel with automated CI/CD
- **Development**: Claude Code IDE with MCP servers

## Core Modules

### Initial Version (Phase 1-3)
1. **Teachers** - Full CRUD with group assignments and specializations
2. **Groups** - Learning class management with teacher-student relationships  
3. **Students** - Complete student lifecycle with status tracking and enrollment
4. **Settings** - User management, archives, and system configuration

### Future Modules (Phase 4+)
- **Leads** - CRM for prospective students
- **Finance** - Payment tracking and financial dashboards
- **Reports** - Analytics and performance metrics

## Key Features

- **Multi-tenant Architecture**: Organization-based data isolation
- **Role-based Access Control**: superadmin/admin roles with comprehensive RLS
- **Soft Delete System**: Complete audit trail with restore capabilities
- **Real-time Notifications**: System events and alerts
- **Advanced Search & Filtering**: Contextual search within each module
- **Multi-language Support**: English (default), Russian, Uzbek Latin
- **Responsive Design**: Desktop and tablet optimized admin interface

## Development Workflow

### MCP Server Configuration
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
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

### Subagent Team Structure

**Foundation Team (Phase 1)**
- `ux-researcher` - User workflow analysis, early design research
- `ui-designer` - Design system, component mockups, visual consistency
- `backend-architect` - Database schema, API design, security architecture
- `security-auditor` - RLS policies, authentication flows, compliance

**Development Team (Phase 2-3)**  
- `frontend-developer` - React components, admin interfaces, responsive layouts
- `database-optimizer` - Query optimization, indexing, performance tuning
- `test-automator` - Comprehensive test suites, CI/CD integration
- `whimsy-injector` - Micro-animations, delightful user interactions

**Quality & Deployment (Phase 3-4)**
- `code-reviewer` - Code quality, TypeScript compliance, best practices
- `test-runner` - Automated test execution, quality gates
- `performance-engineer` - Optimization, caching, monitoring
- `deployment-engineer` - CI/CD, environment management, production setup

### Commands & Usage

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run test            # Run test suite
npm run type-check      # TypeScript validation

# Database
npx supabase start      # Start local Supabase
npx supabase db reset   # Reset database
npx supabase gen types  # Generate TypeScript types

# Subagent Commands
"Use the ux-researcher to analyze admin workflows and create user personas"
"Use the ui-designer to create the teacher profile card design"
"Use the backend-architect to design the core education schema"
"Use the frontend-developer to build the data table component"
```

## Data Models

### Core Entities
- **organizations** - Multi-tenant support with settings
- **profiles** - User profiles extending Supabase auth.users
- **teachers** - Teacher information with specializations
- **students** - Student records with status and enrollment tracking
- **groups** - Learning classes with scheduling and capacity
- **notifications** - Real-time system events and alerts

### Key Relationships
- Teachers ↔ Groups (many-to-many assignments)
- Students ↔ Groups (enrollment history with dates)
- Users ↔ Organizations (role-based access control)

## Security & Compliance

- **Row Level Security**: Comprehensive RLS policies for data isolation
- **Admin-only Access**: No self-registration, invite-only system
- **Audit Trails**: Complete tracking of data changes (created_by, updated_by, deleted_by)
- **Soft Deletes**: Recoverable deletion with archive management
- **Input Validation**: Zod schemas for all forms and API endpoints

## Performance Requirements

- **Large Dataset Support**: 500+ students, 25+ groups, efficient pagination
- **Real-time Updates**: WebSocket connections for notifications
- **Search Performance**: Sub-200ms search across names and phone numbers
- **Mobile Responsive**: Optimized for tablet and desktop usage

## Quality Standards

- **Test Coverage**: Minimum 90% across unit, integration, and e2e tests
- **TypeScript Strict**: Full type safety with strict mode enabled
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Core Web Vitals optimization
- **Security**: Regular audits and vulnerability scanning

## File Structure

```
harry-school-crm/
├── src/
│   ├── app/[locale]/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   └── api/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── admin/       # Admin-specific components
│   │   └── layout/      # Layout components
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── supabase.ts
│   │   └── validations.ts
│   ├── types/
│   ├── hooks/
│   └── utils/
├── messages/            # i18n translations
├── supabase/           # Database migrations and functions
├── docs/               # Subagent knowledge base
└── CLAUDE.md          # This file
```

## Success Metrics

- **Development Velocity**: 40% faster with specialized subagents
- **Code Quality**: Zero security vulnerabilities, 90%+ test coverage
- **User Experience**: Intuitive admin workflows, <200ms response times
- **Reliability**: 99.9% uptime, automated deployments, comprehensive monitoring

## Documentation Standards

All subagents must maintain documentation in the `docs/` directory:
- `docs/database/` - Schema designs, RLS policies, query optimization
- `docs/frontend/` - Component library, design system, user workflows
- `docs/api/` - Endpoint documentation, authentication flows
- `docs/testing/` - Test strategies, coverage reports, quality gates
- `docs/deployment/` - Environment setup, CI/CD, monitoring

## Next Steps

1. Initialize project structure with Next.js 14+ and Supabase
2. Set up MCP servers and subagent configurations
3. Begin Phase 1 with UX research and database design
4. Implement core modules following the development phases
5. Deploy to production with comprehensive monitoring

This project represents a modern, scalable approach to educational management systems, leveraging cutting-edge technologies and AI-assisted development practices.