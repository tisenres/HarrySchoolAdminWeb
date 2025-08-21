# Mobile Architecture: Groups Management System
Agent: mobile-developer
Date: 2025-08-21

## Executive Summary

This comprehensive mobile architecture designs a Groups management system for the Harry School Teacher App, based on extensive UX research findings. The architecture prioritizes gesture-based interactions (40% efficiency improvement), offline-first functionality (95% availability), and cultural integration for Uzbekistan's Islamic educational context.

**Key Architectural Decisions:**
- React Native 0.73+ with Expo SDK 51 for cross-platform development
- React Native Reanimated 3.6+ for 60fps gesture-based interactions
- OP-SQLite for offline-first database with intelligent sync
- Islamic calendar integration with prayer time awareness
- Cultural communication protocols with family hierarchy respect

## Architecture Overview

### App Structure
```
apps/teacher/
├── src/
│   ├── screens/
│   │   ├── groups/
│   │   │   ├── GroupsListScreen.tsx          # Main groups overview
│   │   │   ├── GroupDetailScreen.tsx         # Individual group management  
│   │   │   ├── StudentProfileScreen.tsx      # Student details & management
│   │   │   └── AttendanceScreen.tsx          # Gesture-based attendance marking
│   │   └── components/
│   │       ├── GroupSwitcher.tsx             # Quick group navigation
│   │       ├── BulkActionsProvider.tsx       # Gesture-based bulk operations
│   │       ├── CulturalGreeting.tsx          # Islamic greeting system
│   │       └── StudentCard.tsx               # Optimized student display
│   ├── navigation/
│   │   ├── GroupsStackNavigator.tsx          # Groups navigation stack
│   │   └── types.ts                          # Navigation type definitions
│   ├── services/
│   │   ├── groupsDatabase.service.ts         # OP-SQLite group operations
│   │   ├── offlineSync.service.ts            # Intelligent sync strategy
│   │   ├── islamicCalendar.service.ts        # Cultural calendar integration
│   │   └── culturalCommunication.service.ts  # Respectful messaging
│   ├── hooks/
│   │   ├── useGroupsData.ts                  # Group data management
│   │   ├── useGestureMarketing.ts            # Gesture attendance marking
│   │   ├── useOfflineQueue.ts                # Offline operations queue
│   │   └── useCulturalContext.ts             # Cultural adaptation
│   └── stores/
│       ├── groupsStore.ts                    # Zustand groups state
│       ├── offlineStore.ts                   # Offline queue management
│       └── culturalStore.ts                  # Cultural preferences
```

### Technology Stack

**Core Framework:**
- React Native 0.73+ with New Architecture (Fabric + TurboModules)
- Expo SDK 51 for development and deployment
- TypeScript 5.x with strict typing and educational domain models

**Navigation & Gestures:**
- React Navigation 7 with tab-based architecture (5 tabs: Home, Groups, Schedule, Feedback, Profile)
- React Native Reanimated 3.6+ for gesture handling and 60fps animations
- React Native Gesture Handler 2.0+ for swipe-based bulk operations

**State Management:**
- Zustand 4.x for local state (groups, UI state, offline queue)
- React Query 5.x for server state and cache management
- Jotai for atomic cultural context management

**Database & Storage:**
- OP-SQLite for offline-first database with encryption support
- MMKV for secure preferences and quick access data
- React Native File System for cultural asset management

**Performance & Caching:**
- Multi-layer caching: Memory → MMKV → SQLite → Network
- Intelligent prefetching based on teacher workflow patterns
- Background sync with exponential backoff

## Component Hierarchy and Data Flow

### 1. GroupsListScreen Architecture

```typescript
interface GroupsListScreenProps {
  navigation: NavigationProp<GroupsStackParamList>;
  route: RouteProp<GroupsStackParamList, 'GroupsList'>;
}

const GroupsListScreen: FC<GroupsListScreenProps> = () => {
  // Data Management
  const { groups, loading, error, refresh } = useGroupsData();
  const { culturalGreeting, isRamadan } = useCulturalContext();
  const { queuedActions } = useOfflineQueue();
  
  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  // Gesture Management
  const { bulkMarkAttendance } = useGestureMarketing();
  const panGesture = useBulkSelectionGesture();
  
  // Performance Optimization
  const renderGroup = useCallback((group: Group) => (
    <GroupCard
      group={group}
      onPress={() => navigateToDetails(group.id)}
      onLongPress={() => enterBulkMode(group.id)}
      culturalContext={culturalGreeting}
    />
  ), [culturalGreeting]);

  return (
    <GestureDetector gesture={panGesture}>
      <SafeAreaView style={styles.container}>
        <GroupsHeader 
          greeting={culturalGreeting}
          pendingSync={queuedActions.length}
          onRefresh={refresh}
        />
        
        <GroupSwitcher 
          groups={groups}
          onQuickSwitch={handleQuickSwitch}
        />
        
        <FlatList
          data={groups}
          renderItem={renderGroup}
          numColumns={viewMode === 'grid' ? 2 : 1}
          getItemLayout={getItemLayout}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews
        />
        
        <BulkActionsFAB 
          selectedCount={selectedGroups.length}
          onBulkAttendance={bulkMarkAttendance}
        />
      </SafeAreaView>
    </GestureDetector>
  );
};
```

### 2. GroupDetailScreen Architecture

```typescript
interface GroupDetailProps {
  navigation: NavigationProp<GroupsStackParamList>;
  route: RouteProp<GroupsStackParamList, 'GroupDetail'>;
}

const GroupDetailScreen: FC<GroupDetailProps> = ({ route }) => {
  const { groupId } = route.params;
  
  // Data Hooks
  const { group, students, loading } = useGroupDetail(groupId);
  const { markAttendance, undoLastAction } = useAttendanceActions(groupId);
  const { sendMessage } = useCulturalCommunication();
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'attendance' | 'performance' | 'communication'>('attendance');
  
  // Gesture Configuration
  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Handle student card swipe for attendance
      const studentId = getStudentIdFromPosition(event.absoluteX, event.absoluteY);
      if (studentId && Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const status = event.translationX > 0 ? 'present' : 'absent';
        markAttendance(studentId, status);
      }
    })
    .onEnd(() => {
      // Provide haptic feedback
      HapticFeedback.impact(HapticFeedbackTypes.light);
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <Screen>
        <GroupHeader 
          group={group}
          culturalTime={getIslamicTime()}
          onNavigateBack={() => navigation.goBack()}
        />
        
        <TabView
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { 
              key: 'attendance', 
              title: 'Attendance',
              icon: 'checklist',
              priority: 1 // 78% of interactions
            },
            { 
              key: 'performance', 
              title: 'Performance',
              icon: 'trending-up',
              priority: 2
            },
            { 
              key: 'communication', 
              title: 'Messages',
              icon: 'message-circle',
              priority: 3
            }
          ]}
        />
        
        <TabContent activeTab={activeTab}>
          {activeTab === 'attendance' && (
            <AttendanceTabContent 
              students={students}
              onSwipeAttendance={markAttendance}
              culturalContext={group.culturalContext}
            />
          )}
          
          {activeTab === 'performance' && (
            <PerformanceTabContent 
              students={students}
              groupMetrics={group.metrics}
            />
          )}
          
          {activeTab === 'communication' && (
            <CommunicationTabContent 
              students={students}
              onSendMessage={sendMessage}
              culturalTemplates={getCulturalTemplates()}
            />
          )}
        </TabContent>
        
        <QuickActionsFAB 
          groupId={groupId}
          actions={getContextualActions(activeTab)}
        />
      </Screen>
    </GestureDetector>
  );
};
```

## Navigation Structure and Routing

### GroupsStackNavigator Configuration

```typescript
export type GroupsStackParamList = {
  GroupsList: undefined;
  GroupDetail: { groupId: string; initialTab?: 'attendance' | 'performance' | 'communication' };
  StudentProfile: { studentId: string; groupId: string };
  BulkAttendance: { groupIds: string[] };
  CulturalCalendar: { date?: string };
};

const GroupsStack = createNativeStackNavigator<GroupsStackParamList>();

export const GroupsStackNavigator: FC = () => {
  const { culturalTheme } = useCulturalContext();
  
  return (
    <GroupsStack.Navigator
      initialRouteName="GroupsList"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <GroupsStack.Screen 
        name="GroupsList" 
        component={GroupsListScreen}
        options={{
          title: 'My Groups',
          headerTitle: () => <CulturalHeader greeting="Assalamu alaikum" />,
        }}
      />
      
      <GroupsStack.Screen 
        name="GroupDetail" 
        component={GroupDetailScreen}
        options={({ route }) => ({
          title: `Group Details`,
          headerBackTitle: 'Groups',
          gestureEnabled: true,
        })}
      />
      
      <GroupsStack.Screen 
        name="StudentProfile" 
        component={StudentProfileScreen}
        options={{
          title: 'Student Profile',
          presentation: 'modal',
          animationTypeForReplace: 'push',
        }}
      />
      
      <GroupsStack.Screen 
        name="BulkAttendance" 
        component={BulkAttendanceScreen}
        options={{
          title: 'Bulk Attendance',
          presentation: 'fullScreenModal',
        }}
      />
      
      <GroupsStack.Screen 
        name="CulturalCalendar" 
        component={CulturalCalendarScreen}
        options={{
          title: 'Islamic Calendar',
          presentation: 'modal',
        }}
      />
    </GroupsStack.Navigator>
  );
};
```

### Deep Linking Configuration

```typescript
export const groupsLinkingConfig = {
  screens: {
    GroupsList: 'groups',
    GroupDetail: 'groups/:groupId',
    StudentProfile: 'groups/:groupId/students/:studentId',
    BulkAttendance: 'groups/bulk-attendance',
    CulturalCalendar: 'calendar/:date?',
  },
};

// Usage in main navigation container
const linking = {
  prefixes: ['harryschool://teacher/', 'https://teacher.harryschool.uz/'],
  config: {
    screens: {
      Groups: {
        screens: groupsLinkingConfig.screens,
      },
    },
  },
};
```

## State Management Strategy

### Zustand Store Architecture

```typescript
interface GroupsState {
  // Data State
  groups: Group[];
  selectedGroupId: string | null;
  students: Record<string, Student[]>;
  
  // UI State
  loading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  bulkSelectionMode: boolean;
  selectedStudents: string[];
  
  // Cultural Context
  culturalSettings: CulturalSettings;
  islamicCalendar: IslamicCalendarData;
  
  // Offline State
  offlineQueue: OfflineAction[];
  lastSyncTime: Date | null;
  syncInProgress: boolean;
  
  // Actions
  setGroups: (groups: Group[]) => void;
  selectGroup: (groupId: string) => void;
  updateStudentAttendance: (studentId: string, status: AttendanceStatus) => void;
  addToOfflineQueue: (action: OfflineAction) => void;
  processOfflineQueue: () => Promise<void>;
  setCulturalContext: (settings: CulturalSettings) => void;
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  // Initial state
  groups: [],
  selectedGroupId: null,
  students: {},
  loading: false,
  error: null,
  viewMode: 'grid',
  bulkSelectionMode: false,
  selectedStudents: [],
  culturalSettings: DEFAULT_CULTURAL_SETTINGS,
  islamicCalendar: {},
  offlineQueue: [],
  lastSyncTime: null,
  syncInProgress: false,
  
  // Actions
  setGroups: (groups) => set({ groups }),
  
  selectGroup: (groupId) => set({ 
    selectedGroupId: groupId,
    bulkSelectionMode: false,
    selectedStudents: []
  }),
  
  updateStudentAttendance: (studentId, status) => {
    const action: OfflineAction = {
      id: generateId(),
      type: 'ATTENDANCE_UPDATE',
      payload: { studentId, status, timestamp: new Date() },
      retries: 0,
      createdAt: new Date(),
    };
    
    set((state) => ({
      offlineQueue: [...state.offlineQueue, action]
    }));
    
    // Optimistic update
    const { students, selectedGroupId } = get();
    if (selectedGroupId && students[selectedGroupId]) {
      const updatedStudents = students[selectedGroupId].map(student =>
        student.id === studentId 
          ? { ...student, attendanceStatus: status }
          : student
      );
      
      set((state) => ({
        students: {
          ...state.students,
          [selectedGroupId]: updatedStudents
        }
      }));
    }
  },
  
  addToOfflineQueue: (action) => set((state) => ({
    offlineQueue: [...state.offlineQueue, action]
  })),
  
  processOfflineQueue: async () => {
    const { offlineQueue } = get();
    set({ syncInProgress: true });
    
    try {
      for (const action of offlineQueue) {
        await processOfflineAction(action);
      }
      
      set({ 
        offlineQueue: [],
        lastSyncTime: new Date(),
        syncInProgress: false 
      });
    } catch (error) {
      console.error('Sync failed:', error);
      set({ syncInProgress: false });
    }
  },
  
  setCulturalContext: (settings) => set({ culturalSettings: settings }),
}));
```

### React Query Integration

```typescript
export const groupsQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Groups data hook
export const useGroupsData = () => {
  const { culturalSettings } = useGroupsStore();
  
  return useQuery({
    queryKey: ['groups', culturalSettings.language],
    queryFn: async () => {
      // Try offline first
      const offlineGroups = await getOfflineGroups();
      if (offlineGroups.length > 0) {
        return offlineGroups;
      }
      
      // Fetch from server
      const groups = await fetchGroupsFromServer();
      
      // Cache offline
      await cacheGroupsOffline(groups);
      
      return groups;
    },
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: 'offlineFirst',
  });
};

// Student attendance mutation
export const useAttendanceMutation = () => {
  const { addToOfflineQueue } = useGroupsStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ studentId, status, groupId }: AttendanceUpdate) => {
      try {
        // Try immediate sync
        const result = await updateAttendanceOnServer({ studentId, status, groupId });
        return result;
      } catch (error) {
        // Add to offline queue
        const action: OfflineAction = {
          id: generateId(),
          type: 'ATTENDANCE_UPDATE',
          payload: { studentId, status, groupId, timestamp: new Date() },
          retries: 0,
          createdAt: new Date(),
        };
        
        addToOfflineQueue(action);
        await saveOfflineAction(action);
        
        throw error; // Let the UI handle offline state
      }
    },
    
    onMutate: async ({ studentId, status, groupId }) => {
      // Optimistic update
      await queryClient.cancelQueries(['groups', groupId, 'students']);
      
      const previousStudents = queryClient.getQueryData(['groups', groupId, 'students']);
      
      queryClient.setQueryData(['groups', groupId, 'students'], (old: Student[]) =>
        old?.map(student =>
          student.id === studentId
            ? { ...student, attendanceStatus: status, lastUpdated: new Date() }
            : student
        )
      );
      
      return { previousStudents };
    },
    
    onError: (err, variables, context) => {
      // Rollback optimistic update
      if (context?.previousStudents) {
        queryClient.setQueryData(
          ['groups', variables.groupId, 'students'],
          context.previousStudents
        );
      }
    },
    
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries(['groups', variables.groupId]);
      queryClient.invalidateQueries(['attendance', variables.studentId]);
    },
  });
};
```

## Caching and Offline Architecture

### Multi-Layer Caching Strategy

```typescript
interface CacheLayer {
  name: string;
  ttl: number;
  maxSize: number;
  priority: CachePriority;
}

export enum CachePriority {
  CRITICAL = 1,    // Current day's groups and students
  HIGH = 2,        // This week's data
  MEDIUM = 3,      // Recent data (last 30 days)
  LOW = 4,         // Historical data
}

export const cacheConfiguration: CacheLayer[] = [
  {
    name: 'memory',
    ttl: 5 * 60 * 1000,      // 5 minutes
    maxSize: 50 * 1024 * 1024, // 50MB
    priority: CachePriority.CRITICAL,
  },
  {
    name: 'mmkv',
    ttl: 30 * 60 * 1000,     // 30 minutes
    maxSize: 100 * 1024 * 1024, // 100MB
    priority: CachePriority.HIGH,
  },
  {
    name: 'sqlite',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 500 * 1024 * 1024, // 500MB
    priority: CachePriority.MEDIUM,
  },
];

export class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private mmkvStorage = new MMKV({ id: 'groups-cache' });
  private sqliteDB: OpSqliteConnection;
  
  constructor() {
    this.initializeSQLiteCache();
  }
  
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data as T;
    }
    
    // Check MMKV cache
    const mmkvData = this.mmkvStorage.getString(key);
    if (mmkvData) {
      const entry: CacheEntry = JSON.parse(mmkvData);
      if (!this.isExpired(entry)) {
        // Promote to memory cache
        this.memoryCache.set(key, entry);
        return entry.data as T;
      }
    }
    
    // Check SQLite cache
    const sqliteResult = await this.sqliteDB.execute(
      'SELECT data, expires_at FROM cache WHERE key = ?',
      [key]
    );
    
    if (sqliteResult.rows.length > 0) {
      const row = sqliteResult.rows[0];
      const expiresAt = new Date(row.expires_at);
      
      if (expiresAt > new Date()) {
        const data = JSON.parse(row.data);
        
        // Promote to higher cache layers
        const entry: CacheEntry = {
          data,
          expiresAt: expiresAt.getTime(),
          priority: CachePriority.HIGH,
        };
        
        this.memoryCache.set(key, entry);
        this.mmkvStorage.set(key, JSON.stringify(entry));
        
        return data as T;
      }
    }
    
    return null;
  }
  
  async set<T>(key: string, data: T, priority: CachePriority = CachePriority.MEDIUM): Promise<void> {
    const config = cacheConfiguration.find(c => c.priority <= priority) || cacheConfiguration[0];
    const expiresAt = Date.now() + config.ttl;
    
    const entry: CacheEntry = {
      data,
      expiresAt,
      priority,
    };
    
    // Store in all appropriate cache layers
    if (priority <= CachePriority.CRITICAL) {
      this.memoryCache.set(key, entry);
    }
    
    if (priority <= CachePriority.HIGH) {
      this.mmkvStorage.set(key, JSON.stringify(entry));
    }
    
    // Always store in SQLite for persistence
    await this.sqliteDB.execute(
      'INSERT OR REPLACE INTO cache (key, data, expires_at, priority) VALUES (?, ?, ?, ?)',
      [key, JSON.stringify(data), new Date(expiresAt).toISOString(), priority]
    );
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }
  
  private async initializeSQLiteCache(): Promise<void> {
    this.sqliteDB = open({ name: 'groups-cache.db' });
    
    await this.sqliteDB.execute(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        priority INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create index for efficient queries
    await this.sqliteDB.execute(
      'CREATE INDEX IF NOT EXISTS idx_cache_expires_priority ON cache(expires_at, priority)'
    );
  }
  
  async cleanup(): Promise<void> {
    // Clean expired entries
    const now = new Date().toISOString();
    
    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clean SQLite cache
    await this.sqliteDB.execute(
      'DELETE FROM cache WHERE expires_at < ?',
      [now]
    );
    
    // TODO: Clean MMKV cache (no built-in expiration)
  }
}
```

### Offline Queue Management

```typescript
export interface OfflineAction {
  id: string;
  type: 'ATTENDANCE_UPDATE' | 'GRADE_UPDATE' | 'MESSAGE_SEND' | 'STUDENT_UPDATE';
  payload: any;
  retries: number;
  maxRetries: number;
  createdAt: Date;
  lastAttempt?: Date;
  priority: ActionPriority;
  culturalContext?: CulturalContext;
}

export enum ActionPriority {
  URGENT = 1,      // Attendance, emergency communications
  HIGH = 2,        // Grades, important updates
  MEDIUM = 3,      // Regular communications
  LOW = 4,         // Non-critical updates
}

export class OfflineQueueService {
  private queue: OfflineAction[] = [];
  private isProcessing = false;
  private db: OpSqliteConnection;
  
  constructor() {
    this.initializeDatabase();
    this.loadQueueFromDatabase();
  }
  
  async add(action: Omit<OfflineAction, 'id' | 'retries' | 'createdAt'>): Promise<void> {
    const fullAction: OfflineAction = {
      ...action,
      id: generateId(),
      retries: 0,
      maxRetries: this.getMaxRetriesForType(action.type),
      createdAt: new Date(),
    };
    
    this.queue.push(fullAction);
    await this.saveActionToDatabase(fullAction);
    
    // Sort queue by priority and creation time
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    
    // Process immediately if online
    if (await this.isOnline()) {
      this.processQueue();
    }
  }
  
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      const actionsToProcess = [...this.queue];
      
      for (const action of actionsToProcess) {
        try {
          await this.processAction(action);
          
          // Remove from queue on success
          this.queue = this.queue.filter(a => a.id !== action.id);
          await this.removeActionFromDatabase(action.id);
          
        } catch (error) {
          console.warn(`Action ${action.id} failed:`, error);
          
          // Increment retry count
          action.retries++;
          action.lastAttempt = new Date();
          
          if (action.retries >= action.maxRetries) {
            console.error(`Action ${action.id} exceeded max retries, removing from queue`);
            this.queue = this.queue.filter(a => a.id !== action.id);
            await this.removeActionFromDatabase(action.id);
            
            // Log to error tracking
            await this.logFailedAction(action, error);
          } else {
            // Update retry count in database
            await this.updateActionInDatabase(action);
          }
        }
        
        // Brief pause between actions to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.isProcessing = false;
    }
  }
  
  private async processAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'ATTENDANCE_UPDATE':
        return this.processAttendanceUpdate(action);
      case 'GRADE_UPDATE':
        return this.processGradeUpdate(action);
      case 'MESSAGE_SEND':
        return this.processMessageSend(action);
      case 'STUDENT_UPDATE':
        return this.processStudentUpdate(action);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
  
  private async processAttendanceUpdate(action: OfflineAction): Promise<void> {
    const { studentId, status, groupId, timestamp } = action.payload;
    
    // Add cultural context for timing (prayer time consideration)
    const culturalContext = action.culturalContext || await this.getCulturalContext(timestamp);
    
    const response = await fetch('/api/teacher/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        studentId,
        status,
        groupId,
        timestamp,
        culturalContext,
        offlineAction: true,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  }
  
  private getMaxRetriesForType(type: OfflineAction['type']): number {
    switch (type) {
      case 'ATTENDANCE_UPDATE':
        return 5; // High priority for attendance
      case 'GRADE_UPDATE':
        return 3;
      case 'MESSAGE_SEND':
        return 3;
      case 'STUDENT_UPDATE':
        return 2;
      default:
        return 2;
    }
  }
  
  private async isOnline(): Promise<boolean> {
    // Use NetInfo to check connectivity
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  }
  
  private async initializeDatabase(): Promise<void> {
    this.db = open({ name: 'offline-queue.db' });
    
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS offline_actions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        retries INTEGER DEFAULT 0,
        max_retries INTEGER NOT NULL,
        priority INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        last_attempt TEXT,
        cultural_context TEXT
      )
    `);
  }
  
  private async loadQueueFromDatabase(): Promise<void> {
    const results = await this.db.execute(
      'SELECT * FROM offline_actions ORDER BY priority ASC, created_at ASC'
    );
    
    this.queue = results.rows.map(row => ({
      id: row.id,
      type: row.type as OfflineAction['type'],
      payload: JSON.parse(row.payload),
      retries: row.retries,
      maxRetries: row.max_retries,
      priority: row.priority,
      createdAt: new Date(row.created_at),
      lastAttempt: row.last_attempt ? new Date(row.last_attempt) : undefined,
      culturalContext: row.cultural_context ? JSON.parse(row.cultural_context) : undefined,
    }));
  }
  
  getQueueStatus(): {
    totalActions: number;
    priorityBreakdown: Record<ActionPriority, number>;
    oldestAction?: Date;
  } {
    const priorityBreakdown = this.queue.reduce((acc, action) => {
      acc[action.priority] = (acc[action.priority] || 0) + 1;
      return acc;
    }, {} as Record<ActionPriority, number>);
    
    const oldestAction = this.queue.length > 0 
      ? new Date(Math.min(...this.queue.map(a => a.createdAt.getTime())))
      : undefined;
    
    return {
      totalActions: this.queue.length,
      priorityBreakdown,
      oldestAction,
    };
  }
}
```

## Gesture and Interaction Patterns

### Swipe-Based Attendance Marking

```typescript
export const useGestureAttendance = (students: Student[], onAttendanceUpdate: AttendanceUpdateFn) => {
  const studentPositions = useSharedValue<Record<string, { x: number; y: number }>>({});
  const attendanceStates = useSharedValue<Record<string, AttendanceStatus>>({});
  
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      'worklet';
      const studentId = getStudentIdFromPosition(event.absoluteX, event.absoluteY);
      if (studentId) {
        studentPositions.value = {
          ...studentPositions.value,
          [studentId]: { x: event.absoluteX, y: event.absoluteY }
        };
      }
    })
    .onUpdate((event) => {
      'worklet';
      const studentId = getStudentIdFromPosition(
        studentPositions.value[Object.keys(studentPositions.value)[0]]?.x || event.absoluteX,
        studentPositions.value[Object.keys(studentPositions.value)[0]]?.y || event.absoluteY
      );
      
      if (studentId && Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const newStatus: AttendanceStatus = event.translationX > 0 ? 'present' : 'absent';
        
        // Visual feedback
        const scale = interpolate(
          Math.abs(event.translationX),
          [SWIPE_THRESHOLD, SWIPE_THRESHOLD * 2],
          [1, 1.05],
          Extrapolation.CLAMP
        );
        
        const opacity = interpolate(
          Math.abs(event.translationX),
          [SWIPE_THRESHOLD, SWIPE_THRESHOLD * 2],
          [1, 0.8],
          Extrapolation.CLAMP
        );
        
        // Update visual state
        attendanceStates.value = {
          ...attendanceStates.value,
          [studentId]: newStatus
        };
      }
    })
    .onEnd((event) => {
      'worklet';
      const studentId = getStudentIdFromPosition(
        studentPositions.value[Object.keys(studentPositions.value)[0]]?.x || event.absoluteX,
        studentPositions.value[Object.keys(studentPositions.value)[0]]?.y || event.absoluteY
      );
      
      if (studentId && Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const finalStatus: AttendanceStatus = event.translationX > 0 ? 'present' : 'absent';
        
        // Haptic feedback
        runOnJS(() => {
          HapticFeedback.impact(HapticFeedbackTypes.light);
          onAttendanceUpdate(studentId, finalStatus);
        })();
      }
      
      // Reset position tracking
      studentPositions.value = {};
    });
  
  return {
    panGesture,
    attendanceStates,
  };
};

// Student card with gesture integration
export const StudentCard: FC<StudentCardProps> = ({ 
  student, 
  onAttendanceUpdate,
  culturalContext 
}) => {
  const { panGesture, attendanceStates } = useGestureAttendance([student], onAttendanceUpdate);
  
  const animatedStyle = useAnimatedStyle(() => {
    const currentStatus = attendanceStates.value[student.id];
    const backgroundColor = currentStatus === 'present' 
      ? culturalContext.colors.success
      : currentStatus === 'absent'
        ? culturalContext.colors.warning
        : culturalContext.colors.neutral;
    
    return {
      backgroundColor: withSpring(backgroundColor),
      transform: [
        { 
          scale: withSpring(currentStatus ? 1.02 : 1) 
        }
      ],
    };
  });
  
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.studentCard, animatedStyle]}>
        <StudentAvatar 
          student={student}
          size={AVATAR_SIZES.medium}
          culturalSensitive={culturalContext.isConservative}
        />
        
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {student.name}
          </Text>
          <Text style={styles.studentDetails}>
            {culturalContext.showParentNames ? student.parentName : student.class}
          </Text>
        </View>
        
        <AttendanceIndicator 
          status={student.currentAttendance}
          style={styles.attendanceIndicator}
        />
        
        <View style={styles.gestureHints}>
          <Text style={styles.swipeHint}>
            ← {culturalContext.labels.absent} | {culturalContext.labels.present} →
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};
```

### Bulk Selection Gestures

```typescript
export const useBulkSelectionGesture = (students: Student[], onBulkAction: BulkActionFn) => {
  const selectedItems = useSharedValue<string[]>([]);
  const selectionMode = useSharedValue(false);
  const longPressProgress = useSharedValue(0);
  
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart((event) => {
      'worklet';
      const studentId = getStudentIdFromPosition(event.absoluteX, event.absoluteY);
      if (studentId) {
        selectionMode.value = true;
        selectedItems.value = [studentId];
        
        runOnJS(() => {
          HapticFeedback.impact(HapticFeedbackTypes.medium);
        })();
      }
    })
    .onTouchesMove((event) => {
      'worklet';
      if (selectionMode.value) {
        const progress = Math.min(event.allTouches.length / 3, 1);
        longPressProgress.value = withSpring(progress);
      }
    });
  
  const panGesture = Gesture.Pan()
    .enabled(selectionMode.value)
    .onUpdate((event) => {
      'worklet';
      if (selectionMode.value) {
        const studentId = getStudentIdFromPosition(event.absoluteX, event.absoluteY);
        if (studentId && !selectedItems.value.includes(studentId)) {
          selectedItems.value = [...selectedItems.value, studentId];
          
          runOnJS(() => {
            HapticFeedback.impact(HapticFeedbackTypes.light);
          })();
        }
      }
    });
  
  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd((event) => {
      'worklet';
      if (selectionMode.value) {
        const studentId = getStudentIdFromPosition(event.absoluteX, event.absoluteY);
        if (studentId) {
          const currentSelected = selectedItems.value;
          if (currentSelected.includes(studentId)) {
            selectedItems.value = currentSelected.filter(id => id !== studentId);
          } else {
            selectedItems.value = [...currentSelected, studentId];
          }
          
          runOnJS(() => {
            HapticFeedback.impact(HapticFeedbackTypes.light);
          })();
        }
      }
    });
  
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      if (selectionMode.value) {
        selectionMode.value = false;
        selectedItems.value = [];
        longPressProgress.value = withSpring(0);
      }
    });
  
  const composedGesture = Gesture.Simultaneous(
    Gesture.Exclusive(longPressGesture, doubleTapGesture),
    panGesture,
    tapGesture
  );
  
  return {
    gesture: composedGesture,
    selectedItems,
    selectionMode,
    longPressProgress,
  };
};
```

## Cultural Integration Framework

### Islamic Calendar Integration

```typescript
export interface IslamicCalendarService {
  getCurrentIslamicDate(): IslamicDate;
  getPrayerTimes(date: Date, location: Location): PrayerTimes;
  isRamadan(date: Date): boolean;
  getIslamicHolidays(year: number): IslamicHoliday[];
  shouldShowCulturalGreeting(): boolean;
}

export class IslamicCalendarManager implements IslamicCalendarService {
  private hebcal: HebcalEngine;
  private location: Location;
  
  constructor(location: Location) {
    this.location = location;
    this.hebcal = new HebcalEngine();
  }
  
  getCurrentIslamicDate(): IslamicDate {
    const now = new Date();
    return this.hebcal.fromGregorian(now);
  }
  
  getPrayerTimes(date: Date, location: Location): PrayerTimes {
    const coordinates = new Coordinates(location.latitude, location.longitude);
    const prayerTimes = new PrayerTimes(coordinates, date, CalculationMethod.UmmAlQura);
    
    return {
      fajr: prayerTimes.fajr,
      dhuhr: prayerTimes.dhuhr,
      asr: prayerTimes.asr,
      maghrib: prayerTimes.maghrib,
      isha: prayerTimes.isha,
      sunrise: prayerTimes.sunrise,
      sunset: prayerTimes.sunset,
    };
  }
  
  isRamadan(date: Date = new Date()): boolean {
    const islamicDate = this.hebcal.fromGregorian(date);
    return islamicDate.month === 9; // Ramadan is the 9th month
  }
  
  getIslamicHolidays(year: number): IslamicHoliday[] {
    return [
      {
        name: 'Eid al-Fitr',
        islamicDate: { year, month: 10, day: 1 },
        duration: 3,
        type: 'major',
      },
      {
        name: 'Eid al-Adha',
        islamicDate: { year, month: 12, day: 10 },
        duration: 4,
        type: 'major',
      },
      {
        name: 'Mawlid an-Nabi',
        islamicDate: { year, month: 3, day: 12 },
        duration: 1,
        type: 'observance',
      },
      // Add more holidays as needed
    ];
  }
  
  shouldShowCulturalGreeting(): boolean {
    const now = new Date();
    const prayerTimes = this.getPrayerTimes(now, this.location);
    
    // Don't show notifications during prayer times
    const currentTime = now.getTime();
    const prayerTimeRanges = [
      { start: prayerTimes.fajr.getTime(), end: prayerTimes.sunrise.getTime() },
      { start: prayerTimes.dhuhr.getTime(), end: prayerTimes.dhuhr.getTime() + 30 * 60 * 1000 },
      { start: prayerTimes.asr.getTime(), end: prayerTimes.asr.getTime() + 30 * 60 * 1000 },
      { start: prayerTimes.maghrib.getTime(), end: prayerTimes.maghrib.getTime() + 30 * 60 * 1000 },
      { start: prayerTimes.isha.getTime(), end: prayerTimes.isha.getTime() + 30 * 60 * 1000 },
    ];
    
    return !prayerTimeRanges.some(range => 
      currentTime >= range.start && currentTime <= range.end
    );
  }
  
  getCulturalGreeting(): string {
    const now = new Date();
    const prayerTimes = this.getPrayerTimes(now, this.location);
    const currentTime = now.getTime();
    
    if (currentTime < prayerTimes.fajr.getTime()) {
      return 'Good evening'; // Late night
    } else if (currentTime < prayerTimes.dhuhr.getTime()) {
      return 'Good morning';
    } else if (currentTime < prayerTimes.asr.getTime()) {
      return 'Good afternoon';
    } else if (currentTime < prayerTimes.maghrib.getTime()) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }
}
```

### Cultural Communication Templates

```typescript
export interface CulturalCommunicationService {
  getGreetingTemplate(context: CommunicationContext): string;
  getAttendanceNotification(student: Student, status: AttendanceStatus): string;
  getAchievementMessage(student: Student, achievement: Achievement): string;
  getMeetingRequest(student: Student, purpose: string): string;
}

export class UzbekCulturalCommunication implements CulturalCommunicationService {
  private templates: Record<string, CommunicationTemplate>;
  
  constructor() {
    this.templates = {
      attendanceNotification: {
        uzbek: "Assalomu aleykum, hurmatli {parentTitle} {parentName}. Bugun {studentName} {subject} darsida {status} edi. Savollaringiz bo'lsa, iltimos bog'laning.",
        russian: "Ассалам алейкум, уважаемый {parentTitle} {parentName}. Сегодня {studentName} {status} на уроке {subject}. Если у вас есть вопросы, пожалуйста, свяжитесь с нами.",
        english: "Assalamu alaikum, respected {parentTitle} {parentName}. Today {studentName} was {status} in {subject} class. Please contact us if you have any concerns."
      },
      
      achievementCelebration: {
        uzbek: "Assalomu aleykum, hurmatli {parentTitle} {parentName}. {studentName}ning {subject} fanidan erishgan yutuqlarini ma'lum qilishdan mamnunmiz. Alloh taolo farzandingizni muvaffaqiyatga ergushtirsin.",
        russian: "Ассалам алейкум, уважаемый {parentTitle} {parentName}. Мы рады сообщить об отличных результатах {studentName} по предмету {subject}. Да благословит Аллах вашего ребенка успехом.",
        english: "Assalamu alaikum, respected {parentTitle} {parentName}. We are delighted to share {studentName}'s excellent achievement in {subject}. May Allah bless your child with continued success."
      },
      
      meetingRequest: {
        uzbek: "Assalomu aleykum, hurmatli {parentTitle} {parentName}. {studentName}ning o'qish jarayonini muhokama qilish uchun qisqa uchrashuvga vaqt ajratsangiz. Qulay vaqtingizni ma'lum qiling.",
        russian: "Ассалам алейкум, уважаемый {parentTitle} {parentName}. Хотели бы встретиться с вами для обсуждения успехов {studentName}. Сообщите удобное для вас время.",
        english: "Assalamu alaikum, respected {parentTitle} {parentName}. We would appreciate the opportunity to discuss {studentName}'s progress with you. Please let us know a convenient time for a brief meeting."
      },
    };
  }
  
  getGreetingTemplate(context: CommunicationContext): string {
    const timeBasedGreeting = this.getTimeBasedGreeting();
    const culturalPrefix = context.isFormalsetting ? "Assalomu aleykum, hurmatli" : "Assalomu aleykum";
    
    return `${culturalPrefix} ${context.recipientTitle} ${context.recipientName}. ${timeBasedGreeting}`;
  }
  
  getAttendanceNotification(student: Student, status: AttendanceStatus): string {
    const template = this.templates.attendanceNotification[student.familyLanguage] || 
                    this.templates.attendanceNotification.english;
    
    const statusTranslation = this.getStatusTranslation(status, student.familyLanguage);
    
    return this.interpolateTemplate(template, {
      parentTitle: this.getParentTitle(student.parentGender, student.familyLanguage),
      parentName: student.parentName,
      studentName: student.name,
      subject: student.currentSubject,
      status: statusTranslation,
    });
  }
  
  getAchievementMessage(student: Student, achievement: Achievement): string {
    const template = this.templates.achievementCelebration[student.familyLanguage] || 
                    this.templates.achievementCelebration.english;
    
    return this.interpolateTemplate(template, {
      parentTitle: this.getParentTitle(student.parentGender, student.familyLanguage),
      parentName: student.parentName,
      studentName: student.name,
      subject: achievement.subject,
      achievementDetails: achievement.description,
    });
  }
  
  getMeetingRequest(student: Student, purpose: string): string {
    const template = this.templates.meetingRequest[student.familyLanguage] || 
                    this.templates.meetingRequest.english;
    
    return this.interpolateTemplate(template, {
      parentTitle: this.getParentTitle(student.parentGender, student.familyLanguage),
      parentName: student.parentName,
      studentName: student.name,
      purpose,
    });
  }
  
  private getParentTitle(gender: 'male' | 'female', language: string): string {
    const titles = {
      uzbek: {
        male: 'Ota',
        female: 'Ona',
      },
      russian: {
        male: 'отец',
        female: 'мать',
      },
      english: {
        male: 'father',
        female: 'mother',
      },
    };
    
    return titles[language]?.[gender] || titles.english[gender];
  }
  
  private getStatusTranslation(status: AttendanceStatus, language: string): string {
    const translations = {
      uzbek: {
        present: 'ishtirok etdi',
        absent: 'kelmagandi',
        late: 'kechikdi',
        excused: 'uzrli sabab bilan kelmagandi',
      },
      russian: {
        present: 'присутствовал',
        absent: 'отсутствовал',
        late: 'опоздал',
        excused: 'отсутствовал по уважительной причине',
      },
      english: {
        present: 'present',
        absent: 'absent',
        late: 'late',
        excused: 'absent with excuse',
      },
    };
    
    return translations[language]?.[status] || translations.english[status];
  }
  
  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  }
  
  private getTimeBasedGreeting(): string {
    const islamicCalendar = new IslamicCalendarManager(DEFAULT_LOCATION);
    return islamicCalendar.getCulturalGreeting();
  }
}
```

## Performance Optimization Techniques

### Component Optimization

```typescript
// Optimized Student Card with React.memo and proper dependencies
export const StudentCard = React.memo<StudentCardProps>(({ 
  student, 
  onAttendanceUpdate,
  culturalContext,
  isSelected,
  selectionMode 
}) => {
  // Memoized handlers to prevent unnecessary re-renders
  const handlePress = useCallback(() => {
    if (selectionMode) {
      onSelect?.(student.id);
    } else {
      onPress?.(student.id);
    }
  }, [selectionMode, student.id, onSelect, onPress]);
  
  const handleLongPress = useCallback(() => {
    onLongPress?.(student.id);
  }, [student.id, onLongPress]);
  
  // Memoized style calculations
  const cardStyle = useMemo(() => [
    styles.studentCard,
    isSelected && styles.selectedCard,
    culturalContext.isConservative && styles.conservativeLayout,
  ], [isSelected, culturalContext.isConservative]);
  
  // Optimized rendering with conditional components
  return (
    <Pressable
      style={cardStyle}
      onPress={handlePress}
      onLongPress={handleLongPress}
      android_ripple={{ color: culturalContext.colors.ripple }}
    >
      <StudentAvatar 
        student={student}
        size={AVATAR_SIZES.small}
        showPhoto={!culturalContext.isConservative}
      />
      
      <View style={styles.studentInfo}>
        <Text style={styles.studentName} numberOfLines={1}>
          {student.name}
        </Text>
        
        {culturalContext.showParentInfo && (
          <Text style={styles.parentInfo} numberOfLines={1}>
            {student.parentName}
          </Text>
        )}
        
        <AttendanceStatus 
          status={student.currentAttendance}
          compact
        />
      </View>
      
      {selectionMode && (
        <SelectionIndicator isSelected={isSelected} />
      )}
    </Pressable>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.student.id === nextProps.student.id &&
    prevProps.student.currentAttendance === nextProps.student.currentAttendance &&
    prevProps.student.lastUpdated === nextProps.student.lastUpdated &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectionMode === nextProps.selectionMode &&
    prevProps.culturalContext.version === nextProps.culturalContext.version
  );
});
```

### List Virtualization

```typescript
// Optimized FlatList for large student groups
export const VirtualizedStudentList: FC<StudentListProps> = ({
  students,
  onStudentPress,
  culturalContext,
  searchQuery,
}) => {
  // Pre-filtered and sorted data
  const filteredStudents = useMemo(() => {
    let filtered = students;
    
    if (searchQuery) {
      filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.parentName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by cultural preferences (family name first if conservative)
    return filtered.sort((a, b) => {
      if (culturalContext.sortByFamilyName) {
        return a.familyName.localeCompare(b.familyName);
      }
      return a.name.localeCompare(b.name);
    });
  }, [students, searchQuery, culturalContext.sortByFamilyName]);
  
  // Optimized item layout calculation
  const getItemLayout = useCallback((data: Student[] | null | undefined, index: number) => ({
    length: STUDENT_CARD_HEIGHT,
    offset: STUDENT_CARD_HEIGHT * index,
    index,
  }), []);
  
  // Memoized render function
  const renderStudent = useCallback(({ item, index }: ListRenderItemInfo<Student>) => (
    <StudentCard
      key={item.id}
      student={item}
      onPress={onStudentPress}
      culturalContext={culturalContext}
      style={index === filteredStudents.length - 1 ? styles.lastItem : undefined}
    />
  ), [onStudentPress, culturalContext, filteredStudents.length]);
  
  // Key extractor
  const keyExtractor = useCallback((item: Student) => item.id, []);
  
  return (
    <FlatList
      data={filteredStudents}
      renderItem={renderStudent}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      
      // Performance optimizations
      maxToRenderPerBatch={15}
      windowSize={10}
      initialNumToRender={10}
      removeClippedSubviews
      
      // Update optimizations
      updateCellsBatchingPeriod={50}
      
      // Scroll optimizations
      scrollEventThrottle={16}
      
      // Empty state
      ListEmptyComponent={
        <EmptyState
          title={culturalContext.labels.noStudents}
          subtitle={culturalContext.labels.addStudentsHint}
          culturalIcon="student-group"
        />
      }
      
      // Footer for pull-to-refresh hint
      ListFooterComponent={
        filteredStudents.length > 20 ? (
          <Text style={styles.footerHint}>
            {culturalContext.labels.pullToRefresh}
          </Text>
        ) : null
      }
    />
  );
};
```

### Memory Management

```typescript
export class MemoryManager {
  private memoryWarningSubscription?: EmitterSubscription;
  private imageCache = new Map<string, string>();
  private componentRefs = new WeakMap<React.Component, string>();
  
  constructor() {
    this.setupMemoryWarningHandler();
  }
  
  private setupMemoryWarningHandler(): void {
    this.memoryWarningSubscription = DeviceEventEmitter.addListener(
      'memoryWarning',
      () => {
        console.warn('Memory warning received, cleaning up...');
        this.cleanupMemoryIntensiveOperations();
      }
    );
  }
  
  private cleanupMemoryIntensiveOperations(): void {
    // Clear image cache
    if (this.imageCache.size > 50) {
      const entries = Array.from(this.imageCache.entries());
      const toDelete = entries.slice(0, Math.floor(entries.length / 2));
      toDelete.forEach(([key]) => this.imageCache.delete(key));
    }
    
    // Force garbage collection of unreferenced components
    if (global.gc) {
      global.gc();
    }
    
    // Clear React Query cache for non-critical data
    queryClient.removeQueries({
      predicate: (query) => {
        return query.meta?.priority === 'low' || 
               (query.meta?.lastAccess && 
                Date.now() - query.meta.lastAccess > 5 * 60 * 1000);
      },
    });
  }
  
  trackComponentMount(component: React.Component, name: string): void {
    this.componentRefs.set(component, name);
  }
  
  trackComponentUnmount(component: React.Component): void {
    this.componentRefs.delete(component);
  }
  
  getMemoryUsageInfo(): MemoryInfo {
    const jsHeapSize = (performance as any).memory?.usedJSHeapSize || 0;
    const activeComponents = this.componentRefs.size;
    const cacheSize = this.imageCache.size;
    
    return {
      jsHeapSize,
      activeComponents,
      cacheSize,
      criticalThreshold: jsHeapSize > 100 * 1024 * 1024, // 100MB
    };
  }
  
  cleanup(): void {
    this.memoryWarningSubscription?.remove();
    this.imageCache.clear();
  }
}
```

## TypeScript Interfaces and Data Models

### Core Domain Models

```typescript
// Group Management Domain Models
export interface Group {
  id: string;
  name: string;
  subject: string;
  level: EducationLevel;
  capacity: number;
  currentEnrollment: number;
  schedule: GroupSchedule;
  teacherId: string;
  culturalContext: CulturalContext;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Student {
  id: string;
  name: string;
  familyName: string;
  dateOfBirth: Date;
  parentName: string;
  parentGender: 'male' | 'female';
  contactInfo: ContactInfo;
  culturalInfo: StudentCulturalInfo;
  academicInfo: AcademicInfo;
  groupIds: string[];
  currentAttendance?: AttendanceStatus;
  lastAttendanceUpdate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupSchedule {
  dayOfWeek: DayOfWeek[];
  startTime: string; // ISO time format
  endTime: string;
  timezone: string;
  exceptions: ScheduleException[];
  islamicHolidayAdjustments: boolean;
}

export interface CulturalContext {
  language: 'uzbek' | 'russian' | 'english';
  isConservative: boolean;
  showParentInfo: boolean;
  sortByFamilyName: boolean;
  useIslamicCalendar: boolean;
  prayerTimeNotifications: boolean;
  familyHierarchyRespect: boolean;
  colors: CulturalColorScheme;
  labels: CulturalLabels;
  version: number; // For cache invalidation
}

export interface ContactInfo {
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  address: Address;
  emergencyContact: EmergencyContact;
  preferredCommunicationMethod: 'sms' | 'call' | 'whatsapp' | 'telegram';
  availableHours: AvailableHours;
}

export interface StudentCulturalInfo {
  familyLanguage: 'uzbek' | 'russian' | 'english';
  isConservativeFamily: boolean;
  parentTitle: string;
  familyName: string;
  culturalSensitivities: string[];
  familyStructure: 'nuclear' | 'extended';
  communicationPreferences: CommunicationPreferences;
}

// Attendance & Performance Models
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  groupId: string;
  date: Date;
  status: AttendanceStatus;
  markedBy: string; // teacherId
  markedAt: Date;
  notes?: string;
  culturalContext?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  retryCount: number;
}

export interface BulkAttendanceOperation {
  id: string;
  groupId: string;
  studentIds: string[];
  status: AttendanceStatus;
  markedBy: string;
  markedAt: Date;
  culturalTimestamp: IslamicDate;
  completed: boolean;
  failedStudents: string[];
}

// Navigation Models
export interface GroupsNavigationParams {
  GroupsList: undefined;
  GroupDetail: {
    groupId: string;
    initialTab?: 'attendance' | 'performance' | 'communication';
    culturalMode?: boolean;
  };
  StudentProfile: {
    studentId: string;
    groupId: string;
    mode?: 'view' | 'edit';
  };
  BulkAttendance: {
    groupIds: string[];
    preselectedStudents?: string[];
  };
  CulturalCalendar: {
    date?: string;
    highlightPrayerTimes?: boolean;
  };
}

// Gesture & Interaction Models
export interface GestureConfiguration {
  swipeThreshold: number;
  longPressDuration: number;
  doubleTapInterval: number;
  hapticFeedback: boolean;
  accessibilityMode: boolean;
  culturalAdaptations: boolean;
}

export interface SwipeGestureData {
  studentId: string;
  direction: 'left' | 'right';
  velocity: number;
  distance: number;
  timestamp: Date;
  resultingAction: AttendanceStatus;
}

// Islamic Calendar Models
export interface IslamicDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  dayName: string;
}

export interface PrayerTimes {
  fajr: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  sunrise: Date;
  sunset: Date;
}

export interface IslamicHoliday {
  name: string;
  islamicDate: IslamicDate;
  gregorianDate: Date;
  duration: number; // days
  type: 'major' | 'minor' | 'observance';
  affectsSchedule: boolean;
  culturalImportance: 'high' | 'medium' | 'low';
}

// Offline & Sync Models
export interface OfflineAction {
  id: string;
  type: 'ATTENDANCE_UPDATE' | 'GRADE_UPDATE' | 'MESSAGE_SEND' | 'STUDENT_UPDATE';
  payload: any;
  retries: number;
  maxRetries: number;
  priority: ActionPriority;
  createdAt: Date;
  lastAttempt?: Date;
  culturalContext?: CulturalContext;
  estimatedSize: number; // bytes
}

export interface SyncConfiguration {
  batchSize: number;
  retryDelayMs: number;
  maxRetryDelay: number;
  prioritizeCriticalActions: boolean;
  respectPrayerTimes: boolean;
  offlineTimeoutMs: number;
}

export interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
  priority: CachePriority;
  culturalContext?: string;
  version: number;
}

// Performance Models
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cacheHitRatio: number;
  offlineActionsCount: number;
  lastSyncDuration: number;
  averageGestureResponseTime: number;
}

export interface OptimizationSettings {
  enableImageCaching: boolean;
  maxCacheSize: number;
  prefetchNextScreen: boolean;
  enableVirtualization: boolean;
  gestureDebounceMs: number;
  culturalAnimations: boolean;
}

// Cultural Communication Models
export interface CommunicationTemplate {
  uzbek: string;
  russian: string;
  english: string;
}

export interface CommunicationContext {
  recipientName: string;
  recipientTitle: string;
  isFormalsetting: boolean;
  culturalSensitivity: 'high' | 'medium' | 'low';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  islamicContext: IslamicDate;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'attendance' | 'achievement' | 'meeting' | 'emergency';
  templates: CommunicationTemplate;
  variables: string[];
  culturalAdaptations: CulturalAdaptation[];
  priority: 'urgent' | 'high' | 'normal' | 'low';
}

// Accessibility Models
export interface AccessibilityConfiguration {
  enhancedTouchTargets: boolean;
  voiceNavigation: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  culturalScreenReader: boolean; // For Arabic/Uzbek text
}

// Component Props Interfaces
export interface GroupsListScreenProps {
  navigation: NavigationProp<GroupsNavigationParams>;
  route: RouteProp<GroupsNavigationParams, 'GroupsList'>;
}

export interface GroupDetailScreenProps {
  navigation: NavigationProp<GroupsNavigationParams>;
  route: RouteProp<GroupsNavigationParams, 'GroupDetail'>;
}

export interface StudentCardProps {
  student: Student;
  onPress?: (studentId: string) => void;
  onLongPress?: (studentId: string) => void;
  onAttendanceUpdate?: (studentId: string, status: AttendanceStatus) => void;
  culturalContext: CulturalContext;
  isSelected?: boolean;
  selectionMode?: boolean;
  accessibilityMode?: boolean;
  style?: ViewStyle;
}

export interface GroupSwitcherProps {
  groups: Group[];
  selectedGroupId?: string;
  onGroupSelect: (groupId: string) => void;
  onQuickSwitch: (groupId: string) => void;
  culturalContext: CulturalContext;
  showPreview?: boolean;
  maxVisibleGroups?: number;
}

export interface BulkActionsProviderProps {
  children: React.ReactNode;
  selectedItems: string[];
  onBulkAction: (action: BulkActionType, items: string[]) => Promise<void>;
  culturalContext: CulturalContext;
  gestureConfiguration: GestureConfiguration;
}
```

## Conclusion

This comprehensive Groups management architecture provides a robust, culturally-sensitive, and performance-optimized foundation for the Harry School Teacher App. The architecture emphasizes:

**Key Success Factors:**
1. **Cultural Integration**: Deep respect for Islamic values and Uzbek traditions throughout the user experience
2. **Gesture Optimization**: 40% efficiency improvement through swipe-based interactions and bulk operations
3. **Offline-First Design**: 95% functionality availability with intelligent sync strategies
4. **Performance Excellence**: Sub-500ms response times with optimized rendering and caching
5. **Accessibility Compliance**: WCAG 2.1 AA standards with cultural considerations

**Implementation Priority:**
1. Core navigation and data structures (Week 1-2)
2. Gesture-based attendance marking (Week 3)
3. Offline sync and cultural integration (Week 4)
4. Performance optimization and testing (Week 5)

**Next Steps:**
The main implementation agent should use this architecture as the foundation for building the Groups management system, ensuring all technical decisions align with the cultural context and performance requirements outlined in the UX research findings.

---

**Architecture Standards:**
- React Native 0.73+ with New Architecture
- TypeScript strict mode with comprehensive type definitions
- 60fps animations with React Native Reanimated 3.6+
- Offline-first with OP-SQLite and intelligent caching
- Cultural sensitivity with Islamic calendar integration
- Accessibility compliance with enhanced touch targets (52pt+)
- Performance targets: <500ms group switching, <60s attendance marking, 95% offline functionality