import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
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
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStudentStore } from '../../store/studentStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useFeedbackStore } from '../../store/feedbackStore';

interface FeedbackCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  examples: string[];
}

interface EmojiRating {
  value: number;
  emoji: string;
  label: string;
  color: string;
}

export default function FeedbackScreen() {
  const navigation = useNavigation();
  const { student } = useStudentStore();
  const { culturalPreferences } = useSettingsStore();
  const { submitFeedback, isSubmitting } = useFeedbackStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

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
  const submitButtonOpacity = useSharedValue(1);

  // Feedback categories with age-appropriate examples
  const feedbackCategories: FeedbackCategory[] = useMemo(() => [
    {
      id: 'lessons',
      title: culturalPreferences?.language === 'uzbek' ? 'Darslar' :
             culturalPreferences?.language === 'russian' ? 'Уроки' : 'Lessons',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Dars mazmuni va o\'qitish usuli haqida' :
                culturalPreferences?.language === 'russian' ? 'О содержании уроков и методах обучения' :
                'About lesson content and teaching methods',
      icon: 'book-outline',
      color: '#3b82f6',
      examples: isElementary ? [
        culturalPreferences?.language === 'uzbek' ? 'Darslar qiziq va tushunarli' :
        culturalPreferences?.language === 'russian' ? 'Уроки интересные и понятные' :
        'Lessons are fun and easy to understand',
        culturalPreferences?.language === 'uzbek' ? 'Ko\'proq o\'yinlar bo\'lsa yaxshi bo\'lardi' :
        culturalPreferences?.language === 'russian' ? 'Было бы хорошо больше игр' :
        'Would like more games and activities'
      ] : [
        culturalPreferences?.language === 'uzbek' ? 'Darslar hayotiy misollar bilan yaxshiroq' :
        culturalPreferences?.language === 'russian' ? 'Уроки лучше с реальными примерами' :
        'Lessons are better with real-life examples',
        culturalPreferences?.language === 'uzbek' ? 'Mustaqil ish vaqti ko\'paytirilsa' :
        culturalPreferences?.language === 'russian' ? 'Увеличить время самостоятельной работы' :
        'More time for independent work would help'
      ],
    },
    {
      id: 'app',
      title: culturalPreferences?.language === 'uzbek' ? 'Ilova' :
             culturalPreferences?.language === 'russian' ? 'Приложение' : 'App',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Ilovaning ishlashi va dizayni haqida' :
                culturalPreferences?.language === 'russian' ? 'О работе и дизайне приложения' :
                'About app functionality and design',
      icon: 'phone-portrait-outline',
      color: '#10b981',
      examples: isElementary ? [
        culturalPreferences?.language === 'uzbek' ? 'Tugmalar kattaroq bo\'lsa yaxshi' :
        culturalPreferences?.language === 'russian' ? 'Кнопки лучше сделать больше' :
        'Buttons could be bigger',
        culturalPreferences?.language === 'uzbek' ? 'Ranglar juda chiroyli' :
        culturalPreferences?.language === 'russian' ? 'Цвета очень красивые' :
        'The colors are very nice'
      ] : [
        culturalPreferences?.language === 'uzbek' ? 'Yuklanish tezligi yaxshilanishi kerak' :
        culturalPreferences?.language === 'russian' ? 'Нужно улучшить скорость загрузки' :
        'Loading speed needs improvement',
        culturalPreferences?.language === 'uzbek' ? 'Oflayn rejim juda foydali' :
        culturalPreferences?.language === 'russian' ? 'Офлайн режим очень полезен' :
        'Offline mode is very useful'
      ],
    },
    {
      id: 'teachers',
      title: culturalPreferences?.language === 'uzbek' ? 'O\'qituvchilar' :
             culturalPreferences?.language === 'russian' ? 'Учителя' : 'Teachers',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'O\'qituvchilarning o\'qitish uslubi haqida' :
                culturalPreferences?.language === 'russian' ? 'О методах преподавания учителей' :
                'About teaching methods and support',
      icon: 'people-outline',
      color: '#f59e0b',
      examples: isElementary ? [
        culturalPreferences?.language === 'uzbek' ? 'O\'qituvchim juda mehribon' :
        culturalPreferences?.language === 'russian' ? 'Мой учитель очень добрый' :
        'My teacher is very kind',
        culturalPreferences?.language === 'uzbek' ? 'Savollarimga javob beradi' :
        culturalPreferences?.language === 'russian' ? 'Отвечает на мои вопросы' :
        'Always answers my questions'
      ] : [
        culturalPreferences?.language === 'uzbek' ? 'Individual yondashuv juda yaxshi' :
        culturalPreferences?.language === 'russian' ? 'Индивидуальный подход очень хорош' :
        'Individual approach is very good',
        culturalPreferences?.language === 'uzbek' ? 'Ko\'proq amaliy mashqlar kerak' :
        culturalPreferences?.language === 'russian' ? 'Нужно больше практических упражнений' :
        'Need more practical exercises'
      ],
    },
    {
      id: 'homework',
      title: culturalPreferences?.language === 'uzbek' ? 'Uy vazifasi' :
             culturalPreferences?.language === 'russian' ? 'Домашние задания' : 'Homework',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Uy vazifalarining miqdori va qiyinligi haqida' :
                culturalPreferences?.language === 'russian' ? 'О количестве и сложности домашних заданий' :
                'About homework amount and difficulty',
      icon: 'document-text-outline',
      color: '#8b5cf6',
      examples: isElementary ? [
        culturalPreferences?.language === 'uzbek' ? 'Vazifalar juda qiziq' :
        culturalPreferences?.language === 'russian' ? 'Задания очень интересные' :
        'Assignments are very interesting',
        culturalPreferences?.language === 'uzbek' ? 'Ba\'zan qiyin bo\'ladi' :
        culturalPreferences?.language === 'russian' ? 'Иногда бывает трудно' :
        'Sometimes it gets difficult'
      ] : [
        culturalPreferences?.language === 'uzbek' ? 'Vaqt taqsimoti yaxshi' :
        culturalPreferences?.language === 'russian' ? 'Хорошее распределение времени' :
        'Good time distribution',
        culturalPreferences?.language === 'uzbek' ? 'Kreativ vazifalar ko\'proq bo\'lsa' :
        culturalPreferences?.language === 'russian' ? 'Больше творческих заданий' :
        'More creative assignments would be great'
      ],
    },
    {
      id: 'other',
      title: culturalPreferences?.language === 'uzbek' ? 'Boshqa' :
             culturalPreferences?.language === 'russian' ? 'Другое' : 'Other',
      subtitle: culturalPreferences?.language === 'uzbek' ? 'Boshqa takliflar va fikrlar' :
                culturalPreferences?.language === 'russian' ? 'Другие предложения и идеи' :
                'Other suggestions and ideas',
      icon: 'bulb-outline',
      color: '#ef4444',
      examples: isElementary ? [
        culturalPreferences?.language === 'uzbek' ? 'Yangi o\'yinlar qo\'shilsa' :
        culturalPreferences?.language === 'russian' ? 'Добавить новые игры' :
        'Add new games',
        culturalPreferences?.language === 'uzbek' ? 'Rasmlar ko\'proq bo\'lsa' :
        culturalPreferences?.language === 'russian' ? 'Больше картинок' :
        'More pictures would be nice'
      ] : [
        culturalPreferences?.language === 'uzbek' ? 'Jamoa ishlari uchun funksiya' :
        culturalPreferences?.language === 'russian' ? 'Функция для командной работы' :
        'Feature for team collaboration',
        culturalPreferences?.language === 'uzbek' ? 'Statistika bo\'limini yaxshilash' :
        culturalPreferences?.language === 'russian' ? 'Улучшить раздел статистики' :
        'Improve statistics section'
      ],
    },
  ], [culturalPreferences, isElementary]);

  // Emoji ratings with age-appropriate design
  const emojiRatings: EmojiRating[] = useMemo(() => [
    { 
      value: 1, 
      emoji: '😢', 
      label: culturalPreferences?.language === 'uzbek' ? 'Yomon' :
             culturalPreferences?.language === 'russian' ? 'Плохо' : 'Poor',
      color: '#ef4444' 
    },
    { 
      value: 2, 
      emoji: '😕', 
      label: culturalPreferences?.language === 'uzbek' ? 'Qoniqarsiz' :
             culturalPreferences?.language === 'russian' ? 'Неудовлетворительно' : 'Fair',
      color: '#f97316' 
    },
    { 
      value: 3, 
      emoji: '😐', 
      label: culturalPreferences?.language === 'uzbek' ? 'O\'rtacha' :
             culturalPreferences?.language === 'russian' ? 'Средне' : 'Average',
      color: '#eab308' 
    },
    { 
      value: 4, 
      emoji: '😊', 
      label: culturalPreferences?.language === 'uzbek' ? 'Yaxshi' :
             culturalPreferences?.language === 'russian' ? 'Хорошо' : 'Good',
      color: '#22c55e' 
    },
    { 
      value: 5, 
      emoji: '😍', 
      label: culturalPreferences?.language === 'uzbek' ? 'Zo\'r' :
             culturalPreferences?.language === 'russian' ? 'Отлично' : 'Excellent',
      color: '#10b981' 
    },
  ], [culturalPreferences]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  // Handle rating selection with animation
  const handleRatingSelect = useCallback((value: number) => {
    setRating(value);
    // Add haptic feedback for selection
    if (Platform.OS === 'ios') {
      // Haptic feedback would go here
    }
  }, []);

  // Handle feedback submission
  const handleSubmitFeedback = useCallback(async () => {
    if (!selectedCategory) {
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Kategoriya tanlang' :
        culturalPreferences?.language === 'russian' ? 'Выберите категорию' : 'Select Category',
        culturalPreferences?.language === 'uzbek' ? 'Iltimos, fikr-mulohaza kategoriyasini tanlang.' :
        culturalPreferences?.language === 'russian' ? 'Пожалуйста, выберите категорию отзыва.' :
        'Please select a feedback category.'
      );
      return;
    }

    if (rating === 0) {
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Baho bering' :
        culturalPreferences?.language === 'russian' ? 'Поставьте оценку' : 'Rate Experience',
        culturalPreferences?.language === 'uzbek' ? 'Iltimos, tajribangizni baholang.' :
        culturalPreferences?.language === 'russian' ? 'Пожалуйста, оцените свой опыт.' :
        'Please rate your experience.'
      );
      return;
    }

    if (!feedbackText.trim()) {
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Fikr yozing' :
        culturalPreferences?.language === 'russian' ? 'Напишите отзыв' : 'Write Feedback',
        culturalPreferences?.language === 'uzbek' ? 'Iltimos, fikr-mulohazangizni yozing.' :
        culturalPreferences?.language === 'russian' ? 'Пожалуйста, напишите свой отзыв.' :
        'Please write your feedback.'
      );
      return;
    }

    // Animate submit button
    submitButtonScale.value = withSpring(0.95, { duration: 100 }, () => {
      submitButtonScale.value = withSpring(1);
    });

    try {
      await submitFeedback({
        studentId: student?.id || '',
        category: selectedCategory,
        rating,
        feedback: feedbackText.trim(),
        isAnonymous,
        timestamp: new Date().toISOString(),
        ageGroup,
        culturalContext: {
          language: culturalPreferences?.language || 'english',
          showIslamicGreetings: culturalPreferences?.showIslamicGreetings || false,
        },
      });

      // Success feedback with age-appropriate messaging
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Rahmat!' :
        culturalPreferences?.language === 'russian' ? 'Спасибо!' : 'Thank You!',
        isElementary ? (
          culturalPreferences?.language === 'uzbek' ? 
            'Sizning fikringiz juda muhim! Biz uni o\'qib, yaxshilanishga harakat qilamiz.' :
          culturalPreferences?.language === 'russian' ?
            'Ваше мнение очень важно! Мы прочитаем его и будем стараться улучшаться.' :
            'Your opinion is very important! We will read it and work to improve.'
        ) : (
          culturalPreferences?.language === 'uzbek' ? 
            'Fikr-mulohazangiz uchun rahmat. Sizning takliflaringiz asosida ta\'lim sifatini yaxshilashga harakat qilamiz.' :
          culturalPreferences?.language === 'russian' ?
            'Спасибо за ваш отзыв. Мы будем работать над улучшением качества образования на основе ваших предложений.' :
            'Thank you for your feedback. We will work on improving education quality based on your suggestions.'
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
      setSelectedCategory('');
      setRating(0);
      setFeedbackText('');
      setIsAnonymous(false);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert(
        culturalPreferences?.language === 'uzbek' ? 'Xatolik' :
        culturalPreferences?.language === 'russian' ? 'Ошибка' : 'Error',
        culturalPreferences?.language === 'uzbek' ? 
          'Fikr-mulohaza yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.' :
        culturalPreferences?.language === 'russian' ?
          'Произошла ошибка при отправке отзыва. Пожалуйста, попробуйте еще раз.' :
          'There was an error submitting your feedback. Please try again.'
      );
    }
  }, [
    selectedCategory,
    rating,
    feedbackText,
    isAnonymous,
    student,
    ageGroup,
    culturalPreferences,
    submitFeedback,
    submitButtonScale,
    navigation
  ]);

  const submitButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitButtonScale.value }],
    opacity: submitButtonOpacity.value,
  }));

  const renderCategoryCard = useCallback((category: FeedbackCategory, index: number) => (
    <Animated.View
      key={category.id}
      entering={FadeInRight.delay(index * 100)}
    >
      <TouchableOpacity
        style={[
          styles.categoryCard,
          {
            borderColor: selectedCategory === category.id ? category.color : '#e2e8f0',
            backgroundColor: selectedCategory === category.id ? `${category.color}10` : '#ffffff',
            minHeight: isElementary ? 100 : 80,
          }
        ]}
        onPress={() => handleCategorySelect(category.id)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryHeader}>
          <View style={[
            styles.categoryIcon,
            { 
              backgroundColor: category.color,
              width: isElementary ? 48 : 40,
              height: isElementary ? 48 : 40,
            }
          ]}>
            <Ionicons 
              name={category.icon} 
              size={isElementary ? 24 : 20} 
              color="#ffffff" 
            />
          </View>
          
          <View style={styles.categoryText}>
            <Text style={[
              styles.categoryTitle,
              {
                fontSize: isElementary ? 18 : 16,
                fontWeight: isElementary ? '600' : '500',
                color: selectedCategory === category.id ? category.color : '#1e293b',
              }
            ]}>
              {category.title}
            </Text>
            <Text style={[
              styles.categorySubtitle,
              { fontSize: isElementary ? 14 : 12 }
            ]}>
              {category.subtitle}
            </Text>
          </View>
          
          {selectedCategory === category.id && (
            <View style={[styles.selectedIndicator, { backgroundColor: category.color }]}>
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            </View>
          )}
        </View>
        
        {/* Show examples for selected category */}
        {selectedCategory === category.id && (
          <View style={styles.examplesContainer}>
            <Text style={[
              styles.examplesTitle,
              { fontSize: isElementary ? 14 : 12 }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 'Misollar:' :
               culturalPreferences?.language === 'russian' ? 'Примеры:' : 'Examples:'}
            </Text>
            {category.examples.map((example, idx) => (
              <Text 
                key={idx} 
                style={[
                  styles.exampleText,
                  { fontSize: isElementary ? 13 : 11 }
                ]}
              >
                • {example}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  ), [selectedCategory, isElementary, culturalPreferences, handleCategorySelect]);

  const renderRatingEmoji = useCallback((rating: EmojiRating, index: number) => (
    <Animated.View
      key={rating.value}
      entering={FadeInDown.delay(index * 50)}
    >
      <TouchableOpacity
        style={[
          styles.ratingButton,
          {
            backgroundColor: rating.value === rating ? `${rating.color}20` : '#f8fafc',
            borderColor: rating.value === rating ? rating.color : '#e2e8f0',
            width: isElementary ? 70 : 60,
            height: isElementary ? 70 : 60,
          }
        ]}
        onPress={() => handleRatingSelect(rating.value)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.ratingEmoji,
          { fontSize: isElementary ? 28 : 24 }
        ]}>
          {rating.emoji}
        </Text>
        <Text style={[
          styles.ratingLabel,
          {
            fontSize: isElementary ? 12 : 10,
            color: rating.value === rating ? rating.color : '#64748b',
            fontWeight: rating.value === rating ? '600' : '400',
          }
        ]}>
          {rating.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  ), [rating, isElementary, handleRatingSelect]);

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
              fontSize: isElementary ? 24 : 20,
              fontWeight: isElementary ? '700' : '600',
            }
          ]}>
            {culturalPreferences?.language === 'uzbek' ? 'Fikr-mulohaza' :
             culturalPreferences?.language === 'russian' ? 'Отзыв' : 'Feedback'}
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
                'Sizning fikringiz muhim!' :
               culturalPreferences?.language === 'russian' ?
                'Ваше мнение важно!' :
                'Your Opinion Matters!'}
            </Text>
            <Text style={[
              styles.introText,
              { fontSize: isElementary ? 16 : 14 }
            ]}>
              {culturalPreferences?.language === 'uzbek' ? 
                'Harry School\'ni yaxshilashga yordam bering. Sizning fikr-mulohazangiz bizga ta\'lim sifatini oshirishda yordam beradi.' :
               culturalPreferences?.language === 'russian' ?
                'Помогите улучшить Harry School. Ваш отзыв поможет нам повысить качество образования.' :
                'Help us improve Harry School. Your feedback helps us enhance the learning experience for everyone.'}
            </Text>
          </Animated.View>

          {/* Category Selection */}
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
              {culturalPreferences?.language === 'uzbek' ? 'Kategoriya tanlang' :
               culturalPreferences?.language === 'russian' ? 'Выберите категорию' : 'Select Category'}
            </Text>
            
            <View style={styles.categoriesContainer}>
              {feedbackCategories.map(renderCategoryCard)}
            </View>
          </Animated.View>

          {/* Rating Selection */}
          {selectedCategory && (
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
                {culturalPreferences?.language === 'uzbek' ? 'Baholang' :
                 culturalPreferences?.language === 'russian' ? 'Оцените' : 'Rate Your Experience'}
              </Text>
              
              <View style={styles.ratingsContainer}>
                {emojiRatings.map(renderRatingEmoji)}
              </View>
            </Animated.View>
          )}

          {/* Feedback Text */}
          {selectedCategory && rating > 0 && (
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
                {culturalPreferences?.language === 'uzbek' ? 'Fikringizni yozing' :
                 culturalPreferences?.language === 'russian' ? 'Напишите свое мнение' : 'Share Your Thoughts'}
              </Text>
              
              <TextInput
                style={[
                  styles.feedbackInput,
                  {
                    fontSize: isElementary ? 16 : 14,
                    minHeight: isElementary ? 120 : 100,
                  }
                ]}
                multiline
                numberOfLines={isElementary ? 6 : 5}
                placeholder={
                  culturalPreferences?.language === 'uzbek' ? 
                    'Sizning fikr-mulohazangizni batafsil yozing...' :
                  culturalPreferences?.language === 'russian' ?
                    'Подробно напишите свой отзыв...' :
                    'Write your detailed feedback here...'
                }
                placeholderTextColor="#94a3b8"
                value={feedbackText}
                onChangeText={setFeedbackText}
                maxLength={isElementary ? 500 : 1000}
                textAlignVertical="top"
              />
              
              <Text style={[
                styles.characterCount,
                { fontSize: isElementary ? 12 : 10 }
              ]}>
                {feedbackText.length}/{isElementary ? 500 : 1000}
              </Text>
            </Animated.View>
          )}

          {/* Anonymous Option */}
          {selectedCategory && rating > 0 && (
            <Animated.View
              entering={FadeInDown.delay(500)}
              style={styles.section}
            >
              <TouchableOpacity
                style={styles.anonymousOption}
                onPress={() => setIsAnonymous(!isAnonymous)}
                activeOpacity={0.7}
              >
                <View style={styles.anonymousLeft}>
                  <View style={[
                    styles.checkbox,
                    {
                      backgroundColor: isAnonymous ? '#1d7452' : 'transparent',
                      borderColor: isAnonymous ? '#1d7452' : '#d1d5db',
                      width: isElementary ? 24 : 20,
                      height: isElementary ? 24 : 20,
                    }
                  ]}>
                    {isAnonymous && (
                      <Ionicons 
                        name="checkmark" 
                        size={isElementary ? 16 : 12} 
                        color="#ffffff" 
                      />
                    )}
                  </View>
                  
                  <View style={styles.anonymousText}>
                    <Text style={[
                      styles.anonymousTitle,
                      {
                        fontSize: isElementary ? 16 : 14,
                        fontWeight: isElementary ? '600' : '500',
                      }
                    ]}>
                      {culturalPreferences?.language === 'uzbek' ? 'Anonim yuborish' :
                       culturalPreferences?.language === 'russian' ? 'Отправить анонимно' : 'Send Anonymously'}
                    </Text>
                    <Text style={[
                      styles.anonymousSubtitle,
                      { fontSize: isElementary ? 14 : 12 }
                    ]}>
                      {culturalPreferences?.language === 'uzbek' ? 
                        'Sizning ismingiz ko\'rsatilmaydi' :
                       culturalPreferences?.language === 'russian' ?
                        'Ваше имя не будет показано' :
                        'Your name will not be shown'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Submit Button */}
          {selectedCategory && rating > 0 && feedbackText.trim() && (
            <Animated.View
              entering={FadeInDown.delay(600)}
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
                  onPress={handleSubmitFeedback}
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
                      culturalPreferences?.language === 'uzbek' ? 'Fikr-mulohaza yuborish' :
                      culturalPreferences?.language === 'russian' ? 'Отправить отзыв' : 'Send Feedback'
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
  categoriesContainer: {
    gap: 12,
  },
  categoryCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginRight: 12,
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    marginBottom: 4,
  },
  categorySubtitle: {
    color: '#64748b',
    lineHeight: 16,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examplesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  examplesTitle: {
    color: '#1e293b',
    fontWeight: '500',
    marginBottom: 8,
  },
  exampleText: {
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 4,
  },
  ratingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    padding: 8,
  },
  ratingEmoji: {
    marginBottom: 4,
  },
  ratingLabel: {
    textAlign: 'center',
    fontWeight: '500',
  },
  feedbackInput: {
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
  anonymousOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  anonymousText: {
    flex: 1,
  },
  anonymousTitle: {
    color: '#1e293b',
    marginBottom: 2,
  },
  anonymousSubtitle: {
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