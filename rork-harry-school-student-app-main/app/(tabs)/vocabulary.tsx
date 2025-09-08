import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Volume2, RotateCcw, ChevronLeft, ChevronRight, Loader2, Filter, XCircle, CheckCircle2, ListFilter } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useStudent } from '@/providers/StudentProvider';
import { VocabularyWord, StudentVocabularyProgress } from '@/lib/supabase';
import { useAppStore } from '@/store/appStore';

type VocabularyWordWithProgress = VocabularyWord & { progress?: StudentVocabularyProgress };

type VocabLocal = VocabularyWord & { translation_ru?: string; translation_uz?: string; progress?: StudentVocabularyProgress };

export default function VocabularyScreen() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showTranslation, setShowTranslation] = useState<boolean>(false);
  const [flipAnimation] = useState<Animated.Value>(new Animated.Value(0));
  const { 
    vocabulary, 
    toggleVocabularyFavorite, 
    updateVocabularyMastery,
    isLoadingVocabulary, 
    vocabularyError,
    isUpdatingVocabulary 
  } = useStudent();
  const { language } = useAppStore();

  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [practiceMode, setPracticeMode] = useState<boolean>(false);
  const [dailyMode, setDailyMode] = useState<boolean>(false);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [practiceIndices, setPracticeIndices] = useState<number[]>([]);
  const [selectedPackIndex, setSelectedPackIndex] = useState<number>(0);
  const [showPackSelector, setShowPackSelector] = useState<boolean>(false);
  const practiceCursor = useRef<number>(0);

  const levels = useMemo(() => ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const, []);
  const [selectedLevel, setSelectedLevel] = useState<typeof levels[number]>('All');

  const PACK_SIZES: Record<typeof levels[number], number> = useMemo(() => ({
    All: 100,
    A1: 25,
    A2: 25,
    B1: 25,
    B2: 25,
    C1: 25,
    C2: 25,
  }), []);

  const filteredVocabulary = useMemo(() => {
    const base = showOnlyFavorites ? vocabulary.filter(v => v.progress?.is_favorite) : vocabulary;
    const levelFiltered = selectedLevel === 'All' ? base : base.filter(v => (v.category ?? '').toUpperCase() === selectedLevel);
    return levelFiltered as VocabLocal[];
  }, [vocabulary, showOnlyFavorites, selectedLevel]);

  const levelPacks = useMemo(() => {
    const size = PACK_SIZES[selectedLevel];
    const arr = filteredVocabulary;
    const packs: Array<{ start: number; end: number; items: VocabLocal[] }> = [];
    if (!size || size <= 0) return packs;
    for (let i = 0; i < arr.length; i += size) {
      packs.push({ start: i, end: Math.min(i + size, arr.length), items: arr.slice(i, i + size) });
    }
    return packs;
  }, [filteredVocabulary, PACK_SIZES, selectedLevel]);

  const packedVocabulary = useMemo(() => {
    if (selectedLevel === 'All') return filteredVocabulary;
    const pack = levelPacks[selectedPackIndex]?.items ?? [];
    return pack as VocabLocal[];
  }, [filteredVocabulary, levelPacks, selectedLevel, selectedPackIndex]);

  const parseTranslations = useCallback((t: string | undefined, ru?: string, uz?: string) => {
    try {
      if (ru || uz) {
        return { ru: ru ?? '', uz: uz ?? '' };
      }
      if (!t) return { ru: '', uz: '' };
      const maybeJson = JSON.parse(t as string);
      if (maybeJson && typeof maybeJson === 'object') {
        return { ru: String(maybeJson.ru ?? ''), uz: String(maybeJson.uz ?? '') };
      }
      return { ru: t, uz: '' };
    } catch {
      return { ru: t ?? '', uz: '' };
    }
  }, []);

  const getLang = useCallback((): 'ru' | 'uz' => {
    if (language === 'ru') return 'ru';
    if (language === 'uz') return 'uz';
    return 'ru';
  }, [language]);

  useEffect(() => {
    if (currentIndex >= packedVocabulary.length) {
      setCurrentIndex(0);
      setShowTranslation(false);
      flipAnimation.setValue(0);
    }
  }, [packedVocabulary.length, currentIndex, flipAnimation]);

  const currentWord = packedVocabulary[currentIndex] as VocabLocal | undefined;

  const generateQuiz = useCallback(() => {
    if (!currentWord) return;
    const { ru, uz } = parseTranslations(currentWord.translation, currentWord.translation_ru, currentWord.translation_uz);
    const lang = getLang();
    const rawCorrect = lang === 'ru' ? ru : uz;
    const correct = (rawCorrect ?? '').trim();

    const poolRaw = packedVocabulary
      .filter(w => w.id !== currentWord.id)
      .map(w => {
        const t = parseTranslations(w.translation, (w as VocabLocal).translation_ru, (w as VocabLocal).translation_uz);
        const val = lang === 'ru' ? t.ru : t.uz;
        return (val ?? '').trim();
      })
      .filter(Boolean);

    const uniquePool: string[] = Array.from(new Set(poolRaw.filter(p => p.length > 0 && p !== correct)));

    const choices: string[] = [];
    while (choices.length < 3 && uniquePool.length > 0) {
      const idx = Math.floor(Math.random() * uniquePool.length);
      const pick = uniquePool.splice(idx, 1)[0];
      if (pick && !choices.includes(pick)) choices.push(pick);
    }
    if (!correct) {
      // fallback to RU if selected language missing
      const fallback = (ru ?? '').trim();
      if (fallback) {
        choices.push(fallback);
      }
    } else {
      choices.push(correct);
    }

    const options = Array.from(new Set(choices)).slice(0, 4);
    while (options.length < 4 && poolRaw.length > 0) {
      const idx = Math.floor(Math.random() * poolRaw.length);
      const pick = poolRaw.splice(idx, 1)[0];
      if (pick && !options.includes(pick)) options.push(pick);
    }

    setQuizOptions(options.sort(() => Math.random() - 0.5));
    setSelectedOption(null);
    setIsCorrect(null);
  }, [currentWord, packedVocabulary, parseTranslations, getLang]);

  const startPractice = useCallback(() => {
    const indices = packedVocabulary.map((_, i) => i).sort(() => Math.random() - 0.5);
    setPracticeIndices(indices);
    practiceCursor.current = indices.indexOf(currentIndex) >= 0 ? indices.indexOf(currentIndex) : 0;
    setPracticeMode(true);
    setDailyMode(false);
    setShowTranslation(false);
    flipAnimation.setValue(0);
  }, [packedVocabulary, currentIndex, flipAnimation]);

  const nextPractice = useCallback(() => {
    if (practiceCursor.current < practiceIndices.length - 1) {
      practiceCursor.current += 1;
      setCurrentIndex(practiceIndices[practiceCursor.current]);
      setShowTranslation(false);
      flipAnimation.setValue(0);
    } else {
      setPracticeMode(false);
    }
  }, [practiceIndices, flipAnimation]);

  const pickDailyFive = useCallback(() => {
    const sorted = [...packedVocabulary].sort((a, b) => {
      const ar = a.progress?.review_count ?? 0;
      const br = b.progress?.review_count ?? 0;
      const alr = a.progress?.last_reviewed ? new Date(a.progress.last_reviewed).getTime() : 0;
      const blr = b.progress?.last_reviewed ? new Date(b.progress.last_reviewed).getTime() : 0;
      if (ar !== br) return ar - br;
      return alr - blr;
    });
    const target = sorted.slice(0, 5);
    const indices = target.map(w => packedVocabulary.findIndex(x => x.id === w.id)).filter(i => i >= 0);
    setPracticeIndices(indices);
    practiceCursor.current = 0;
    setPracticeMode(true);
    setDailyMode(true);
    setShowTranslation(false);
    flipAnimation.setValue(0);
  }, [packedVocabulary, flipAnimation]);

  const onSelectOption = useCallback(async (option: string) => {
    if (!currentWord) return;
    setSelectedOption(option);
    const { ru, uz } = parseTranslations(currentWord.translation, currentWord.translation_ru, currentWord.translation_uz);
    const lang = getLang();
    const correctAnswerRaw = lang === 'ru' ? ru : uz;
    const correct = (option ?? '').trim().toLowerCase() === (correctAnswerRaw ?? '').trim().toLowerCase();
    setIsCorrect(correct);
    try {
      await updateVocabularyMastery(
        currentWord.id,
        Math.min((currentWord.progress?.mastery_level || 1) + (correct ? 1 : 0), 5),
        correct
      );
    } catch (e) {
      console.log('Practice update error', e);
    }
  }, [currentWord, updateVocabularyMastery, parseTranslations, getLang]);

  // Daily progress metrics
  const dailyStats = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const wordsToday = vocabulary.filter(w => {
      const d = w.progress?.last_reviewed ? new Date(w.progress.last_reviewed) : null;
      if (!d) return false;
      const dd = new Date(d);
      dd.setHours(0,0,0,0);
      return dd.getTime() === today.getTime();
    });
    const mastered = vocabulary.filter(w => (w.progress?.mastery_level ?? 0) >= 5).length;
    return { todayReviewed: wordsToday.length, mastered, total: vocabulary.length };
  }, [vocabulary]);

  // Show loading state if no vocabulary loaded yet
  if (isLoadingVocabulary || !currentWord) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Loader2 size={32} color={Colors.primary} />
          <Text style={styles.loadingText}>Loading vocabulary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (vocabularyError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load vocabulary</Text>
          <Button title="Retry" onPress={() => (typeof window !== 'undefined' ? window.location.reload() : null)} />
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state
  if (filteredVocabulary.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No vocabulary words</Text>
          <Text style={styles.emptyText}>{showOnlyFavorites ? 'No favorite words yet. Tap the heart to add favorites.' : 'Vocabulary words will appear here when available.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const flipCard = () => {
    Animated.timing(flipAnimation, {
      toValue: showTranslation ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShowTranslation(!showTranslation);
  };

  const nextCard = () => {
    if (currentIndex < packedVocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowTranslation(false);
      flipAnimation.setValue(0);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowTranslation(false);
      flipAnimation.setValue(0);
    }
  };

  const toggleFavorite = async () => {
    if (!currentWord || isUpdatingVocabulary) return;
    try {
      await toggleVocabularyFavorite(currentWord.id, !currentWord.progress?.is_favorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const playPronunciation = () => {
    console.log('Play pronunciation for:', currentWord.word);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return Colors.success;
      case 'medium': return Colors.secondary;
      case 'hard': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  useEffect(() => {
    if (practiceMode && currentWord) {
      generateQuiz();
    }
  }, [practiceMode, currentWord, language, selectedLevel, selectedPackIndex, showOnlyFavorites, generateQuiz]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title} testID="vocab-title">Vocabulary</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowOnlyFavorites(v => !v)}
            style={styles.filterButton}
            testID="toggle-favorites"
          >
            <Filter size={18} color={showOnlyFavorites ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.filterText, showOnlyFavorites && { color: Colors.primary }]}>Favorites</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {currentIndex + 1} of {packedVocabulary.length}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.levelsScroll} contentContainerStyle={styles.levelsContent}>
          {levels.map((lvl) => (
            <TouchableOpacity
              key={lvl}
              onPress={() => {
                setSelectedLevel(lvl);
                setSelectedPackIndex(0);
                setCurrentIndex(0);
                setShowTranslation(false);
                flipAnimation.setValue(0);
              }}
              style={[styles.levelPill, selectedLevel === lvl && styles.levelPillActive]}
              testID={`level-pill-${lvl}`}
            >
              <Text style={[styles.levelPillText, selectedLevel === lvl && styles.levelPillTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedLevel !== 'All' && (
        <View style={styles.packsHeader}>
          <TouchableOpacity
            style={styles.packSelectorButton}
            onPress={() => setShowPackSelector(v => !v)}
            testID="toggle-pack-selector"
          >
            <ListFilter size={18} color={Colors.primary} />
            <Text style={styles.packSelectorText}>
              Packs ({levelPacks.length}) • Selected: {selectedPackIndex + 1}
            </Text>
          </TouchableOpacity>
          {showPackSelector && (
            <View style={styles.packListDropdown} testID="pack-list">
              <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ paddingVertical: 8 }}>
                {levelPacks.map((p, idx) => {
                  const mastered = p.items.filter(it => (it.progress?.mastery_level ?? 0) >= 5).length;
                  const isActive = selectedPackIndex === idx;
                  return (
                    <TouchableOpacity
                      key={`pack-${idx}`}
                      onPress={() => {
                        setSelectedPackIndex(idx);
                        setCurrentIndex(0);
                        setShowTranslation(false);
                        flipAnimation.setValue(0);
                        setShowPackSelector(false);
                      }}
                      style={[styles.packRow, isActive && styles.packRowActive]}
                      testID={`pack-row-${idx+1}`}
                    >
                      <Text style={[styles.packRowText, isActive && styles.packRowTextActive]}>Pack {idx + 1}</Text>
                      <Text style={[styles.packRowMeta, isActive && styles.packRowTextActive]}>
                        {mastered}/{p.items.length} mastered
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <View style={styles.dailyWrap}>
        <Text style={styles.dailyText}>Daily Goal: 5 • Today: {dailyStats.todayReviewed}/5 • Mastered: {dailyStats.mastered}/{dailyStats.total}</Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.flipCard} onPress={flipCard} activeOpacity={0.9} testID="flip-card">
          <Animated.View style={[styles.card, frontAnimatedStyle, !showTranslation && styles.cardVisible]}>
            <View style={styles.cardHeader}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentWord.difficulty) }]}>
                <Text style={styles.difficultyText}>{currentWord.difficulty}</Text>
              </View>
              <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton} disabled={isUpdatingVocabulary}>
                <Heart
                  size={24}
                  color={currentWord.progress?.is_favorite ? Colors.error : Colors.textSecondary}
                  fill={currentWord.progress?.is_favorite ? Colors.error : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.word} testID="vocab-word">{currentWord.word}</Text>
              <TouchableOpacity onPress={playPronunciation} style={styles.pronunciationButton}>
                <Volume2 size={20} color={Colors.primary} />
                <Text style={styles.pronunciation}>{currentWord.pronunciation ?? ''}</Text>
              </TouchableOpacity>
              <Text style={styles.definition}>{currentWord.definition}</Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.tapHint}>Tap to see translation</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle, showTranslation && styles.cardVisible]}>
            <View style={styles.cardHeader}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentWord.difficulty) }]}>
                <Text style={styles.difficultyText}>{currentWord.difficulty}</Text>
              </View>
              <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton} disabled={isUpdatingVocabulary}>
                <Heart
                  size={24}
                  color={currentWord.progress?.is_favorite ? Colors.error : Colors.textSecondary}
                  fill={currentWord.progress?.is_favorite ? Colors.error : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.cardContent}>
              {(() => {
                const t = parseTranslations(currentWord.translation, currentWord.translation_ru, currentWord.translation_uz);
                return (
                  <View style={styles.translationsWrap}>
                    <View style={styles.translationRow}>
                      <Text style={styles.translationLabel}>RU</Text>
                      <Text style={styles.translation} testID="vocab-translation-ru">{t.ru || '-'}</Text>
                    </View>
                    <View style={styles.translationRow}>
                      <Text style={styles.translationLabel}>UZ</Text>
                      <Text style={styles.translation} testID="vocab-translation-uz">{t.uz || '-'}</Text>
                    </View>
                  </View>
                );
              })()}
              {currentWord.example_sentence && (
                <View style={styles.exampleContainer}>
                  <Text style={styles.exampleLabel}>Example:</Text>
                  <Text style={styles.example}>{currentWord.example_sentence}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.tapHint}>Tap to see word</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={prevCard}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={24} color={currentIndex === 0 ? Colors.textLight : Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shuffleButton} onPress={() => {
          setCurrentIndex(0);
          setShowTranslation(false);
          flipAnimation.setValue(0);
          setPracticeMode(false);
          setDailyMode(false);
          setShowOnlyFavorites(false);
          setSelectedPackIndex(0);
          setSelectedLevel('All');
          setPracticeIndices([]);
          setSelectedOption(null);
          setQuizOptions([]);
          setIsCorrect(null);
        }} testID="reset-btn">
          <RotateCcw size={20} color={Colors.textSecondary} />
          <Text style={styles.shuffleText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, currentIndex === packedVocabulary.length - 1 && styles.navButtonDisabled]}
          onPress={nextCard}
          disabled={currentIndex === packedVocabulary.length - 1}
        >
          <ChevronRight size={24} color={currentIndex === packedVocabulary.length - 1 ? Colors.textLight : Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <Button
          title="Practice Mode"
          variant="outline"
          onPress={startPractice}
          style={styles.actionButton}
          disabled={isUpdatingVocabulary}
          testID="practice-mode-btn"
        />
        <Button
          title="Daily 5"
          onPress={pickDailyFive}
          style={styles.actionButton}
          disabled={isUpdatingVocabulary}
          testID="daily-5-btn"
        />
        <Button
          title="Mark as Known"
          onPress={async () => {
            if (currentWord) {
              try {
                await updateVocabularyMastery(currentWord.id, 5, true);
              } catch (error) {
                console.error('Failed to mark as known:', error);
              }
            }
          }}
          style={styles.actionButton}
          disabled={isUpdatingVocabulary}
          testID="mark-known-btn"
        />
      </View>
      {practiceMode && (
        <View style={styles.practiceContainer} testID="practice-container">
          <View style={styles.practiceHeader}>
            <Text style={styles.practiceTitle}>{dailyMode ? 'Daily 5' : 'Practice'}</Text>
            <TouchableOpacity onPress={() => setPracticeMode(false)}>
              <XCircle size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.practiceQuestion}>What is the translation of:</Text>
          <Text style={styles.practiceWord}>{currentWord.word}</Text>
          <View style={styles.optionsWrap}>
            {quizOptions.map((opt) => {
              const picked = selectedOption === opt;
              const { ru, uz } = parseTranslations(currentWord.translation, currentWord.translation_ru, currentWord.translation_uz);
              const lang = getLang();
              const correctAnswer = lang === 'ru' ? ru : uz;
              const isOptionCorrect = selectedOption !== null && (opt ?? '').trim().toLowerCase() === (correctAnswer ?? '').trim().toLowerCase();
              const wrong = picked && isCorrect === false;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => onSelectOption(opt)}
                  disabled={selectedOption !== null}
                  style={[
                    styles.optionButton,
                    picked && styles.optionPicked,
                    isOptionCorrect && styles.optionCorrect,
                    wrong && styles.optionWrong,
                  ]}
                  testID={`option-${opt}`}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                  {isOptionCorrect && <CheckCircle2 size={18} color={Colors.success} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.practiceFooter}>
            <Button
              title={practiceCursor.current < practiceIndices.length - 1 ? 'Next' : 'Finish'}
              onPress={nextPractice}
              disabled={selectedOption === null}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  levelsScroll: {
    marginTop: 12,
  },
  packsScroll: {
    marginTop: 10,
  },
  packsHeader: {
    marginTop: 10,
    paddingHorizontal: 20,
    zIndex: 5,
  },
  packSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  packSelectorText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: FontWeights.medium,
  },
  packListDropdown: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  packRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packRowActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  packRowText: {
    fontSize: FontSizes.base,
    color: Colors.text,
    fontWeight: FontWeights.medium,
  },
  packRowTextActive: {
    color: Colors.primary,
  },
  packRowMeta: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  levelsContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  levelPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  levelPillActive: {
    backgroundColor: Colors.primary,
  },
  levelPillText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: FontWeights.medium,
  },
  levelPillTextActive: {
    color: '#ffffff',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  flipCard: {
    height: 400,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: Colors.primary,
  },
  cardVisible: {
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: '#ffffff',
  },
  favoriteButton: {
    padding: 4,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: {
    fontSize: FontSizes['4xl'],
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  pronunciationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    padding: 8,
  },
  pronunciation: {
    fontSize: FontSizes.lg,
    color: Colors.primary,
    fontWeight: FontWeights.medium,
  },
  definition: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  translationsWrap: {
    width: '100%',
    gap: 8,
    marginBottom: 8,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  translationLabel: {
    fontSize: FontSizes.base,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: FontWeights.semibold,
  },
  translation: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 0,
    flex: 1,
  },
  exampleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  exampleLabel: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: FontWeights.semibold,
    marginBottom: 8,
  },
  example: {
    fontSize: FontSizes.base,
    color: '#ffffff',
    lineHeight: 24,
  },
  cardFooter: {
    alignItems: 'center',
  },
  tapHint: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    fontWeight: FontWeights.medium,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shuffleText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  filterText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  dailyWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  dailyText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  practiceContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  practiceTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
  },
  practiceQuestion: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  practiceWord: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginVertical: 8,
    textAlign: 'center',
  },
  optionsWrap: {
    marginTop: 8,
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  optionPicked: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  optionCorrect: {
    borderWidth: 1,
    borderColor: Colors.success,
    backgroundColor: '#e8f7ef',
  },
  optionWrong: {
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: '#fdecec',
  },
  optionText: {
    fontSize: FontSizes.base,
    color: Colors.text,
  },
  practiceFooter: {
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.error,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});