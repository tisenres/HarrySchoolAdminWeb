import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const buttonWidth = (screenWidth - 48 - 12) / 2; // Account for padding and gap

interface QuickActionButtonProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
  backgroundColor: string;
  urgent?: boolean;
}

function QuickActionButton({ 
  title, 
  subtitle, 
  icon, 
  onPress, 
  backgroundColor,
  urgent = false 
}: QuickActionButtonProps) {
  return (
    <Pressable
      style={[
        styles.actionButton,
        { backgroundColor, width: buttonWidth },
        urgent && styles.urgentButton,
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
    >
      <View style={styles.iconContainer}>
        {icon}
        {urgent && <View style={styles.urgentIndicator} />}
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export function QuickActions() {
  const actions = [
    {
      title: 'Mark Attendance',
      subtitle: 'Today\'s classes',
      backgroundColor: '#1d7452',
      urgent: true, // Morning urgent action
      icon: (
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      onPress: () => {
        // Navigate to attendance marking
        console.log('Navigate to attendance');
      },
    },
    {
      title: 'Create Feedback',
      subtitle: 'Student progress',
      backgroundColor: '#0ea5e9',
      icon: (
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 8H17M7 12H17M7 16H11M21 12C21 16.9706 16.9706 21 12 21C10.4649 21 9.01613 20.5767 7.77907 19.8389L3 21L4.16107 16.2209C3.42328 14.9839 3 13.5351 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      onPress: () => {
        // Navigate to feedback creation
        console.log('Navigate to feedback');
      },
    },
    {
      title: 'Send Message',
      subtitle: 'Parents & admin',
      backgroundColor: '#7c3aed',
      icon: (
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="L22 6L12 13L2 6"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      onPress: () => {
        // Navigate to messaging
        console.log('Navigate to messaging');
      },
    },
    {
      title: 'Emergency Alert',
      subtitle: 'Urgent notification',
      backgroundColor: '#dc2626',
      icon: (
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      onPress: () => {
        // Navigate to emergency alert
        console.log('Emergency alert');
      },
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <QuickActionButton
            key={index}
            title={action.title}
            subtitle={action.subtitle}
            icon={action.icon}
            onPress={action.onPress}
            backgroundColor={action.backgroundColor}
            urgent={action.urgent}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  urgentButton: {
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  urgentIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fbbf24',
    borderWidth: 2,
    borderColor: 'white',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
});