import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../services/supabase';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  groupId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  teacherId: string;
  synced: boolean;
  timestamp: number;
}

interface OfflineQueue {
  records: AttendanceRecord[];
  pending: boolean;
}

export const useAttendanceSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online ?? false);
      
      if (online) {
        syncPendingRecords();
      }
    });

    // Initial sync check
    loadPendingCount();
    
    return unsubscribe;
  }, []);

  const loadPendingCount = async () => {
    try {
      const queue = await AsyncStorage.getItem('attendance_queue');
      if (queue) {
        const parsedQueue: OfflineQueue = JSON.parse(queue);
        setPendingCount(parsedQueue.records.length);
      }
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  const addToQueue = async (record: AttendanceRecord) => {
    try {
      const existingQueue = await AsyncStorage.getItem('attendance_queue');
      const queue: OfflineQueue = existingQueue 
        ? JSON.parse(existingQueue) 
        : { records: [], pending: false };

      // Remove existing record for same student/date if exists
      queue.records = queue.records.filter(
        r => !(r.studentId === record.studentId && r.date === record.date)
      );
      
      queue.records.push(record);
      
      await AsyncStorage.setItem('attendance_queue', JSON.stringify(queue));
      setPendingCount(queue.records.length);
      
      if (isOnline && !queue.pending) {
        syncPendingRecords();
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  };

  const syncPendingRecords = async () => {
    if (!isOnline) return;
    
    try {
      setSyncStatus('syncing');
      
      const queue = await AsyncStorage.getItem('attendance_queue');
      if (!queue) {
        setSyncStatus('idle');
        return;
      }

      const parsedQueue: OfflineQueue = JSON.parse(queue);
      if (parsedQueue.records.length === 0) {
        setSyncStatus('idle');
        return;
      }

      // Mark as pending to prevent concurrent syncs
      parsedQueue.pending = true;
      await AsyncStorage.setItem('attendance_queue', JSON.stringify(parsedQueue));

      const syncedRecords: string[] = [];
      
      for (const record of parsedQueue.records) {
        try {
          const { error } = await supabase
            .from('attendance')
            .upsert({
              id: record.id,
              student_id: record.studentId,
              group_id: record.groupId,
              date: record.date,
              status: record.status,
              teacher_id: record.teacherId,
              created_at: new Date(record.timestamp).toISOString(),
              updated_at: new Date().toISOString()
            });

          if (!error) {
            syncedRecords.push(record.id);
          }
        } catch (syncError) {
          console.error('Error syncing record:', record.id, syncError);
        }
      }

      // Remove successfully synced records
      const remainingRecords = parsedQueue.records.filter(
        r => !syncedRecords.includes(r.id)
      );

      await AsyncStorage.setItem('attendance_queue', JSON.stringify({
        records: remainingRecords,
        pending: false
      }));

      setPendingCount(remainingRecords.length);
      setSyncStatus('idle');
      
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      
      // Reset pending flag on error
      try {
        const queue = await AsyncStorage.getItem('attendance_queue');
        if (queue) {
          const parsedQueue: OfflineQueue = JSON.parse(queue);
          parsedQueue.pending = false;
          await AsyncStorage.setItem('attendance_queue', JSON.stringify(parsedQueue));
        }
      } catch (resetError) {
        console.error('Error resetting pending flag:', resetError);
      }
    }
  };

  const forceSyncAll = async (): Promise<boolean> => {
    if (!isOnline) return false;
    
    await syncPendingRecords();
    return syncStatus !== 'error';
  };

  const clearQueue = async () => {
    try {
      await AsyncStorage.removeItem('attendance_queue');
      setPendingCount(0);
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  };

  return {
    isOnline,
    syncStatus,
    pendingCount,
    addToQueue,
    syncPendingRecords,
    forceSyncAll,
    clearQueue
  };
};