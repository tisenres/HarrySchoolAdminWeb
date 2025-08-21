import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeableRow, SwipeAction, SwipeActionPresets } from '../common/SwipeableRow';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  attendanceRate: number;
  performanceScore: number;
  lastAttendance: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  parentContact: {
    name: string;
    phone: string;
    preferredLanguage: 'en' | 'ru' | 'uz';
  };
}

interface SwipeableStudentRowProps {
  student: Student;
  groupId: string;
  onAttendanceChange: (studentId: string, status: string) => void;
  onNavigateToProfile: (studentId: string) => void;
  onAddNote: (studentId: string) => void;
  onAddGrade: (studentId: string) => void;
  context: 'attendance' | 'performance' | 'general';
}

export const SwipeableStudentRow: React.FC<SwipeableStudentRowProps> = ({
  student,
  groupId,
  onAttendanceChange,
  onNavigateToProfile,
  onAddNote,
  onAddGrade,
  context
}) => {

  // Get swipe actions based on context and UX research
  const getSwipeActions = (): { left: SwipeAction[]; right: SwipeAction[] } => {
    const actions = { left: [] as SwipeAction[], right: [] as SwipeAction[] };

    switch (context) {
      case 'attendance':
        // Right swipe: Most frequent action (Mark Present - 85% usage)
        actions.right = [
          {
            ...SwipeActionPresets.MARK_PRESENT,
            onPress: () => onAttendanceChange(student.id, 'present')
          },
          {
            ...SwipeActionPresets.MARK_LATE,
            onPress: () => onAttendanceChange(student.id, 'late')
          }
        ];

        // Left swipe: Less frequent actions
        actions.left = [
          {
            ...SwipeActionPresets.MARK_ABSENT,
            onPress: () => onAttendanceChange(student.id, 'absent')
          },
          {
            ...SwipeActionPresets.MARK_EXCUSED,
            onPress: () => onAttendanceChange(student.id, 'excused')
          }
        ];
        break;

      case 'performance':
        // Right swipe: Academic actions
        actions.right = [
          {
            ...SwipeActionPresets.ADD_GRADE,
            onPress: () => onAddGrade(student.id)
          }
        ];

        // Left swipe: Communication and notes
        actions.left = [
          {
            ...SwipeActionPresets.ADD_NOTE,
            onPress: () => onAddNote(student.id)
          },
          {
            ...SwipeActionPresets.MESSAGE_PARENT,
            onPress: () => handleMessageParent()
          }
        ];
        break;

      case 'general':
      default:
        // Right swipe: Most common teacher actions based on UX research
        actions.right = [
          {
            ...SwipeActionPresets.CALL_PARENT,
            onPress: () => handleCallParent()
          },
          {
            ...SwipeActionPresets.ADD_GRADE,
            onPress: () => onAddGrade(student.id)
          }
        ];

        // Left swipe: Secondary actions
        actions.left = [
          {
            ...SwipeActionPresets.MESSAGE_PARENT,
            onPress: () => handleMessageParent()
          },
          {
            ...SwipeActionPresets.ADD_NOTE,
            onPress: () => onAddNote(student.id)
          }
        ];
        break;
    }

    return actions;
  };

  // Handle calling parent with cultural sensitivity
  const handleCallParent = () => {
    Alert.alert(
      'Call Parent',
      `Call ${student.parentContact.name}?\n${student.parentContact.phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            Linking.openURL(`tel:${student.parentContact.phone}`);
            // Log communication for cultural tracking
            logCommunication('call', student.parentContact.preferredLanguage);
          }
        }
      ]
    );
  };

  // Handle messaging parent with language preference
  const handleMessageParent = () => {
    // Navigate to compose message with pre-filled cultural template
    const culturalGreeting = getCulturalGreeting(student.parentContact.preferredLanguage);
    console.log('Navigate to message composer with:', {
      studentId: student.id,
      parentPhone: student.parentContact.phone,
      language: student.parentContact.preferredLanguage,
      greeting: culturalGreeting
    });
  };

  // Get culturally appropriate greeting based on UX research
  const getCulturalGreeting = (language: 'en' | 'ru' | 'uz'): string => {
    const greetings = {
      'en': 'Peace be upon you. I hope this message finds you and your family in good health.',
      'ru': 'Ассалому алейкум. Надеюсь, это сообщение застанет вас и вашу семью в добром здравии.',
      'uz': 'Assalomu alaykum. Umid qilamanki, bu xabar sizni va oilangizni sog\'lik-omon topadi.'
    };
    return greetings[language];
  };

  // Log communication for analytics and cultural compliance
  const logCommunication = (type: 'call' | 'message', language: string) => {
    console.log('Communication logged:', {
      studentId: student.id,
      type,
      language,
      timestamp: new Date().toISOString(),
      culturalContext: 'uzbek_islamic'
    });
  };

  // Get attendance status color
  const getAttendanceColor = (status: string): string => {
    switch (status) {
      case 'present': return '#059669';
      case 'late': return '#f59e0b';
      case 'absent': return '#dc2626';
      case 'excused': return '#6366f1';
      default: return '#6b7280';
    }
  };

  // Get performance color based on score
  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return '#059669';
    if (score >= 80) return '#1d7452';
    if (score >= 70) return '#f59e0b';
    return '#dc2626';
  };

  const { left, right } = getSwipeActions();

  return (
    <SwipeableRow
      leftActions={left}
      rightActions={right}
      hapticFeedback={true}
      style={styles.swipeContainer}
    >
      <TouchableOpacity 
        style={styles.studentRow}
        onPress={() => onNavigateToProfile(student.id)}
        activeOpacity={0.7}
      >
        {/* Student Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: '#1d7452' }]}>
            <Text style={styles.avatarText}>
              {student.firstName[0]}{student.lastName[0]}
            </Text>
          </View>
          
          {/* Attendance Status Indicator */}
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getAttendanceColor(student.status) }
          ]} />
        </View>

        {/* Student Information */}
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {student.firstName} {student.lastName}
          </Text>
          
          <View style={styles.studentStats}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={12} color="#6b7280" />
              <Text style={styles.statText}>
                {Math.round(student.attendanceRate * 100)}% attendance
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={12} color="#6b7280" />
              <Text style={[
                styles.statText,
                { color: getPerformanceColor(student.performanceScore) }
              ]}>
                {student.performanceScore}% performance
              </Text>
            </View>
          </View>

          {/* Cultural Context Indicator */}
          <View style={styles.culturalInfo}>
            <Ionicons name="globe" size={10} color="#9ca3af" />
            <Text style={styles.culturalText}>
              {student.parentContact.preferredLanguage.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Quick Status Display */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getAttendanceColor(student.status) }
          ]}>
            <Text style={styles.statusText}>
              {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
            </Text>
          </View>
          
          <Text style={styles.lastAttendanceText}>
            Last: {new Date(student.lastAttendance).toLocaleDateString()}
          </Text>
        </View>

        {/* Navigation Indicator */}
        <View style={styles.navigationIndicator}>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    </SwipeableRow>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    marginVertical: 2,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  studentStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  culturalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  culturalText: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  lastAttendanceText: {
    fontSize: 9,
    color: '#9ca3af',
  },
  navigationIndicator: {
    padding: 4,
  },
});