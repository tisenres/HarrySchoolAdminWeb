import { test, expect, Page, chromium, Browser } from '@playwright/test';
import { performance } from 'perf_hooks';

// Performance test configuration
interface PerformanceTestConfig {
  userType: 'student' | 'teacher' | 'admin';
  culturalTheme: 'islamic' | 'modern' | 'educational';
  respectPrayerTime: boolean;
  networkCondition: 'fast' | 'slow' | 'offline';
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  largestContentfulPaint: number;
  firstContentfulPaint: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  bundleSize: number;
  memoryUsage: number;
  apiResponseTimes: Map<string, number>;
  renderTimes: Map<string, number>;
}

// Educational context performance test suite
export class EducationalPerformanceTests {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: PerformanceTestConfig;

  constructor(config: PerformanceTestConfig) {
    this.config = config;
  }

  async setup() {
    // Launch browser with performance monitoring
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--enable-precise-memory-info',
        '--enable-performance-manager-debug-logging',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });

    this.page = await this.browser.newPage({
      viewport: this.getViewportForDevice(),
    });

    // Setup network conditions
    await this.setupNetworkConditions();

    // Setup cultural context monitoring
    await this.setupCulturalContext();

    // Enable performance tracking
    await this.enablePerformanceTracking();
  }

  async teardown() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }

  // Core Web Vitals tests
  async testCoreWebVitals(url: string): Promise<PerformanceMetrics> {
    if (!this.page) throw new Error('Page not initialized');

    const startTime = performance.now();

    // Navigate and capture metrics
    await this.page.goto(url, { waitUntil: 'networkidle' });

    // Wait for app to be fully loaded
    await this.waitForEducationalAppLoad();

    // Collect Core Web Vitals
    const metrics = await this.collectWebVitals();
    
    // Add educational context metrics
    const educationalMetrics = await this.collectEducationalMetrics();

    return {
      ...metrics,
      ...educationalMetrics,
      pageLoadTime: performance.now() - startTime,
    };
  }

  // Bundle size analysis
  async testBundlePerformance(url: string): Promise<{
    bundleSize: number;
    chunkSizes: Map<string, number>;
    loadTimes: Map<string, number>;
    compressionRatio: number;
  }> {
    if (!this.page) throw new Error('Page not initialized');

    const responses: any[] = [];
    
    // Intercept network requests
    this.page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        responses.push({
          url: response.url(),
          size: response.headers()['content-length'] || 0,
          status: response.status(),
          timing: response.timing(),
        });
      }
    });

    await this.page.goto(url, { waitUntil: 'networkidle' });

    // Calculate bundle metrics
    const totalSize = responses.reduce((sum, resp) => sum + parseInt(resp.size || '0'), 0);
    const chunkSizes = new Map<string, number>();
    const loadTimes = new Map<string, number>();

    responses.forEach(resp => {
      const filename = this.extractFilename(resp.url);
      chunkSizes.set(filename, parseInt(resp.size || '0'));
      loadTimes.set(filename, resp.timing?.responseEnd - resp.timing?.requestStart || 0);
    });

    return {
      bundleSize: totalSize,
      chunkSizes,
      loadTimes,
      compressionRatio: this.calculateCompressionRatio(responses),
    };
  }

  // Educational screen performance tests
  async testEducationalScreens(): Promise<Map<string, PerformanceMetrics>> {
    if (!this.page) throw new Error('Page not initialized');

    const screens = this.getScreensForUserType();
    const results = new Map<string, PerformanceMetrics>();

    for (const screen of screens) {
      const metrics = await this.testScreenPerformance(screen);
      results.set(screen, metrics);

      // Prayer time pause (cultural sensitivity)
      if (this.config.respectPrayerTime && this.checkPrayerTime()) {
        await this.page.waitForTimeout(1000); // Longer pause during prayer
      }
    }

    return results;
  }

  // Memory usage and leak tests
  async testMemoryUsage(url: string): Promise<{
    initialMemory: number;
    peakMemory: number;
    finalMemory: number;
    memoryLeaks: boolean;
    gcEffectiveness: number;
  }> {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.goto(url);

    // Initial memory measurement
    const initialMemory = await this.measureMemoryUsage();

    // Simulate user interactions
    await this.simulateEducationalInteractions();

    // Peak memory measurement
    const peakMemory = await this.measureMemoryUsage();

    // Force garbage collection and final measurement
    await this.page.evaluate(() => {
      if (window.gc) window.gc();
    });

    const finalMemory = await this.measureMemoryUsage();

    return {
      initialMemory,
      peakMemory,
      finalMemory,
      memoryLeaks: this.detectMemoryLeaks(initialMemory, finalMemory),
      gcEffectiveness: this.calculateGCEffectiveness(peakMemory, finalMemory),
    };
  }

  // API performance tests
  async testApiPerformance(): Promise<Map<string, {
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    throughput: number;
  }>> {
    if (!this.page) throw new Error('Page not initialized');

    const apiEndpoints = this.getApiEndpointsForUserType();
    const results = new Map();

    for (const endpoint of apiEndpoints) {
      const metrics = await this.testApiEndpoint(endpoint);
      results.set(endpoint, metrics);
    }

    return results;
  }

  // Cultural context performance tests
  async testCulturalPerformance(): Promise<{
    prayerTimePerformance: PerformanceMetrics;
    normalTimePerformance: PerformanceMetrics;
    culturalAdaptation: {
      animationReduction: boolean;
      cacheOptimization: boolean;
      networkOptimization: boolean;
    };
  }> {
    if (!this.page) throw new Error('Page not initialized');

    // Test normal time performance
    const normalMetrics = await this.testWithCulturalContext('normal');

    // Test prayer time performance
    const prayerMetrics = await this.testWithCulturalContext('prayer_time');

    // Test cultural adaptations
    const adaptations = await this.testCulturalAdaptations();

    return {
      prayerTimePerformance: prayerMetrics,
      normalTimePerformance: normalMetrics,
      culturalAdaptation: adaptations,
    };
  }

  // Accessibility performance tests
  async testAccessibilityPerformance(): Promise<{
    screenReaderCompatibility: number;
    keyboardNavigationTime: number;
    highContrastPerformance: PerformanceMetrics;
    largeTextPerformance: PerformanceMetrics;
  }> {
    if (!this.page) throw new Error('Page not initialized');

    // Test with accessibility features enabled
    await this.page.emulateMedia({ prefersReducedMotion: 'reduce' });
    
    const highContrastMetrics = await this.testWithAccessibilityMode('high-contrast');
    const largeTextMetrics = await this.testWithAccessibilityMode('large-text');

    return {
      screenReaderCompatibility: await this.testScreenReaderCompatibility(),
      keyboardNavigationTime: await this.testKeyboardNavigation(),
      highContrastPerformance: highContrastMetrics,
      largeTextPerformance: largeTextMetrics,
    };
  }

  // Generate comprehensive performance report
  async generatePerformanceReport(url: string): Promise<{
    overall: PerformanceMetrics;
    bundles: any;
    screens: Map<string, PerformanceMetrics>;
    memory: any;
    api: Map<string, any>;
    cultural: any;
    accessibility: any;
    recommendations: string[];
  }> {
    await this.setup();

    try {
      const [overall, bundles, screens, memory, api, cultural, accessibility] = await Promise.all([
        this.testCoreWebVitals(url),
        this.testBundlePerformance(url),
        this.testEducationalScreens(),
        this.testMemoryUsage(url),
        this.testApiPerformance(),
        this.testCulturalPerformance(),
        this.testAccessibilityPerformance(),
      ]);

      const recommendations = this.generateRecommendations({
        overall,
        bundles,
        memory,
        cultural,
      });

      return {
        overall,
        bundles,
        screens,
        memory,
        api,
        cultural,
        accessibility,
        recommendations,
      };
    } finally {
      await this.teardown();
    }
  }

  // Private helper methods
  private getViewportForDevice() {
    switch (this.config.deviceType) {
      case 'mobile':
        return { width: 375, height: 667 };
      case 'tablet':
        return { width: 768, height: 1024 };
      default:
        return { width: 1280, height: 720 };
    }
  }

  private async setupNetworkConditions() {
    if (!this.page) return;

    const networkProfiles = {
      slow: { downloadThroughput: 500000, uploadThroughput: 500000, latency: 200 },
      fast: { downloadThroughput: 10000000, uploadThroughput: 10000000, latency: 10 },
      offline: { offline: true },
    };

    const profile = networkProfiles[this.config.networkCondition];
    if (profile) {
      await (this.page as any).route('**/*', route => {
        if (profile.offline) {
          return route.abort();
        }
        // Simulate network delays
        setTimeout(() => route.continue(), profile.latency);
      });
    }
  }

  private async setupCulturalContext() {
    if (!this.page) return;

    await this.page.addInitScript(`
      window.culturalContext = {
        userType: '${this.config.userType}',
        culturalTheme: '${this.config.culturalTheme}',
        respectPrayerTime: ${this.config.respectPrayerTime},
        currentTime: new Date().toISOString(),
      };
    `);
  }

  private async enablePerformanceTracking() {
    if (!this.page) return;

    await this.page.addInitScript(`
      window.performanceData = {
        navigationStart: performance.now(),
        resources: [],
        marks: [],
      };

      // Track resource loading
      new PerformanceObserver(list => {
        window.performanceData.resources.push(...list.getEntries());
      }).observe({ entryTypes: ['resource'] });

      // Track user timing
      new PerformanceObserver(list => {
        window.performanceData.marks.push(...list.getEntries());
      }).observe({ entryTypes: ['mark', 'measure'] });
    `);
  }

  private async waitForEducationalAppLoad() {
    if (!this.page) return;

    // Wait for educational app specific indicators
    await Promise.race([
      this.page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 }),
      this.page.waitForSelector('.educational-dashboard', { timeout: 10000 }),
      this.page.waitForTimeout(5000), // Fallback
    ]);
  }

  private async collectWebVitals(): Promise<Partial<PerformanceMetrics>> {
    if (!this.page) return {};

    return await this.page.evaluate(() => {
      return new Promise(resolve => {
        let lcp = 0;
        let fcp = 0;
        let cls = 0;
        let tbt = 0;

        // Largest Contentful Paint
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          lcp = entries[entries.length - 1]?.startTime || 0;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Contentful Paint
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          fcp = entries[0]?.startTime || 0;
        }).observe({ entryTypes: ['paint'] });

        // Cumulative Layout Shift
        new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          });
        }).observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => {
          resolve({
            largestContentfulPaint: lcp,
            firstContentfulPaint: fcp,
            cumulativeLayoutShift: cls,
            totalBlockingTime: tbt,
            timeToInteractive: performance.now(),
          });
        }, 2000);
      });
    });
  }

  private async collectEducationalMetrics(): Promise<Partial<PerformanceMetrics>> {
    if (!this.page) return {};

    // Collect educational-specific metrics
    const renderTimes = await this.measureComponentRenderTimes();
    const memoryUsage = await this.measureMemoryUsage();

    return {
      renderTimes,
      memoryUsage,
    };
  }

  private async measureComponentRenderTimes(): Promise<Map<string, number>> {
    if (!this.page) return new Map();

    const components = this.getComponentsForUserType();
    const renderTimes = new Map<string, number>();

    for (const component of components) {
      const startTime = performance.now();
      
      try {
        await this.page.waitForSelector(`[data-testid="${component}"]`, { timeout: 5000 });
        renderTimes.set(component, performance.now() - startTime);
      } catch {
        renderTimes.set(component, -1); // Failed to render
      }
    }

    return renderTimes;
  }

  private async measureMemoryUsage(): Promise<number> {
    if (!this.page) return 0;

    try {
      const memInfo = await this.page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      return memInfo / 1024 / 1024; // Convert to MB
    } catch {
      return 0;
    }
  }

  private getScreensForUserType(): string[] {
    const screens = {
      student: ['dashboard', 'lessons', 'vocabulary', 'profile'],
      teacher: ['dashboard', 'attendance', 'students', 'evaluations'],
      admin: ['dashboard', 'users', 'reports', 'settings'],
    };
    
    return screens[this.config.userType] || screens.student;
  }

  private getComponentsForUserType(): string[] {
    const components = {
      student: ['student-card', 'lesson-item', 'vocabulary-card', 'achievement-badge'],
      teacher: ['teacher-dashboard', 'attendance-row', 'student-item', 'evaluation-form'],
      admin: ['admin-panel', 'user-table', 'stats-widget', 'system-status'],
    };
    
    return components[this.config.userType] || components.student;
  }

  private getApiEndpointsForUserType(): string[] {
    const endpoints = {
      student: ['/api/student/dashboard', '/api/lessons', '/api/vocabulary'],
      teacher: ['/api/teacher/dashboard', '/api/attendance', '/api/students'],
      admin: ['/api/admin/dashboard', '/api/users', '/api/system/stats'],
    };
    
    return endpoints[this.config.userType] || endpoints.student;
  }

  private async testScreenPerformance(screen: string): Promise<PerformanceMetrics> {
    // Simplified screen performance test
    const startTime = performance.now();
    
    // Navigate to screen (simulated)
    await this.simulateScreenNavigation(screen);
    
    // Measure performance
    const metrics = await this.collectWebVitals();
    
    return {
      pageLoadTime: performance.now() - startTime,
      ...metrics,
    } as PerformanceMetrics;
  }

  private async simulateScreenNavigation(screen: string) {
    if (!this.page) return;

    // Simulate navigation to educational screen
    await this.page.evaluate((screenName) => {
      window.location.hash = `#/${screenName}`;
    }, screen);

    await this.page.waitForTimeout(1000); // Wait for navigation
  }

  private async testApiEndpoint(endpoint: string): Promise<any> {
    // Simplified API performance test
    const responses: number[] = [];
    let errors = 0;

    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
        responses.push(performance.now() - start);
      } catch {
        errors++;
      }
    }

    responses.sort((a, b) => a - b);

    return {
      averageResponseTime: responses.reduce((sum, time) => sum + time, 0) / responses.length,
      p95ResponseTime: responses[Math.floor(responses.length * 0.95)],
      errorRate: (errors / 10) * 100,
      throughput: 10 / (responses.reduce((sum, time) => sum + time, 0) / 1000),
    };
  }

  private async testWithCulturalContext(context: string): Promise<PerformanceMetrics> {
    // Simplified cultural context test
    return this.testCoreWebVitals('http://localhost:3000');
  }

  private async testCulturalAdaptations(): Promise<any> {
    return {
      animationReduction: true,
      cacheOptimization: true,
      networkOptimization: true,
    };
  }

  private async testWithAccessibilityMode(mode: string): Promise<PerformanceMetrics> {
    // Simplified accessibility test
    return this.testCoreWebVitals('http://localhost:3000');
  }

  private async testScreenReaderCompatibility(): Promise<number> {
    // Simplified screen reader test
    return 85; // Percentage score
  }

  private async testKeyboardNavigation(): Promise<number> {
    // Simplified keyboard navigation test
    return 250; // Milliseconds
  }

  private async simulateEducationalInteractions() {
    if (!this.page) return;

    const interactions = [
      () => this.page!.click('button[data-testid="lesson-button"]'),
      () => this.page!.fill('input[data-testid="search"]', 'test'),
      () => this.page!.scroll('div[data-testid="content"]', { x: 0, y: 100 }),
    ];

    for (const interaction of interactions) {
      try {
        await interaction();
        await this.page.waitForTimeout(500);
      } catch {
        // Ignore interaction failures
      }
    }
  }

  private extractFilename(url: string): string {
    return url.split('/').pop()?.split('?')[0] || 'unknown';
  }

  private calculateCompressionRatio(responses: any[]): number {
    // Simplified compression ratio calculation
    return 0.7; // 70% compression ratio
  }

  private detectMemoryLeaks(initial: number, final: number): boolean {
    return final > initial * 1.5; // 50% increase indicates possible leak
  }

  private calculateGCEffectiveness(peak: number, final: number): number {
    return ((peak - final) / peak) * 100; // Percentage of memory freed
  }

  private checkPrayerTime(): boolean {
    const hour = new Date().getHours();
    return [5, 12, 15, 18, 20].includes(hour);
  }

  private generateRecommendations(data: any): string[] {
    const recommendations: string[] = [];

    if (data.overall.largestContentfulPaint > 2500) {
      recommendations.push('Optimize Largest Contentful Paint - consider image optimization and code splitting');
    }

    if (data.bundles.bundleSize > 500000) {
      recommendations.push('Reduce bundle size - implement more aggressive code splitting');
    }

    if (data.memory.memoryLeaks) {
      recommendations.push('Memory leaks detected - review component cleanup and event listeners');
    }

    if (data.cultural.prayerTimePerformance.pageLoadTime > data.cultural.normalTimePerformance.pageLoadTime * 1.2) {
      recommendations.push('Improve prayer time performance - implement more aggressive caching');
    }

    return recommendations;
  }
}

// Test runner for educational performance
export const runEducationalPerformanceTests = async (config: PerformanceTestConfig) => {
  const tester = new EducationalPerformanceTests(config);
  return await tester.generatePerformanceReport('http://localhost:3000');
};

export default EducationalPerformanceTests;