/**
 * Performance Monitor Service
 * Tracks app performance metrics and startup times
 */

interface PerformanceMetrics {
  appStartTime: number;
  navigationReadyTime?: number;
  firstScreenRenderTime?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    appStartTime: Date.now(),
  };

  private sessionId: string = '';

  startSession() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.appStartTime = Date.now();
    
    if (__DEV__) {
      console.log(`📊 Performance Monitor - Session started: ${this.sessionId}`);
    }
  }

  markNavigationReady() {
    this.metrics.navigationReadyTime = Date.now();
    const navigationTime = this.metrics.navigationReadyTime - this.metrics.appStartTime;
    
    if (__DEV__) {
      console.log(`📊 Navigation ready in ${navigationTime}ms`);
    }
  }

  markFirstScreenRender() {
    this.metrics.firstScreenRenderTime = Date.now();
    const renderTime = this.metrics.firstScreenRenderTime - this.metrics.appStartTime;
    
    if (__DEV__) {
      console.log(`📊 First screen rendered in ${renderTime}ms`);
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Method to log custom performance events
  logEvent(eventName: string, data?: Record<string, any>) {
    if (__DEV__) {
      console.log(`📊 Performance Event: ${eventName}`, data);
    }
    
    // In production, you would send this to your analytics service
    // Example: analytics.track(eventName, { ...data, sessionId: this.sessionId });
  }
}

export const performanceMonitor = new PerformanceMonitor();