# Testing Standards and Coverage Requirements

## Overview

This document outlines the comprehensive testing standards for the Harry School CRM project. Our testing strategy ensures 90%+ code coverage while maintaining high-quality, maintainable test suites across unit, integration, and end-to-end testing levels.

## Testing Philosophy

### Testing Pyramid

```
    /\
   /  \    E2E Tests (10%)
  /____\   - Critical user journeys
 /      \   - Cross-browser compatibility
/__________\ Integration Tests (30%)
\          / - API endpoints
 \        /  - Database operations
  \______/   - Service integrations
  
  Unit Tests (60%)
  - Components
  - Utilities
  - Business logic
```

### Core Principles

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Fast and Reliable**: Tests should run quickly and consistently
3. **Maintainable**: Tests should be easy to understand and modify
4. **Isolated**: Each test should be independent and not rely on others
5. **Comprehensive**: Cover happy paths, edge cases, and error scenarios

## Test Categories

### Unit Tests (60% of test suite)

**Purpose**: Test individual functions, components, and classes in isolation

**Scope**:
- Pure functions and utilities
- React components (rendering and behavior)
- Custom hooks
- Business logic and calculations
- Data transformations

**Tools**:
- Jest (test runner and assertions)
- React Testing Library (component testing)
- MSW (API mocking)
- Jest DOM (DOM assertions)

#### Component Testing Standards

```typescript
// ✅ Good - Comprehensive component test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentCard } from './StudentCard';
import { mockStudent } from '../__mocks__/student.mock';

describe('StudentCard', () => {
  const defaultProps = {
    student: mockStudent,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should display student information correctly', () => {
      render(<StudentCard {...defaultProps} />);
      
      expect(screen.getByText(mockStudent.name)).toBeInTheDocument();
      expect(screen.getByText(mockStudent.email)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /student avatar/i })).toBeInTheDocument();
    });

    it('should show enrollment status badge with correct color', () => {
      const activeStudent = { ...mockStudent, status: 'active' };
      render(<StudentCard student={activeStudent} {...defaultProps} />);
      
      const statusBadge = screen.getByText('Active');
      expect(statusBadge).toHaveClass('badge-success');
    });
  });

  describe('Interactions', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<StudentCard {...defaultProps} />);
      
      const editButton = screen.getByRole('button', { name: /edit student/i });
      await user.click(editButton);
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockStudent);
      expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
    });

    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<StudentCard {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete student/i });
      await user.click(deleteButton);
      
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    });

    it('should call onDelete when deletion is confirmed', async () => {
      const user = userEvent.setup();
      render(<StudentCard {...defaultProps} />);
      
      // Open confirmation dialog
      const deleteButton = screen.getByRole('button', { name: /delete student/i });
      await user.click(deleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);
      
      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockStudent.id);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<StudentCard {...defaultProps} />);
      
      expect(screen.getByRole('article')).toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('button', { name: /edit student/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete student/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<StudentCard {...defaultProps} />);
      
      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /edit student/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /delete student/i })).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing student data gracefully', () => {
      const incompleteStudent = { id: '1', name: 'Test Student' };
      render(<StudentCard student={incompleteStudent} {...defaultProps} />);
      
      expect(screen.getByText('Test Student')).toBeInTheDocument();
      expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
    });
  });
});
```

#### Hook Testing Standards

```typescript
// ✅ Good - Custom hook test
import { renderHook, waitFor } from '@testing-library/react';
import { useStudentData } from './useStudentData';
import { studentService } from '@/lib/services/student.service';

jest.mock('@/lib/services/student.service');

describe('useStudentData', () => {
  const mockStudentService = jest.mocked(studentService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    mockStudentService.getById.mockImplementation(() => new Promise(() => {}));
    
    const { result } = renderHook(() => useStudentData('student-1'));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.student).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and return student data', async () => {
    const mockStudent = { id: 'student-1', name: 'John Doe' };
    mockStudentService.getById.mockResolvedValue(mockStudent);
    
    const { result } = renderHook(() => useStudentData('student-1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.student).toEqual(mockStudent);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle service errors', async () => {
    const errorMessage = 'Failed to fetch student';
    mockStudentService.getById.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useStudentData('student-1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.student).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });
  });

  it('should cleanup on unmount', () => {
    mockStudentService.getById.mockImplementation(() => new Promise(() => {}));
    
    const { unmount } = renderHook(() => useStudentData('student-1'));
    
    unmount();
    
    // Verify cleanup (no state updates after unmount)
    expect(() => unmount()).not.toThrow();
  });
});
```

### Integration Tests (30% of test suite)

**Purpose**: Test the interaction between different parts of the system

**Scope**:
- API route handlers
- Database operations
- Service layer integration
- Authentication flows
- Form submissions with validation

**Tools**:
- Jest (test runner)
- Supertest (API testing)
- Test database setup
- MSW (external API mocking)

#### API Integration Tests

```typescript
// ✅ Good - API integration test
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { createMockUser, createMockStudent } from '@/lib/test-utils';
import { setupTestDatabase, cleanupTestDatabase } from '@/lib/test-database';

describe('/api/students', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /api/students', () => {
    it('should return students for authenticated user', async () => {
      const user = await createMockUser({ role: 'admin' });
      const student = await createMockStudent({ organizationId: user.organizationId });
      
      const request = new NextRequest('http://localhost/api/students', {
        headers: { authorization: `Bearer ${user.token}` },
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.students).toHaveLength(1);
      expect(data.students[0]).toMatchObject({
        id: student.id,
        name: student.name,
        email: student.email,
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost/api/students');
      
      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });

    it('should filter students by search query', async () => {
      const user = await createMockUser({ role: 'admin' });
      await createMockStudent({ 
        name: 'John Doe', 
        organizationId: user.organizationId 
      });
      await createMockStudent({ 
        name: 'Jane Smith', 
        organizationId: user.organizationId 
      });
      
      const request = new NextRequest('http://localhost/api/students?search=John', {
        headers: { authorization: `Bearer ${user.token}` },
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.students).toHaveLength(1);
      expect(data.students[0].name).toBe('John Doe');
    });
  });

  describe('POST /api/students', () => {
    it('should create student with valid data', async () => {
      const user = await createMockUser({ role: 'admin' });
      const studentData = {
        name: 'New Student',
        email: 'new@example.com',
        phone: '+1234567890',
      };
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        headers: { 
          authorization: `Bearer ${user.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.student).toMatchObject(studentData);
      expect(data.student.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const user = await createMockUser({ role: 'admin' });
      const invalidData = { email: 'invalid-email' };
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        headers: { 
          authorization: `Bearer ${user.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.errors).toContain('Name is required');
      expect(data.errors).toContain('Invalid email format');
    });
  });
});
```

### End-to-End Tests (10% of test suite)

**Purpose**: Test complete user workflows from UI to database

**Scope**:
- Critical user journeys
- Authentication flows
- CRUD operations through UI
- Multi-step processes
- Cross-browser compatibility

**Tools**:
- Puppeteer (browser automation)
- Test databases
- Mock external services

#### E2E Test Examples

```typescript
// ✅ Good - E2E test
import { test, expect, Page } from '@puppeteer/test';
import { loginAsAdmin, createTestStudent } from './test-helpers';

test.describe('Student Management', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await loginAsAdmin(page);
  });

  test('should create a new student', async () => {
    // Navigate to students page
    await page.goto('/dashboard/students');
    await expect(page).toHaveTitle(/Students - Harry School CRM/);

    // Click add student button
    await page.click('[data-testid="add-student-button"]');
    await expect(page.locator('[data-testid="student-form"]')).toBeVisible();

    // Fill student form
    await page.fill('[data-testid="student-name"]', 'John Doe');
    await page.fill('[data-testid="student-email"]', 'john@example.com');
    await page.fill('[data-testid="student-phone"]', '+1234567890');
    
    // Select birth date
    await page.click('[data-testid="birth-date-picker"]');
    await page.click('[data-testid="date-1990-01-01"]');

    // Submit form
    await page.click('[data-testid="save-student-button"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Student created successfully');

    // Verify student appears in list
    await expect(page.locator('[data-testid="student-card"]')).toContainText('John Doe');
  });

  test('should edit existing student', async () => {
    // Create test student
    const student = await createTestStudent({ name: 'Jane Smith' });

    // Navigate and find student
    await page.goto('/dashboard/students');
    const studentCard = page.locator(`[data-testid="student-card-${student.id}"]`);
    await expect(studentCard).toBeVisible();

    // Click edit button
    await studentCard.locator('[data-testid="edit-button"]').click();
    await expect(page.locator('[data-testid="student-form"]')).toBeVisible();

    // Update name
    await page.fill('[data-testid="student-name"]', 'Jane Doe');
    await page.click('[data-testid="save-student-button"]');

    // Verify update
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="student-card"]')).toContainText('Jane Doe');
  });

  test('should delete student with confirmation', async () => {
    // Create test student
    const student = await createTestStudent({ name: 'Delete Me' });

    // Navigate and find student
    await page.goto('/dashboard/students');
    const studentCard = page.locator(`[data-testid="student-card-${student.id}"]`);
    await expect(studentCard).toBeVisible();

    // Click delete button
    await studentCard.locator('[data-testid="delete-button"]').click();

    // Confirm deletion in dialog
    const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText('Are you sure you want to delete');
    
    await confirmDialog.locator('[data-testid="confirm-button"]').click();

    // Verify student is removed
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(studentCard).not.toBeVisible();
  });

  test('should search and filter students', async () => {
    // Create test students
    await createTestStudent({ name: 'John Smith', status: 'active' });
    await createTestStudent({ name: 'Jane Doe', status: 'inactive' });
    await createTestStudent({ name: 'Bob Johnson', status: 'active' });

    await page.goto('/dashboard/students');

    // Test search
    await page.fill('[data-testid="search-input"]', 'John');
    await expect(page.locator('[data-testid="student-card"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="student-card"]')).toContainText('John Smith');
    await expect(page.locator('[data-testid="student-card"]')).toContainText('Bob Johnson');

    // Clear search
    await page.fill('[data-testid="search-input"]', '');
    await expect(page.locator('[data-testid="student-card"]')).toHaveCount(3);

    // Test status filter
    await page.selectOption('[data-testid="status-filter"]', 'active');
    await expect(page.locator('[data-testid="student-card"]')).toHaveCount(2);
    
    await page.selectOption('[data-testid="status-filter"]', 'inactive');
    await expect(page.locator('[data-testid="student-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="student-card"]')).toContainText('Jane Doe');
  });
});
```

## Test Coverage Requirements

### Overall Coverage Targets

- **Minimum Coverage**: 90% across all metrics
- **Lines**: 90%
- **Functions**: 90%
- **Branches**: 90%
- **Statements**: 90%

### Component-Specific Requirements

#### Critical Components (95% coverage required)
- Authentication components
- Payment processing
- Data validation utilities
- Security middleware

#### Standard Components (90% coverage required)
- CRUD components
- Form components
- Business logic utilities
- API route handlers

#### UI Components (85% coverage required)
- Layout components
- Styling utilities
- Animation components

### Coverage Reporting

```json
// jest.config.js coverage configuration
{
  "collectCoverageFrom": [
    "src/**/*.(ts|tsx|js|jsx)",
    "!src/**/*.d.ts",
    "!src/**/*.stories.*",
    "!src/**/*.test.*",
    "!src/**/*.spec.*",
    "!src/**/index.*"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    },
    "./src/lib/auth.ts": {
      "branches": 95,
      "functions": 95,
      "lines": 95,
      "statements": 95
    }
  }
}
```

## Mock Strategies

### Service Mocking

```typescript
// Mock external services
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));
```

### API Mocking with MSW

```typescript
// Mock API responses
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  rest.get('/api/students', (req, res, ctx) => {
    return res(
      ctx.json({
        students: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        ],
      })
    );
  }),

  rest.post('/api/students', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        student: { id: '3', ...req.body },
      })
    );
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Test Data Management

### Test Fixtures

```typescript
// Create reusable test data
export const studentFixtures = {
  activeStudent: {
    id: 'student-1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    enrolledAt: new Date('2023-01-15'),
  },
  
  inactiveStudent: {
    id: 'student-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'inactive',
    enrolledAt: new Date('2022-09-01'),
  },
  
  createStudent: (overrides = {}) => ({
    id: `student-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Student',
    email: 'test@example.com',
    status: 'active',
    enrolledAt: new Date(),
    ...overrides,
  }),
};
```

### Factory Functions

```typescript
// Factory for creating test data
import { faker } from '@faker-js/faker';

export class StudentFactory {
  static create(overrides: Partial<Student> = {}): Student {
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      birthDate: faker.date.past({ years: 25 }),
      status: faker.helpers.arrayElement(['active', 'inactive', 'graduated']),
      enrolledAt: faker.date.past({ years: 2 }),
      organizationId: faker.string.uuid(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides: Partial<Student> = {}): Student[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
```

## Performance Testing

### Load Testing

```typescript
// Performance test example
describe('Student List Performance', () => {
  it('should render 1000 students within acceptable time', async () => {
    const students = StudentFactory.createMany(1000);
    
    const startTime = performance.now();
    
    render(<StudentList students={students} />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('student-card')).toHaveLength(1000);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render within 2 seconds
    expect(renderTime).toBeLessThan(2000);
  });
});
```

## Test Environment Setup

### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx|js|jsx)',
    '!src/**/*.d.ts',
    '!src/**/*.stories.*',
    '!src/**/*.test.*',
    '!src/**/*.spec.*',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### Test Database Setup

```typescript
// lib/test-database.ts
import { createClient } from '@supabase/supabase-js';

const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_ANON_KEY!
);

export async function setupTestDatabase(): Promise<void> {
  // Reset database to clean state
  await testSupabase.rpc('reset_test_data');
  
  // Insert seed data
  await testSupabase.from('organizations').insert([
    { id: 'test-org-1', name: 'Test Organization' },
  ]);
}

export async function cleanupTestDatabase(): Promise<void> {
  // Clean up test data
  await testSupabase.rpc('cleanup_test_data');
}

export async function createTestUser(overrides = {}) {
  const userData = {
    email: 'test@example.com',
    password: 'testpassword',
    organizationId: 'test-org-1',
    ...overrides,
  };

  const { data, error } = await testSupabase.auth.signUp(userData);
  if (error) throw error;

  return data.user;
}
```

## Continuous Integration

### GitHub Actions Test Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:ci
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/lcov.info
```

## Best Practices

### Writing Effective Tests

#### Do's ✅
- Test behavior, not implementation details
- Use descriptive test names that explain the scenario
- Follow the Arrange-Act-Assert pattern
- Keep tests focused and atomic
- Use proper mocking for external dependencies
- Test edge cases and error scenarios
- Include accessibility testing

#### Don'ts ❌
- Don't test implementation details
- Don't write overly complex tests
- Don't rely on specific order of test execution
- Don't ignore flaky tests
- Don't mock everything unnecessarily
- Don't skip error scenarios

### Test Maintenance

#### Regular Review
- Review test failures promptly
- Update tests when requirements change
- Remove obsolete tests
- Refactor tests to reduce duplication
- Monitor test performance and optimize slow tests

#### Quality Metrics
- Track test coverage trends
- Monitor test execution time
- Measure test flakiness
- Review test code quality in code reviews

Remember: Tests are as important as production code. They should be well-written, maintainable, and provide confidence in the system's reliability.