/**
 * Navigation Service for Harry School Student App
 * 
 * Centralized navigation utilities for programmatic navigation
 * and deep linking integration
 */

import { NavigationContainerRef, StackActions, TabActions } from '@react-navigation/native';
import { createRef } from 'react';

// Create a ref for the navigation container
export const navigationRef = createRef<NavigationContainerRef<any>>();

class NavigationService {
  /**
   * Navigate to a specific route
   */
  navigate(name: string, params?: any): void {
    if (this.isReady()) {
      navigationRef.current?.navigate(name, params);
    } else {
      console.warn('🚨 Navigation not ready yet');
    }
  }

  /**
   * Go back in navigation stack
   */
  goBack(): void {
    if (this.isReady() && this.canGoBack()) {
      navigationRef.current?.goBack();
    }
  }

  /**
   * Reset navigation stack to specific route
   */
  reset(routeName: string, params?: any): void {
    if (this.isReady()) {
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: routeName, params }],
      });
    }
  }

  /**
   * Push a new screen onto the stack
   */
  push(name: string, params?: any): void {
    if (this.isReady()) {
      navigationRef.current?.dispatch(StackActions.push(name, params));
    }
  }

  /**
   * Replace current screen
   */
  replace(name: string, params?: any): void {
    if (this.isReady()) {
      navigationRef.current?.dispatch(StackActions.replace(name, params));
    }
  }

  /**
   * Jump to specific tab
   */
  jumpToTab(tabName: string, params?: any): void {
    if (this.isReady()) {
      navigationRef.current?.dispatch(TabActions.jumpTo(tabName, params));
    }
  }

  /**
   * Navigate to Schedule with specific view
   */
  navigateToSchedule(view?: 'calendar' | 'weekly' | 'agenda', date?: string): void {
    this.navigate('Schedule', {
      screen: 'Calendar',
      params: { view, date }
    });
  }

  /**
   * Navigate to specific class details
   */
  navigateToClass(classId: string, action?: 'view' | 'attendance' | 'homework'): void {
    this.navigate('Schedule', {
      screen: 'ClassDetail',
      params: { classId, action }
    });
  }

  /**
   * Navigate to Profile with specific section
   */
  navigateToProfile(section?: 'overview' | 'achievements' | 'settings'): void {
    this.navigate('Profile', {
      screen: 'ProfileMain',
      params: { section }
    });
  }

  /**
   * Navigate to Settings with specific category
   */
  navigateToSettings(category?: 'general' | 'privacy' | 'notifications' | 'appearance'): void {
    this.navigate('Profile', {
      screen: 'Settings',
      params: { category }
    });
  }

  /**
   * Navigate to Request screens
   */
  navigateToRequest(type: 'lesson' | 'homework' | 'tutoring', action?: 'create' | 'status'): void {
    this.navigate('Requests', {
      screen: 'RequestForm',
      params: { type, action }
    });
  }

  /**
   * Navigate to Vocabulary with specific mode
   */
  navigateToVocabulary(mode?: 'flashcards' | 'translator' | 'games'): void {
    this.navigate('Vocabulary', {
      screen: 'VocabularyMain',
      params: { mode }
    });
  }

  /**
   * Check if navigation is ready
   */
  isReady(): boolean {
    return navigationRef.current?.isReady() ?? false;
  }

  /**
   * Check if can go back
   */
  canGoBack(): boolean {
    return navigationRef.current?.canGoBack() ?? false;
  }

  /**
   * Get current route name
   */
  getCurrentRouteName(): string | undefined {
    if (!this.isReady()) return undefined;
    
    const state = navigationRef.current?.getRootState();
    if (!state) return undefined;
    
    return this.getActiveRouteName(state);
  }

  /**
   * Get active route name from state
   */
  private getActiveRouteName(state: any): string | undefined {
    const route = state.routes[state.index];
    
    if (route.state) {
      return this.getActiveRouteName(route.state);
    }
    
    return route.name;
  }

  /**
   * Get current route params
   */
  getCurrentParams(): any {
    if (!this.isReady()) return undefined;
    
    const state = navigationRef.current?.getRootState();
    if (!state) return undefined;
    
    return this.getActiveRouteParams(state);
  }

  /**
   * Get active route params from state
   */
  private getActiveRouteParams(state: any): any {
    const route = state.routes[state.index];
    
    if (route.state) {
      return this.getActiveRouteParams(route.state);
    }
    
    return route.params;
  }

  /**
   * Navigate with age-appropriate validation
   */
  navigateWithAgeValidation(
    routeName: string, 
    params: any, 
    studentAge: number
  ): boolean {
    // Age validation logic
    const ageRestrictedRoutes = {
      'advanced-settings': 16,
      'payment-settings': 15,
      'privacy-advanced': 13,
      'peer-messaging': 13
    };

    const requiredAge = ageRestrictedRoutes[routeName as keyof typeof ageRestrictedRoutes];
    
    if (requiredAge && studentAge < requiredAge) {
      console.warn(`🚨 Age restriction: ${routeName} requires age ${requiredAge}, student is ${studentAge}`);
      return false;
    }

    this.navigate(routeName, params);
    return true;
  }

  /**
   * Navigate with cultural context
   */
  navigateWithCulturalContext(
    routeName: string,
    params: any,
    culturalPreferences: {
      language: 'en' | 'ru' | 'uz';
      islamicGreetings: boolean;
      prayerTimeAware: boolean;
    }
  ): void {
    const enhancedParams = {
      ...params,
      culturalContext: culturalPreferences
    };

    this.navigate(routeName, enhancedParams);
  }

  /**
   * Deep link navigation with security validation
   */
  handleSecureDeepLink(
    url: string,
    securityContext: {
      authenticated: boolean;
      ageValidated: boolean;
      parentalApproval?: boolean;
    }
  ): boolean {
    if (!securityContext.authenticated) {
      console.warn('🚨 Deep link blocked: Authentication required');
      this.navigate('Auth');
      return false;
    }

    if (!securityContext.ageValidated) {
      console.warn('🚨 Deep link blocked: Age validation failed');
      return false;
    }

    // Process the deep link
    return this.processDeepLinkUrl(url);
  }

  /**
   * Process deep link URL
   */
  private processDeepLinkUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathSegments.length === 0) {
        this.navigate('Home');
        return true;
      }

      // Route based on first path segment
      switch (pathSegments[0]) {
        case 'schedule':
          this.navigateToSchedule(
            pathSegments[1] as any,
            pathSegments[2]
          );
          return true;
          
        case 'class':
          this.navigateToClass(
            pathSegments[1],
            pathSegments[2] as any
          );
          return true;
          
        case 'profile':
          this.navigateToProfile(pathSegments[1] as any);
          return true;
          
        case 'settings':
          this.navigateToSettings(pathSegments[1] as any);
          return true;
          
        case 'request':
          this.navigateToRequest(
            pathSegments[1] as any,
            pathSegments[2] as any
          );
          return true;
          
        case 'vocabulary':
          this.navigateToVocabulary(pathSegments[1] as any);
          return true;
          
        default:
          console.warn('🚨 Unknown deep link path:', pathSegments[0]);
          return false;
      }
    } catch (error) {
      console.error('🚨 Error processing deep link:', error);
      return false;
    }
  }

  /**
   * Log navigation events for analytics
   */
  logNavigation(routeName: string, params?: any): void {
    if (__DEV__) {
      console.log('📍 Navigation:', {
        route: routeName,
        params,
        timestamp: new Date().toISOString()
      });
    }
    
    // In production, send to analytics service
    // analytics.track('navigation', { route: routeName, params });
  }

  /**
   * Emergency navigation reset (for error recovery)
   */
  emergencyReset(): void {
    if (this.isReady()) {
      this.reset('MainTabs');
      console.log('🔄 Emergency navigation reset performed');
    }
  }
}

// Export singleton instance
export const navigationService = new NavigationService();