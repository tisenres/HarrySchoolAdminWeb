import { useMutation } from '@tanstack/react-query';
import {
  AnswerEvaluationRequest,
  AnswerEvaluationResult,
  RecommendationsResult,
  RecommendationContext,
  TaskGenerationResult,
  TaskSpec,
  STTResult,
  evaluateAnswer,
  generateTasks,
  recommendContent,
  transcribeAudio,
} from './ai';

export function useGenerateTasks() {
  return useMutation<TaskGenerationResult, Error, { spec: TaskSpec }>(
    {
      mutationKey: ['ai', 'generateTasks'],
      mutationFn: async ({ spec }) => {
        console.log('[AI] useGenerateTasks mutate', spec);
        const result = await generateTasks(spec);
        return result;
      },
    }
  );
}

export function useEvaluateAnswer() {
  return useMutation<AnswerEvaluationResult, Error, { req: AnswerEvaluationRequest }>(
    {
      mutationKey: ['ai', 'evaluateAnswer'],
      mutationFn: async ({ req }) => {
        console.log('[AI] useEvaluateAnswer mutate');
        const result = await evaluateAnswer(req);
        return result;
      },
    }
  );
}

export function useRecommendContent() {
  return useMutation<RecommendationsResult, Error, { ctx: RecommendationContext }>(
    {
      mutationKey: ['ai', 'recommendContent'],
      mutationFn: async ({ ctx }) => {
        console.log('[AI] useRecommendContent mutate');
        const result = await recommendContent(ctx);
        return result;
      },
    }
  );
}

export function useTranscribeAudio() {
  return useMutation<STTResult, Error, { uri: string; mimeType: string; fileName?: string; language?: string }>(
    {
      mutationKey: ['ai', 'transcribeAudio'],
      mutationFn: async (vars) => {
        console.log('[AI] useTranscribeAudio mutate');
        const result = await transcribeAudio(vars);
        return result;
      },
    }
  );
}
