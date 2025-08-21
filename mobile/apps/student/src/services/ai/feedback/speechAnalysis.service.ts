/**
 * speechAnalysis.service.ts
 * Whisper API integration for pronunciation evaluation with cultural sensitivity
 */

import { culturalAdaptationService } from './culturalAdaptation.service';
import { dataMinimizer } from '../privacy/dataMinimizer.service';
import { localProcessor } from '../privacy/localProcessor.service';

// Type imports
import type { StudentAgeGroup } from '../../../navigation/types';

interface SpeechAnalysisRequest {
  audioUri: string;
  targetPhrase?: string;
  exerciseType: 'pronunciation' | 'conversation' | 'presentation';
  ageGroup: StudentAgeGroup;
  nativeLanguage?: 'uz' | 'ru';
}

interface SpeechAnalysisResponse {
  transcription: string;
  confidence: number;
  pronunciationScore: number;
  fluencyScore: number;
  prosodyScore: number;
  mistakes: PronunciationMistake[];
  strengths: string[];
  improvements: string[];
  culturalNotes?: string;
  teacherReviewRequired: boolean;
}

interface PronunciationMistake {
  word: string;
  expected: string;
  actual: string;
  phonemeError: string;
  suggestion: string;
  difficultyForUzbeks?: boolean;
  culturalExplanation?: string;
  practiceStrategy?: string;
}

interface WhisperResponse {
  text: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

class SpeechAnalysisService {
  private readonly WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
  private readonly GPT_API_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT = 30000; // 30 seconds

  async analyzeRecording(request: SpeechAnalysisRequest): Promise<SpeechAnalysisResponse> {
    try {
      // Step 1: Privacy preprocessing
      const processedAudio = await dataMinimizer.processAudioForAnalysis(request.audioUri);
      
      // Step 2: Attempt local processing first (for basic analysis)
      const localAnalysis = await this.attemptLocalAnalysis(processedAudio, request);
      
      if (localAnalysis.confidence > 0.8) {
        return this.enhanceWithCulturalContext(localAnalysis, request);
      }

      // Step 3: Cloud-based Whisper analysis for complex cases
      return await this.performCloudAnalysis(processedAudio, request);
    } catch (error) {
      console.error('Speech analysis failed:', error);
      return this.generateFallbackAnalysis(request);
    }
  }

  private async attemptLocalAnalysis(
    audioData: ArrayBuffer,
    request: SpeechAnalysisRequest
  ): Promise<Partial<SpeechAnalysisResponse>> {
    // Use local Whisper.cpp model for basic transcription
    const localResult = await localProcessor.transcribeAudio(audioData);
    
    if (!localResult.success) {
      return { confidence: 0 };
    }

    return {
      transcription: localResult.transcription,
      confidence: localResult.confidence,
      pronunciationScore: this.calculateBasicPronunciationScore(
        localResult.transcription,
        request.targetPhrase
      ),
    };
  }

  private async performCloudAnalysis(
    audioData: ArrayBuffer,
    request: SpeechAnalysisRequest
  ): Promise<SpeechAnalysisResponse> {
    // Step 1: Whisper transcription
    const transcriptionResult = await this.callWhisperAPI(audioData, request);
    
    // Step 2: GPT-4 analysis of transcription vs target
    const analysisResult = await this.analyzeTranscriptionWithGPT4(
      transcriptionResult,
      request
    );

    // Step 3: Cultural adaptation
    const culturallyAdapted = await culturalAdaptationService.adaptSpeechFeedback(
      analysisResult,
      request.ageGroup,
      request.nativeLanguage || 'uz'
    );

    return culturallyAdapted;
  }

  private async callWhisperAPI(
    audioData: ArrayBuffer,
    request: SpeechAnalysisRequest
  ): Promise<WhisperResponse> {
    const formData = new FormData();
    
    // Convert audio to appropriate format for Whisper
    const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
    formData.append('file', audioBlob, 'recording.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');

    const response = await this.fetchWithRetry(this.WHISPER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private async analyzeTranscriptionWithGPT4(
    whisperResult: WhisperResponse,
    request: SpeechAnalysisRequest
  ): Promise<SpeechAnalysisResponse> {
    const systemPrompt = this.buildAnalysisPrompt(request);
    
    const analysisResponse = await this.fetchWithRetry(this.GPT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: JSON.stringify({
              transcription: whisperResult.text,
              targetPhrase: request.targetPhrase,
              wordTimestamps: whisperResult.words,
              exerciseType: request.exerciseType,
            }),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error(`GPT-4 API error: ${analysisResponse.statusText}`);
    }

    const result = await analysisResponse.json();
    return JSON.parse(result.choices[0].message.content);
  }

  private buildAnalysisPrompt(request: SpeechAnalysisRequest): string {
    const basePrompt = `You are an English pronunciation evaluator for Harry School in Tashkent, Uzbekistan.

Student Profile:
- Age Group: ${request.ageGroup}
- Native Language: ${request.nativeLanguage === 'ru' ? 'Russian' : 'Uzbek'}
- Exercise Type: ${request.exerciseType}
- Target Phrase: "${request.targetPhrase}"

Your task is to analyze the student's pronunciation and provide culturally sensitive, age-appropriate feedback.

Evaluation Criteria:
1. Pronunciation Accuracy (40%): How closely the pronunciation matches native English
2. Fluency (30%): Smoothness and natural rhythm of speech
3. Prosody (20%): Stress, intonation, and rhythm patterns
4. Confidence (10%): Clear delivery without excessive hesitation

Uzbek/Russian Speaker Considerations:
- Common difficulty areas: /θ/ (th), /w/ vs /v/, final consonant clusters
- Acknowledge interference from native language patterns respectfully
- Suggest practice methods familiar to Central Asian learners
- Emphasize communication effectiveness over perfect accent

Age-Appropriate Feedback:`;

    if (request.ageGroup === '10-12') {
      return basePrompt + `
Elementary (10-12): Encouraging and Playful
- Use simple, positive language
- Celebrate effort and improvement
- Compare to familiar sounds in Uzbek/Russian when helpful
- Include fun practice suggestions
- Avoid technical terminology
- Focus on biggest improvements first

Example feedback tone: "Great job trying! Your 'th' sound is getting better. It's like putting your tongue between your teeth, just like when you blow out a candle. Let's practice with some fun tongue twisters!"`;
    } else if (request.ageGroup === '13-15') {
      return basePrompt + `
Middle School (13-15): Balanced and Growth-Oriented
- Provide specific, actionable feedback
- Explain why certain sounds are challenging for Uzbek speakers
- Connect to real-world communication goals
- Balance encouragement with detailed guidance
- Acknowledge cultural speaking patterns respectfully

Example feedback tone: "Your pronunciation shows good improvement! The 'w' sound is tricky for Uzbek speakers because we have 'v' in our language. Try rounding your lips more and making sure air flows freely - no tongue touching your teeth."`;
    } else {
      return basePrompt + `
High School (16-18): Detailed and Professional
- Provide comprehensive phonetic analysis
- Connect to academic and professional communication
- Offer advanced practice techniques
- Discuss regional accent variation acceptance
- Focus on communication effectiveness over perfection

Example feedback tone: "Your speech demonstrates strong communicative competence. For the interdental fricative /θ/, consider the tongue tip position relative to the dental ridge. This phoneme challenges many L1 Uzbek speakers due to L1 transfer effects. Your multilingual background is actually an asset - use your metalinguistic awareness to monitor and adjust."`;
    }

    return basePrompt + `
Response Format (JSON):
{
  "transcription": "what the student actually said",
  "confidence": 0.85,
  "pronunciationScore": 78,
  "fluencyScore": 82,
  "prosodyScore": 75,
  "mistakes": [
    {
      "word": "three",
      "expected": "/θriː/",
      "actual": "/triː/",
      "phonemeError": "θ→t substitution",
      "suggestion": "Place tongue tip between teeth",
      "difficultyForUzbeks": true
    }
  ],
  "strengths": ["Clear vowel sounds", "Good rhythm"],
  "improvements": ["Practice th sounds", "Work on final consonants"],
  "culturalNotes": "Your strong 'r' sound from Uzbek actually helps with English - use that strength!",
  "teacherReviewRequired": false
}`;
  }

  private calculateBasicPronunciationScore(
    transcription: string,
    targetPhrase?: string
  ): number {
    if (!targetPhrase) return 75; // Default score for open-ended exercises

    // Simple word-based comparison for local processing
    const targetWords = targetPhrase.toLowerCase().split(' ');
    const actualWords = transcription.toLowerCase().split(' ');
    
    const matches = targetWords.filter(word => 
      actualWords.some(actual => this.calculateWordSimilarity(word, actual) > 0.7)
    );

    return Math.round((matches.length / targetWords.length) * 100);
  }

  private calculateWordSimilarity(target: string, actual: string): number {
    // Levenshtein distance normalized
    const distance = this.levenshteinDistance(target, actual);
    const maxLength = Math.max(target.length, actual.length);
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private generateFallbackAnalysis(request: SpeechAnalysisRequest): SpeechAnalysisResponse {
    // Offline fallback when AI analysis fails
    return {
      transcription: "Audio recorded successfully",
      confidence: 0.6,
      pronunciationScore: 75,
      fluencyScore: 70,
      prosodyScore: 70,
      mistakes: [],
      strengths: ["Practice completed"],
      improvements: ["Your teacher will provide detailed feedback"],
      culturalNotes: "Keep practicing - every attempt helps you improve!",
      teacherReviewRequired: true,
    };
  }

  private async enhanceWithCulturalContext(
    analysis: Partial<SpeechAnalysisResponse>,
    request: SpeechAnalysisRequest
  ): Promise<SpeechAnalysisResponse> {
    return culturalAdaptationService.adaptSpeechFeedback(
      analysis as SpeechAnalysisResponse,
      request.ageGroup,
      request.nativeLanguage || 'uz'
    );
  }

  private async fetchWithRetry(
    url: string, 
    options: RequestInit, 
    retries: number = this.MAX_RETRIES
  ): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return response;
        }
        
        if (response.status >= 400 && response.status < 500) {
          // Client error, don't retry
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (attempt === retries) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('Max retries exceeded');
  }
}

export const speechAnalysisService = new SpeechAnalysisService();