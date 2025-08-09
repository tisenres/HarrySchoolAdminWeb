# Code Review Checklist

## Overview

This document provides a comprehensive checklist for code reviews in the Harry School CRM project. All pull requests must undergo thorough review using this checklist to ensure code quality, security, and maintainability.

## Review Process

### Pre-Review Requirements

Before starting the review, ensure:

- [ ] **CI/CD Pipeline**: All automated checks are passing
- [ ] **Branch Status**: Branch is up-to-date with target branch
- [ ] **PR Description**: Clear description of changes and their purpose
- [ ] **Linked Issues**: Associated tickets/issues are referenced
- [ ] **Self-Review**: Author has performed self-review
- [ ] **Testing**: Adequate test coverage is provided

### Review Timeline

- **Standard PR**: Review within 24 hours
- **Hotfix PR**: Review within 2 hours
- **Large PR**: Review within 48 hours (prefer smaller PRs)
- **Documentation PR**: Review within 48 hours

## Code Quality Checklist

### General Code Quality

#### Readability and Maintainability
- [ ] **Variable Names**: Descriptive and follow naming conventions
- [ ] **Function Names**: Clear and indicate their purpose
- [ ] **Code Comments**: Complex logic is well-documented
- [ ] **Code Structure**: Logical organization and proper separation of concerns
- [ ] **Magic Numbers**: No magic numbers; use named constants
- [ ] **Code Duplication**: No unnecessary code duplication
- [ ] **Function Size**: Functions are focused and not overly complex

```typescript
// ✅ Good - Clear, descriptive names
function calculateStudentGradeAverage(studentId: string, semesterId: string): Promise<number> {
  const PASSING_GRADE_THRESHOLD = 60;
  // Implementation here
}

// ❌ Bad - Unclear names and magic numbers
function calc(s: string, sem: string): Promise<number> {
  if (grade < 60) { // Magic number
    // Implementation here
  }
}
```

#### Error Handling
- [ ] **Error Boundaries**: Proper error boundaries for React components
- [ ] **Try-Catch**: Appropriate error handling in async operations
- [ ] **Error Messages**: User-friendly error messages
- [ ] **Error Logging**: Errors are properly logged for debugging
- [ ] **Graceful Degradation**: Application handles errors gracefully

```typescript
// ✅ Good - Comprehensive error handling
async function fetchStudentData(studentId: string): Promise<Student | null> {
  try {
    const response = await studentService.getById(studentId);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch student data', {
      studentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Show user-friendly message
    toast.error('Unable to load student information. Please try again.');
    return null;
  }
}
```

### TypeScript Specific

#### Type Safety
- [ ] **Type Annotations**: Explicit types for function parameters and returns
- [ ] **Interface Usage**: Proper interfaces for object shapes
- [ ] **Generic Usage**: Appropriate use of generics where beneficial
- [ ] **Type Guards**: Runtime type checking where necessary
- [ ] **No Any Types**: Avoid `any` type usage
- [ ] **Strict Null Checks**: Handle null and undefined properly

```typescript
// ✅ Good - Strong typing
interface CreateStudentRequest {
  name: string;
  email: string;
  phone?: string;
  birthDate?: Date;
}

function createStudent(data: CreateStudentRequest): Promise<Student> {
  // Implementation with proper typing
}

// ❌ Bad - Weak typing
function createStudent(data: any): Promise<any> {
  // Implementation without type safety
}
```

#### Import/Export Management
- [ ] **Import Organization**: Imports are properly organized and grouped
- [ ] **Unused Imports**: No unused imports present
- [ ] **Default vs Named**: Appropriate use of default vs named exports
- [ ] **Circular Dependencies**: No circular import dependencies

### React/Next.js Specific

#### Component Design
- [ ] **Component Responsibility**: Single responsibility principle followed
- [ ] **Props Interface**: Clear props interface definition
- [ ] **State Management**: Appropriate state management approach
- [ ] **Hook Usage**: Proper use of React hooks
- [ ] **Performance**: Unnecessary re-renders avoided

```typescript
// ✅ Good - Well-designed component
interface StudentCardProps {
  student: Student;
  onEdit?: (student: Student) => void;
  onDelete?: (studentId: string) => void;
  className?: string;
}

export const StudentCard = React.memo(function StudentCard({
  student,
  onEdit,
  onDelete,
  className
}: StudentCardProps) {
  const handleEdit = useCallback(() => {
    onEdit?.(student);
  }, [onEdit, student]);

  // Component implementation
});
```

#### Next.js Best Practices
- [ ] **App Router**: Proper use of Next.js 14+ App Router
- [ ] **Server Components**: Appropriate use of server vs client components
- [ ] **Image Optimization**: Using Next.js Image component
- [ ] **SEO**: Proper meta tags and structured data
- [ ] **Performance**: Optimal loading and rendering strategies

## Security Review

### Input Validation
- [ ] **User Input**: All user inputs are validated and sanitized
- [ ] **API Endpoints**: Server-side validation for all API routes
- [ ] **SQL Injection**: Protection against SQL injection attacks
- [ ] **XSS Prevention**: Cross-site scripting vulnerabilities addressed
- [ ] **CSRF Protection**: Cross-site request forgery protection implemented

```typescript
// ✅ Good - Input validation with Zod
const studentSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/).optional(),
});

export async function createStudent(data: unknown) {
  const validatedData = studentSchema.parse(data); // Throws if invalid
  // Process validated data
}
```

### Authentication and Authorization  
- [ ] **Authentication**: Proper authentication checks
- [ ] **Authorization**: Role-based access control implemented
- [ ] **Session Management**: Secure session handling
- [ ] **Token Security**: JWT tokens handled securely
- [ ] **Admin Access**: Admin-only features properly protected

### Data Security
- [ ] **Sensitive Data**: No sensitive information in logs or client code
- [ ] **Environment Variables**: Secrets stored in environment variables
- [ ] **Data Encryption**: Sensitive data encrypted at rest and in transit
- [ ] **PII Handling**: Personal information handled according to privacy policies

## Performance Review

### Code Performance
- [ ] **Algorithm Efficiency**: Efficient algorithms and data structures used
- [ ] **Database Queries**: Optimized database queries
- [ ] **Memory Usage**: No memory leaks or excessive memory usage
- [ ] **Bundle Size**: New dependencies don't significantly increase bundle size

### React Performance
- [ ] **Unnecessary Renders**: Components optimized to prevent unnecessary re-renders
- [ ] **Memoization**: Appropriate use of React.memo, useMemo, useCallback
- [ ] **Lazy Loading**: Large components lazy loaded when appropriate
- [ ] **Code Splitting**: Route-based code splitting implemented

```typescript
// ✅ Good - Performance optimized component
const ExpensiveComponent = React.memo(function ExpensiveComponent({ 
  data, 
  onUpdate 
}: Props) {
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransformation(item));
  }, [data]);

  const handleUpdate = useCallback((id: string) => {
    onUpdate(id);
  }, [onUpdate]);

  return (
    <div>
      {processedData.map(item => (
        <ItemComponent key={item.id} item={item} onUpdate={handleUpdate} />
      ))}
    </div>
  );
});
```

## Testing Review

### Test Coverage
- [ ] **Unit Tests**: Adequate unit test coverage (90%+)
- [ ] **Integration Tests**: Key integration points tested
- [ ] **Component Tests**: React components tested with React Testing Library
- [ ] **Edge Cases**: Edge cases and error scenarios covered
- [ ] **Test Quality**: Tests are meaningful and not just for coverage

### Test Implementation
- [ ] **Test Structure**: Tests follow Arrange-Act-Assert pattern
- [ ] **Test Names**: Descriptive test names explain what is being tested
- [ ] **Mocking**: Appropriate mocking of external dependencies
- [ ] **Test Data**: Test data is realistic and comprehensive
- [ ] **Cleanup**: Proper test cleanup and isolation

```typescript
// ✅ Good - Well-structured test
describe('StudentService', () => {
  describe('createStudent', () => {
    it('should create student with valid data and return student object', async () => {
      // Arrange
      const validStudentData = {
        name: 'John Doe',
        email: 'john@example.com',
        organizationId: 'org-123'
      };
      const expectedStudent = { id: 'student-123', ...validStudentData };
      
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ 
          data: expectedStudent, 
          error: null 
        })
      });

      // Act
      const result = await studentService.createStudent(validStudentData);

      // Assert
      expect(result).toEqual(expectedStudent);
      expect(mockSupabase.from).toHaveBeenCalledWith('students');
    });

    it('should throw ValidationError when required fields are missing', async () => {
      // Arrange
      const invalidData = { email: 'invalid-email' };

      // Act & Assert
      await expect(studentService.createStudent(invalidData))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

## Accessibility Review

### WCAG 2.1 AA Compliance
- [ ] **Semantic HTML**: Proper semantic HTML elements used
- [ ] **ARIA Labels**: Appropriate ARIA labels and roles
- [ ] **Keyboard Navigation**: Full keyboard accessibility
- [ ] **Screen Reader**: Compatible with screen readers
- [ ] **Color Contrast**: Sufficient color contrast ratios
- [ ] **Focus Management**: Proper focus management

```typescript
// ✅ Good - Accessible form component
export function StudentForm({ onSubmit }: StudentFormProps) {
  return (
    <form onSubmit={onSubmit} role="form" aria-labelledby="form-title">
      <h2 id="form-title">Student Information</h2>
      
      <div className="form-group">
        <label htmlFor="student-name" className="required">
          Student Name
        </label>
        <input
          id="student-name"
          type="text"
          required
          aria-describedby="name-error"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <div id="name-error" role="alert" className="error-message">
            {errors.name}
          </div>
        )}
      </div>
    </form>
  );
}
```

## Database and API Review

### Database Changes
- [ ] **Migration Scripts**: Database migrations are included and tested
- [ ] **Backwards Compatibility**: Changes maintain backwards compatibility
- [ ] **Performance Impact**: Database changes don't negatively impact performance
- [ ] **Data Integrity**: Referential integrity and constraints maintained
- [ ] **Rollback Plan**: Migration rollback strategy defined

### API Design
- [ ] **RESTful Design**: API follows RESTful principles
- [ ] **Error Responses**: Consistent error response format
- [ ] **Status Codes**: Appropriate HTTP status codes used
- [ ] **Request/Response**: Clear request/response data structures
- [ ] **Rate Limiting**: Rate limiting implemented where appropriate

```typescript
// ✅ Good - Well-designed API endpoint
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const student = await studentService.getById(params.id);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ data: student });
  } catch (error) {
    logger.error('API Error', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
```

## Documentation Review

### Code Documentation
- [ ] **API Documentation**: API endpoints documented
- [ ] **Component Documentation**: Complex components documented
- [ ] **Function Documentation**: Public functions have JSDoc comments
- [ ] **README Updates**: README updated for new features
- [ ] **Change Documentation**: Significant changes documented

### User-Facing Changes
- [ ] **UI Changes**: Screenshots provided for UI changes  
- [ ] **Feature Documentation**: New features documented for users
- [ ] **Migration Guide**: Breaking changes include migration guide
- [ ] **Release Notes**: Changes suitable for release notes

## Review Comments Guidelines

### Providing Feedback

#### Comment Types
- **🔴 Critical**: Must be fixed before merge
- **🟡 Suggestion**: Should be considered, but not blocking
- **🔵 Question**: Seeking clarification or discussion
- **🟢 Praise**: Acknowledging good practices

#### Comment Examples

```markdown
🔴 **Critical**: This function is vulnerable to SQL injection. Please use parameterized queries.

🟡 **Suggestion**: Consider extracting this logic into a custom hook for reusability.

🔵 **Question**: Why did you choose this approach over using the existing utility function?

🟢 **Praise**: Excellent error handling and user experience consideration!
```

### Receiving Feedback

#### Response Guidelines
- Address all critical comments before requesting re-review
- Respond to questions with clear explanations
- Consider suggestions thoughtfully
- Ask for clarification if feedback is unclear
- Thank reviewers for their time and insights

## Review Approval Criteria

### Minimum Requirements for Approval

- [ ] **All CI Checks Pass**: Automated tests and quality checks pass
- [ ] **Critical Issues Resolved**: All critical review comments addressed
- [ ] **Security Review Complete**: No security vulnerabilities identified
- [ ] **Performance Acceptable**: No significant performance regressions
- [ ] **Documentation Updated**: Relevant documentation updated

### Special Cases

#### Hotfix Reviews
- Expedited review process
- Focus on security and functionality
- Documentation can be updated post-merge

#### Large Feature Reviews
- May require multiple reviewers
- Consider breaking into smaller PRs
- Additional testing may be required

#### Dependency Updates
- Focus on security implications
- Check for breaking changes
- Verify automated tests still pass

## Review Tools and Automation

### GitHub Integration
- Use GitHub's review features effectively
- Request changes vs. approve appropriately
- Use suggested changes feature for small fixes
- Link relevant issues and documentation

### Automated Checks
- ESLint and Prettier violations block merge
- Test coverage requirements enforced
- Security scans must pass
- Performance budgets respected

## Continuous Improvement

### Review Metrics
- Track review turnaround time
- Monitor review quality and effectiveness
- Measure defect rate post-review
- Collect team feedback on process

### Process Updates
- Regular review of checklist effectiveness
- Updates based on lessons learned
- Training on new tools and techniques
- Documentation of best practices

### Team Development
- Code review training sessions
- Pair programming for complex features
- Knowledge sharing of domain expertise
- Mentoring junior developers through reviews

## Common Review Pitfalls

### What to Avoid
- ❌ Nitpicking on personal style preferences
- ❌ Approving without thorough review
- ❌ Focusing only on syntax rather than logic
- ❌ Being unclear or confrontational in comments
- ❌ Reviewing too many PRs at once

### What to Focus On
- ✅ Code correctness and logic
- ✅ Security implications
- ✅ Performance impact
- ✅ Maintainability and readability
- ✅ Consistency with project standards

Remember: Code reviews are a collaborative effort to improve code quality and share knowledge. Approach them with a positive, constructive mindset focused on building great software together.