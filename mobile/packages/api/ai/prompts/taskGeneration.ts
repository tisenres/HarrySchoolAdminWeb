/**
 * Structured Prompts for AI Task Generation
 * Harry School CRM - Mobile AI Services
 * 
 * This module contains structured prompt templates for generating
 * educational content with cultural sensitivity and Islamic values integration.
 */

// Cultural Context Configuration
export const CulturalContexts = {
  ISLAMIC: 'islamic',
  UZBEKISTAN: 'uzbekistan',
  MULTICULTURAL: 'multicultural',
  WESTERN: 'western',
  GENERAL: 'general',
} as const;

export type CulturalContext = typeof CulturalContexts[keyof typeof CulturalContexts];

// Islamic Values Framework
export const IslamicValues = {
  TAWHID: 'tawhid', // Unity and oneness of Allah
  AKHLAQ: 'akhlaq', // Islamic moral character
  ADL: 'adl', // Justice and fairness
  HIKMAH: 'hikmah', // Wisdom and knowledge
  TAQWA: 'taqwa', // God-consciousness
  IHSAN: 'ihsan', // Excellence in worship and conduct
  UMMAH: 'ummah', // Community and brotherhood
  HALAL: 'halal', // Permissible and lawful
} as const;

export type IslamicValue = typeof IslamicValues[keyof typeof IslamicValues];

// Task Types
export const TaskTypes = {
  QUIZ: 'quiz',
  READING: 'reading',
  VOCABULARY: 'vocabulary',
  WRITING: 'writing',
  LISTENING: 'listening',
  SPEAKING: 'speaking',
  GRAMMAR: 'grammar',
  CONVERSATION: 'conversation',
} as const;

export type TaskType = typeof TaskTypes[keyof typeof TaskTypes];

// Difficulty Levels
export const DifficultyLevels = {
  BEGINNER: 1,
  ELEMENTARY: 2,
  INTERMEDIATE: 3,
  UPPER_INTERMEDIATE: 4,
  ADVANCED: 5,
} as const;

// Base System Prompts
export class SystemPrompts {
  // Main system prompt for educational content generation
  static getEducationalSystemPrompt(culturalContext: CulturalContext): string {
    const basePrompt = `You are an AI assistant specialized in creating educational content for Harry School, a private English language center in Tashkent, Uzbekistan.

MISSION: Generate high-quality, culturally-sensitive educational content that respects Islamic values and Uzbekistan cultural norms while maintaining excellent pedagogical standards.

CULTURAL GUIDELINES:
${this.getCulturalGuidelines(culturalContext)}

ISLAMIC VALUES INTEGRATION:
- Tawhid (Unity): Emphasize unity in learning and community
- Akhlaq (Character): Promote good moral character and ethics
- Adl (Justice): Ensure fair and balanced content representation
- Hikmah (Wisdom): Focus on wisdom and deep understanding
- Taqwa (God-consciousness): Encourage mindfulness and reflection

EDUCATIONAL STANDARDS:
- Create age-appropriate content for specified grade levels
- Ensure clear learning objectives and measurable outcomes
- Use engaging, interactive, and culturally relevant examples
- Support multilingual learners (English, Uzbek, Russian, Arabic)
- Follow international ESL/EFL best practices

CONTENT REQUIREMENTS:
- Family-friendly and culturally appropriate
- Respectful of Islamic teachings and Uzbekistan traditions
- Inclusive and accessible for diverse learning styles
- Practical and applicable to real-life situations
- Encouraging and motivational for student success`;

    return basePrompt;
  }

  // Cultural guidelines based on context
  private static getCulturalGuidelines(context: CulturalContext): string {
    const guidelines = {
      [CulturalContexts.ISLAMIC]: `
- Integrate Islamic values naturally into educational content
- Avoid content that conflicts with Islamic teachings
- Use examples from Islamic history, culture, and traditions
- Respect prayer times and Islamic calendar considerations
- Emphasize community, family, and moral values`,

      [CulturalContexts.UZBEKISTAN]: `
- Include references to Uzbekistan culture, history, and traditions
- Use local context and familiar examples from Tashkent and Uzbekistan
- Respect local customs and cultural sensitivities
- Consider multilingual aspects (Uzbek, Russian, English)
- Incorporate traditional values of respect and community`,

      [CulturalContexts.MULTICULTURAL]: `
- Celebrate diversity while maintaining cultural sensitivity
- Include examples from various cultures respectfully
- Promote understanding and tolerance across cultures
- Avoid stereotypes and cultural assumptions
- Encourage global perspectives while respecting local values`,

      [CulturalContexts.GENERAL]: `
- Maintain neutral cultural stance with broad applicability
- Focus on universal human values and experiences
- Use inclusive language and examples
- Avoid culturally specific assumptions
- Emphasize common educational goals and values`,
    };

    return guidelines[context] || guidelines[CulturalContexts.GENERAL];
  }

  // Specialized system prompt for pronunciation and speaking tasks
  static getPronunciationSystemPrompt(): string {
    return `You are an expert pronunciation and speaking instructor specializing in English language learning for Uzbek speakers.

EXPERTISE AREAS:
- English phonetics and phonology
- Uzbek-English pronunciation challenges
- Cultural considerations in language learning
- Islamic educational principles

SPECIFIC FOCUS:
- Address common pronunciation difficulties for Uzbek speakers
- Provide culturally sensitive pronunciation guidance
- Create exercises that respect Islamic values
- Offer encouragement and positive reinforcement

LINGUISTIC CONSIDERATIONS:
- English sounds that don't exist in Uzbek: /θ/, /ð/, /w/, etc.
- Vowel distinctions challenging for Uzbek speakers
- Consonant clusters uncommon in Uzbek
- English stress and intonation patterns`;
  }

  // System prompt for cultural validation
  static getCulturalValidationPrompt(): string {
    return `You are a cultural validation expert for Islamic educational content in Uzbekistan.

VALIDATION CRITERIA:
1. Islamic Values Alignment
   - Does the content respect Islamic teachings?
   - Are there any elements that conflict with Islamic principles?
   - Is the content family-appropriate for Muslim families?

2. Cultural Appropriateness
   - Is the content suitable for Uzbekistan context?
   - Does it respect local customs and traditions?
   - Are examples culturally relevant and appropriate?

3. Educational Suitability
   - Is the content pedagogically sound?
   - Does it serve educational objectives effectively?
   - Is it age-appropriate for the target audience?

FEEDBACK REQUIREMENTS:
- Provide specific feedback on cultural sensitivity
- Suggest improvements for better cultural integration
- Highlight positive aspects of cultural alignment
- Offer alternative approaches when needed`;
  }
}

// Task-Specific Prompt Templates
export class TaskPromptTemplates {
  // Quiz Generation Template
  static getQuizPrompt(params: {
    topic: string;
    difficulty: number;
    questionCount: number;
    islamicValues?: IslamicValue[];
    culturalContext: CulturalContext;
  }): string {
    return `Generate an educational quiz with the following specifications:

TOPIC: ${params.topic}
DIFFICULTY LEVEL: ${params.difficulty}/5
NUMBER OF QUESTIONS: ${params.questionCount}
CULTURAL CONTEXT: ${params.culturalContext}
ISLAMIC VALUES: ${params.islamicValues?.join(', ') || 'General Islamic principles'}

QUIZ REQUIREMENTS:
1. Create engaging multiple-choice questions with 4 options each
2. Include clear explanations for correct answers
3. Incorporate Islamic values naturally into content
4. Use culturally appropriate examples from Uzbekistan context
5. Ensure questions are pedagogically sound and age-appropriate

QUESTION TYPES TO INCLUDE:
- Factual knowledge questions
- Application and understanding questions
- Cultural context questions
- Values-based scenarios

CULTURAL INTEGRATION:
- Use names common in Uzbekistan (e.g., Aziz, Malika, Bobur, Nilufar)
- Reference familiar places and contexts
- Include Islamic moral principles in scenarios
- Ensure family-friendly content throughout

OUTPUT FORMAT:
Provide structured JSON with questions, options, correct answers, explanations, and cultural context notes.`;
  }

  // Reading Passage Generation Template
  static getReadingPrompt(params: {
    topic: string;
    difficulty: number;
    length: string;
    islamicValues?: IslamicValue[];
    culturalContext: CulturalContext;
  }): string {
    return `Create a reading passage with comprehension questions:

TOPIC: ${params.topic}
DIFFICULTY LEVEL: ${params.difficulty}/5
PASSAGE LENGTH: ${params.length}
CULTURAL CONTEXT: ${params.culturalContext}
ISLAMIC VALUES: ${params.islamicValues?.join(', ') || 'General Islamic principles'}

PASSAGE REQUIREMENTS:
1. Create an engaging, age-appropriate narrative or informational text
2. Integrate Islamic values and Uzbekistan cultural elements naturally
3. Use vocabulary appropriate for the specified difficulty level
4. Include moral lessons or positive character development
5. Ensure content is educational and culturally sensitive

COMPREHENSION QUESTIONS:
1. Literal comprehension (what happened?)
2. Inferential questions (why did it happen?)
3. Critical thinking questions (what do you think about...?)
4. Cultural reflection questions (how does this relate to our values?)
5. Vocabulary questions (meaning of key words)

CULTURAL ELEMENTS TO INCLUDE:
- Traditional Uzbek values of respect and community
- Islamic principles of kindness, honesty, and justice
- Local contexts familiar to students in Tashkent
- Family and community relationships
- Educational and moral lessons

OUTPUT FORMAT:
Provide the passage text, comprehension questions with answers, vocabulary list, and cultural discussion points.`;
  }

  // Vocabulary Building Template
  static getVocabularyPrompt(params: {
    theme: string;
    difficulty: number;
    wordCount: number;
    islamicValues?: IslamicValue[];
    culturalContext: CulturalContext;
  }): string {
    return `Generate a vocabulary learning set focused on:

THEME: ${params.theme}
DIFFICULTY LEVEL: ${params.difficulty}/5
NUMBER OF WORDS: ${params.wordCount}
CULTURAL CONTEXT: ${params.culturalContext}
ISLAMIC VALUES: ${params.islamicValues?.join(', ') || 'General Islamic principles'}

VOCABULARY REQUIREMENTS:
1. Select words relevant to the theme and appropriate for difficulty level
2. Provide clear, culturally appropriate definitions
3. Create example sentences using Islamic and Uzbekistan contexts
4. Include pronunciation guidance for challenging words
5. Suggest memory techniques and cultural associations

CULTURAL INTEGRATION:
- Use examples from daily life in Uzbekistan
- Include references to Islamic culture and practices
- Create sentences with moral and ethical contexts
- Use familiar names and places from local context

LEARNING ACTIVITIES:
1. Definition matching exercises
2. Context-based fill-in-the-blank activities
3. Cultural scenario applications
4. Pronunciation practice guides
5. Memory association techniques

OUTPUT FORMAT:
Provide structured vocabulary entries with definitions, examples, cultural contexts, pronunciation guides, and learning activities.`;
  }

  // Writing Task Template
  static getWritingPrompt(params: {
    taskType: string;
    topic: string;
    difficulty: number;
    islamicValues?: IslamicValue[];
    culturalContext: CulturalContext;
  }): string {
    return `Create a writing task with cultural and Islamic values integration:

WRITING TASK TYPE: ${params.taskType}
TOPIC: ${params.topic}
DIFFICULTY LEVEL: ${params.difficulty}/5
CULTURAL CONTEXT: ${params.culturalContext}
ISLAMIC VALUES: ${params.islamicValues?.join(', ') || 'General Islamic principles'}

WRITING TASK REQUIREMENTS:
1. Provide clear, engaging writing prompts
2. Include detailed instructions and expectations
3. Integrate Islamic values and cultural elements naturally
4. Offer structured guidance for different skill levels
5. Provide assessment rubrics and feedback criteria

PROMPT ELEMENTS:
- Inspiring and culturally relevant scenarios
- Clear objectives and expected outcomes
- Islamic moral and ethical considerations
- Local context and familiar situations
- Encouraging and motivational language

CULTURAL GUIDANCE:
- Suggest topics that align with Islamic values
- Provide examples of appropriate content
- Include discussion of cultural sensitivity
- Offer alternative perspectives when appropriate

ASSESSMENT CRITERIA:
1. Content quality and relevance
2. Cultural sensitivity and appropriateness
3. Language accuracy and fluency
4. Creativity and originality
5. Integration of Islamic values

OUTPUT FORMAT:
Provide writing prompts, detailed instructions, cultural guidance, assessment rubrics, and example responses.`;
  }

  // Listening Exercise Template
  static getListeningPrompt(params: {
    scenario: string;
    difficulty: number;
    duration: string;
    islamicValues?: IslamicValue[];
    culturalContext: CulturalContext;
  }): string {
    return `Design a listening comprehension exercise:

SCENARIO: ${params.scenario}
DIFFICULTY LEVEL: ${params.difficulty}/5
AUDIO DURATION: ${params.duration}
CULTURAL CONTEXT: ${params.culturalContext}
ISLAMIC VALUES: ${params.islamicValues?.join(', ') || 'General Islamic principles'}

LISTENING EXERCISE REQUIREMENTS:
1. Create realistic dialogue or monologue scenarios
2. Integrate Islamic values and Uzbekistan cultural elements
3. Include diverse accents and speaking styles appropriately
4. Design engaging comprehension questions
5. Provide transcript and answer keys

SCENARIO ELEMENTS:
- Culturally appropriate situations and contexts
- Realistic characters with Islamic names
- Moral and educational themes
- Family and community interactions
- Respectful and positive messaging

COMPREHENSION ACTIVITIES:
1. General understanding questions
2. Specific detail identification
3. Cultural context discussions
4. Values-based reflection questions
5. Pronunciation and intonation practice

CULTURAL CONSIDERATIONS:
- Use appropriate Islamic greetings and expressions
- Include references to local customs and traditions
- Respect gender interaction guidelines
- Incorporate educational and moral lessons

OUTPUT FORMAT:
Provide audio script, comprehension questions, cultural notes, teaching suggestions, and assessment guidelines.`;
  }
}

// Prompt Enhancement Utilities
export class PromptEnhancers {
  // Add Islamic values integration to any prompt
  static addIslamicValues(basePrompt: string, values: IslamicValue[]): string {
    const valueDescriptions = {
      [IslamicValues.TAWHID]: 'Unity and oneness of Allah - emphasize unity in learning and community',
      [IslamicValues.AKHLAQ]: 'Islamic moral character - promote good ethics and behavior',
      [IslamicValues.ADL]: 'Justice and fairness - ensure balanced and fair representation',
      [IslamicValues.HIKMAH]: 'Wisdom and knowledge - focus on deep understanding and insight',
      [IslamicValues.TAQWA]: 'God-consciousness - encourage mindfulness and reflection',
      [IslamicValues.IHSAN]: 'Excellence in worship and conduct - strive for excellence in all aspects',
      [IslamicValues.UMMAH]: 'Community and brotherhood - emphasize community and cooperation',
      [IslamicValues.HALAL]: 'Permissible and lawful - ensure content is appropriate and acceptable',
    };

    const valuesIntegration = values.map(value => 
      `- ${valueDescriptions[value]}`
    ).join('\n');

    return `${basePrompt}

ISLAMIC VALUES INTEGRATION:
${valuesIntegration}

Integrate these values naturally and appropriately throughout the educational content.`;
  }

  // Add cultural sensitivity guidelines
  static addCulturalSensitivity(basePrompt: string, context: CulturalContext): string {
    const sensitivityGuidelines = {
      [CulturalContexts.ISLAMIC]: `
CULTURAL SENSITIVITY GUIDELINES:
- Ensure all content aligns with Islamic teachings and principles
- Avoid topics that may be considered inappropriate in Islamic culture
- Use respectful language when discussing religious and cultural topics
- Include positive representations of Islamic values and practices`,

      [CulturalContexts.UZBEKISTAN]: `
CULTURAL SENSITIVITY GUIDELINES:
- Include references to Uzbekistan culture, history, and traditions
- Use local context and examples familiar to students in Tashkent
- Respect traditional Uzbek values of family, community, and respect for elders
- Consider the multilingual environment (Uzbek, Russian, English)`,

      [CulturalContexts.MULTICULTURAL]: `
CULTURAL SENSITIVITY GUIDELINES:
- Celebrate diversity while maintaining respect for all cultures
- Avoid stereotypes and generalizations about any culture
- Promote understanding and tolerance across different backgrounds
- Ensure inclusive representation in examples and scenarios`,
    };

    const guidelines = sensitivityGuidelines[context] || '';
    return `${basePrompt}${guidelines}`;
  }

  // Add assessment and feedback guidelines
  static addAssessmentGuidelines(basePrompt: string): string {
    return `${basePrompt}

ASSESSMENT AND FEEDBACK GUIDELINES:
1. Provide clear, constructive feedback that encourages learning
2. Use positive reinforcement aligned with Islamic principles of encouragement
3. Offer specific suggestions for improvement with cultural sensitivity
4. Include self-reflection questions that promote personal growth
5. Ensure feedback is appropriate for the cultural and educational context

FEEDBACK PRINCIPLES:
- Be encouraging and supportive (following Islamic principles of kindness)
- Provide specific, actionable suggestions for improvement
- Celebrate progress and effort alongside achievement
- Include cultural and values-based reflection opportunities
- Maintain respect for individual learning styles and backgrounds`;
  }
}

// Prompt Validation and Quality Assurance
export class PromptValidator {
  // Validate prompt for cultural appropriateness
  static validateCulturalContent(prompt: string, context: CulturalContext): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for potentially inappropriate content
    const inappropriateTerms = ['alcohol', 'pork', 'gambling', 'inappropriate relationships'];
    const lowerPrompt = prompt.toLowerCase();

    inappropriateTerms.forEach(term => {
      if (lowerPrompt.includes(term)) {
        issues.push(`Contains potentially inappropriate term: ${term}`);
        suggestions.push(`Consider removing or replacing references to ${term}`);
      }
    });

    // Check for Islamic values integration
    const islamicTerms = ['islamic', 'muslim', 'allah', 'respect', 'kindness', 'wisdom'];
    const hasIslamicContent = islamicTerms.some(term => lowerPrompt.includes(term));

    if (context === CulturalContexts.ISLAMIC && !hasIslamicContent) {
      suggestions.push('Consider adding more explicit Islamic values integration');
    }

    // Check for Uzbekistan context
    const uzbekTerms = ['uzbekistan', 'tashkent', 'uzbek', 'local'];
    const hasUzbekContent = uzbekTerms.some(term => lowerPrompt.includes(term));

    if (context === CulturalContexts.UZBEKISTAN && !hasUzbekContent) {
      suggestions.push('Consider adding more Uzbekistan cultural context');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }

  // Validate prompt for educational quality
  static validateEducationalContent(prompt: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for learning objectives
    if (!prompt.includes('objective') && !prompt.includes('goal') && !prompt.includes('learn')) {
      suggestions.push('Consider adding explicit learning objectives');
    }

    // Check for assessment criteria
    if (!prompt.includes('assess') && !prompt.includes('evaluate') && !prompt.includes('measure')) {
      suggestions.push('Consider including assessment or evaluation criteria');
    }

    // Check for engagement elements
    const engagementTerms = ['engaging', 'interactive', 'motivating', 'interesting'];
    const hasEngagement = engagementTerms.some(term => prompt.toLowerCase().includes(term));

    if (!hasEngagement) {
      suggestions.push('Consider adding elements to make content more engaging');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }
}

// Export all prompt templates and utilities
export {
  SystemPrompts,
  TaskPromptTemplates,
  PromptEnhancers,
  PromptValidator,
};

// Default export for easy importing
export default {
  SystemPrompts,
  TaskPromptTemplates,
  PromptEnhancers,
  PromptValidator,
  CulturalContexts,
  IslamicValues,
  TaskTypes,
  DifficultyLevels,
};