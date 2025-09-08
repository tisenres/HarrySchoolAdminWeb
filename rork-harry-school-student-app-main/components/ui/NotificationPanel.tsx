import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { X, Bell, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'reminder';
  timestamp: Date;
  read: boolean;
  actionText?: string;
  onAction?: () => void;
}

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Assignment Due Soon',
    message: 'Your English essay is due in 2 hours. Don\'t forget to submit!',
    type: 'warning',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    actionText: 'View Assignment',
  },
  {
    id: '2',
    title: 'Great Job!',
    message: 'You completed 5 tasks today and earned 150 points!',
    type: 'success',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: '3',
    title: 'New Lesson Available',
    message: 'Advanced Grammar: Conditional Sentences is now available.',
    type: 'info',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true,
    actionText: 'Start Lesson',
  },
  {
    id: '4',
    title: 'Study Reminder',
    message: 'Time for your daily vocabulary practice!',
    type: 'reminder',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: true,
  },
];

export default function NotificationPanel({ visible, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color={Colors.success} />;
      case 'warning':
        return <AlertCircle size={20} color={Colors.error} />;
      case 'info':
        return <Info size={20} color={Colors.primary} />;
      case 'reminder':
        return <Clock size={20} color={Colors.secondary} />;
      default:
        return <Bell size={20} color={Colors.textSecondary} />;
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Bell size={24} color={Colors.text} />
            <Text style={styles.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyMessage}>You&apos;re all caught up!</Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.unreadNotification
                  ]}
                  onPress={() => {
                    markAsRead(notification.id);
                    notification.onAction?.();
                  }}
                >
                  <View style={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.read && styles.unreadTitle
                      ]}>
                        {notification.title}
                      </Text>
                      <Text style={styles.timestamp}>
                        {getTimeAgo(notification.timestamp)}
                      </Text>
                    </View>
                    
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    
                    {notification.actionText && (
                      <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionText}>{notification.actionText}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {!notification.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  unreadBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary + '22',
  },
  markAllText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
  },
  emptyMessage: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  notificationsList: {
    padding: 20,
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: Colors.primary + '08',
    borderColor: Colors.primary + '33',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    gap: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: FontWeights.bold,
  },
  timestamp: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  notificationMessage: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.primary + '22',
    marginTop: 4,
  },
  actionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.primary,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});