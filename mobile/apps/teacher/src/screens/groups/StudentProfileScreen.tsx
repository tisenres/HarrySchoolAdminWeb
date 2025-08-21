import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';

// Types based on UX research priorities and cultural considerations
interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  
  // Academic Information (Priority 1 from UX research)
  currentLevel: string;
  enrollmentDate: string;
  studentId: string;
  
  // Performance Metrics (Priority 2)
  overallGrade: number;
  attendanceRate: number;
  performanceHistory: {
    date: string;
    type: 'quiz' | 'homework' | 'exam' | 'participation';
    score: number;
    maxScore: number;
    subject: string;
    notes?: string;
  }[];
  
  // Attendance Patterns (Priority 3)
  attendanceHistory: {
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }[];
  
  // Family Information (Cultural Priority - Islamic values)
  family: {
    father: {
      name: string;
      phone: string;
      occupation?: string;
      preferredLanguage: 'en' | 'ru' | 'uz';
    };
    mother: {
      name: string;
      phone: string;
      occupation?: string;
      preferredLanguage: 'en' | 'ru' | 'uz';
    };
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    address: string;
    preferredContactMethod: 'phone' | 'sms' | 'whatsapp';
    culturalConsiderations?: string[];
  };
  
  // Teacher Notes & Observations
  teacherNotes: {
    id: string;
    date: string;
    category: 'academic' | 'behavioral' | 'social' | 'health';
    note: string;
    teacherId: string;
    teacherName: string;
    isPrivate: boolean;
  }[];
  
  // Tasks & Assignments
  tasks: {
    pending: {
      id: string;
      title: string;
      dueDate: string;
      type: 'homework' | 'project' | 'reading';
      priority: 'high' | 'medium' | 'low';
    }[];
    completed: {
      id: string;
      title: string;
      completedDate: string;
      score?: number;
    }[];
  };
  
  // Behavioral & Social (Uzbek cultural context)
  behavioralNotes: {
    strengths: string[];
    areasForImprovement: string[];
    socialSkills: string[];
    parentFeedback: string[];
  };
  
  // Communication History
  communicationHistory: {
    id: string;
    date: string;
    type: 'call' | 'sms' | 'meeting' | 'email';
    recipient: 'father' | 'mother' | 'both' | 'emergency';
    subject: string;
    content: string;
    response?: string;
    followUpRequired: boolean;
  }[];
}

interface StudentProfileScreenProps {
  route: {
    params: {
      studentId: string;
    };
  };
}

type InfoSection = 'overview' | 'academic' | 'attendance' | 'family' | 'notes' | 'communication';

export const StudentProfileScreen: React.FC<StudentProfileScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { studentId } = route.params as { studentId: string };

  // State management
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [activeSection, setActiveSection] = useState<InfoSection>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const sectionIndicator = useSharedValue(0);

  // Load student data
  const loadStudentProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API call
      const mockStudent: StudentProfile = {
        id: studentId,
        firstName: 'Aziza',
        lastName: 'Yusupova',
        dateOfBirth: '2010-03-15',
        gender: 'female',
        currentLevel: 'A1',
        enrollmentDate: '2023-09-01',
        studentId: 'HS2023001',
        overallGrade: 85,
        attendanceRate: 0.95,
        
        performanceHistory: [
          {
            date: '2024-01-15',
            type: 'quiz',
            score: 18,
            maxScore: 20,
            subject: 'Grammar',
            notes: 'Excellent understanding of present tense'
          },
          {
            date: '2024-01-12',
            type: 'homework',
            score: 15,
            maxScore: 15,
            subject: 'Vocabulary',
            notes: 'Perfect completion'
          },
          {
            date: '2024-01-10',
            type: 'participation',
            score: 9,
            maxScore: 10,
            subject: 'Speaking',
            notes: 'Very active in discussions'
          }
        ],
        
        attendanceHistory: [
          { date: '2024-01-15', status: 'present' },
          { date: '2024-01-12', status: 'present' },
          { date: '2024-01-10', status: 'present' },
          { date: '2024-01-08', status: 'late', notes: 'Family appointment' },
          { date: '2024-01-05', status: 'present' }
        ],
        
        family: {
          father: {
            name: 'Abdulla Yusupov',
            phone: '+998901234567',
            occupation: 'Engineer',
            preferredLanguage: 'uz'
          },
          mother: {
            name: 'Dilnoza Yusupova',
            phone: '+998907654321',
            occupation: 'Teacher',
            preferredLanguage: 'ru'
          },
          emergencyContact: {
            name: 'Gulnara Yusupova',
            phone: '+998901122334',
            relationship: 'Aunt'
          },
          address: 'Tashkent, Yunusabad district, Bogishamol street 12',
          preferredContactMethod: 'whatsapp',
          culturalConsiderations: ['Prayer time awareness', 'Modest dress code', 'Ramadan considerations']
        },
        
        teacherNotes: [
          {
            id: '1',
            date: '2024-01-15',
            category: 'academic',
            note: 'Shows excellent progress in speaking skills. Ready for more challenging conversations.',
            teacherId: 'teacher1',
            teacherName: 'Gulnara Karimova',
            isPrivate: false
          },
          {
            id: '2',
            date: '2024-01-10',
            category: 'social',
            note: 'Very helpful with newer students. Natural leader in group activities.',
            teacherId: 'teacher1',
            teacherName: 'Gulnara Karimova',
            isPrivate: false
          }
        ],
        
        tasks: {
          pending: [
            {
              id: '1',
              title: 'Unit 3 Vocabulary Review',
              dueDate: '2024-01-18',
              type: 'homework',
              priority: 'medium'
            },
            {
              id: '2',
              title: 'Speaking Practice Recording',
              dueDate: '2024-01-20',
              type: 'project',
              priority: 'high'
            }
          ],
          completed: [
            {
              id: '3',
              title: 'Grammar Exercise Set 2',
              completedDate: '2024-01-12',
              score: 18
            }
          ]
        },
        
        behavioralNotes: {
          strengths: ['Leadership', 'Helpful to peers', 'Good time management', 'Respectful behavior'],
          areasForImprovement: ['Could speak louder in class', 'Sometimes hesitant with new vocabulary'],
          socialSkills: ['Works well in groups', 'Good listening skills', 'Encourages others'],
          parentFeedback: ['Studies regularly at home', 'Excited about lessons', 'Practices with siblings']
        },
        
        communicationHistory: [
          {
            id: '1',
            date: '2024-01-10',
            type: 'whatsapp',
            recipient: 'mother',
            subject: 'Excellent Progress Update',
            content: 'Aziza is doing wonderfully in class. Her speaking has improved significantly.',
            response: 'Thank you! We are very proud of her progress.',
            followUpRequired: false
          }
        ]
      };

      setStudent(mockStudent);
    } catch (error) {
      console.error('Error loading student profile:', error);
      Alert.alert('Error', 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadStudentProfile();
  }, [loadStudentProfile]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStudentProfile();
    setRefreshing(false);
  }, [loadStudentProfile]);

  // Communication handlers
  const callParent = (phone: string, name: string) => {
    Alert.alert(
      'Call Parent',
      `Call ${name} at ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) }
      ]
    );
  };

  const sendMessage = (recipient: 'father' | 'mother' | 'both') => {
    navigation.navigate('ComposeMessage' as never, {
      studentId: student?.id,
      recipient
    } as never);
  };

  // Helper functions
  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return '#059669';
    if (grade >= 80) return '#1d7452';
    if (grade >= 70) return '#f59e0b';
    return '#dc2626';
  };

  const getAttendanceColor = (rate: number): string => {
    if (rate >= 0.9) return '#059669';
    if (rate >= 0.8) return '#f59e0b';
    return '#dc2626';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Section renderers
  const renderOverview = () => {
    if (!student) return null;

    return (
      <View style={styles.sectionContent}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: getGradeColor(student.overallGrade) }]}>
              {student.overallGrade}%
            </Text>
            <Text style={styles.statLabel}>Overall Grade</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: getAttendanceColor(student.attendanceRate) }]}>
              {Math.round(student.attendanceRate * 100)}%
            </Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{student.tasks.pending.length}</Text>
            <Text style={styles.statLabel}>Pending Tasks</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => callParent(student.family.mother.phone, student.family.mother.name)}
          >
            <Ionicons name="call" size={20} color="#2563eb" />
            <Text style={styles.quickActionText}>Call Mother</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => sendMessage('both')}
          >
            <Ionicons name="mail" size={20} color="#1d7452" />
            <Text style={styles.quickActionText}>Send Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="document-text" size={20} color="#7c3aed" />
            <Text style={styles.quickActionText}>Add Note</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Performance */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Recent Performance</Text>
          {student.performanceHistory.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.performanceItem}>
              <View style={styles.performanceLeft}>
                <Text style={styles.performanceType}>{item.type}</Text>
                <Text style={styles.performanceSubject}>{item.subject}</Text>
              </View>
              <View style={styles.performanceRight}>
                <Text style={styles.performanceScore}>
                  {item.score}/{item.maxScore}
                </Text>
                <Text style={styles.performanceDate}>{formatDate(item.date)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAcademic = () => {
    if (!student) return null;

    return (
      <View style={styles.sectionContent}>
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Academic Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Student ID:</Text>
            <Text style={styles.infoValue}>{student.studentId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Level:</Text>
            <Text style={styles.infoValue}>{student.currentLevel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Enrollment Date:</Text>
            <Text style={styles.infoValue}>{formatDate(student.enrollmentDate)}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Performance History</Text>
          {student.performanceHistory.map((item, index) => (
            <View key={index} style={styles.performanceDetailItem}>
              <View style={styles.performanceHeader}>
                <Text style={styles.performanceType}>{item.type.toUpperCase()}</Text>
                <Text style={styles.performanceScore}>
                  {item.score}/{item.maxScore} ({Math.round((item.score / item.maxScore) * 100)}%)
                </Text>
              </View>
              <Text style={styles.performanceSubject}>{item.subject}</Text>
              <Text style={styles.performanceDate}>{formatDate(item.date)}</Text>
              {item.notes && (
                <Text style={styles.performanceNotes}>{item.notes}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Pending Tasks</Text>
          {student.tasks.pending.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.taskLeft}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskType}>{task.type}</Text>
              </View>
              <View style={styles.taskRight}>
                <View style={[
                  styles.priorityBadge,
                  task.priority === 'high' && styles.highPriority,
                  task.priority === 'medium' && styles.mediumPriority,
                  task.priority === 'low' && styles.lowPriority
                ]}>
                  <Text style={styles.priorityText}>{task.priority}</Text>
                </View>
                <Text style={styles.taskDue}>Due: {formatDate(task.dueDate)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAttendance = () => {
    if (!student) return null;

    const presentDays = student.attendanceHistory.filter(a => a.status === 'present').length;
    const totalDays = student.attendanceHistory.length;

    return (
      <View style={styles.sectionContent}>
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Attendance Summary</Text>
          <View style={styles.attendanceSummary}>
            <View style={styles.attendanceStatItem}>
              <Text style={styles.attendanceStatValue}>{presentDays}/{totalDays}</Text>
              <Text style={styles.attendanceStatLabel}>Days Present</Text>
            </View>
            <View style={styles.attendanceStatItem}>
              <Text style={[
                styles.attendanceStatValue,
                { color: getAttendanceColor(student.attendanceRate) }
              ]}>
                {Math.round(student.attendanceRate * 100)}%
              </Text>
              <Text style={styles.attendanceStatLabel}>Attendance Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Attendance History</Text>
          {student.attendanceHistory.map((record, index) => (
            <View key={index} style={styles.attendanceRecord}>
              <View style={styles.attendanceLeft}>
                <Text style={styles.attendanceDate}>{formatDate(record.date)}</Text>
                {record.notes && (
                  <Text style={styles.attendanceNote}>{record.notes}</Text>
                )}
              </View>
              <View style={[
                styles.attendanceStatus,
                record.status === 'present' && styles.presentStatus,
                record.status === 'absent' && styles.absentStatus,
                record.status === 'late' && styles.lateStatus,
                record.status === 'excused' && styles.excusedStatus
              ]}>
                <Text style={styles.attendanceStatusText}>{record.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFamily = () => {
    if (!student) return null;

    return (
      <View style={styles.sectionContent}>
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Father Information</Text>
          <View style={styles.parentInfo}>
            <View style={styles.parentDetails}>
              <Text style={styles.parentName}>{student.family.father.name}</Text>
              <Text style={styles.parentOccupation}>{student.family.father.occupation}</Text>
              <Text style={styles.parentLanguage}>
                Preferred Language: {student.family.father.preferredLanguage.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => callParent(student.family.father.phone, student.family.father.name)}
            >
              <Ionicons name="call" size={16} color="#2563eb" />
              <Text style={styles.contactButtonText}>{student.family.father.phone}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Mother Information</Text>
          <View style={styles.parentInfo}>
            <View style={styles.parentDetails}>
              <Text style={styles.parentName}>{student.family.mother.name}</Text>
              <Text style={styles.parentOccupation}>{student.family.mother.occupation}</Text>
              <Text style={styles.parentLanguage}>
                Preferred Language: {student.family.mother.preferredLanguage.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => callParent(student.family.mother.phone, student.family.mother.name)}
            >
              <Ionicons name="call" size={16} color="#2563eb" />
              <Text style={styles.contactButtonText}>{student.family.mother.phone}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {student.family.emergencyContact && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Emergency Contact</Text>
            <View style={styles.emergencyContact}>
              <Text style={styles.emergencyName}>{student.family.emergencyContact.name}</Text>
              <Text style={styles.emergencyRelation}>{student.family.emergencyContact.relationship}</Text>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => callParent(
                  student.family.emergencyContact!.phone, 
                  student.family.emergencyContact!.name
                )}
              >
                <Ionicons name="call" size={16} color="#dc2626" />
                <Text style={styles.contactButtonText}>{student.family.emergencyContact.phone}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Address & Cultural Considerations</Text>
          <Text style={styles.addressText}>{student.family.address}</Text>
          
          {student.family.culturalConsiderations && (
            <View style={styles.culturalConsiderations}>
              <Text style={styles.culturalTitle}>Cultural Considerations:</Text>
              {student.family.culturalConsiderations.map((consideration, index) => (
                <View key={index} style={styles.culturalItem}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.culturalText}>{consideration}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderNotes = () => {
    if (!student) return null;

    return (
      <View style={styles.sectionContent}>
        <TouchableOpacity style={styles.addNoteButton}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addNoteText}>Add New Note</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Behavioral Profile</Text>
          
          <View style={styles.behavioralSection}>
            <Text style={styles.behavioralSubtitle}>Strengths</Text>
            {student.behavioralNotes.strengths.map((strength, index) => (
              <View key={index} style={styles.behavioralItem}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.behavioralText}>{strength}</Text>
              </View>
            ))}
          </View>

          <View style={styles.behavioralSection}>
            <Text style={styles.behavioralSubtitle}>Areas for Improvement</Text>
            {student.behavioralNotes.areasForImprovement.map((area, index) => (
              <View key={index} style={styles.behavioralItem}>
                <Ionicons name="trending-up" size={14} color="#f59e0b" />
                <Text style={styles.behavioralText}>{area}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Teacher Notes</Text>
          {student.teacherNotes.map((note) => (
            <View key={note.id} style={styles.noteItem}>
              <View style={styles.noteHeader}>
                <View style={[
                  styles.categoryBadge,
                  note.category === 'academic' && styles.academicBadge,
                  note.category === 'behavioral' && styles.behavioralBadge,
                  note.category === 'social' && styles.socialBadge,
                  note.category === 'health' && styles.healthBadge
                ]}>
                  <Text style={styles.categoryText}>{note.category}</Text>
                </View>
                <Text style={styles.noteDate}>{formatDate(note.date)}</Text>
              </View>
              <Text style={styles.noteContent}>{note.note}</Text>
              <Text style={styles.noteTeacher}>— {note.teacherName}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderCommunication = () => {
    if (!student) return null;

    return (
      <View style={styles.sectionContent}>
        <View style={styles.communicationActions}>
          <TouchableOpacity 
            style={styles.commAction}
            onPress={() => sendMessage('both')}
          >
            <Ionicons name="mail" size={18} color="#1d7452" />
            <Text style={styles.commActionText}>Send Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.commAction}>
            <Ionicons name="calendar" size={18} color="#2563eb" />
            <Text style={styles.commActionText}>Schedule Meeting</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Communication History</Text>
          {student.communicationHistory.map((comm) => (
            <View key={comm.id} style={styles.commHistoryItem}>
              <View style={styles.commHeader}>
                <View style={styles.commType}>
                  <Ionicons 
                    name={
                      comm.type === 'call' ? 'call' :
                      comm.type === 'sms' ? 'chatbubble' :
                      comm.type === 'meeting' ? 'people' : 'mail'
                    } 
                    size={16} 
                    color="#6b7280" 
                  />
                  <Text style={styles.commTypeText}>{comm.type}</Text>
                </View>
                <Text style={styles.commDate}>{formatDate(comm.date)}</Text>
              </View>
              
              <Text style={styles.commSubject}>{comm.subject}</Text>
              <Text style={styles.commRecipient}>To: {comm.recipient}</Text>
              <Text style={styles.commContent}>{comm.content}</Text>
              
              {comm.response && (
                <View style={styles.commResponse}>
                  <Text style={styles.commResponseLabel}>Response:</Text>
                  <Text style={styles.commResponseText}>{comm.response}</Text>
                </View>
              )}
              
              {comm.followUpRequired && (
                <View style={styles.followUpBadge}>
                  <Ionicons name="flag" size={12} color="#dc2626" />
                  <Text style={styles.followUpText}>Follow-up required</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Section content renderer
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'academic':
        return renderAcademic();
      case 'attendance':
        return renderAttendance();
      case 'family':
        return renderFamily();
      case 'notes':
        return renderNotes();
      case 'communication':
        return renderCommunication();
      default:
        return renderOverview();
    }
  };

  if (loading || !student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading student profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create" size={20} color="#1d7452" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.studentHeader}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentInitials}>
              {student.firstName[0]}{student.lastName[0]}
            </Text>
          </View>
          
          <View style={styles.studentHeaderInfo}>
            <Text style={styles.studentName}>
              {student.firstName} {student.lastName}
            </Text>
            <Text style={styles.studentDetails}>
              Age {getAge(student.dateOfBirth)} • Level {student.currentLevel} • ID: {student.studentId}
            </Text>
          </View>
        </View>
      </View>

      {/* Section Navigation */}
      <View style={styles.sectionNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'Overview', icon: 'home' },
            { key: 'academic', label: 'Academic', icon: 'school' },
            { key: 'attendance', label: 'Attendance', icon: 'checkmark-circle' },
            { key: 'family', label: 'Family', icon: 'people' },
            { key: 'notes', label: 'Notes', icon: 'document-text' },
            { key: 'communication', label: 'Messages', icon: 'mail' }
          ].map((section) => (
            <TouchableOpacity
              key={section.key}
              style={[
                styles.sectionTab,
                activeSection === section.key && styles.activeSectionTab
              ]}
              onPress={() => setActiveSection(section.key as InfoSection)}
            >
              <Ionicons 
                name={section.icon as any} 
                size={16} 
                color={activeSection === section.key ? '#1d7452' : '#6b7280'} 
              />
              <Text style={[
                styles.sectionTabText,
                activeSection === section.key && styles.activeSectionTabText
              ]}>
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1d7452']}
            tintColor="#1d7452"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderSectionContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  studentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1d7452',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  studentInitials: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  studentHeaderInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionNav: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  activeSectionTab: {
    backgroundColor: 'rgba(29, 116, 82, 0.05)',
    borderBottomWidth: 2,
    borderBottomColor: '#1d7452',
  },
  sectionTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeSectionTabText: {
    color: '#1d7452',
  },
  content: {
    flex: 1,
  },
  sectionContent: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  performanceLeft: {
    flex: 1,
  },
  performanceType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  performanceSubject: {
    fontSize: 12,
    color: '#6b7280',
  },
  performanceRight: {
    alignItems: 'flex-end',
  },
  performanceScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d7452',
  },
  performanceDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  performanceDetailItem: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  performanceNotes: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  taskLeft: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  taskType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  taskRight: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  highPriority: {
    backgroundColor: '#fef2f2',
  },
  mediumPriority: {
    backgroundColor: '#fffbeb',
  },
  lowPriority: {
    backgroundColor: '#f0fdf4',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  taskDue: {
    fontSize: 11,
    color: '#9ca3af',
  },
  attendanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attendanceStatItem: {
    alignItems: 'center',
  },
  attendanceStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  attendanceStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  attendanceRecord: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  attendanceLeft: {
    flex: 1,
  },
  attendanceDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  attendanceNote: {
    fontSize: 12,
    color: '#6b7280',
  },
  attendanceStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  presentStatus: {
    backgroundColor: '#d1fae5',
  },
  absentStatus: {
    backgroundColor: '#fee2e2',
  },
  lateStatus: {
    backgroundColor: '#fef3c7',
  },
  excusedStatus: {
    backgroundColor: '#e0e7ff',
  },
  attendanceStatusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  parentInfo: {
    gap: 12,
  },
  parentDetails: {
    gap: 4,
  },
  parentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  parentOccupation: {
    fontSize: 14,
    color: '#6b7280',
  },
  parentLanguage: {
    fontSize: 12,
    color: '#9ca3af',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  emergencyContact: {
    gap: 8,
  },
  emergencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  emergencyRelation: {
    fontSize: 14,
    color: '#6b7280',
  },
  addressText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
    marginBottom: 16,
  },
  culturalConsiderations: {
    gap: 8,
  },
  culturalTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  culturalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  culturalText: {
    fontSize: 13,
    color: '#6b7280',
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d7452',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addNoteText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  behavioralSection: {
    marginBottom: 16,
  },
  behavioralSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  behavioralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  behavioralText: {
    fontSize: 13,
    color: '#6b7280',
  },
  noteItem: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  academicBadge: {
    backgroundColor: '#e0f2fe',
  },
  behavioralBadge: {
    backgroundColor: '#fff3e0',
  },
  socialBadge: {
    backgroundColor: '#f3e5f5',
  },
  healthBadge: {
    backgroundColor: '#ffebee',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  noteDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  noteContent: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
    marginBottom: 8,
  },
  noteTeacher: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  communicationActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  commAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  commActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  commHistoryItem: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  commHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commTypeText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  commDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  commSubject: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  commRecipient: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  commContent: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
    marginBottom: 8,
  },
  commResponse: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  commResponseLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  commResponseText: {
    fontSize: 13,
    color: '#1f2937',
  },
  followUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  followUpText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#dc2626',
  },
});