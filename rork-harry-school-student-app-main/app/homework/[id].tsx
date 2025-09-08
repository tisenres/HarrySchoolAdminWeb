import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { 
  Clock, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle,
  FileText,
  ExternalLink,

  Star,
  AlertTriangle
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { useStudentHometasks, studentService } from '@/lib/student';
import { Hometask, StudentHometaskSubmission } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

const HomeworkDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [submissionUrl, setSubmissionUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { user } = useAuthStore();
  
  const { data: allHomework = [] } = useQuery(useStudentHometasks(user?.id || '', 'all'));
  const homework = allHomework.find((hw: Hometask & { submission?: StudentHometaskSubmission }) => hw.id === id);

  if (!homework) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Homework Not Found' }} />
        <View style={styles.errorContainer}>
          <AlertTriangle size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Homework Not Found</Text>
          <Text style={styles.errorDescription}>
            The homework you&apos;re looking for doesn&apos;t exist or has been removed.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} color={Colors.warning} />;
      case 'submitted':
        return <CheckCircle size={20} color={Colors.info} />;
      case 'graded':
        return <CheckCircle size={20} color={Colors.success} />;
      case 'overdue':
        return <XCircle size={20} color={Colors.error} />;
      default:
        return <FileText size={20} color={Colors.textSecondary} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'hard':
        return Colors.error;
      case 'medium':
        return Colors.warning;
      case 'easy':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const handleSubmit = async () => {
    if (!submissionUrl.trim()) {
      Alert.alert('Error', 'Please enter a submission URL');
      return;
    }

    if (!isValidUrl(submissionUrl)) {
      Alert.alert('Error', 'Please enter a valid URL (e.g., https://drive.google.com/...)');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    try {
      if (user?.id && homework?.id) {
        await studentService.submitHometask(user.id, homework.id, { url: submissionUrl });
        setIsSubmitting(false);
        Alert.alert(
          'Success',
          'Your homework has been submitted successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert('Error', 'Failed to submit homework. Please try again.');
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const openAttachment = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the attachment');
    });
  };

  const getHomeworkStatus = (hw: Hometask & { submission?: StudentHometaskSubmission }): string => {
    if (!hw.due_date) return 'pending';
    const dueDate = new Date(hw.due_date);
    const now = new Date();
    
    if (hw.submission?.is_completed) return 'graded';
    if (hw.submission && !hw.submission.is_completed) return 'submitted';
    if (dueDate < now) return 'overdue';
    return 'pending';
  };
  
  const status = homework ? getHomeworkStatus(homework) : 'pending';
  const canSubmit = status === 'pending' || status === 'overdue';
  const isSubmitted = status === 'submitted' || status === 'graded';

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: homework.type,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{homework.title}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(homework.difficulty) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(homework.difficulty) }]}>
                {homework.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              {getStatusIcon(status)}
              <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
            
            {homework.submission?.score !== undefined && (
              <View style={styles.gradeContainer}>
                <Star size={16} color={Colors.warning} />
                <Text style={styles.gradeText}>
                  {homework.submission.score}/{homework.submission.max_score}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <User size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{homework.type}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Calendar size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>{formatDate(homework.created_at)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Calendar size={16} color={Colors.error} />
            <Text style={styles.detailLabel}>Due:</Text>
            <Text style={[styles.detailValue, { color: Colors.error }]}>{homework.due_date ? formatDate(homework.due_date) : 'No due date'}</Text>
          </View>
          
          {homework.time_limit && (
            <View style={styles.detailRow}>
              <Clock size={16} color={Colors.textSecondary} />
              <Text style={styles.detailLabel}>Time Limit:</Text>
              <Text style={styles.detailValue}>{formatTime(homework.time_limit)}</Text>
            </View>
          )}
        </Card>

        {/* Description Card */}
        <Card style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{homework.description}</Text>
        </Card>

        {/* Content Card */}
        <Card style={styles.requirementsCard}>
          <Text style={styles.sectionTitle}>Content</Text>
          <Text style={styles.requirementText}>
            {homework.content ? JSON.stringify(homework.content, null, 2) : 'No additional content provided.'}
          </Text>
        </Card>

        {/* Feedback Card (if graded) */}
        {homework.submission?.feedback && (
          <Card style={styles.feedbackCard}>
            <Text style={styles.sectionTitle}>Teacher Feedback</Text>
            <Text style={styles.feedback}>{homework.submission.feedback}</Text>
          </Card>
        )}

        {/* Submission Card */}
        {canSubmit && (
          <Card style={styles.submissionCard}>
            <Text style={styles.sectionTitle}>Submit Your Work</Text>
            <Text style={styles.submissionDescription}>
              Enter the URL to your completed work (Google Drive, Dropbox, etc.)
            </Text>
            
            <TextInput
              style={styles.urlInput}
              placeholder="https://drive.google.com/file/d/..."
              value={submissionUrl}
              onChangeText={setSubmissionUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Button
              title={isSubmitting ? "Submitting..." : "Submit Homework"}
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitButton}
            />
          </Card>
        )}

        {/* Submitted Work Card */}
        {isSubmitted && homework.submission?.submission_data && (
          <Card style={styles.submittedCard}>
            <Text style={styles.sectionTitle}>Your Submission</Text>
            <View style={styles.submissionInfo}>
              <Text style={styles.submissionText}>
                Submission data: {JSON.stringify(homework.submission.submission_data)}
              </Text>
            </View>
            
            {homework.submission.submitted_at && (
              <Text style={styles.submissionDate}>
                Submitted on {formatDate(homework.submission.submitted_at)}
              </Text>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backButton: {
    minWidth: 120,
  },
  headerCard: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  descriptionCard: {
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  requirementsCard: {
    marginBottom: 16,
  },

  requirementText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },

  feedbackCard: {
    marginBottom: 16,
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success + '30',
    borderWidth: 1,
  },
  feedback: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  submissionCard: {
    marginBottom: 16,
  },
  submissionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.surface,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submittedCard: {
    marginBottom: 16,
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success + '30',
    borderWidth: 1,
  },
  submissionInfo: {
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  submissionText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  submissionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default HomeworkDetailScreen;