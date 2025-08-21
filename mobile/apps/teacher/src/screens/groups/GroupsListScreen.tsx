import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

// Types and interfaces based on architecture
interface Group {
  id: string;
  name: string;
  subject: string;
  level: string;
  studentCount: number;
  attendanceRate: number;
  lastActivity: string;
  color: string;
  schedule: {
    days: string[];
    time: string;
  };
  stats: {
    presentToday: number;
    totalToday: number;
    averagePerformance: number;
    pendingTasks: number;
  };
}

interface GroupsListScreenProps {
  teacherId: string;
}

type ViewMode = 'grid' | 'list';

export const GroupsListScreen: React.FC<GroupsListScreenProps> = ({
  teacherId = 'default-teacher'
}) => {
  const navigation = useNavigation();
  const { width: screenWidth } = Dimensions.get('window');
  
  // State management
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Animation values
  const viewModeScale = useSharedValue(1);
  const searchInputHeight = useSharedValue(0);
  const isSearchVisible = useSharedValue(false);

  // Load groups data
  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - replace with actual API call
      const mockGroups: Group[] = [
        {
          id: '1',
          name: 'Beginner English A1',
          subject: 'English',
          level: 'A1',
          studentCount: 18,
          attendanceRate: 0.89,
          lastActivity: '2024-01-15T10:30:00Z',
          color: '#1d7452',
          schedule: {
            days: ['Mon', 'Wed', 'Fri'],
            time: '09:00'
          },
          stats: {
            presentToday: 16,
            totalToday: 18,
            averagePerformance: 78.5,
            pendingTasks: 3
          }
        },
        {
          id: '2',
          name: 'Intermediate English B1',
          subject: 'English',
          level: 'B1',
          studentCount: 22,
          attendanceRate: 0.92,
          lastActivity: '2024-01-15T14:00:00Z',
          color: '#2563eb',
          schedule: {
            days: ['Tue', 'Thu'],
            time: '14:00'
          },
          stats: {
            presentToday: 20,
            totalToday: 22,
            averagePerformance: 85.2,
            pendingTasks: 1
          }
        },
        {
          id: '3',
          name: 'Advanced Conversation',
          subject: 'English',
          level: 'B2',
          studentCount: 15,
          attendanceRate: 0.94,
          lastActivity: '2024-01-15T16:30:00Z',
          color: '#7c3aed',
          schedule: {
            days: ['Mon', 'Thu'],
            time: '16:30'
          },
          stats: {
            presentToday: 14,
            totalToday: 15,
            averagePerformance: 92.1,
            pendingTasks: 0
          }
        },
        {
          id: '4',
          name: 'IELTS Preparation',
          subject: 'English',
          level: 'C1',
          studentCount: 12,
          attendanceRate: 0.96,
          lastActivity: '2024-01-15T18:00:00Z',
          color: '#dc2626',
          schedule: {
            days: ['Tue', 'Fri'],
            time: '18:00'
          },
          stats: {
            presentToday: 12,
            totalToday: 12,
            averagePerformance: 88.7,
            pendingTasks: 2
          }
        }
      ];

      setGroups(mockGroups);
      setFilteredGroups(mockGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  // Initial load and focus refresh
  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.level.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  }, [loadGroups]);

  // View mode toggle with animation
  const toggleViewMode = () => {
    viewModeScale.value = withSpring(0.8, {}, () => {
      viewModeScale.value = withSpring(1);
    });

    const newMode: ViewMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
  };

  // Search toggle animation
  const toggleSearch = () => {
    const isVisible = isSearchVisible.value;
    isSearchVisible.value = !isVisible;
    
    searchInputHeight.value = withTiming(
      isVisible ? 0 : 60,
      { duration: 300 }
    );
  };

  // Group selection handlers
  const toggleGroupSelection = (groupId: string) => {
    const newSelection = new Set(selectedGroups);
    if (newSelection.has(groupId)) {
      newSelection.delete(groupId);
    } else {
      newSelection.add(groupId);
    }
    setSelectedGroups(newSelection);
    
    // Exit selection mode if no groups selected
    if (newSelection.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const startSelectionMode = (groupId: string) => {
    setIsSelectionMode(true);
    setSelectedGroups(new Set([groupId]));
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedGroups(new Set());
  };

  // Navigation handlers
  const navigateToGroup = (group: Group) => {
    if (isSelectionMode) {
      toggleGroupSelection(group.id);
    } else {
      navigation.navigate('GroupDetail' as never, { groupId: group.id } as never);
    }
  };

  // Render helpers
  const getAttendanceColor = (rate: number): string => {
    if (rate >= 0.9) return '#059669';
    if (rate >= 0.75) return '#d97706';
    return '#dc2626';
  };

  const formatLastActivity = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Animation styles
  const viewModeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: viewModeScale.value }]
  }));

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    height: searchInputHeight.value,
    opacity: searchInputHeight.value / 60
  }));

  // Grid item renderer
  const renderGridItem = ({ item }: { item: Group }) => {
    const isSelected = selectedGroups.has(item.id);
    const itemWidth = (screenWidth - 48) / 2; // 2 columns with padding

    return (
      <TouchableOpacity
        style={[
          styles.gridItem,
          { width: itemWidth },
          isSelected && styles.selectedItem
        ]}
        onPress={() => navigateToGroup(item)}
        onLongPress={() => startSelectionMode(item.id)}
        activeOpacity={0.7}
      >
        {isSelectionMode && (
          <View style={styles.selectionOverlay}>
            <View style={[styles.selectionCheckbox, isSelected && styles.selectedCheckbox]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </View>
          </View>
        )}
        
        <View style={[styles.groupHeader, { backgroundColor: item.color }]}>
          <Text style={styles.groupLevel}>{item.level}</Text>
          <View style={styles.attendanceBadge}>
            <Text style={styles.attendanceBadgeText}>
              {Math.round(item.attendanceRate * 100)}%
            </Text>
          </View>
        </View>

        <View style={styles.groupContent}>
          <Text style={styles.groupName} numberOfLines={2}>
            {item.name}
          </Text>
          
          <View style={styles.groupStats}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={14} color="#6b7280" />
              <Text style={styles.statText}>{item.studentCount}</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[
                styles.attendanceDot,
                { backgroundColor: getAttendanceColor(item.attendanceRate) }
              ]} />
              <Text style={styles.statText}>
                {item.stats.presentToday}/{item.stats.totalToday}
              </Text>
            </View>
          </View>

          <View style={styles.groupSchedule}>
            <Text style={styles.scheduleText}>
              {item.schedule.days.join(', ')} • {item.schedule.time}
            </Text>
          </View>

          {item.stats.pendingTasks > 0 && (
            <View style={styles.pendingTasksBadge}>
              <Text style={styles.pendingTasksText}>
                {item.stats.pendingTasks} pending
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // List item renderer
  const renderListItem = ({ item }: { item: Group }) => {
    const isSelected = selectedGroups.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.listItem, isSelected && styles.selectedItem]}
        onPress={() => navigateToGroup(item)}
        onLongPress={() => startSelectionMode(item.id)}
        activeOpacity={0.7}
      >
        {isSelectionMode && (
          <View style={styles.listSelectionCheckbox}>
            <View style={[styles.selectionCheckbox, isSelected && styles.selectedCheckbox]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </View>
          </View>
        )}

        <View style={[styles.listColorBar, { backgroundColor: item.color }]} />
        
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listGroupName}>{item.name}</Text>
              <Text style={styles.listGroupSubject}>{item.subject} • {item.level}</Text>
            </View>
            
            <View style={styles.listStats}>
              <View style={[
                styles.attendanceBadge,
                { backgroundColor: getAttendanceColor(item.attendanceRate) }
              ]}>
                <Text style={styles.attendanceBadgeText}>
                  {Math.round(item.attendanceRate * 100)}%
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.listDetails}>
            <View style={styles.listDetailItem}>
              <Ionicons name="people" size={14} color="#6b7280" />
              <Text style={styles.listDetailText}>
                {item.stats.presentToday}/{item.stats.totalToday} today
              </Text>
            </View>

            <View style={styles.listDetailItem}>
              <Ionicons name="time" size={14} color="#6b7280" />
              <Text style={styles.listDetailText}>
                {item.schedule.days.join(', ')} • {item.schedule.time}
              </Text>
            </View>

            <View style={styles.listDetailItem}>
              <Ionicons name="trending-up" size={14} color="#6b7280" />
              <Text style={styles.listDetailText}>
                Avg: {item.stats.averagePerformance.toFixed(1)}%
              </Text>
            </View>
          </View>

          {item.stats.pendingTasks > 0 && (
            <View style={styles.listPendingTasks}>
              <Ionicons name="alert-circle" size={14} color="#f59e0b" />
              <Text style={styles.listPendingTasksText}>
                {item.stats.pendingTasks} pending tasks
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Bulk actions renderer
  const renderBulkActions = () => {
    if (!isSelectionMode || selectedGroups.size === 0) return null;

    return (
      <View style={styles.bulkActionsContainer}>
        <Text style={styles.bulkActionsText}>
          {selectedGroups.size} group{selectedGroups.size > 1 ? 's' : ''} selected
        </Text>
        
        <View style={styles.bulkActionsButtons}>
          <TouchableOpacity style={styles.bulkActionButton} onPress={() => {}}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text style={styles.bulkActionText}>Mark All Present</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.bulkActionButton} onPress={() => {}}>
            <Ionicons name="mail" size={20} color="#2563eb" />
            <Text style={styles.bulkActionText}>Send Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.bulkActionButton} onPress={exitSelectionMode}>
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>My Groups</Text>
          <Text style={styles.headerSubtitle}>
            {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={toggleSearch}>
            <Ionicons name="search" size={20} color="#374151" />
          </TouchableOpacity>

          <Animated.View style={viewModeAnimatedStyle}>
            <TouchableOpacity style={styles.headerButton} onPress={toggleViewMode}>
              <Ionicons 
                name={viewMode === 'grid' ? 'list' : 'grid'} 
                size={20} 
                color="#374151" 
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Search Input */}
      <Animated.View style={[styles.searchContainer, searchAnimatedStyle]}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={16} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups, subjects, or levels..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Bulk Actions */}
      {renderBulkActions()}

      {/* Groups List */}
      <FlatList
        data={filteredGroups}
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={[
          styles.listContainer,
          viewMode === 'grid' && styles.gridContainer
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1d7452']}
            tintColor="#1d7452"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="school" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No groups found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'You have no groups assigned'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  bulkActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1d7452',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bulkActionsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  bulkActionsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  bulkActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  gridContainer: {
    gap: 16,
  },
  gridItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  listItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: '#1d7452',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  listSelectionCheckbox: {
    paddingLeft: 16,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#1d7452',
    borderColor: '#1d7452',
  },
  groupHeader: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  groupLevel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  attendanceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendanceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  groupContent: {
    padding: 16,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    lineHeight: 20,
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  attendanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupSchedule: {
    marginBottom: 8,
  },
  scheduleText: {
    fontSize: 12,
    color: '#6b7280',
  },
  pendingTasksBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pendingTasksText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '500',
  },
  listColorBar: {
    width: 4,
  },
  listContent: {
    flex: 1,
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listGroupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  listGroupSubject: {
    fontSize: 12,
    color: '#6b7280',
  },
  listStats: {
    alignItems: 'flex-end',
  },
  listDetails: {
    gap: 6,
    marginBottom: 8,
  },
  listDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  listPendingTasks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  listPendingTasksText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});