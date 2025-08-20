// Authentication Components
export {
  AuthGuard,
  StudentGuard,
  TeacherGuard,
  AdminGuard,
  BiometricGuard,
  TrustedDeviceGuard,
} from './AuthGuard';

export {
  SignInScreen,
  BiometricSetupScreen,
} from './auth';

// Re-export types
export type { AuthGuardProps } from './AuthGuard';