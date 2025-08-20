// Authentication Context
export {
  AuthProvider,
  useAuth,
  type AuthContextState,
  type AuthContextActions,
  type AuthContextValue,
  type AuthUser,
  type StudentProfile,
  type TeacherProfile,
  type SignInCredentials,
  type SignInWithBiometricOptions,
} from './AuthContext';

// Theme Context
export { ThemeContext, ThemeProvider, useThemeContext } from './ThemeContext';