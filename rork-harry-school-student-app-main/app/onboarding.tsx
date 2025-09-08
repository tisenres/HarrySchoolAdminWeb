import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  image: string;
  backgroundColor: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Welcome to Harry School',
    description: 'Your journey to academic excellence starts here. Learn, grow, and achieve your goals with our interactive platform.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    backgroundColor: Colors.gradient.primary[0],
  },
  {
    id: 2,
    title: 'Gamified Learning',
    description: 'Earn points, unlock achievements, and climb the leaderboard while mastering new skills and knowledge.',
    image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop',
    backgroundColor: Colors.gradient.secondary[0],
  },
  {
    id: 3,
    title: 'Interactive Lessons',
    description: 'Engage with dynamic content including quizzes, speaking exercises, and vocabulary practice.',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
    backgroundColor: Colors.gradient.purple[0],
  },
  {
    id: 4,
    title: 'Track Your Progress',
    description: 'Monitor your learning journey with detailed analytics, grades, and personalized recommendations.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    backgroundColor: Colors.gradient.blue[0],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<any>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index || 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/login');
    }
  };

  const scrollBack = () => {
    if (currentIndex > 0) {
      slidesRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  const skip = () => {
    router.replace('/login');
  };

  const Slide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const Paginator = () => {
    return (
      <View style={styles.paginator}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              style={[styles.dot, { width: dotWidth, opacity }]}
              key={i.toString()}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={skip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        ref={slidesRef}
        data={slides}
        renderItem={({ item }) => <Slide item={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id.toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
      />

      <View style={styles.footer}>
        <Paginator />
        
        <View style={styles.navigation}>
          {currentIndex > 0 && (
            <TouchableOpacity onPress={scrollBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          <View style={styles.spacer} />
          
          <Button
            title={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            onPress={scrollTo}
            style={styles.nextButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width * 0.8,
    height: width * 0.6,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  content: {
    flex: 0.4,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: FontSizes.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  paginator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginHorizontal: 4,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    paddingHorizontal: 32,
  },
});