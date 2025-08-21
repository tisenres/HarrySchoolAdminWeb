/**
 * culturalAdaptation.service.ts
 * Uzbekistan-specific cultural context and sensitivity adaptations
 */

import type { StudentAgeGroup } from '../../../navigation/types';

interface CulturalAdaptationConfig {
  ageGroup: StudentAgeGroup;
  nativeLanguage: 'uz' | 'ru';
  region: 'tashkent' | 'samarkand' | 'bukhara' | 'other';
}

interface CulturalFeedbackEnhancement {
  languageSupport: {
    uzbekInterference: string[];
    russianInterference: string[];
    positiveTransfer: string[];
  };
  motivationalFraming: {
    familyPride: string;
    communityValue: string;
    personalGrowth: string;
  };
  culturalExamples: {
    localContexts: string[];
    universalConnections: string[];
  };
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

class CulturalAdaptationService {
  private readonly CULTURAL_CONTEXTS = {
    uzbek: {
      commonDifficulties: [
        { sound: 'θ', difficulty: 'high', explanation: 'No equivalent in Uzbek' },
        { sound: 'w', difficulty: 'medium', explanation: 'Often replaced with /v/' },
        { sound: 'ŋ', difficulty: 'low', explanation: 'Similar to Uzbek /ŋ/' },
      ],
      strengths: [
        'Strong rolled /r/ helps with English /r/',
        'Clear vowel distinctions',
        'Good rhythmic patterns',
      ],
      culturalValues: {
        education: 'Family investment in learning',
        respect: 'Teacher authority and guidance',
        community: 'Learning benefits everyone',
        progress: 'Step-by-step improvement',
      },
    },
    russian: {
      commonDifficulties: [
        { sound: 'θ', difficulty: 'high', explanation: 'Not in Russian phonology' },
        { sound: 'w', difficulty: 'high', explanation: 'Russian has /v/ not /w/' },
        { sound: 'h', difficulty: 'medium', explanation: 'Often replaced with /x/' },
      ],
      strengths: [
        'Rich consonant system helps with clusters',
        'Palatalization awareness',
        'Stress pattern sensitivity',
      ],
      culturalValues: {
        education: 'Academic excellence tradition',
        respect: 'Structured learning approach',
        community: 'Collective achievement',
        progress: 'Systematic development',
      },
    },
  };

  async adaptSpeechFeedback(
    analysis: SpeechAnalysisResponse,
    ageGroup: StudentAgeGroup,
    nativeLanguage: 'uz' | 'ru'
  ): Promise<SpeechAnalysisResponse> {
    const culturalContext = this.CULTURAL_CONTEXTS[nativeLanguage];
    
    // Enhance mistakes with cultural context
    const enhancedMistakes = analysis.mistakes.map(mistake => ({
      ...mistake,
      culturalExplanation: this.getCulturalExplanation(mistake, culturalContext),
      practiceStrategy: this.getSuggestedPractice(mistake, ageGroup, nativeLanguage),
    }));

    // Add cultural strengths recognition
    const culturalStrengths = this.identifyCulturalStrengths(
      analysis.transcription,
      culturalContext,
      ageGroup
    );

    // Generate age-appropriate cultural notes
    const culturalNotes = this.generateCulturalNotes(
      analysis,
      ageGroup,
      nativeLanguage,
      culturalContext
    );

    return {
      ...analysis,
      mistakes: enhancedMistakes,
      strengths: [...analysis.strengths, ...culturalStrengths],
      culturalNotes,
      improvements: this.adaptImprovementsForCulture(
        analysis.improvements,
        ageGroup,
        nativeLanguage
      ),
    };
  }

  private getCulturalExplanation(
    mistake: PronunciationMistake,
    culturalContext: typeof this.CULTURAL_CONTEXTS.uzbek
  ): string {
    const difficulty = culturalContext.commonDifficulties.find(d => 
      mistake.phonemeError.includes(d.sound)
    );
    
    if (difficulty) {
      return difficulty.explanation;
    }
    
    return 'This sound pattern differs from your native language';
  }

  private getSuggestedPractice(
    mistake: PronunciationMistake,
    ageGroup: StudentAgeGroup,
    nativeLanguage: 'uz' | 'ru'
  ): string {
    const practices = {
      'θ': {
        '10-12': 'Try the "butterfly tongue" - put your tongue lightly between your teeth like a butterfly landing!',
        '13-15': 'Practice with mirror: tongue tip touches both top and bottom teeth gently',
        '16-18': 'Focus on interdental placement with light airflow - avoid complete blockage',
      },
      'w': {
        '10-12': 'Make your lips like you\'re going to kiss someone, then say "ooo"',
        '13-15': 'Round your lips, no tongue touching teeth. Think "water" not "vater"',
        '16-18': 'Contrast /w/ and /v/: /w/ is bilabial approximant, /v/ is labiodental fricative',
      },
    };

    const soundPattern = mistake.phonemeError.includes('θ') ? 'θ' : 
                        mistake.phonemeError.includes('w') ? 'w' : 'default';
    
    return practices[soundPattern as keyof typeof practices]?.[ageGroup] || 
           'Practice this sound slowly and repeat often';
  }

  private identifyCulturalStrengths(
    transcription: string,
    culturalContext: typeof this.CULTURAL_CONTEXTS.uzbek,
    ageGroup: StudentAgeGroup
  ): string[] {
    const strengths: string[] = [];
    
    // Check for cultural linguistic strengths
    if (transcription.includes('r') && culturalContext === this.CULTURAL_CONTEXTS.uzbek) {
      strengths.push(
        ageGroup === '10-12' 
          ? 'Your strong Uzbek "r" sound helps with English!'
          : 'Your native language "r" articulation is an advantage in English'
      );
    }

    if (culturalContext === this.CULTURAL_CONTEXTS.russian) {
      strengths.push(
        ageGroup === '10-12'
          ? 'Your Russian helps you with difficult English sounds!'
          : 'Your Russian phonological awareness supports English learning'
      );
    }

    return strengths;
  }

  private generateCulturalNotes(
    analysis: SpeechAnalysisResponse,
    ageGroup: StudentAgeGroup,
    nativeLanguage: 'uz' | 'ru',
    culturalContext: typeof this.CULTURAL_CONTEXTS.uzbek
  ): string {
    const baseMessages = {
      '10-12': [
        'Your family will be proud of your English practice!',
        'Speaking two languages makes your brain super strong!',
        'Every mistake helps you learn - keep trying!',
      ],
      '13-15': [
        'Your multilingual abilities are a real strength.',
        'These pronunciation skills will help you connect with people worldwide.',
        'Your effort and persistence show great character.',
      ],
      '16-18': [
        'Your linguistic diversity is valuable in our globalized world.',
        'These communication skills will serve you well in university and career.',
        'Your cultural perspective enriches English communication.',
      ],
    };

    const culturalSpecific = nativeLanguage === 'uz' ? [
      'Your Uzbek background gives you unique insights to share in English.',
      'The hospitality values in Uzbek culture translate beautifully to English communication.',
    ] : [
      'Your Russian language skills create strong foundations for English learning.',
      'The precision in Russian grammar awareness helps with English structure.',
    ];

    const messages = baseMessages[ageGroup];
    const randomBase = messages[Math.floor(Math.random() * messages.length)];
    const randomCultural = culturalSpecific[Math.floor(Math.random() * culturalSpecific.length)];

    return `${randomBase} ${randomCultural}`;
  }

  private adaptImprovementsForCulture(
    improvements: string[],
    ageGroup: StudentAgeGroup,
    nativeLanguage: 'uz' | 'ru'
  ): string[] {
    return improvements.map(improvement => {
      // Add family/community context for elementary students
      if (ageGroup === '10-12') {
        return `${improvement} - Practice with family members for extra fun!`;
      }
      
      // Add practical application for older students
      if (ageGroup === '16-18') {
        return `${improvement} - This will help in university presentations and job interviews.`;
      }
      
      return improvement;
    });
  }

  async generateCulturallyAppropriateContent(
    contentType: 'reading' | 'writing_prompt' | 'conversation_topic',
    ageGroup: StudentAgeGroup,
    topic?: string
  ): Promise<string> {
    const culturalThemes = {
      reading: {
        '10-12': [
          'A day at Chorsu Bazaar',
          'Making plov with grandmother',
          'Navruz celebration at school',
          'Playing in Tashkent parks',
        ],
        '13-15': [
          'Balancing tradition and modern life in Tashkent',
          'Friendship across different cultures',
          'Learning languages opens doors',
          'Technology and family connections',
        ],
        '16-18': [
          'University preparation and family expectations',
          'Career opportunities in Central Asia',
          'Cultural exchange and global citizenship',
          'Preserving heritage in a modern world',
        ],
      },
      writing_prompt: {
        '10-12': [
          'Write about your favorite family celebration.',
          'Describe a perfect day in Tashkent.',
          'Tell about a time you helped someone.',
        ],
        '13-15': [
          'How do you balance respect for elders with personal dreams?',
          'Describe how learning English helps your community.',
          'Write about a tradition you want to preserve.',
        ],
        '16-18': [
          'Analyze how globalization affects local culture.',
          'Discuss the role of education in family honor.',
          'Explore how multilingual skills benefit society.',
        ],
      },
      conversation_topic: {
        '10-12': [
          'Talking about your family traditions',
          'Describing your favorite foods',
          'Sharing your hobbies with friends',
        ],
        '13-15': [
          'Discussing future plans with respect for family',
          'Explaining Uzbek culture to international friends',
          'Debating modern vs traditional values',
        ],
        '16-18': [
          'Presenting on Central Asian contributions to world culture',
          'Interviewing for university or jobs',
          'Leading discussions on global issues',
        ],
      },
    };

    const themes = culturalThemes[contentType as keyof typeof culturalThemes]?.[ageGroup] || [];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    
    return randomTheme || `General ${contentType} activity`;
  }

  // Generate culturally appropriate feedback for text comprehension
  async adaptTextFeedback(
    originalFeedback: string,
    ageGroup: StudentAgeGroup,
    nativeLanguage: 'uz' | 'ru',
    comprehensionScore: number
  ): Promise<string> {
    const culturalContext = this.CULTURAL_CONTEXTS[nativeLanguage];
    
    let adaptedFeedback = originalFeedback;
    
    // Add cultural encouragement based on performance
    if (comprehensionScore >= 80) {
      if (ageGroup === '10-12') {
        adaptedFeedback += ' Your family must be very proud of your hard work!';
      } else if (ageGroup === '13-15') {
        adaptedFeedback += ' This shows the strong educational foundation your family has given you.';
      } else {
        adaptedFeedback += ' Your academic achievement reflects well on your family and community.';
      }
    } else if (comprehensionScore >= 60) {
      if (ageGroup === '10-12') {
        adaptedFeedback += ' Keep practicing - every step forward makes your teachers and family happy!';
      } else {
        adaptedFeedback += ' Your steady progress honors the investment your family has made in your education.';
      }
    } else {
      adaptedFeedback += ` Remember, learning English connects you to the world while keeping your ${nativeLanguage === 'uz' ? 'Uzbek' : 'Russian'} heritage strong.`;
    }
    
    return adaptedFeedback;
  }

  // Generate age and culturally appropriate writing prompts
  async generateWritingPrompt(
    ageGroup: StudentAgeGroup,
    promptType: 'creative' | 'analytical' | 'descriptive',
    nativeLanguage: 'uz' | 'ru' = 'uz'
  ): Promise<string> {
    const prompts = {
      creative: {
        '10-12': [
          'Write a story about a magical day in Registan Square, Samarkand.',
          'Imagine you could invite a famous person to share plov with your family. Who would it be and what would you talk about?',
          'Tell a story about a young hero who saves Navruz celebrations in their neighborhood.',
        ],
        '13-15': [
          'Write a story where a teenager must choose between studying abroad and staying to help their family business.',
          'Create a dialogue between a traditional craftsman and a young tech entrepreneur in modern Tashkent.',
          'Write about a day when all the languages in Uzbekistan could be heard as music.',
        ],
        '16-18': [
          'Craft a story exploring how a young person balances preserving cultural traditions with embracing global opportunities.',
          'Write a narrative about the Silk Road if it existed today, connecting Central Asian values with modern challenges.',
          'Create a story about a multilingual student who becomes a bridge between different communities.',
        ],
      },
      analytical: {
        '13-15': [
          'Compare how respect for elders is shown in Uzbek families versus what you\'ve learned about other cultures.',
          'Analyze why learning multiple languages gives you advantages in Central Asia.',
          'Examine how traditional Uzbek hospitality can be maintained in modern city life.',
        ],
        '16-18': [
          'Analyze the role of education in strengthening both individual success and community development in Uzbekistan.',
          'Evaluate how Central Asian nations can preserve cultural identity while participating in global economics.',
          'Examine the advantages and challenges of multilingual education in preparing students for international opportunities.',
        ],
      },
      descriptive: {
        '10-12': [
          'Describe your grandmother\'s house and all the wonderful smells, sounds, and memories there.',
          'Write about the most beautiful place in Uzbekistan you have visited or want to visit.',
          'Describe a traditional Uzbek celebration, helping someone from another country understand why it\'s special.',
        ],
        '13-15': [
          'Describe how Tashkent looks, sounds, and feels during different seasons, showing why you love your city.',
          'Write a detailed description of preparing a traditional meal with your family, including all the traditions involved.',
          'Describe what makes a good friend in your culture, with specific examples of friendship values.',
        ],
        '16-18': [
          'Provide a detailed analysis of how architecture in Uzbekistan reflects both historical influences and modern aspirations.',
          'Describe the economic and cultural significance of traditional crafts in modern Uzbekistan.',
          'Write a comprehensive description of how educational values in your family reflect broader Uzbek cultural principles.',
        ],
      },
    };

    const typePrompts = prompts[promptType]?.[ageGroup] || prompts[promptType]?.['13-15'] || [];
    const randomPrompt = typePrompts[Math.floor(Math.random() * typePrompts.length)];
    
    return randomPrompt || `Write a ${promptType} piece about your experiences and culture.`;
  }
}

export const culturalAdaptationService = new CulturalAdaptationService();