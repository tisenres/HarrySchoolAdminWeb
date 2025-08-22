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
  const { t } = useTranslation('settings');

  const handleLanguageChanged = (newLanguage: SupportedLanguage) => {
    console.log('Language changed to:', newLanguage);
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
          <Text style={styles.screenTitle}>{t('title')}</Text>
          <Text style={styles.screenDescription}>
            {t('description')}
          </Text>
        </View>

        <View style={styles.section}>
          <LanguageSwitcher
            onLanguageChanged={handleLanguageChanged}
            showDescription={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('preferences.title')}</Text>
          <Text style={styles.sectionDescription}>
            {t('preferences.description')}
          </Text>
          {/* Additional preference settings can be added here */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account.title')}</Text>
          <Text style={styles.sectionDescription}>
            {t('account.description')}
          </Text>
          {/* Account settings can be added here */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('help.title')}</Text>
          <Text style={styles.sectionDescription}>
            {t('help.description')}
          </Text>
          {/* Help and support options can be added here */}
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>
            {t('version', { version: '1.0.0' })}
          </Text>
          <Text style={styles.copyrightText}>
            {t('copyright')}
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
    borderBottomColor: '#e5e7eb',
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  screenDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default SettingsScreen;