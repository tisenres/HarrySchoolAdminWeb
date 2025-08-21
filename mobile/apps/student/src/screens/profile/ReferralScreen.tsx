import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  StyleSheet,
  SafeAreaView,
  Clipboard,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStudentStore } from '../../store/studentStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useReferralStore } from '../../store/referralStore';

interface ReferralReward {
  icon: string;
  title: string;
  description: string;
  points?: number;
  unlock?: string;
}

interface ReferralMethod {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  action: () => void;
}

export default function ReferralScreen() {
  const navigation = useNavigation();
  const { student } = useStudentStore();
  const { culturalPreferences } = useSettingsStore();
  const { 
    referralCode, 
    referralStats, 
    generateReferralCode,
    shareReferral,
    getReferralRewards,
  } = useReferralStore();

  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [showRewards, setShowRewards] = useState(false);

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

  // Animation values
  const codeCardScale = useSharedValue(1);
  const shareButtonScale = useSharedValue(1);
  const rewardsOpacity = useSharedValue(0);

  // Generate referral code on component mount
  useEffect(() => {
    if (!referralCode && student?.id) {
      generateReferralCode(student.id);
    }
  }, [student?.id, referralCode, generateReferralCode]);

  // Referral rewards based on age group
  const referralRewards: ReferralReward[] = useMemo(() => [
    {
      icon: '🎖️',
      title: culturalPreferences?.language === 'uzbek' ? 'Bonus ballar' :
             culturalPreferences?.language === 'russian' ? 'Бонусные баллы' : 'Bonus Points',
      description: culturalPreferences?.language === 'uzbek' ? 
        'Har bir do\'st uchun 100 ball oling' :
        culturalPreferences?.language === 'russian' ?
        'Получите 100 баллов за каждого друга' :
        'Earn 100 points for each friend',
      points: 100,
    },
    {
      icon: '🏆',
      title: culturalPreferences?.language === 'uzbek' ? 'Maxsus unvon' :
             culturalPreferences?.language === 'russian' ? 'Специальный титул' : 'Special Badge',
      description: culturalPreferences?.language === 'uzbek' ? 
        '5 do\'st taklif qilganingizda "Do\'st Olib Keluvchi" unvoni' :
        culturalPreferences?.language === 'russian' ?
        'Титул "Приведший Друзей" после приглашения 5 друзей' :
        '"Friend Bringer" badge after inviting 5 friends',
      unlock: culturalPreferences?.language === 'uzbek' ? '5 taklif' :
              culturalPreferences?.language === 'russian' ? '5 приглашений' : '5 invites',
    },
    {
      icon: '🎁',
      title: culturalPreferences?.language === 'uzbek' ? 'Sovg\'a' :
             culturalPreferences?.language === 'russian' ? 'Подарок' : 'Gift Rewards',
      description: culturalPreferences?.language === 'uzbek' ? 
        '10 do\'st taklif qilganingizda maxsus sovg\'a' :
        culturalPreferences?.language === 'russian' ?
        'Специальный подарок после приглашения 10 друзей' :
        'Special gift after inviting 10 friends',
      unlock: culturalPreferences?.language === 'uzbek' ? '10 taklif' :
              culturalPreferences?.language === 'russian' ? '10 приглашений' : '10 invites',
    },
    {
      icon: isElementary ? '🌟' : '👑',
      title: culturalPreferences?.language === 'uzbek' ? 'VIP maqom' :
             culturalPreferences?.language === 'russian' ? 'VIP статус' : 'VIP Status',
      description: culturalPreferences?.language === 'uzbek' ? 
        '20 do\'st taklif qilganingizda VIP maqomga ega bo\'ling' :
        culturalPreferences?.language === 'russian' ?
        'Получите VIP статус после приглашения 20 друзей' :
        'Unlock VIP status after inviting 20 friends',
      unlock: culturalPreferences?.language === 'uzbek' ? '20 taklif' :
              culturalPreferences?.language === 'russian' ? '20 приглашений' : '20 invites',
    },
  ], [culturalPreferences, isElementary]);

  // Generate referral message
  const getReferralMessage = useCallback(() => {
    const baseMessage = culturalPreferences?.language === 'uzbek' ? 
      `Salom! Men Harry School'da ingliz tilini o'rganmoqdaman va juda yoqmoqda! Siz ham qo'shilasizmi?\n\nMening taklif kodim: ${referralCode}\n\nIlova: https://harryschool.uz/app` :
      culturalPreferences?.language === 'russian' ?
      `Привет! Я изучаю английский в Harry School и мне очень нравится! Присоединишься?\n\nМой код приглашения: ${referralCode}\n\nПриложение: https://harryschool.uz/app` :
      `Hi! I'm learning English at Harry School and I love it! Want to join me?\n\nMy referral code: ${referralCode}\n\nDownload: https://harryschool.uz/app`;

    const islamicGreeting = culturalPreferences?.showIslamicGreetings ? 
      (culturalPreferences?.language === 'uzbek' ? 
        'Assalomu alaykum! ' : 
        culturalPreferences?.language === 'russian' ?
        'Ассаламу алейкум! ' :
        'Assalamu alaikum! ') : '';

    return islamicGreeting + baseMessage;
  }, [referralCode, culturalPreferences]);

  // Handle code generation
  const handleGenerateCode = useCallback(async () => {
    if (!student?.id) return;
    
    setIsGeneratingCode(true);
    codeCardScale.value = withSequence(
      withSpring(0.95),
      withSpring(1.05),
      withSpring(1)
    );

    try {
      await generateReferralCode(student.id);
    } catch (error) {
      console.error('Error generating referral code:', error);
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Xatolik' :
        culturalPreferences?.language === 'russian' ? 'Ошибка' : 'Error',
        culturalPreferences?.language === 'uzbek' ? 
          'Taklif kodi yaratishda xatolik yuz berdi.' :
        culturalPreferences?.language === 'russian' ?
          'Произошла ошибка при создании кода приглашения.' :
          'Error generating referral code.'
      );
    } finally {
      setIsGeneratingCode(false);
    }
  }, [student?.id, generateReferralCode, culturalPreferences, codeCardScale]);

  // Handle copy to clipboard
  const handleCopyCode = useCallback(async () => {
    if (!referralCode) return;

    try {
      await Clipboard.setString(referralCode);
      
      // Animate feedback
      codeCardScale.value = withSequence(
        withSpring(1.05),
        withSpring(1)
      );

      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Nusxalandi!' :
        culturalPreferences?.language === 'russian' ? 'Скопировано!' : 'Copied!',
        culturalPreferences?.language === 'uzbek' ? 
          'Taklif kodi buferga nusxalandi.' :
        culturalPreferences?.language === 'russian' ?
          'Код приглашения скопирован в буфер обмена.' :
          'Referral code copied to clipboard.'
      );
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }, [referralCode, culturalPreferences, codeCardScale]);

  // Share methods with age-appropriate options
  const shareMethods: ReferralMethod[] = useMemo(() => [
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Do\'stlaringizga yuborish' :
                culturalPreferences?.language === 'russian' ? 'Отправить друзьям' : 'Share with friends',
      icon: 'logo-whatsapp',
      color: '#25d366',
      action: async () => {
        const message = getReferralMessage();
        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
        
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
            await shareReferral(student?.id || '', 'whatsapp');
          } else {
            throw new Error('WhatsApp not installed');
          }
        } catch (error) {
          Alert.alert(
            culturalPreferences?.language === 'uzbek' ? 'WhatsApp topilmadi' :
            culturalPreferences?.language === 'russian' ? 'WhatsApp не найден' : 'WhatsApp Not Found',
            culturalPreferences?.language === 'uzbek' ? 
              'WhatsApp ilovasi o\'rnatilmagan.' :
            culturalPreferences?.language === 'russian' ?
              'Приложение WhatsApp не установлено.' :
              'WhatsApp is not installed on this device.'
          );
        }
      },
    },
    {
      id: 'telegram',
      title: 'Telegram',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Tez va oson ulashish' :
                culturalPreferences?.language === 'russian' ? 'Быстро и легко поделиться' : 'Quick and easy sharing',
      icon: 'send',
      color: '#0088cc',
      action: async () => {
        const message = getReferralMessage();
        const url = `tg://msg?text=${encodeURIComponent(message)}`;
        
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
            await shareReferral(student?.id || '', 'telegram');
          } else {
            throw new Error('Telegram not installed');
          }
        } catch (error) {
          // Fallback to web version
          const webUrl = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
          await Linking.openURL(webUrl);
          await shareReferral(student?.id || '', 'telegram');
        }
      },
    },
    {
      id: 'system',
      title: culturalPreferences?.language === 'uzbek' ? 'Boshqa' :
             culturalPreferences?.language === 'russian' ? 'Другие' : 'More Apps',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Boshqa ilovalar orqali ulashish' :
                culturalPreferences?.language === 'russian' ? 'Поделиться через другие приложения' : 'Share via other apps',
      icon: 'share-outline',
      color: '#6366f1',
      action: async () => {
        const message = getReferralMessage();
        
        try {
          await Share.share({
            message,
            title: culturalPreferences?.language === 'uzbek' ? 'Harry School\'ga qo\'shiling!' :
                   culturalPreferences?.language === 'russian' ? 'Присоединяйтесь к Harry School!' :
                   'Join Harry School!',
          });
          await shareReferral(student?.id || '', 'system');
        } catch (error) {
          console.error('Error sharing:', error);
        }
      },
    },
  ], [culturalPreferences, getReferralMessage, shareReferral, student?.id]);

  // Toggle rewards visibility
  const toggleRewards = useCallback(() => {
    setShowRewards(!showRewards);
    rewardsOpacity.value = withSpring(showRewards ? 0 : 1);
  }, [showRewards, rewardsOpacity]);

  const codeCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: codeCardScale.value }],
  }));

  const shareButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareButtonScale.value }],
  }));

  const rewardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: rewardsOpacity.value,
  }));

  const renderReferralReward = useCallback((reward: ReferralReward, index: number) => (
    <Animated.View
      key={index}
      entering={FadeInRight.delay(index * 100)}
      style={[
        styles.rewardCard,
        { minHeight: isElementary ? 80 : 70 }
      ]}
    >
      <View style={styles.rewardIcon}>
        <Text style={[
          styles.rewardEmoji,
          { fontSize: isElementary ? 32 : 28 }
        ]}>
          {reward.icon}
        </Text>
      </View>
      
      <View style={styles.rewardContent}>
        <Text style={[
          styles.rewardTitle,
          {
            fontSize: isElementary ? 16 : 14,
            fontWeight: isElementary ? '600' : '500',
          }
        ]}>
          {reward.title}
        </Text>
        <Text style={[
          styles.rewardDescription,
          { fontSize: isElementary ? 14 : 12 }
        ]}>
          {reward.description}
        </Text>
        
        {reward.points && (
          <View style={styles.pointsBadge}>
            <Text style={[
              styles.pointsText,
              { fontSize: isElementary ? 12 : 10 }
            ]}>
              +{reward.points} {culturalPreferences?.language === 'uzbek' ? 'ball' :
                              culturalPreferences?.language === 'russian' ? 'балл' : 'pts'}
            </Text>
          </View>
        )}
        
        {reward.unlock && (
          <View style={styles.unlockBadge}>
            <Text style={[
              styles.unlockText,
              { fontSize: isElementary ? 12 : 10 }
            ]}>
              {reward.unlock}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  ), [isElementary, culturalPreferences]);

  const renderShareMethod = useCallback((method: ReferralMethod, index: number) => (
    <Animated.View
      key={method.id}
      entering={FadeInDown.delay(index * 100)}
    >
      <TouchableOpacity
        style={[
          styles.shareMethodCard,
          { 
            minHeight: isElementary ? 80 : 70,
            borderColor: method.color + '20',
          }
        ]}
        onPress={() => {
          shareButtonScale.value = withSequence(
            withSpring(0.95),
            withSpring(1)
          );
          method.action();
        }}
        activeOpacity={0.7}
      >
        <View style={[
          styles.shareMethodIcon,
          { 
            backgroundColor: method.color,
            width: isElementary ? 48 : 40,
            height: isElementary ? 48 : 40,
          }
        ]}>
          <Ionicons 
            name={method.icon} 
            size={isElementary ? 24 : 20} 
            color="#ffffff" 
          />
        </View>
        
        <View style={styles.shareMethodContent}>
          <Text style={[
            styles.shareMethodTitle,
            {
              fontSize: isElementary ? 18 : 16,
              fontWeight: isElementary ? '600' : '500',
            }
          ]}>
            {method.title}
          </Text>
          <Text style={[
            styles.shareMethodSubtitle,
            { fontSize: isElementary ? 14 : 12 }
          ]}>
            {method.subtitle}
          </Text>
        </View>
        
        <Ionicons 
          name="chevron-forward" 
          size={isElementary ? 20 : 16} 
          color="#64748b" 
        />
      </TouchableOpacity>
    </Animated.View>
  ), [isElementary, shareButtonScale]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
          {culturalPreferences?.language === 'uzbek' ? 'Do\'stlarni taklif qilish' :
           culturalPreferences?.language === 'russian' ? 'Пригласить друзей' : 'Invite Friends'}
        </Text>
        
        <TouchableOpacity
          onPress={toggleRewards}
          style={[
            styles.rewardsButton,
            { 
              width: isElementary ? 44 : 40,
              height: isElementary ? 44 : 40,
            }
          ]}
        >
          <Ionicons 
            name="gift" 
            size={isElementary ? 24 : 20} 
            color="#1d7452" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Introduction */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={styles.introduction}
        >
          <Text style={[
            styles.introTitle,
            {
              fontSize: isElementary ? 22 : 20,
              fontWeight: isElementary ? '700' : '600',
            }
          ]}>
            {culturalPreferences?.language === 'uzbek' ? 
              'Do\'stlaringizni taklif qiling!' :
             culturalPreferences?.language === 'russian' ?
              'Пригласите друзей!' :
              'Invite Your Friends!'}
          </Text>
          <Text style={[
            styles.introText,
            { fontSize: isElementary ? 16 : 14 }
          ]}>
            {culturalPreferences?.language === 'uzbek' ? 
              'Do\'stlaringiz bilan birga ingliz tilini o\'rganing va mukofotlar qo\'lga kiriting!' :
             culturalPreferences?.language === 'russian' ?
              'Изучайте английский с друзьями и получайте награды!' :
              'Learn English together with friends and earn rewards!'}
          </Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.statsContainer}
        >
          <View style={[
            styles.statCard,
            { backgroundColor: '#f0f9ff' }
          ]}>
            <Text style={[
              styles.statNumber,
              { 
                fontSize: isElementary ? 28 : 24,
                color: '#1d7452',
              }
            ]}>
              {referralStats?.totalInvites || 0}
            </Text>
            <Text style={[
              styles.statLabel,
              { fontSize: isElementary ? 14 : 12 }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 'Taklif qilingan' :
               culturalPreferences?.language === 'russian' ? 'Приглашено' : 'Invited'}
            </Text>
          </View>
          
          <View style={[
            styles.statCard,
            { backgroundColor: '#f0fdf4' }
          ]}>
            <Text style={[
              styles.statNumber,
              { 
                fontSize: isElementary ? 28 : 24,
                color: '#16a34a',
              }
            ]}>
              {referralStats?.successfulReferrals || 0}
            </Text>
            <Text style={[
              styles.statLabel,
              { fontSize: isElementary ? 14 : 12 }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 'Qo\'shilgan' :
               culturalPreferences?.language === 'russian' ? 'Присоединились' : 'Joined'}
            </Text>
          </View>
          
          <View style={[
            styles.statCard,
            { backgroundColor: '#fef3c7' }
          ]}>
            <Text style={[
              styles.statNumber,
              { 
                fontSize: isElementary ? 28 : 24,
                color: '#d97706',
              }
            ]}>
              {referralStats?.pointsEarned || 0}
            </Text>
            <Text style={[
              styles.statLabel,
              { fontSize: isElementary ? 14 : 12 }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 'Ball' :
               culturalPreferences?.language === 'russian' ? 'Баллы' : 'Points'}
            </Text>
          </View>
        </Animated.View>

        {/* Referral Code */}
        <Animated.View
          entering={FadeInDown.delay(300)}
          style={codeCardAnimatedStyle}
        >
          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <Text style={[
                styles.codeTitle,
                {
                  fontSize: isElementary ? 18 : 16,
                  fontWeight: isElementary ? '600' : '500',
                }
              ]}>
                {culturalPreferences?.language === 'uzbek' ? 'Sizning taklif kodingiz' :
                 culturalPreferences?.language === 'russian' ? 'Ваш код приглашения' : 'Your Referral Code'}
              </Text>
              
              <TouchableOpacity
                onPress={handleGenerateCode}
                disabled={isGeneratingCode}
                style={styles.refreshButton}
              >
                <Ionicons 
                  name="refresh" 
                  size={16} 
                  color="#1d7452" 
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.codeContainer}
              onPress={handleCopyCode}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.codeText,
                { fontSize: isElementary ? 24 : 20 }
              ]}>
                {referralCode || '----'}
              </Text>
              <Ionicons 
                name="copy-outline" 
                size={isElementary ? 24 : 20} 
                color="#64748b" 
              />
            </TouchableOpacity>
            
            <Text style={[
              styles.codeHint,
              { fontSize: isElementary ? 14 : 12 }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 'Nusxalash uchun bosing' :
               culturalPreferences?.language === 'russian' ? 'Нажмите для копирования' : 'Tap to copy'}
            </Text>
          </View>
        </Animated.View>

        {/* Share Methods */}
        <Animated.View
          entering={FadeInDown.delay(400)}
          style={styles.section}
        >
          <Text style={[
            styles.sectionTitle,
            {
              fontSize: isElementary ? 18 : 16,
              fontWeight: isElementary ? '600' : '500',
            }
          ]}>
            {culturalPreferences?.language === 'uzbek' ? 'Ulashish usullari' :
             culturalPreferences?.language === 'russian' ? 'Способы поделиться' : 'Share Methods'}
          </Text>
          
          <View style={styles.shareMethodsContainer}>
            {shareMethods.map(renderShareMethod)}
          </View>
        </Animated.View>

        {/* Rewards Section */}
        {showRewards && (
          <Animated.View
            style={[styles.section, rewardsAnimatedStyle]}
            entering={FadeInDown.delay(500)}
          >
            <Text style={[
              styles.sectionTitle,
              {
                fontSize: isElementary ? 18 : 16,
                fontWeight: isElementary ? '600' : '500',
              }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 'Mukofotlar' :
               culturalPreferences?.language === 'russian' ? 'Награды' : 'Rewards'}
            </Text>
            
            <View style={styles.rewardsContainer}>
              {referralRewards.map(renderReferralReward)}
            </View>
          </Animated.View>
        )}

        {/* Islamic Message */}
        {culturalPreferences?.showIslamicGreetings && (
          <Animated.View
            entering={FadeInDown.delay(600)}
            style={styles.islamicMessage}
          >
            <Text style={[
              styles.islamicText,
              { fontSize: isElementary ? 14 : 12 }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 
                '"Ilmni o\'rganish har bir musulmon erkak va ayolga farzdir." - Hadis' :
               culturalPreferences?.language === 'russian' ?
                '"Поиск знаний является обязанностью каждого мусульманина." - Хадис' :
                '"Seeking knowledge is an obligation upon every Muslim." - Hadith'}
            </Text>
          </Animated.View>
        )}
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
  rewardsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introduction: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#1d7452',
  },
  introTitle: {
    color: '#1e293b',
    marginBottom: 8,
  },
  introText: {
    color: '#475569',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  codeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  codeTitle: {
    color: '#1e293b',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#1d7452',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  codeText: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#1d7452',
    letterSpacing: 2,
  },
  codeHint: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#1e293b',
    marginBottom: 16,
  },
  shareMethodsContainer: {
    gap: 12,
  },
  shareMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareMethodIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginRight: 16,
  },
  shareMethodContent: {
    flex: 1,
  },
  shareMethodTitle: {
    color: '#1e293b',
    marginBottom: 4,
  },
  shareMethodSubtitle: {
    color: '#64748b',
    lineHeight: 16,
  },
  rewardsContainer: {
    gap: 12,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rewardIcon: {
    marginRight: 16,
  },
  rewardEmoji: {
    textAlign: 'center',
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    color: '#1e293b',
    marginBottom: 4,
  },
  rewardDescription: {
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 8,
  },
  pointsBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pointsText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  unlockBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  unlockText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  islamicMessage: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    marginTop: 8,
  },
  islamicText: {
    color: '#15803d',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
});