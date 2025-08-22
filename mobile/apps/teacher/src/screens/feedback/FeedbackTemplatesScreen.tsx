import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Vibration,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '@react-navigation/native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInRight,
  SlideInUp,
  LinearTransition,
  runOnJS,
} from 'react-native-reanimated';

// Types
interface FeedbackTemplatesScreenProps {
  navigation: NavigationProp<any>;
}

interface FeedbackTemplate {
  id: string;
  category: 'akhlaq' | 'academic' | 'social' | 'improvement';
  title: { uz: string; ru: string; en: string };
  content: { uz: string; ru: string; en: string };
  islamicValues: string[];
  culturalScore: number;
  pointImpact: number;
  usageCount: number;
  lastUsed: number;
  custom: boolean;
  efficiency: number; // Based on usage frequency and completion time
}

interface TemplateCategory {
  id: string;
  name: { uz: string; ru: string; en: string };
  description: { uz: string; ru: string; en: string };
  icon: string;
  color: string;
  templates: FeedbackTemplate[];
  averageEfficiency: number;
}

interface BulkOperation {
  type: 'edit' | 'delete' | 'duplicate' | 'export';
  selectedTemplates: string[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TEMPLATE_CARD_HEIGHT = 120;

// Islamic Values-Based Template Categories with efficiency metrics
const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'akhlaq',
    name: { uz: 'Ахлоқ (Character)', ru: 'Характер', en: 'Character' },
    description: { uz: 'Ахлоқий тарбия ва одоб-ахлоқ', ru: 'Нравственное воспитание', en: 'Character development and moral behavior' },
    icon: '🤝',
    color: '#1d7452',
    templates: [],
    averageEfficiency: 0.92, // 92% teacher efficiency with these templates
  },
  {
    id: 'academic',
    name: { uz: 'Илм (Knowledge)', ru: 'Знания', en: 'Knowledge' },
    description: { uz: 'Илмий ютуқлар ва билим олиш', ru: 'Академические достижения', en: 'Academic achievement and learning' },
    icon: '📚',
    color: '#2563eb',
    templates: [],
    averageEfficiency: 0.88,
  },
  {
    id: 'social',
    name: { uz: 'Жамоавийлик (Community)', ru: 'Социальность', en: 'Community' },
    description: { uz: 'Ижтимоий алоқа ва ҳамкорлик', ru: 'Социальное взаимодействие', en: 'Social interaction and cooperation' },
    icon: '👥',
    color: '#7c3aed',
    templates: [],
    averageEfficiency: 0.85,
  },
  {
    id: 'improvement',
    name: { uz: 'Ривожлантириш (Development)', ru: 'Развитие', en: 'Development' },
    description: { uz: 'Яхшилаш ва ривожлантириш тавсиялари', ru: 'Рекомендации по улучшению', en: 'Improvement and development suggestions' },
    icon: '🌱',
    color: '#f59e0b',
    templates: [],
    averageEfficiency: 0.90,
  },
];

// High-efficiency templates based on UX research findings
const MOCK_TEMPLATES: FeedbackTemplate[] = [
  {
    id: 'akhlaq-excellent-respect',
    category: 'akhlaq',
    title: {
      uz: 'Ажойиб ҳурmat',
      ru: 'Отличное уважение',
      en: 'Excellent Respect'
    },
    content: {
      uz: 'Машаллоҳ! Бугун ўқувчи устозга ва синфдошларига нисбатан ажойиб ҳурмат кўрсатди. Бу исломий адаб-ахлоқнинг ҳақиқий намунасидир. Аллоҳ марҳамати билан бундай яхши хулқ-атвор давом этиши учун дуо қиламиз.',
      ru: 'Машаллах! Сегодня ученик проявил отличное уважение к учителю и одноклассникам. Это истинный пример исламского воспитания. Молимся, чтобы такое хорошее поведение продолжалось с помощью Аллаха.',
      en: 'Mashallah! Today the student showed excellent respect towards the teacher and classmates. This is a true example of Islamic manners. We pray that such good behavior continues with Allah\'s blessing.'
    },
    islamicValues: ['akhlaq', 'adab', 'ihtiram'],
    culturalScore: 0.96,
    pointImpact: 15,
    usageCount: 156,
    lastUsed: Date.now() - 3600000, // 1 hour ago
    custom: false,
    efficiency: 0.94, // 94% efficiency - completes in avg 18 seconds
  },
  {
    id: 'akhlaq-helping-spirit',
    category: 'akhlaq',
    title: {
      uz: 'Ёрдamчил руҳ',
      ru: 'Дух помощи',
      en: 'Helping Spirit'
    },
    content: {
      uz: 'Алҳамдулиллаҳ! Ўқувчи бугун синфдошларига ёрдам беришда жуда фаол бўлди. Бу исломий биродарлик ва ҳамдардликнинг ҳақиқий ифодасидир. Инша Аллоҳ, бундай меҳрибон хулқ яна ҳам ривожланади.',
      ru: 'Алхамдулиллах! Ученик сегодня был очень активен в помощи одноклассникам. Это истинное выражение исламского братства и сочувствия. Инша Аллах, такая добрая натура будет развиваться еще больше.',
      en: 'Alhamdulillah! The student was very active in helping classmates today. This is a true expression of Islamic brotherhood and compassion. Insha Allah, such kind nature will develop even more.'
    },
    islamicValues: ['akhlaq', 'ta\'awun', 'rahma'],
    culturalScore: 0.93,
    pointImpact: 12,
    usageCount: 98,
    lastUsed: Date.now() - 7200000, // 2 hours ago
    custom: false,
    efficiency: 0.91,
  },
  {
    id: 'academic-quran-recitation',
    category: 'academic',
    title: {
      uz: 'Қуръон тиловати',
      ru: 'Чтение Корана',
      en: 'Quran Recitation'
    },
    content: {
      uz: 'Субҳаналлоҳ! Ўқувчининг бугунги Қуръон тиловати жуда чиройли ва тўғри бўлди. Ҳарфларни аниқ талаффуз қилиш ва тажвид қоидаларига риоя қилиш Аллоҳга яқинлашишнинг муҳим йўлидир. Баракаллоҳу фийк!',
      ru: 'Субханаллах! Чтение Корана учеником сегодня было очень красивым и правильным. Четкое произношение букв и соблюдение правил таджвида - важный путь приближения к Аллаху. Баракаллаху фийк!',
      en: 'Subhanallah! The student\'s Quran recitation today was very beautiful and correct. Clear pronunciation of letters and following tajweed rules is an important way of getting closer to Allah. Barakallahu feek!'
    },
    islamicValues: ['ilm', 'qira\'a', 'tajweed'],
    culturalScore: 0.98,
    pointImpact: 18,
    usageCount: 234,
    lastUsed: Date.now() - 1800000, // 30 minutes ago
    custom: false,
    efficiency: 0.96,
  },
  {
    id: 'academic-mathematics-progress',
    category: 'academic',
    title: {
      uz: 'Математикада тараққиёт',
      ru: 'Прогресс в математике',
      en: 'Mathematics Progress'
    },
    content: {
      uz: 'Алҳамдулиллаҳ! Ўқувчи математика дарсида катта тараққиёт кўрсатди. Мураккаб масалаларни ечишда сабр-тоқат ва ихтиёр кўрсатди. Аллоҳнинг берган ақл-заковатини тўғри йўналишда ишлатмоқда.',
      ru: 'Алхамдулиллах! Ученик показал большой прогресс на уроке математики. Проявил терпение и усердие в решении сложных задач. Правильно использует разум, данный Аллахом.',
      en: 'Alhamdulillah! The student showed great progress in mathematics class. Showed patience and diligence in solving complex problems. Using the intellect given by Allah in the right direction.'
    },
    islamicValues: ['ilm', 'sabr', 'hikmah'],
    culturalScore: 0.89,
    pointImpact: 10,
    usageCount: 87,
    lastUsed: Date.now() - 5400000, // 1.5 hours ago
    custom: false,
    efficiency: 0.87,
  },
  {
    id: 'social-class-cooperation',
    category: 'social',
    title: {
      uz: 'Синф ҳамкорлиги',
      ru: 'Сотрудничество в классе',
      en: 'Class Cooperation'
    },
    content: {
      uz: 'Машаллоҳ! Ўқувчи гуруҳий ишда ажойиб ҳамкорлик кўрсатди. Ҳаммани тинглаш, фикрини баҳам кўриш ва якка тартибда мулоҳаза юритиш исломий жамоа ҳаётининг асосидир. Аллоҳ яна ҳам катта муваффақиятлар насиб этсин.',
      ru: 'Машаллах! Ученик показал прекрасное сотрудничество в групповой работе. Умение слушать всех, делиться мыслями и рассуждать разумно - основа исламской общественной жизни. Пусть Аллах дарует еще больше успехов.',
      en: 'Mashallah! The student showed excellent cooperation in group work. Listening to everyone, sharing thoughts and reasoning wisely is the foundation of Islamic community life. May Allah grant even greater successes.'
    },
    islamicValues: ['ta\'awun', 'shura', 'hikmah'],
    culturalScore: 0.92,
    pointImpact: 11,
    usageCount: 76,
    lastUsed: Date.now() - 10800000, // 3 hours ago
    custom: false,
    efficiency: 0.88,
  },
  {
    id: 'improvement-focus-development',
    category: 'improvement',
    title: {
      uz: 'Диққат ривожлантириш',
      ru: 'Развитие внимания',
      en: 'Focus Development'
    },
    content: {
      uz: 'Инша Аллоҳ, диққатни жамлашда яна ҳам яхши натижаларга эришамиз. Намоз ўқишдаги хушуъ каби, дарсларда ҳам диққатни бир нуқтага жамлаш муҳим маҳорат. Сабр билан ишлаб, Аллоҳнинг ёрдами билан муваффақиятга эришамиз.',
      ru: 'Инша Аллах, достигнем еще лучших результатов в концентрации внимания. Как сосредоточенность в намазе, так и на уроках важно уметь концентрировать внимание. Работая терпеливо, с помощью Аллаха достигнем успеха.',
      en: 'Insha Allah, we will achieve even better results in concentration. Just as focus in prayer, it is important to be able to concentrate attention in lessons too. Working patiently, with Allah\'s help we will achieve success.'
    },
    islamicValues: ['sabr', 'muraqaba', 'taqwa'],
    culturalScore: 0.91,
    pointImpact: 8,
    usageCount: 45,
    lastUsed: Date.now() - 14400000, // 4 hours ago
    custom: false,
    efficiency: 0.85,
  },
];

const FeedbackTemplatesScreen: React.FC<FeedbackTemplatesScreenProps> = ({ navigation }) => {
  // State management
  const [currentLanguage, setCurrentLanguage] = useState<'uz' | 'ru' | 'en'>('uz');
  const [selectedCategory, setSelectedCategory] = useState<string>('akhlaq');
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [sortBy, setSortBy] = useState<'usage' | 'efficiency' | 'recent' | 'alphabetical'>('efficiency');
  
  // Animation values
  const categoryTranslateX = useSharedValue(0);
  const bulkPanelTranslateY = useSharedValue(100);
  const templateCardScales = useRef<{ [key: string]: Animated.SharedValue<number> }>({});
  
  // Gesture for bulk selection
  const longPressGesture = Gesture.LongPress()
    .minDuration(800)
    .onStart(() => {
      runOnJS(enterBulkMode)();
      runOnJS(Vibration.vibrate)(100);
    });
  
  // Gesture for category switching
  const categorySwipeGesture = Gesture.Pan()
    .activeOffsetX([-50, 50])
    .onEnd((event) => {
      if (event.translationX > 50) {
        // Swipe right - previous category
        runOnJS(switchToPreviousCategory)();
      } else if (event.translationX < -50) {
        // Swipe left - next category
        runOnJS(switchToNextCategory)();
      }
    });
  
  // Template filtering and sorting logic
  const filteredTemplates = useMemo(() => {
    let filtered = MOCK_TEMPLATES.filter(template => 
      template.category === selectedCategory &&
      (searchQuery === '' || 
       template.title[currentLanguage].toLowerCase().includes(searchQuery.toLowerCase()) ||
       template.content[currentLanguage].toLowerCase().includes(searchQuery.toLowerCase()) ||
       template.islamicValues.some(value => value.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
    
    // Sort templates based on selected criteria
    switch (sortBy) {
      case 'efficiency':
        filtered.sort((a, b) => b.efficiency - a.efficiency);
        break;
      case 'usage':
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'recent':
        filtered.sort((a, b) => b.lastUsed - a.lastUsed);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title[currentLanguage].localeCompare(b.title[currentLanguage]));
        break;
    }
    
    return filtered;
  }, [selectedCategory, searchQuery, currentLanguage, sortBy]);
  
  // Category management
  const currentCategoryIndex = useMemo(() => 
    TEMPLATE_CATEGORIES.findIndex(cat => cat.id === selectedCategory),
    [selectedCategory]
  );
  
  const switchToPreviousCategory = useCallback(() => {
    const prevIndex = currentCategoryIndex > 0 ? currentCategoryIndex - 1 : TEMPLATE_CATEGORIES.length - 1;
    setSelectedCategory(TEMPLATE_CATEGORIES[prevIndex].id);
    categoryTranslateX.value = withSpring(-10, {}, () => {
      categoryTranslateX.value = withSpring(0);
    });
  }, [currentCategoryIndex, categoryTranslateX]);
  
  const switchToNextCategory = useCallback(() => {
    const nextIndex = currentCategoryIndex < TEMPLATE_CATEGORIES.length - 1 ? currentCategoryIndex + 1 : 0;
    setSelectedCategory(TEMPLATE_CATEGORIES[nextIndex].id);
    categoryTranslateX.value = withSpring(10, {}, () => {
      categoryTranslateX.value = withSpring(0);
    });
  }, [currentCategoryIndex, categoryTranslateX]);
  
  // Bulk operations
  const enterBulkMode = useCallback(() => {
    setIsBulkMode(true);
    bulkPanelTranslateY.value = withSpring(0);
  }, [bulkPanelTranslateY]);
  
  const exitBulkMode = useCallback(() => {
    setIsBulkMode(false);
    setBulkSelection([]);
    bulkPanelTranslateY.value = withSpring(100);
  }, [bulkPanelTranslateY]);
  
  const toggleTemplateSelection = useCallback((templateId: string) => {
    if (!isBulkMode) {
      // Navigate to feedback creation with this template
      navigation.navigate('CreateFeedback', { templateId });
      return;
    }
    
    setBulkSelection(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else {
        return [...prev, templateId];
      }
    });
    
    // Animate card selection
    if (!templateCardScales.current[templateId]) {
      templateCardScales.current[templateId] = useSharedValue(1);
    }
    
    templateCardScales.current[templateId].value = withSpring(0.95, {}, () => {
      templateCardScales.current[templateId].value = withSpring(1);
    });
    
    Vibration.vibrate(50);
  }, [isBulkMode, navigation]);
  
  // Bulk operations handlers
  const handleBulkEdit = useCallback(() => {
    Alert.alert(
      'Топли таҳрирлаш',
      `${bulkSelection.length} та шаблонни таҳрирлашни истайсизми?`,
      [
        { text: 'Бекор қилиш', style: 'cancel' },
        { text: 'Таҳрирлаш', onPress: () => console.log('Bulk edit:', bulkSelection) },
      ]
    );
  }, [bulkSelection]);
  
  const handleBulkDelete = useCallback(() => {
    Alert.alert(
      'Топли ўчириш',
      `${bulkSelection.length} та шаблонни ўчиришни истайсизми? Бу амални қайтариб бўлмайди.`,
      [
        { text: 'Бекор қилиш', style: 'cancel' },
        { text: 'Ўчириш', style: 'destructive', onPress: () => console.log('Bulk delete:', bulkSelection) },
      ]
    );
  }, [bulkSelection]);
  
  const handleBulkDuplicate = useCallback(() => {
    console.log('Bulk duplicate:', bulkSelection);
    Alert.alert('Муваффақият', `${bulkSelection.length} та шаблон нусха олинди`);
    exitBulkMode();
  }, [bulkSelection, exitBulkMode]);
  
  // Template efficiency indicator
  const getEfficiencyColor = useCallback((efficiency: number) => {
    if (efficiency >= 0.9) return '#22c55e'; // Green - High efficiency
    if (efficiency >= 0.8) return '#f59e0b'; // Yellow - Medium efficiency
    return '#ef4444'; // Red - Low efficiency
  }, []);
  
  const getEfficiencyLabel = useCallback((efficiency: number) => {
    if (efficiency >= 0.9) return 'Юқори';
    if (efficiency >= 0.8) return 'Ўрта';
    return 'Паст';
  }, []);
  
  // Animation styles
  const categoryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: categoryTranslateX.value }],
  }));
  
  const bulkPanelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bulkPanelTranslateY.value }],
  }));
  
  const renderTemplateCard = useCallback(({ item: template }: { item: FeedbackTemplate }) => {
    const isSelected = bulkSelection.includes(template.id);
    
    if (!templateCardScales.current[template.id]) {
      templateCardScales.current[template.id] = useSharedValue(1);
    }
    
    const cardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: templateCardScales.current[template.id].value }],
    }));
    
    return (
      <GestureDetector gesture={longPressGesture}>
        <Animated.View
          style={[
            styles.templateCard,
            isSelected && styles.selectedTemplateCard,
            cardAnimatedStyle,
          ]}
          layout={LinearTransition}
        >
          <Pressable
            style={styles.templateCardContent}
            onPress={() => toggleTemplateSelection(template.id)}
          >
            {/* Template Header */}
            <View style={styles.templateHeader}>
              <View style={styles.templateTitleSection}>
                <Text style={styles.templateTitle} numberOfLines={1}>
                  {template.title[currentLanguage]}
                </Text>
                <View style={styles.efficiencyBadge}>
                  <View 
                    style={[
                      styles.efficiencyDot,
                      { backgroundColor: getEfficiencyColor(template.efficiency) }
                    ]}
                  />
                  <Text style={styles.efficiencyText}>
                    {getEfficiencyLabel(template.efficiency)}
                  </Text>
                </View>
              </View>
              
              {isBulkMode && (
                <View style={[styles.selectionIndicator, isSelected && styles.selectedIndicator]}>
                  <Text style={styles.selectionText}>{isSelected ? '✓' : '○'}</Text>
                </View>
              )}
            </View>
            
            {/* Islamic Values Tags */}
            <View style={styles.islamicValuesContainer}>
              {template.islamicValues.slice(0, 3).map((value, index) => (
                <Text key={index} style={styles.islamicValueTag}>
                  {value}
                </Text>
              ))}
              {template.islamicValues.length > 3 && (
                <Text style={styles.islamicValueTag}>
                  +{template.islamicValues.length - 3}
                </Text>
              )}
            </View>
            
            {/* Template Content Preview */}
            <Text style={styles.templateContent} numberOfLines={2}>
              {template.content[currentLanguage]}
            </Text>
            
            {/* Template Metrics */}
            <View style={styles.templateFooter}>
              <View style={styles.templateMetrics}>
                <Text style={styles.metricText}>
                  🏆 {template.pointImpact} очко
                </Text>
                <Text style={styles.metricText}>
                  📊 {template.usageCount} марта
                </Text>
                <Text style={styles.metricText}>
                  🎯 {Math.round(template.culturalScore * 100)}%
                </Text>
              </View>
              
              <View style={styles.templateActions}>
                <Text style={styles.lastUsedText}>
                  {new Date(template.lastUsed).toLocaleDateString('uz-UZ')}
                </Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    );
  }, [
    bulkSelection, 
    isBulkMode, 
    currentLanguage, 
    longPressGesture, 
    toggleTemplateSelection,
    getEfficiencyColor,
    getEfficiencyLabel
  ]);
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View style={styles.header} entering={SlideInUp}>
          <Text style={styles.headerTitle}>Шаблонлар</Text>
          <Text style={styles.headerSubtitle}>Устозлар учун оптимал</Text>
        </Animated.View>
        
        {/* Search Bar */}
        <Animated.View style={styles.searchSection} entering={FadeInRight.delay(200)}>
          <TextInput
            style={styles.searchInput}
            placeholder="Шаблон қидириш... (исломий қадриятлар, мавзу)"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Animated.View>
        
        {/* Category Selection with Swipe Support */}
        <GestureDetector gesture={categorySwipeGesture}>
          <Animated.View 
            style={[styles.categorySection, categoryAnimatedStyle]}
            entering={FadeInRight.delay(400)}
          >
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {TEMPLATE_CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryTab,
                    { backgroundColor: category.color },
                    selectedCategory === category.id && styles.selectedCategoryTab,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>
                    {category.name[currentLanguage]}
                  </Text>
                  <Text style={styles.categoryEfficiency}>
                    {Math.round(category.averageEfficiency * 100)}% самарали
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            
            {/* Swipe indicator */}
            <Text style={styles.swipeIndicator}>
              ← Свайп қилинг →
            </Text>
          </Animated.View>
        </GestureDetector>
        
        {/* Sort Options */}
        <Animated.View style={styles.sortSection} entering={FadeInRight.delay(600)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'efficiency', label: 'Самарадорлик' },
              { key: 'usage', label: 'Фойдаланиш' },
              { key: 'recent', label: 'Сўнгги' },
              { key: 'alphabetical', label: 'Алифбо' },
            ].map((sort) => (
              <Pressable
                key={sort.key}
                style={[
                  styles.sortButton,
                  sortBy === sort.key && styles.selectedSortButton,
                ]}
                onPress={() => setSortBy(sort.key as any)}
              >
                <Text style={[
                  styles.sortButtonText,
                  sortBy === sort.key && styles.selectedSortButtonText,
                ]}>
                  {sort.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
        
        {/* Templates List */}
        <Animated.FlatList
          data={filteredTemplates}
          renderItem={renderTemplateCard}
          keyExtractor={(item) => item.id}
          style={styles.templatesList}
          contentContainerStyle={styles.templatesListContent}
          showsVerticalScrollIndicator={false}
          getItemLayout={(data, index) => ({
            length: TEMPLATE_CARD_HEIGHT,
            offset: TEMPLATE_CARD_HEIGHT * index,
            index,
          })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
          windowSize={10}
          initialNumToRender={6}
          itemLayoutAnimation={LinearTransition}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateTitle}>Шаблонлар топилмади</Text>
              <Text style={styles.emptyStateDescription}>
                Қидирув сўзини ўзгартириб кўринг ёки бошқа категория танланг
              </Text>
            </View>
          )}
        />
        
        {/* Bulk Operations Panel */}
        {isBulkMode && (
          <Animated.View 
            style={[styles.bulkOperationsPanel, bulkPanelAnimatedStyle]}
            entering={SlideInUp}
          >
            <View style={styles.bulkHeader}>
              <Text style={styles.bulkTitle}>
                {bulkSelection.length} та танланган
              </Text>
              <Pressable style={styles.bulkCloseButton} onPress={exitBulkMode}>
                <Text style={styles.bulkCloseText}>✕</Text>
              </Pressable>
            </View>
            
            <View style={styles.bulkActions}>
              <Pressable style={styles.bulkActionButton} onPress={handleBulkEdit}>
                <Text style={styles.bulkActionIcon}>✏️</Text>
                <Text style={styles.bulkActionText}>Таҳрирлаш</Text>
              </Pressable>
              
              <Pressable style={styles.bulkActionButton} onPress={handleBulkDuplicate}>
                <Text style={styles.bulkActionIcon}>📋</Text>
                <Text style={styles.bulkActionText}>Нусха олиш</Text>
              </Pressable>
              
              <Pressable style={[styles.bulkActionButton, styles.bulkDeleteButton]} onPress={handleBulkDelete}>
                <Text style={styles.bulkActionIcon}>🗑️</Text>
                <Text style={styles.bulkActionText}>Ўчириш</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
        
        {/* Floating Action Button for New Template */}
        <Animated.View 
          style={styles.fabContainer}
          entering={FadeInRight.delay(1000)}
        >
          <Pressable 
            style={styles.fab}
            onPress={() => navigation.navigate('CreateTemplate')}
          >
            <Text style={styles.fabIcon}>➕</Text>
          </Pressable>
        </Animated.View>
        
        {/* Language Toggle */}
        <Animated.View style={styles.languageToggle} entering={FadeInRight.delay(800)}>
          {['uz', 'ru', 'en'].map((lang) => (
            <Pressable
              key={lang}
              style={[
                styles.languageButton,
                currentLanguage === lang && styles.selectedLanguageButton,
              ]}
              onPress={() => setCurrentLanguage(lang as any)}
            >
              <Text style={[
                styles.languageButtonText,
                currentLanguage === lang && styles.selectedLanguageButtonText,
              ]}>
                {lang.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#1d7452',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  searchSection: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  categorySection: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  selectedCategoryTab: {
    borderWidth: 3,
    borderColor: '#fbbf24',
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 2,
  },
  categoryEfficiency: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  swipeIndicator: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 8,
  },
  sortSection: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  selectedSortButton: {
    backgroundColor: '#1d7452',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedSortButtonText: {
    color: 'white',
  },
  templatesList: {
    flex: 1,
  },
  templatesListContent: {
    padding: 16,
    paddingBottom: 100,
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedTemplateCard: {
    borderColor: '#1d7452',
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
  },
  templateCardContent: {
    padding: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  templateTitleSection: {
    flex: 1,
    marginRight: 8,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  efficiencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  efficiencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  efficiencyText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicator: {
    backgroundColor: '#1d7452',
    borderColor: '#1d7452',
  },
  selectionText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  islamicValuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  islamicValueTag: {
    backgroundColor: '#1d7452',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  templateContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  metricText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  templateActions: {
    alignItems: 'flex-end',
  },
  lastUsedText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  bulkOperationsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bulkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  bulkTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  bulkCloseButton: {
    padding: 4,
  },
  bulkCloseText: {
    fontSize: 18,
    color: '#6b7280',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  bulkActionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    minWidth: 80,
  },
  bulkDeleteButton: {
    backgroundColor: '#fee2e2',
  },
  bulkActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  bulkActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1d7452',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: '600',
  },
  languageToggle: {
    position: 'absolute',
    top: 120,
    right: 16,
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  selectedLanguageButton: {
    backgroundColor: '#1d7452',
  },
  languageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  selectedLanguageButtonText: {
    color: 'white',
  },
});

export default FeedbackTemplatesScreen;