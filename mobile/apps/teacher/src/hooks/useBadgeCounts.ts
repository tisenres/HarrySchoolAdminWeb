import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { BadgeCount } from '../navigation/types';

export function useBadgeCounts(): BadgeCount {
  const [badgeCounts, setBadgeCounts] = useState<BadgeCount>({
    home: 0,
    groups: 0,
    schedule: 0,
    feedback: 0,
  });

  useEffect(() => {
    // Fetch initial badge counts
    fetchBadgeCounts();

    // Set up real-time subscriptions
    const subscriptions = [
      // Home tab: notifications, pending tasks
      supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'teacher_notifications',
            filter: 'read_status=eq.false',
          },
          () => fetchHomeBadgeCount()
        )
        .subscribe(),

      // Groups tab: attendance alerts, student issues
      supabase
        .channel('groups')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_alerts',
          },
          () => fetchGroupsBadgeCount()
        )
        .subscribe(),

      // Schedule tab: upcoming classes, schedule changes
      supabase
        .channel('schedule')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'schedule_changes',
            filter: 'acknowledged=eq.false',
          },
          () => fetchScheduleBadgeCount()
        )
        .subscribe(),

      // Feedback tab: pending grading, parent messages
      supabase
        .channel('feedback')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pending_assessments',
          },
          () => fetchFeedbackBadgeCount()
        )
        .subscribe(),
    ];

    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, []);

  const fetchBadgeCounts = async () => {
    try {
      await Promise.all([
        fetchHomeBadgeCount(),
        fetchGroupsBadgeCount(),
        fetchScheduleBadgeCount(),
        fetchFeedbackBadgeCount(),
      ]);
    } catch (error) {
      console.error('Error fetching badge counts:', error);
    }
  };

  const fetchHomeBadgeCount = async () => {
    try {
      // Count unread notifications and urgent tasks
      const [notificationsResult, tasksResult] = await Promise.all([
        supabase
          .from('teacher_notifications')
          .select('id', { count: 'exact' })
          .eq('read_status', false)
          .eq('teacher_id', getCurrentTeacherId()),
        
        supabase
          .from('urgent_tasks')
          .select('id', { count: 'exact' })
          .eq('completed', false)
          .eq('teacher_id', getCurrentTeacherId()),
      ]);

      const count = (notificationsResult.count || 0) + (tasksResult.count || 0);
      setBadgeCounts(prev => ({ ...prev, home: count }));
    } catch (error) {
      console.error('Error fetching home badge count:', error);
    }
  };

  const fetchGroupsBadgeCount = async () => {
    try {
      // Count attendance alerts and student behavioral notes
      const [attendanceResult, behaviorResult] = await Promise.all([
        supabase
          .from('attendance_alerts')
          .select('id', { count: 'exact' })
          .eq('resolved', false)
          .eq('teacher_id', getCurrentTeacherId()),
        
        supabase
          .from('student_behavior_alerts')
          .select('id', { count: 'exact' })
          .eq('acknowledged', false)
          .eq('teacher_id', getCurrentTeacherId()),
      ]);

      const count = (attendanceResult.count || 0) + (behaviorResult.count || 0);
      setBadgeCounts(prev => ({ ...prev, groups: count }));
    } catch (error) {
      console.error('Error fetching groups badge count:', error);
    }
  };

  const fetchScheduleBadgeCount = async () => {
    try {
      // Count schedule changes and upcoming classes requiring preparation
      const [changesResult, preparationResult] = await Promise.all([
        supabase
          .from('schedule_changes')
          .select('id', { count: 'exact' })
          .eq('acknowledged', false)
          .eq('teacher_id', getCurrentTeacherId()),
        
        supabase
          .from('classes_requiring_prep')
          .select('id', { count: 'exact' })
          .eq('prepared', false)
          .eq('teacher_id', getCurrentTeacherId())
          .gte('class_date', new Date().toISOString().split('T')[0]),
      ]);

      const count = (changesResult.count || 0) + (preparationResult.count || 0);
      setBadgeCounts(prev => ({ ...prev, schedule: count }));
    } catch (error) {
      console.error('Error fetching schedule badge count:', error);
    }
  };

  const fetchFeedbackBadgeCount = async () => {
    try {
      // Count pending assessments and unread parent messages
      const [assessmentsResult, messagesResult] = await Promise.all([
        supabase
          .from('pending_assessments')
          .select('id', { count: 'exact' })
          .eq('graded', false)
          .eq('teacher_id', getCurrentTeacherId()),
        
        supabase
          .from('parent_messages')
          .select('id', { count: 'exact' })
          .eq('read_status', false)
          .eq('teacher_id', getCurrentTeacherId()),
      ]);

      const count = (assessmentsResult.count || 0) + (messagesResult.count || 0);
      setBadgeCounts(prev => ({ ...prev, feedback: count }));
    } catch (error) {
      console.error('Error fetching feedback badge count:', error);
    }
  };

  return badgeCounts;
}

// Placeholder function - should be replaced with actual authentication logic
function getCurrentTeacherId(): string {
  // This should get the current teacher's ID from authentication context
  // For now, returning a placeholder
  return 'teacher-id-placeholder';
}