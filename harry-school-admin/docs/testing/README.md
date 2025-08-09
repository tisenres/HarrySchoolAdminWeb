# Testing Strategy for Harry School CRM

## Overview

This document outlines the comprehensive testing strategy implemented for the Harry School CRM, with a focus on the Teachers Module. Our testing approach ensures high-quality, reliable, and accessible software through multiple layers of automated testing.

## Testing Philosophy

- **Quality First**: 90% minimum test coverage across all modules
- **Accessibility by Default**: WCAG 2.1 AA compliance verification
- **User-Centric**: Testing real user workflows and edge cases
- **Performance Focused**: Core Web Vitals monitoring and optimization
- **Continuous Feedback**: Fast, reliable CI/CD pipeline integration

## Test Pyramid Structure

### 1. Unit Tests (70% of total tests)
**Location**: `src/__tests__/components/`, `src/__tests__/lib/`
**Framework**: Jest + React Testing Library

#### Components Covered:
- `TeachersTable`: Sorting, filtering, pagination, bulk operations
- `TeacherForm`: Multi-section forms, validation, image upload
- `TeachersFilters`: Debounced search, advanced filtering
- `TeacherProfile`: Tabbed interface, data display

#### Services Covered:
- `TeacherService`: CRUD operations, business logic, error handling
- Validation schemas with edge cases and data type validation

**Key Features**:
- Mock data factories for consistent test data
- Custom render utility with providers (React Query, i18n)
- Comprehensive prop and state testing
- Error boundary and loading state verification

### 2. Integration Tests (20% of total tests)
**Location**: `src/__tests__/lib/services/`
**Framework**: Jest with Supabase mocks

#### Coverage Areas:
- Service layer integration with database
- Authentication and permission checks
- Data transformation and validation pipelines
- Error handling across service boundaries

### 3. End-to-End Tests (10% of total tests)
**Location**: `e2e/teachers/`
**Framework**: Puppeteer

#### Critical Workflows Tested:
- Teacher creation workflow with validation
- Teacher profile navigation and editing
- Search and filtering functionality
- Bulk operations and data management
- Error states and recovery

## Testing Categories

### Accessibility Testing
**Framework**: axe-core + Jest
**Location**: `src/__tests__/accessibility/`

#### Compliance Checks:
- WCAG 2.1 AA standards verification
- Keyboard navigation support
- Screen reader compatibility
- Color contrast and focus management
- ARIA labels and semantic structure

#### Automated Checks:
- Form accessibility (labels, validation, error states)
- Table accessibility (headers, sorting, selection)
- Navigation accessibility (tabs, menus, links)
- Modal and dialog accessibility

### Performance Testing
**Framework**: Lighthouse CI
**Configuration**: `lighthouserc.js`

#### Metrics Monitored:
- **Core Web Vitals**: LCP < 3s, FCP < 2s, CLS < 0.1
- **Performance Score**: > 80
- **Accessibility Score**: > 90
- **Bundle Size**: Monitored for growth
- **Runtime Performance**: Memory leaks, long tasks

#### Teachers Module Specific:
- Large dataset rendering (500+ teachers)
- Search and filter performance
- Form submission responsiveness
- Image upload optimization

### Security Testing
**Tools**: npm audit, CodeQL, OWASP ZAP

#### Areas Covered:
- Input validation and sanitization
- XSS prevention
- CSRF protection
- Authentication and authorization
- Data exposure prevention

## Test Data Management

### Mock Data Strategy
**Location**: `src/__tests__/utils/mock-data.ts`

#### Factories Available:
- `createMockTeacher()`: Complete teacher objects
- `createMockTeacherList(count)`: Arrays of teachers
- `createMockCreateTeacherRequest()`: Form submission data
- `createMockHandlers()`: Event handlers for testing

#### Data Variations:
- Valid data sets for happy path testing
- Invalid data for validation testing
- Edge cases (empty fields, boundary values)
- Specialized data (different employment statuses, specializations)

### Test Environment Setup
**Configuration**: `jest.setup.js`, `jest.config.js`

#### Mocked Services:
- Supabase client and queries
- Next.js router and navigation
- File upload and image processing
- Network requests and responses
- Browser APIs (IntersectionObserver, ResizeObserver)

## Running Tests

### Development Workflow
```bash
# Run all tests
npm test

# Watch mode for active development
npm run test:watch

# Run specific test suites
npm run test:teachers
npm run test:accessibility
npm run test:integration

# Generate coverage reports
npm run test:coverage
```

### CI/CD Integration
```bash
# Quality checks
npm run quality:ci

# Full test suite
npm run test:ci

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:performance
```

### Module-Specific Testing
```bash
# Teachers module comprehensive testing
npm run test:teachers

# E2E tests for teachers workflows
npm run test:e2e:teachers
```

## Coverage Requirements

### Overall Project
- **Minimum**: 90% line coverage
- **Branches**: 90% coverage
- **Functions**: 90% coverage
- **Statements**: 90% coverage

### Teachers Module Specific
- **Components**: 95% coverage (critical UI components)
- **Services**: 95% coverage (business logic)
- **Validation**: 100% coverage (data integrity)
- **Critical Paths**: 100% coverage (CRUD operations)

### Exclusions
- Type definitions (`*.d.ts`)
- Configuration files
- Build and deployment scripts
- Demo/example components

## Continuous Integration

### GitHub Actions Workflow
**File**: `.github/workflows/test.yml`

#### Test Pipeline:
1. **Quality Gate**: Linting, formatting, type checking
2. **Unit Tests**: Component and service testing
3. **Integration Tests**: Service layer verification
4. **Accessibility Tests**: WCAG compliance checking
5. **E2E Tests**: Critical workflow validation
6. **Performance Tests**: Lighthouse CI execution
7. **Security Tests**: Vulnerability scanning

#### Branch Protection:
- All tests must pass before merge
- Coverage thresholds enforced
- Performance budgets respected
- Security scans completed

### Scheduled Testing
- **Daily**: Full test suite execution
- **Weekly**: Performance regression testing
- **Monthly**: Security audit and dependency updates

## Testing Best Practices

### Test Structure
```typescript
describe('Component/Feature Name', () => {
  describe('Rendering', () => {
    // Basic rendering tests
  })
  
  describe('User Interactions', () => {
    // Event handling and state changes
  })
  
  describe('Data Handling', () => {
    // Props, API integration, validation
  })
  
  describe('Error Handling', () => {
    // Error states and edge cases
  })
  
  describe('Accessibility', () => {
    // A11y specific tests
  })
})
```

### Test Naming Conventions
- Descriptive test names explaining the expected behavior
- Use "should" statements for clarity
- Include edge cases and error conditions
- Group related tests logically

### Mocking Strategy
- Mock external dependencies (APIs, services)
- Preserve component behavior integrity
- Use realistic mock data
- Test both success and error scenarios

## Debugging Failed Tests

### Local Development
```bash
# Run specific failing test
npm test -- --testNamePattern="failing test name"

# Run with verbose output
npm test -- --verbose

# Debug mode
npm test -- --inspect-brk
```

### CI/CD Debugging
- Check GitHub Actions logs
- Download test artifacts (screenshots, videos)
- Review coverage reports
- Analyze performance metrics

## Performance Monitoring

### Metrics Dashboard
- Test execution times
- Coverage trends over time
- Performance regression alerts
- Accessibility compliance tracking

### Optimization Targets
- Unit test suite: < 30 seconds
- Integration tests: < 2 minutes
- E2E tests: < 10 minutes
- Full pipeline: < 15 minutes

## Contributing to Tests

### Adding New Tests
1. Follow the established file structure
2. Use mock data factories
3. Include accessibility checks
4. Add performance considerations
5. Update documentation

### Test Review Checklist
- [ ] Tests cover happy path and edge cases
- [ ] Accessibility requirements verified
- [ ] Performance impact considered
- [ ] Error scenarios included
- [ ] Documentation updated
- [ ] CI/CD integration confirmed

## Troubleshooting

### Common Issues
- **Flaky tests**: Use proper waiting strategies, stable selectors
- **Memory leaks**: Clean up subscriptions, timers, and event listeners
- **Performance**: Optimize test data size, use efficient queries
- **Accessibility**: Ensure proper ARIA labels and semantic structure

### Getting Help
- Check existing test patterns in similar components
- Review testing utilities and helpers
- Consult accessibility testing guide
- Ask team members for code review

## Future Improvements

### Planned Enhancements
- Visual regression testing with Percy/Chromatic
- Contract testing for API boundaries
- Mutation testing for test quality verification
- Cross-browser compatibility matrix
- Mobile device testing expansion

### Technology Roadmap
- Upgrade to latest testing frameworks
- Enhanced reporting and analytics
- AI-powered test generation
- Automated accessibility remediation
- Performance optimization suggestions

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Puppeteer Documentation](https://puppeteer.dev/)
- [axe-core Accessibility Testing](https://github.com/dequelabs/axe-core)

### Team Standards
- [Component Testing Guide](./component-testing.md)
- [Accessibility Testing Checklist](./accessibility-checklist.md)
- [Performance Testing Guidelines](./performance-testing.md)
- [E2E Testing Patterns](./e2e-patterns.md)