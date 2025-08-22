import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { MMKV } from 'react-native-mmkv';
import { BundleSizeAnalyzer, BundleSplittingManager } from '../utils/BundleOptimizer';
import { useEducationalCodeSplitting } from '../hooks/useCodeSplitting';

const { width: screenWidth } = Dimensions.get('window');

interface BundleMonitorProps {
  userType: 'student' | 'teacher' | 'admin';
  visible: boolean;
  onClose: () => void;
  culturalTheme?: 'islamic' | 'modern' | 'educational';
  enableRealTimeMonitoring?: boolean;
}

interface BundleMetrics {
  totalSize: number;
  loadedChunks: number;
  failedChunks: number;
  cacheHits: number;
  averageLoadTime: number;
  memoryUsage: number;
  networkRequests: number;
}

const BundleMonitor: React.FC<BundleMonitorProps> = memo(({
  userType,
  visible,
  onClose,
  culturalTheme = 'modern',
  enableRealTimeMonitoring = true,
}) => {
  const [metrics, setMetrics] = useState<BundleMetrics>({
    totalSize: 0,
    loadedChunks: 0,
    failedChunks: 0,
    cacheHits: 0,
    averageLoadTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
  });
  
  const [chunkDetails, setChunkDetails] = useState<Array<{
    name: string;
    size: number;
    loadTime: number;
    status: 'loaded' | 'loading' | 'failed' | 'cached';
    priority: 'critical' | 'high' | 'normal' | 'low';
  }>>([]);

  const [selectedChunk, setSelectedChunk] = useState<string | null>(null);
  const [showOptimizationTips, setShowOptimizationTips] = useState(false);

  const codeSplitting = useEducationalCodeSplitting(userType);
  const bundleAnalyzer = BundleSizeAnalyzer.getInstance();
  const bundleManager = BundleSplittingManager.getInstance({ userType });

  // Animation values
  const fadeOpacity = useSharedValue(0);
  const scaleValue = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      fadeOpacity.value = withTiming(1, { duration: 300 });
      scaleValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    } else {
      fadeOpacity.value = withTiming(0, { duration: 200 });
      scaleValue.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible]);

  // Real-time metrics collection
  useEffect(() => {
    if (!enableRealTimeMonitoring || !visible) return;

    const collectMetrics = () => {
      try {
        // Get bundle statistics
        const bundleStats = bundleManager.getBundleStats();
        const codeSplittingStats = codeSplitting.getStatistics();
        const sizeRecommendations = bundleAnalyzer.getBundleSizeRecommendations();

        setMetrics({
          totalSize: sizeRecommendations.totalBundleSize,
          loadedChunks: bundleStats.totalLoadedChunks,
          failedChunks: codeSplittingStats.failedChunks,
          cacheHits: bundleStats.cacheHits,
          averageLoadTime: codeSplittingStats.averageLoadTime,
          memoryUsage: getMemoryUsage(),
          networkRequests: getNetworkRequestCount(),
        });

        // Simulate chunk details (in production, this would come from actual bundle analysis)
        const mockChunkDetails = generateMockChunkDetails(userType, bundleStats, codeSplittingStats);
        setChunkDetails(mockChunkDetails);

      } catch (error) {
        console.warn('Failed to collect bundle metrics:', error);
      }
    };

    // Initial collection
    collectMetrics();

    // Real-time updates every 2 seconds
    const interval = setInterval(collectMetrics, 2000);

    return () => clearInterval(interval);
  }, [visible, enableRealTimeMonitoring, userType, bundleManager, codeSplitting, bundleAnalyzer]);

  const getCulturalColors = () => {
    switch (culturalTheme) {
      case 'islamic':
        return {
          primary: '#1d7452',
          secondary: '#22c55e',
          accent: '#dcfce7',
          background: '#f0f9f0',
          success: '#16a34a',
          warning: '#d97706',
          error: '#dc2626',
          text: '#1f2937',
        };
      case 'educational':
        return {
          primary: '#2563eb',
          secondary: '#3b82f6',
          accent: '#dbeafe',
          background: '#f0f4ff',
          success: '#059669',
          warning: '#d97706',
          error: '#dc2626',
          text: '#1f2937',
        };
      default:
        return {
          primary: '#6b7280',
          secondary: '#9ca3af',
          accent: '#f3f4f6',
          background: '#ffffff',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          text: '#111827',
        };
    }
  };

  const colors = getCulturalColors();

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
    transform: [{ scale: scaleValue.value }],
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loaded': return colors.success;
      case 'loading': return colors.warning;
      case 'failed': return colors.error;
      case 'cached': return colors.primary;
      default: return colors.secondary;
    }
  };

  const formatSize = (sizeInKB: number) => {
    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(1)}KB`;
    }
    return `${(sizeInKB / 1024).toFixed(1)}MB`;
  };

  const handleOptimizeBundle = () => {
    Alert.alert(
      'Bundle Optimization',
      'This will clear cache and optimize bundle loading. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Optimize',
          onPress: () => {
            bundleManager.clearBundleCache();
            codeSplitting.clearChunkCache();
            bundleAnalyzer.clearSizeTracking();
            Alert.alert('Success', 'Bundle optimization completed!');
          },
        },
      ]
    );
  };

  const renderMetricCard = (title: string, value: string | number, color: string, subtitle?: string) => (
    <View style={[styles.metricCard, { backgroundColor: colors.accent, borderColor: color }]}>
      <Text style={[styles.metricTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={[styles.metricSubtitle, { color: colors.secondary }]}>{subtitle}</Text>}
    </View>
  );

  const renderChunkItem = (chunk: typeof chunkDetails[0]) => (
    <Pressable
      key={chunk.name}
      style={[
        styles.chunkItem,
        { backgroundColor: colors.background, borderColor: getStatusColor(chunk.status) }
      ]}
      onPress={() => setSelectedChunk(chunk.name === selectedChunk ? null : chunk.name)}
    >
      <View style={styles.chunkHeader}>
        <Text style={[styles.chunkName, { color: colors.text }]}>{chunk.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(chunk.status) }]}>
          <Text style={styles.statusText}>{chunk.status}</Text>
        </View>
      </View>
      <View style={styles.chunkDetails}>
        <Text style={[styles.chunkInfo, { color: colors.secondary }]}>
          Size: {formatSize(chunk.size)} • Load: {chunk.loadTime}ms • Priority: {chunk.priority}
        </Text>
      </View>
      {selectedChunk === chunk.name && (
        <View style={[styles.expandedDetails, { backgroundColor: colors.accent }]}>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Detailed analysis for {chunk.name} chunk
          </Text>
          <Text style={[styles.detailText, { color: colors.secondary }]}>
            • Bundle contribution: {((chunk.size / metrics.totalSize) * 100).toFixed(1)}%
          </Text>
          <Text style={[styles.detailText, { color: colors.secondary }]}>
            • Load performance: {chunk.loadTime < 100 ? 'Excellent' : chunk.loadTime < 300 ? 'Good' : 'Needs optimization'}
          </Text>
        </View>
      )}
    </Pressable>
  );

  const renderOptimizationTips = () => (
    <Modal visible={showOptimizationTips} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.tipsModal, { backgroundColor: colors.background }]}>
          <Text style={[styles.tipsTitle, { color: colors.primary }]}>Optimization Tips</Text>
          <ScrollView style={styles.tipsContent}>
            <Text style={[styles.tipText, { color: colors.text }]}>
              🚀 <Text style={styles.tipTitle}>Code Splitting:</Text> Break large chunks into smaller ones
            </Text>
            <Text style={[styles.tipText, { color: colors.text }]}>
              📦 <Text style={styles.tipTitle}>Tree Shaking:</Text> Remove unused code and imports
            </Text>
            <Text style={[styles.tipText, { color: colors.text }]}>
              💾 <Text style={styles.tipTitle}>Caching:</Text> Enable aggressive caching for better performance
            </Text>
            <Text style={[styles.tipText, { color: colors.text }]}>
              📱 <Text style={styles.tipTitle}>Mobile Optimization:</Text> Reduce bundle size for mobile devices
            </Text>
            <Text style={[styles.tipText, { color: colors.text }]}>
              🕒 <Text style={styles.tipTitle}>Prayer Time Aware:</Text> Optimize builds during prayer times
            </Text>
            <Text style={[styles.tipText, { color: colors.text }]}>
              📚 <Text style={styles.tipTitle}>Educational Context:</Text> Prioritize user-specific features
            </Text>
          </ScrollView>
          <Pressable
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowOptimizationTips(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { backgroundColor: colors.background }, containerStyle]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.accent }]}>
            <Text style={[styles.title, { color: colors.primary }]}>
              Bundle Monitor - {userType.charAt(0).toUpperCase() + userType.slice(1)}
            </Text>
            <Pressable style={styles.closeIcon} onPress={onClose}>
              <Text style={[styles.closeIconText, { color: colors.secondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content}>
            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              {renderMetricCard('Total Size', formatSize(metrics.totalSize), colors.primary)}
              {renderMetricCard('Loaded Chunks', metrics.loadedChunks, colors.success)}
              {renderMetricCard('Cache Hits', metrics.cacheHits, colors.secondary)}
              {renderMetricCard('Avg Load Time', `${metrics.averageLoadTime}ms`, colors.warning)}
            </View>

            {/* Performance Score */}
            <View style={[styles.performanceCard, { backgroundColor: colors.accent }]}>
              <Text style={[styles.performanceTitle, { color: colors.text }]}>Performance Score</Text>
              <Text style={[styles.performanceScore, { color: getPerformanceColor() }]}>
                {calculatePerformanceScore()}/100
              </Text>
              <Text style={[styles.performanceDescription, { color: colors.secondary }]}>
                {getPerformanceDescription()}
              </Text>
            </View>

            {/* Chunk Details */}
            <View style={styles.chunksSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Chunk Details</Text>
              {chunkDetails.map(renderChunkItem)}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleOptimizeBundle}
              >
                <Text style={styles.actionButtonText}>Optimize Bundle</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                onPress={() => setShowOptimizationTips(true)}
              >
                <Text style={styles.actionButtonText}>View Tips</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>

      {renderOptimizationTips()}
    </Modal>
  );

  function getPerformanceColor() {
    const score = calculatePerformanceScore();
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  }

  function calculatePerformanceScore(): number {
    let score = 100;
    
    // Penalize large bundle size
    if (metrics.totalSize > 500) score -= 20;
    else if (metrics.totalSize > 300) score -= 10;
    
    // Penalize slow load times
    if (metrics.averageLoadTime > 500) score -= 20;
    else if (metrics.averageLoadTime > 200) score -= 10;
    
    // Penalize failed chunks
    score -= metrics.failedChunks * 5;
    
    // Reward cache efficiency
    const cacheEfficiency = metrics.cacheHits / Math.max(metrics.loadedChunks, 1);
    if (cacheEfficiency > 0.8) score += 10;
    else if (cacheEfficiency > 0.6) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  function getPerformanceDescription(): string {
    const score = calculatePerformanceScore();
    if (score >= 80) return 'Excellent bundle performance';
    if (score >= 60) return 'Good performance, minor optimizations needed';
    return 'Bundle needs optimization';
  }
});

// Helper functions
const getMemoryUsage = (): number => {
  // Simplified memory usage calculation
  // In production, would use actual memory profiling
  return Math.random() * 50 + 20; // MB
};

const getNetworkRequestCount = (): number => {
  // Simplified network request count
  return Math.floor(Math.random() * 10) + 5;
};

const generateMockChunkDetails = (
  userType: string,
  bundleStats: any,
  codeSplittingStats: any
) => {
  const baseChunks = [
    { name: 'main', size: 150, loadTime: 100, status: 'loaded' as const, priority: 'critical' as const },
    { name: 'vendor', size: 200, loadTime: 150, status: 'loaded' as const, priority: 'high' as const },
    { name: 'common', size: 80, loadTime: 80, status: 'cached' as const, priority: 'normal' as const },
  ];

  const userSpecificChunks = {
    student: [
      { name: 'dashboard', size: 120, loadTime: 90, status: 'loaded' as const, priority: 'critical' as const },
      { name: 'lessons', size: 180, loadTime: 120, status: 'loaded' as const, priority: 'high' as const },
      { name: 'vocabulary', size: 100, loadTime: 85, status: 'cached' as const, priority: 'high' as const },
    ],
    teacher: [
      { name: 'teacher-dashboard', size: 140, loadTime: 95, status: 'loaded' as const, priority: 'critical' as const },
      { name: 'attendance', size: 90, loadTime: 70, status: 'cached' as const, priority: 'high' as const },
      { name: 'evaluations', size: 110, loadTime: 100, status: 'loading' as const, priority: 'normal' as const },
    ],
    admin: [
      { name: 'admin-dashboard', size: 160, loadTime: 110, status: 'loaded' as const, priority: 'critical' as const },
      { name: 'user-management', size: 130, loadTime: 105, status: 'loaded' as const, priority: 'high' as const },
      { name: 'reports', size: 95, loadTime: 88, status: 'failed' as const, priority: 'low' as const },
    ],
  };

  return [...baseChunks, ...(userSpecificChunks[userType as keyof typeof userSpecificChunks] || [])];
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeIcon: {
    padding: 4,
  },
  closeIconText: {
    fontSize: 18,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  performanceCard: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  performanceScore: {
    fontSize: 32,
    fontWeight: '800',
  },
  performanceDescription: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  chunksSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chunkItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  chunkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chunkName: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  chunkDetails: {
    marginTop: 4,
  },
  chunkInfo: {
    fontSize: 12,
  },
  expandedDetails: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 12,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tipsModal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  tipsContent: {
    flex: 1,
  },
  tipText: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  tipTitle: {
    fontWeight: '600',
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BundleMonitor;