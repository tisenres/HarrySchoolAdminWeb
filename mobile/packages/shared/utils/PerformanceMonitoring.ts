import * as Sentry from '@sentry/react-native';
import { InteractionManager, Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import Constants from 'expo-constants';

// Performance monitoring storage
const performanceStorage = new MMKV({
  id: 'performance-monitoring',
  encryptionKey: 'harry-school-performance',
});

// Performance monitoring configuration
interface PerformanceConfig {
  enableSentry: boolean;
  sampleRate: number;
  enableTracing: boolean;
  enableProfiling: boolean;
  enableUserFeedback: boolean;
  respectPrayerTime: boolean;
  culturalContext: 'normal' | 'prayer_time' | 'ramadan';
  userType: 'student' | 'teacher' | 'admin';
  enableCustomMetrics: boolean;
  enableEducationalTracking: boolean;
}

interface PerformanceMetrics {
  appStartTime: number;
  screenTransitionTimes: Map<string, number>;
  apiResponseTimes: Map<string, number>;
  bundleLoadTimes: Map<string, number>;
  memoryUsage: number[];
  crashCount: number;
  anrCount: number; // Application Not Responding
  cultureAwareMetrics: Map<string, any>;
}

const defaultConfig: PerformanceConfig = {
  enableSentry: true,
  sampleRate: 1.0, // Full sampling for educational app
  enableTracing: true,
  enableProfiling: true,
  enableUserFeedback: true,
  respectPrayerTime: true,
  culturalContext: 'normal',
  userType: 'student',
  enableCustomMetrics: true,
  enableEducationalTracking: true,
};

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private startTime: number;
  private sentryInitialized = false;
  private currentUser?: {
    id: string;
    type: 'student' | 'teacher' | 'admin';
    grade?: string;
    subject?: string;
  };

  private constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.startTime = Date.now();
    this.metrics = {
      appStartTime: 0,
      screenTransitionTimes: new Map(),
      apiResponseTimes: new Map(),
      bundleLoadTimes: new Map(),
      memoryUsage: [],
      crashCount: 0,
      anrCount: 0,
      cultureAwareMetrics: new Map(),
    };

    this.initializeSentry();
    this.setupPerformanceTracking();
  }

  static getInstance(config?: Partial<PerformanceConfig>): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService(config);
    }
    return PerformanceMonitoringService.instance;
  }

  private initializeSentry() {
    if (!this.config.enableSentry || this.sentryInitialized) return;

    try {
      Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        environment: __DEV__ ? 'development' : 'production',
        sampleRate: this.config.sampleRate,
        enableTracing: this.config.enableTracing,
        tracesSampleRate: this.config.enableTracing ? 1.0 : 0,
        enableProfiling: this.config.enableProfiling,
        profilesSampleRate: this.config.enableProfiling ? 1.0 : 0,
        enableUserInteractionTracing: true,
        enableNativeFramesTracking: true,
        enableStallTracking: true,
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000, // 30 seconds
        beforeSend: this.beforeSend.bind(this),
        beforeSendTransaction: this.beforeSendTransaction.bind(this),
        integrations: [
          new Sentry.ReactNativeTracing({
            enableUserInteractionTracing: true,
            enableNativeFramesTracking: true,
            enableStallTracking: true,
            // Custom routing instrumentation for educational screens
            routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
          }),
        ],
      });

      // Set app context
      Sentry.setContext('app', {
        type: 'educational',
        platform: Platform.OS,
        userType: this.config.userType,
        culturalContext: this.config.culturalContext,
        version: Constants.manifest?.version || '1.0.0',
      });

      this.sentryInitialized = true;
      console.log('Sentry initialized for educational app monitoring');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  private beforeSend(event: Sentry.Event, hint: Sentry.EventHint): Sentry.Event | null {
    // Filter out events during prayer time if requested
    if (this.config.respectPrayerTime && this.checkPrayerTime()) {
      // Only send critical errors during prayer time
      if (event.level !== 'fatal' && event.level !== 'error') {
        return null;
      }
    }

    // Add educational context
    if (event.contexts) {
      event.contexts.educational = {
        userType: this.config.userType,
        culturalContext: this.config.culturalContext,
        isPrayerTime: this.checkPrayerTime(),
        appSection: this.getCurrentAppSection(),
      };
    }

    return event;
  }

  private beforeSendTransaction(event: Sentry.Event): Sentry.Event | null {
    // Filter out transactions during prayer time for privacy
    if (this.config.respectPrayerTime && this.checkPrayerTime()) {
      return null;
    }

    return event;
  }

  // Educational context tracking
  setEducationalUser(user: {
    id: string;
    type: 'student' | 'teacher' | 'admin';
    grade?: string;
    subject?: string;
  }) {
    this.currentUser = user;
    this.config.userType = user.type;

    if (this.sentryInitialized) {
      Sentry.setUser({
        id: user.id,
        username: user.type,
        segment: user.type,
        data: {
          grade: user.grade,
          subject: user.subject,
        },
      });

      Sentry.setTag('user_type', user.type);
      if (user.grade) Sentry.setTag('grade', user.grade);
      if (user.subject) Sentry.setTag('subject', user.subject);
    }
  }

  // Screen performance tracking
  trackScreenTransition(screenName: string, startTime: number, endTime?: number) {
    const transitionTime = (endTime || Date.now()) - startTime;
    this.metrics.screenTransitionTimes.set(screenName, transitionTime);

    // Store for analysis
    performanceStorage.set(`screen-transition-${screenName}`, transitionTime);

    if (this.config.enableCustomMetrics && this.sentryInitialized) {
      Sentry.addBreadcrumb({
        message: `Screen transition: ${screenName}`,
        level: 'info',
        data: {
          duration: transitionTime,
          screenName,
          userType: this.config.userType,
        },
      });

      // Create transaction for screen load
      const transaction = Sentry.startTransaction({
        name: `Screen Load: ${screenName}`,
        op: 'navigation',
        tags: {
          screen: screenName,
          userType: this.config.userType,
        },
        data: {
          duration: transitionTime,
        },
      });

      transaction.setMeasurement('screen_load_time', transitionTime, 'millisecond');
      transaction.finish();
    }

    // Alert for slow transitions
    if (transitionTime > 2000) { // 2 seconds
      this.reportSlowScreenTransition(screenName, transitionTime);
    }
  }

  // API performance tracking
  trackApiCall(endpoint: string, startTime: number, endTime?: number, status?: 'success' | 'error') {
    const responseTime = (endTime || Date.now()) - startTime;
    this.metrics.apiResponseTimes.set(endpoint, responseTime);

    // Store for analysis
    performanceStorage.set(`api-response-${endpoint}`, {
      time: responseTime,
      timestamp: Date.now(),
      status: status || 'success',
    });

    if (this.config.enableCustomMetrics && this.sentryInitialized) {
      const transaction = Sentry.startTransaction({
        name: `API Call: ${endpoint}`,
        op: 'http',
        tags: {
          endpoint,
          userType: this.config.userType,
          status: status || 'success',
        },
      });

      transaction.setMeasurement('api_response_time', responseTime, 'millisecond');
      transaction.finish();
    }

    // Alert for slow API calls
    if (responseTime > 5000) { // 5 seconds
      this.reportSlowApiCall(endpoint, responseTime);
    }
  }

  // Bundle loading performance
  trackBundleLoad(chunkName: string, loadTime: number) {
    this.metrics.bundleLoadTimes.set(chunkName, loadTime);

    if (this.config.enableCustomMetrics && this.sentryInitialized) {
      Sentry.addBreadcrumb({
        message: `Bundle loaded: ${chunkName}`,
        level: 'info',
        data: {
          loadTime,
          chunkName,
          userType: this.config.userType,
        },
      });

      const transaction = Sentry.startTransaction({
        name: `Bundle Load: ${chunkName}`,
        op: 'bundle.load',
        tags: {
          chunk: chunkName,
          userType: this.config.userType,
        },
      });

      transaction.setMeasurement('bundle_load_time', loadTime, 'millisecond');
      transaction.finish();
    }
  }

  // Cultural context tracking
  trackCulturalEvent(event: string, data?: any) {
    const eventData = {
      event,
      timestamp: Date.now(),
      culturalContext: this.config.culturalContext,
      isPrayerTime: this.checkPrayerTime(),
      ...data,
    };

    this.metrics.cultureAwareMetrics.set(event, eventData);

    if (this.config.enableEducationalTracking && this.sentryInitialized) {
      Sentry.addBreadcrumb({
        message: `Cultural event: ${event}`,
        level: 'info',
        category: 'cultural',
        data: eventData,
      });
    }
  }

  // Educational achievement tracking
  trackEducationalAchievement(achievement: {
    type: 'lesson_completed' | 'level_up' | 'streak' | 'certificate';
    data: any;
  }) {
    if (this.config.enableEducationalTracking && this.sentryInitialized) {
      const transaction = Sentry.startTransaction({
        name: `Achievement: ${achievement.type}`,
        op: 'educational.achievement',
        tags: {
          achievementType: achievement.type,
          userType: this.config.userType,
        },
        data: achievement.data,
      });

      transaction.finish();
    }

    // Store for educational analytics
    performanceStorage.set(`achievement-${Date.now()}`, {
      ...achievement,
      timestamp: Date.now(),
      userType: this.config.userType,
    });
  }

  // Memory usage tracking
  trackMemoryUsage() {
    // Simplified memory tracking (in production, use actual memory profiling)
    const memoryUsage = this.getEstimatedMemoryUsage();
    this.metrics.memoryUsage.push(memoryUsage);

    // Keep only recent measurements
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-50);
    }

    if (this.config.enableCustomMetrics && this.sentryInitialized) {
      Sentry.addBreadcrumb({
        message: 'Memory usage tracked',
        level: 'info',
        data: {
          memoryUsage,
          timestamp: Date.now(),
        },
      });
    }

    // Alert for high memory usage
    if (memoryUsage > 80) { // 80MB threshold
      this.reportHighMemoryUsage(memoryUsage);
    }
  }

  // Performance issues reporting
  private reportSlowScreenTransition(screenName: string, duration: number) {
    if (this.sentryInitialized) {
      Sentry.captureMessage(`Slow screen transition: ${screenName}`, {
        level: 'warning',
        tags: {
          performance_issue: 'slow_screen_transition',
          screen: screenName,
          userType: this.config.userType,
        },
        extra: {
          duration,
          threshold: 2000,
        },
      });
    }
  }

  private reportSlowApiCall(endpoint: string, duration: number) {
    if (this.sentryInitialized) {
      Sentry.captureMessage(`Slow API call: ${endpoint}`, {
        level: 'warning',
        tags: {
          performance_issue: 'slow_api_call',
          endpoint,
          userType: this.config.userType,
        },
        extra: {
          duration,
          threshold: 5000,
        },
      });
    }
  }

  private reportHighMemoryUsage(usage: number) {
    if (this.sentryInitialized) {
      Sentry.captureMessage('High memory usage detected', {
        level: 'warning',
        tags: {
          performance_issue: 'high_memory_usage',
          userType: this.config.userType,
        },
        extra: {
          memoryUsage: usage,
          threshold: 80,
        },
      });
    }
  }

  // Analytics and reporting
  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    summary: {
      avgScreenTransition: number;
      avgApiResponse: number;
      avgBundleLoad: number;
      avgMemoryUsage: number;
      culturalEventsCount: number;
    };
  } {
    const screenTransitions = Array.from(this.metrics.screenTransitionTimes.values());
    const apiResponses = Array.from(this.metrics.apiResponseTimes.values());
    const bundleLoads = Array.from(this.metrics.bundleLoadTimes.values());

    return {
      metrics: this.metrics,
      summary: {
        avgScreenTransition: this.calculateAverage(screenTransitions),
        avgApiResponse: this.calculateAverage(apiResponses),
        avgBundleLoad: this.calculateAverage(bundleLoads),
        avgMemoryUsage: this.calculateAverage(this.metrics.memoryUsage),
        culturalEventsCount: this.metrics.cultureAwareMetrics.size,
      },
    };
  }

  // Prayer time-aware monitoring
  adaptToPrayerTime(isPrayerTime: boolean) {
    this.config.culturalContext = isPrayerTime ? 'prayer_time' : 'normal';

    if (this.sentryInitialized) {
      Sentry.setContext('cultural', {
        isPrayerTime,
        context: this.config.culturalContext,
        adjustedMonitoring: this.config.respectPrayerTime,
      });
    }
  }

  // Utility methods
  private checkPrayerTime(): boolean {
    const hour = new Date().getHours();
    return [5, 12, 15, 18, 20].includes(hour);
  }

  private getCurrentAppSection(): string {
    // This would be integrated with your navigation state
    return 'unknown';
  }

  private getEstimatedMemoryUsage(): number {
    // Simplified memory estimation
    // In production, use actual memory profiling tools
    return Math.random() * 100; // MB
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private setupPerformanceTracking() {
    // Track app start time
    InteractionManager.runAfterInteractions(() => {
      this.metrics.appStartTime = Date.now() - this.startTime;
      
      if (this.sentryInitialized) {
        const transaction = Sentry.startTransaction({
          name: 'App Startup',
          op: 'app.start',
          tags: {
            userType: this.config.userType,
          },
        });

        transaction.setMeasurement('app_start_time', this.metrics.appStartTime, 'millisecond');
        transaction.finish();
      }
    });

    // Start periodic memory tracking
    this.startMemoryTracking();
  }

  private startMemoryTracking() {
    // Track memory usage every 30 seconds
    setInterval(() => {
      this.trackMemoryUsage();
    }, 30000);
  }

  // Cleanup
  destroy() {
    if (this.sentryInitialized) {
      Sentry.close();
    }
  }
}

// Factory functions for educational contexts
export const createStudentPerformanceMonitoring = () =>
  PerformanceMonitoringService.getInstance({
    userType: 'student',
    enableEducationalTracking: true,
    sampleRate: 1.0, // Full monitoring for students
  });

export const createTeacherPerformanceMonitoring = () =>
  PerformanceMonitoringService.getInstance({
    userType: 'teacher',
    enableEducationalTracking: true,
    enableUserFeedback: true,
    sampleRate: 1.0,
  });

export const createAdminPerformanceMonitoring = () =>
  PerformanceMonitoringService.getInstance({
    userType: 'admin',
    enableEducationalTracking: false, // Focus on system metrics
    enableProfiling: true,
    sampleRate: 1.0,
  });

// React hook for performance monitoring
export const usePerformanceMonitoring = (userType: 'student' | 'teacher' | 'admin') => {
  const service = PerformanceMonitoringService.getInstance({ userType });

  return {
    trackScreen: (screenName: string, startTime: number, endTime?: number) =>
      service.trackScreenTransition(screenName, startTime, endTime),
    
    trackApi: (endpoint: string, startTime: number, endTime?: number, status?: 'success' | 'error') =>
      service.trackApiCall(endpoint, startTime, endTime, status),
    
    trackBundle: (chunkName: string, loadTime: number) =>
      service.trackBundleLoad(chunkName, loadTime),
    
    trackCultural: (event: string, data?: any) =>
      service.trackCulturalEvent(event, data),
    
    trackAchievement: (achievement: any) =>
      service.trackEducationalAchievement(achievement),
    
    setUser: (user: any) =>
      service.setEducationalUser(user),
    
    getReport: () =>
      service.getPerformanceReport(),
  };
};

export default PerformanceMonitoringService;