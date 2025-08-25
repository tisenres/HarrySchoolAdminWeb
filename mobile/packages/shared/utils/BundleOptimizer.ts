import { lazy, ComponentType } from 'react';
import { InteractionManager, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { MMKV } from 'react-native-mmkv';

// Bundle optimization storage
const bundleStorage = new MMKV({
  id: 'bundle-optimization',
  encryptionKey: 'harry-school-bundles',
});

// Bundle optimization configuration
interface BundleOptimizationConfig {
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  preloadCriticalModules: boolean;
  respectPrayerTime: boolean;
  culturalContext: 'normal' | 'prayer_time' | 'ramadan';
  userType: 'student' | 'teacher' | 'admin';
  deviceClass: 'low' | 'mid' | 'high';
  networkType: '2g' | '3g' | '4g' | 'wifi';
}

const defaultBundleConfig: BundleOptimizationConfig = {
  enableCodeSplitting: true,
  enableTreeShaking: true,
  preloadCriticalModules: true,
  respectPrayerTime: true,
  culturalContext: 'normal',
  userType: 'student',
  deviceClass: 'mid',
  networkType: 'wifi',
};

// Device class detection
export const detectDeviceClass = (): 'low' | 'mid' | 'high' => {
  const deviceInfo = Constants.deviceName || '';
  const year = Constants.deviceYearClass || 2020;
  const memory = Constants.totalMemory || 2;

  // High-end devices (2022+, 6GB+ RAM)
  if (year >= 2022 && memory >= 6) {
    return 'high';
  }
  
  // Low-end devices (pre-2020, <3GB RAM)
  if (year < 2020 && memory < 3) {
    return 'low';
  }
  
  // Mid-range devices (default)
  return 'mid';
};

// Network type detection (simplified)
export const detectNetworkType = (): '2g' | '3g' | '4g' | 'wifi' => {
  // In a real implementation, would use @react-native-community/netinfo
  // For now, defaulting to 4g for optimization
  return '4g';
};

// Prayer time check for cultural optimization
const checkPrayerTime = (): boolean => {
  const hour = new Date().getHours();
  return [5, 12, 15, 18, 20].includes(hour);
};

// Critical module definitions for each user type
const criticalModules = {
  student: {
    screens: [
      'DashboardScreen',
      'LessonsListScreen',
      'VocabularyScreen',
    ],
    components: [
      'StudentCard',
      'LessonCard',
      'VocabularyCard',
    ],
    services: [
      'StudentQueries',
      'LearningService',
      'ProgressTracker',
    ],
  },
  teacher: {
    screens: [
      'TeacherDashboardScreen',
      'AttendanceScreen',
      'StudentListScreen',
    ],
    components: [
      'TeacherCard',
      'AttendanceCard',
      'StudentCard',
    ],
    services: [
      'TeacherQueries',
      'AttendanceService',
      'EvaluationService',
    ],
  },
  admin: {
    screens: [
      'AdminDashboardScreen',
      'TeachersScreen',
      'StudentsScreen',
    ],
    components: [
      'AdminCard',
      'TeacherCard',
      'StudentCard',
    ],
    services: [
      'AdminQueries',
      'UserManagement',
      'SystemSettings',
    ],
  },
};

// Code splitting utilities
export class BundleSplittingManager {
  private static instance: BundleSplittingManager;
  private config: BundleOptimizationConfig;
  private loadedChunks = new Set<string>();
  private preloadQueue: string[] = [];
  private isPreloading = false;

  private constructor(config: Partial<BundleOptimizationConfig> = {}) {
    this.config = { 
      ...defaultBundleConfig, 
      ...config,
      deviceClass: detectDeviceClass(),
      networkType: detectNetworkType(),
    };
    this.initializeOptimization();
  }

  static getInstance(config?: Partial<BundleOptimizationConfig>): BundleSplittingManager {
    if (!BundleSplittingManager.instance) {
      BundleSplittingManager.instance = new BundleSplittingManager(config);
    }
    return BundleSplittingManager.instance;
  }

  private initializeOptimization() {
    // Store bundle optimization preferences
    bundleStorage.set('bundle-config', JSON.stringify(this.config));
    
    // Start preloading critical modules based on user type
    if (this.config.preloadCriticalModules) {
      this.preloadCriticalModules();
    }
  }

  // Create lazily loaded screen with bundle optimization
  createLazyScreen<T extends ComponentType<any>>(
    importFunction: () => Promise<{ default: T }>,
    screenName: string,
    options?: {
      priority?: 'critical' | 'high' | 'normal' | 'low';
      preload?: boolean;
      chunkName?: string;
    }
  ): ComponentType {
    const {
      priority = 'normal',
      preload = false,
      chunkName = screenName,
    } = options || {};

    // Add to preload queue if requested
    if (preload) {
      this.preloadQueue.push(chunkName);
    }

    return lazy(() => {
      return new Promise<{ default: T }>((resolve, reject) => {
        const loadChunk = () => {
          // Prayer time delay for cultural respect
          const prayerDelay = this.config.respectPrayerTime && checkPrayerTime() ? 200 : 0;
          
          // Device class delay (slower devices get more time)
          const deviceDelay = {
            low: 300,
            mid: 100,
            high: 0,
          }[this.config.deviceClass];

          setTimeout(() => {
            importFunction()
              .then(module => {
                this.loadedChunks.add(chunkName);
                bundleStorage.set(`chunk-loaded-${chunkName}`, Date.now());
                resolve(module);
              })
              .catch(error => {
                console.error(`Failed to load chunk ${chunkName}:`, error);
                reject(error);
              });
          }, prayerDelay + deviceDelay);
        };

        // Use InteractionManager for better UX
        InteractionManager.runAfterInteractions(loadChunk);
      });
    });
  }

  // Preload critical modules based on user type
  private async preloadCriticalModules() {
    if (this.isPreloading) return;
    this.isPreloading = true;

    try {
      const userModules = criticalModules[this.config.userType];
      const criticalChunks = [
        ...userModules.screens,
        ...userModules.components.slice(0, 3), // Only preload top 3 components
        ...userModules.services,
      ];

      // Stagger preloading to avoid blocking main thread
      for (let i = 0; i < criticalChunks.length; i++) {
        const chunkName = criticalChunks[i];
        
        // Skip if already loaded
        if (this.loadedChunks.has(chunkName)) continue;

        // Add delay between preloads
        await new Promise(resolve => setTimeout(resolve, 100 * i));

        try {
          // This would be connected to actual dynamic imports in a real implementation
          console.log(`Preloading critical chunk: ${chunkName}`);
          bundleStorage.set(`chunk-preloaded-${chunkName}`, Date.now());
        } catch (error) {
          console.warn(`Failed to preload chunk ${chunkName}:`, error);
        }
      }
    } finally {
      this.isPreloading = false;
    }
  }

  // Get bundle statistics
  getBundleStats() {
    const loadedChunks = Array.from(this.loadedChunks);
    const preloadedChunks = bundleStorage.getAllKeys()
      .filter(key => key.startsWith('chunk-preloaded-'))
      .map(key => key.replace('chunk-preloaded-', ''));

    return {
      totalLoadedChunks: loadedChunks.length,
      preloadedChunks: preloadedChunks.length,
      deviceClass: this.config.deviceClass,
      networkType: this.config.networkType,
      cacheHits: this.getCacheHits(),
    };
  }

  // Get cache hit statistics
  private getCacheHits(): number {
    return bundleStorage.getAllKeys()
      .filter(key => key.startsWith('chunk-loaded-'))
      .length;
  }

  // Clear bundle cache
  clearBundleCache() {
    const keys = bundleStorage.getAllKeys();
    keys.forEach(key => {
      if (key.startsWith('chunk-') || key.startsWith('bundle-')) {
        bundleStorage.delete(key);
      }
    });
    this.loadedChunks.clear();
  }

  // Update configuration
  updateConfig(newConfig: Partial<BundleOptimizationConfig>) {
    this.config = { ...this.config, ...newConfig };
    bundleStorage.set('bundle-config', JSON.stringify(this.config));
  }
}

// Educational context-aware lazy loading
export const createEducationalLazyScreen = <T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  screenName: string,
  userType: 'student' | 'teacher' | 'admin',
  options?: {
    priority?: 'critical' | 'high' | 'normal' | 'low';
    enableCulturalOptimization?: boolean;
  }
): ComponentType => {
  const manager = BundleSplittingManager.getInstance({ userType });
  
  const {
    priority = 'normal',
    enableCulturalOptimization = true,
  } = options || {};

  return manager.createLazyScreen(importFunction, screenName, {
    priority,
    preload: priority === 'critical',
    chunkName: `${userType}-${screenName}`,
  });
};

// Tree shaking utilities for removing unused code
export const createTreeShakeableModule = <T extends Record<string, any>>(
  modules: T,
  userType: 'student' | 'teacher' | 'admin'
): Partial<T> => {
  const relevantModules: Partial<T> = {};
  
  // Only include modules relevant to user type
  Object.entries(modules).forEach(([key, value]) => {
    const isRelevant = key.toLowerCase().includes(userType) || 
                      key.toLowerCase().includes('common') ||
                      key.toLowerCase().includes('shared');
    
    if (isRelevant) {
      (relevantModules as any)[key] = value;
    }
  });

  return relevantModules;
};

// Bundle size analyzer
export class BundleSizeAnalyzer {
  private static instance: BundleSizeAnalyzer;
  private bundleSizes = new Map<string, number>();

  static getInstance(): BundleSizeAnalyzer {
    if (!BundleSizeAnalyzer.instance) {
      BundleSizeAnalyzer.instance = new BundleSizeAnalyzer();
    }
    return BundleSizeAnalyzer.instance;
  }

  // Track bundle size (simplified - would use actual bundle analysis in production)
  trackBundleSize(chunkName: string, sizeInKB: number) {
    this.bundleSizes.set(chunkName, sizeInKB);
    bundleStorage.set(`bundle-size-${chunkName}`, sizeInKB);
  }

  // Get bundle size recommendations
  getBundleSizeRecommendations(): {
    oversizedChunks: string[];
    recommendations: string[];
    totalBundleSize: number;
  } {
    const oversizedChunks: string[] = [];
    const recommendations: string[] = [];
    let totalBundleSize = 0;

    this.bundleSizes.forEach((size, chunkName) => {
      totalBundleSize += size;
      
      // Flag chunks over 100KB as oversized
      if (size > 100) {
        oversizedChunks.push(chunkName);
        recommendations.push(`Consider splitting ${chunkName} (${size}KB) into smaller chunks`);
      }
    });

    // General recommendations
    if (totalBundleSize > 500) {
      recommendations.push('Total bundle size exceeds 500KB - consider more aggressive code splitting');
    }

    if (oversizedChunks.length > 3) {
      recommendations.push('Multiple oversized chunks detected - implement lazy loading for non-critical features');
    }

    return {
      oversizedChunks,
      recommendations,
      totalBundleSize,
    };
  }

  // Clear size tracking
  clearSizeTracking() {
    this.bundleSizes.clear();
    const keys = bundleStorage.getAllKeys();
    keys.forEach(key => {
      if (key.startsWith('bundle-size-')) {
        bundleStorage.delete(key);
      }
    });
  }
}

// Performance-aware code splitting configuration
export const getCodeSplittingConfig = (userType: 'student' | 'teacher' | 'admin') => {
  const deviceClass = detectDeviceClass();
  const networkType = detectNetworkType();

  // Adjust splitting strategy based on device and network
  const aggressiveSplitting = deviceClass === 'high' && ['4g', 'wifi'].includes(networkType);
  const conservativeSplitting = deviceClass === 'low' || ['2g', '3g'].includes(networkType);

  return {
    enableCodeSplitting: true,
    enableTreeShaking: true,
    chunkSizeThreshold: conservativeSplitting ? 50 : aggressiveSplitting ? 150 : 100, // KB
    preloadCriticalModules: !conservativeSplitting,
    maxConcurrentChunks: conservativeSplitting ? 2 : aggressiveSplitting ? 6 : 4,
    respectPrayerTime: true,
    userType,
    deviceClass,
    networkType,
  };
};

// Bundle optimization hooks for React components
export const useBundleOptimization = (userType: 'student' | 'teacher' | 'admin') => {
  const manager = BundleSplittingManager.getInstance({ userType });
  const analyzer = BundleSizeAnalyzer.getInstance();

  return {
    createLazyScreen: (importFn: () => Promise<any>, screenName: string, options?: any) =>
      manager.createLazyScreen(importFn, screenName, options),
    
    getBundleStats: () => manager.getBundleStats(),
    
    getSizeRecommendations: () => analyzer.getBundleSizeRecommendations(),
    
    clearCache: () => manager.clearBundleCache(),
    
    updateConfig: (config: Partial<BundleOptimizationConfig>) => manager.updateConfig(config),
  };
};

export default {
  BundleSplittingManager,
  BundleSizeAnalyzer,
  createEducationalLazyScreen,
  createTreeShakeableModule,
  getCodeSplittingConfig,
  useBundleOptimization,
  detectDeviceClass,
  detectNetworkType,
};