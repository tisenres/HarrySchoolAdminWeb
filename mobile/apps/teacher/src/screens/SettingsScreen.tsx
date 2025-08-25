import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/settings/LanguageSwitcher';
import { SupportedLanguage } from '../../../packages/shared/i18n';

export interface SettingsScreenProps {
  navigation?: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation(['settings', 'teacher']);

  const handleLanguageChanged = (newLanguage: SupportedLanguage) => {
    console.log('Teacher app language changed to:', newLanguage);
    // Could trigger navigation refresh or other UI updates here
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.screenTitle}>{t('settings:title')}</Text>
          <Text style={styles.screenSubtitle}>
            {t('teacher:dashboard.welcome')}
          </Text>
          <Text style={styles.screenDescription}>
            {t('settings:description')}
          </Text>
        </View>

        <View style={styles.section}>
          <LanguageSwitcher
            variant="teacher"
            onLanguageChanged={handleLanguageChanged}
            showDescription={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:preferences.title')}</Text>
          <Text style={styles.sectionDescription}>
            {t('settings:preferences.description')}
          </Text>
          {/* Teacher-specific preferences can be added here */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('teacher:gradebook.title')}</Text>
          <Text style={styles.sectionDescription}>
            {t('teacher:gradebook.settings')}
          </Text>
          {/* Gradebook settings can be added here */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('teacher:attendance.title')}</Text>
          <Text style={styles.sectionDescription}>
            {t('teacher:attendance.settings')}
          </Text>
          {/* Attendance settings can be added here */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:account.title')}</Text>
          <Text style={styles.sectionDescription}>
            {t('settings:account.description')}
          </Text>
          {/* Account settings can be added here */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:help.title')}</Text>
          <Text style={styles.sectionDescription}>
            {t('settings:help.description')}
          </Text>
          {/* Help and support options can be added here */}
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>
            {t('settings:version', { version: '1.0.0' })}
          </Text>
          <Text style={styles.copyrightText}>
            {t('settings:copyright')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  screenDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default SettingsScreen;