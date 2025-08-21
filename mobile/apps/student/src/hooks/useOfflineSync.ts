/**
 * Offline Sync Hook
 * Harry School Student Mobile App
 * 
 * Manages offline data synchronization and conflict resolution
 * Implements queue-based sync with retry logic and conflict handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { NetInfo, NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@harry-school/shared/services';

// Sync status types
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'conflicts';

// Offline action types
export interface OfflineAction {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  originalData?: any; // For conflict resolution
  studentId: string;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// Conflict resolution strategies
export type ConflictStrategy = 
  | 'last-write-wins' 
  | 'merge-fields' 
  | 'user-choice' 
  | 'server-wins' 
  | 'client-wins';

// Sync configuration
interface SyncConfig {
  maxRetries: number;
  retryDelayBase: number; // Base delay in ms
  maxRetryDelay: number; // Maximum delay in ms
  batchSize: number; // Number of actions to sync at once
  conflictStrategy: ConflictStrategy;
  enableAutoSync: boolean;
  syncInterval: number; // Auto-sync interval in ms
}

// Conflict resolution interface
interface SyncConflict {
  actionId: string;
  table: string;
  clientData: any;
  serverData: any;
  timestamp: number;
  resolved: boolean;
  resolution?: any;
}

// Default sync configuration
const DEFAULT_SYNC_CONFIG: SyncConfig = {
  maxRetries: 3,
  retryDelayBase: 1000,
  maxRetryDelay: 30000,
  batchSize: 10,
  conflictStrategy: 'last-write-wins',
  enableAutoSync: true,
  syncInterval: 30000, // 30 seconds
};

/**
 * Custom hook for managing offline synchronization
 * 
 * @param studentId - Student's unique identifier
 * @param config - Sync configuration options
 * @returns Sync state and management functions
 */
export const useOfflineSync = (
  studentId: string,
  config: Partial<SyncConfig> = {}
) => {
  // Merge config with defaults
  const syncConfig = { ...DEFAULT_SYNC_CONFIG, ...config };

  // State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [isOnline, setIsOnline] = useState(false);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncProgress, setSyncProgress] = useState({ completed: 0, total: 0 });

  // Refs for managing sync lifecycle
  const syncTimer = useRef<NodeJS.Timeout | null>(null);
  const isProcessing = useRef(false);
  const abortController = useRef<AbortController | null>(null);

  // Storage keys
  const getStorageKey = (suffix: string) => `offline_sync_${studentId}_${suffix}`;
  const ACTIONS_KEY = getStorageKey('actions');
  const CONFLICTS_KEY = getStorageKey('conflicts');
  const LAST_SYNC_KEY = getStorageKey('last_sync');

  // Load persisted data from storage
  const loadPersistedData = useCallback(async () => {
    try {
      const [actionsData, conflictsData, lastSyncData] = await Promise.all([
        AsyncStorage.getItem(ACTIONS_KEY),
        AsyncStorage.getItem(CONFLICTS_KEY),
        AsyncStorage.getItem(LAST_SYNC_KEY),
      ]);

      if (actionsData) {
        const actions = JSON.parse(actionsData);
        setPendingActions(actions);
      }

      if (conflictsData) {
        const conflictsList = JSON.parse(conflictsData);
        setConflicts(conflictsList);
      }

      if (lastSyncData) {
        setLastSyncTime(new Date(lastSyncData));
      }
    } catch (error) {
      console.error('Failed to load persisted sync data:', error);
    }
  }, [ACTIONS_KEY, CONFLICTS_KEY, LAST_SYNC_KEY]);

  // Persist data to storage
  const persistData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(ACTIONS_KEY, JSON.stringify(pendingActions)),
        AsyncStorage.setItem(CONFLICTS_KEY, JSON.stringify(conflicts)),
        lastSyncTime && AsyncStorage.setItem(LAST_SYNC_KEY, lastSyncTime.toISOString()),
      ]);
    } catch (error) {
      console.error('Failed to persist sync data:', error);
    }
  }, [pendingActions, conflicts, lastSyncTime, ACTIONS_KEY, CONFLICTS_KEY, LAST_SYNC_KEY]);

  // Add action to offline queue
  const queueAction = useCallback(async (
    type: OfflineAction['type'],
    table: string,
    data: any,
    originalData?: any
  ) => {
    const action: OfflineAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      table,
      data,
      originalData,
      studentId,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: syncConfig.maxRetries,
      status: 'pending',
    };

    setPendingActions(prev => [...prev, action]);

    // Trigger immediate sync if online
    if (isOnline && syncConfig.enableAutoSync) {
      processSyncQueue();
    }

    return action.id;
  }, [studentId, syncConfig, isOnline]);

  // Remove action from queue
  const removeAction = useCallback((actionId: string) => {
    setPendingActions(prev => prev.filter(action => action.id !== actionId));
  }, []);

  // Update action status
  const updateActionStatus = useCallback((
    actionId: string,
    status: OfflineAction['status'],
    error?: string
  ) => {
    setPendingActions(prev =>
      prev.map(action =>
        action.id === actionId
          ? { ...action, status, error, retries: status === 'failed' ? action.retries + 1 : action.retries }
          : action
      )
    );
  }, []);

  // Conflict resolution strategies
  const resolveConflict = useCallback((
    clientData: any,
    serverData: any,
    strategy: ConflictStrategy = syncConfig.conflictStrategy
  ) => {
    switch (strategy) {
      case 'server-wins':
        return serverData;
      
      case 'client-wins':
        return clientData;
      
      case 'last-write-wins':
        const clientTime = clientData.updated_at || clientData.created_at;
        const serverTime = serverData.updated_at || serverData.created_at;
        return new Date(clientTime) > new Date(serverTime) ? clientData : serverData;
      
      case 'merge-fields':
        // Merge non-conflicting fields, prefer client for user-specific data
        const merged = { ...serverData };
        Object.keys(clientData).forEach(key => {
          if (key.includes('student_') || key.includes('preference')) {
            merged[key] = clientData[key];
          }
        });
        return merged;
      
      case 'user-choice':
        // Create conflict for user to resolve
        return null;
      
      default:
        return serverData;
    }
  }, [syncConfig.conflictStrategy]);

  // Process individual action
  const processAction = useCallback(async (action: OfflineAction): Promise<boolean> => {
    try {
      updateActionStatus(action.id, 'processing');

      let result;
      
      switch (action.type) {
        case 'INSERT':
          result = await supabase
            .from(action.table)
            .insert(action.data)
            .select()
            .single();
          break;
        
        case 'UPDATE':
          result = await supabase
            .from(action.table)
            .update(action.data)
            .eq('id', action.data.id)
            .select()
            .single();
          break;
        
        case 'DELETE':
          result = await supabase
            .from(action.table)
            .delete()
            .eq('id', action.data.id);
          break;
      }

      if (result?.error) {
        // Check if it's a conflict (409 or version mismatch)
        if (result.error.code === '409' || result.error.message.includes('conflict')) {
          // Fetch current server data
          const { data: serverData } = await supabase
            .from(action.table)
            .select('*')
            .eq('id', action.data.id)
            .single();

          if (serverData) {
            const resolution = resolveConflict(action.data, serverData);
            
            if (resolution === null) {
              // User choice needed - create conflict
              const conflict: SyncConflict = {
                actionId: action.id,
                table: action.table,
                clientData: action.data,
                serverData,
                timestamp: Date.now(),
                resolved: false,
              };
              
              setConflicts(prev => [...prev, conflict]);
              setSyncStatus('conflicts');
              return false;
            } else {
              // Apply resolution
              const resolvedResult = await supabase
                .from(action.table)
                .update(resolution)
                .eq('id', action.data.id);
              
              if (resolvedResult.error) {
                throw resolvedResult.error;
              }
            }
          }
        } else {
          throw result.error;
        }
      }

      updateActionStatus(action.id, 'completed');
      return true;
      
    } catch (error: any) {
      console.error(`Failed to process action ${action.id}:`, error);
      updateActionStatus(action.id, 'failed', error.message);
      
      // Check if we should retry
      if (action.retries < action.maxRetries) {
        const delay = Math.min(
          syncConfig.retryDelayBase * Math.pow(2, action.retries),
          syncConfig.maxRetryDelay
        );
        
        setTimeout(() => {
          updateActionStatus(action.id, 'pending');
        }, delay);
      }
      
      return false;
    }
  }, [updateActionStatus, resolveConflict, syncConfig]);

  // Process sync queue
  const processSyncQueue = useCallback(async () => {
    if (!isOnline || isProcessing.current || pendingActions.length === 0) {
      return;
    }

    isProcessing.current = true;
    setSyncStatus('syncing');
    
    try {
      // Cancel any previous sync
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      // Get pending actions
      const actionsToProcess = pendingActions.filter(action => 
        action.status === 'pending' && action.retries < action.maxRetries
      );

      if (actionsToProcess.length === 0) {
        setSyncStatus('synced');
        return;
      }

      // Process in batches
      const totalActions = actionsToProcess.length;
      let completedActions = 0;

      for (let i = 0; i < actionsToProcess.length; i += syncConfig.batchSize) {
        const batch = actionsToProcess.slice(i, i + syncConfig.batchSize);
        
        const batchPromises = batch.map(action => processAction(action));
        const results = await Promise.allSettled(batchPromises);
        
        // Count successful actions
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            completedActions++;
          }
        });

        // Update progress
        setSyncProgress({
          completed: completedActions,
          total: totalActions,
        });

        // Remove completed actions
        const completedIds = batch
          .filter((_, index) => results[index].status === 'fulfilled')
          .map(action => action.id);
        
        if (completedIds.length > 0) {
          setPendingActions(prev =>
            prev.filter(action => !completedIds.includes(action.id))
          );
        }
      }

      // Update sync status
      const remainingActions = pendingActions.filter(action =>
        action.status === 'pending' || action.status === 'failed'
      );

      if (remainingActions.length === 0 && conflicts.length === 0) {
        setSyncStatus('synced');
      } else if (conflicts.length > 0) {
        setSyncStatus('conflicts');
      } else {
        setSyncStatus('error');
      }

      setLastSyncTime(new Date());
      
    } catch (error) {
      console.error('Sync queue processing failed:', error);
      setSyncStatus('error');
    } finally {
      isProcessing.current = false;
      setSyncProgress({ completed: 0, total: 0 });
    }
  }, [isOnline, pendingActions, conflicts.length, syncConfig, processAction]);

  // Handle network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = isOnline;
      const isCurrentlyOnline = state.isConnected ?? false;
      
      setIsOnline(isCurrentlyOnline);
      
      if (!wasOnline && isCurrentlyOnline) {
        // Just came online - trigger sync
        console.log('Device came online - triggering sync');
        setSyncStatus('syncing');
        setTimeout(() => processSyncQueue(), 1000); // Small delay to ensure connection is stable
      } else if (wasOnline && !isCurrentlyOnline) {
        // Just went offline
        console.log('Device went offline');
        setSyncStatus('offline');
      }
    });

    return unsubscribe;
  }, [isOnline, processSyncQueue]);

  // Auto-sync timer
  useEffect(() => {
    if (syncConfig.enableAutoSync && isOnline) {
      syncTimer.current = setInterval(() => {
        if (pendingActions.length > 0) {
          processSyncQueue();
        }
      }, syncConfig.syncInterval);
      
      return () => {
        if (syncTimer.current) {
          clearInterval(syncTimer.current);
        }
      };
    }
  }, [syncConfig.enableAutoSync, syncConfig.syncInterval, isOnline, pendingActions.length, processSyncQueue]);

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

  // Persist data when it changes
  useEffect(() => {
    persistData();
  }, [persistData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimer.current) {
        clearInterval(syncTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Resolve user conflicts
  const resolveUserConflict = useCallback(async (
    conflictId: string,
    resolution: any
  ) => {
    const conflict = conflicts.find(c => c.actionId === conflictId);
    if (!conflict) return;

    try {
      // Apply user's resolution
      const result = await supabase
        .from(conflict.table)
        .update(resolution)
        .eq('id', resolution.id);

      if (result.error) {
        throw result.error;
      }

      // Mark conflict as resolved
      setConflicts(prev =>
        prev.map(c =>
          c.actionId === conflictId
            ? { ...c, resolved: true, resolution }
            : c
        )
      );

      // Remove the corresponding action
      removeAction(conflictId);

      // Update status if no more conflicts
      if (conflicts.filter(c => !c.resolved && c.actionId !== conflictId).length === 0) {
        setSyncStatus(pendingActions.length > 0 ? 'syncing' : 'synced');
      }
      
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  }, [conflicts, pendingActions.length, removeAction]);

  // Clear all conflicts
  const clearConflicts = useCallback(() => {
    setConflicts([]);
    if (pendingActions.length === 0) {
      setSyncStatus('synced');
    }
  }, [pendingActions.length]);

  // Get sync diagnostics
  const getSyncDiagnostics = useCallback(() => {
    return {
      syncStatus,
      isOnline,
      pendingActions: pendingActions.length,
      conflicts: conflicts.length,
      lastSyncTime,
      syncProgress,
      isProcessing: isProcessing.current,
      config: syncConfig,
    };
  }, [syncStatus, isOnline, pendingActions.length, conflicts.length, lastSyncTime, syncProgress, syncConfig]);

  return {
    // State
    syncStatus,
    isOnline,
    pendingActions,
    conflicts: conflicts.filter(c => !c.resolved),
    lastSyncTime,
    syncProgress,
    
    // Actions
    queueAction,
    processSyncQueue,
    resolveUserConflict,
    clearConflicts,
    removeAction,
    
    // Diagnostics
    getSyncDiagnostics,
  };
};

export default useOfflineSync;