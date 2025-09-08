import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Clock, MapPin, User, BookOpen, X, Calendar, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '@/components/ui/Card';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useStudent } from '@/providers/StudentProvider';

interface ScheduleItem {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  time: string;
  location: string;
  type: 'class' | 'homework' | 'exam';
  status: 'upcoming' | 'ongoing' | 'completed';
}

const mockSchedule: ScheduleItem[] = [
  {
    id: '1',
    title: 'English Grammar',
    subject: 'English',
    teacher: 'Ms. Johnson',
    time: '09:00 - 10:30',
    location: 'Room 201',
    type: 'class',
    status: 'upcoming',
  },
  {
    id: '2',
    title: 'Math Homework',
    subject: 'Mathematics',
    teacher: 'Mr. Smith',
    time: 'Due: 18:00',
    location: 'Online',
    type: 'homework',
    status: 'upcoming',
  },
  {
    id: '3',
    title: 'Science Quiz',
    subject: 'Science',
    teacher: 'Dr. Brown',
    time: '14:00 - 15:00',
    location: 'Lab 1',
    type: 'exam',
    status: 'upcoming',
  },
];

export default function TodaySchedule() {
  const { todaySchedule, isLoadingSchedule, scheduleError } = useStudent();
  const [showAllSchedule, setShowAllSchedule] = useState<boolean>(false);

  // Mock data fallback when Supabase fails or no data
  const fallbackSchedule = mockSchedule;
  const displaySchedule = scheduleError || !todaySchedule.length ? fallbackSchedule : todaySchedule.map(item => ({
    id: item.id,
    title: item.title,
    subject: item.subject || 'General',
    teacher: item.teacher || 'Teacher',
    time: new Date(item.start_time).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }) + ' - ' + new Date(item.end_time).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
    location: item.location || 'Online',
    type: item.type === 'event' ? 'class' : item.type as 'class' | 'homework' | 'exam',
    status: 'upcoming' as const,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return Colors.success;
      case 'completed':
        return Colors.textSecondary;
      default:
        return Colors.primary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'homework':
        return <BookOpen size={16} color={Colors.secondary} />;
      case 'exam':
        return <Clock size={16} color={Colors.error} />;
      default:
        return <User size={16} color={Colors.primary} />;
    }
  };

  return (
    <Card style={styles.container} testID="today-schedule">
      <View style={styles.header}>
        <Text style={styles.title}>Today&apos;s Schedule</Text>
        <TouchableOpacity onPress={() => {
          try {
            const { router } = require('expo-router');
            router.push('/(tabs)/attendance');
          } catch (e) {
            setShowAllSchedule(true);
          }
        }}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {isLoadingSchedule ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        ) : displaySchedule.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.scheduleItem}
            onPress={() => {
              Alert.alert(
                item.title,
                `${item.subject}\n${item.time}\nTeacher: ${item.teacher}\nLocation: ${item.location}`,
                [
                  { text: 'Close', style: 'cancel' },
                  { text: 'View Details', onPress: () => console.log('View details for', item.id) }
                ]
              );
            }}
          >
            <View style={styles.itemHeader}>
              {getTypeIcon(item.type)}
              <Text style={styles.itemTime}>{item.time}</Text>
            </View>
            
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemSubject}>{item.subject}</Text>
            
            <View style={styles.itemFooter}>
              <View style={styles.teacherInfo}>
                <User size={12} color={Colors.textSecondary} />
                <Text style={styles.teacherName}>{item.teacher}</Text>
              </View>
              <View style={styles.locationInfo}>
                <MapPin size={12} color={Colors.textSecondary} />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>
            </View>

            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
            <ChevronRight size={16} color={Colors.textSecondary} style={styles.chevron} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <Modal
        visible={showAllSchedule}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAllSchedule(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Calendar size={24} color={Colors.text} />
              <Text style={styles.modalTitle}>Full Schedule</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowAllSchedule(false)} 
              style={styles.closeButton}
            >
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <Text style={styles.sectionTitle}>Today - {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
              
              {displaySchedule.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.fullScheduleItem}
                  onPress={() => {
                    Alert.alert(
                      item.title,
                      `${item.subject}\n${item.time}\nTeacher: ${item.teacher}\nLocation: ${item.location}`,
                      [
                        { text: 'Close', style: 'cancel' },
                        { text: 'Join Class', onPress: () => console.log('Join class', item.id) }
                      ]
                    );
                  }}
                >
                  <View style={styles.fullItemIcon}>
                    {getTypeIcon(item.type)}
                  </View>
                  
                  <View style={styles.fullItemContent}>
                    <View style={styles.fullItemHeader}>
                      <Text style={styles.fullItemTitle}>{item.title}</Text>
                      <Text style={styles.fullItemTime}>{item.time}</Text>
                    </View>
                    
                    <Text style={styles.fullItemSubject}>{item.subject}</Text>
                    
                    <View style={styles.fullItemDetails}>
                      <View style={styles.detailRow}>
                        <User size={14} color={Colors.textSecondary} />
                        <Text style={styles.detailText}>{item.teacher}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MapPin size={14} color={Colors.textSecondary} />
                        <Text style={styles.detailText}>{item.location}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={[styles.fullItemStatus, { backgroundColor: getStatusColor(item.status) }]} />
                </TouchableOpacity>
              ))}
              
              <View style={styles.upcomingSection}>
                <Text style={styles.sectionTitle}>Upcoming This Week</Text>
                <View style={styles.upcomingPlaceholder}>
                  <Calendar size={32} color={Colors.textSecondary} />
                  <Text style={styles.placeholderText}>No upcoming classes this week</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  viewAll: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.primary,
  },
  scrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  scheduleItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 200,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTime: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  itemTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  itemSubject: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.primary,
    marginBottom: 8,
  },
  itemFooter: {
    gap: 4,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teacherName: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 32,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chevron: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 12,
  },
  fullScheduleItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    position: 'relative',
  },
  fullItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fullItemContent: {
    flex: 1,
    gap: 6,
  },
  fullItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fullItemTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  fullItemTime: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.primary,
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fullItemSubject: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.secondary,
  },
  fullItemDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  fullItemStatus: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  upcomingSection: {
    marginTop: 20,
  },
  upcomingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  placeholderText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});