import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStudentStore } from '../../store/studentStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useRequestStore } from '../../store/requestStore';

interface HomeworkType {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  ageAppropriate: boolean;
}

interface DifficultyLevel {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  ageAppropriate: boolean;
}

interface SubjectArea {
  id: string;
  title: string;
  topics: string[];
  color: string;
}

export default function ExtraHomeworkScreen() {
  const navigation = useNavigation();
  const { student } = useStudentStore();
  const { culturalPreferences } = useSettingsStore();
  const { submitHomeworkRequest, isSubmitting } = useRequestStore();

  const [selectedHomeworkType, setSelectedHomeworkType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [specificTopic, setSpecificTopic] = useState<string>('');
  const [requestReason, setRequestReason] = useState<string>('');
  const [preferredDeadline, setPreferredDeadline] = useState<string>('');

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
  const submitButtonScale = useSharedValue(1);

  // Homework types with age-appropriate content
  const homeworkTypes: HomeworkType[] = useMemo(() => [
    {
      id: 'vocabulary',
      title: culturalPreferences?.language === 'uzbek' ? 'Lug\'at ishlari' :
             culturalPreferences?.language === 'russian' ? 'Словарная работа' : 'Vocabulary Practice',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Yangi so\'zlar o\'rganish va mashq qilish' :
                culturalPreferences?.language === 'russian' ? 'Изучение и практика новых слов' :
                'Learn and practice new words',
      icon: 'book-outline',
      color: '#3b82f6',
      difficulty: 'easy',
      estimatedTime: isElementary ? 20 : 30,
      ageAppropriate: true,
    },
    {
      id: 'grammar',
      title: culturalPreferences?.language === 'uzbek' ? 'Grammatika mashqlari' :
             culturalPreferences?.language === 'russian' ? 'Грамматические упражнения' : 'Grammar Exercises',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Grammatika qoidalarini mustahkamlash' :
                culturalPreferences?.language === 'russian' ? 'Закрепление грамматических правил' :
                'Reinforce grammar rules',
      icon: 'library-outline',
      color: '#10b981',
      difficulty: 'medium',
      estimatedTime: isElementary ? 25 : 45,
      ageAppropriate: !isElementary,
    },
    {
      id: 'reading',
      title: culturalPreferences?.language === 'uzbek' ? 'O\'qish vazifalari' :
             culturalPreferences?.language === 'russian' ? 'Задания по чтению' : 'Reading Tasks',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Matn o\'qish va tushunish' :
                culturalPreferences?.language === 'russian' ? 'Чтение и понимание текстов' :
                'Read and comprehend texts',
      icon: 'document-text-outline',
      color: '#f59e0b',
      difficulty: 'easy',
      estimatedTime: isElementary ? 15 : 30,
      ageAppropriate: true,
    },
    {
      id: 'writing',
      title: culturalPreferences?.language === 'uzbek' ? 'Yozish vazifalari' :
             culturalPreferences?.language === 'russian' ? 'Письменные задания' : 'Writing Tasks',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Insho va yozma ishlar' :
                culturalPreferences?.language === 'russian' ? 'Сочинения и письменные работы' :
                'Essays and written work',
      icon: 'create-outline',
      color: '#8b5cf6',
      difficulty: 'medium',
      estimatedTime: isElementary ? 30 : 60,
      ageAppropriate: !isElementary || isMiddleSchool,
    },
    {
      id: 'listening',
      title: culturalPreferences?.language === 'uzbek' ? 'Tinglash mashqlari' :
             culturalPreferences?.language === 'russian' ? 'Упражнения на слушание' : 'Listening Practice',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Audio materiallarni tinglash' :
                culturalPreferences?.language === 'russian' ? 'Прослушивание аудиоматериалов' :
                'Listen to audio materials',
      icon: 'headset-outline',
      color: '#06b6d4',
      difficulty: 'easy',
      estimatedTime: isElementary ? 15 : 25,
      ageAppropriate: true,
    },
    {
      id: 'speaking',
      title: culturalPreferences?.language === 'uzbek' ? 'Gapirish vazifalari' :
             culturalPreferences?.language === 'russian' ? 'Задания на говорение' : 'Speaking Tasks',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Og\'zaki nutq mashqlari' :
                culturalPreferences?.language === 'russian' ? 'Упражнения для устной речи' :
                'Oral speech exercises',
      icon: 'mic-outline',
      color: '#ef4444',
      difficulty: 'medium',
      estimatedTime: isElementary ? 20 : 40,
      ageAppropriate: true,
    },
    {
      id: 'project',
      title: culturalPreferences?.language === 'uzbek' ? 'Loyiha ishi' :
             culturalPreferences?.language === 'russian' ? 'Проектная работа' : 'Project Work',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Ijodiy loyiha tayyorlash' :
                culturalPreferences?.language === 'russian' ? 'Подготовка творческого проекта' :
                'Prepare creative project',
      icon: 'bulb-outline',
      color: '#ec4899',
      difficulty: 'hard',
      estimatedTime: isMiddleSchool ? 90 : 120,
      ageAppropriate: !isElementary,
    },
  ].filter(type => type.ageAppropriate), [culturalPreferences, isElementary, isMiddleSchool]);

  // Difficulty levels with age-appropriate descriptions
  const difficultyLevels: DifficultyLevel[] = useMemo(() => [
    {
      id: 'easy',
      title: culturalPreferences?.language === 'uzbek' ? 'Oson' :
             culturalPreferences?.language === 'russian' ? 'Легкий' : 'Easy',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Boshlang\'ich daraja' :
                culturalPreferences?.language === 'russian' ? 'Начальный уровень' : 'Beginner level',
      icon: '😊',
      color: '#22c55e',
      ageAppropriate: true,
    },
    {
      id: 'medium',
      title: culturalPreferences?.language === 'uzbek' ? 'O\'rtacha' :
             culturalPreferences?.language === 'russian' ? 'Средний' : 'Medium',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'O\'rtacha daraja' :
                culturalPreferences?.language === 'russian' ? 'Средний уровень' : 'Intermediate level',
      icon: '🤔',
      color: '#f59e0b',
      ageAppropriate: !isElementary,
    },
    {
      id: 'hard',
      title: culturalPreferences?.language === 'uzbek' ? 'Qiyin' :
             culturalPreferences?.language === 'russian' ? 'Сложный' : 'Hard',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Yuqori daraja' :
                culturalPreferences?.language === 'russian' ? 'Продвинутый уровень' : 'Advanced level',
      icon: '🧠',
      color: '#ef4444',
      ageAppropriate: isHighSchool,
    },
  ].filter(level => level.ageAppropriate), [culturalPreferences, isElementary, isHighSchool]);

  // Subject areas with topics
  const subjectAreas: SubjectArea[] = useMemo(() => [
    {
      id: 'general',
      title: culturalPreferences?.language === 'uzbek' ? 'Umumiy ingliz tili' :
             culturalPreferences?.language === 'russian' ? 'Общий английский' : 'General English',
      topics: isElementary ? [
        culturalPreferences?.language === 'uzbek' ? 'Salomlashish' : 'Greetings',
        culturalPreferences?.language === 'uzbek' ? 'Ranglar' : 'Colors',
        culturalPreferences?.language === 'uzbek' ? 'Raqamlar' : 'Numbers',
        culturalPreferences?.language === 'uzbek' ? 'Oila' : 'Family',
      ] : [
        culturalPreferences?.language === 'uzbek' ? 'Kundalik suhbat' : 'Daily Conversation',
        culturalPreferences?.language === 'uzbek' ? 'Vaqt va sana' : 'Time and Date',
        culturalPreferences?.language === 'uzbek' ? 'Transport' : 'Transportation',
        culturalPreferences?.language === 'uzbek' ? 'Oziq-ovqat' : 'Food',
      ],
      color: '#3b82f6',
    },
    {
      id: 'academic',
      title: culturalPreferences?.language === 'uzbek' ? 'Akademik ingliz tili' :
             culturalPreferences?.language === 'russian' ? 'Академический английский' : 'Academic English',
      topics: isElementary ? [
        culturalPreferences?.language === 'uzbek' ? 'Maktab buyumlari' : 'School Items',
        culturalPreferences?.language === 'uzbek' ? 'Fanlar' : 'Subjects',
      ] : [
        culturalPreferences?.language === 'uzbek' ? 'Ilmiy matnlar' : 'Scientific Texts',
        culturalPreferences?.language === 'uzbek' ? 'Taqdimot' : 'Presentations',
        culturalPreferences?.language === 'uzbek' ? 'Tadqiqot' : 'Research',
        culturalPreferences?.language === 'uzbek' ? 'Mulohaza' : 'Essays',
      ],
      color: '#10b981',
    },
    {
      id: 'business',
      title: culturalPreferences?.language === 'uzbek' ? 'Biznes ingliz tili' :
             culturalPreferences?.language === 'russian' ? 'Деловой английский' : 'Business English',
      topics: isHighSchool ? [
        culturalPreferences?.language === 'uzbek' ? 'Ish joyida muloqot' : 'Workplace Communication',
        culturalPreferences?.language === 'uzbek' ? 'Prezentatsiya' : 'Presentations',
        culturalPreferences?.language === 'uzbek' ? 'Email yozish' : 'Email Writing',
        culturalPreferences?.language === 'uzbek' ? 'Suhbat' : 'Interviews',
      ] : [],
      color: '#8b5cf6',
    },
    {
      id: 'cultural',
      title: culturalPreferences?.language === 'uzbek' ? 'Madaniy ingliz tili' :
             culturalPreferences?.language === 'russian' ? 'Культурный английский' : 'Cultural English',
      topics: [
        culturalPreferences?.language === 'uzbek' ? 'Bayramlar' : 'Holidays',
        culturalPreferences?.language === 'uzbek' ? 'An\'analar' : 'Traditions',
        culturalPreferences?.language === 'uzbek' ? 'Musiqalar' : 'Music',
        culturalPreferences?.language === 'uzbek' ? 'Filmlar' : 'Movies',
      ],
      color: '#f59e0b',
    },
  ].filter(area => area.topics.length > 0), [culturalPreferences, isElementary, isHighSchool]);

  // Deadline options
  const deadlineOptions = useMemo(() => [
    {
      id: '1_day',
      title: culturalPreferences?.language === 'uzbek' ? '1 kun' :
             culturalPreferences?.language === 'russian' ? '1 день' : '1 Day',
    },
    {
      id: '3_days',
      title: culturalPreferences?.language === 'uzbek' ? '3 kun' :
             culturalPreferences?.language === 'russian' ? '3 дня' : '3 Days',
    },
    {
      id: '1_week',
      title: culturalPreferences?.language === 'uzbek' ? '1 hafta' :
             culturalPreferences?.language === 'russian' ? '1 неделя' : '1 Week',
    },
    {
      id: '2_weeks',
      title: culturalPreferences?.language === 'uzbek' ? '2 hafta' :
             culturalPreferences?.language === 'russian' ? '2 недели' : '2 Weeks',
    },
  ], [culturalPreferences]);

  // Handle homework request submission
  const handleSubmitRequest = useCallback(async () => {
    // Validation
    if (!selectedHomeworkType) {
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Vazifa turini tanlang' :
        culturalPreferences?.language === 'russian' ? 'Выберите тип задания' : 'Select Homework Type',
        culturalPreferences?.language === 'uzbek' ? 'Iltimos, uy vazifasi turini tanlang.' :
        culturalPreferences?.language === 'russian' ? 'Пожалуйста, выберите тип домашнего задания.' :
        'Please select a homework type.'
      );
      return;
    }

    if (!selectedDifficulty) {
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Qiyinlik darajasini tanlang' :
        culturalPreferences?.language === 'russian' ? 'Выберите уровень сложности' : 'Select Difficulty Level',
        culturalPreferences?.language === 'uzbek' ? 'Iltimos, qiyinlik darajasini tanlang.' :
        culturalPreferences?.language === 'russian' ? 'Пожалуйста, выберите уровень сложности.' :
        'Please select a difficulty level.'
      );
      return;
    }

    if (!selectedSubject) {
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Mavzu tanlang' :
        culturalPreferences?.language === 'russian' ? 'Выберите тему' : 'Select Subject Area',
        culturalPreferences?.language === 'uzbek' ? 'Iltimos, mavzu sohangizni tanlang.' :
        culturalPreferences?.language === 'russian' ? 'Пожалуйста, выберите предметную область.' :
        'Please select a subject area.'
      );
      return;
    }

    if (!requestReason.trim()) {
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Sabab yozing' :
        culturalPreferences?.language === 'russian' ? 'Укажите причину' : 'Provide Reason',
        culturalPreferences?.language === 'uzbek' ? 'Iltimos, qo\'shimcha uy vazifasi so\'rash sababini yozing.' :
        culturalPreferences?.language === 'russian' ? 'Пожалуйста, укажите причину запроса дополнительного задания.' :
        'Please provide a reason for the extra homework request.'
      );
      return;
    }

    // Animate submit button
    submitButtonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );

    try {
      const homeworkType = homeworkTypes.find(type => type.id === selectedHomeworkType);
      const difficulty = difficultyLevels.find(level => level.id === selectedDifficulty);
      const subject = subjectAreas.find(area => area.id === selectedSubject);
      
      await submitHomeworkRequest({
        studentId: student?.id || '',
        homeworkType: selectedHomeworkType,
        homeworkTitle: homeworkType?.title || '',
        difficulty: selectedDifficulty,
        subjectArea: selectedSubject,
        subjectTitle: subject?.title || '',
        specificTopic: specificTopic.trim(),
        estimatedTime: homeworkType?.estimatedTime || 30,
        preferredDeadline,
        reason: requestReason.trim(),
        ageGroup,
        culturalContext: {
          language: culturalPreferences?.language || 'english',
          showIslamicGreetings: culturalPreferences?.showIslamicGreetings || false,
        },
        submittedAt: new Date().toISOString(),
      });

      // Success message with age-appropriate content
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'So\'rov yuborildi!' :
        culturalPreferences?.language === 'russian' ? 'Запрос отправлен!' : 'Request Submitted!',
        isElementary ? (
          culturalPreferences?.language === 'uzbek' ? 
            'Qo\'shimcha uy vazifasi so\'rovingiz yuborildi! Tez orada vazifa tayyor bo\'ladi.' :
          culturalPreferences?.language === 'russian' ?
            'Ваш запрос на дополнительное задание отправлен! Задание скоро будет готово.' :
            'Your extra homework request has been sent! The assignment will be ready soon.'
        ) : (
          culturalPreferences?.language === 'uzbek' ? 
            'Qo\'shimcha uy vazifasi so\'rovingiz muvaffaqiyatli yuborildi. Vazifa tayyorlanib, sizga 24 soat ichida yuboriladi.' :
          culturalPreferences?.language === 'russian' ?
            'Ваш запрос на дополнительное домашнее задание успешно отправлен. Задание будет подготовлено и отправлено вам в течение 24 часов.' :
            'Your extra homework request has been submitted successfully. The assignment will be prepared and sent to you within 24 hours.'
        ),
        [
          {
            text: culturalPreferences?.language === 'uzbek' ? 'Yaxshi' :
                  culturalPreferences?.language === 'russian' ? 'Хорошо' : 'Great',
            onPress: () => navigation.goBack()
          }
        ]
      );

      // Reset form
      setSelectedHomeworkType('');
      setSelectedDifficulty('');
      setSelectedSubject('');
      setSpecificTopic('');
      setRequestReason('');
      setPreferredDeadline('');

    } catch (error) {
      console.error('Error submitting homework request:', error);
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Xatolik' :
        culturalPreferences?.language === 'russian' ? 'Ошибка' : 'Error',
        culturalPreferences?.language === 'uzbek' ? 
          'So\'rovni yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.' :
        culturalPreferences?.language === 'russian' ?
          'Произошла ошибка при отправке запроса. Пожалуйста, попробуйте еще раз.' :
          'There was an error submitting your request. Please try again.'
      );
    }
  }, [
    selectedHomeworkType,
    selectedDifficulty,
    selectedSubject,
    specificTopic,
    requestReason,
    preferredDeadline,
    student?.id,
    ageGroup,
    culturalPreferences,
    submitHomeworkRequest,
    submitButtonScale,
    navigation,
    homeworkTypes,
    difficultyLevels,
    subjectAreas,
    isElementary
  ]);

  const submitButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitButtonScale.value }],
  }));

  const renderHomeworkType = useCallback((homeworkType: HomeworkType, index: number) => (
    <Animated.View
      key={homeworkType.id}
      entering={FadeInRight.delay(index * 100)}
    >
      <TouchableOpacity
        style={[
          styles.homeworkTypeCard,
          {
            borderColor: selectedHomeworkType === homeworkType.id ? homeworkType.color : '#e2e8f0',
            backgroundColor: selectedHomeworkType === homeworkType.id ? `${homeworkType.color}10` : '#ffffff',
            minHeight: isElementary ? 100 : 80,
          }
        ]}
        onPress={() => setSelectedHomeworkType(homeworkType.id)}
        activeOpacity={0.7}
      >
        <View style={styles.homeworkTypeHeader}>
          <View style={[
            styles.homeworkTypeIcon,
            { 
              backgroundColor: homeworkType.color,
              width: isElementary ? 48 : 40,
              height: isElementary ? 48 : 40,
            }
          ]}>
            <Ionicons 
              name={homeworkType.icon} 
              size={isElementary ? 24 : 20} 
              color="#ffffff" 
            />
          </View>
          
          <View style={styles.homeworkTypeText}>
            <Text style={[
              styles.homeworkTypeTitle,
              {
                fontSize: isElementary ? 18 : 16,
                fontWeight: isElementary ? '600' : '500',
                color: selectedHomeworkType === homeworkType.id ? homeworkType.color : '#1e293b',
              }
            ]}>
              {homeworkType.title}
            </Text>
            <Text style={[
              styles.homeworkTypeSubtitle,
              { fontSize: isElementary ? 14 : 12 }
            ]}>
              {homeworkType.subtitle}
            </Text>
            <Text style={[
              styles.homeworkTypeTime,
              { 
                fontSize: isElementary ? 12 : 10,
                color: homeworkType.color,
              }
            ]}>
              ~{homeworkType.estimatedTime} {culturalPreferences?.language === 'uzbek' ? 'daqiqa' :
                                            culturalPreferences?.language === 'russian' ? 'минут' : 'minutes'}
            </Text>
          </View>
          
          {selectedHomeworkType === homeworkType.id && (
            <View style={[styles.selectedIndicator, { backgroundColor: homeworkType.color }]}>
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  ), [selectedHomeworkType, isElementary, culturalPreferences]);

  const renderDifficultyLevel = useCallback((difficulty: DifficultyLevel, index: number) => (
    <Animated.View
      key={difficulty.id}
      entering={FadeInDown.delay(index * 100)}
    >
      <TouchableOpacity
        style={[
          styles.difficultyButton,
          {
            backgroundColor: selectedDifficulty === difficulty.id ? difficulty.color : '#ffffff',
            borderColor: selectedDifficulty === difficulty.id ? difficulty.color : '#e2e8f0',
            width: isElementary ? 100 : 90,
            height: isElementary ? 80 : 70,
          }
        ]}
        onPress={() => setSelectedDifficulty(difficulty.id)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.difficultyEmoji,
          { fontSize: isElementary ? 28 : 24 }
        ]}>
          {difficulty.icon}
        </Text>
        <Text style={[
          styles.difficultyTitle,
          {
            fontSize: isElementary ? 16 : 14,
            color: selectedDifficulty === difficulty.id ? '#ffffff' : '#1e293b',
            fontWeight: selectedDifficulty === difficulty.id ? '600' : '500',
          }
        ]}>
          {difficulty.title}
        </Text>
        <Text style={[
          styles.difficultySubtitle,
          {
            fontSize: isElementary ? 11 : 9,
            color: selectedDifficulty === difficulty.id ? '#ffffff' : '#64748b',
          }
        ]}>
          {difficulty.subtitle}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  ), [selectedDifficulty, isElementary]);

  const renderSubjectArea = useCallback((subject: SubjectArea, index: number) => (
    <Animated.View
      key={subject.id}
      entering={FadeInRight.delay(index * 100)}
    >
      <TouchableOpacity
        style={[
          styles.subjectCard,
          {
            borderColor: selectedSubject === subject.id ? subject.color : '#e2e8f0',
            backgroundColor: selectedSubject === subject.id ? `${subject.color}10` : '#ffffff',
            minHeight: isElementary ? 120 : 100,
          }
        ]}
        onPress={() => setSelectedSubject(subject.id)}
        activeOpacity={0.7}
      >
        <View style={styles.subjectHeader}>
          <Text style={[
            styles.subjectTitle,
            {
              fontSize: isElementary ? 16 : 14,
              fontWeight: isElementary ? '600' : '500',
              color: selectedSubject === subject.id ? subject.color : '#1e293b',
            }
          ]}>
            {subject.title}
          </Text>
          
          {selectedSubject === subject.id && (
            <View style={[styles.selectedIndicator, { backgroundColor: subject.color }]}>
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            </View>
          )}
        </View>
        
        <View style={styles.topicsContainer}>
          {subject.topics.slice(0, isElementary ? 2 : 3).map((topic, topicIndex) => (
            <View key={topicIndex} style={[styles.topicBadge, { backgroundColor: `${subject.color}20` }]}>
              <Text style={[
                styles.topicText,
                { 
                  fontSize: isElementary ? 11 : 9,
                  color: subject.color,
                }
              ]}>
                {topic}
              </Text>
            </View>
          ))}
          {subject.topics.length > (isElementary ? 2 : 3) && (
            <Text style={[
              styles.moreTopics,
              { 
                fontSize: isElementary ? 11 : 9,
                color: subject.color,
              }
            ]}>
              +{subject.topics.length - (isElementary ? 2 : 3)} {culturalPreferences?.language === 'uzbek' ? 'ko\'proq' :
                                                                  culturalPreferences?.language === 'russian' ? 'еще' : 'more'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  ), [selectedSubject, isElementary, culturalPreferences]);

  const renderDeadlineOption = useCallback((deadline: any, index: number) => (
    <Animated.View
      key={deadline.id}
      entering={FadeInDown.delay(index * 50)}
    >
      <TouchableOpacity
        style={[
          styles.deadlineButton,
          {
            backgroundColor: preferredDeadline === deadline.id ? '#1d7452' : '#ffffff',
            borderColor: preferredDeadline === deadline.id ? '#1d7452' : '#e2e8f0',
            minWidth: isElementary ? 80 : 70,
            height: isElementary ? 45 : 40,
          }
        ]}
        onPress={() => setPreferredDeadline(deadline.id)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.deadlineText,
          {
            fontSize: isElementary ? 14 : 12,
            color: preferredDeadline === deadline.id ? '#ffffff' : '#1e293b',
            fontWeight: preferredDeadline === deadline.id ? '600' : '500',
          }
        ]}>
          {deadline.title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  ), [preferredDeadline, isElementary]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
              fontSize: isElementary ? 22 : 18,
              fontWeight: isElementary ? '700' : '600',
            }
          ]}>
            {culturalPreferences?.language === 'uzbek' ? 'Qo\'shimcha vazifa' :
             culturalPreferences?.language === 'russian' ? 'Дополнительное задание' : 'Extra Homework'}
          </Text>
          
          <View style={styles.headerSpacer} />
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
                fontSize: isElementary ? 20 : 18,
                fontWeight: isElementary ? '600' : '500',
              }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 
                'Ko\'proq mashq qiling!' :
               culturalPreferences?.language === 'russian' ?
                'Больше практики!' :
                'Practice More!'}
            </Text>
            <Text style={[
              styles.introText,
              { fontSize: isElementary ? 16 : 14 }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 
                'Bilimlaringizni mustahkamlash uchun qo\'shimcha uy vazifasi so\'rang.' :
               culturalPreferences?.language === 'russian' ?
                'Запросите дополнительное домашнее задание для закрепления знаний.' :
                'Request extra homework to reinforce your learning.'}
            </Text>
          </Animated.View>

          {/* Homework Type Selection */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.section}
          >
            <Text style={[
              styles.sectionTitle,
              {
                fontSize: isElementary ? 18 : 16,
                fontWeight: isElementary ? '600' : '500',
              }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 'Vazifa turini tanlang' :
               culturalPreferences?.language === 'russian' ? 'Выберите тип задания' : 'Select Homework Type'}
            </Text>
            
            <View style={styles.homeworkTypesContainer}>
              {homeworkTypes.map(renderHomeworkType)}
            </View>
          </Animated.View>

          {/* Difficulty Level */}
          {selectedHomeworkType && (
            <Animated.View
              entering={FadeInDown.delay(300)}
              style={styles.section}
            >
              <Text style={[
                styles.sectionTitle,
                {
                  fontSize: isElementary ? 18 : 16,
                  fontWeight: isElementary ? '600' : '500',
                }
              ]}>
                {culturalPreferences?.language === 'uzbek' ? 'Qiyinlik darajasi' :
                 culturalPreferences?.language === 'russian' ? 'Уровень сложности' : 'Difficulty Level'}
              </Text>
              
              <View style={styles.difficultyContainer}>
                {difficultyLevels.map(renderDifficultyLevel)}
              </View>
            </Animated.View>
          )}

          {/* Subject Area */}
          {selectedHomeworkType && selectedDifficulty && (
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
                {culturalPreferences?.language === 'uzbek' ? 'Mavzu sohasi' :
                 culturalPreferences?.language === 'russian' ? 'Предметная область' : 'Subject Area'}
              </Text>
              
              <View style={styles.subjectsContainer}>
                {subjectAreas.map(renderSubjectArea)}
              </View>
            </Animated.View>
          )}

          {/* Specific Topic */}
          {selectedHomeworkType && selectedDifficulty && selectedSubject && (
            <Animated.View
              entering={FadeInDown.delay(500)}
              style={styles.section}
            >
              <Text style={[
                styles.sectionTitle,
                {
                  fontSize: isElementary ? 18 : 16,
                  fontWeight: isElementary ? '600' : '500',
                }
              ]}>
                {culturalPreferences?.language === 'uzbek' ? 'Aniq mavzu (ixtiyoriy)' :
                 culturalPreferences?.language === 'russian' ? 'Конкретная тема (опционально)' : 'Specific Topic (Optional)'}
              </Text>
              
              <TextInput
                style={[
                  styles.topicInput,
                  { fontSize: isElementary ? 16 : 14 }
                ]}
                placeholder={
                  culturalPreferences?.language === 'uzbek' ? 
                    'Masalan: Past Simple, Present Continuous...' :
                  culturalPreferences?.language === 'russian' ?
                    'Например: Past Simple, Present Continuous...' :
                    'e.g., Past Simple, Present Continuous...'
                }
                placeholderTextColor="#94a3b8"
                value={specificTopic}
                onChangeText={setSpecificTopic}
                maxLength={100}
              />
            </Animated.View>
          )}

          {/* Preferred Deadline */}
          {selectedHomeworkType && selectedDifficulty && selectedSubject && (
            <Animated.View
              entering={FadeInDown.delay(600)}
              style={styles.section}
            >
              <Text style={[
                styles.sectionTitle,
                {
                  fontSize: isElementary ? 18 : 16,
                  fontWeight: isElementary ? '600' : '500',
                }
              ]}>
                {culturalPreferences?.language === 'uzbek' ? 'Muddat (ixtiyoriy)' :
                 culturalPreferences?.language === 'russian' ? 'Срок выполнения (опционально)' : 'Preferred Deadline (Optional)'}
              </Text>
              
              <View style={styles.deadlineContainer}>
                {deadlineOptions.map(renderDeadlineOption)}
              </View>
            </Animated.View>
          )}

          {/* Request Reason */}
          {selectedHomeworkType && selectedDifficulty && selectedSubject && (
            <Animated.View
              entering={FadeInDown.delay(700)}
              style={styles.section}
            >
              <Text style={[
                styles.sectionTitle,
                {
                  fontSize: isElementary ? 18 : 16,
                  fontWeight: isElementary ? '600' : '500',
                }
              ]}>
                {culturalPreferences?.language === 'uzbek' ? 'Sabab yozing' :
                 culturalPreferences?.language === 'russian' ? 'Укажите причину' : 'Reason for Request'}
              </Text>
              
              <TextInput
                style={[
                  styles.reasonInput,
                  {
                    fontSize: isElementary ? 16 : 14,
                    minHeight: isElementary ? 100 : 80,
                  }
                ]}
                multiline
                numberOfLines={isElementary ? 4 : 3}
                placeholder={
                  culturalPreferences?.language === 'uzbek' ? 
                    'Nima uchun qo\'shimcha vazifa kerakligi haqida yozing...' :
                  culturalPreferences?.language === 'russian' ?
                    'Напишите, почему нужно дополнительное задание...' :
                    'Explain why you need this extra homework...'
                }
                placeholderTextColor="#94a3b8"
                value={requestReason}
                onChangeText={setRequestReason}
                maxLength={isElementary ? 300 : 500}
                textAlignVertical="top"
              />
              
              <Text style={[
                styles.characterCount,
                { fontSize: isElementary ? 12 : 10 }
              ]}>
                {requestReason.length}/{isElementary ? 300 : 500}
              </Text>
            </Animated.View>
          )}

          {/* Submit Button */}
          {selectedHomeworkType && selectedDifficulty && selectedSubject && requestReason.trim() && (
            <Animated.View
              entering={FadeInDown.delay(800)}
              style={styles.section}
            >
              <Animated.View style={submitButtonAnimatedStyle}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    {
                      height: isElementary ? 56 : 48,
                      opacity: isSubmitting ? 0.7 : 1,
                    }
                  ]}
                  onPress={handleSubmitRequest}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.submitButtonText,
                    { fontSize: isElementary ? 18 : 16 }
                  ]}>
                    {isSubmitting ? (
                      culturalPreferences?.language === 'uzbek' ? 'Yuborilmoqda...' :
                      culturalPreferences?.language === 'russian' ? 'Отправляется...' : 'Sending...'
                    ) : (
                      culturalPreferences?.language === 'uzbek' ? 'So\'rov yuborish' :
                      culturalPreferences?.language === 'russian' ? 'Отправить запрос' : 'Submit Request'
                    )}
                  </Text>
                  
                  <Ionicons 
                    name="send" 
                    size={isElementary ? 20 : 16} 
                    color="#ffffff" 
                    style={styles.submitIcon}
                  />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#1e293b',
    marginBottom: 16,
  },
  homeworkTypesContainer: {
    gap: 12,
  },
  homeworkTypeCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
  },
  homeworkTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeworkTypeIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginRight: 12,
  },
  homeworkTypeText: {
    flex: 1,
  },
  homeworkTypeTitle: {
    marginBottom: 4,
  },
  homeworkTypeSubtitle: {
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 4,
  },
  homeworkTypeTime: {
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  difficultyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    padding: 12,
  },
  difficultyEmoji: {
    marginBottom: 4,
  },
  difficultyTitle: {
    textAlign: 'center',
    marginBottom: 2,
  },
  difficultySubtitle: {
    textAlign: 'center',
    lineHeight: 12,
  },
  subjectsContainer: {
    gap: 12,
  },
  subjectCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subjectTitle: {
    flex: 1,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  topicText: {
    fontWeight: '500',
  },
  moreTopics: {
    fontWeight: '500',
    fontStyle: 'italic',
  },
  topicInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#1e293b',
  },
  deadlineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deadlineButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
  },
  deadlineText: {
    textAlign: 'center',
  },
  reasonInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#1e293b',
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    color: '#94a3b8',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#1d7452',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  submitIcon: {
    marginLeft: 8,
  },
});