# Code Quality Guidelines

## Overview

This document outlines the code quality improvements and best practices implemented in the Harry School Admin codebase.

## Recent Improvements

### 1. Performance Optimizations

#### Next.js Configuration
- Added `webpackMemoryOptimizations` for reduced memory usage during builds
- Implemented `optimizePackageImports` for better tree-shaking of heavy libraries
- Enabled `serverComponentsHmrCache` for faster development
- Configured `cssChunking: 'strict'` for better CSS caching
- Disabled production source maps to save memory

### 2. Type Safety

#### TypeScript Improvements
- Replaced all `any` types with proper TypeScript interfaces
- Created `src/types/common.ts` with reusable type definitions
- Fixed type issues in finance module
- Added strict type checking for API responses

### 3. Error Handling

#### Centralized Error System
- Created `src/lib/utils/error-handler.ts` with custom error classes
- Implemented consistent error responses across API routes
- Added retry logic with exponential backoff
- Created error recovery strategies

### 4. Logging

#### Structured Logging
- Created `src/lib/utils/logger.ts` for centralized logging
- Replaced console statements with structured logging
- Added performance logging utilities
- Implemented different log levels for dev/prod

### 5. Code Organization

#### Barrel Exports
- Created index.ts files for cleaner imports
- Organized UI components exports
- Centralized utility exports

#### Constants
- Extracted magic numbers to `src/lib/constants.ts`
- Centralized configuration values
- Created typed constants for better IntelliSense

### 6. Reusable Patterns

#### CRUD Hooks
- Created generic `useCrud` hook in `src/hooks/use-crud.ts`
- Implemented reusable data fetching patterns
- Added optimistic updates support
- Created bulk operations utilities

### 7. Quality Gates

#### Pre-commit Hooks
- Set up Husky for Git hooks
- Configured lint-staged for incremental checks
- Added commitlint for conventional commits
- Implemented pre-push quality checks

## Code Standards

### TypeScript

```typescript
// ✅ Good - Proper types
interface UserData {
  id: string
  email: string
  role: 'admin' | 'viewer'
}

// ❌ Bad - Using any
const userData: any = { ... }
```

### Error Handling

```typescript
// ✅ Good - Using error handler
import { AppError, asyncHandler } from '@/lib/utils/error-handler'

export const GET = asyncHandler(async (req) => {
  if (!authorized) {
    throw new AuthorizationError('Access denied')
  }
  return data
})

// ❌ Bad - Inconsistent error handling
try {
  // ...
} catch (e) {
  console.log(e)
  return Response.json({ error: 'Something went wrong' })
}
```

### Logging

```typescript
// ✅ Good - Structured logging
import { logger } from '@/lib/utils/logger'

logger.info('User logged in', { 
  userId: user.id,
  module: 'auth'
})

// ❌ Bad - Console logging
console.log('User logged in', user)
```

### Constants

```typescript
// ✅ Good - Using constants
import { PAGINATION, VALIDATION } from '@/lib/constants'

const pageSize = PAGINATION.DEFAULT_PAGE_SIZE
const minLength = VALIDATION.MIN_NAME_LENGTH

// ❌ Bad - Magic numbers
const pageSize = 20
const minLength = 2
```

## Performance Best Practices

### 1. Dynamic Imports

```typescript
// Load heavy components only when needed
const HeavyChart = dynamic(() => import('@/components/charts/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

### 2. Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // for above-the-fold images
/>
```

### 3. Bundle Size

```typescript
// Import specific functions
import { format } from 'date-fns/format'

// Not entire library
import * as dateFns from 'date-fns'
```

## Testing Standards

### Unit Tests

```typescript
describe('TeacherService', () => {
  it('should create a teacher with valid data', async () => {
    const result = await service.create(validData)
    expect(result).toHaveProperty('id')
  })
})
```

### Integration Tests

```typescript
describe('Teachers API', () => {
  it('should return 401 for unauthorized requests', async () => {
    const response = await fetch('/api/teachers')
    expect(response.status).toBe(401)
  })
})
```

## Git Commit Convention

Follow conventional commits:

```
feat: add teacher profile page
fix: resolve pagination issue in students table
docs: update API documentation
style: format code with prettier
refactor: extract common table logic
perf: optimize image loading
test: add unit tests for auth service
build: update webpack configuration
ci: add GitHub Actions workflow
chore: update dependencies
```

## Security Best Practices

1. **Environment Variables**: Never commit secrets
2. **Input Validation**: Always validate user input
3. **SQL Injection**: Use parameterized queries
4. **XSS Prevention**: Sanitize user content
5. **CSRF Protection**: Use CSRF tokens
6. **Rate Limiting**: Implement request limits

## Monitoring

### Performance Metrics

```typescript
import { logPerformance } from '@/lib/utils/logger'

const startTime = performance.now()
// ... operation ...
logPerformance('fetchTeachers', performance.now() - startTime)
```

### Error Tracking

```typescript
// Errors are automatically logged
// In production, integrate with Sentry or similar
```

## Continuous Improvement

1. Run quality checks regularly:
   ```bash
   npm run quality
   ```

2. Check bundle size:
   ```bash
   npm run analyze
   ```

3. Run performance tests:
   ```bash
   npm run test:performance
   ```

4. Update dependencies:
   ```bash
   npm run upgrade
   npm audit fix
   ```

## Tools & Scripts

- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types
- `npm run test:coverage` - Check test coverage
- `npm run quality:ci` - Run all quality checks

## Resources

- [Next.js Best Practices](https://nextjs.org/docs/best-practices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)