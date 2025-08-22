import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ProfileStackParamList } from '../types';
import ProfileHomeScreen from '../screens/profile/ProfileHomeScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import FeedbackScreen from '../screens/profile/FeedbackScreen';
import ReferralsScreen from '../screens/profile/ReferralsScreen';
import SupportScreen from '../screens/profile/SupportScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="ProfileHome" 
        component={ProfileHomeScreen} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Settings',
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          headerShown: true,
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen 
        name="Feedback" 
        component={FeedbackScreen}
        options={{
          headerShown: true,
          title: 'Feedback',
        }}
      />
      <Stack.Screen 
        name="Referrals" 
        component={ReferralsScreen}
        options={{
          headerShown: true,
          title: 'Refer Friends',
        }}
      />
      <Stack.Screen 
        name="Support" 
        component={SupportScreen}
        options={{
          headerShown: true,
          title: 'Support',
        }}
      />
    </Stack.Navigator>
  );
}