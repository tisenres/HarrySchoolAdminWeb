import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#1d7452',
  secondary: '#2d9e6a',
  gold: '#f7c52d',
  white: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#64748b',
};

interface DashboardHeaderProps {
  studentName: string;
  level: number;
  coins: number;
}

export default function DashboardHeader({ studentName, level, coins }: DashboardHeaderProps) {
  const currentHour = new Date().getHours();
  let greeting = '';
  let greetingIcon = '';

  if (currentHour < 12) {
    greeting = 'Good Morning';
    greetingIcon = 'wb-sunny';
  } else if (currentHour < 17) {
    greeting = 'Good Afternoon';
    greetingIcon = 'wb-sunny';
  } else {
    greeting = 'Good Evening';
    greetingIcon = 'brightness-3';
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <Icon name={greetingIcon} size={20} color={COLORS.gold} />
            <Text style={styles.greeting}>{greeting}</Text>
          </View>
          <Text style={styles.studentName}>{studentName}</Text>
          <Text style={styles.islamicGreeting}>السلام عليكم</Text>
        </View>

        {/* Notifications & Profile */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.coinsContainer}>
            <Icon name="monetization-on" size={16} color={COLORS.gold} />
            <Text style={styles.coinsText}>{coins}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="notifications" size={24} color={COLORS.white} />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {studentName.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{level}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Prayer Time Reminder */}
      <View style={styles.prayerReminder}>
        <Icon name="access-time" size={16} color={COLORS.primary} />
        <Text style={styles.prayerText}>Next Prayer: Asr in 2h 45m</Text>
        <TouchableOpacity style={styles.prayerButton}>
          <Text style={styles.prayerButtonText}>Set Reminder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greetingSection: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    color: COLORS.white,
    fontSize: 16,
    marginLeft: 6,
    opacity: 0.9,
  },
  studentName: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  islamicGreeting: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '500',
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.gold}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  coinsText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  notificationButton: {
    position: 'relative',
    marginRight: 12,
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    position: 'relative',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  levelText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  prayerReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.white}15`,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  prayerText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    marginLeft: 8,
  },
  prayerButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prayerButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
});