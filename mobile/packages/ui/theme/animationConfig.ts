/**
 * Animation Configuration - Harry School Design System
 * 
 * Centralized configuration for educational micro-animations
 * Supports teacher efficiency vs student engagement optimization
 * Network-aware and battery-conscious animation management
 */

import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getBatteryLevelAsync, getBatteryStateAsync, BatteryState } from 'expo-battery';

export type UserContext = 'teacher' | 'student' | 'general';
export type ConnectionType = 'wifi' | 'cellular' | 'offline' | 'unknown';
export type DevicePerformance = 'high' | 'medium' | 'low';
export type BatteryLevel = 'high' | 'medium' | 'low' | 'critical';

export interface AnimationProfile {
  // Timing adjustments
  speedMultiplier: number;
  
  // Feature toggles
  enableComplexAnimations: boolean;
  enableParticleEffects: boolean;
  enableShadowAnimations: boolean;
  enableColorTransitions: boolean;
  
  // Performance limits
  maxConcurrentAnimations: number;
  frameRateTarget: number;
  
  // Context-specific settings
  hapticFeedbackIntensity: 'light' | 'medium' | 'heavy';
  celebrationIntensity: 'subtle' | 'standard' | 'dramatic';
}

// Predefined animation profiles for different contexts
export const animationProfiles: Record<UserContext, Record<string, AnimationProfile>> = {
  teacher: {
    // Optimized for rapid workflows
    efficiency: {
      speedMultiplier: 1.5, // 50% faster animations
      enableComplexAnimations: false,
      enableParticleEffects: false,
      enableShadowAnimations: false,
      enableColorTransitions: true,
      maxConcurrentAnimations: 2,
      frameRateTarget: 30, // Lower for battery efficiency
      hapticFeedbackIntensity: 'light',
      celebrationIntensity: 'subtle',
    },
    // Balanced for teacher comfort
    balanced: {
      speedMultiplier: 1.2,
      enableComplexAnimations: true,
      enableParticleEffects: false,
      enableShadowAnimations: true,
      enableColorTransitions: true,
      maxConcurrentAnimations: 3,
      frameRateTarget: 60,
      hapticFeedbackIntensity: 'medium',
      celebrationIntensity: 'standard',
    },
  },
  student: {
    // Maximum engagement and delight
    engaging: {
      speedMultiplier: 0.8, // Slower for better appreciation
      enableComplexAnimations: true,
      enableParticleEffects: true,
      enableShadowAnimations: true,
      enableColorTransitions: true,
      maxConcurrentAnimations: 5,
      frameRateTarget: 60,
      hapticFeedbackIntensity: 'heavy',
      celebrationIntensity: 'dramatic',
    },
    // Balanced student experience
    balanced: {
      speedMultiplier: 1.0,
      enableComplexAnimations: true,
      enableParticleEffects: true,
      enableShadowAnimations: false,
      enableColorTransitions: true,
      maxConcurrentAnimations: 3,
      frameRateTarget: 60,
      hapticFeedbackIntensity: 'medium',
      celebrationIntensity: 'standard',
    },
    // Reduced for focus
    focused: {
      speedMultiplier: 1.2,
      enableComplexAnimations: false,
      enableParticleEffects: false,
      enableShadowAnimations: false,
      enableColorTransitions: true,
      maxConcurrentAnimations: 2,
      frameRateTarget: 30,
      hapticFeedbackIntensity: 'light',
      celebrationIntensity: 'subtle',
    },
  },
  general: {
    // Default balanced profile
    default: {
      speedMultiplier: 1.0,
      enableComplexAnimations: true,
      enableParticleEffects: false,
      enableShadowAnimations: true,
      enableColorTransitions: true,
      maxConcurrentAnimations: 3,
      frameRateTarget: 60,
      hapticFeedbackIntensity: 'medium',
      celebrationIntensity: 'standard',
    },
  },
};

// Performance-based profile adjustments
export const performanceAdjustments: Record<DevicePerformance, Partial<AnimationProfile>> = {
  high: {
    // No adjustments needed for high-performance devices
  },
  medium: {
    enableParticleEffects: false,
    maxConcurrentAnimations: 2,
    frameRateTarget: 30,
  },
  low: {
    speedMultiplier: 1.5, // Faster to reduce animation time
    enableComplexAnimations: false,
    enableParticleEffects: false,
    enableShadowAnimations: false,
    maxConcurrentAnimations: 1,
    frameRateTarget: 30,
  },
};

// Battery-based adjustments
export const batteryAdjustments: Record<BatteryLevel, Partial<AnimationProfile>> = {
  high: {
    // No adjustments for high battery
  },
  medium: {
    frameRateTarget: 30,
    maxConcurrentAnimations: 2,
  },
  low: {
    speedMultiplier: 1.3,
    enableComplexAnimations: false,
    enableParticleEffects: false,
    frameRateTarget: 30,
    maxConcurrentAnimations: 1,
  },
  critical: {
    speedMultiplier: 2.0, // Very fast animations
    enableComplexAnimations: false,
    enableParticleEffects: false,
    enableShadowAnimations: false,
    enableColorTransitions: false,
    maxConcurrentAnimations: 1,
    frameRateTarget: 15,
  },
};

// Network-based adjustments (affects animations that might trigger data fetching)
export const networkAdjustments: Record<ConnectionType, Partial<AnimationProfile>> = {
  wifi: {
    // No adjustments for WiFi
  },
  cellular: {
    // Slightly reduce complex animations to preserve data
    enableParticleEffects: false,
  },
  offline: {
    // Reduce all network-dependent celebrations
    celebrationIntensity: 'subtle',
  },
  unknown: {
    // Conservative approach
    enableComplexAnimations: false,
    celebrationIntensity: 'subtle',
  },
};

// Main configuration manager class
export class AnimationConfigManager {
  private currentProfile: AnimationProfile;
  private userContext: UserContext = 'general';
  private profileName: string = 'default';
  
  constructor() {
    this.currentProfile = animationProfiles.general.default;
    this.initializeAdaptiveSettings();
  }
  
  // Initialize adaptive settings based on device capabilities
  private async initializeAdaptiveSettings() {
    const [devicePerf, batteryLevel, connectionType] = await Promise.all([
      this.detectDevicePerformance(),
      this.getBatteryLevel(),
      this.getConnectionType(),
    ]);
    
    this.applyAdaptiveProfile(devicePerf, batteryLevel, connectionType);
  }
  
  // Set user context and profile
  public setProfile(context: UserContext, profileName: string) {
    this.userContext = context;
    this.profileName = profileName;
    
    const baseProfile = animationProfiles[context]?.[profileName] || animationProfiles.general.default;
    this.currentProfile = { ...baseProfile };
    
    // Re-apply adaptive settings
    this.initializeAdaptiveSettings();
  }
  
  // Get current animation profile
  public getProfile(): AnimationProfile {
    return this.currentProfile;
  }
  
  // Apply performance, battery, and network-based adjustments
  private async applyAdaptiveProfile(
    devicePerf: DevicePerformance,
    batteryLevel: BatteryLevel,
    connectionType: ConnectionType
  ) {
    const perfAdjustments = performanceAdjustments[devicePerf] || {};
    const battAdjustments = batteryAdjustments[batteryLevel] || {};
    const netAdjustments = networkAdjustments[connectionType] || {};
    
    // Merge adjustments with current profile
    this.currentProfile = {
      ...this.currentProfile,
      ...perfAdjustments,
      ...battAdjustments,
      ...netAdjustments,
      // Take the most conservative values for critical settings
      speedMultiplier: Math.max(
        this.currentProfile.speedMultiplier || 1.0,
        perfAdjustments.speedMultiplier || 1.0,
        battAdjustments.speedMultiplier || 1.0
      ),
      maxConcurrentAnimations: Math.min(
        this.currentProfile.maxConcurrentAnimations || 3,
        perfAdjustments.maxConcurrentAnimations || 3,
        battAdjustments.maxConcurrentAnimations || 3
      ),
      frameRateTarget: Math.min(
        this.currentProfile.frameRateTarget || 60,
        perfAdjustments.frameRateTarget || 60,
        battAdjustments.frameRateTarget || 60
      ),
    };\n  }\n  \n  // Detect device performance tier\n  private async detectDevicePerformance(): Promise<DevicePerformance> {\n    // Simple heuristic based on platform and available memory\n    if (Platform.OS === 'ios') {\n      // iOS devices generally have good performance\n      return 'high';\n    }\n    \n    // For Android, we'd ideally check device specs\n    // This is a simplified version\n    return 'medium';\n  }\n  \n  // Get current battery level category\n  private async getBatteryLevel(): Promise<BatteryLevel> {\n    try {\n      const batteryLevel = await getBatteryLevelAsync();\n      const batteryState = await getBatteryStateAsync();\n      \n      if (batteryState === BatteryState.CHARGING) {\n        return 'high'; // Don't restrict if charging\n      }\n      \n      if (batteryLevel > 0.5) return 'high';\n      if (batteryLevel > 0.2) return 'medium';\n      if (batteryLevel > 0.1) return 'low';\n      return 'critical';\n    } catch {\n      return 'medium'; // Default fallback\n    }\n  }\n  \n  // Get current connection type\n  private async getConnectionType(): Promise<ConnectionType> {\n    try {\n      const netInfo = await NetInfo.fetch();\n      \n      if (!netInfo.isConnected) return 'offline';\n      \n      switch (netInfo.type) {\n        case 'wifi':\n          return 'wifi';\n        case 'cellular':\n          return 'cellular';\n        default:\n          return 'unknown';\n      }\n    } catch {\n      return 'unknown';\n    }\n  }\n  \n  // Get timing with current profile adjustments\n  public getAdjustedTiming(baseTiming: number): number {\n    return baseTiming / this.currentProfile.speedMultiplier;\n  }\n  \n  // Check if a specific animation feature is enabled\n  public isFeatureEnabled(feature: keyof AnimationProfile): boolean {\n    const value = this.currentProfile[feature];\n    return typeof value === 'boolean' ? value : true;\n  }\n  \n  // Get current haptic intensity\n  public getHapticIntensity(): 'light' | 'medium' | 'heavy' {\n    return this.currentProfile.hapticFeedbackIntensity;\n  }\n  \n  // Get celebration intensity\n  public getCelebrationIntensity(): 'subtle' | 'standard' | 'dramatic' {\n    return this.currentProfile.celebrationIntensity;\n  }\n}\n\n// Global animation config instance\nexport const animationConfig = new AnimationConfigManager();\n\n// Utility functions for components\nexport const useAnimationConfig = () => {\n  return {\n    profile: animationConfig.getProfile(),\n    getAdjustedTiming: (timing: number) => animationConfig.getAdjustedTiming(timing),\n    isFeatureEnabled: (feature: keyof AnimationProfile) => animationConfig.isFeatureEnabled(feature),\n    hapticIntensity: animationConfig.getHapticIntensity(),\n    celebrationIntensity: animationConfig.getCelebrationIntensity(),\n    setProfile: (context: UserContext, profile: string) => animationConfig.setProfile(context, profile),\n  };\n};\n\n// Educational context presets\nexport const EducationalPresets = {\n  TeacherEfficiency: () => animationConfig.setProfile('teacher', 'efficiency'),\n  TeacherBalanced: () => animationConfig.setProfile('teacher', 'balanced'),\n  StudentEngaging: () => animationConfig.setProfile('student', 'engaging'),\n  StudentBalanced: () => animationConfig.setProfile('student', 'balanced'),\n  StudentFocused: () => animationConfig.setProfile('student', 'focused'),\n  GeneralDefault: () => animationConfig.setProfile('general', 'default'),\n};\n\nexport default animationConfig;