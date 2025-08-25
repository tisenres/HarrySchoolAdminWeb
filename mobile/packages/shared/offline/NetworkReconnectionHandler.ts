import { EventEmitter } from 'events';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { OfflineManager } from './OfflineManager';
import { SyncService } from './SyncService';
import { CacheManager } from './CacheManager';

export interface NetworkConfig {
  autoSyncOnReconnection: boolean;
  syncDelayAfterReconnection: number; // in milliseconds
  maxRetryAttempts: number;
  retryBackoffMultiplier: number;
  culturalAwareness: boolean;
  educationalPriority: boolean;
  batteryOptimization: boolean;
  wifiOnlySync: boolean;
}

export interface NetworkState {
  isConnected: boolean;
  connectionType: string;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  previousState?: NetworkState;
  lastConnectedAt?: number;
  lastDisconnectedAt?: number;
  connectionDuration: number;
  disconnectionDuration: number;
  culturallyAppropriateTiming: boolean;
  educationallyOptimalTiming: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface SyncContext {
  trigger: 'reconnection' | 'manual' | 'scheduled' | 'cultural' | 'educational';
  priority: 'immediate' | 'high' | 'medium' | 'low' | 'background';
  culturallyScheduled: boolean;
  educationallyPrioritized: boolean;
  operationCount: number;
  estimatedDuration: number;
  batteryImpact: 'minimal' | 'low' | 'medium' | 'high';
}

export interface ReconnectionStrategy {
  syncImmediate: boolean;
  syncDelayed: boolean;
  delayDuration: number;
  culturalDelay: boolean;
  educationalDelay: boolean;
  batchOperations: boolean;
  prioritizeOperations: boolean;
  respectBatteryLevel: boolean;
  requireWifi: boolean;
}

export class NetworkReconnectionHandler extends EventEmitter {
  private readonly config: NetworkConfig;
  private readonly offlineManager: OfflineManager;
  private readonly syncService: SyncService;
  private readonly cacheManager: CacheManager;
  
  private networkState: NetworkState;
  private netInfoSubscription?: NetInfoSubscription;
  private appStateSubscription?: any;
  private syncTimeout?: NodeJS.Timeout;
  private retryAttempts: number = 0;
  private syncInProgress: boolean = false;
  private lastSyncAttempt?: number;
  private culturalScheduler: CulturalReconnectionScheduler;
  private educationalScheduler: EducationalReconnectionScheduler;
  private batteryMonitor: BatteryMonitor;

  constructor(
    config: NetworkConfig,
    offlineManager: OfflineManager,
    syncService: SyncService,
    cacheManager: CacheManager
  ) {
    super();
    
    this.config = {
      autoSyncOnReconnection: true,
      syncDelayAfterReconnection: 2000, // 2 seconds
      maxRetryAttempts: 3,
      retryBackoffMultiplier: 2,
      culturalAwareness: true,
      educationalPriority: true,
      batteryOptimization: true,
      wifiOnlySync: false,
      ...config
    };

    this.offlineManager = offlineManager;
    this.syncService = syncService;
    this.cacheManager = cacheManager;

    this.networkState = {
      isConnected: false,
      connectionType: 'none',
      connectionQuality: 'poor',
      connectionDuration: 0,
      disconnectionDuration: 0,
      culturallyAppropriateTiming: true,
      educationallyOptimalTiming: false
    };

    this.culturalScheduler = new CulturalReconnectionScheduler();
    this.educationalScheduler = new EducationalReconnectionScheduler();
    this.batteryMonitor = new BatteryMonitor();

    this.initializeNetworkMonitoring();
    this.initializeAppStateMonitoring();
  }

  private initializeNetworkMonitoring(): void {
    this.netInfoSubscription = NetInfo.addEventListener(
      (state: NetInfoState) => this.handleNetworkStateChange(state)
    );

    // Get initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      this.handleNetworkStateChange(state, true);
    });
  }

  private initializeAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => this.handleAppStateChange(nextAppState)
    );
  }

  private async handleNetworkStateChange(
    state: NetInfoState, 
    isInitial: boolean = false
  ): Promise<void> {
    const previousState = { ...this.networkState };
    const now = Date.now();

    // Update network state
    this.networkState = {
      ...this.networkState,
      previousState,
      isConnected: state.isConnected || false,
      connectionType: state.type || 'none',
      connectionQuality: this.assessConnectionQuality(state),
      culturallyAppropriateTiming: await this.culturalScheduler.isAppropriateTiming(),
      educationallyOptimalTiming: await this.educationalScheduler.isOptimalTiming(),
      batteryLevel: await this.batteryMonitor.getBatteryLevel(),
      isCharging: await this.batteryMonitor.isCharging()
    };

    // Calculate durations
    if (this.networkState.isConnected && !previousState.isConnected) {
      // Just connected
      this.networkState.lastConnectedAt = now;
      this.networkState.disconnectionDuration = 
        previousState.lastDisconnectedAt ? now - previousState.lastDisconnectedAt : 0;
    } else if (!this.networkState.isConnected && previousState.isConnected) {
      // Just disconnected
      this.networkState.lastDisconnectedAt = now;
      this.networkState.connectionDuration = 
        previousState.lastConnectedAt ? now - previousState.lastConnectedAt : 0;
    }

    this.emit('network:state_changed', {
      current: this.networkState,
      previous: previousState,
      isReconnection: this.networkState.isConnected && !previousState.isConnected,
      isInitial
    });

    // Handle reconnection if not initial load
    if (!isInitial && this.networkState.isConnected && !previousState.isConnected) {
      await this.handleReconnection();
    }

    // Handle disconnection
    if (!isInitial && !this.networkState.isConnected && previousState.isConnected) {
      await this.handleDisconnection();
    }
  }

  private async handleReconnection(): Promise<void> {
    try {
      this.emit('network:reconnected', {
        networkState: this.networkState,
        disconnectionDuration: this.networkState.disconnectionDuration,
        culturallyAppropriate: this.networkState.culturallyAppropriateTiming,
        educationallyOptimal: this.networkState.educationallyOptimalTiming
      });

      if (!this.config.autoSyncOnReconnection) {
        return;
      }

      const strategy = await this.determineReconnectionStrategy();
      
      if (strategy.syncImmediate && await this.canSyncImmediately()) {
        await this.performImmediateSync();
      } else if (strategy.syncDelayed) {
        await this.scheduleDelayedSync(strategy);
      }

    } catch (error) {
      this.emit('network:reconnection_error', { error, networkState: this.networkState });
    }
  }

  private async handleDisconnection(): Promise<void> {
    try {
      // Cancel any pending sync operations
      if (this.syncTimeout) {
        clearTimeout(this.syncTimeout);
        this.syncTimeout = undefined;
      }

      // Pause ongoing sync if in progress
      if (this.syncInProgress) {
        await this.syncService.pauseSync();
        this.syncInProgress = false;
      }

      this.emit('network:disconnected', {
        networkState: this.networkState,
        connectionDuration: this.networkState.connectionDuration,
        operationsQueued: await this.offlineManager.getQueuedOperationsCount()
      });

    } catch (error) {
      this.emit('network:disconnection_error', { error, networkState: this.networkState });
    }
  }

  private async determineReconnectionStrategy(): Promise<ReconnectionStrategy> {
    const queuedOperationsCount = await this.offlineManager.getQueuedOperationsCount();
    const culturallyAppropriate = this.networkState.culturallyAppropriateTiming;
    const educationallyOptimal = this.networkState.educationallyOptimalTiming;
    const batteryLevel = this.networkState.batteryLevel || 100;
    const isCharging = this.networkState.isCharging || false;
    const isWifi = this.networkState.connectionType === 'wifi';

    // Cultural considerations
    const culturalDelay = this.config.culturalAwareness && !culturallyAppropriate;
    
    // Educational considerations
    const educationalDelay = this.config.educationalPriority && 
      queuedOperationsCount > 10 && !educationallyOptimal;

    // Battery considerations
    const batteryDelay = this.config.batteryOptimization && 
      batteryLevel < 20 && !isCharging;

    // Connection type considerations
    const connectionDelay = this.config.wifiOnlySync && !isWifi;

    const shouldDelay = culturalDelay || educationalDelay || batteryDelay || connectionDelay;
    
    const strategy: ReconnectionStrategy = {
      syncImmediate: !shouldDelay && queuedOperationsCount > 0,
      syncDelayed: shouldDelay && queuedOperationsCount > 0,
      delayDuration: this.calculateDelayDuration(culturalDelay, educationalDelay),
      culturalDelay,
      educationalDelay,
      batchOperations: queuedOperationsCount > 5,
      prioritizeOperations: true,
      respectBatteryLevel: batteryLevel < 30,
      requireWifi: this.config.wifiOnlySync
    };

    this.emit('network:strategy_determined', { strategy, networkState: this.networkState });
    
    return strategy;
  }

  private calculateDelayDuration(
    culturalDelay: boolean, 
    educationalDelay: boolean
  ): number {
    let delay = this.config.syncDelayAfterReconnection;

    if (culturalDelay) {
      // Delay until after prayer time (typically 30 minutes)
      delay = Math.max(delay, 30 * 60 * 1000);
    }

    if (educationalDelay) {
      // Delay until optimal educational time (school hours)
      delay = Math.max(delay, this.educationalScheduler.getDelayUntilOptimalTime());
    }

    return delay;
  }

  private async canSyncImmediately(): Promise<boolean> {
    // Check if sync is already in progress
    if (this.syncInProgress) {
      return false;
    }

    // Check cultural appropriateness
    if (this.config.culturalAwareness && !this.networkState.culturallyAppropriateTiming) {
      return false;
    }

    // Check battery level
    if (this.config.batteryOptimization) {
      const batteryLevel = this.networkState.batteryLevel || 100;
      const isCharging = this.networkState.isCharging || false;
      
      if (batteryLevel < 15 && !isCharging) {
        return false;
      }
    }

    // Check connection type
    if (this.config.wifiOnlySync && this.networkState.connectionType !== 'wifi') {
      return false;
    }

    // Check connection quality
    if (this.networkState.connectionQuality === 'poor') {
      return false;
    }

    return true;
  }

  private async performImmediateSync(): Promise<void> {
    try {
      this.syncInProgress = true;
      this.retryAttempts = 0;
      this.lastSyncAttempt = Date.now();

      const syncContext: SyncContext = {
        trigger: 'reconnection',
        priority: 'immediate',
        culturallyScheduled: this.networkState.culturallyAppropriateTiming,
        educationallyPrioritized: this.networkState.educationallyOptimalTiming,
        operationCount: await this.offlineManager.getQueuedOperationsCount(),
        estimatedDuration: await this.estimateSyncDuration(),
        batteryImpact: this.assessBatteryImpact()
      };

      this.emit('sync:started', { context: syncContext, networkState: this.networkState });

      // Perform the sync
      await this.syncService.performFullSync({
        culturallyScheduled: syncContext.culturallyScheduled,
        educationallyPrioritized: syncContext.educationallyPrioritized,
        batchOperations: true,
        respectBattery: this.config.batteryOptimization
      });

      this.syncInProgress = false;
      this.retryAttempts = 0;

      this.emit('sync:completed', { 
        context: syncContext, 
        duration: Date.now() - this.lastSyncAttempt!,
        networkState: this.networkState 
      });

    } catch (error) {
      this.syncInProgress = false;
      await this.handleSyncError(error);
    }
  }

  private async scheduleDelayedSync(strategy: ReconnectionStrategy): Promise<void> {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    const delay = strategy.delayDuration;

    this.emit('sync:scheduled', {
      delay,
      strategy,
      networkState: this.networkState,
      scheduledFor: new Date(Date.now() + delay)
    });

    this.syncTimeout = setTimeout(async () => {
      try {
        if (await this.canSyncImmediately()) {
          await this.performImmediateSync();
        } else {
          // Reschedule if conditions are still not met
          const newStrategy = await this.determineReconnectionStrategy();
          if (newStrategy.syncDelayed) {
            await this.scheduleDelayedSync(newStrategy);
          }
        }
      } catch (error) {
        this.emit('sync:scheduled_error', { error, strategy, networkState: this.networkState });
      }
    }, delay);
  }

  private async handleSyncError(error: any): Promise<void> {
    this.retryAttempts++;

    this.emit('sync:error', {
      error,
      attempt: this.retryAttempts,
      maxAttempts: this.config.maxRetryAttempts,
      networkState: this.networkState
    });

    if (this.retryAttempts < this.config.maxRetryAttempts) {
      const retryDelay = this.config.syncDelayAfterReconnection * 
        Math.pow(this.config.retryBackoffMultiplier, this.retryAttempts - 1);

      this.emit('sync:retry_scheduled', {
        attempt: this.retryAttempts,
        delay: retryDelay,
        networkState: this.networkState
      });

      setTimeout(async () => {
        if (this.networkState.isConnected && await this.canSyncImmediately()) {
          await this.performImmediateSync();
        }
      }, retryDelay);

    } else {
      this.emit('sync:failed', {
        error,
        attempts: this.retryAttempts,
        networkState: this.networkState
      });
      
      // Reset retry attempts after failure
      this.retryAttempts = 0;
    }
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active') {
      // App became active, check network state
      NetInfo.fetch().then((state: NetInfoState) => {
        this.handleNetworkStateChange(state);
      });
    }
  }

  private assessConnectionQuality(state: NetInfoState): 'poor' | 'fair' | 'good' | 'excellent' {
    if (!state.isConnected) return 'poor';

    // For WiFi connections
    if (state.type === 'wifi' && state.details) {
      const strength = (state.details as any).strength || 0;
      if (strength > 80) return 'excellent';
      if (strength > 60) return 'good';
      if (strength > 40) return 'fair';
      return 'poor';
    }

    // For cellular connections
    if (state.type === 'cellular' && state.details) {
      const cellularGeneration = (state.details as any).cellularGeneration;
      if (cellularGeneration === '5g') return 'excellent';
      if (cellularGeneration === '4g') return 'good';
      if (cellularGeneration === '3g') return 'fair';
      return 'poor';
    }

    // Default assessment
    return 'fair';
  }

  private async estimateSyncDuration(): Promise<number> {
    const operationCount = await this.offlineManager.getQueuedOperationsCount();
    const baseTimePerOperation = 100; // ms
    const qualityMultiplier = this.getQualityMultiplier();
    
    return operationCount * baseTimePerOperation * qualityMultiplier;
  }

  private getQualityMultiplier(): number {
    switch (this.networkState.connectionQuality) {
      case 'excellent': return 1;
      case 'good': return 1.5;
      case 'fair': return 2;
      case 'poor': return 3;
      default: return 2;
    }
  }

  private assessBatteryImpact(): 'minimal' | 'low' | 'medium' | 'high' {
    const operationCount = this.offlineManager.getQueuedOperationsCount();
    const connectionQuality = this.networkState.connectionQuality;

    if (operationCount < 5 && connectionQuality === 'excellent') return 'minimal';
    if (operationCount < 10 && connectionQuality !== 'poor') return 'low';
    if (operationCount < 20) return 'medium';
    return 'high';
  }

  public async forceSyncNow(): Promise<void> {
    if (!this.networkState.isConnected) {
      throw new Error('Cannot sync without network connection');
    }

    this.emit('sync:force_requested', { networkState: this.networkState });
    await this.performImmediateSync();
  }

  public async pauseAutoSync(): Promise<void> {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = undefined;
    }

    if (this.syncInProgress) {
      await this.syncService.pauseSync();
      this.syncInProgress = false;
    }

    this.emit('sync:paused', { networkState: this.networkState });
  }

  public async resumeAutoSync(): Promise<void> {
    if (this.networkState.isConnected && !this.syncInProgress) {
      const strategy = await this.determineReconnectionStrategy();
      
      if (strategy.syncImmediate && await this.canSyncImmediately()) {
        await this.performImmediateSync();
      } else if (strategy.syncDelayed) {
        await this.scheduleDelayedSync(strategy);
      }
    }

    this.emit('sync:resumed', { networkState: this.networkState });
  }

  public getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  public isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  public destroy(): void {
    if (this.netInfoSubscription) {
      this.netInfoSubscription();
      this.netInfoSubscription = undefined;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = undefined;
    }

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = undefined;
    }

    this.removeAllListeners();
    this.emit('network:handler_destroyed');
  }
}

class CulturalReconnectionScheduler {
  async isAppropriateTiming(): Promise<boolean> {
    const now = new Date();
    const hour = now.getHours();
    
    // Avoid prayer times (approximate)
    const prayerHours = [5, 12, 15, 18, 20];
    const isPrayerTime = prayerHours.some(prayerHour => 
      Math.abs(hour - prayerHour) < 0.5
    );
    
    return !isPrayerTime;
  }

  getDelayUntilAppropriateTiming(): number {
    // Implementation would calculate delay until next appropriate time
    return 30 * 60 * 1000; // 30 minutes default
  }
}

class EducationalReconnectionScheduler {
  async isOptimalTiming(): Promise<boolean> {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // School hours: 8 AM to 6 PM, Monday to Friday
    return day >= 1 && day <= 5 && hour >= 8 && hour <= 18;
  }

  getDelayUntilOptimalTime(): number {
    const now = new Date();
    const nextSchoolDay = new Date(now);
    
    // If it's weekend, wait until Monday
    if (now.getDay() === 0) { // Sunday
      nextSchoolDay.setDate(now.getDate() + 1);
    } else if (now.getDay() === 6) { // Saturday
      nextSchoolDay.setDate(now.getDate() + 2);
    }
    
    // Set to 8 AM
    nextSchoolDay.setHours(8, 0, 0, 0);
    
    return Math.max(0, nextSchoolDay.getTime() - now.getTime());
  }
}

class BatteryMonitor {
  async getBatteryLevel(): Promise<number> {
    // Implementation would use native battery API
    // For now, return a default value
    return 80;
  }

  async isCharging(): Promise<boolean> {
    // Implementation would use native charging status API
    // For now, return false
    return false;
  }
}

export default NetworkReconnectionHandler;