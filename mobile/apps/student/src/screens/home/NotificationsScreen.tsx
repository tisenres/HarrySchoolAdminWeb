import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/design';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'achievement' | 'lesson' | 'reminder' | 'social';
  timestamp: string;
  isRead: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Achievement Unlocked!',
    message: 'You earned the "7-Day Streak" badge for consistent learning',
    type: 'achievement',
    timestamp: '2 hours ago',
    isRead: false,
  },
  {
    id: '2',
    title: 'Lesson Reminder',
    message: 'Your English Grammar lesson starts in 30 minutes',
    type: 'lesson',
    timestamp: '3 hours ago',
    isRead: false,
  },
  {
    id: '3',
    title: 'Quiz Results',
    message: 'Great job! You scored 95% on your vocabulary quiz',
    type: 'achievement',
    timestamp: '1 day ago',
    isRead: true,
  },
  {
    id: '4',
    title: 'Friend Activity',
    message: 'Sarah just completed 5 lessons and moved up in ranking!',
    type: 'social',
    timestamp: '2 days ago',
    isRead: true,
  },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'achievement': return 'trophy';
    case 'lesson': return 'book';
    case 'reminder': return 'alarm';
    case 'social': return 'people';
    default: return 'notifications';
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'achievement': return COLORS.gold;
    case 'lesson': return COLORS.primary;
    case 'reminder': return COLORS.warning;
    case 'social': return COLORS.secondary;
    default: return COLORS.gray400;
  }
};

export default function NotificationsScreen() {
  const renderNotification = ({ item }: { item: Notification }) => {
    const iconName = getNotificationIcon(item.type);
    const color = getNotificationColor(item.type);

    return (
      <TouchableOpacity 
        style={[
          styles.notificationCard,
          !item.isRead && styles.unreadCard
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={iconName as any} size={24} color={color} />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={mockNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    padding: SPACING.base,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  unreadTitle: {
    fontWeight: TYPOGRAPHY.bold,
  },
  message: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
    marginTop: SPACING.xs,
  },
});