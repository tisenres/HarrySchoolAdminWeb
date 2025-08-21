/**
 * Deep Linking Service for Harry School Student App
 * 
 * Provides secure, age-appropriate deep linking with authentication-first approach
 * Based on comprehensive mobile architecture research and cultural integration
 */

import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';

export interface DeepLinkConfig {
  url: string;
  studentAge: number;
  authenticationStatus: 'authenticated' | 'unauthenticated' | 'pending';
  parentalSettings: ParentalSettings;
}

export interface ParentalSettings {
  oversightRequired: boolean;
  familyNotifications: boolean;
  restrictedFeatures: string[];
  approvedTeachers: string[];
}

export interface DeepLinkRoute {
  pattern: string;
  component: string;
  authentication: 'required' | 'optional' | 'none';
  ageGating: 'none' | 'enrollmentValidation' | 'parentalOversight' | 'progressiveAccess' | 'parentalApprovalForPayment';
  parentalOversight: boolean;
}

export interface DeepLinkResult {
  success: boolean;
  error?: string;
  action?: 'redirect_to_login' | 'show_age_restriction_dialog' | 'request_parental_approval' | 'show_navigation_error';
  route?: string;
  params?: any;
  metadata?: any;
}

export interface SecurityContext {
  age: number;
  authentication: {
    sessionId: string;
    userId: string;
    role: string;
  };
  parentalSettings: ParentalSettings;
  previousContext?: any;
}

class DeepLinkingService {
  private navigationRef: NavigationContainerRef<any> | null = null;
  private routes: DeepLinkRoute[] = [
    {
      pattern: 'harryschool://schedule/:view?/:date?',
      component: 'CalendarScreen',
      authentication: 'required',
      ageGating: 'none',
      parentalOversight: false
    },
    {
      pattern: 'harryschool://class/:classId/:action?',
      component: 'ClassDetailScreen',
      authentication: 'required',
      ageGating: 'enrollmentValidation',
      parentalOversight: false
    },
    {
      pattern: 'harryschool://profile/:section?',
      component: 'ProfileScreen',
      authentication: 'required',
      ageGating: 'parentalOversight',
      parentalOversight: true
    },
    {
      pattern: 'harryschool://settings/:category?',
      component: 'SettingsScreen',
      authentication: 'required',
      ageGating: 'progressiveAccess',
      parentalOversight: true
    },
    {
      pattern: 'harryschool://request/:type/:action?',
      component: 'RequestScreen',
      authentication: 'required',
      ageGating: 'parentalApprovalForPayment',
      parentalOversight: true
    }
  ];

  /**
   * Initialize deep linking service with navigation reference
   */
  setNavigationRef(navigationRef: NavigationContainerRef<any>) {
    this.navigationRef = navigationRef;
  }

  /**
   * Handle incoming deep link with comprehensive security validation
   */
  async handleDeepLink(config: DeepLinkConfig): Promise<DeepLinkResult> {
    const { url, studentAge, authenticationStatus, parentalSettings } = config;
    
    try {
      // Step 1: Parse and validate URL
      const parsedUrl = this.parseUrl(url);
      if (!parsedUrl) {
        return { success: false, error: 'Invalid URL format' };
      }
      
      // Step 2: Find matching route
      const route = this.findMatchingRoute(parsedUrl.pathname);
      if (!route) {
        return { success: false, error: 'Route not found' };
      }
      
      // Step 3: Authentication validation
      const authValidation = await this.validateAuthentication(
        authenticationStatus, 
        route.authentication
      );
      if (!authValidation.valid) {
        return { 
          success: false, 
          error: 'Authentication required',
          action: 'redirect_to_login'
        };
      }
      
      // Step 4: Age-appropriate access control
      const ageValidation = await this.validateAgePermissions(
        route, 
        studentAge, 
        parsedUrl.params
      );
      if (!ageValidation.valid) {
        return {
          success: false,
          error: ageValidation.reason,
          action: 'show_age_restriction_dialog'
        };
      }
      
      // Step 5: Parental oversight check
      if (route.parentalOversight) {
        const parentalValidation = await this.validateParentalApproval(
          route,
          studentAge,
          parentalSettings,
          parsedUrl.params
        );
        
        if (!parentalValidation.valid) {
          return {
            success: false,
            error: 'Parental approval required',
            action: 'request_parental_approval',
            metadata: parentalValidation.metadata
          };
        }
      }
      
      // Step 6: Context preservation
      const currentContext = await this.preserveCurrentContext();
      
      // Step 7: Navigation with security context
      const navigationResult = await this.navigateSecurely(
        route,
        parsedUrl.params,
        {
          age: studentAge,
          authentication: authValidation.context,
          parentalSettings,
          previousContext: currentContext
        }
      );
      
      return navigationResult;
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        action: 'show_navigation_error'
      };
    }
  }

  /**
   * Parse URL and extract components
   */
  private parseUrl(url: string): { pathname: string; params: any; query: any } | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      // Extract parameters based on route patterns
      const params: any = {};
      const query: any = {};
      
      // Parse query parameters
      urlObj.searchParams.forEach((value, key) => {
        query[key] = value;
      });
      
      return {
        pathname: urlObj.pathname,
        params: this.extractRouteParams(urlObj.pathname),
        query
      };
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  }

  /**
   * Find matching route for pathname
   */
  private findMatchingRoute(pathname: string): DeepLinkRoute | null {
    for (const route of this.routes) {
      if (this.matchesPattern(pathname, route.pattern)) {
        return route;
      }
    }
    return null;
  }

  /**
   * Check if pathname matches route pattern
   */
  private matchesPattern(pathname: string, pattern: string): boolean {
    // Convert pattern to regex (simplified implementation)
    const regexPattern = pattern
      .replace(/:[^\/]+\?/g, '([^/]*)?') // Optional parameters
      .replace(/:[^\/]+/g, '([^/]+)') // Required parameters
      .replace(/\//g, '\\/'); // Escape slashes
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(pathname);
  }

  /**
   * Extract route parameters from pathname
   */
  private extractRouteParams(pathname: string): any {
    const parts = pathname.split('/').filter(Boolean);
    const params: any = {};
    
    // Simple parameter extraction (in real implementation, this would be more sophisticated)
    if (parts.length >= 2) {
      switch (parts[0]) {
        case 'schedule':
          params.view = parts[1] || 'month';
          params.date = parts[2] || new Date().toISOString().split('T')[0];
          break;
        case 'class':
          params.classId = parts[1];
          params.action = parts[2] || 'view';
          break;
        case 'profile':
          params.section = parts[1] || 'overview';
          break;
        case 'settings':
          params.category = parts[1] || 'general';
          break;
        case 'request':
          params.type = parts[1];
          params.action = parts[2] || 'create';
          break;
      }
    }
    
    return params;
  }

  /**
   * Validate authentication requirements
   */
  private async validateAuthentication(
    authStatus: string,
    requirement: string
  ): Promise<{ valid: boolean; context?: any }> {
    if (requirement === 'none') {
      return { valid: true };
    }
    
    if (requirement === 'optional') {
      return { 
        valid: true, 
        context: authStatus === 'authenticated' ? await this.getAuthContext() : null 
      };
    }
    
    if (requirement === 'required') {
      if (authStatus !== 'authenticated') {
        return { valid: false };
      }
      
      const context = await this.getAuthContext();
      return { valid: true, context };
    }
    
    return { valid: false };
  }

  /**
   * Get current authentication context
   */
  private async getAuthContext(): Promise<any> {
    // In real implementation, this would get actual auth context
    return {
      sessionId: 'mock-session-id',
      userId: 'mock-user-id',
      role: 'student'
    };
  }

  /**
   * Validate age-specific permissions
   */
  private async validateAgePermissions(
    route: DeepLinkRoute,
    studentAge: number,
    params: any
  ): Promise<{ valid: boolean; reason?: string }> {
    
    switch (route.ageGating) {
      case 'none':
        return { valid: true };
        
      case 'enrollmentValidation':
        // Check if student is enrolled in the class
        const classId = params.classId;
        const isEnrolled = await this.checkClassEnrollment(classId, studentAge);
        return {
          valid: isEnrolled,
          reason: isEnrolled ? undefined : 'Not enrolled in this class'
        };
        
      case 'parentalOversight':
        // Elementary students need parental oversight for profile access
        if (studentAge <= 12) {
          const hasParentalSession = await this.checkParentalSession();
          return {
            valid: hasParentalSession,
            reason: hasParentalSession ? undefined : 'Parental supervision required'
          };
        }
        return { valid: true };
        
      case 'progressiveAccess':
        // Settings access becomes more granular with age
        const category = params.category;
        const hasAccess = await this.checkCategoryAccess(category, studentAge);
        return {
          valid: hasAccess,
          reason: hasAccess ? undefined : `${category} settings not available for your age`
        };
        
      case 'parentalApprovalForPayment':
        // Payment-related requests need parental approval
        const requestType = params.type;
        const needsApproval = await this.checkPaymentApprovalRequired(requestType, studentAge);
        if (needsApproval && studentAge <= 15) {
          const hasApproval = await this.checkParentalPaymentApproval(requestType);
          return {
            valid: hasApproval,
            reason: hasApproval ? undefined : 'Parental approval required for payment requests'
          };
        }
        return { valid: true };
        
      default:
        return { valid: false, reason: 'Unknown age gating rule' };
    }
  }

  /**
   * Validate parental approval requirements
   */
  private async validateParentalApproval(
    route: DeepLinkRoute,
    studentAge: number,
    parentalSettings: ParentalSettings,
    params: any
  ): Promise<{ valid: boolean; metadata?: any }> {
    
    if (!route.parentalOversight) {
      return { valid: true };
    }
    
    // Check if parental oversight is required for this age
    if (studentAge > 15 && !parentalSettings.oversightRequired) {
      return { valid: true };
    }
    
    // Check specific approval requirements
    const requiresApproval = await this.checkSpecificParentalApproval(route, params);
    
    return {
      valid: !requiresApproval,
      metadata: requiresApproval ? {
        approvalType: route.component,
        requiredFor: params,
        contactParent: true
      } : undefined
    };
  }

  /**
   * Navigate securely with security context
   */
  private async navigateSecurely(
    route: DeepLinkRoute,
    params: any,
    context: SecurityContext
  ): Promise<DeepLinkResult> {
    
    if (!this.navigationRef) {
      return {
        success: false,
        error: 'Navigation not initialized',
        action: 'show_navigation_error'
      };
    }
    
    try {
      // Security logging
      await this.logSecureNavigation(route, params, context);
      
      // Add security headers to navigation params
      const secureParams = {
        ...params,
        __security: {
          ageValidated: true,
          authValidated: true,
          timestamp: Date.now(),
          sessionId: context.authentication.sessionId
        }
      };
      
      // Navigate with React Navigation
      switch (route.component) {
        case 'CalendarScreen':
          this.navigationRef.navigate('Schedule', {
            screen: 'Calendar',
            params: secureParams
          });
          break;
          
        case 'ClassDetailScreen':
          this.navigationRef.navigate('Schedule', {
            screen: 'ClassDetail',
            params: secureParams
          });
          break;
          
        case 'ProfileScreen':
          this.navigationRef.navigate('Profile', {
            screen: 'ProfileMain',
            params: secureParams
          });
          break;
          
        case 'SettingsScreen':
          this.navigationRef.navigate('Profile', {
            screen: 'Settings',
            params: secureParams
          });
          break;
          
        case 'RequestScreen':
          this.navigationRef.navigate('Requests', {
            screen: 'RequestForm',
            params: secureParams
          });
          break;
          
        default:
          throw new Error(`Unknown component: ${route.component}`);
      }
      
      return { 
        success: true,
        route: route.component,
        params: secureParams
      };
      
    } catch (error) {
      await this.logNavigationError(error, route, params);
      return {
        success: false,
        error: error.message,
        action: 'show_navigation_error'
      };
    }
  }

  /**
   * Helper methods for validation (mock implementations)
   */
  private async checkClassEnrollment(classId: string, studentAge: number): Promise<boolean> {
    // Mock implementation - in real app, this would check database
    return true;
  }

  private async checkParentalSession(): Promise<boolean> {
    // Mock implementation - check if parent is currently supervising
    return false;
  }

  private async checkCategoryAccess(category: string, studentAge: number): Promise<boolean> {
    // Age-appropriate settings access
    const restrictedForElementary = ['privacy', 'payments', 'advanced'];
    const restrictedForMiddleSchool = ['payments', 'advanced'];
    
    if (studentAge <= 12 && restrictedForElementary.includes(category)) {
      return false;
    }
    
    if (studentAge <= 15 && restrictedForMiddleSchool.includes(category)) {
      return false;
    }
    
    return true;
  }

  private async checkPaymentApprovalRequired(requestType: string, studentAge: number): Promise<boolean> {
    const paymentRequiredTypes = ['extra-lesson', 'tutoring', 'premium-content'];
    return paymentRequiredTypes.includes(requestType);
  }

  private async checkParentalPaymentApproval(requestType: string): Promise<boolean> {
    // Mock implementation - check if parent approved payment for this type
    return false;
  }

  private async checkSpecificParentalApproval(route: DeepLinkRoute, params: any): Promise<boolean> {
    // Mock implementation - check specific approval requirements
    return false;
  }

  private async preserveCurrentContext(): Promise<any> {
    // Save current navigation state for potential restoration
    return this.navigationRef?.getRootState();
  }

  private async logSecureNavigation(route: DeepLinkRoute, params: any, context: SecurityContext): Promise<void> {
    if (__DEV__) {
      console.log('🔒 Secure Navigation:', {
        route: route.component,
        params,
        age: context.age,
        sessionId: context.authentication.sessionId
      });
    }
  }

  private async logNavigationError(error: Error, route: DeepLinkRoute, params: any): Promise<void> {
    if (__DEV__) {
      console.error('❌ Navigation Error:', {
        error: error.message,
        route: route.component,
        params
      });
    }
  }

  /**
   * Get the current initial URL (for app launch deep links)
   */
  async getInitialURL(): Promise<string | null> {
    return await Linking.getInitialURL();
  }

  /**
   * Listen for incoming URLs while app is running
   */
  addLinkingListener(callback: (url: string) => void): () => void {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      callback(url);
    });
    
    return () => subscription?.remove();
  }
}

export const deepLinkingService = new DeepLinkingService();