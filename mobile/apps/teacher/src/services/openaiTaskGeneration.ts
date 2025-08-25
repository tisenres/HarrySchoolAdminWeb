import OpenAI from 'openai';
import { z } from 'zod';

// OpenAI client configuration with provided API key
const openai = new OpenAI({
  apiKey: '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',
});

// Zod schemas for structured outputs based on AI system architecture
const IslamicValuesSchema = z.object({
  tawhid: z.boolean().describe('Unity and oneness of Allah'),
  akhlaq: z.boolean().describe('Islamic moral character'),
  adl: z.boolean().describe('Justice and fairness'),
  hikmah: z.boolean().describe('Wisdom and knowledge'),
  taqwa: z.boolean().describe('God-consciousness'),
});

const CulturalContextSchema = z.object({
  uzbekistanRelevance: z.number().min(0).max(1).describe('Relevance to Uzbekistan culture (0-1)'),
  islamicAlignment: z.number().min(0).max(1).describe('Alignment with Islamic values (0-1)'),
  languageAppropriateness: z.number().min(0).max(1).describe('Language appropriateness (0-1)'),
  familyFriendly: z.boolean().describe('Appropriate for family discussion'),
  culturalSensitivity: z.number().min(0).max(1).describe('Cultural sensitivity score (0-1)'),
});

const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['multiple_choice', 'short_answer', 'essay', 'listening', 'reading']),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number()]).optional(),
  explanation: z.string().optional(),
  islamicContext: z.string().optional(),
  culturalRelevance: z.number().min(0).max(1),
  difficultyLevel: z.number().min(1).max(5),
});

const PassageSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  difficulty: z.number().min(1).max(5),
  culturalContext: z.string(),
  islamicValues: z.array(z.string()),
  vocabularyLevel: z.enum(['elementary', 'intermediate', 'advanced']),
  readingTime: z.number().describe('Estimated reading time in minutes'),
});

const VocabularySchema = z.object({
  word: z.string(),
  definition: z.string(),
  example: z.string(),
  culturalContext: z.string().optional(),
  islamicRelevance: z.boolean().optional(),
  difficulty: z.number().min(1).max(5),
  uzbekTranslation: z.string().optional(),
});

const TaskContentSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  instructions: z.string(),
  content: z.object({
    questions: z.array(QuestionSchema).optional(),
    passages: z.array(PassageSchema).optional(),
    vocabulary: z.array(VocabularySchema).optional(),
  }),
  metadata: z.object({
    taskType: z.string(),
    difficulty: z.number().min(1).max(5),
    estimatedDuration: z.number().describe('Estimated completion time in minutes'),
    culturalAppropriatenessScore: z.number().min(0).max(1),
    islamicValuesAlignment: z.number().min(0).max(1),
    factualAccuracy: z.number().min(0).max(1),
    educationalValue: z.number().min(0).max(5),
    generationTime: z.number(),
    tokensUsed: z.number(),
    cost: z.number(),
  }),
  culturalContext: CulturalContextSchema,
  islamicValues: IslamicValuesSchema,
});

// Task generation parameters interface
interface TaskGenerationRequest {
  taskType: 'reading_comprehension' | 'vocabulary' | 'writing_prompt' | 'listening' | 'grammar' | 'cultural_quiz';
  parameters: {
    topic: string;
    difficultyLevel: 1 | 2 | 3 | 4 | 5;
    contentLength: 'short' | 'medium' | 'long';
    questionFormat: string;
    culturalContext: 'uzbekistan' | 'islamic' | 'global' | 'mixed';
    languageComplexity: 'elementary' | 'intermediate' | 'advanced';
    islamicValues: string[];
    languagePreference: 'en' | 'uz' | 'ru' | 'ar';
    islamicCalendarContext?: any;
    prayerTimeAwareness?: any;
    culturalExamples?: boolean;
  };
  qualityTargets: {
    culturalAppropriatenessThreshold: number;
    educationalValueScore: number;
    factualAccuracyThreshold: number;
    islamicValuesAlignment: number;
  };
}

interface TaskGenerationResult {
  success: boolean;
  content?: z.infer<typeof TaskContentSchema>;
  error?: string;
  culturalScore?: number;
  cost?: number;
  tokensUsed?: number;
  generationTime?: number;
}

// Cultural validation prompts based on research findings
const CULTURAL_VALIDATION_PROMPTS = {
  uzbekistan: `
    Ensure all content is appropriate for Uzbekistan's cultural context:
    - Respect for Islamic values and traditions
    - Use of local examples and cultural references where appropriate
    - Sensitivity to family structures and social norms
    - Appropriate language formality levels
    - Consideration of multilingual environment (Uzbek, Russian, Arabic)
  `,
  islamic: `
    Validate content against Islamic educational principles:
    - No content that contradicts Islamic beliefs or values
    - Respectful treatment of religious topics
    - Emphasis on moral and ethical development
    - Family-centered values and community respect
    - Appropriate gender considerations in educational contexts
  `,
  global: `
    Adapt global content for Islamic educational context:
    - Remove or modify culturally inappropriate elements
    - Add Islamic perspective where relevant
    - Ensure examples are culturally accessible
    - Maintain educational value while respecting cultural boundaries
  `,
  mixed: `
    Balance international content with local cultural sensitivity:
    - Present diverse perspectives while maintaining Islamic values
    - Use culturally neutral examples where possible
    - Provide local context for international concepts
    - Ensure cultural appropriateness for Uzbek families
  `,
};

// Prompt templates based on teacher mental models and UX research
const TASK_GENERATION_PROMPTS = {
  reading_comprehension: `
    Create a reading comprehension task following these guidelines:
    
    CULTURAL REQUIREMENTS:
    - Content must be appropriate for Islamic educational context
    - Include examples relevant to Uzbekistan culture when possible
    - Respect family values and community orientation
    - Use respectful, formal language appropriate for teacher-student relationship
    
    EDUCATIONAL REQUIREMENTS:
    - Difficulty level: {difficulty}/5
    - Reading level: {languageComplexity}
    - Topic focus: {topic}
    - Estimated completion: {estimatedTime} minutes
    
    ISLAMIC VALUES INTEGRATION:
    - Incorporate these Islamic values naturally: {islamicValues}
    - Ensure content promotes positive moral development
    - Include family and community-centered themes where appropriate
    
    CONTENT STRUCTURE:
    - Create 1-2 passages (300-800 words total for medium length)
    - Include 5-8 comprehension questions of varied types
    - Provide cultural context explanations where needed
    - Include vocabulary support for non-native speakers
    
    QUALITY TARGETS:
    - Cultural appropriateness: ≥95%
    - Educational value: ≥4.0/5.0
    - Islamic values alignment: ≥95%
    - Factual accuracy: ≥98%
  `,
  
  vocabulary: `
    Generate vocabulary exercises following these specifications:
    
    CULTURAL ADAPTATION:
    - Select vocabulary relevant to Islamic educational context
    - Include culturally appropriate examples and usage
    - Provide Uzbek translations where helpful
    - Use examples from daily life in Uzbekistan
    
    EDUCATIONAL STRUCTURE:
    - Difficulty level: {difficulty}/5
    - Topic area: {topic}
    - Language complexity: {languageComplexity}
    - Include 15-25 vocabulary items
    
    ISLAMIC VALUES INTEGRATION:
    - Connect vocabulary to Islamic concepts where natural
    - Use moral and ethical examples
    - Include community and family-oriented contexts
    
    EXERCISE TYPES:
    - Definition matching
    - Contextual usage
    - Cultural examples
    - Translation exercises (English ↔ Uzbek)
    - Sentence construction with cultural context
  `,
  
  writing_prompt: `
    Create culturally sensitive writing prompts:
    
    CULTURAL CONSIDERATIONS:
    - Topics appropriate for Islamic educational environment
    - Prompts that encourage positive moral reflection
    - Family and community-centered themes
    - Respect for cultural values and traditions
    
    EDUCATIONAL FRAMEWORK:
    - Difficulty: {difficulty}/5
    - Topic: {topic}
    - Writing level: {languageComplexity}
    - Expected length: {contentLength}
    
    ISLAMIC VALUES EMPHASIS:
    - Integrate: {islamicValues}
    - Encourage moral and ethical thinking
    - Promote community awareness and responsibility
    - Include reflection on personal growth and character
    
    PROMPT STRUCTURE:
    - Clear instructions in respectful tone
    - Cultural context and background
    - Guiding questions for development
    - Assessment criteria with cultural awareness
  `,
  
  listening: `
    Design listening comprehension activities:
    
    CULTURAL AUDIO CONTENT:
    - Scripts appropriate for Islamic educational context
    - Uzbekistan cultural references and examples
    - Formal, respectful language modeling
    - Family and community-oriented scenarios
    
    EDUCATIONAL PARAMETERS:
    - Difficulty: {difficulty}/5
    - Topic focus: {topic}
    - Complexity: {languageComplexity}
    - Duration: 3-7 minutes audio content
    
    ISLAMIC VALUES INTEGRATION:
    - Natural inclusion of: {islamicValues}
    - Moral lessons embedded in content
    - Positive character examples
    - Community responsibility themes
    
    ACTIVITY STRUCTURE:
    - Pre-listening cultural context
    - Audio script with cultural explanations
    - Comprehension questions (5-8)
    - Discussion questions for cultural reflection
    - Vocabulary support with Uzbek translations
  `,
  
  grammar: `
    Develop grammar exercises with cultural sensitivity:
    
    CULTURAL INTEGRATION:
    - Example sentences using Islamic/Uzbek cultural context
    - Respectful language patterns and formality levels
    - Family and community-oriented example scenarios
    - Traditional and modern Uzbek life examples
    
    EDUCATIONAL FOCUS:
    - Grammar point: {topic}
    - Difficulty level: {difficulty}/5
    - Language complexity: {languageComplexity}
    - Practice variety: recognition, production, application
    
    ISLAMIC VALUES INCORPORATION:
    - Examples demonstrate: {islamicValues}
    - Positive moral themes in example sentences
    - Character development through language use
    - Community responsibility in communication
    
    EXERCISE DESIGN:
    - Clear explanations with cultural examples
    - Progressive difficulty increase
    - Cultural context for grammar patterns
    - Real-world application in Uzbek Islamic context
  `,
  
  cultural_quiz: `
    Create culturally appropriate knowledge assessment:
    
    CULTURAL CONTENT FOCUS:
    - Uzbekistan history, traditions, and customs
    - Islamic knowledge appropriate for educational level
    - Local geography, literature, and arts
    - Contemporary Uzbek society and values
    
    EDUCATIONAL STANDARDS:
    - Difficulty: {difficulty}/5
    - Topic area: {topic}
    - Knowledge depth: {languageComplexity}
    - Question variety: multiple choice, short answer, essay
    
    ISLAMIC VALUES EMPHASIS:
    - Content reflects: {islamicValues}
    - Moral and ethical dimensions included
    - Character education elements
    - Community and family values highlighted
    
    ASSESSMENT DESIGN:
    - 10-15 questions varying in format
    - Cultural context provided for each question
    - Explanations that enhance cultural understanding
    - Respectful treatment of religious and cultural topics
  `,
};

export class OpenAITaskGenerationService {
  private costTracker = {
    totalCost: 0,
    monthlyBudget: 50, // $50 monthly budget
    dailyUsage: 0,
  };

  /**
   * Generate AI task with cultural validation and Islamic values integration
   */
  async generateTask(request: TaskGenerationRequest): Promise<TaskGenerationResult> {
    const startTime = Date.now();
    
    try {
      // Pre-generation validation
      if (!this.validateBudget()) {
        return {
          success: false,
          error: 'Byudjet limiti oshdi. Administrator bilan bog\'laning.',
        };
      }

      // Select optimal model based on complexity and cost optimization
      const model = this.selectOptimalModel(request);
      
      // Generate culturally appropriate prompt
      const prompt = this.buildCulturallyAwarePrompt(request);
      
      // Make OpenAI API call with structured output
      const completion = await openai.beta.chat.completions.parse({
        model: model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.parameters.culturalContext),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_schema', json_schema: {
          name: 'task_content',
          schema: TaskContentSchema,
        }},
        temperature: 0.7,
        max_tokens: 2000,
      });

      const generationTime = Date.now() - startTime;
      const tokensUsed = completion.usage?.total_tokens || 0;
      const cost = this.calculateCost(model, tokensUsed);

      // Update cost tracking
      this.updateCostTracking(cost);

      // Parse and validate generated content
      const content = completion.choices[0]?.message?.parsed;
      
      if (!content) {
        return {
          success: false,
          error: 'AI kontenti yaratishda xatolik',
        };
      }

      // Enhanced cultural validation
      const culturalValidation = await this.validateCulturalAppropriateness(
        content,
        request.parameters.culturalContext,
        request.qualityTargets
      );

      if (!culturalValidation.passed) {
        return {
          success: false,
          error: `Madaniy tekshiruvdan o'tmadi: ${culturalValidation.issues.join(', ')}`,
          culturalScore: culturalValidation.score,
        };
      }

      // Add generation metadata
      const finalContent = {
        ...content,
        metadata: {
          ...content.metadata,
          generationTime,
          tokensUsed,
          cost,
          model,
          culturalValidationScore: culturalValidation.score,
        },
      };

      return {
        success: true,
        content: finalContent,
        culturalScore: culturalValidation.score,
        cost,
        tokensUsed,
        generationTime,
      };

    } catch (error) {
      console.error('OpenAI task generation error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('rate_limit')) {
          return {
            success: false,
            error: 'API limit oshdi. Biroz kutib qaytadan urinib ko\'ring.',
          };
        }
        
        if (error.message.includes('insufficient_quota')) {
          return {
            success: false,
            error: 'API kvota yetarli emas. Administrator bilan bog\'laning.',
          };
        }
      }

      return {
        success: false,
        error: 'AI xizmati vaqtinchalik mavjud emas. Qaytadan urinib ko\'ring.',
      };
    }
  }

  /**
   * Refine existing task content based on teacher feedback
   */
  async refineContent(
    originalContent: z.infer<typeof TaskContentSchema>,
    refinementInstructions: string
  ): Promise<z.infer<typeof TaskContentSchema> | null> {
    try {
      const completion = await openai.beta.chat.completions.parse({
        model: 'gpt-4o-mini', // Use mini for cost efficiency on refinements
        messages: [
          {
            role: 'system',
            content: `
              You are refining educational content while maintaining cultural appropriateness and Islamic values.
              
              CRITICAL REQUIREMENTS:
              - Maintain cultural sensitivity for Uzbekistan Islamic educational context
              - Preserve Islamic values alignment
              - Keep educational quality high
              - Ensure factual accuracy
              - Maintain respectful tone and language
            `,
          },
          {
            role: 'user',
            content: `
              Please refine this educational content based on the teacher's instructions:
              
              ORIGINAL CONTENT:
              ${JSON.stringify(originalContent, null, 2)}
              
              TEACHER REFINEMENT INSTRUCTIONS:
              ${refinementInstructions}
              
              Maintain all cultural and religious appropriateness while implementing the requested changes.
            `,
          },
        ],
        response_format: { type: 'json_schema', json_schema: {
          name: 'refined_task_content',
          schema: TaskContentSchema,
        }},
        temperature: 0.5,
      });

      const refinedContent = completion.choices[0]?.message?.parsed;
      
      if (!refinedContent) {
        throw new Error('Failed to parse refined content');
      }

      // Update cost tracking for refinement
      const tokensUsed = completion.usage?.total_tokens || 0;
      const cost = this.calculateCost('gpt-4o-mini', tokensUsed);
      this.updateCostTracking(cost);

      return {
        ...refinedContent,
        metadata: {
          ...refinedContent.metadata,
          generationTime: originalContent.metadata.generationTime,
          tokensUsed: originalContent.metadata.tokensUsed + tokensUsed,
          cost: originalContent.metadata.cost + cost,
          refined: true,
          refinementInstructions,
        },
      };

    } catch (error) {
      console.error('Content refinement error:', error);
      return null;
    }
  }

  /**
   * Validate content for cultural appropriateness
   */
  async validateCulturalAppropriateness(
    content: z.infer<typeof TaskContentSchema>,
    culturalContext: string,
    qualityTargets: TaskGenerationRequest['qualityTargets']
  ): Promise<{
    passed: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    try {
      const validation = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `
              You are a cultural appropriateness validator for Islamic educational content in Uzbekistan.
              
              VALIDATION CRITERIA:
              - Islamic values compliance (≥95%)
              - Uzbekistan cultural sensitivity (≥90%)
              - Family-appropriate content (100%)
              - Respectful language and tone (≥95%)
              - Educational value preservation (≥90%)
              
              Respond with JSON containing:
              {
                "passed": boolean,
                "score": number (0-1),
                "issues": string[],
                "suggestions": string[]
              }
            `,
          },
          {
            role: 'user',
            content: `
              Please validate this educational content:
              
              CONTENT: ${JSON.stringify(content, null, 2)}
              
              CULTURAL CONTEXT: ${culturalContext}
              
              QUALITY TARGETS: ${JSON.stringify(qualityTargets)}
              
              Check for cultural appropriateness, Islamic values alignment, and educational effectiveness.
            `,
          },
        ],
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        return {
          passed: false,
          score: 0,
          issues: ['Validation response not received'],
          suggestions: ['Please try again'],
        };
      }

      const validation = JSON.parse(response);
      return validation;

    } catch (error) {
      console.error('Cultural validation error:', error);
      return {
        passed: false,
        score: 0,
        issues: ['Validation system error'],
        suggestions: ['Please try manual review'],
      };
    }
  }

  /**
   * Get cost and usage statistics
   */
  getCostStatistics() {
    return {
      totalCost: this.costTracker.totalCost,
      dailyUsage: this.costTracker.dailyUsage,
      monthlyBudget: this.costTracker.monthlyBudget,
      remainingBudget: this.costTracker.monthlyBudget - this.costTracker.totalCost,
      costPerTask: this.costTracker.totalCost / Math.max(1, this.costTracker.dailyUsage),
    };
  }

  // Private helper methods
  private validateBudget(): boolean {
    return this.costTracker.totalCost < this.costTracker.monthlyBudget;
  }

  private selectOptimalModel(request: TaskGenerationRequest): string {
    // Use cost optimization based on complexity
    const complexity = request.parameters.difficultyLevel * 
                      (request.parameters.contentLength === 'long' ? 1.5 : 1) *
                      (request.parameters.taskType === 'cultural_quiz' ? 1.2 : 1);

    return complexity > 8 ? 'gpt-4o' : 'gpt-4o-mini';
  }

  private buildCulturallyAwarePrompt(request: TaskGenerationRequest): string {
    const basePrompt = TASK_GENERATION_PROMPTS[request.taskType];
    const culturalValidation = CULTURAL_VALIDATION_PROMPTS[request.parameters.culturalContext];

    return `
      ${basePrompt
        .replace('{difficulty}', request.parameters.difficultyLevel.toString())
        .replace('{languageComplexity}', request.parameters.languageComplexity)
        .replace('{topic}', request.parameters.topic)
        .replace('{islamicValues}', request.parameters.islamicValues.join(', '))
        .replace('{contentLength}', request.parameters.contentLength)
        .replace('{estimatedTime}', this.getEstimatedTime(request.parameters.contentLength))
      }

      CULTURAL VALIDATION:
      ${culturalValidation}

      LANGUAGE PREFERENCE: Generate primary content in English with ${request.parameters.languagePreference} translations where helpful.

      ISLAMIC CALENDAR CONTEXT: ${request.parameters.islamicCalendarContext ? JSON.stringify(request.parameters.islamicCalendarContext) : 'Not provided'}

      Please generate structured content that meets all cultural, educational, and quality requirements.
    `;
  }

  private getSystemPrompt(culturalContext: string): string {
    return `
      You are an AI educational content generator specialized in creating culturally appropriate materials for Islamic education in Uzbekistan.

      CORE PRINCIPLES:
      - Respect Islamic values and teachings
      - Honor Uzbekistan cultural traditions
      - Maintain educational excellence
      - Ensure family-appropriate content
      - Use respectful, formal language

      CULTURAL CONTEXT: ${culturalContext}

      Generate structured educational content that promotes learning while respecting cultural and religious values.
    `;
  }

  private getEstimatedTime(contentLength: string): string {
    switch (contentLength) {
      case 'short': return '10-15';
      case 'medium': return '20-30';
      case 'long': return '35-45';
      default: return '20-30';
    }
  }

  private calculateCost(model: string, tokens: number): number {
    const rates = {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    };

    const rate = rates[model as keyof typeof rates] || rates['gpt-4o-mini'];
    // Approximate 70% input, 30% output token distribution
    return (tokens * 0.7 * rate.input + tokens * 0.3 * rate.output) / 1000;
  }

  private updateCostTracking(cost: number): void {
    this.costTracker.totalCost += cost;
    this.costTracker.dailyUsage += 1;
  }
}

// Export singleton instance
export const openAITaskGeneration = new OpenAITaskGenerationService();