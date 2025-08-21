import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useIslamicCalendar } from '../../hooks/useIslamicCalendar';
import { useCulturalGreeting } from '../../hooks/useCulturalGreeting';

interface Teacher {
  id: string;
  name: string;
  title?: string;
  avatar_url?: string;
  preferred_language: 'en' | 'ru' | 'uz';
}

interface WelcomeHeaderProps {
  teacher?: Teacher;
  isLoading: boolean;
}

export function WelcomeHeader({ teacher, isLoading }: WelcomeHeaderProps) {
  const { hijriDate, isPrayerTime, nextPrayerTime } = useIslamicCalendar();
  const { greeting, timeOfDay } = useCulturalGreeting(teacher?.preferred_language);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingPlaceholder} />
        <View style={[styles.loadingPlaceholder, { width: '60%', height: 20 }]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Greeting Section */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.teacherName}>
          {teacher?.title} {teacher?.name}
        </Text>
        <Text style={styles.timeOfDay}>{timeOfDay}</Text>
      </View>

      {/* Islamic Calendar & Prayer Times */}
      <View style={styles.calendarSection}>
        <View style={styles.dateRow}>
          <Text style={styles.gregorianDate}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.hijriDate}>{hijriDate}</Text>
        </View>

        {isPrayerTime && (
          <View style={styles.prayerAlert}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2L13.09 8.26L22 12L13.09 15.74L12 22L10.91 15.74L2 12L10.91 8.26L12 2Z"
                fill="#059669"
              />
            </Svg>
            <Text style={styles.prayerText}>Prayer time - {nextPrayerTime}</Text>
          </View>
        )}
      </View>

      {/* Notification Button */}
      <Pressable style={styles.notificationButton}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
            stroke="#64748b"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21"
            stroke="#64748b"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  greetingSection: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  timeOfDay: {
    fontSize: 14,
    color: '#64748b',
  },
  calendarSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gregorianDate: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  hijriDate: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  prayerAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  prayerText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 6,
    fontWeight: '500',
  },
  notificationButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
  },
  loadingPlaceholder: {
    height: 24,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
  },
});