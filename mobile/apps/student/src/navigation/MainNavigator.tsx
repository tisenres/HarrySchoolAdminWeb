import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MainTabParamList } from '../types';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/design';

import HomeNavigator from './HomeNavigator';
import LessonsNavigator from './LessonsNavigator';
import VocabularyNavigator from './VocabularyNavigator';
import ScheduleNavigator from './ScheduleNavigator';
import ProfileNavigator from './ProfileNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const getTabBarIcon = (route: string) => {
  const icons: Record<string, string> = {
    Home: 'home',
    Lessons: 'book',
    Vocabulary: 'library',
    Schedule: 'calendar',
    Profile: 'person',
  };
  
  return (props: TabBarIconProps) => {
    const iconName = props.focused 
      ? icons[route] 
      : `${icons[route]}-outline`;
    
    return (
      <View style={[
        styles.iconContainer,
        props.focused && styles.iconContainerFocused
      ]}>
        <Ionicons 
          name={iconName as any} 
          size={props.size} 
          color={props.color} 
        />
        {props.focused && <View style={styles.activeIndicator} />}
      </View>
    );
  };
};

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: getTabBarIcon(route.name),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Lessons" 
        component={LessonsNavigator}
        options={{
          tabBarLabel: 'Lessons',
        }}
      />
      <Tab.Screen 
        name="Vocabulary" 
        component={VocabularyNavigator}
        options={{
          tabBarLabel: 'Words',
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleNavigator}
        options={{
          tabBarLabel: 'Schedule',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    height: 80,
    paddingBottom: SPACING.base,
    paddingTop: SPACING.sm,
    ...SHADOWS.lg,
  },
  tabBarItem: {
    paddingVertical: SPACING.xs,
  },
  tabBarLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: SPACING.xs,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  iconContainerFocused: {
    // Add any focused styles here
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});