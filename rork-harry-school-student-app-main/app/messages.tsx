import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import Card from '@/components/ui/Card';
import { Bell, AlertCircle, Calendar, Clock, MessageSquare } from 'lucide-react-native';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'homework' | 'event';
  author: string;
  created_at: string;
  read: boolean;
}

function MessagesView() {
  const announcements: Announcement[] = React.useMemo(() => ([
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
      content: "Don't forget about the math quiz scheduled for tomorrow at 10 AM. Please review chapters 5-7.",
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
  ]), []);

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

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard} testID="messages-header">
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.iconWrap}>
              <MessageSquare size={18} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Announcements</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.markAll}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <View style={styles.list}>
        {announcements.map((a) => (
          <Card key={a.id} style={styles.item}>
            <View style={styles.itemHeader}>
              <View style={styles.badge}>
                {getTypeIcon(a.type)}
                <Text style={[styles.badgeText, { color: getTypeColor(a.type) }]}>{a.type.toUpperCase()}</Text>
              </View>
              <Text style={styles.time}>{formatDate(a.created_at)}</Text>
            </View>
            <Text style={styles.itemTitle}>{a.title}</Text>
            <Text style={styles.itemText}>{a.content}</Text>
            <Text style={styles.author}>— {a.author}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

export default function MessagesPage() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Messages',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }} 
      />
      <MessagesView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 12, paddingBottom: 100 },
  headerCard: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '22', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.text },
  markAll: { color: Colors.primary, fontWeight: FontWeights.semibold },
  list: { gap: 12 },
  item: { padding: 16 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  badgeText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },
  time: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  itemTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.text, marginBottom: 6 },
  itemText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20 },
  author: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
});