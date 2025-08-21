import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';

// Import all components
import { Button } from './Button/Button';
import { Card } from './Card/Card';
import { Input } from './Input/Input';
import { Avatar } from './Avatar/Avatar';
import { Badge } from './Badge/Badge';
import { TabBar } from './TabBar/TabBar';
import { Header } from './Header/Header';
import { LoadingScreen } from './LoadingScreen/LoadingScreen';
import { EmptyState } from './EmptyState/EmptyState';
import { Modal } from './Modal/Modal';

/**
 * ComponentShowcase - Interactive demo of all UI components
 * For testing usability and visual verification
 */
export const ComponentShowcase: React.FC = () => {
  const { theme, variant, setThemeVariant } = useTheme();
  
  // State for interactive demos
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inputValue, setInputValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchActive, setSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Sample data for testing
  const teacherTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', badge: 0 },
    { id: 'students', label: 'Students', icon: 'users', badge: 3 },
    { id: 'attendance', label: 'Attendance', icon: 'check-circle', badge: 0 },
    { id: 'ai-tools', label: 'AI Tools', icon: 'brain', badge: 1 },
    { id: 'profile', label: 'Profile', icon: 'user', badge: 0 },
  ];

  const studentTabs = [
    { id: 'learn', label: 'Learn', icon: 'book-open', badge: 0 },
    { id: 'vocabulary', label: 'Vocabulary', icon: 'bookmark', badge: 5 },
    { id: 'progress', label: 'Progress', icon: 'bar-chart', badge: 0 },
    { id: 'rewards', label: 'Rewards', icon: 'gift', badge: 2 },
    { id: 'profile', label: 'Profile', icon: 'user', badge: 0 },
  ];

  const currentTabs = variant === 'teacher' ? teacherTabs : studentTabs;

  const simulateLoading = () => {
    setShowLoading(true);
    setLoadingProgress(0);
    
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowLoading(false), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const ComponentSection: React.FC<{ title: string; children: React.ReactNode }> = ({ 
    title, 
    children 
  }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar barStyle={variant === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Theme Switcher */}
      <View style={styles.themeSwitcher}>
        <Button
          size="small"
          variant={variant === 'teacher' ? 'primary' : 'outline'}
          onPress={() => setThemeVariant('teacher')}
        >
          Teacher
        </Button>
        <Button
          size="small"
          variant={variant === 'student' ? 'primary' : 'outline'}
          onPress={() => setThemeVariant('student')}
        >
          Student
        </Button>
        <Button
          size="small"
          variant={variant === 'dark' ? 'primary' : 'outline'}
          onPress={() => setThemeVariant('dark')}
        >
          Dark
        </Button>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Component */}
        <ComponentSection title="Header Component">
          <Header
            title="Component Showcase"
            subtitle={`Testing ${variant} theme`}
            backButton={{ 
              show: true, 
              onPress: () => Alert.alert('Back pressed') 
            }}
            actions={[
              {
                id: 'search',
                icon: 'search',
                label: 'Search',
                onPress: () => setSearchActive(!searchActive),
              },
              {
                id: 'notifications',
                icon: 'bell',
                label: 'Notifications',
                badgeCount: variant === 'student' ? 5 : 2,
                onPress: () => Alert.alert('Notifications opened'),
              },
            ]}
            search={{
              isActive: searchActive,
              placeholder: 'Search components...',
              value: searchValue,
              onChangeText: setSearchValue,
              onClear: () => setSearchValue(''),
            }}
            syncStatus="synced"
            isOffline={false}
          />
        </ComponentSection>

        {/* Button Components */}
        <ComponentSection title="Button Components">
          <View style={styles.buttonRow}>
            <Button variant="primary" size="small">Primary</Button>
            <Button variant="secondary" size="small">Secondary</Button>
            <Button variant="outline" size="small">Outline</Button>
          </View>
          <View style={styles.buttonRow}>
            <Button variant="ghost" size="small">Ghost</Button>
            <Button variant="destructive" size="small">Destructive</Button>
            <Button 
              variant="bulk" 
              size="small"
              selectionCount={3}
              onPress={() => Alert.alert('Bulk action with 3 selected')}
            >
              Bulk Action
            </Button>
          </View>
          <View style={styles.buttonRow}>
            <Button 
              variant="primary" 
              size="medium"
              leadingIcon="plus"
              onPress={() => Alert.alert('Button with icon pressed')}
            >
              Add Item
            </Button>
            <Button 
              variant="primary" 
              size="medium"
              isLoading
              loadingText="Saving..."
            >
              Loading State
            </Button>
          </View>
        </ComponentSection>

        {/* Card Components */}
        <ComponentSection title="Card Components">
          <Card
            variant={variant === 'teacher' ? 'data' : 'visual'}
            size="default"
            syncStatus="synced"
            onPress={() => Alert.alert('Card pressed')}
            swipeActions={{
              left: [
                {
                  id: 'edit',
                  label: 'Edit',
                  icon: 'edit',
                  color: theme.colors.semantic.info,
                  onPress: () => Alert.alert('Edit action'),
                },
              ],
              right: [
                {
                  id: 'delete',
                  label: 'Delete',
                  icon: 'trash',
                  color: theme.colors.semantic.error,
                  onPress: () => Alert.alert('Delete action'),
                },
              ],
            }}
          >
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                {variant === 'teacher' ? 'Class 7A - English' : 'Level 5 - Vocabulary'}
              </Text>
              <Text style={[styles.cardDescription, { color: theme.colors.text.secondary }]}>
                {variant === 'teacher' 
                  ? '24 students • Last sync: 2 min ago' 
                  : 'Complete 15 more words to level up!'
                }
              </Text>
            </View>
          </Card>
        </ComponentSection>

        {/* Input Components */}
        <ComponentSection title="Input Components">
          <Input
            variant="default"
            label="Student Name"
            placeholder="Enter student name"
            value={inputValue}
            onChangeText={setInputValue}
            helperText="This field is required"
            leadingIcon="user"
            clearButton
          />
          <View style={{ height: 16 }} />
          <Input
            variant="filled"
            label="Search Lessons"
            placeholder="Type to search..."
            leadingIcon="search"
            type="search"
          />
        </ComponentSection>

        {/* Avatar Components */}
        <ComponentSection title="Avatar Components">
          <View style={styles.avatarRow}>
            <Avatar
              size="sm"
              source={{ uri: 'https://picsum.photos/100/100?random=1' }}
              status="online"
              role="teacher"
            />
            <Avatar
              size="md"
              initials="JS"
              status="away"
              role="student"
              badgeCount={3}
            />
            <Avatar
              size="lg"
              source={{ uri: 'https://picsum.photos/100/100?random=2' }}
              status="offline"
              role="admin"
              achievementBadge="gold"
            />
            <Avatar
              size="xl"
              initials="MK"
              status="busy"
              role="teacher"
              onPress={() => Alert.alert('Avatar pressed')}
            />
          </View>
        </ComponentSection>

        {/* Badge Components */}
        <ComponentSection title="Badge Components">
          <View style={styles.badgeContainer}>
            <Badge
              type="notification"
              count={5}
              position="top-right"
              priority="high"
            />
            <Badge
              type="achievement"
              variant="gold"
              showCelebration
              position="top-left"
            />
            <Badge
              type="status"
              status="active"
              text="Online"
              position="bottom-right"
            />
          </View>
        </ComponentSection>

        {/* Loading and Modal Actions */}
        <ComponentSection title="Interactive Components">
          <View style={styles.buttonRow}>
            <Button
              variant="primary"
              onPress={simulateLoading}
              size="medium"
            >
              Show Loading
            </Button>
            <Button
              variant="secondary"
              onPress={() => setShowModal(true)}
              size="medium"
            >
              Show Modal
            </Button>
          </View>
        </ComponentSection>

        {/* Empty State */}
        <ComponentSection title="Empty State Component">
          <EmptyState
            variant="no-data"
            size="standard"
            content={{
              title: "No students found",
              description: variant === 'teacher' 
                ? "Add students to get started with your class management."
                : "Start your learning journey by joining a class!"
            }}
            primaryAction={{
              text: variant === 'teacher' ? "Add Student" : "Join Class",
              onPress: () => Alert.alert('Primary action pressed'),
            }}
            educationalContext={{
              userType: variant === 'teacher' ? 'teacher' : 'student',
              subject: 'english',
              showMotivation: variant === 'student',
            }}
          />
        </ComponentSection>

        {/* Spacing for TabBar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* TabBar Component */}
      <TabBar
        variant={variant === 'teacher' ? 'teacher' : 'student'}
        tabs={currentTabs}
        activeTabId={activeTab}
        onTabPress={(tabId) => {
          setActiveTab(tabId);
          Alert.alert(`Navigated to ${tabId} tab`);
        }}
        onTabLongPress={(tabId) => Alert.alert(`Long pressed ${tabId} tab`)}
        isOffline={false}
      />

      {/* Loading Screen Modal */}
      <LoadingScreen
        visible={showLoading}
        type="educational"
        title="Loading your content..."
        progressConfig={{
          progress: loadingProgress,
          showPercentage: true,
          showTimeRemaining: true,
          estimatedTime: Math.max(1, Math.ceil((100 - loadingProgress) / 10)),
        }}
        educationalContent={{
          type: 'vocabulary',
          vocabulary: [
            { word: 'Education', definition: 'The process of learning and teaching' },
            { word: 'Knowledge', definition: 'Information and understanding gained through learning' },
            { word: 'Student', definition: 'A person who is learning at a school or university' },
          ],
          rotationInterval: 3000,
        }}
        variant={variant === 'teacher' ? 'teacher' : 'student'}
        onCancel={() => setShowLoading(false)}
      />

      {/* Modal Component */}
      <Modal
        visible={showModal}
        type={variant === 'student' ? 'celebration' : 'confirmation'}
        size="medium"
        title={variant === 'student' ? 'Great Job! 🎉' : 'Confirm Action'}
        content={
          variant === 'student' 
            ? 'You completed your daily vocabulary goal!'
            : 'Are you sure you want to proceed with this action?'
        }
        primaryAction={{
          text: variant === 'student' ? 'Continue' : 'Confirm',
          onPress: () => {
            setShowModal(false);
            Alert.alert('Modal action confirmed');
          },
        }}
        secondaryAction={{
          text: 'Cancel',
          onPress: () => setShowModal(false),
        }}
        celebration={variant === 'student' ? {
          variant: 'achievement',
          showConfetti: true,
          autoCloseDelay: 3000,
        } : undefined}
        onClose={() => setShowModal(false)}
      />
    </SafeAreaView>
  );
};

// Wrapper component with ThemeProvider
export const ComponentShowcaseApp: React.FC = () => (
  <ThemeProvider variant="teacher">
    <ComponentShowcase />
  </ThemeProvider>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  badgeContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    position: 'relative',
  },
});

export default ComponentShowcase;