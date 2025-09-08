import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  studentService, 
  useStudentProfile, 
  useStudentRanking, 
  useStudentHometasks, 
  useStudentVocabulary, 
  useStudentSchedule,
  useLeaderboard,
  usePointsHistory
} from '@/lib/student';
import { StudentRanking, PointsTransaction, StudentVocabularyProgress } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export const [StudentProvider, useStudent] = createContextHook(() => {
  const { user: authUser } = useAuthStore();
  const queryClient = useQueryClient();
  const studentId = authUser?.id || '00000000-0000-0000-0000-000000000002';
  const [realtimeRanking] = useState<StudentRanking | null>(null);
  const [realtimeTransactions] = useState<PointsTransaction[]>([]);

  // Core student data queries
  const studentProfileQuery = useQuery(useStudentProfile(studentId));
  const studentRankingQuery = useQuery(useStudentRanking(studentId));
  const hometasksQuery = useQuery(useStudentHometasks(studentId));
  const vocabularyQuery = useQuery(useStudentVocabulary(studentId));
  const todayScheduleQuery = useQuery(useStudentSchedule(studentId, new Date().toISOString().split('T')[0]));
  const pointsHistoryQuery = useQuery(usePointsHistory(studentId));

  // Organization ID for leaderboard
  const organizationId = studentProfileQuery.data?.organization_id || '00000000-0000-0000-0000-000000000001';
  const leaderboardQuery = useQuery(useLeaderboard(organizationId, 10));

  // Mutations
  const submitHometaskMutation = useMutation({
    mutationFn: async ({ hometaskId, submissionData }: { hometaskId: string; submissionData: any }) => {
      return studentService.submitHometask(studentId, hometaskId, submissionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'hometasks', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'ranking', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'pointsHistory', studentId] });
    },
  });

  const updateVocabularyProgressMutation = useMutation({
    mutationFn: async ({ vocabularyWordId, updates }: { vocabularyWordId: string; updates: Partial<StudentVocabularyProgress> }) => {
      return studentService.updateVocabularyProgress(studentId, vocabularyWordId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'vocabulary', studentId] });
    },
  });

  const awardPointsMutation = useMutation({
    mutationFn: async ({ points, reason, category }: { points: number; reason: string; category?: string }) => {
      return studentService.awardPoints(studentId, points, reason, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'ranking', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'pointsHistory', studentId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  // Real-time subscriptions (disabled for now to prevent errors)
  useEffect(() => {
    if (!studentId) return;

    console.log('Real-time subscriptions disabled for student:', studentId);
    
    // TODO: Re-enable when Supabase is properly configured
    // const rankingSubscription = studentService.subscribeToRankingUpdates(studentId, (ranking) => {
    //   console.log('Real-time ranking update:', ranking);
    //   setRealtimeRanking(ranking);
    //   queryClient.setQueryData(['student', 'ranking', studentId], ranking);
    // });

    // const pointsSubscription = studentService.subscribeToPointsTransactions(studentId, (transaction) => {
    //   console.log('Real-time transaction update:', transaction);
    //   setRealtimeTransactions(prev => [transaction, ...prev.slice(0, 19)]);
    //   queryClient.invalidateQueries({ queryKey: ['student', 'pointsHistory', studentId] });
    // });

    // const hometaskSubscription = studentService.subscribeToHometaskUpdates(studentId, () => {
    //   queryClient.invalidateQueries({ queryKey: ['student', 'hometasks', studentId] });
    // });

    // return () => {
    //   console.log('Cleaning up real-time subscriptions');
    //   rankingSubscription.unsubscribe();
    //   pointsSubscription.unsubscribe();
    //   hometaskSubscription.unsubscribe();
    // };
  }, [studentId, queryClient]);

  // Ensure student and ranking records exist
  useEffect(() => {
    if (studentId && authUser) {
      studentService.ensureStudentAndRanking(studentId, {
        first_name: authUser.full_name?.split(' ')[0] || 'Student',
        last_name: authUser.full_name?.split(' ').slice(1).join(' ') || 'User',
        email: authUser.email,
        profile_image_url: authUser.avatar_url,
      });
    }
  }, [studentId, authUser]);

  // Helper functions
  const getFilteredHometasks = useCallback((filter: 'all' | 'pending' | 'completed') => {
    const tasks = hometasksQuery.data || [];
    if (filter === 'pending') {
      return tasks.filter(task => !task.submission?.is_completed);
    }
    if (filter === 'completed') {
      return tasks.filter(task => task.submission?.is_completed);
    }
    return tasks;
  }, [hometasksQuery.data]);

  const getTodaySchedule = useCallback(() => {
    return todayScheduleQuery.data || [];
  }, [todayScheduleQuery.data]);

  const getStudentStats = useCallback(() => {
    const ranking = studentRankingQuery.data;
    const profile = studentProfileQuery.data;
    const completedTasks = getFilteredHometasks('completed').length;
    const pendingTasks = getFilteredHometasks('pending').length;
    
    return {
      totalPoints: ranking?.total_points || 0,
      availableCoins: ranking?.available_coins || 0,
      currentLevel: ranking?.current_level || 1,
      currentRank: ranking?.current_rank || 1,
      streakDays: profile?.streak_days || 0,
      completedTasks,
      pendingTasks,
      totalTasks: completedTasks + pendingTasks,
    };
  }, [studentRankingQuery.data, studentProfileQuery.data, getFilteredHometasks]);

  // Destructure mutations for stable references
  const { mutateAsync: submitHometaskAsync } = submitHometaskMutation;
  const { mutateAsync: updateVocabularyAsync } = updateVocabularyProgressMutation;
  const { mutateAsync: awardPointsAsync } = awardPointsMutation;

  // Actions
  const submitHometask = useCallback(async (hometaskId: string, submissionData: any) => {
    try {
      const result = await submitHometaskAsync({ hometaskId, submissionData });
      if (result) {
        // Award points for completion
        const hometask = hometasksQuery.data?.find(t => t.id === hometaskId);
        if (hometask) {
          await awardPointsAsync({
            points: hometask.points_reward,
            reason: `Completed hometask: ${hometask.title}`,
            category: 'hometask',
          });
        }
      }
      return result;
    } catch (error) {
      console.error('Submit hometask error:', error);
      throw error;
    }
  }, [submitHometaskAsync, awardPointsAsync, hometasksQuery.data]);

  const toggleVocabularyFavorite = useCallback(async (vocabularyWordId: string, isFavorite: boolean) => {
    return updateVocabularyAsync({
      vocabularyWordId,
      updates: { is_favorite: isFavorite },
    });
  }, [updateVocabularyAsync]);

  const updateVocabularyMastery = useCallback(async (vocabularyWordId: string, masteryLevel: number, isCorrect: boolean) => {
    const currentProgress = vocabularyQuery.data?.find(w => w.id === vocabularyWordId)?.progress;
    return updateVocabularyAsync({
      vocabularyWordId,
      updates: {
        mastery_level: masteryLevel,
        review_count: (currentProgress?.review_count || 0) + 1,
        correct_count: (currentProgress?.correct_count || 0) + (isCorrect ? 1 : 0),
      },
    });
  }, [updateVocabularyAsync, vocabularyQuery.data]);

  const awardPoints = useCallback(async (points: number, reason: string, category: string = 'manual') => {
    try {
      return await awardPointsAsync({ points, reason, category });
    } catch (error) {
      console.error('Award points error:', error);
      return false;
    }
  }, [awardPointsAsync]);

  const refreshData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['student'] }),
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] }),
    ]);
  }, [queryClient]);

  // Computed values
  const currentRanking = realtimeRanking || studentRankingQuery.data;
  const allTransactions = useMemo(() => {
    const queryTransactions = pointsHistoryQuery.data || [];
    const combined = [...realtimeTransactions, ...queryTransactions];
    // Remove duplicates and sort by date
    const unique = combined.filter((transaction, index, arr) => 
      arr.findIndex(t => t.id === transaction.id) === index
    );
    return unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [realtimeTransactions, pointsHistoryQuery.data]);

  return useMemo(() => ({
    // Data
    student: studentProfileQuery.data,
    ranking: currentRanking,
    hometasks: hometasksQuery.data || [],
    vocabulary: vocabularyQuery.data || [],
    todaySchedule: todayScheduleQuery.data || [],
    leaderboard: leaderboardQuery.data || [],
    pointsHistory: allTransactions,
    stats: getStudentStats(),

    // Loading states
    isLoading: studentProfileQuery.isLoading || studentRankingQuery.isLoading,
    isLoadingHometasks: hometasksQuery.isLoading,
    isLoadingVocabulary: vocabularyQuery.isLoading,
    isLoadingSchedule: todayScheduleQuery.isLoading,
    isLoadingLeaderboard: leaderboardQuery.isLoading,
    isLoadingPoints: pointsHistoryQuery.isLoading,

    // Error states
    error: studentProfileQuery.error || studentRankingQuery.error,
    hometasksError: hometasksQuery.error,
    vocabularyError: vocabularyQuery.error,
    scheduleError: todayScheduleQuery.error,
    leaderboardError: leaderboardQuery.error,
    pointsError: pointsHistoryQuery.error,

    // Helper functions
    getFilteredHometasks,
    getTodaySchedule,
    getStudentStats,

    // Actions
    submitHometask,
    toggleVocabularyFavorite,
    updateVocabularyMastery,
    awardPoints,
    refreshData,

    // Mutation states
    isSubmittingHometask: submitHometaskMutation.isPending,
    isUpdatingVocabulary: updateVocabularyProgressMutation.isPending,
    isAwardingPoints: awardPointsMutation.isPending,
  }), [
    studentProfileQuery.data,
    currentRanking,
    hometasksQuery.data,
    vocabularyQuery.data,
    todayScheduleQuery.data,
    leaderboardQuery.data,
    allTransactions,
    getStudentStats,
    studentProfileQuery.isLoading,
    studentRankingQuery.isLoading,
    hometasksQuery.isLoading,
    vocabularyQuery.isLoading,
    todayScheduleQuery.isLoading,
    leaderboardQuery.isLoading,
    pointsHistoryQuery.isLoading,
    studentProfileQuery.error,
    studentRankingQuery.error,
    hometasksQuery.error,
    vocabularyQuery.error,
    todayScheduleQuery.error,
    leaderboardQuery.error,
    pointsHistoryQuery.error,
    getFilteredHometasks,
    getTodaySchedule,
    submitHometask,
    toggleVocabularyFavorite,
    updateVocabularyMastery,
    awardPoints,
    refreshData,
    submitHometaskMutation.isPending,
    updateVocabularyProgressMutation.isPending,
    awardPointsMutation.isPending,
  ]);
});