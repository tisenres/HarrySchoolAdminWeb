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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStudentStore } from '../../store/studentStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useRequestStore } from '../../store/requestStore';

interface LessonType {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  duration: number;
  ageAppropriate: boolean;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  popular?: boolean;
}

interface PreferredTeacher {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  avatar?: string;
}

export default function ExtraLessonRequestScreen() {
  const navigation = useNavigation();
  const { student } = useStudentStore();
  const { culturalPreferences } = useSettingsStore();
  const { submitLessonRequest, isSubmitting } = useRequestStore();

  const [selectedLessonType, setSelectedLessonType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [requestReason, setRequestReason] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [urgentRequest, setUrgentRequest] = useState<boolean>(false);

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

  // Lesson types with age-appropriate options
  const lessonTypes: LessonType[] = useMemo(() => [
    {
      id: 'speaking',
      title: culturalPreferences?.language === 'uzbek' ? 'Gapirish' :
             culturalPreferences?.language === 'russian' ? 'Разговор' : 'Speaking',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Gaplashish ko\'nikmalarini yaxshilash' :
                culturalPreferences?.language === 'russian' ? 'Улучшение навыков разговора' :
                'Improve conversation skills',
      icon: 'chatbubbles-outline',
      color: '#3b82f6',
      duration: isElementary ? 30 : 45,
      ageAppropriate: true,
    },
    {
      id: 'grammar',
      title: culturalPreferences?.language === 'uzbek' ? 'Grammatika' :
             culturalPreferences?.language === 'russian' ? 'Грамматика' : 'Grammar',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Grammatika qoidalarini o\'rganish' :
                culturalPreferences?.language === 'russian' ? 'Изучение грамматических правил' :
                'Learn grammar rules and structure',
      icon: 'library-outline',
      color: '#10b981',
      duration: isElementary ? 30 : 60,
      ageAppropriate: !isElementary,
    },
    {
      id: 'pronunciation',
      title: culturalPreferences?.language === 'uzbek' ? 'Talaffuz' :
             culturalPreferences?.language === 'russian' ? 'Произношение' : 'Pronunciation',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'To\'g\'ri talaffuz o\'rganish' :
                culturalPreferences?.language === 'russian' ? 'Изучение правильного произношения' :
                'Master correct pronunciation',
      icon: 'mic-outline',
      color: '#f59e0b',
      duration: isElementary ? 25 : 45,
      ageAppropriate: true,
    },
    {
      id: 'homework_help',
      title: culturalPreferences?.language === 'uzbek' ? 'Uy vazifasi yordami' :
             culturalPreferences?.language === 'russian' ? 'Помощь с домашним заданием' : 'Homework Help',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Uy vazifalarida yordam olish' :
                culturalPreferences?.language === 'russian' ? 'Получение помощи с домашними заданиями' :
                'Get help with assignments',
      icon: 'school-outline',
      color: '#8b5cf6',
      duration: isElementary ? 30 : 45,
      ageAppropriate: true,
    },
    {
      id: 'exam_prep',
      title: culturalPreferences?.language === 'uzbek' ? 'Imtihon tayyorligi' :
             culturalPreferences?.language === 'russian' ? 'Подготовка к экзамену' : 'Exam Preparation',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Imtihonlarga tayyorlanish' :
                culturalPreferences?.language === 'russian' ? 'Подготовка к экзаменам' :
                'Prepare for upcoming exams',
      icon: 'document-text-outline',
      color: '#ef4444',
      duration: isMiddleSchool ? 45 : 60,
      ageAppropriate: !isElementary,
    },
    {
      id: 'conversation',
      title: culturalPreferences?.language === 'uzbek' ? 'Suhbat klubi' :
             culturalPreferences?.language === 'russian' ? 'Разговорный клуб' : 'Conversation Club',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Boshqa o\'quvchilar bilan suhbatlashish' :
                culturalPreferences?.language === 'russian' ? 'Разговор с другими учениками' :
                'Practice with other students',
      icon: 'people-outline',
      color: '#06b6d4',
      duration: isElementary ? 30 : 45,
      ageAppropriate: true,
    },
  ].filter(type => type.ageAppropriate), [culturalPreferences, isElementary, isMiddleSchool]);

  // Available time slots
  const timeSlots: TimeSlot[] = useMemo(() => [
    { id: '09:00', time: '09:00', available: true },
    { id: '10:00', time: '10:00', available: true, popular: true },
    { id: '11:00', time: '11:00', available: true },
    { id: '14:00', time: '14:00', available: true, popular: true },
    { id: '15:00', time: '15:00', available: true },
    { id: '16:00', time: '16:00', available: true, popular: true },
    { id: '17:00', time: '17:00', available: true },
    { id: '18:00', time: '18:00', available: isHighSchool },
    { id: '19:00', time: '19:00', available: isHighSchool },
  ].filter(slot => slot.available), [isHighSchool]);

  // Preferred teachers (mock data)
  const preferredTeachers: PreferredTeacher[] = useMemo(() => [
    {
      id: 'any',
      name: culturalPreferences?.language === 'uzbek' ? 'Istalgan o\'qituvchi' :
           culturalPreferences?.language === 'russian' ? 'Любой учитель' : 'Any Teacher',
      specialization: culturalPreferences?.language === 'uzbek' ? 'Tizim tanlaydi' :
                      culturalPreferences?.language === 'russian' ? 'Система выберет' : 'System will choose',
      rating: 5.0,
    },
    {
      id: 'sarah',
      name: 'Sarah Johnson',
      specialization: culturalPreferences?.language === 'uzbek' ? 'Gapirish mutaxassisi' :
                      culturalPreferences?.language === 'russian' ? 'Специалист по разговору' : 'Speaking Specialist',
      rating: 4.9,
    },
    {
      id: 'michael',
      name: 'Michael Brown',
      specialization: culturalPreferences?.language === 'uzbek' ? 'Grammatika mutaxassisi' :
                      culturalPreferences?.language === 'russian' ? 'Специалист по грамматике' : 'Grammar Expert',
      rating: 4.8,
    },
    {
      id: 'emma',
      name: 'Emma Wilson',
      specialization: culturalPreferences?.language === 'uzbek' ? 'Bolalar mutaxassisi' :
                      culturalPreferences?.language === 'russian' ? 'Специалист по детям' : 'Kids Specialist',
      rating: 5.0,
    },
  ], [culturalPreferences]);

  // Handle date selection
  const handleDateChange = useCallback((event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      // Validate date is not in the past and within 2 weeks
      const today = new Date();
      const maxDate = new Date();
      maxDate.setDate(today.getDate() + 14);
      
      if (date < today) {
        Alert.alert(
          culturalPreferences?.language === 'uzbek' ? 'Xato sana' :
          culturalPreferences?.language === 'russian' ? 'Неверная дата' : 'Invalid Date',
          culturalPreferences?.language === 'uzbek' ? 
            'O\'tmishdagi sanani tanlay olmaysiz.' :
          culturalPreferences?.language === 'russian' ?
            'Нельзя выбрать дату из прошлого.' :
            'Cannot select a date in the past.'
        );
        return;
      }
      
      if (date > maxDate) {
        Alert.alert(
          culturalPreferences?.language === 'uzbek' ? 'Juda uzoq sana' :
          culturalPreferences?.language === 'russian' ? 'Слишком далекая дата' : 'Date Too Far',
          culturalPreferences?.language === 'uzbek' ? 
            'Faqat keyingi 2 hafta ichida dars so\'rashingiz mumkin.' :
          culturalPreferences?.language === 'russian' ?
            'Можно запросить урок только в течение следующих 2 недель.' :
            'You can only request lessons within the next 2 weeks.'
        );
        return;
      }
      
      setSelectedDate(date);
    }
  }, [culturalPreferences]);

  // Handle lesson request submission
  const handleSubmitRequest = useCallback(async () => {
    // Validation
    if (!selectedLessonType) {
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Dars turini tanlang' :
        culturalPreferences?.language === 'russian' ? 'Выберите тип урока' : 'Select Lesson Type',
        culturalPreferences?.language === 'uzbek' ? 'Iltimos, dars turini tanlang.' :
        culturalPreferences?.language === 'russian' ? 'Пожалуйста, выберите тип урока.' :
        'Please select a lesson type.'
      );
      return;
    }

    if (!selectedTimeSlot) {
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Vaqt tanlang' :
        culturalPreferences?.language === 'russian' ? 'Выберите время' : 'Select Time',
        culturalPreferences?.language === 'uzbek' ? 'Iltimos, dars vaqtini tanlang.' :
        culturalPreferences?.language === 'russian' ? 'Пожалуйста, выберите время урока.' :
        'Please select a lesson time.'
      );
      return;
    }

    if (!requestReason.trim()) {
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Sabab yozing' :
        culturalPreferences?.language === 'russian' ? 'Укажите причину' : 'Provide Reason',
        culturalPreferences?.language === 'uzbek' ? 'Iltimos, qo\'shimcha dars so\'rash sababini yozing.' :
        culturalPreferences?.language === 'russian' ? 'Пожалуйста, укажите причину запроса дополнительного урока.' :
        'Please provide a reason for the extra lesson request.'
      );
      return;
    }

    // Animate submit button
    submitButtonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );

    try {
      const lessonType = lessonTypes.find(type => type.id === selectedLessonType);
      
      await submitLessonRequest({
        studentId: student?.id || '',
        lessonType: selectedLessonType,
        lessonTitle: lessonType?.title || '',
        requestedDate: selectedDate.toISOString(),
        requestedTime: selectedTimeSlot,
        preferredTeacher: selectedTeacher || 'any',
        duration: lessonType?.duration || 30,
        reason: requestReason.trim(),
        urgent: urgentRequest,
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
            'Qo\'shimcha dars so\'rovingiz muvaffaqiyatli yuborildi! O\'qituvchi tez orada siz bilan bog\'lanadi.' :
          culturalPreferences?.language === 'russian' ?
            'Ваш запрос на дополнительный урок успешно отправлен! Учитель скоро свяжется с вами.' :
            'Your extra lesson request has been sent successfully! A teacher will contact you soon.'
        ) : (
          culturalPreferences?.language === 'uzbek' ? 
            'Qo\'shimcha dars so\'rovingiz muvaffaqiyatli yuborildi. So\'rov holati haqida 24 soat ichida xabar beramiz.' :
          culturalPreferences?.language === 'russian' ?
            'Ваш запрос на дополнительный урок успешно отправлен. Мы уведомим вас о статусе запроса в течение 24 часов.' :
            'Your extra lesson request has been submitted successfully. We will notify you about the request status within 24 hours.'
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
      setSelectedLessonType('');
      setSelectedTimeSlot('');
      setSelectedTeacher('');
      setRequestReason('');
      setUrgentRequest(false);
      setSelectedDate(new Date());

    } catch (error) {
      console.error('Error submitting lesson request:', error);
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
    selectedLessonType,
    selectedTimeSlot,
    selectedTeacher,
    requestReason,
    urgentRequest,
    selectedDate,
    student?.id,
    ageGroup,
    culturalPreferences,
    submitLessonRequest,
    submitButtonScale,
    navigation,
    lessonTypes,
    isElementary
  ]);

  const submitButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitButtonScale.value }],
  }));

  const renderLessonType = useCallback((lessonType: LessonType, index: number) => (
    <Animated.View
      key={lessonType.id}
      entering={FadeInRight.delay(index * 100)}
    >
      <TouchableOpacity
        style={[
          styles.lessonTypeCard,
          {
            borderColor: selectedLessonType === lessonType.id ? lessonType.color : '#e2e8f0',
            backgroundColor: selectedLessonType === lessonType.id ? `${lessonType.color}10` : '#ffffff',
            minHeight: isElementary ? 100 : 80,
          }
        ]}
        onPress={() => setSelectedLessonType(lessonType.id)}
        activeOpacity={0.7}
      >
        <View style={styles.lessonTypeHeader}>
          <View style={[
            styles.lessonTypeIcon,
            { 
              backgroundColor: lessonType.color,
              width: isElementary ? 48 : 40,
              height: isElementary ? 48 : 40,
            }
          ]}>
            <Ionicons 
              name={lessonType.icon} 
              size={isElementary ? 24 : 20} 
              color="#ffffff" 
            />
          </View>
          
          <View style={styles.lessonTypeText}>
            <Text style={[
              styles.lessonTypeTitle,
              {
                fontSize: isElementary ? 18 : 16,
                fontWeight: isElementary ? '600' : '500',
                color: selectedLessonType === lessonType.id ? lessonType.color : '#1e293b',
              }
            ]}>
              {lessonType.title}
            </Text>
            <Text style={[
              styles.lessonTypeSubtitle,
              { fontSize: isElementary ? 14 : 12 }
            ]}>
              {lessonType.subtitle}
            </Text>
            <Text style={[
              styles.lessonTypeDuration,
              { 
                fontSize: isElementary ? 12 : 10,
                color: lessonType.color,
              }
            ]}>
              {lessonType.duration} {culturalPreferences?.language === 'uzbek' ? 'daqiqa' :
                                     culturalPreferences?.language === 'russian' ? 'минут' : 'minutes'}
            </Text>
          </View>
          
          {selectedLessonType === lessonType.id && (
            <View style={[styles.selectedIndicator, { backgroundColor: lessonType.color }]}>
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  ), [selectedLessonType, isElementary, culturalPreferences]);

  const renderTimeSlot = useCallback((timeSlot: TimeSlot, index: number) => (
    <Animated.View
      key={timeSlot.id}
      entering={FadeInDown.delay(index * 50)}
    >
      <TouchableOpacity
        style={[
          styles.timeSlotButton,
          {
            backgroundColor: selectedTimeSlot === timeSlot.id ? '#1d7452' : '#ffffff',
            borderColor: selectedTimeSlot === timeSlot.id ? '#1d7452' : 
                         timeSlot.popular ? '#f59e0b' : '#e2e8f0',
            width: isElementary ? 80 : 70,
            height: isElementary ? 50 : 45,
          }
        ]}
        onPress={() => setSelectedTimeSlot(timeSlot.id)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.timeSlotText,
          {
            fontSize: isElementary ? 16 : 14,
            color: selectedTimeSlot === timeSlot.id ? '#ffffff' : '#1e293b',
            fontWeight: selectedTimeSlot === timeSlot.id ? '600' : '500',
          }
        ]}>
          {timeSlot.time}
        </Text>
        {timeSlot.popular && selectedTimeSlot !== timeSlot.id && (
          <View style={styles.popularBadge}>
            <Text style={[
              styles.popularText,
              { fontSize: isElementary ? 10 : 8 }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 'Mashhur' :
               culturalPreferences?.language === 'russian' ? 'Популярно' : 'Popular'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  ), [selectedTimeSlot, isElementary, culturalPreferences]);

  const renderTeacher = useCallback((teacher: PreferredTeacher, index: number) => (
    <Animated.View
      key={teacher.id}
      entering={FadeInRight.delay(index * 100)}
    >
      <TouchableOpacity
        style={[
          styles.teacherCard,
          {
            borderColor: selectedTeacher === teacher.id ? '#1d7452' : '#e2e8f0',
            backgroundColor: selectedTeacher === teacher.id ? '#f0f9ff' : '#ffffff',
            minHeight: isElementary ? 80 : 70,
          }
        ]}
        onPress={() => setSelectedTeacher(teacher.id)}
        activeOpacity={0.7}
      >
        <View style={styles.teacherContent}>
          <View style={[
            styles.teacherAvatar,
            { 
              width: isElementary ? 48 : 40,
              height: isElementary ? 48 : 40,
            }
          ]}>
            <Text style={[
              styles.teacherInitial,
              { fontSize: isElementary ? 20 : 16 }
            ]}>
              {teacher.name.charAt(0)}
            </Text>
          </View>
          
          <View style={styles.teacherInfo}>
            <Text style={[
              styles.teacherName,
              {
                fontSize: isElementary ? 16 : 14,
                fontWeight: isElementary ? '600' : '500',
              }
            ]}>
              {teacher.name}
            </Text>
            <Text style={[
              styles.teacherSpecialization,
              { fontSize: isElementary ? 13 : 11 }
            ]}>
              {teacher.specialization}
            </Text>
            <View style={styles.teacherRating}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={[
                styles.ratingText,
                { fontSize: isElementary ? 12 : 10 }
              ]}>
                {teacher.rating}
              </Text>
            </View>
          </View>
          
          {selectedTeacher === teacher.id && (
            <View style={styles.selectedTeacherIndicator}>
              <Ionicons name="checkmark" size={16} color="#1d7452" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  ), [selectedTeacher, isElementary]);

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
            {culturalPreferences?.language === 'uzbek' ? 'Qo\'shimcha dars' :
             culturalPreferences?.language === 'russian' ? 'Дополнительный урок' : 'Extra Lesson'}
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
                'Qo\'shimcha dars so\'rang!' :
               culturalPreferences?.language === 'russian' ?
                'Запросите дополнительный урок!' :
                'Request an Extra Lesson!'}
            </Text>
            <Text style={[
              styles.introText,
              { fontSize: isElementary ? 16 : 14 }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 
                'Qiyin mavzularni tushunish yoki ko\'nikmalaringizni yaxshilash uchun qo\'shimcha dars so\'rang.' :
               culturalPreferences?.language === 'russian' ?
                'Запросите дополнительный урок, чтобы понять сложные темы или улучшить навыки.' :
                'Request extra lessons to understand difficult topics or improve your skills.'}
            </Text>
          </Animated.View>

          {/* Lesson Type Selection */}
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
              {culturalPreferences?.language === 'uzbek' ? 'Dars turini tanlang' :
               culturalPreferences?.language === 'russian' ? 'Выберите тип урока' : 'Select Lesson Type'}
            </Text>
            
            <View style={styles.lessonTypesContainer}>
              {lessonTypes.map(renderLessonType)}
            </View>
          </Animated.View>

          {/* Date and Time Selection */}
          {selectedLessonType && (
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
                {culturalPreferences?.language === 'uzbek' ? 'Sana va vaqt tanlang' :
                 culturalPreferences?.language === 'russian' ? 'Выберите дату и время' : 'Select Date & Time'}
              </Text>
              
              {/* Date Picker */}
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color="#1d7452" />
                <Text style={[
                  styles.dateButtonText,
                  { fontSize: isElementary ? 16 : 14 }
                ]}>
                  {selectedDate.toLocaleDateString(
                    culturalPreferences?.language === 'uzbek' ? 'uz-UZ' :
                    culturalPreferences?.language === 'russian' ? 'ru-RU' : 'en-US'
                  )}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  maximumDate={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)}
                  onChange={handleDateChange}
                />
              )}
              
              {/* Time Slots */}
              <Text style={[
                styles.subsectionTitle,
                {
                  fontSize: isElementary ? 16 : 14,
                  marginTop: 20,
                  marginBottom: 12,
                }
              ]}>
                {culturalPreferences?.language === 'uzbek' ? 'Vaqt tanlang' :
                 culturalPreferences?.language === 'russian' ? 'Выберите время' : 'Select Time'}
              </Text>
              
              <View style={styles.timeSlotsContainer}>
                {timeSlots.map(renderTimeSlot)}
              </View>
            </Animated.View>
          )}

          {/* Teacher Selection */}
          {selectedLessonType && selectedTimeSlot && (
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
                {culturalPreferences?.language === 'uzbek' ? 'O\'qituvchi tanlang (ixtiyoriy)' :
                 culturalPreferences?.language === 'russian' ? 'Выберите учителя (опционально)' : 'Select Teacher (Optional)'}
              </Text>
              
              <View style={styles.teachersContainer}>
                {preferredTeachers.map(renderTeacher)}
              </View>
            </Animated.View>
          )}

          {/* Request Reason */}
          {selectedLessonType && selectedTimeSlot && (
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
                    'Nima uchun qo\'shimcha dars kerakligi haqida yozing...' :
                  culturalPreferences?.language === 'russian' ?
                    'Напишите, почему нужен дополнительный урок...' :
                    'Explain why you need this extra lesson...'
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

          {/* Urgent Request Option */}
          {selectedLessonType && selectedTimeSlot && requestReason.trim() && (
            <Animated.View
              entering={FadeInDown.delay(600)}
              style={styles.section}
            >
              <TouchableOpacity
                style={styles.urgentOption}
                onPress={() => setUrgentRequest(!urgentRequest)}
                activeOpacity={0.7}
              >
                <View style={styles.urgentLeft}>
                  <View style={[
                    styles.urgentCheckbox,
                    {
                      backgroundColor: urgentRequest ? '#ef4444' : 'transparent',
                      borderColor: urgentRequest ? '#ef4444' : '#d1d5db',
                      width: isElementary ? 24 : 20,
                      height: isElementary ? 24 : 20,
                    }
                  ]}>
                    {urgentRequest && (
                      <Ionicons 
                        name="checkmark" 
                        size={isElementary ? 16 : 12} 
                        color="#ffffff" 
                      />
                    )}
                  </View>
                  
                  <View style={styles.urgentText}>
                    <Text style={[
                      styles.urgentTitle,
                      {
                        fontSize: isElementary ? 16 : 14,
                        fontWeight: isElementary ? '600' : '500',
                      }
                    ]}>
                      {culturalPreferences?.language === 'uzbek' ? 'Shoshilinch so\'rov' :
                       culturalPreferences?.language === 'russian' ? 'Срочный запрос' : 'Urgent Request'}
                    </Text>
                    <Text style={[
                      styles.urgentSubtitle,
                      { fontSize: isElementary ? 14 : 12 }
                    ]}>
                      {culturalPreferences?.language === 'uzbek' ? 
                        'Agar dars juda kerak bo\'lsa belgilang' :
                       culturalPreferences?.language === 'russian' ?
                        'Отметьте, если урок очень нужен' :
                        'Mark if lesson is urgently needed'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Submit Button */}
          {selectedLessonType && selectedTimeSlot && requestReason.trim() && (
            <Animated.View
              entering={FadeInDown.delay(700)}
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
  subsectionTitle: {
    color: '#475569',
    fontWeight: '500',
  },
  lessonTypesContainer: {
    gap: 12,
  },
  lessonTypeCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
  },
  lessonTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonTypeIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginRight: 12,
  },
  lessonTypeText: {
    flex: 1,
  },
  lessonTypeTitle: {
    marginBottom: 4,
  },
  lessonTypeSubtitle: {
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 4,
  },
  lessonTypeDuration: {
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  dateButtonText: {
    flex: 1,
    marginHorizontal: 12,
    color: '#1e293b',
    fontWeight: '500',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  timeSlotText: {
    fontWeight: '500',
  },
  popularBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  popularText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  teachersContainer: {
    gap: 12,
  },
  teacherCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
  },
  teacherContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: '#1d7452',
    marginRight: 12,
  },
  teacherInitial: {
    color: '#ffffff',
    fontWeight: '600',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    color: '#1e293b',
    marginBottom: 2,
  },
  teacherSpecialization: {
    color: '#64748b',
    marginBottom: 4,
  },
  teacherRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  selectedTeacherIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
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
  urgentOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  urgentCheckbox: {
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  urgentText: {
    flex: 1,
  },
  urgentTitle: {
    color: '#1e293b',
    marginBottom: 2,
  },
  urgentSubtitle: {
    color: '#64748b',
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