import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { 
  Clock, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle,
  FileText
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import Card from '@/components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useStudentHometasks } from '@/lib/student';
import { Hometask, StudentHometaskSubmission } from '@/lib/supabase';


type TabType = 'upcoming' | 'past';

const HomeworkScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const { user } = useAuthStore();
  
  const { data: allHomework = [], isLoading } = useQuery(useStudentHometasks(user?.id || '', 'all'));
  const { data: pendingHomework = [] } = useQuery(useStudentHometasks(user?.id || '', 'pending'));
  const { data: completedHomework = [] } = useQuery(useStudentHometasks(user?.id || '', 'completed'));
  
  const upcomingHomework = pendingHomework.filter((hw: Hometask & { submission?: StudentHometaskSubmission }) => {
    if (!hw.due_date) return false;
    const dueDate = new Date(hw.due_date);
    return dueDate > new Date();
  });
  
  const pastHomework = completedHomework;
  
  const stats = {
    pending: pendingHomework.length,
    submitted: completedHomework.filter((hw: Hometask & { submission?: StudentHometaskSubmission }) => hw.submission && !hw.submission.is_completed).length,
    graded: completedHomework.filter((hw: Hometask & { submission?: StudentHometaskSubmission }) => hw.submission?.is_completed).length,
    overdue: pendingHomework.filter((hw: Hometask & { submission?: StudentHometaskSubmission }) => {
      if (!hw.due_date) return false;
      const dueDate = new Date(hw.due_date);
      return dueDate < new Date();
    }).length,
    total: allHomework.length
  };

  const getStatusColor = (hw: Hometask & { submission?: StudentHometaskSubmission }) => {
    const status = getHomeworkStatus(hw);
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'submitted':
        return Colors.info;
      case 'graded':
        return Colors.success;
      case 'overdue':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (hw: Hometask & { submission?: StudentHometaskSubmission }) => {
    const status = getHomeworkStatus(hw);
    switch (status) {
      case 'pending':
        return <Clock size={16} color={Colors.warning} />;
      case 'submitted':
        return <CheckCircle size={16} color={Colors.info} />;
      case 'graded':
        return <CheckCircle size={16} color={Colors.success} />;
      case 'overdue':
        return <XCircle size={16} color={Colors.error} />;
      default:
        return <FileText size={16} color={Colors.textSecondary} />;
    }
  };

  const getPriorityColor = (difficulty: string) => {
    const priority = difficulty as 'high' | 'medium' | 'low';
    switch (priority) {
      case 'high':
        return Colors.error;
      case 'medium':
        return Colors.warning;
      case 'low':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays > 0) return `Due in ${diffDays} days`;
    if (diffDays === -1) return 'Due yesterday';
    return `${Math.abs(diffDays)} days overdue`;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getHomeworkStatus = (hw: Hometask & { submission?: StudentHometaskSubmission }): 'pending' | 'submitted' | 'graded' | 'overdue' => {
    if (!hw.due_date) return 'pending';
    const dueDate = new Date(hw.due_date);
    const now = new Date();
    
    if (hw.submission?.is_completed) return 'graded';
    if (hw.submission && !hw.submission.is_completed) return 'submitted';
    if (dueDate < now) return 'overdue';
    return 'pending';
  };
  
  const handleHomeworkPress = (homework: Hometask & { submission?: StudentHometaskSubmission }) => {
    console.log('Opening homework detail:', homework.id);
    router.push(`/homework/${homework.id}`);
  };

  const renderHomeworkCard = (homework: Hometask & { submission?: StudentHometaskSubmission }) => (
    <TouchableOpacity
      key={homework.id}
      onPress={() => handleHomeworkPress(homework)}
      testID={`homework-card-${homework.id}`}
    >
      <Card style={styles.homeworkCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.homeworkTitle} numberOfLines={2}>
              {homework.title}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(homework.difficulty) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(homework.difficulty) }]}>
                {homework.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.subjectRow}>
            <Text style={styles.subject}>{homework.type}</Text>
            <View style={styles.statusBadge}>
              {getStatusIcon(homework)}
              <Text style={[styles.statusText, { color: getStatusColor(homework) }]}>
                {getHomeworkStatus(homework).charAt(0).toUpperCase() + getHomeworkStatus(homework).slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {homework.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <User size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>Teacher</Text>
            </View>
            
            <View style={styles.metaItem}>
              <Calendar size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{homework.due_date ? formatDate(homework.due_date) : 'No due date'}</Text>
            </View>
            
            {homework.time_limit && (
              <View style={styles.metaItem}>
                <Clock size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{formatTime(homework.time_limit)}</Text>
              </View>
            )}
          </View>

          {homework.submission?.score !== undefined && (
            <View style={styles.gradeContainer}>
              <Text style={styles.gradeText}>
                {homework.submission.score}/{homework.submission.max_score}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.pending}</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.submitted}</Text>
        <Text style={styles.statLabel}>Submitted</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.graded}</Text>
        <Text style={styles.statLabel}>Graded</Text>
      </View>
      <View style={[styles.statCard, styles.overdueCard]}>
        <Text style={[styles.statNumber, styles.overdueNumber]}>{stats.overdue}</Text>
        <Text style={[styles.statLabel, styles.overdueLabel]}>Overdue</Text>
      </View>
    </View>
  );

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <FileText size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Loading homework...</Text>
        </View>
      );
    }
    
    const homework = activeTab === 'upcoming' ? upcomingHomework : pastHomework;
    
    if (homework.length === 0) {
      return (
        <View style={styles.emptyState}>
          <FileText size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'upcoming' ? 'No upcoming homework' : 'No past homework'}
          </Text>
          <Text style={styles.emptyDescription}>
            {activeTab === 'upcoming' 
              ? 'You\'re all caught up! Check back later for new assignments.'
              : 'Your completed homework will appear here.'
            }
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.homeworkList}>
        {homework.map(renderHomeworkCard)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Homework',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderStatsCards()}
        
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
            testID="upcoming-tab"
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Upcoming ({upcomingHomework.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.activeTab]}
            onPress={() => setActiveTab('past')}
            testID="past-tab"
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
              Past ({pastHomework.length})
            </Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overdueCard: {
    backgroundColor: Colors.error + '10',
    borderColor: Colors.error + '30',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  overdueNumber: {
    color: Colors.error,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  overdueLabel: {
    color: Colors.error,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: '#ffffff',
  },
  homeworkList: {
    gap: 16,
  },
  homeworkCard: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  homeworkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subject: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  gradeContainer: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});

export default HomeworkScreen;