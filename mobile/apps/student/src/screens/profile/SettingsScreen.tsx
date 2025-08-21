import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStudentStore } from '../../store/studentStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';

interface SettingsSection {
  title: string;
  items: SettingItem[];
  icon: keyof typeof Ionicons.glyphMap;
  ageRestriction?: 'elementary' | 'middle' | 'high';
}

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'navigation' | 'action' | 'selection';
  value?: boolean | string;
  options?: string[];
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  parentalApprovalRequired?: boolean;
  ageRestriction?: 'elementary' | 'middle' | 'high';
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { student } = useStudentStore();
  const { 
    settings, 
    updateSetting, 
    requestParentalApproval,
    culturalPreferences,
    updateCulturalPreferences,
  } = useSettingsStore();
  const { signOut } = useAuthStore();

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Age-adaptive interface calculation
  const ageGroup = useMemo(() => {
    if (!student?.age) return 'elementary';
    if (student.age <= 12) return 'elementary';
    if (student.age <= 15) return 'middle';
    return 'high';
  }, [student?.age]);

  const isElementary = ageGroup === 'elementary';
  const isMiddleSchool = ageGroup === 'middle';
  const isHighSchool = ageGroup === 'high';

  // Theme values for animations
  const primaryColor = useSharedValue(0);
  const animatedPrimaryStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      primaryColor.value,
      [0, 1],
      ['#1d7452', '#2563eb']
    ),
  }));

  // Handle setting toggle with parental approval if needed
  const handleToggleSetting = useCallback(async (
    settingId: string, 
    currentValue: boolean,
    requiresParentalApproval: boolean = false
  ) => {
    if (requiresParentalApproval && (isElementary || isMiddleSchool)) {
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Ota-ona roziligi kerak' : 
        culturalPreferences?.language === 'russian' ? 'Требуется разрешение родителей' :
        'Parental Approval Required',
        culturalPreferences?.language === 'uzbek' ? 
          'Bu sozlamani o\'zgartirish uchun ota-onangizdan ruxsat olish kerak.' :
        culturalPreferences?.language === 'russian' ?
          'Для изменения этой настройки требуется разрешение родителей.' :
          'This setting requires parental approval to change.',
        [
          { 
            text: culturalPreferences?.language === 'uzbek' ? 'Bekor qilish' :
                  culturalPreferences?.language === 'russian' ? 'Отмена' : 'Cancel',
            style: 'cancel' 
          },
          {
            text: culturalPreferences?.language === 'uzbek' ? 'So\'rov yuborish' :
                  culturalPreferences?.language === 'russian' ? 'Отправить запрос' : 'Request Approval',
            onPress: async () => {
              setLoadingStates(prev => ({ ...prev, [settingId]: true }));
              try {
                await requestParentalApproval(settingId, !currentValue);
                Alert.alert(
                  culturalPreferences?.language === 'uzbek' ? 'So\'rov yuborildi' :
                  culturalPreferences?.language === 'russian' ? 'Запрос отправлен' :
                  'Request Sent',
                  culturalPreferences?.language === 'uzbek' ? 
                    'Ota-onangizga bildirishnoma yuborildi.' :
                  culturalPreferences?.language === 'russian' ?
                    'Уведомление отправлено вашим родителям.' :
                    'A notification has been sent to your parents.'
                );
              } catch (error) {
                console.error('Error requesting parental approval:', error);
                Alert.alert(
                  culturalPreferences?.language === 'uzbek' ? 'Xatolik' :
                  culturalPreferences?.language === 'russian' ? 'Ошибка' : 'Error',
                  culturalPreferences?.language === 'uzbek' ? 
                    'So\'rov yuborishda xatolik yuz berdi.' :
                  culturalPreferences?.language === 'russian' ?
                    'Произошла ошибка при отправке запроса.' :
                    'There was an error sending the request.'
                );
              } finally {
                setLoadingStates(prev => ({ ...prev, [settingId]: false }));
              }
            }
          }
        ]
      );
      return;
    }

    try {
      await updateSetting(settingId, !currentValue);
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Xatolik' :
        culturalPreferences?.language === 'russian' ? 'Ошибка' : 'Error',
        culturalPreferences?.language === 'uzbek' ? 
          'Sozlamani yangilashda xatolik yuz berdi.' :
        culturalPreferences?.language === 'russian' ?
          'Произошла ошибка при обновлении настройки.' :
          'There was an error updating the setting.'
      );
    }
  }, [isElementary, isMiddleSchool, culturalPreferences, updateSetting, requestParentalApproval]);

  // Language selection handler
  const handleLanguageChange = useCallback((language: string) => {
    updateCulturalPreferences({ language });
  }, [updateCulturalPreferences]);

  // Sign out handler
  const handleSignOut = useCallback(() => {
    Alert.alert(
      culturalPreferences?.language === 'uzbek' ? 'Tizimdan chiqish' :
      culturalPreferences?.language === 'russian' ? 'Выйти из системы' : 'Sign Out',
      culturalPreferences?.language === 'uzbek' ? 
        'Rostdan ham tizimdan chiqmoqchimisiz?' :
      culturalPreferences?.language === 'russian' ?
        'Вы действительно хотите выйти из системы?' :
        'Are you sure you want to sign out?',
      [
        { 
          text: culturalPreferences?.language === 'uzbek' ? 'Bekor qilish' :
                culturalPreferences?.language === 'russian' ? 'Отмена' : 'Cancel',
          style: 'cancel' 
        },
        {
          text: culturalPreferences?.language === 'uzbek' ? 'Chiqish' :
                culturalPreferences?.language === 'russian' ? 'Выйти' : 'Sign Out',
          style: 'destructive',
          onPress: signOut
        }
      ]
    );
  }, [culturalPreferences, signOut]);

  // Settings sections configuration
  const settingsSections: SettingsSection[] = useMemo(() => [
    {
      title: culturalPreferences?.language === 'uzbek' ? 'Ta\'lim' :
             culturalPreferences?.language === 'russian' ? 'Обучение' : 'Learning',
      icon: 'school-outline',
      items: [
        {
          id: 'notifications',
          title: culturalPreferences?.language === 'uzbek' ? 'Bildirishnomalar' :
                 culturalPreferences?.language === 'russian' ? 'Уведомления' : 'Notifications',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'Dars va vazifalar haqida xabar olish' :
                    culturalPreferences?.language === 'russian' ? 'Получать уведомления о занятиях и заданиях' :
                    'Receive alerts about classes and assignments',
          type: 'toggle',
          value: settings.notifications,
          icon: 'notifications-outline',
          parentalApprovalRequired: false,
        },
        {
          id: 'autoPlay',
          title: culturalPreferences?.language === 'uzbek' ? 'Avtomatik ijro' :
                 culturalPreferences?.language === 'russian' ? 'Автовоспроизведение' : 'Auto-play',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'Audio va videolarni avtomatik boshlash' :
                    culturalPreferences?.language === 'russian' ? 'Автоматически воспроизводить аудио и видео' :
                    'Automatically play audio and video content',
          type: 'toggle',
          value: settings.autoPlay,
          icon: 'play-circle-outline',
          parentalApprovalRequired: true,
        },
        {
          id: 'offlineMode',
          title: culturalPreferences?.language === 'uzbek' ? 'Oflayn rejim' :
                 culturalPreferences?.language === 'russian' ? 'Офлайн режим' : 'Offline Mode',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'Kontentni oflayn yuklab olish' :
                    culturalPreferences?.language === 'russian' ? 'Загружать контент для офлайн использования' :
                    'Download content for offline use',
          type: 'toggle',
          value: settings.offlineMode,
          icon: 'cloud-download-outline',
          parentalApprovalRequired: false,
        },
      ],
    },
    {
      title: culturalPreferences?.language === 'uzbek' ? 'Madaniy sozlamalar' :
             culturalPreferences?.language === 'russian' ? 'Культурные настройки' : 'Cultural Settings',
      icon: 'earth-outline',
      items: [
        {
          id: 'language',
          title: culturalPreferences?.language === 'uzbek' ? 'Til' :
                 culturalPreferences?.language === 'russian' ? 'Язык' : 'Language',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'Interfeys tili' :
                    culturalPreferences?.language === 'russian' ? 'Язык интерфейса' : 'Interface language',
          type: 'selection',
          value: culturalPreferences?.language || 'english',
          options: ['english', 'uzbek', 'russian'],
          icon: 'language-outline',
          onPress: () => {
            Alert.alert(
              culturalPreferences?.language === 'uzbek' ? 'Til tanlash' :
              culturalPreferences?.language === 'russian' ? 'Выбор языка' : 'Select Language',
              '',
              [
                { text: 'English', onPress: () => handleLanguageChange('english') },
                { text: 'O\'zbek', onPress: () => handleLanguageChange('uzbek') },
                { text: 'Русский', onPress: () => handleLanguageChange('russian') },
                { 
                  text: culturalPreferences?.language === 'uzbek' ? 'Bekor qilish' :
                        culturalPreferences?.language === 'russian' ? 'Отмена' : 'Cancel',
                  style: 'cancel' 
                }
              ]
            );
          },
        },
        {
          id: 'islamicGreetings',
          title: culturalPreferences?.language === 'uzbek' ? 'Islomiy salomlashuvlar' :
                 culturalPreferences?.language === 'russian' ? 'Исламские приветствия' : 'Islamic Greetings',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'Assalomu alaykum va boshqa salomlashuvlar' :
                    culturalPreferences?.language === 'russian' ? 'Ассаламу алейкум и другие приветствия' :
                    'Show Islamic greetings and phrases',
          type: 'toggle',
          value: culturalPreferences?.showIslamicGreetings,
          icon: 'moon-outline',
          parentalApprovalRequired: false,
        },
        {
          id: 'prayerTimes',
          title: culturalPreferences?.language === 'uzbek' ? 'Namoz vaqtlari' :
                 culturalPreferences?.language === 'russian' ? 'Время намаза' : 'Prayer Times',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'Namoz vaqtlarini ko\'rsatish' :
                    culturalPreferences?.language === 'russian' ? 'Показывать время намаза' :
                    'Display prayer times and reminders',
          type: 'toggle',
          value: culturalPreferences?.showPrayerTimes,
          icon: 'time-outline',
          parentalApprovalRequired: false,
        },
      ],
    },
    {
      title: culturalPreferences?.language === 'uzbek' ? 'Xavfsizlik va maxfiylik' :
             culturalPreferences?.language === 'russian' ? 'Безопасность и конфиденциальность' : 'Privacy & Safety',
      icon: 'shield-checkmark-outline',
      ageRestriction: isElementary ? undefined : 'middle',
      items: [
        {
          id: 'dataSharing',
          title: culturalPreferences?.language === 'uzbek' ? 'Ma\'lumotlarni ulashish' :
                 culturalPreferences?.language === 'russian' ? 'Обмен данными' : 'Data Sharing',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'O\'qituvchilar bilan o\'quv ma\'lumotlarini ulashish' :
                    culturalPreferences?.language === 'russian' ? 'Делиться учебными данными с учителями' :
                    'Share learning data with teachers',
          type: 'toggle',
          value: settings.dataSharing,
          icon: 'share-outline',
          parentalApprovalRequired: true,
          ageRestriction: 'middle',
        },
        {
          id: 'locationServices',
          title: culturalPreferences?.language === 'uzbek' ? 'Joylashuv xizmatlari' :
                 culturalPreferences?.language === 'russian' ? 'Службы геолокации' : 'Location Services',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'Davomat belgilash uchun joylashuvni aniqlash' :
                    culturalPreferences?.language === 'russian' ? 'Определять местоположение для отметки посещаемости' :
                    'Use location for attendance marking',
          type: 'toggle',
          value: settings.locationServices,
          icon: 'location-outline',
          parentalApprovalRequired: true,
          ageRestriction: 'middle',
        },
        {
          id: 'biometrics',
          title: culturalPreferences?.language === 'uzbek' ? 'Biometrik kirish' :
                 culturalPreferences?.language === 'russian' ? 'Биометрический вход' : 'Biometric Login',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'Barmoq izi yoki yuz tanish bilan kirish' :
                    culturalPreferences?.language === 'russian' ? 'Вход по отпечатку пальца или лицу' :
                    'Login with fingerprint or face recognition',
          type: 'toggle',
          value: settings.biometrics,
          icon: 'finger-print-outline',
          parentalApprovalRequired: true,
          ageRestriction: 'high',
        },
      ].filter(item => !item.ageRestriction || 
        (item.ageRestriction === 'middle' && !isElementary) ||
        (item.ageRestriction === 'high' && isHighSchool)
      ),
    },
    {
      title: culturalPreferences?.language === 'uzbek' ? 'Hisob' :
             culturalPreferences?.language === 'russian' ? 'Аккаунт' : 'Account',
      icon: 'person-outline',
      items: [
        {
          id: 'parentalControls',
          title: culturalPreferences?.language === 'uzbek' ? 'Ota-ona nazorati' :
                 culturalPreferences?.language === 'russian' ? 'Родительский контроль' : 'Parental Controls',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'Ota-ona sozlamalarini ko\'rish' :
                    culturalPreferences?.language === 'russian' ? 'Просмотр родительских настроек' :
                    'View parental control settings',
          type: 'navigation',
          icon: 'shield-outline',
          onPress: () => navigation.navigate('ParentalControls' as never),
        },
        {
          id: 'exportData',
          title: culturalPreferences?.language === 'uzbek' ? 'Ma\'lumotlarni eksport qilish' :
                 culturalPreferences?.language === 'russian' ? 'Экспорт данных' : 'Export Data',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'O\'quv ma\'lumotlarini yuklab olish' :
                    culturalPreferences?.language === 'russian' ? 'Скачать учебные данные' :
                    'Download your learning data',
          type: 'action',
          icon: 'download-outline',
          onPress: () => {
            // TODO: Implement data export
            Alert.alert(
              culturalPreferences?.language === 'uzbek' ? 'Tez orada' :
              culturalPreferences?.language === 'russian' ? 'Скоро' : 'Coming Soon',
              culturalPreferences?.language === 'uzbek' ? 
                'Bu funksiya tez orada qo\'shiladi.' :
              culturalPreferences?.language === 'russian' ?
                'Эта функция будет добавлена в ближайшее время.' :
                'This feature will be available soon.'
            );
          },
          ageRestriction: 'high',
        },
        {
          id: 'deleteAccount',
          title: culturalPreferences?.language === 'uzbek' ? 'Hisobni o\'chirish' :
                 culturalPreferences?.language === 'russian' ? 'Удалить аккаунт' : 'Delete Account',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'Hisobni butunlay o\'chirish' :
                    culturalPreferences?.language === 'russian' ? 'Полностью удалить аккаунт' :
                    'Permanently delete your account',
          type: 'action',
          icon: 'trash-outline',
          onPress: () => {
            Alert.alert(
              culturalPreferences?.language === 'uzbek' ? 'Ota-ona roziligi kerak' :
              culturalPreferences?.language === 'russian' ? 'Требуется разрешение родителей' :
              'Parental Approval Required',
              culturalPreferences?.language === 'uzbek' ? 
                'Hisobni o\'chirish uchun ota-onangiz bilan bog\'laning.' :
              culturalPreferences?.language === 'russian' ?
                'Для удаления аккаунта обратитесь к родителям.' :
                'Please contact your parents to delete your account.'
            );
          },
          ageRestriction: 'high',
        },
        {
          id: 'signOut',
          title: culturalPreferences?.language === 'uzbek' ? 'Tizimdan chiqish' :
                 culturalPreferences?.language === 'russian' ? 'Выйти' : 'Sign Out',
          subtitle: culturalPreferences?.language === 'uzbek' ? 'Ilovadan chiqish' :
                    culturalPreferences?.language === 'russian' ? 'Выйти из приложения' :
                    'Sign out of the app',
          type: 'action',
          icon: 'log-out-outline',
          onPress: handleSignOut,
        },
      ].filter(item => !item.ageRestriction || 
        (item.ageRestriction === 'high' && isHighSchool)
      ),
    },
  ], [
    culturalPreferences, 
    settings, 
    isElementary, 
    isMiddleSchool, 
    isHighSchool,
    navigation,
    handleSignOut
  ]);

  // Filter sections based on age restrictions
  const filteredSections = useMemo(() => 
    settingsSections.filter(section => 
      !section.ageRestriction || 
      (section.ageRestriction === 'middle' && !isElementary) ||
      (section.ageRestriction === 'high' && isHighSchool)
    ), 
    [settingsSections, isElementary, isHighSchool]
  );

  const renderSettingItem = useCallback((item: SettingItem, sectionIndex: number, itemIndex: number) => {
    const isLoading = loadingStates[item.id];

    return (
      <Animated.View
        key={item.id}
        entering={FadeInRight.delay((sectionIndex * 100) + (itemIndex * 50))}
        style={[
          styles.settingItem,
          { minHeight: isElementary ? 80 : 70 }
        ]}
      >
        <TouchableOpacity
          style={styles.settingItemContent}
          onPress={item.onPress}
          disabled={item.type === 'toggle' || isLoading}
          activeOpacity={0.7}
        >
          <View style={styles.settingItemLeft}>
            <View style={[
              styles.settingIcon,
              { 
                backgroundColor: isElementary ? '#f0f9ff' : '#f8fafc',
                width: isElementary ? 48 : 40,
                height: isElementary ? 48 : 40,
              }
            ]}>
              <Ionicons 
                name={item.icon} 
                size={isElementary ? 24 : 20} 
                color="#1d7452" 
              />
            </View>
            <View style={styles.settingText}>
              <Text style={[
                styles.settingTitle,
                {
                  fontSize: isElementary ? 18 : 16,
                  fontWeight: isElementary ? '600' : '500',
                }
              ]}>
                {item.title}
                {item.parentalApprovalRequired && (isElementary || isMiddleSchool) && (
                  <Text style={styles.parentalIcon}> 👨‍👩‍👧‍👦</Text>
                )}
              </Text>
              {item.subtitle && (
                <Text style={[
                  styles.settingSubtitle,
                  { fontSize: isElementary ? 14 : 12 }
                ]}>
                  {item.subtitle}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.settingItemRight}>
            {item.type === 'toggle' && (
              <Switch
                value={item.value as boolean}
                onValueChange={(value) => handleToggleSetting(
                  item.id, 
                  item.value as boolean,
                  item.parentalApprovalRequired
                )}
                trackColor={{ false: '#e2e8f0', true: '#1d7452' }}
                thumbColor={item.value ? '#ffffff' : '#ffffff'}
                disabled={isLoading}
                style={{ 
                  transform: [{ 
                    scale: isElementary ? 1.2 : 1 
                  }] 
                }}
              />
            )}
            
            {item.type === 'selection' && (
              <View style={styles.selectionValue}>
                <Text style={[
                  styles.selectionText,
                  { fontSize: isElementary ? 16 : 14 }
                ]}>
                  {item.value === 'english' ? 'English' :
                   item.value === 'uzbek' ? 'O\'zbek' :
                   item.value === 'russian' ? 'Русский' : item.value}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#64748b" />
              </View>
            )}
            
            {(item.type === 'navigation' || item.type === 'action') && (
              <Ionicons 
                name="chevron-forward" 
                size={isElementary ? 20 : 16} 
                color="#64748b" 
              />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [loadingStates, isElementary, isMiddleSchool, handleToggleSetting]);

  const renderSection = useCallback((section: SettingsSection, index: number) => (
    <Animated.View
      key={section.title}
      entering={FadeInDown.delay(index * 100)}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <View style={[
          styles.sectionIconContainer,
          { 
            width: isElementary ? 40 : 32,
            height: isElementary ? 40 : 32,
          }
        ]}>
          <Ionicons 
            name={section.icon} 
            size={isElementary ? 20 : 16} 
            color="#1d7452" 
          />
        </View>
        <Text style={[
          styles.sectionTitle,
          {
            fontSize: isElementary ? 20 : 18,
            fontWeight: isElementary ? '700' : '600',
          }
        ]}>
          {section.title}
        </Text>
      </View>
      
      <View style={styles.sectionContent}>
        {section.items.map((item, itemIndex) => 
          renderSettingItem(item, index, itemIndex)
        )}
      </View>
    </Animated.View>
  ), [isElementary, renderSettingItem]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            { 
              width: isElementary ? 44 : 40,
              height: isElementary ? 44 : 40,
            }
          ]}
        >
          <Ionicons 
            name="arrow-back" 
            size={isElementary ? 24 : 20} 
            color="#1d7452" 
          />
        </TouchableOpacity>
        
        <Text style={[
          styles.headerTitle,
          {
            fontSize: isElementary ? 24 : 20,
            fontWeight: isElementary ? '700' : '600',
          }
        ]}>
          {culturalPreferences?.language === 'uzbek' ? 'Sozlamalar' :
           culturalPreferences?.language === 'russian' ? 'Настройки' : 'Settings'}
        </Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredSections.map(renderSection)}
        
        {/* App version info */}
        <View style={styles.versionInfo}>
          <Text style={[
            styles.versionText,
            { fontSize: isElementary ? 14 : 12 }
          ]}>
            Harry School Student App v1.0.0
          </Text>
          <Text style={[
            styles.versionSubtext,
            { fontSize: isElementary ? 12 : 10 }
          ]}>
            {culturalPreferences?.language === 'uzbek' ? 'Toshkent, O\'zbekiston' :
             culturalPreferences?.language === 'russian' ? 'Ташкент, Узбекистан' :
             'Tashkent, Uzbekistan'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    color: '#1e293b',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    marginRight: 12,
  },
  sectionTitle: {
    color: '#1e293b',
  },
  sectionContent: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    backgroundColor: '#ffffff',
    marginHorizontal: 1,
    marginVertical: 0.5,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    color: '#1e293b',
    marginBottom: 2,
  },
  settingSubtitle: {
    color: '#64748b',
    lineHeight: 16,
  },
  parentalIcon: {
    fontSize: 12,
  },
  settingItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionText: {
    color: '#1e293b',
    marginRight: 8,
    fontWeight: '500',
  },
  versionInfo: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  versionText: {
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  versionSubtext: {
    color: '#94a3b8',
  },
});