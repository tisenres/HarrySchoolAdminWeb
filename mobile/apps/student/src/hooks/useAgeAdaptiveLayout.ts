/**
 * Age Adaptive Layout Hook
 * Harry School Student Mobile App
 * 
 * Implements age-specific dashboard component ordering and sizing
 * Based on UX research findings for cognitive development stages
 */

import { useMemo, useCallback } from 'react';
import type { StudentAgeGroup } from '../navigation/types';

// Layout configuration interfaces
interface CardLayoutConfig {
  component: string;
  screenSpace: number; // Percentage of screen height (0.0 - 1.0)
  priority: number; // Display order priority
  minHeight?: number; // Minimum height in pixels
  maxHeight?: number; // Maximum height in pixels
}

interface LayoutDimensions {
  cardSpacing: number;
  headerHeight: number;
  footerSpace: number;
  safeAreaAdjustment: number;
}

// Age-specific layout configurations from UX research
const ELEMENTARY_LAYOUT: CardLayoutConfig[] = [
  {
    component: 'RankingCard',
    screenSpace: 0.25, // 25% - High priority for external motivation
    priority: 1,
    minHeight: 140,
    maxHeight: 200,
  },
  {
    component: 'TodayScheduleCard',
    screenSpace: 0.20, // 20% - Structure essential for this age
    priority: 2,
    minHeight: 120,
    maxHeight: 180,
  },
  {
    component: 'RecentAchievementsCard',
    screenSpace: 0.20, // 20% - Celebration drives engagement
    priority: 3,
    minHeight: 120,
    maxHeight: 180,
  },
  {
    component: 'PendingTasksCard',
    screenSpace: 0.15, // 15% - Simplified to prevent overwhelm
    priority: 4,
    minHeight: 100,
    maxHeight: 140,
  },
  {
    component: 'QuickStatsCard',
    screenSpace: 0.20, // 20% - Simplified metrics
    priority: 5,
    minHeight: 120,
    maxHeight: 180,
  },
];

const SECONDARY_LAYOUT: CardLayoutConfig[] = [
  {
    component: 'TodayScheduleCard',
    screenSpace: 0.30, // 30% - Time management critical for autonomy
    priority: 1,
    minHeight: 160,
    maxHeight: 240,
  },
  {
    component: 'QuickStatsCard',
    screenSpace: 0.25, // 25% - Data-driven insights for self-regulation
    priority: 2,
    minHeight: 140,
    maxHeight: 200,
  },
  {
    component: 'PendingTasksCard',
    screenSpace: 0.20, // 20% - Sophisticated task management
    priority: 3,
    minHeight: 120,
    maxHeight: 180,
  },
  {
    component: 'RankingCard',
    screenSpace: 0.15, // 15% - Balanced competition with privacy
    priority: 4,
    minHeight: 100,
    maxHeight: 140,
  },
  {
    component: 'RecentAchievementsCard',
    screenSpace: 0.10, // 10% - Meaningful recognition, not primary motivator
    priority: 5,
    minHeight: 80,
    maxHeight: 120,
  },
];

// Default dimensions configuration
const DEFAULT_DIMENSIONS: LayoutDimensions = {
  cardSpacing: 16,
  headerHeight: 120,
  footerSpace: 80, // For FAB and bottom safe area
  safeAreaAdjustment: 40,
};

// Screen size breakpoints
const SCREEN_BREAKPOINTS = {
  small: 667, // iPhone SE, older Android phones
  medium: 812, // iPhone 12, most Android phones
  large: 926, // iPhone 12 Pro Max, large Android phones
};

/**
 * Custom hook for age-adaptive dashboard layout
 * 
 * @param ageGroup - Student's age group for appropriate layout
 * @param screenHeight - Available screen height for calculations
 * @returns Layout configuration and utility functions
 */
export const useAgeAdaptiveLayout = (
  ageGroup: StudentAgeGroup,
  screenHeight: number
) => {
  // Determine base layout configuration based on age group
  const baseLayoutConfig = useMemo(() => {
    // Group age ranges for layout purposes
    if (ageGroup === '10-12') {
      return ELEMENTARY_LAYOUT;
    } else {
      // Ages 13-15 and 16-18 use secondary layout
      return SECONDARY_LAYOUT;
    }
  }, [ageGroup]);

  // Calculate available content height
  const availableHeight = useMemo(() => {
    return Math.max(
      screenHeight - 
      DEFAULT_DIMENSIONS.headerHeight - 
      DEFAULT_DIMENSIONS.footerSpace - 
      DEFAULT_DIMENSIONS.safeAreaAdjustment,
      400 // Minimum content height
    );
  }, [screenHeight]);

  // Adjust layout for screen size variations
  const layoutConfig = useMemo(() => {
    let sizeMultiplier = 1.0;
    
    // Adjust for small screens
    if (screenHeight <= SCREEN_BREAKPOINTS.small) {
      sizeMultiplier = 0.85; // Reduce card sizes by 15%
    } else if (screenHeight >= SCREEN_BREAKPOINTS.large) {
      sizeMultiplier = 1.15; // Increase card sizes by 15% on large screens
    }

    return baseLayoutConfig.map(config => ({
      ...config,
      screenSpace: config.screenSpace * sizeMultiplier,
      minHeight: config.minHeight ? config.minHeight * sizeMultiplier : undefined,
      maxHeight: config.maxHeight ? config.maxHeight * sizeMultiplier : undefined,
    }));
  }, [baseLayoutConfig, screenHeight]);

  // Calculate actual card height based on screen space and constraints
  const getCardHeight = useCallback((componentName: string): number => {
    const config = layoutConfig.find(c => c.component === componentName);
    
    if (!config) {
      console.warn(`No layout config found for component: ${componentName}`);
      return 120; // Default height
    }

    // Calculate height based on screen space percentage
    const calculatedHeight = availableHeight * config.screenSpace;

    // Apply min/max constraints
    let finalHeight = calculatedHeight;
    
    if (config.minHeight && finalHeight < config.minHeight) {
      finalHeight = config.minHeight;
    }
    
    if (config.maxHeight && finalHeight > config.maxHeight) {
      finalHeight = config.maxHeight;
    }

    return Math.round(finalHeight);
  }, [layoutConfig, availableHeight]);

  // Get component display order
  const getCardOrder = useCallback((componentName: string): number => {
    const config = layoutConfig.find(c => c.component === componentName);
    return config?.priority || 999;
  }, [layoutConfig]);

  // Get sorted components by priority
  const sortedComponents = useMemo(() => {
    return [...layoutConfig].sort((a, b) => a.priority - b.priority);
  }, [layoutConfig]);

  // Calculate total height of all cards (for ScrollView content size)
  const totalContentHeight = useMemo(() => {
    return layoutConfig.reduce((total, config) => {
      const cardHeight = getCardHeight(config.component);
      return total + cardHeight + DEFAULT_DIMENSIONS.cardSpacing;
    }, 0);
  }, [layoutConfig, getCardHeight]);

  // Age-specific UI adaptations
  const ageSpecificAdaptations = useMemo(() => {
    const isElementary = ageGroup === '10-12';
    
    return {
      // Touch target sizes
      touchTargetSize: isElementary ? 52 : 44, // Larger for elementary
      
      // Visual complexity
      visualComplexity: isElementary ? 'simple' : 'detailed',
      
      // Animation preferences
      animationLevel: isElementary ? 'enhanced' : 'standard',
      
      // Color saturation
      colorSaturation: isElementary ? 'high' : 'standard',
      
      // Text sizing
      textScale: isElementary ? 1.1 : 1.0,
      
      // Spacing preferences
      spacing: isElementary ? 'generous' : 'efficient',
    };
  }, [ageGroup]);

  // Responsive breakpoint information
  const screenSizeInfo = useMemo(() => {
    let category: 'small' | 'medium' | 'large' = 'medium';
    
    if (screenHeight <= SCREEN_BREAKPOINTS.small) {
      category = 'small';
    } else if (screenHeight >= SCREEN_BREAKPOINTS.large) {
      category = 'large';
    }

    return {
      category,
      height: screenHeight,
      availableHeight,
      isSmallScreen: screenHeight <= SCREEN_BREAKPOINTS.small,
      isLargeScreen: screenHeight >= SCREEN_BREAKPOINTS.large,
    };
  }, [screenHeight, availableHeight]);

  // Layout validation and warnings
  const validateLayout = useCallback(() => {
    const warnings: string[] = [];
    
    // Check if total screen space allocation makes sense
    const totalScreenSpace = layoutConfig.reduce((sum, config) => sum + config.screenSpace, 0);
    
    if (totalScreenSpace > 1.2) {
      warnings.push('Total screen space allocation exceeds 120% - content may be cramped');
    }
    
    if (totalScreenSpace < 0.8) {
      warnings.push('Total screen space allocation under 80% - consider utilizing more space');
    }

    // Check for very small cards
    layoutConfig.forEach(config => {
      const height = getCardHeight(config.component);
      if (height < 80) {
        warnings.push(`${config.component} height (${height}px) may be too small for content`);
      }
    });

    return warnings;
  }, [layoutConfig, getCardHeight]);

  // Debug information for development
  const debugInfo = useMemo(() => ({
    ageGroup,
    screenHeight,
    availableHeight,
    layoutConfig: layoutConfig.map(config => ({
      ...config,
      calculatedHeight: getCardHeight(config.component),
    })),
    totalContentHeight,
    screenSizeInfo,
    ageSpecificAdaptations,
    warnings: validateLayout(),
  }), [
    ageGroup,
    screenHeight,
    availableHeight,
    layoutConfig,
    getCardHeight,
    totalContentHeight,
    screenSizeInfo,
    ageSpecificAdaptations,
    validateLayout,
  ]);

  return {
    // Main layout configuration
    layoutConfig: sortedComponents,
    
    // Utility functions
    getCardHeight,
    getCardOrder,
    
    // Layout metadata
    totalContentHeight,
    availableHeight,
    
    // Age-specific adaptations
    ageSpecificAdaptations,
    
    // Screen information
    screenSizeInfo,
    
    // Development helpers
    debugInfo,
    
    // Layout constants
    dimensions: DEFAULT_DIMENSIONS,
  };
};

export default useAgeAdaptiveLayout;