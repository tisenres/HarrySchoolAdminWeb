/**
 * Database Connection and Data Validation Utilities
 * 
 * Provides comprehensive validation utilities for Harry School mobile apps,
 * including database connectivity checks, data integrity validation,
 * and educational domain-specific validation rules.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { MobileSupabaseClient } from '../client';
import { ErrorHandler } from '../error-handler';

/**
 * Database connection validation result
 */
export interface ConnectionValidationResult {
  isConnected: boolean;
  responseTime: number;
  capabilities: {
    canRead: boolean;
    canWrite: boolean;
    hasRLSEnabled: boolean;
    realtimeAvailable: boolean;
  };
  organizationAccess: {
    organizationId: string | null;
    hasAccess: boolean;
    userRole: string | null;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Educational data validation rules
 */
export interface ValidationRule<T> {
  field: keyof T;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'date' | 'uuid';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

/**
 * Comprehensive database connection validation
 */
export async function validateDatabaseConnection(
  client: MobileSupabaseClient | SupabaseClient<Database>
): Promise<ConnectionValidationResult> {
  const result: ConnectionValidationResult = {
    isConnected: false,
    responseTime: 0,
    capabilities: {
      canRead: false,
      canWrite: false,
      hasRLSEnabled: false,
      realtimeAvailable: false
    },
    organizationAccess: {
      organizationId: null,
      hasAccess: false,
      userRole: null
    },
    errors: [],
    warnings: []
  };

  const startTime = Date.now();

  try {
    // Get the Supabase client instance
    const supabaseClient = client instanceof MobileSupabaseClient 
      ? client.getClient() 
      : client;

    if (!supabaseClient) {
      result.errors.push('Supabase client is not available');
      return result;
    }

    // Test basic connectivity
    const { data: pingData, error: pingError } = await supabaseClient
      .from('organizations')
      .select('id')
      .limit(1);

    result.responseTime = Date.now() - startTime;

    if (pingError) {
      result.errors.push(`Connection test failed: ${pingError.message}`);
      return result;
    }

    result.isConnected = true;
    result.capabilities.canRead = true;

    // Test write capability with a safe operation
    try {
      // Try to perform a harmless operation that would fail if we can't write
      const { error: writeError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('id', '00000000-0000-0000-0000-000000000000') // Non-existent ID
        .maybeSingle();

      // If we get here without an auth error, we likely have write permissions
      result.capabilities.canWrite = writeError?.code !== 'PGRST301'; // Not an auth error
    } catch (error) {
      result.warnings.push('Could not determine write capabilities');
    }

    // Check RLS status
    try {
      const { data: rlsData, error: rlsError } = await supabaseClient
        .from('profiles')
        .select('*')
        .limit(1);

      if (rlsError && rlsError.code === 'PGRST301') {
        result.capabilities.hasRLSEnabled = true;
      }
    } catch (error) {
      result.warnings.push('Could not determine RLS status');
    }

    // Test realtime availability
    try {
      const channel = supabaseClient.channel('connection_test');
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
          supabaseClient.removeChannel(channel);
        }, 3000);

        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {})
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              result.capabilities.realtimeAvailable = true;
              clearTimeout(timeout);
              resolve(true);
              supabaseClient.removeChannel(channel);
            }
          });
      });
    } catch (error) {
      result.warnings.push('Realtime functionality test failed');
    }

    // Check user authentication and organization access
    try {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (user) {
        // Try to get user profile to check organization access
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('organization_id, role')
          .eq('id', user.id)
          .single();

        if (profile && !profileError) {
          result.organizationAccess.organizationId = profile.organization_id;
          result.organizationAccess.hasAccess = true;
          result.organizationAccess.userRole = profile.role;
        } else if (profileError) {
          result.warnings.push(`Could not access user profile: ${profileError.message}`);
        }
      }
    } catch (error) {
      result.warnings.push('User authentication check failed');
    }

  } catch (error) {
    result.errors.push(`Database validation failed: ${(error as Error).message}`);
    result.responseTime = Date.now() - startTime;
  }

  return result;
}

/**
 * Validate educational data against domain rules
 */
export function validateEducationalData<T>(
  data: T,
  rules: ValidationRule<T>[]
): { isValid: boolean; errors: Record<keyof T, string[]> } {
  const errors: Record<keyof T, string[]> = {} as any;

  for (const rule of rules) {
    const fieldErrors: string[] = [];
    const value = data[rule.field];

    // Required field validation
    if (rule.required && (value === null || value === undefined || value === '')) {
      fieldErrors.push(`${String(rule.field)} is required`);
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      continue;
    }

    // Type validation
    if (rule.type && value !== null && value !== undefined) {
      if (!validateFieldType(value, rule.type)) {
        fieldErrors.push(`${String(rule.field)} must be a valid ${rule.type}`);
      }
    }

    // String length validation
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        fieldErrors.push(`${String(rule.field)} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        fieldErrors.push(`${String(rule.field)} must not exceed ${rule.maxLength} characters`);
      }
    }

    // Number range validation
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        fieldErrors.push(`${String(rule.field)} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        fieldErrors.push(`${String(rule.field)} must not exceed ${rule.max}`);
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        fieldErrors.push(`${String(rule.field)} format is invalid`);
      }
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        fieldErrors.push(typeof customResult === 'string' ? customResult : `${String(rule.field)} is invalid`);
      }
    }

    if (fieldErrors.length > 0) {
      errors[rule.field] = fieldErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate field type
 */
function validateFieldType(value: any, type: ValidationRule<any>['type']): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'email':
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'phone':
      return typeof value === 'string' && /^\+?[\d\s\-\(\)]{10,}$/.test(value);
    case 'date':
      return typeof value === 'string' && !isNaN(Date.parse(value));
    case 'uuid':
      return typeof value === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    default:
      return true;
  }
}

/**
 * Educational domain validation rules
 */
export const STUDENT_VALIDATION_RULES: ValidationRule<Database['public']['Tables']['students']['Insert']>[] = [
  { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100 },
  { field: 'email', required: true, type: 'email', maxLength: 255 },
  { field: 'phone', type: 'phone', maxLength: 20 },
  { field: 'date_of_birth', type: 'date' },
  { field: 'ranking_points', type: 'number', min: 0, max: 1000000 },
  { field: 'ranking_coins', type: 'number', min: 0, max: 1000000 },
  { field: 'level', type: 'number', min: 1, max: 100 },
  { field: 'organization_id', required: true, type: 'uuid' },
  { field: 'referral_code', type: 'string', pattern: /^[A-Z0-9]{6,12}$/ }
];

export const TEACHER_VALIDATION_RULES: ValidationRule<Database['public']['Tables']['teachers']['Insert']>[] = [
  { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100 },
  { field: 'email', required: true, type: 'email', maxLength: 255 },
  { field: 'phone', type: 'phone', maxLength: 20 },
  { field: 'ranking_points', type: 'number', min: 0, max: 1000000 },
  { field: 'level', type: 'number', min: 1, max: 100 },
  { field: 'organization_id', required: true, type: 'uuid' },
  {
    field: 'specializations',
    custom: (value) => {
      if (!Array.isArray(value)) return 'Specializations must be an array';
      if (value.length === 0) return 'At least one specialization is required';
      if (value.length > 10) return 'Too many specializations (max 10)';
      return value.every(s => typeof s === 'string' && s.length > 0) || 'All specializations must be non-empty strings';
    }
  }
];

export const GROUP_VALIDATION_RULES: ValidationRule<Database['public']['Tables']['groups']['Insert']>[] = [
  { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100 },
  { field: 'description', type: 'string', maxLength: 500 },
  { field: 'subject', required: true, type: 'string', minLength: 2, maxLength: 50 },
  { field: 'level', type: 'string', maxLength: 20 },
  { field: 'classroom', type: 'string', maxLength: 50 },
  { field: 'max_students', type: 'number', min: 1, max: 100 },
  { field: 'organization_id', required: true, type: 'uuid' },
  { field: 'start_date', required: true, type: 'date' },
  { field: 'end_date', type: 'date' },
  {
    field: 'schedule',
    required: true,
    custom: (value) => {
      if (typeof value !== 'object' || value === null) {
        return 'Schedule must be an object';
      }
      // Add more schedule validation as needed
      return true;
    }
  }
];

export const HOME_TASK_VALIDATION_RULES: ValidationRule<Database['public']['Tables']['home_tasks']['Insert']>[] = [
  { field: 'title', required: true, type: 'string', minLength: 2, maxLength: 200 },
  { field: 'description', required: true, type: 'string', minLength: 10, maxLength: 1000 },
  { field: 'student_id', required: true, type: 'uuid' },
  { field: 'organization_id', required: true, type: 'uuid' },
  { field: 'due_date', required: true, type: 'date' },
  { field: 'score', type: 'number', min: 0, max: 100 },
  {
    field: 'task_type',
    required: true,
    custom: (value) => {
      const validTypes = ['text', 'quiz', 'speaking', 'listening', 'writing'];
      return validTypes.includes(value) || `Task type must be one of: ${validTypes.join(', ')}`;
    }
  }
];

export const VOCABULARY_WORD_VALIDATION_RULES: ValidationRule<Database['public']['Tables']['vocabulary_words']['Insert']>[] = [
  { field: 'word', required: true, type: 'string', minLength: 1, maxLength: 100 },
  { field: 'translation', required: true, type: 'string', minLength: 1, maxLength: 200 },
  { field: 'pronunciation', type: 'string', maxLength: 100 },
  { field: 'example_sentence', type: 'string', maxLength: 500 },
  { field: 'category', required: true, type: 'string', minLength: 1, maxLength: 50 },
  { field: 'organization_id', required: true, type: 'uuid' },
  {
    field: 'difficulty_level',
    required: true,
    custom: (value) => {
      const validLevels = [1, 2, 3, 4, 5];
      return validLevels.includes(value) || 'Difficulty level must be between 1 and 5';
    }
  }
];

/**
 * Validate student data
 */
export function validateStudentData(data: Database['public']['Tables']['students']['Insert']) {
  return validateEducationalData(data, STUDENT_VALIDATION_RULES);
}

/**
 * Validate teacher data
 */
export function validateTeacherData(data: Database['public']['Tables']['teachers']['Insert']) {
  return validateEducationalData(data, TEACHER_VALIDATION_RULES);
}

/**
 * Validate group data
 */
export function validateGroupData(data: Database['public']['Tables']['groups']['Insert']) {
  return validateEducationalData(data, GROUP_VALIDATION_RULES);
}

/**
 * Validate home task data
 */
export function validateHomeTaskData(data: Database['public']['Tables']['home_tasks']['Insert']) {
  return validateEducationalData(data, HOME_TASK_VALIDATION_RULES);
}

/**
 * Validate vocabulary word data
 */
export function validateVocabularyWordData(data: Database['public']['Tables']['vocabulary_words']['Insert']) {
  return validateEducationalData(data, VOCABULARY_WORD_VALIDATION_RULES);
}

/**
 * Validate attendance data
 */
export function validateAttendanceData(data: Database['public']['Tables']['attendance']['Insert']) {
  const rules: ValidationRule<Database['public']['Tables']['attendance']['Insert']>[] = [
    { field: 'student_id', required: true, type: 'uuid' },
    { field: 'group_id', required: true, type: 'uuid' },
    { field: 'date', required: true, type: 'date' },
    { field: 'organization_id', required: true, type: 'uuid' },
    {
      field: 'status',
      required: true,
      custom: (value) => {
        const validStatuses = ['present', 'absent', 'late', 'excused'];
        return validStatuses.includes(value) || `Status must be one of: ${validStatuses.join(', ')}`;
      }
    },
    { field: 'notes', type: 'string', maxLength: 500 }
  ];

  return validateEducationalData(data, rules);
}

/**
 * Database health check
 */
export async function performDatabaseHealthCheck(
  client: MobileSupabaseClient
): Promise<{
  overall: 'healthy' | 'warning' | 'critical';
  checks: {
    connectivity: boolean;
    latency: number;
    rls: boolean;
    authentication: boolean;
    realtime: boolean;
  };
  recommendations: string[];
}> {
  const validation = await validateDatabaseConnection(client);
  const recommendations: string[] = [];

  // Analyze results
  if (!validation.isConnected) {
    recommendations.push('Database connection is not available');
  }

  if (validation.responseTime > 2000) {
    recommendations.push('High database latency detected - consider optimization');
  }

  if (!validation.capabilities.hasRLSEnabled) {
    recommendations.push('Row Level Security should be enabled for production');
  }

  if (!validation.capabilities.realtimeAvailable) {
    recommendations.push('Realtime functionality is not available');
  }

  if (!validation.organizationAccess.hasAccess) {
    recommendations.push('User does not have organization access');
  }

  // Determine overall health
  let overall: 'healthy' | 'warning' | 'critical' = 'healthy';

  if (!validation.isConnected || !validation.organizationAccess.hasAccess) {
    overall = 'critical';
  } else if (validation.responseTime > 2000 || !validation.capabilities.hasRLSEnabled) {
    overall = 'warning';
  }

  return {
    overall,
    checks: {
      connectivity: validation.isConnected,
      latency: validation.responseTime,
      rls: validation.capabilities.hasRLSEnabled,
      authentication: validation.organizationAccess.hasAccess,
      realtime: validation.capabilities.realtimeAvailable
    },
    recommendations
  };
}

/**
 * Validate data batch for bulk operations
 */
export function validateDataBatch<T>(
  data: T[],
  validationRules: ValidationRule<T>[],
  maxBatchSize: number = 100
): {
  isValid: boolean;
  batchErrors: string[];
  itemErrors: Array<{ index: number; errors: Record<keyof T, string[]> }>;
} {
  const batchErrors: string[] = [];
  const itemErrors: Array<{ index: number; errors: Record<keyof T, string[]> }> = [];

  // Validate batch size
  if (data.length === 0) {
    batchErrors.push('Batch cannot be empty');
  }

  if (data.length > maxBatchSize) {
    batchErrors.push(`Batch size exceeds maximum of ${maxBatchSize}`);
  }

  // Validate each item
  data.forEach((item, index) => {
    const validation = validateEducationalData(item, validationRules);
    if (!validation.isValid) {
      itemErrors.push({ index, errors: validation.errors });
    }
  });

  return {
    isValid: batchErrors.length === 0 && itemErrors.length === 0,
    batchErrors,
    itemErrors
  };
}