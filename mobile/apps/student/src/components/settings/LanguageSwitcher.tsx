import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  SupportedLanguage, 
  changeLanguage, 
  getCurrentLanguage 
} from '../../../../packages/shared/i18n';

interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
  },
  {
    code: 'uz',
    name: 'Uzbek',
    nativeName: 'O\'zbek',
    flag: '🇺🇿',
  },
];

export interface LanguageSwitcherProps {
  style?: any;
  onLanguageChanged?: (language: SupportedLanguage) => void;
  showDescription?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  style,
  onLanguageChanged,
  showDescription = true,
}) => {
  const { t } = useTranslation('settings');
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    getCurrentLanguage()
  );
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = useCallback(
    async (newLanguage: SupportedLanguage) => {
      if (newLanguage === currentLanguage) {
        return;
      }

      setIsChanging(true);

      try {
        await changeLanguage(newLanguage);
        setCurrentLanguage(newLanguage);
        onLanguageChanged?.(newLanguage);

        // Show success feedback
        if (Platform.OS !== 'web') {
          Alert.alert(
            t('language.changeSuccessTitle'),
            t('language.changeSuccessMessage'),
            [{ text: t('language.ok'), style: 'default' }]
          );
        }
      } catch (error) {
        console.error('Failed to change language:', error);
        
        // Show error feedback
        if (Platform.OS !== 'web') {
          Alert.alert(
            t('language.changeErrorTitle'),
            t('language.changeErrorMessage'),
            [{ text: t('language.tryAgain'), style: 'default' }]
          );
        }
      } finally {
        setIsChanging(false);
      }
    },
    [currentLanguage, onLanguageChanged, t]
  );

  const renderLanguageOption = useCallback(
    (option: LanguageOption) => {
      const isSelected = option.code === currentLanguage;
      const isDisabled = isChanging;

      return (
        <TouchableOpacity
          key={option.code}
          style={[
            styles.languageOption,
            isSelected && styles.selectedOption,
            isDisabled && styles.disabledOption,
          ]}
          onPress={() => handleLanguageChange(option.code)}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          <View style={styles.languageContent}>
            <Text style={styles.flag}>{option.flag}</Text>
            <View style={styles.languageText}>
              <Text
                style={[
                  styles.languageName,
                  isSelected && styles.selectedText,
                  isDisabled && styles.disabledText,
                ]}
              >
                {option.nativeName}
              </Text>
              <Text
                style={[
                  styles.languageEnglishName,
                  isSelected && styles.selectedSubtext,
                  isDisabled && styles.disabledText,
                ]}
              >
                {option.name}
              </Text>
            </View>
          </View>
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [currentLanguage, isChanging, handleLanguageChange]
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('language.title')}</Text>
        {showDescription && (
          <Text style={styles.description}>
            {t('language.description')}
          </Text>
        )}
      </View>

      <View style={styles.optionsContainer}>
        {LANGUAGE_OPTIONS.map(renderLanguageOption)}
      </View>

      {isChanging && (
        <View style={styles.changingIndicator}>
          <Text style={styles.changingText}>
            {t('language.changing')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 2,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#1d7452',
    borderColor: '#1d7452',
  },
  disabledOption: {
    opacity: 0.6,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  languageEnglishName: {
    fontSize: 13,
    color: '#6b7280',
  },
  selectedText: {
    color: '#ffffff',
  },
  selectedSubtext: {
    color: '#d1fae5',
  },
  disabledText: {
    color: '#9ca3af',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#1d7452',
    fontSize: 14,
    fontWeight: 'bold',
  },
  changingIndicator: {
    marginTop: 12,
    alignItems: 'center',
  },
  changingText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

export default LanguageSwitcher;