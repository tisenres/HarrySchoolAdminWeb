import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../services/supabase';
import { attendanceCache } from '../services/attendanceCache';
import { offlineQueue } from '../services/offlineQueue';

interface Student {
  id: string;
  name: string;
  photo_url?: string;
  attendance_status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

interface ClassSession {
  id: string;
  group_name: string;
  subject: string;
  start_time: string;
  end_time: string;
  students: Student[];
}

export function useAttendanceData(classId: string) {
  const [classSession, setClassSession] = useState<ClassSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const loadClassSession = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Try cache first
      const cached = await attendanceCache.getClassSession(classId);
      if (cached) {
        setClassSession(cached);
        setIsLoading(false);
      }

      // Load fresh data
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          id,
          group_name,
          subject,
          start_time,
          end_time,
          students:class_students (
            id,
            name,
            photo_url,
            attendance_records (
              status,
              notes,
              created_at
            )
          )
        `)
        .eq('id', classId)
        .single();

      if (error) {
        console.error('Error loading class session:', error);
        if (!cached) {
          throw error;
        }
        return;
      }

      // Transform data to match interface
      const session: ClassSession = {
        id: data.id,
        group_name: data.group_name,
        subject: data.subject,
        start_time: data.start_time,
        end_time: data.end_time,
        students: data.students.map((student: any) => ({
          id: student.id,
          name: student.name,
          photo_url: student.photo_url,
          attendance_status: student.attendance_records?.[0]?.status || 'absent',
          notes: student.attendance_records?.[0]?.notes,
        })),
      };

      setClassSession(session);
      
      // Cache the data
      await attendanceCache.setClassSession(classId, session);
    } catch (error) {
      console.error('Error loading class session:', error);
      Alert.alert('Error', 'Failed to load class information');
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadClassSession();
  }, [loadClassSession]);

  const updateAttendance = useCallback(async (
    studentId: string,
    status: Student['attendance_status'],
    notes?: string
  ) => {
    if (!classSession) return;

    try {
      // Update local state immediately
      const updatedStudents = classSession.students.map(student =>
        student.id === studentId
          ? { ...student, attendance_status: status, notes }
          : student
      );

      const updatedSession = {
        ...classSession,
        students: updatedStudents,
      };

      setClassSession(updatedSession);
      setHasUnsavedChanges(true);

      // Add to offline queue
      await offlineQueue.addAttendanceUpdate({
        classId,
        studentId,
        status,
        notes,
        timestamp: new Date().toISOString(),
      });

      // Try to sync immediately if online
      try {
        await supabase
          .from('attendance_records')
          .upsert({
            class_id: classId,
            student_id: studentId,
            status,
            notes,
            marked_by: 'current-teacher-id', // Replace with actual teacher ID
            marked_at: new Date().toISOString(),
          });

        // Remove from offline queue if sync successful
        await offlineQueue.removeAttendanceUpdate(studentId, classId);
      } catch (syncError) {
        console.log('Sync failed, keeping in offline queue:', syncError);
      }

      // Update cache
      await attendanceCache.setClassSession(classId, updatedSession);
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  }, [classSession, classId]);

  const bulkUpdateAttendance = useCallback(async (
    studentIds: string[],
    status: Student['attendance_status']
  ) => {
    if (!classSession) return;

    try {
      // Update local state immediately
      const updatedStudents = classSession.students.map(student =>
        studentIds.includes(student.id)
          ? { ...student, attendance_status: status }
          : student
      );

      const updatedSession = {
        ...classSession,
        students: updatedStudents,
      };

      setClassSession(updatedSession);
      setHasUnsavedChanges(true);

      // Add bulk operation to offline queue
      await offlineQueue.addBulkAttendanceUpdate({
        classId,
        studentIds,
        status,
        timestamp: new Date().toISOString(),
      });

      // Try to sync immediately if online
      try {
        const attendanceRecords = studentIds.map(studentId => ({
          class_id: classId,
          student_id: studentId,
          status,
          marked_by: 'current-teacher-id', // Replace with actual teacher ID
          marked_at: new Date().toISOString(),
        }));

        await supabase
          .from('attendance_records')
          .upsert(attendanceRecords);

        // Remove from offline queue if sync successful
        await offlineQueue.removeBulkAttendanceUpdate(classId, studentIds);
      } catch (syncError) {
        console.log('Bulk sync failed, keeping in offline queue:', syncError);
      }

      // Update cache
      await attendanceCache.setClassSession(classId, updatedSession);
    } catch (error) {
      console.error('Error bulk updating attendance:', error);
      throw error;
    }
  }, [classSession, classId]);

  const saveAttendance = useCallback(async () => {
    if (!classSession || !hasUnsavedChanges) return;

    try {
      // Sync all pending changes
      await offlineQueue.syncPendingAttendance();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
      throw error;
    }
  }, [classSession, hasUnsavedChanges]);

  return {
    classSession,
    isLoading,
    hasUnsavedChanges,
    updateAttendance,
    bulkUpdateAttendance,
    saveAttendance,
    refreshData: loadClassSession,
  };
}