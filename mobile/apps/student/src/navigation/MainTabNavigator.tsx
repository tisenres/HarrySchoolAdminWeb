/**
 * MainTabNavigator for Harry School Student App
 * 
 * Simplified version for initial development
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import { DashboardScreen } from '../screens/DashboardScreen';
// import { DeepLinkTester } from '../components/DeepLinkTester';

type MainTabParamList = {
  Home: undefined;
  Lessons: undefined;
  Schedule: undefined;
  Vocabulary: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Simple placeholder screen component
const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Harry School</Text>
    <Text style={styles.subtitle}>{title}</Text>
    <Text style={styles.description}>Coming soon...</Text>
  </View>
);

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Lessons':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Schedule':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Vocabulary':
              iconName = focused ? 'library' : 'library-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1d7452',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Lessons"
        options={{ title: 'Lessons' }}
      >
        {() => <PlaceholderScreen title="Lessons" />}
      </Tab.Screen>
      <Tab.Screen 
        name="Schedule"
        options={{ title: 'Schedule' }}
      >
        {() => <PlaceholderScreen title="Schedule" />}
      </Tab.Screen>
      <Tab.Screen 
        name="Vocabulary"
        options={{ title: 'Words' }}
      >
        {() => <PlaceholderScreen title="Vocabulary" />}
      </Tab.Screen>
      <Tab.Screen 
        name="Profile"
        options={{ title: 'Profile' }}
      >
        {() => <PlaceholderScreen title="Profile" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1d7452',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});