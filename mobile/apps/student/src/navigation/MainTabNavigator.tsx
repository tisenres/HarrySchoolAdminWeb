import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import LessonsScreen from '../screens/LessonsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import VocabularyScreen from '../screens/VocabularyScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const COLORS = {
  primary: '#1d7452',
  secondary: '#2d9e6a',
  gold: '#f7c52d',
  background: '#ffffff',
  text: '#333333',
  gray: '#8e8e93',
  lightGray: '#f2f2f7',
};

interface TabBarIconProps {
  name: string;
  color: string;
  size: number;
  focused: boolean;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ name, color, size, focused }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <Icon name={name} size={size} color={color} />
    {focused && <View style={styles.focusIndicator} />}
  </View>
);

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = '';
          
          switch (route.name) {
            case 'Home':
              iconName = 'dashboard';
              break;
            case 'Lessons':
              iconName = 'school';
              break;
            case 'Schedule':
              iconName = 'schedule';
              break;
            case 'Vocabulary':
              iconName = 'book';
              break;
            case 'Profile':
              iconName = 'person';
              break;
          }
          
          return <TabBarIcon name={iconName} color={color} size={size} focused={focused} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.lightGray,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: COLORS.background,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen}
        options={{
          title: '🏠 Dashboard',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Lessons" 
        component={LessonsScreen}
        options={{
          title: '📚 Lessons',
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{
          title: '📅 Schedule',
        }}
      />
      <Tab.Screen 
        name="Vocabulary" 
        component={VocabularyScreen}
        options={{
          title: '📖 Words',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: '👤 Profile',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  iconContainerFocused: {
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  focusIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});