import { Platform } from 'react-native';

export type AIModel = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4.1' | 'gpt-4' | 'o3-mini';

export interface TaskSpec {
  subject: string;
  level: 'easy' | 'medium' | 'hard';
  count: number;
  types?: Array<'text' | 'quiz' | 'speaking' | 'listening' | 'writing' | 'mixed'>;
  focus?: string;
}

export interface GeneratedTaskItem {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit?: number;
  content: unknown;
}

export interface TaskGenerationResult {
  tasks: GeneratedTaskItem[];
}

export interface AnswerEvaluationRequest {
  question: string;
  expected_answer?: string;
  user_answer: string;
  rubric?: string;
}

export interface AnswerEvaluationResult {
  is_correct: boolean;
  score: number;
  max_score: number;
  feedback: string;
  suggestions?: string[];
}

export interface RecommendationContext {
  student_level: 'beginner' | 'intermediate' | 'advanced';
  recent_topics: string[];
  weaknesses?: string[];
  goals?: string[];
}

export interface RecommendationItem {
  id: string;
  title: string;
  rationale: string;
  type: 'lesson' | 'exercise' | 'video' | 'article' | 'quiz' | 'speaking';
  duration_minutes?: number;
}

export interface RecommendationsResult {
  items: RecommendationItem[];
}

export type ContentPart = { type: 'text'; text: string } | { type: 'image'; image: string };

export type CoreMessage =
  | { role: 'system'; content: string | ContentPart[] }
  | { role: 'user'; content: string | ContentPart[] }
  | { role: 'assistant'; content: string | ContentPart[] };

const TEXT_API = 'https://toolkit.rork.com/text/llm/';
const STT_API = 'https://toolkit.rork.com/stt/transcribe/';

async function postText(messages: CoreMessage[]) {
  try {
    console.log('[AI] postText start', { messageCount: messages.length });
    const res = await fetch(TEXT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI text api failed: ${res.status} ${txt}`);
    }
    const json = (await res.json()) as { completion: string };
    console.log('[AI] postText success');
    return json.completion;
  } catch (e) {
    console.error('[AI] postText error', e);
    throw e;
  }
}

export async function chatComplete(messages: CoreMessage[]): Promise<string> {
  const completion = await postText(messages);
  return completion;
}

export async function generateTasks(spec: TaskSpec, model: AIModel = 'gpt-4o-mini'): Promise<TaskGenerationResult> {
  const sys = 'You are an educational content generator. Generate tasks in strict JSON format only. No markdown, no explanations, just valid JSON.';
  const user = `Generate ${spec.count} educational tasks for subject "${spec.subject}" at ${spec.level} difficulty level.

Return ONLY a JSON object with this exact structure:
{
  "tasks": [
    {
      "id": "unique-id",
      "title": "Task title",
      "description": "Clear task description/question",
      "type": "${(spec.types ?? ['mixed'])[0]}",
      "difficulty": "${spec.level}",
      "points": 10,
      "time_limit": 5,
      "content": {
        "question": "The actual question",
        "options": ["A", "B", "C", "D"],
        "correct_answer": "A"
      }
    }
  ]
}

Focus area: ${spec.focus ?? 'general'}. Return only valid JSON, no other text.`;
  
  console.log('[AI] generateTasks request:', { spec, model });
  
  const completion = await postText([
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]);
  
  console.log('[AI] generateTasks raw response:', completion);
  
  try {
    // Clean the response
    let cleanedResponse = completion.trim();
    
    // Remove markdown code blocks if present
    cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    // Parse JSON
    const parsed = JSON.parse(cleanedResponse) as TaskGenerationResult;
    
    if (!parsed?.tasks || !Array.isArray(parsed.tasks)) {
      throw new Error('Invalid AI tasks structure - missing tasks array');
    }
    
    // Validate each task
    parsed.tasks.forEach((task, index) => {
      if (!task.id) task.id = `task-${Date.now()}-${index}`;
      if (!task.title) task.title = `Task ${index + 1}`;
      if (!task.description) task.description = 'Complete this task';
      if (!task.type) task.type = 'mixed';
      if (!task.difficulty) task.difficulty = spec.level;
      if (!task.points) task.points = 10;
      if (!task.content) task.content = { question: task.description };
    });
    
    console.log('[AI] generateTasks success:', parsed);
    return parsed;
  } catch (e) {
    console.error('[AI] generateTasks JSON parse failed:', e);
    console.error('[AI] Raw completion:', completion);
    
    // Fallback: create mock tasks
    const fallbackTasks: TaskGenerationResult = {
      tasks: Array.from({ length: spec.count }, (_, i) => ({
        id: `fallback-${Date.now()}-${i}`,
        title: `${spec.subject} Task ${i + 1}`,
        description: `Practice ${spec.subject} at ${spec.level} level`,
        type: (spec.types ?? ['mixed'])[0],
        difficulty: spec.level,
        points: 10,
        time_limit: 5,
        content: {
          question: `Practice question for ${spec.subject}`,
          type: 'text'
        }
      }))
    };
    
    console.log('[AI] Using fallback tasks:', fallbackTasks);
    return fallbackTasks;
  }
}

export async function evaluateAnswer(req: AnswerEvaluationRequest, model: AIModel = 'gpt-4o-mini'): Promise<AnswerEvaluationResult> {
  const sys = 'You are a precise educational grader. Return only valid JSON, no markdown or explanations.';
  const rubricText = req.rubric ?? 'Grade for accuracy, completeness, and clarity. Score 0-100.';
  const user = `Evaluate this student answer:

Question: ${req.question}
Expected Answer: ${req.expected_answer ?? 'N/A'}
Student Answer: ${req.user_answer}
Grading Rubric: ${rubricText}

Return ONLY this JSON structure:
{
  "is_correct": true/false,
  "score": 0-100,
  "max_score": 100,
  "feedback": "Detailed feedback explaining the grade",
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;
  
  console.log('[AI] evaluateAnswer request:', req);
  
  const completion = await postText([
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]);
  
  console.log('[AI] evaluateAnswer raw response:', completion);
  
  try {
    // Clean the response
    let cleanedResponse = completion.trim();
    cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    const parsed = JSON.parse(cleanedResponse) as AnswerEvaluationResult;
    
    // Validate required fields
    if (typeof parsed.is_correct !== 'boolean') parsed.is_correct = false;
    if (typeof parsed.score !== 'number') parsed.score = 0;
    if (typeof parsed.max_score !== 'number') parsed.max_score = 100;
    if (typeof parsed.feedback !== 'string') parsed.feedback = 'Unable to evaluate answer';
    if (!Array.isArray(parsed.suggestions)) parsed.suggestions = [];
    
    console.log('[AI] evaluateAnswer success:', parsed);
    return parsed;
  } catch (e) {
    console.error('[AI] evaluateAnswer JSON parse failed:', e);
    console.error('[AI] Raw completion:', completion);
    
    // Fallback evaluation
    const fallback: AnswerEvaluationResult = {
      is_correct: false,
      score: 0,
      max_score: 100,
      feedback: 'Unable to evaluate answer due to AI processing error. Please try again.',
      suggestions: ['Please rephrase your answer', 'Try to be more specific']
    };
    
    console.log('[AI] Using fallback evaluation:', fallback);
    return fallback;
  }
}

export async function recommendContent(ctx: RecommendationContext, model: AIModel = 'gpt-4o-mini'): Promise<RecommendationsResult> {
  const sys = 'You are a personalized learning recommender. Return only valid JSON, no markdown or explanations.';
  const user = `Generate personalized learning recommendations:

Student Level: ${ctx.student_level}
Recent Topics: ${ctx.recent_topics.join(', ')}
Weaknesses: ${(ctx.weaknesses ?? []).join(', ') || 'none identified'}
Goals: ${(ctx.goals ?? []).join(', ') || 'general improvement'}

Return ONLY this JSON structure with exactly 5 recommendations:
{
  "items": [
    {
      "id": "unique-id",
      "title": "Recommendation title",
      "rationale": "Why this is recommended",
      "type": "lesson|exercise|video|article|quiz|speaking",
      "duration_minutes": 15
    }
  ]
}`;
  
  console.log('[AI] recommendContent request:', ctx);
  
  const completion = await postText([
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]);
  
  console.log('[AI] recommendContent raw response:', completion);
  
  try {
    // Clean the response
    let cleanedResponse = completion.trim();
    cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    const parsed = JSON.parse(cleanedResponse) as RecommendationsResult;
    
    if (!parsed?.items || !Array.isArray(parsed.items)) {
      throw new Error('Invalid recommendations structure - missing items array');
    }
    
    // Validate each recommendation
    parsed.items.forEach((item, index) => {
      if (!item.id) item.id = `rec-${Date.now()}-${index}`;
      if (!item.title) item.title = `Recommendation ${index + 1}`;
      if (!item.rationale) item.rationale = 'Recommended for your learning path';
      if (!item.type) item.type = 'lesson';
      if (!item.duration_minutes) item.duration_minutes = 15;
    });
    
    console.log('[AI] recommendContent success:', parsed);
    return parsed;
  } catch (e) {
    console.error('[AI] recommendContent JSON parse failed:', e);
    console.error('[AI] Raw completion:', completion);
    
    // Fallback recommendations
    const fallback: RecommendationsResult = {
      items: [
        {
          id: `fallback-${Date.now()}-1`,
          title: 'Review Basic Grammar',
          rationale: 'Strengthen your foundation with grammar fundamentals',
          type: 'lesson',
          duration_minutes: 20
        },
        {
          id: `fallback-${Date.now()}-2`,
          title: 'Vocabulary Building Exercise',
          rationale: 'Expand your vocabulary with interactive exercises',
          type: 'exercise',
          duration_minutes: 15
        },
        {
          id: `fallback-${Date.now()}-3`,
          title: 'Speaking Practice',
          rationale: 'Improve pronunciation and fluency',
          type: 'speaking',
          duration_minutes: 10
        },
        {
          id: `fallback-${Date.now()}-4`,
          title: 'Reading Comprehension',
          rationale: 'Enhance reading skills with guided practice',
          type: 'article',
          duration_minutes: 25
        },
        {
          id: `fallback-${Date.now()}-5`,
          title: 'Quick Knowledge Check',
          rationale: 'Test your understanding with a short quiz',
          type: 'quiz',
          duration_minutes: 5
        }
      ]
    };
    
    console.log('[AI] Using fallback recommendations:', fallback);
    return fallback;
  }
}

export interface STTResult {
  text: string;
  language: string;
}

export async function transcribeAudio(params: { uri: string; mimeType: string; fileName?: string; language?: string }): Promise<STTResult> {
  try {
    console.log('[AI] transcribeAudio start', { platform: Platform.OS });
    const formData = new FormData();
    const name = params.fileName ?? 'audio.' + (params.mimeType.split('/')[1] ?? 'm4a');
    const file: any = Platform.OS === 'web'
      ? new File([], name, { type: params.mimeType })
      : { uri: params.uri, name, type: params.mimeType };
    formData.append('audio', file as any);
    if (params.language) formData.append('language', params.language);

    const res = await fetch('https://toolkit.rork.com/stt/transcribe/', { method: 'POST', body: formData as any });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`STT failed: ${res.status} ${txt}`);
    }
    const json = (await res.json()) as STTResult;
    console.log('[AI] transcribeAudio success');
    return json;
  } catch (e) {
    console.error('[AI] transcribeAudio error', e);
    throw e;
  }
}
