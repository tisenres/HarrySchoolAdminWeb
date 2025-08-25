import OpenAI from 'openai';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { createMemoryCache } from '../../../shared/services/memory-cache.service';
import { createSecureStorage } from '../../../shared/services/secure-storage.service';
import {
  TranscriptionRequest,
  TranscriptionResult,
  PronunciationEvaluationRequest,
  PronunciationEvaluationResult,
  AudioProcessingOptions,
  LanguageDetectionResult,
} from './types';

// Whisper Service for speech transcription and pronunciation evaluation
class WhisperService {
  private client: OpenAI;
  private memoryCache = createMemoryCache('whisper-service');
  private secureStorage = createSecureStorage();
  private readonly API_KEY: string;

  // Supported languages for Harry School CRM
  private readonly SUPPORTED_LANGUAGES = {
    'en': 'English',
    'uz': 'Uzbek',
    'ru': 'Russian',
    'ar': 'Arabic',
  };

  constructor() {
    this.API_KEY = process.env.OPENAI_API_KEY || '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';
    
    this.client = new OpenAI({
      apiKey: this.API_KEY,
      timeout: 60000, // Extended timeout for audio processing
      maxRetries: 2,
      defaultHeaders: {
        'User-Agent': 'HarrySchoolCRM-Mobile-Whisper/1.0',
      },
    });

    this.initializeAudioSystem();
  }

  private async initializeAudioSystem(): Promise<void> {
    try {
      // Configure audio for recording and playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }

  // Core transcription method
  async transcribeAudio(request: TranscriptionRequest): Promise<TranscriptionResult> {
    try {
      // Validate audio file
      await this.validateAudioFile(request.audioUri);
      
      // Check cache for recent transcriptions
      const cacheKey = await this.generateAudioCacheKey(request.audioUri);
      const cached = await this.memoryCache.get(cacheKey);
      
      if (cached && !request.options?.forceRefresh) {
        return cached as TranscriptionResult;
      }

      // Process audio file for optimal Whisper input
      const processedAudioUri = await this.processAudioFile(
        request.audioUri,
        request.options?.processing || {}
      );

      // Prepare form data for Whisper API
      const audioFile = await this.createAudioFileForAPI(processedAudioUri);
      
      const transcription = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: request.expectedLanguage || undefined,
        prompt: this.buildTranscriptionPrompt(request),
        response_format: 'verbose_json',
        temperature: 0.2, // Lower temperature for more consistent results
      });

      // Language detection and confidence scoring
      const languageDetection = await this.detectLanguage(transcription.text);
      const confidenceScore = this.calculateTranscriptionConfidence(transcription);

      const result: TranscriptionResult = {
        transcriptionId: `transcription_${Date.now()}`,
        text: transcription.text,
        language: transcription.language || languageDetection.detectedLanguage,
        confidence: confidenceScore,
        duration: transcription.duration,
        segments: transcription.segments || [],
        languageDetection: languageDetection,
        metadata: {
          model: 'whisper-1',
          processingTime: Date.now(),
          audioFormat: await this.getAudioFormat(request.audioUri),
          fileSize: await this.getAudioFileSize(request.audioUri),
        },
        culturalContext: await this.analyzeCulturalContext(transcription.text, transcription.language),
      };

      // Cache successful transcriptions for 1 hour
      await this.memoryCache.set(cacheKey, result, 3600);

      // Clean up processed audio file
      await this.cleanupProcessedFile(processedAudioUri);

      return result;

    } catch (error) {
      console.error('Audio transcription failed:', error);
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Pronunciation evaluation for language learning
  async evaluatePronunciation(request: PronunciationEvaluationRequest): Promise<PronunciationEvaluationResult> {
    try {
      // First transcribe the audio
      const transcriptionResult = await this.transcribeAudio({
        audioUri: request.audioUri,
        expectedLanguage: request.targetLanguage,
        options: {
          processing: {
            enhanceForSpeech: true,
            normalizeVolume: true,
          },
        },
      });

      // Compare with expected text using phonetic analysis
      const pronunciationAnalysis = await this.analyzePronunciation(
        transcriptionResult.text,
        request.expectedText,
        request.targetLanguage
      );

      // Generate detailed feedback
      const feedback = await this.generatePronunciationFeedback(
        pronunciationAnalysis,
        request.targetLanguage,
        request.options?.culturalContext || 'general'
      );

      const result: PronunciationEvaluationResult = {
        evaluationId: `pronunciation_${Date.now()}`,
        transcribedText: transcriptionResult.text,
        expectedText: request.expectedText,
        accuracy: pronunciationAnalysis.overallAccuracy,
        fluency: pronunciationAnalysis.fluencyScore,
        clarity: pronunciationAnalysis.clarityScore,
        wordAccuracy: pronunciationAnalysis.wordLevelAccuracy,
        phonemeAnalysis: pronunciationAnalysis.phonemeAnalysis,
        feedback: feedback,
        recommendations: await this.generatePronunciationRecommendations(pronunciationAnalysis),
        culturalNotes: await this.generateCulturalPronunciationNotes(
          request.targetLanguage,
          request.options?.culturalContext || 'general'
        ),
        metadata: {
          targetLanguage: request.targetLanguage,
          evaluationTime: Date.now(),
          audioQuality: transcriptionResult.confidence,
          processingModel: 'whisper-1',
        },
      };

      return result;

    } catch (error) {
      console.error('Pronunciation evaluation failed:', error);
      throw new Error(`Failed to evaluate pronunciation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Batch processing for multiple audio files
  async transcribeMultipleAudio(requests: TranscriptionRequest[]): Promise<TranscriptionResult[]> {
    try {
      const batchSize = 3; // Process 3 files at a time to avoid rate limits
      const results: TranscriptionResult[] = [];

      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        const batchPromises = batch.map(request => this.transcribeAudio(request));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return results;

    } catch (error) {
      console.error('Batch transcription failed:', error);
      throw new Error(`Failed to transcribe multiple audio files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time transcription for live audio
  async startRealtimeTranscription(options: {
    targetLanguage?: string;
    onTranscription: (text: string) => void;
    onError: (error: Error) => void;
  }): Promise<{
    stop: () => Promise<void>;
    pause: () => void;
    resume: () => void;
  }> {
    try {
      let isRecording = false;
      let recording: Audio.Recording | null = null;
      let transcriptionBuffer: string[] = [];

      const startRecording = async () => {
        if (isRecording) return;

        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          throw new Error('Audio recording permission not granted');
        }

        recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: '.wav',
            outputFormat: Audio.RECORDING_FORMAT_PCM_16BIT,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 256000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.RECORDING_FORMAT_PCM,
            audioQuality: Audio.RECORDING_QUALITY_HIGH,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 256000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        });

        await recording.startAsync();
        isRecording = true;

        // Process audio in chunks for real-time transcription
        this.processRealtimeAudio(recording, options);
      };

      const stopRecording = async () => {
        if (!recording || !isRecording) return;

        await recording.stopAndUnloadAsync();
        isRecording = false;
        recording = null;
      };

      const pauseRecording = () => {
        // Implementation for pausing real-time transcription
      };

      const resumeRecording = () => {
        // Implementation for resuming real-time transcription
      };

      await startRecording();

      return {
        stop: stopRecording,
        pause: pauseRecording,
        resume: resumeRecording,
      };

    } catch (error) {
      console.error('Failed to start real-time transcription:', error);
      throw new Error(`Failed to start real-time transcription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Audio processing and optimization methods
  private async processAudioFile(
    audioUri: string,
    options: AudioProcessingOptions
  ): Promise<string> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      // Apply audio enhancements for better Whisper performance
      let processedUri = audioUri;

      if (options.enhanceForSpeech) {
        processedUri = await this.enhanceForSpeech(processedUri);
      }

      if (options.normalizeVolume) {
        processedUri = await this.normalizeAudioVolume(processedUri);
      }

      if (options.reduceNoise) {
        processedUri = await this.reduceBackgroundNoise(processedUri);
      }

      return processedUri;

    } catch (error) {
      console.error('Audio processing failed:', error);
      throw new Error(`Failed to process audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async enhanceForSpeech(audioUri: string): Promise<string> {
    // Implementation for speech enhancement
    // This would typically use audio processing libraries
    // For now, return original URI
    return audioUri;
  }

  private async normalizeAudioVolume(audioUri: string): Promise<string> {
    // Implementation for volume normalization
    return audioUri;
  }

  private async reduceBackgroundNoise(audioUri: string): Promise<string> {
    // Implementation for noise reduction
    return audioUri;
  }

  private async validateAudioFile(audioUri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      if (!fileInfo.size || fileInfo.size > 25 * 1024 * 1024) { // 25MB limit
        throw new Error('Audio file is too large (max 25MB)');
      }

      // Check file extension
      const supportedFormats = ['.wav', '.mp3', '.m4a', '.flac', '.webm', '.mp4'];
      const extension = audioUri.toLowerCase().substring(audioUri.lastIndexOf('.'));
      
      if (!supportedFormats.includes(extension)) {
        throw new Error(`Unsupported audio format: ${extension}`);
      }

    } catch (error) {
      throw new Error(`Audio file validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createAudioFileForAPI(audioUri: string): Promise<File> {
    try {
      const fileData = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      const fileName = audioUri.substring(audioUri.lastIndexOf('/') + 1);
      return new File([byteArray], fileName, { type: 'audio/wav' });

    } catch (error) {
      throw new Error(`Failed to create audio file for API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildTranscriptionPrompt(request: TranscriptionRequest): string {
    const contextualPrompts = {
      'educational': 'This is educational content from an English language learning environment in Uzbekistan.',
      'pronunciation': 'This is a pronunciation exercise for English language learners.',
      'conversation': 'This is a conversation between teacher and student in an educational setting.',
      'reading': 'This is a student reading English text aloud for evaluation.',
    };

    const basePrompt = contextualPrompts[request.options?.context || 'educational'] || 
                      contextualPrompts.educational;

    if (request.expectedLanguage && this.SUPPORTED_LANGUAGES[request.expectedLanguage as keyof typeof this.SUPPORTED_LANGUAGES]) {
      return `${basePrompt} Expected language: ${this.SUPPORTED_LANGUAGES[request.expectedLanguage as keyof typeof this.SUPPORTED_LANGUAGES]}.`;
    }

    return basePrompt;
  }

  private calculateTranscriptionConfidence(transcription: any): number {
    // Calculate confidence based on available Whisper metadata
    // This is a simplified implementation
    
    if (transcription.segments && transcription.segments.length > 0) {
      const avgConfidence = transcription.segments.reduce((sum: number, segment: any) => {
        return sum + (segment.avg_logprob || 0);
      }, 0) / transcription.segments.length;
      
      // Convert log probability to confidence percentage
      return Math.max(0, Math.min(100, (avgConfidence + 1) * 100));
    }
    
    // Default confidence for transcriptions without segment data
    return 75;
  }

  private async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    // Simple language detection based on text patterns
    // In production, this could use a dedicated language detection service
    
    const patterns = {
      'en': /^[a-zA-Z\s.,!?'"()-]+$/,
      'ru': /[а-яё]/i,
      'uz': /[ʻʼ'']/,
      'ar': /[\u0600-\u06FF]/,
    };

    let detectedLanguage = 'en'; // Default to English
    let confidence = 0.5;

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        detectedLanguage = lang;
        confidence = 0.8;
        break;
      }
    }

    return {
      detectedLanguage,
      confidence,
      supportedLanguages: Object.keys(this.SUPPORTED_LANGUAGES),
    };
  }

  private async analyzeCulturalContext(text: string, language: string): Promise<{
    culturalRelevance: number;
    islamicContent: boolean;
    uzbekistanContext: boolean;
    recommendations: string[];
  }> {
    const lowerText = text.toLowerCase();
    
    // Analyze cultural content
    const islamicTerms = ['allah', 'islam', 'muslim', 'prayer', 'quran', 'mosque'];
    const uzbekTerms = ['uzbekistan', 'tashkent', 'samarkand', 'bukhara', 'uzbek'];
    
    const islamicMatches = islamicTerms.filter(term => lowerText.includes(term)).length;
    const uzbekMatches = uzbekTerms.filter(term => lowerText.includes(term)).length;
    
    return {
      culturalRelevance: Math.min(100, (islamicMatches + uzbekMatches) * 20),
      islamicContent: islamicMatches > 0,
      uzbekistanContext: uzbekMatches > 0,
      recommendations: [
        ...(islamicMatches === 0 ? ['Consider adding Islamic cultural references'] : []),
        ...(uzbekMatches === 0 ? ['Consider adding Uzbekistan context'] : []),
      ],
    };
  }

  private async analyzePronunciation(
    transcribed: string,
    expected: string,
    language: string
  ): Promise<{
    overallAccuracy: number;
    fluencyScore: number;
    clarityScore: number;
    wordLevelAccuracy: Array<{
      word: string;
      accuracy: number;
      feedback: string;
    }>;
    phonemeAnalysis: Array<{
      phoneme: string;
      accuracy: number;
      examples: string[];
    }>;
  }> {
    // Simplified pronunciation analysis
    // In production, this would use more sophisticated phonetic analysis
    
    const transcribedWords = transcribed.toLowerCase().split(' ');
    const expectedWords = expected.toLowerCase().split(' ');
    
    let correctWords = 0;
    const wordAccuracy = expectedWords.map((word, index) => {
      const transcribedWord = transcribedWords[index] || '';
      const similarity = this.calculateWordSimilarity(word, transcribedWord);
      
      if (similarity > 0.8) correctWords++;
      
      return {
        word: word,
        accuracy: similarity * 100,
        feedback: similarity > 0.8 ? 'Excellent' : 
                 similarity > 0.6 ? 'Good, minor improvements needed' : 
                 'Needs practice',
      };
    });
    
    const overallAccuracy = expectedWords.length > 0 ? (correctWords / expectedWords.length) * 100 : 0;
    
    return {
      overallAccuracy,
      fluencyScore: Math.max(0, overallAccuracy - 10), // Simplified fluency calculation
      clarityScore: overallAccuracy,
      wordLevelAccuracy: wordAccuracy,
      phonemeAnalysis: [], // Would be implemented with phonetic analysis
    };
  }

  private calculateWordSimilarity(word1: string, word2: string): number {
    // Simple Levenshtein distance-based similarity
    const maxLength = Math.max(word1.length, word2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(word1, word2);
    return (maxLength - distance) / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private async generatePronunciationFeedback(
    analysis: any,
    language: string,
    culturalContext: string
  ): Promise<{
    overall: string;
    strengths: string[];
    improvements: string[];
    culturalTips: string[];
  }> {
    const accuracy = analysis.overallAccuracy;
    
    let overall = '';
    if (accuracy >= 90) {
      overall = 'Excellent pronunciation! Your speech is clear and accurate.';
    } else if (accuracy >= 75) {
      overall = 'Good pronunciation with room for minor improvements.';
    } else if (accuracy >= 60) {
      overall = 'Fair pronunciation. Keep practicing to improve clarity.';
    } else {
      overall = 'Pronunciation needs significant practice. Focus on individual word sounds.';
    }
    
    const strengths = analysis.wordLevelAccuracy
      .filter((word: any) => word.accuracy > 80)
      .map((word: any) => `Good pronunciation of "${word.word}"`);
    
    const improvements = analysis.wordLevelAccuracy
      .filter((word: any) => word.accuracy < 70)
      .map((word: any) => `Practice pronunciation of "${word.word}"`);
    
    const culturalTips = this.getCulturalPronunciationTips(language, culturalContext);
    
    return {
      overall,
      strengths: strengths.slice(0, 3), // Top 3 strengths
      improvements: improvements.slice(0, 3), // Top 3 improvements
      culturalTips,
    };
  }

  private getCulturalPronunciationTips(language: string, culturalContext: string): string[] {
    const tips = {
      'en-uzbekistan': [
        'English "th" sounds are challenging for Uzbek speakers - practice with tongue position',
        'Focus on English vowel distinctions that don\'t exist in Uzbek',
        'Practice English stress patterns which differ from Uzbek',
      ],
      'en-general': [
        'Focus on clear consonant pronunciation',
        'Practice English rhythm and stress patterns',
        'Work on vowel clarity and distinction',
      ],
    };
    
    const key = `${language}-${culturalContext}` as keyof typeof tips;
    return tips[key] || tips['en-general'];
  }

  private async generatePronunciationRecommendations(analysis: any): Promise<string[]> {
    const recommendations = [];
    
    if (analysis.overallAccuracy < 70) {
      recommendations.push('Practice reading aloud daily for 10-15 minutes');
      recommendations.push('Record yourself speaking and compare with native speakers');
    }
    
    if (analysis.fluencyScore < 60) {
      recommendations.push('Focus on speaking rhythm and natural pauses');
      recommendations.push('Practice speaking at a steady, comfortable pace');
    }
    
    if (analysis.clarityScore < 70) {
      recommendations.push('Practice individual word pronunciation');
      recommendations.push('Focus on mouth position and tongue placement');
    }
    
    return recommendations;
  }

  private async generateCulturalPronunciationNotes(
    language: string,
    culturalContext: string
  ): Promise<string[]> {
    const notes = [];
    
    if (language === 'en' && culturalContext.includes('uzbekistan')) {
      notes.push('English pronunciation for Uzbek speakers focuses on vowel distinctions');
      notes.push('Practice English stress patterns which are different from Uzbek');
      notes.push('Work on consonant clusters common in English but rare in Uzbek');
    }
    
    return notes;
  }

  // Utility methods
  private async generateAudioCacheKey(audioUri: string): Promise<string> {
    // Generate a cache key based on file content hash
    // This is a simplified implementation
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    return `audio_${fileInfo.size}_${fileInfo.modificationTime}`;
  }

  private async getAudioFormat(audioUri: string): Promise<string> {
    const extension = audioUri.substring(audioUri.lastIndexOf('.'));
    return extension.replace('.', '');
  }

  private async getAudioFileSize(audioUri: string): Promise<number> {
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    return fileInfo.size || 0;
  }

  private async cleanupProcessedFile(audioUri: string): Promise<void> {
    try {
      // Only cleanup if it's a temporary processed file
      if (audioUri.includes('processed_') || audioUri.includes('temp_')) {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
      }
    } catch (error) {
      console.warn('Failed to cleanup processed audio file:', error);
    }
  }

  private async processRealtimeAudio(
    recording: Audio.Recording,
    options: any
  ): Promise<void> {
    // Implementation for real-time audio processing
    // This would handle continuous audio chunks and transcription
  }

  // Usage statistics and monitoring
  async getWhisperUsageStatistics(): Promise<{
    totalTranscriptions: number;
    totalAudioDuration: number;
    averageAccuracy: number;
    languageBreakdown: Record<string, number>;
  }> {
    try {
      const stats = await this.memoryCache.get('whisper_usage_statistics') || {
        totalTranscriptions: 0,
        totalAudioDuration: 0,
        totalAccuracy: 0,
        languageBreakdown: {},
      };

      return {
        ...stats,
        averageAccuracy: stats.totalTranscriptions > 0 ? stats.totalAccuracy / stats.totalTranscriptions : 0,
      };
    } catch (error) {
      console.error('Failed to get Whisper usage statistics:', error);
      return {
        totalTranscriptions: 0,
        totalAudioDuration: 0,
        averageAccuracy: 0,
        languageBreakdown: {},
      };
    }
  }
}

// Export singleton instance
export const whisperService = new WhisperService();
export default whisperService;