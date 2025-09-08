import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import {
  MessageSquare,
  Bell,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Filter,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import Card from '@/components/ui/Card';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'homework' | 'event';
  author: string;
  created_at: string;
  read: boolean;
  attachments?: string[];
}

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Welcome to the New Semester!',
    content: 'We are excited to start this new academic year with you. Please check your schedule and make sure you have all the required materials.',
    type: 'general',
    author: 'Principal Johnson',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
  },
  {
    id: '2',
    title: 'Math Quiz Tomorrow',
    content: 'Don\'t forget about the math quiz scheduled for tomorrow at 10 AM. Please review chapters 5-7.',
    type: 'homework',
    author: 'Mr. Smith',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    read: true,
  },
  {
    id: '3',
    title: 'School Closure Due to Weather',
    content: 'Due to severe weather conditions, the school will be closed tomorrow. All classes will be conducted online.',
    type: 'urgent',
    author: 'Administration',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    read: false,
  },
  {
    id: '4',
    title: 'Science Fair Registration Open',
    content: 'Registration for the annual science fair is now open. Submit your project proposals by next Friday.',
    type: 'event',
    author: 'Ms. Davis',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
  },
  {
    id: '5',
    title: 'Library Hours Extended',
    content: 'The library will now be open until 8 PM on weekdays to accommodate student study needs.',
    type: 'general',
    author: 'Librarian',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
];

export default function MessagesScreen() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState(mockAnnouncements);

  const filteredAnnouncements = useMemo(() => {
    switch (filter) {
      case 'unread':
        return announcements.filter(a => !a.read);
      case 'urgent':
        return announcements.filter(a => a.type === 'urgent');
      default:
        return announcements;
    }
  }, [announcements, filter]);

  const unreadCount = announcements.filter(a => !a.read).length;
  const urgentCount = announcements.filter(a => a.type === 'urgent').length;

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const markAsRead = (id: string) => {
    setAnnouncements(prev => 
      prev.map(a => a.id === id ? { ...a, read: true } : a)
    );
  };

  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle size={16} color={Colors.error} />;
      case 'homework':
        return <Clock size={16} color={Colors.warning} />;
      case 'event':
        return <Calendar size={16} color={Colors.info} />;
      default:
        return <Bell size={16} color={Colors.primary} />;
    }
  };

  const getTypeColor = (type: Announcement['type']) => {
    switch (type) {
      case 'urgent':
        return Colors.error;
      case 'homework':
        return Colors.warning;
      case 'event':
        return Colors.info;
      default:
        return Colors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => (
    <TouchableOpacity
      onPress={() => markAsRead(announcement.id)}
      testID={`announcement-${announcement.id}`}
    >
      <Card style={[
        styles.announcementCard,
        !announcement.read && styles.unreadCard
      ]}>
        <View style={styles.cardHeader}>
          <View style={styles.typeSection}>
            {getTypeIcon(announcement.type)}
            <Text style={[
              styles.typeText,
              { color: getTypeColor(announcement.type) }
            ]}>
              {announcement.type.toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.metaSection}>
            <Text style={styles.timeText}>{formatDate(announcement.created_at)}</Text>
            {!announcement.read && (
              <View style={styles.unreadDot} />
            )}
          </View>
        </View>

        <Text style={[
          styles.announcementTitle,
          !announcement.read && styles.unreadTitle
        ]}>
          {announcement.title}
        </Text>

        <Text style={styles.announcementContent} numberOfLines={3}>
          {announcement.content}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.authorSection}>
            <User size={14} color={Colors.textSecondary} />
            <Text style={styles.authorText}>{announcement.author}</Text>
          </View>
          
          {announcement.read ? (
            <CheckCircle2 size={16} color={Colors.success} />
          ) : (
            <View style={styles.unreadIndicator}>
              <Text style={styles.unreadText}>NEW</Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {unreadCount} unread • {urgentCount} urgent
          </Text>
        </View>
      </View>

      <View style={styles.filtersRow}>
        {(['all', 'unread', 'urgent'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            onPress={() => setFilter(filterType)}
            style={[
              styles.filterPill,
              filter === filterType && styles.filterPillActive
            ]}
            testID={`filter-${filterType}`}
          >
            <Filter size={14} color={filter === filterType ? '#fff' : Colors.textSecondary} />
            <Text style={[
              styles.filterText,
              filter === filterType && styles.filterTextActive
            ]}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              {filterType === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
              {filterType === 'urgent' && urgentCount > 0 && ` (${urgentCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        testID="messages-scroll"
      >
        <View style={styles.content}>
          {filteredAnnouncements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MessageSquare size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>
                {filter === 'unread' ? 'No unread messages' : 
                 filter === 'urgent' ? 'No urgent messages' : 
                 'No messages'}
              </Text>
              <Text style={styles.emptyDescription}>
                {filter === 'unread' ? 'You\'re all caught up!' : 
                 filter === 'urgent' ? 'No urgent announcements at the moment.' : 
                 'Messages and announcements will appear here.'}
              </Text>
            </View>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  filterTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  announcementCard: {
    padding: 16,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  metaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  announcementTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: 8,
  },
  unreadTitle: {
    fontWeight: FontWeights.bold,
  },
  announcementContent: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  unreadIndicator: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadText: {
    fontSize: FontSizes.xs,
    color: '#fff',
    fontWeight: FontWeights.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
});