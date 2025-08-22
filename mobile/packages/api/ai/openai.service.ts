import OpenAI from 'openai';
import { z } from 'zod';
import { createMemoryCache } from '../../../shared/services/memory-cache.service';
import { createSecureStorage } from '../../../shared/services/secure-storage.service';
import { 
  TaskGenerationRequest, 
  TaskGenerationResult, 
  ContentEvaluationRequest,
  ContentEvaluationResult,
  CulturalValidationRequest,
  CulturalValidationResult
} from './types';

// OpenAI Configuration with secure API key management
class OpenAIService {
  private client: OpenAI;
  private memoryCache = createMemoryCache('openai-service');
  private secureStorage = createSecureStorage();
  private readonly API_KEY: string;

  constructor() {
    // Use provided API key with secure storage backup
    this.API_KEY = process.env.OPENAI_API_KEY || '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';
    
    this.client = new OpenAI({
      apiKey: this.API_KEY,
      timeout: 30000, // 30 second timeout for mobile
      maxRetries: 3,
      defaultHeaders: {
        'User-Agent': 'HarrySchoolCRM-Mobile/1.0',
      },
    });

    // Initialize secure storage for caching
    this.initializeSecureStorage();
  }

  private async initializeSecureStorage(): Promise<void> {
    try {
      await this.secureStorage.setItem('openai_service_initialized', 'true');
    } catch (error) {
      console.error('Failed to initialize OpenAI secure storage:', error);
    }
  }

  // Model selection for cost optimization
  private selectOptimalModel(request: TaskGenerationRequest): string {
    const { complexity, contentLength, requiresStructuredOutput } = request.parameters;
    
    // Cost optimization: Use GPT-4o-mini for simpler tasks
    if (complexity <= 3 && contentLength < 1000) {
      return 'gpt-4o-mini';
    }
    
    // Use GPT-4o for complex educational content
    if (requiresStructuredOutput || complexity > 3) {
      return 'gpt-4o';
    }
    
    return 'gpt-4o-mini'; // Default to cost-effective model
  }

  // Core task generation method
  async generateTask(request: TaskGenerationRequest): Promise<TaskGenerationResult> {
    try {
      const cacheKey = `task_generation_${JSON.stringify(request)}`;
      const cached = await this.memoryCache.get(cacheKey);
      
      if (cached) {
        return cached as TaskGenerationResult;
      }

      const model = this.selectOptimalModel(request);
      const systemPrompt = this.buildSystemPrompt(request.parameters.culturalContext);
      const userPrompt = this.buildTaskGenerationPrompt(request);

      const completion = await this.client.beta.chat.completions.parse({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'educational_task',
            schema: this.getTaskSchema(request.taskType),
          },
        },
        temperature: 0.7,
        max_tokens: 2000,
      });

      const result: TaskGenerationResult = {
        taskId: `task_${Date.now()}`,
        content: completion.choices[0].message.parsed,
        metadata: {
          model: model,
          tokensUsed: completion.usage?.total_tokens || 0,
          generationTime: Date.now(),
          culturalScore: await this.calculateCulturalScore(completion.choices[0].message.parsed),
        },
        culturalValidation: await this.validateCultural({
          content: completion.choices[0].message.parsed,
          culturalContext: request.parameters.culturalContext,
          islamicValues: request.parameters.islamicValues || [],
        }),
      };

      // Cache for 1 hour
      await this.memoryCache.set(cacheKey, result, 3600);

      return result;

    } catch (error) {
      console.error('Task generation failed:', error);
      throw new Error(`Failed to generate task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Content evaluation for generated tasks
  async evaluateContent(request: ContentEvaluationRequest): Promise<ContentEvaluationResult> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective for evaluation
        messages: [
          {
            role: 'system',
            content: this.buildEvaluationSystemPrompt(),
          },
          {
            role: 'user',
            content: this.buildContentEvaluationPrompt(request),
          },
        ],
        temperature: 0.3, // Lower temperature for consistent evaluation
        max_tokens: 1000,
      });

      return {
        evaluationId: `eval_${Date.now()}`,
        scores: {
          educational: this.extractScore(completion.choices[0].message.content, 'educational'),
          cultural: this.extractScore(completion.choices[0].message.content, 'cultural'),
          linguistic: this.extractScore(completion.choices[0].message.content, 'linguistic'),
          engagement: this.extractScore(completion.choices[0].message.content, 'engagement'),
        },
        feedback: completion.choices[0].message.content,
        recommendations: this.extractRecommendations(completion.choices[0].message.content),
        metadata: {
          model: 'gpt-4o-mini',
          tokensUsed: completion.usage?.total_tokens || 0,
          evaluationTime: Date.now(),
        },
      };

    } catch (error) {
      console.error('Content evaluation failed:', error);
      throw new Error(`Failed to evaluate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cultural validation for educational content
  async validateCultural(request: CulturalValidationRequest): Promise<CulturalValidationResult> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.buildCulturalValidationSystemPrompt(),
          },
          {
            role: 'user',
            content: this.buildCulturalValidationPrompt(request),
          },
        ],
        temperature: 0.2, // Very low temperature for consistent validation
        max_tokens: 800,
      });

      return {
        validationId: `validation_${Date.now()}`,
        isAppropriate: this.extractBoolean(completion.choices[0].message.content, 'appropriate'),
        culturalScore: this.extractScore(completion.choices[0].message.content, 'cultural'),
        islamicAlignment: this.extractScore(completion.choices[0].message.content, 'islamic'),
        concerns: this.extractConcerns(completion.choices[0].message.content),
        recommendations: this.extractRecommendations(completion.choices[0].message.content),
        metadata: {
          model: 'gpt-4o-mini',
          tokensUsed: completion.usage?.total_tokens || 0,
          validationTime: Date.now(),
        },
      };

    } catch (error) {
      console.error('Cultural validation failed:', error);
      throw new Error(`Failed to validate cultural content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Batch processing for cost optimization
  async generateMultipleTasks(requests: TaskGenerationRequest[]): Promise<TaskGenerationResult[]> {
    try {
      const batchSize = 5; // Process in batches to avoid rate limits
      const results: TaskGenerationResult[] = [];

      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        const batchPromises = batch.map(request => this.generateTask(request));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return results;

    } catch (error) {
      console.error('Batch task generation failed:', error);
      throw new Error(`Failed to generate multiple tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Prompt building methods
  private buildSystemPrompt(culturalContext: string): string {
    const basePrompt = `You are an AI assistant specialized in creating educational content for Harry School, a private English language center in Tashkent, Uzbekistan.

CULTURAL CONTEXT: ${culturalContext}
- Integrate Islamic values (Tawhid, Akhlaq, Adl, Hikmah, Taqwa)
- Respect Uzbekistan cultural norms and traditions
- Ensure family-friendly and culturally appropriate content
- Consider local context and language preferences

EDUCATIONAL STANDARDS:
- Age-appropriate content for specified grade levels
- Engaging and interactive learning materials
- Clear learning objectives and outcomes
- Culturally relevant examples and contexts

LANGUAGE CONSIDERATIONS:
- Support for multilingual learners (English, Uzbek, Russian, Arabic)
- Appropriate vocabulary level for target audience
- Clear and comprehensible instructions`;

    return basePrompt;
  }

  private buildTaskGenerationPrompt(request: TaskGenerationRequest): string {
    const { parameters } = request;
    
    return `Generate a ${request.taskType} task with the following specifications:

Topic: ${parameters.topic}
Difficulty Level: ${parameters.difficultyLevel}/5
Cultural Context: ${parameters.culturalContext}
Islamic Values: ${parameters.islamicValues?.join(', ') || 'General Islamic principles'}
Language: ${parameters.languagePreference}
Target Age: ${parameters.targetAge || 'Unspecified'}
Duration: ${parameters.estimatedDuration || 'Flexible'}

Additional Requirements:
- Incorporate Islamic values naturally into the content
- Use culturally appropriate examples from Uzbekistan
- Ensure content is engaging and educational
- Include clear instructions and learning objectives
- Provide assessment criteria if applicable

Generate structured, high-quality educational content that meets these requirements.`;
  }

  private buildEvaluationSystemPrompt(): string {
    return `You are an educational content evaluator specializing in culturally-sensitive Islamic education in Uzbekistan.

Evaluate content on these criteria:
1. EDUCATIONAL VALUE (0-100): Learning objectives, clarity, engagement
2. CULTURAL APPROPRIATENESS (0-100): Uzbekistan context, Islamic values alignment
3. LINGUISTIC QUALITY (0-100): Language clarity, vocabulary appropriateness
4. ENGAGEMENT FACTOR (0-100): Student interest, interactive elements

Provide specific feedback and recommendations for improvement.`;
  }

  private buildContentEvaluationPrompt(request: ContentEvaluationRequest): string {
    return `Evaluate this educational content:

CONTENT: ${JSON.stringify(request.content)}

EVALUATION CRITERIA:
- Educational effectiveness and learning outcomes
- Cultural sensitivity and Islamic values integration
- Language appropriateness and clarity
- Student engagement and motivation factors

Provide scores (0-100) for each criteria and detailed feedback with recommendations.`;
  }

  private buildCulturalValidationSystemPrompt(): string {
    return `You are a cultural validation expert for Islamic educational content in Uzbekistan.

Validate content for:
- Islamic values alignment (Tawhid, Akhlaq, Adl, Hikmah, Taqwa)
- Uzbekistan cultural appropriateness
- Family-friendly content standards
- Religious sensitivity and respect

Provide validation results and recommendations for cultural improvements.`;
  }

  private buildCulturalValidationPrompt(request: CulturalValidationRequest): string {
    return `Validate this content for cultural appropriateness:

CONTENT: ${JSON.stringify(request.content)}
CULTURAL CONTEXT: ${request.culturalContext}
ISLAMIC VALUES: ${request.islamicValues.join(', ')}

Determine if the content is:
1. Culturally appropriate for Uzbekistan
2. Aligned with Islamic educational values
3. Suitable for family discussion
4. Respectful of religious sensitivities

Provide validation score (0-100) and detailed analysis.`;
  }

  // Utility methods for parsing responses
  private extractScore(content: string | null, type: string): number {
    if (!content) return 0;
    
    const regex = new RegExp(`${type}.*?(?:score|rating).*?(\d+)`, 'i');
    const match = content.match(regex);
    return match ? parseInt(match[1]) : 0;
  }

  private extractBoolean(content: string | null, keyword: string): boolean {
    if (!content) return false;
    
    const lowerContent = content.toLowerCase();
    return lowerContent.includes(`${keyword}: true`) || lowerContent.includes(`is ${keyword}`);
  }

  private extractConcerns(content: string | null): string[] {
    if (!content) return [];
    
    const concernsMatch = content.match(/concerns?:(.*?)(?:\n|$)/i);
    if (concernsMatch) {
      return concernsMatch[1].split(',').map(c => c.trim()).filter(Boolean);
    }
    return [];
  }

  private extractRecommendations(content: string | null): string[] {
    if (!content) return [];
    
    const recommendationsMatch = content.match(/recommendations?:(.*?)(?:\n\n|$)/is);
    if (recommendationsMatch) {
      return recommendationsMatch[1].split('\n').map(r => r.trim()).filter(Boolean);
    }
    return [];
  }

  private async calculateCulturalScore(content: any): Promise<number> {
    // Simple cultural scoring based on content analysis
    // This could be enhanced with more sophisticated analysis
    let score = 100;
    
    const contentStr = JSON.stringify(content).toLowerCase();
    
    // Deduct points for potentially inappropriate content
    if (contentStr.includes('alcohol') || contentStr.includes('pork')) {
      score -= 30;
    }
    
    // Add points for Islamic values references
    const islamicTerms = ['allah', 'islamic', 'muslim', 'respect', 'kindness', 'wisdom'];
    const matches = islamicTerms.filter(term => contentStr.includes(term)).length;
    score += matches * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private getTaskSchema(taskType: string): any {
    // Return appropriate Zod schema based on task type
    const schemas = {
      'quiz': this.getQuizSchema(),
      'reading': this.getReadingSchema(),
      'vocabulary': this.getVocabularySchema(),
      'writing': this.getWritingSchema(),
      'listening': this.getListeningSchema(),
    };
    
    return schemas[taskType as keyof typeof schemas] || schemas.quiz;
  }

  private getQuizSchema() {
    return {
      type: 'object',
      properties: {
        title: { type: 'string' },
        instructions: { type: 'string' },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              question: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } },
              correctAnswer: { type: 'string' },
              explanation: { type: 'string' },
              culturalContext: { type: 'string' },
            },
            required: ['id', 'question', 'correctAnswer'],
          },
        },
        culturalValues: {
          type: 'object',
          properties: {
            islamicAlignment: { type: 'number', minimum: 0, maximum: 1 },
            uzbekistanRelevance: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
      },
      required: ['title', 'instructions', 'questions'],
    };
  }

  private getReadingSchema() {
    return {
      type: 'object',
      properties: {
        title: { type: 'string' },
        passage: { type: 'string' },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              question: { type: 'string' },
              answer: { type: 'string' },
            },
            required: ['id', 'question', 'answer'],
          },
        },
        vocabulary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              word: { type: 'string' },
              definition: { type: 'string' },
              contextExample: { type: 'string' },
            },
            required: ['word', 'definition'],
          },
        },
        culturalContext: { type: 'string' },
      },
      required: ['title', 'passage', 'questions'],
    };
  }

  private getVocabularySchema() {
    return {
      type: 'object',
      properties: {
        title: { type: 'string' },
        theme: { type: 'string' },
        words: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              word: { type: 'string' },
              translation: { type: 'string' },
              definition: { type: 'string' },
              example: { type: 'string' },
              culturalContext: { type: 'string' },
            },
            required: ['word', 'definition', 'example'],
          },
        },
        exercises: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              instruction: { type: 'string' },
              content: { type: 'string' },
            },
            required: ['type', 'instruction', 'content'],
          },
        },
      },
      required: ['title', 'theme', 'words'],
    };
  }

  private getWritingSchema() {
    return {
      type: 'object',
      properties: {
        title: { type: 'string' },
        prompt: { type: 'string' },
        instructions: { type: 'string' },
        rubric: {
          type: 'object',
          properties: {
            criteria: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  criterion: { type: 'string' },
                  description: { type: 'string' },
                  points: { type: 'number' },
                },
                required: ['criterion', 'description', 'points'],
              },
            },
          },
        },
        culturalGuidance: { type: 'string' },
        islamicValues: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'prompt', 'instructions'],
    };
  }

  private getListeningSchema() {
    return {
      type: 'object',
      properties: {
        title: { type: 'string' },
        audioDescription: { type: 'string' },
        transcript: { type: 'string' },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              question: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } },
              correctAnswer: { type: 'string' },
            },
            required: ['id', 'question', 'correctAnswer'],
          },
        },
        culturalNotes: { type: 'string' },
      },
      required: ['title', 'audioDescription', 'questions'],
    };
  }

  // Cost tracking and optimization
  async getUsageStatistics(): Promise<{
    totalTokensUsed: number;
    estimatedCost: number;
    requestCount: number;
    averageTokensPerRequest: number;
  }> {
    try {
      const stats = await this.memoryCache.get('usage_statistics') || {
        totalTokensUsed: 0,
        requestCount: 0,
        estimatedCost: 0,
      };

      return {
        ...stats,
        averageTokensPerRequest: stats.requestCount > 0 ? stats.totalTokensUsed / stats.requestCount : 0,
      };
    } catch (error) {
      console.error('Failed to get usage statistics:', error);
      return {
        totalTokensUsed: 0,
        estimatedCost: 0,
        requestCount: 0,
        averageTokensPerRequest: 0,
      };
    }
  }

  private async updateUsageStatistics(tokensUsed: number, model: string): Promise<void> {
    try {
      const current = await this.memoryCache.get('usage_statistics') || {
        totalTokensUsed: 0,
        requestCount: 0,
        estimatedCost: 0,
      };

      // Pricing per 1k tokens (approximate)
      const pricing = {
        'gpt-4o': 0.005,
        'gpt-4o-mini': 0.00015,
      };

      const cost = (tokensUsed / 1000) * (pricing[model as keyof typeof pricing] || 0.005);

      const updated = {
        totalTokensUsed: current.totalTokensUsed + tokensUsed,
        requestCount: current.requestCount + 1,
        estimatedCost: current.estimatedCost + cost,
      };

      await this.memoryCache.set('usage_statistics', updated, 86400); // Cache for 24 hours
    } catch (error) {
      console.error('Failed to update usage statistics:', error);
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
export default openaiService;