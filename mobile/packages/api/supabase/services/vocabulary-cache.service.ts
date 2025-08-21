/**
 * Vocabulary Cache Service
 * Manages in-memory caching of frequently accessed vocabulary words
 * Integrates with Supabase vocabulary_word_cache table and memory MCP server
 */

import { supabase } from '../client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VocabularyWord {
  id: string;
  word_en: string;
  word_uz?: string;
  word_ru?: string;
  phonetic_en?: string;
  phonetic_uz?: string;
  phonetic_ru?: string;
  definition_en?: string;
  definition_uz?: string;
  definition_ru?: string;
  example_sentence_en?: string;
  example_sentence_uz?: string;
  example_sentence_ru?: string;
  difficulty_score: number;
  part_of_speech?: string;
  tags: string[];
  audio_url_en?: string;
  audio_url_uz?: string;
  audio_url_ru?: string;
  image_url?: string;
  cultural_notes: Record<string, any>;
  unit_id: string;
  unit_title?: string;
}

export interface VocabularyProgress {
  due_date: string;
  stability: number;
  difficulty: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
  mastery_level: 'beginner' | 'learning' | 'familiar' | 'mastered';
  streak_count: number;
  accuracy_rate: number;
  last_studied_at: string;
}

export interface CachedVocabularyWord extends VocabularyWord {
  progress?: VocabularyProgress;
  cache_metadata: {
    access_count: number;
    last_accessed: string;
    cache_type: 'frequent' | 'recent' | 'struggling' | 'mastered';
  };
}

export type CacheType = 'frequent' | 'recent' | 'struggling' | 'mastered';

class VocabularyCacheService {
  private static instance: VocabularyCacheService;
  private memoryCache = new Map<string, CachedVocabularyWord>();
  private cacheStats = {
    hits: 0,
    misses: 0,
    updates: 0,
  };

  // Cache configuration
  private readonly CACHE_LIMITS = {
    frequent: 500,   // Most accessed words across all students
    recent: 200,     // Recently studied words per student
    struggling: 100, // Words student finds difficult
    mastered: 150,   // Fully mastered words
  };

  private readonly CACHE_TTL = {
    frequent: 24 * 60 * 60 * 1000,   // 24 hours
    recent: 6 * 60 * 60 * 1000,      // 6 hours
    struggling: 12 * 60 * 60 * 1000, // 12 hours
    mastered: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  private constructor() {
    this.initializeCache();
  }

  public static getInstance(): VocabularyCacheService {
    if (!VocabularyCacheService.instance) {
      VocabularyCacheService.instance = new VocabularyCacheService();
    }
    return VocabularyCacheService.instance;
  }

  /**
   * Initialize cache from AsyncStorage and Supabase
   */
  private async initializeCache(): Promise<void> {
    try {
      // Load from AsyncStorage first for immediate availability
      await this.loadFromAsyncStorage();
      
      // Then sync with Supabase cache table
      await this.syncWithSupabaseCache();
    } catch (error) {
      console.warn('Failed to initialize vocabulary cache:', error);
    }
  }

  /**
   * Get cached vocabulary word by ID
   */
  public async getWord(
    wordId: string, 
    studentId?: string,
    cacheType: CacheType = 'frequent'
  ): Promise<CachedVocabularyWord | null> {
    const cacheKey = this.generateCacheKey(wordId, studentId, cacheType);
    
    // Check memory cache first
    if (this.memoryCache.has(cacheKey)) {
      this.cacheStats.hits++;
      const cachedWord = this.memoryCache.get(cacheKey)!;
      
      // Update access metadata
      cachedWord.cache_metadata.access_count++;
      cachedWord.cache_metadata.last_accessed = new Date().toISOString();
      
      // Update in Supabase asynchronously
      this.updateSupabaseCacheAsync(cachedWord, studentId, cacheType);
      
      return cachedWord;
    }

    this.cacheStats.misses++;
    
    // Check Supabase cache
    const cachedFromSupabase = await this.getFromSupabaseCache(wordId, studentId, cacheType);
    if (cachedFromSupabase) {
      this.memoryCache.set(cacheKey, cachedFromSupabase);
      return cachedFromSupabase;
    }

    // Load from main vocabulary table
    const word = await this.loadWordFromDatabase(wordId, studentId);
    if (word) {
      await this.cacheWord(word, studentId, cacheType);
      return word;
    }

    return null;
  }

  /**
   * Cache a vocabulary word
   */
  public async cacheWord(
    word: CachedVocabularyWord,
    studentId?: string,
    cacheType: CacheType = 'frequent'
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(word.id, studentId, cacheType);
    
    // Store in memory cache
    this.memoryCache.set(cacheKey, word);
    
    // Store in AsyncStorage for persistence
    await this.saveToAsyncStorage(cacheKey, word);
    
    // Store in Supabase cache table
    await this.saveToSupabaseCache(word, studentId, cacheType);
    
    // Enforce cache limits
    await this.enforceCacheLimit(cacheType);
    
    this.cacheStats.updates++;
  }

  /**
   * Get frequently accessed words for a student
   */
  public async getFrequentWords(studentId?: string, limit = 50): Promise<CachedVocabularyWord[]> {
    try {
      const { data, error } = await supabase
        .from('vocabulary_word_cache')
        .select(`
          word_data,
          translations,
          progress_data,
          access_count,
          last_accessed,
          cache_type
        `)
        .eq('cache_type', 'frequent')
        .eq('student_id', studentId || null)
        .gte('expires_at', new Date().toISOString())
        .order('access_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(item => ({
        ...item.word_data,
        progress: item.progress_data,
        cache_metadata: {
          access_count: item.access_count,
          last_accessed: item.last_accessed,
          cache_type: item.cache_type,
        },
      })) || [];
    } catch (error) {
      console.error('Failed to get frequent words:', error);
      return [];
    }
  }

  /**
   * Get words student is struggling with
   */
  public async getStrugglingWords(studentId: string, limit = 30): Promise<CachedVocabularyWord[]> {
    try {
      const { data, error } = await supabase
        .from('vocabulary_word_cache')
        .select(`
          word_data,
          translations,
          progress_data,
          access_count,
          last_accessed,
          cache_type
        `)
        .eq('cache_type', 'struggling')
        .eq('student_id', studentId)
        .gte('expires_at', new Date().toISOString())
        .order('access_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(item => ({
        ...item.word_data,
        progress: item.progress_data,
        cache_metadata: {
          access_count: item.access_count,
          last_accessed: item.last_accessed,
          cache_type: item.cache_type,
        },
      })) || [];
    } catch (error) {
      console.error('Failed to get struggling words:', error);
      return [];
    }
  }

  /**
   * Update word access patterns for intelligent caching
   */
  public async updateWordAccess(
    wordId: string,
    studentId: string,
    isCorrect: boolean,
    responseTime: number
  ): Promise<void> {
    // Determine cache type based on performance
    let cacheType: CacheType;
    if (!isCorrect || responseTime > 5000) {
      cacheType = 'struggling';
    } else if (responseTime < 1000) {
      cacheType = 'mastered';
    } else {
      cacheType = 'recent';
    }

    // Update or create cache entry
    const word = await this.getWord(wordId, studentId, cacheType);
    if (word) {
      await this.cacheWord(word, studentId, cacheType);
    }

    // Also update frequent cache if accessed multiple times
    const frequentWord = await this.getWord(wordId, undefined, 'frequent');
    if (frequentWord && frequentWord.cache_metadata.access_count > 10) {
      await this.cacheWord(frequentWord, undefined, 'frequent');
    }
  }

  /**
   * Preload vocabulary for offline use
   */
  public async preloadForOffline(
    studentId: string,
    unitIds: string[] = [],
    maxWords = 200
  ): Promise<void> {
    try {
      // Get words due for review
      const { data: dueWords, error: dueError } = await supabase
        .rpc('get_words_due_for_review', {
          p_student_id: studentId,
          p_limit: Math.min(maxWords / 2, 50),
        });

      if (dueError) throw dueError;

      // Cache due words
      for (const word of dueWords || []) {
        const cachedWord: CachedVocabularyWord = {
          ...word,
          cache_metadata: {
            access_count: 1,
            last_accessed: new Date().toISOString(),
            cache_type: 'recent',
          },
        };
        await this.cacheWord(cachedWord, studentId, 'recent');
      }

      // Get frequent words for units
      if (unitIds.length > 0) {
        const { data: unitWords, error: unitError } = await supabase
          .from('vocabulary_words')
          .select(`
            *,
            vocabulary_units!inner(title_en)
          `)
          .in('unit_id', unitIds)
          .eq('is_active', true)
          .is('deleted_at', null)
          .order('frequency_rank')
          .limit(maxWords / 2);

        if (unitError) throw unitError;

        // Cache unit words
        for (const word of unitWords || []) {
          const cachedWord: CachedVocabularyWord = {
            ...word,
            unit_title: word.vocabulary_units?.title_en,
            cache_metadata: {
              access_count: 1,
              last_accessed: new Date().toISOString(),
              cache_type: 'frequent',
            },
          };
          await this.cacheWord(cachedWord, undefined, 'frequent');
        }
      }
    } catch (error) {
      console.error('Failed to preload vocabulary for offline:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  public async clearExpiredCache(): Promise<void> {
    try {
      // Clear from Supabase
      await supabase
        .from('vocabulary_word_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      // Clear from memory cache
      const now = Date.now();
      for (const [key, word] of this.memoryCache.entries()) {
        const cacheTime = new Date(word.cache_metadata.last_accessed).getTime();
        const ttl = this.CACHE_TTL[word.cache_metadata.cache_type];
        
        if (now - cacheTime > ttl) {
          this.memoryCache.delete(key);
          await AsyncStorage.removeItem(`vocab_cache_${key}`);
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      ...this.cacheStats,
      memorySize: this.memoryCache.size,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
    };
  }

  // Private helper methods

  private generateCacheKey(wordId: string, studentId?: string, cacheType?: CacheType): string {
    return `${wordId}_${studentId || 'global'}_${cacheType || 'frequent'}`;
  }

  private async loadFromAsyncStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('vocab_cache_'));
      
      const cachedItems = await AsyncStorage.multiGet(cacheKeys);
      
      for (const [key, value] of cachedItems) {
        if (value) {
          const cacheKey = key.replace('vocab_cache_', '');
          this.memoryCache.set(cacheKey, JSON.parse(value));
        }
      }
    } catch (error) {
      console.warn('Failed to load from AsyncStorage:', error);
    }
  }

  private async saveToAsyncStorage(cacheKey: string, word: CachedVocabularyWord): Promise<void> {
    try {
      await AsyncStorage.setItem(`vocab_cache_${cacheKey}`, JSON.stringify(word));
    } catch (error) {
      console.warn('Failed to save to AsyncStorage:', error);
    }
  }

  private async syncWithSupabaseCache(): Promise<void> {
    // Implementation for syncing with Supabase cache table
    // This would be called during app initialization
  }

  private async getFromSupabaseCache(
    wordId: string,
    studentId?: string,
    cacheType?: CacheType
  ): Promise<CachedVocabularyWord | null> {
    try {
      const { data, error } = await supabase
        .from('vocabulary_word_cache')
        .select('*')
        .eq('word_id', wordId)
        .eq('student_id', studentId || null)
        .eq('cache_type', cacheType || 'frequent')
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      return {
        ...data.word_data,
        progress: data.progress_data,
        cache_metadata: {
          access_count: data.access_count,
          last_accessed: data.last_accessed,
          cache_type: data.cache_type,
        },
      };
    } catch (error) {
      console.warn('Failed to get from Supabase cache:', error);
      return null;
    }
  }

  private async saveToSupabaseCache(
    word: CachedVocabularyWord,
    studentId?: string,
    cacheType: CacheType = 'frequent'
  ): Promise<void> {
    try {
      const expires_at = new Date(Date.now() + this.CACHE_TTL[cacheType]).toISOString();
      
      await supabase
        .from('vocabulary_word_cache')
        .upsert({
          word_id: word.id,
          student_id: studentId || null,
          organization_id: word.unit_id, // This should be properly set
          cache_type: cacheType,
          word_data: word,
          translations: {
            en: { word: word.word_en, definition: word.definition_en },
            uz: { word: word.word_uz, definition: word.definition_uz },
            ru: { word: word.word_ru, definition: word.definition_ru },
          },
          progress_data: word.progress || {},
          access_count: word.cache_metadata.access_count,
          last_accessed: word.cache_metadata.last_accessed,
          expires_at,
        }, {
          onConflict: 'word_id,student_id,cache_type'
        });
    } catch (error) {
      console.warn('Failed to save to Supabase cache:', error);
    }
  }

  private async updateSupabaseCacheAsync(
    word: CachedVocabularyWord,
    studentId?: string,
    cacheType: CacheType = 'frequent'
  ): Promise<void> {
    // Update asynchronously without blocking
    setTimeout(async () => {
      try {
        await supabase
          .from('vocabulary_word_cache')
          .update({
            access_count: word.cache_metadata.access_count,
            last_accessed: word.cache_metadata.last_accessed,
          })
          .eq('word_id', word.id)
          .eq('student_id', studentId || null)
          .eq('cache_type', cacheType);
      } catch (error) {
        console.warn('Failed to update Supabase cache async:', error);
      }
    }, 0);
  }

  private async loadWordFromDatabase(wordId: string, studentId?: string): Promise<CachedVocabularyWord | null> {
    try {
      const { data, error } = await supabase
        .from('vocabulary_words')
        .select(`
          *,
          vocabulary_units!inner(title_en),
          student_vocabulary_progress!left(
            due_date,
            stability,
            difficulty,
            state,
            mastery_level,
            streak_count,
            accuracy_rate,
            last_studied_at
          )
        `)
        .eq('id', wordId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .eq('student_vocabulary_progress.student_id', studentId || '')
        .single();

      if (error || !data) return null;

      return {
        ...data,
        unit_title: data.vocabulary_units?.title_en,
        progress: data.student_vocabulary_progress?.[0] || undefined,
        cache_metadata: {
          access_count: 1,
          last_accessed: new Date().toISOString(),
          cache_type: 'frequent',
        },
      };
    } catch (error) {
      console.warn('Failed to load word from database:', error);
      return null;
    }
  }

  private async enforceCacheLimit(cacheType: CacheType): Promise<void> {
    // Remove oldest entries if cache limit exceeded
    const limit = this.CACHE_LIMITS[cacheType];
    const entries = Array.from(this.memoryCache.entries())
      .filter(([, word]) => word.cache_metadata.cache_type === cacheType)
      .sort(([, a], [, b]) => 
        new Date(a.cache_metadata.last_accessed).getTime() - 
        new Date(b.cache_metadata.last_accessed).getTime()
      );

    if (entries.length > limit) {
      const toRemove = entries.slice(0, entries.length - limit);
      for (const [key] of toRemove) {
        this.memoryCache.delete(key);
        await AsyncStorage.removeItem(`vocab_cache_${key}`);
      }
    }
  }
}

export default VocabularyCacheService.getInstance();