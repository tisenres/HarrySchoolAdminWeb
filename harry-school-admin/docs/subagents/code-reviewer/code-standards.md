# Code Standards and Conventions

## Overview

This document outlines the comprehensive coding standards and conventions for the Harry School CRM project. These standards ensure consistency, maintainability, and quality across the entire codebase.

## TypeScript Standards

### Type Safety Requirements

- **Strict Mode**: Always use TypeScript strict mode with all strict flags enabled
- **No Any Types**: Avoid `any` type usage; use `unknown` for generic types
- **Explicit Return Types**: All functions should have explicit return type annotations
- **Null Safety**: Use strict null checks and optional chaining
- **Type Guards**: Implement proper type guards for runtime type checking

```typescript
// ✅ Good - Explicit return type and null safety
function getUserName(user: User | null): string | null {
  return user?.name ?? null;
}

// ❌ Bad - Using any and missing return type
function getUserName(user: any) {
  return user.name;
}
```

### Interface and Type Definitions

- **Interfaces vs Types**: Use interfaces for object shapes, types for unions/intersections
- **Naming**: Use PascalCase for interfaces and types
- **Exports**: Export all types and interfaces that are used across modules
- **Generic Constraints**: Use proper generic constraints

```typescript
// ✅ Good - Proper interface definition
interface StudentProfile {
  readonly id: string;
  name: string;
  email: string;
  enrollmentDate: Date;
  status: StudentStatus;
}

// ✅ Good - Type for unions
type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended';

// ✅ Good - Generic with constraints
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  create(entity: Omit<T, 'id'>): Promise<T>;
}
```

## React Component Standards

### Component Structure

- **Functional Components**: Use functional components with hooks
- **Component Naming**: Use PascalCase for component names
- **File Naming**: Use kebab-case for file names, PascalCase for component files
- **Props Interface**: Always define props interface for components

```typescript
// ✅ Good - Proper component structure
interface StudentCardProps {
  student: Student;
  onEdit?: (student: Student) => void;
  onDelete?: (studentId: string) => void;
  className?: string;
}

export function StudentCard({ 
  student, 
  onEdit, 
  onDelete, 
  className 
}: StudentCardProps): JSX.Element {
  // Component implementation
}
```

### Hook Usage

- **Custom Hooks**: Extract complex logic into custom hooks
- **Hook Naming**: Use `use` prefix for custom hooks
- **Dependency Arrays**: Always include all dependencies in useEffect
- **Cleanup**: Always cleanup side effects

```typescript
// ✅ Good - Custom hook with proper cleanup
function useStudentData(studentId: string) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStudent = async () => {
      try {
        setLoading(true);
        const data = await studentService.getById(studentId);
        if (!cancelled) {
          setStudent(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchStudent();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return { student, loading, error };
}
```

## File Organization Standards

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── [locale]/          # Internationalized routes
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── admin/            # Admin-specific components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── supabase.ts       # Supabase client
│   └── validations.ts    # Zod schemas
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── utils/                # Pure utility functions
└── constants/            # Application constants
```

### File Naming Conventions

- **Components**: PascalCase (`StudentCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useStudentData.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: camelCase (`student.types.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

### Import Organization

```typescript
// 1. React and Next.js imports
import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';

// 2. Third-party library imports
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';

// 3. Internal imports (absolute paths)
import { Button } from '@/components/ui/button';
import { StudentCard } from '@/components/admin/student-card';
import { useStudentData } from '@/hooks/use-student-data';
import { studentSchema } from '@/lib/validations';

// 4. Relative imports
import './student-page.styles.css';
```

## API and Data Handling Standards

### Error Handling

- **Consistent Error Types**: Use consistent error interfaces
- **Error Boundaries**: Implement error boundaries for component error handling
- **API Error Handling**: Standardize API error responses

```typescript
// ✅ Good - Consistent error handling
interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

async function fetchStudents(): Promise<Student[]> {
  try {
    const response = await supabase
      .from('students')
      .select('*')
      .eq('organization_id', organizationId);

    if (response.error) {
      throw new ApiError({
        message: response.error.message,
        code: 'FETCH_STUDENTS_ERROR',
        details: response.error,
      });
    }

    return response.data;
  } catch (error) {
    logger.error('Failed to fetch students', error);
    throw error;
  }
}
```

### Form Validation

- **Zod Schemas**: Use Zod for all form validation
- **Client-Side Validation**: Validate on both client and server
- **Error Messages**: Provide clear, internationalized error messages

```typescript
// ✅ Good - Zod schema with proper validation
const studentSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Invalid email address')
    .optional(),
  phone: z.string()
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
    .optional(),
  birthDate: z.date()
    .max(new Date(), 'Birth date cannot be in the future')
    .optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;
```

## Performance Standards

### Code Splitting

- **Dynamic Imports**: Use dynamic imports for large components
- **Route-Based Splitting**: Implement route-based code splitting
- **Component Lazy Loading**: Lazy load components below the fold

```typescript
// ✅ Good - Dynamic import for heavy components
const StudentReportGenerator = dynamic(
  () => import('./student-report-generator'),
  {
    loading: () => <ReportLoadingSkeleton />,
    ssr: false,
  }
);
```

### Memoization

- **React.memo**: Use React.memo for expensive components
- **useMemo**: Use useMemo for expensive calculations
- **useCallback**: Use useCallback for stable function references

```typescript
// ✅ Good - Proper memoization
const StudentList = React.memo(function StudentList({ 
  students, 
  onStudentSelect 
}: StudentListProps) {
  const sortedStudents = useMemo(() => {
    return students.sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const handleStudentClick = useCallback((student: Student) => {
    onStudentSelect(student);
  }, [onStudentSelect]);

  return (
    <div>
      {sortedStudents.map(student => (
        <StudentCard
          key={student.id}
          student={student}
          onClick={handleStudentClick}
        />
      ))}
    </div>
  );
});
```

## Testing Standards

### Unit Tests

- **Test Coverage**: Maintain 90%+ test coverage
- **Test Structure**: Use Arrange-Act-Assert pattern
- **Mock External Dependencies**: Mock all external services
- **Test Names**: Use descriptive test names

```typescript
// ✅ Good - Comprehensive unit test
describe('StudentService', () => {
  describe('createStudent', () => {
    it('should create a student with valid data', async () => {
      // Arrange
      const studentData = {
        name: 'John Doe',
        email: 'john@example.com',
        organizationId: 'org-123',
      };
      
      const mockResponse = { id: 'student-123', ...studentData };
      jest.mocked(supabase.from).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: mockResponse, error: null }),
      } as any);

      // Act
      const result = await studentService.createStudent(studentData);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(supabase.from).toHaveBeenCalledWith('students');
    });

    it('should throw error when creation fails', async () => {
      // Arrange
      const studentData = { name: 'John Doe' };
      const mockError = { message: 'Creation failed' };
      
      jest.mocked(supabase.from).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      } as any);

      // Act & Assert
      await expect(studentService.createStudent(studentData))
        .rejects.toThrow('Creation failed');
    });
  });
});
```

## Security Standards

### Data Validation

- **Input Sanitization**: Sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Escape all user-generated content

### Authentication

- **JWT Handling**: Secure JWT token storage and validation
- **Role-Based Access**: Implement proper role-based access control
- **Session Management**: Proper session timeout and cleanup

```typescript
// ✅ Good - Secure API endpoint
export async function POST(request: Request) {
  try {
    // Validate authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate permissions
    if (!hasPermission(user, 'students:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate and sanitize input
    const body = await request.json();
    const validatedData = studentSchema.parse(body);

    // Process request
    const student = await studentService.createStudent(validatedData);
    
    return NextResponse.json(student);
  } catch (error) {
    logger.error('API Error', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
```

## Accessibility Standards

### WCAG 2.1 AA Compliance

- **Semantic HTML**: Use proper semantic HTML elements
- **ARIA Labels**: Provide ARIA labels for complex components
- **Keyboard Navigation**: Ensure full keyboard accessibility
- **Color Contrast**: Maintain proper color contrast ratios

```typescript
// ✅ Good - Accessible form component
export function StudentForm({ onSubmit }: StudentFormProps) {
  return (
    <form onSubmit={onSubmit} role="form" aria-labelledby="student-form-title">
      <h2 id="student-form-title">Add New Student</h2>
      
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

## Documentation Standards

### Code Comments

- **JSDoc**: Use JSDoc for all public functions and classes
- **Inline Comments**: Explain complex business logic
- **TODO Comments**: Format TODO comments consistently

```typescript
/**
 * Creates a new student in the system
 * @param studentData - The student data to create
 * @param organizationId - The organization ID for the student
 * @returns Promise resolving to the created student
 * @throws ApiError when creation fails
 */
async function createStudent(
  studentData: CreateStudentData,
  organizationId: string
): Promise<Student> {
  // TODO: Add student verification process
  // Validate required fields before creation
  const validation = await validateStudentData(studentData);
  
  if (!validation.isValid) {
    throw new ValidationError(validation.errors);
  }

  return await studentRepository.create({
    ...studentData,
    organizationId,
    createdAt: new Date(),
  });
}
```

## Enforcement

These standards are enforced through:

1. **ESLint Configuration**: Automated linting rules
2. **TypeScript Strict Mode**: Compile-time type checking
3. **Prettier**: Automated code formatting
4. **Pre-commit Hooks**: Quality checks before commits
5. **CI/CD Pipeline**: Automated quality gates
6. **Code Reviews**: Manual review process

Violations of these standards should be addressed immediately and may block pull request approval.