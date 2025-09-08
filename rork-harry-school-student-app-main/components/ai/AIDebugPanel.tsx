import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { CheckCircle, XCircle, Star, BookOpen, Clock, Mic, MicOff } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useEvaluateAnswer, useGenerateTasks, useRecommendContent, useTranscribeAudio } from '@/lib/aiHooks';
import { GeneratedTaskItem } from '@/lib/ai';

import { router } from 'expo-router';

type AIDebugPanelProps = { onCelebrate?: () => void };

export default function AIDebugPanel({ onCelebrate }: AIDebugPanelProps) {
  const gen = useGenerateTasks();
  const evalMut = useEvaluateAnswer();
  const rec = useRecommendContent();
  const stt = useTranscribeAudio();

  const [subject, setSubject] = useState<string>('English grammar: past simple');
  const [level, setLevel] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [question, setQuestion] = useState<string>('What is the past tense of go?');
  const [expected, setExpected] = useState<string>('went');
  const [answer, setAnswer] = useState<string>('goed');
  const [selectedTask, setSelectedTask] = useState<GeneratedTaskItem | null>(null);
  const [taskAnswer, setTaskAnswer] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const isBusy = useMemo(() => gen.isPending || evalMut.isPending || rec.isPending || stt.isPending, [gen.isPending, evalMut.isPending, rec.isPending, stt.isPending]);

  useEffect(() => {
    if (evalMut.data?.is_correct) {
      try { onCelebrate?.(); } catch (e) { console.log('[AI] celebrate callback error', e); }
    }
  }, [evalMut.data?.is_correct, onCelebrate]);

  const runSmokeTest = useCallback(async () => {
    try {
      console.log('[AI] Starting comprehensive AI test...');
      
      // Test task generation
      console.log('[AI] Testing task generation...');
      await gen.mutateAsync({ spec: { subject, level, count: 3, types: ['quiz', 'text'], focus: 'grammar' } });
      
      // Test answer evaluation
      console.log('[AI] Testing answer evaluation...');
      await evalMut.mutateAsync({ req: { question, expected_answer: expected, user_answer: answer } });
      
      // Test recommendations
      console.log('[AI] Testing content recommendations...');
      await rec.mutateAsync({ ctx: { student_level: 'beginner', recent_topics: ['Past simple', 'Grammar'], weaknesses: ['irregular verbs'], goals: ['conversation', 'fluency'] } });
      
      console.log('[AI] All AI features tested successfully!');
      onCelebrate?.();
    } catch (e) {
      console.error('[AI] Smoke test failed:', e);
    }
  }, [gen, evalMut, rec, subject, level, question, expected, answer, onCelebrate]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="ai-debug-panel">
      <Text style={styles.title}>AI Study Assistant</Text>
      <Button title="Open Full Quiz" onPress={() => router.push('/ai/tasks' as any)} variant="outline" testID="btn-open-quiz" />
      <Button title={isBusy ? 'Running…' : 'Run AI smoke test'} onPress={runSmokeTest} variant="outline" disabled={isBusy} testID="btn-smoke" />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Task generation</Text>
        <TextInput value={subject} onChangeText={setSubject} placeholder="Subject" style={styles.input} testID="input-subject" />
        <View style={styles.row}>
          <Button title="Easy" onPress={() => setLevel('easy')} variant={level === 'easy' ? 'primary' : 'outline'} testID="btn-level-easy" />
          <Button title="Medium" onPress={() => setLevel('medium')} variant={level === 'medium' ? 'primary' : 'outline'} testID="btn-level-medium" />
          <Button title="Hard" onPress={() => setLevel('hard')} variant={level === 'hard' ? 'primary' : 'outline'} testID="btn-level-hard" />
        </View>
        <Button
          title={gen.isPending ? 'Generating…' : 'Generate 3 tasks'}
          onPress={() => gen.mutate({ spec: { subject, level, count: 3, types: ['mixed'], focus: 'grammar' } })}
          loading={gen.isPending}
          disabled={isBusy}
          testID="btn-generate-tasks"
        />
        {gen.isError && <Text style={styles.error}>Error: {String(gen.error?.message ?? 'Unknown')}</Text>}
        {gen.data && (
          <View style={styles.tasksContainer} testID="result-tasks">
            <Text style={styles.sectionTitle}>Generated Tasks ({gen.data.tasks.length})</Text>
            {gen.data.tasks.map((task, index) => (
              <TouchableOpacity
                key={task.id || index}
                style={[styles.taskCard, selectedTask?.id === task.id && styles.selectedTask]}
                onPress={() => setSelectedTask(task)}
              >
                <View style={styles.taskHeader}>
                  <View style={styles.taskTypeIcon}>
                    {task.type === 'quiz' ? <BookOpen size={16} color={Colors.primary} /> : 
                     task.type === 'speaking' ? <Mic size={16} color={Colors.secondary} /> :
                     <Clock size={16} color={Colors.success} />}
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskType}>{task.type} • {task.difficulty} • {task.points} pts</Text>
                  </View>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(task.difficulty) }]}>
                    <Text style={styles.difficultyText}>{task.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.taskDescription}>{task.description}</Text>
                {task.time_limit && (
                  <Text style={styles.timeLimit}>⏱️ {task.time_limit} minutes</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Answer evaluation</Text>
        <TextInput value={question} onChangeText={setQuestion} placeholder="Question" style={styles.input} testID="input-question" />
        <TextInput value={expected} onChangeText={setExpected} placeholder="Expected" style={styles.input} testID="input-expected" />
        <TextInput value={answer} onChangeText={setAnswer} placeholder="Your answer" style={styles.input} testID="input-answer" />
        <Button
          title={evalMut.isPending ? 'Evaluating…' : 'Evaluate'}
          onPress={() => evalMut.mutate({ req: { question, expected_answer: expected, user_answer: answer } })}
          loading={evalMut.isPending}
          disabled={isBusy}
          testID="btn-evaluate"
        />
        {evalMut.isError && <Text style={styles.error}>Error: {String(evalMut.error?.message ?? 'Unknown')}</Text>}
        {evalMut.data && (
          <View style={styles.evaluationResult} testID="result-eval">
            <View style={styles.scoreHeader}>
              {evalMut.data.is_correct ? 
                <CheckCircle size={24} color={Colors.success} /> : 
                <XCircle size={24} color={Colors.error} />
              }
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreText}>{evalMut.data.score}/{evalMut.data.max_score}</Text>
                <Text style={styles.scoreLabel}>{evalMut.data.is_correct ? 'Correct!' : 'Needs Improvement'}</Text>
              </View>
            </View>
            <Text style={styles.feedback}>{evalMut.data.feedback}</Text>
            {evalMut.data.suggestions && evalMut.data.suggestions.length > 0 && (
              <View style={styles.suggestions}>
                <Text style={styles.suggestionsTitle}>💡 Suggestions:</Text>
                {evalMut.data.suggestions.map((suggestion, index) => (
                  <Text key={index} style={styles.suggestionItem}>• {suggestion}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recommendations</Text>
        <Button
          title={rec.isPending ? 'Recommending…' : 'Get recommendations'}
          onPress={() => rec.mutate({ ctx: { student_level: 'beginner', recent_topics: ['Past simple', 'Irregular verbs'], weaknesses: ['irregular verbs'], goals: ['basic conversation'] } })}
          loading={rec.isPending}
          disabled={isBusy}
          testID="btn-recommend"
        />
        {rec.isError && <Text style={styles.error}>Error: {String(rec.error?.message ?? 'Unknown')}</Text>}
        {rec.data && (
          <View style={styles.recommendationsContainer} testID="result-recs">
            <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
            {rec.data.items.map((item, index) => (
              <TouchableOpacity key={item.id || index} style={styles.recommendationCard}>
                <View style={styles.recHeader}>
                  <Star size={16} color={Colors.secondary} />
                  <Text style={styles.recTitle}>{item.title}</Text>
                  <Text style={styles.recType}>{item.type}</Text>
                </View>
                <Text style={styles.recRationale}>{item.rationale}</Text>
                {item.duration_minutes && (
                  <Text style={styles.recDuration}>⏱️ {item.duration_minutes} min</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Speech-to-Text Practice</Text>
        <Text style={styles.help}>Practice speaking exercises with AI transcription</Text>
        
        <View style={styles.recordingSection}>
          <TouchableOpacity 
            style={[styles.recordButton, isRecording && styles.recordingActive]}
            onPress={() => {
              setIsRecording(!isRecording);
              if (!isRecording) {
                Alert.alert('Recording Started', 'Speak clearly into your microphone');
                setTimeout(() => {
                  setIsRecording(false);
                  stt.mutate({ uri: Platform.OS === 'web' ? '' : 'file://dummy', mimeType: 'audio/m4a' });
                }, 3000);
              }
            }}
            disabled={stt.isPending}
          >
            {isRecording ? <MicOff size={32} color={Colors.error} /> : <Mic size={32} color={Colors.primary} />}
          </TouchableOpacity>
          <Text style={styles.recordingStatus}>
            {stt.isPending ? 'Transcribing...' : isRecording ? 'Recording... (3s)' : 'Tap to record'}
          </Text>
        </View>
        
        {stt.isError && <Text style={styles.error}>Error: {String(stt.error?.message ?? 'Unknown')}</Text>}
        {stt.data && (
          <View style={styles.transcriptionResult}>
            <Text style={styles.transcriptionTitle}>Transcription Result:</Text>
            <Text style={styles.transcriptionText}>&ldquo;{stt.data.text}&rdquo;</Text>
            <Text style={styles.transcriptionLang}>Language: {stt.data.language}</Text>
          </View>
        )}
      </View>
      
      {selectedTask && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Practice Selected Task</Text>
          <View style={styles.selectedTaskInfo}>
            <Text style={styles.selectedTaskTitle}>{selectedTask.title}</Text>
            <Text style={styles.selectedTaskDesc}>{selectedTask.description}</Text>
          </View>
          <TextInput 
            value={taskAnswer} 
            onChangeText={setTaskAnswer} 
            placeholder="Your answer..." 
            style={styles.input} 
            multiline
            testID="input-task-answer" 
          />
          <Button
            title="Submit Answer"
            onPress={() => {
              if (taskAnswer.trim()) {
                evalMut.mutate({ 
                  req: { 
                    question: selectedTask.description, 
                    user_answer: taskAnswer,
                    rubric: `Evaluate based on ${selectedTask.difficulty} level ${selectedTask.type} task` 
                  } 
                });
              }
            }}
            disabled={!taskAnswer.trim() || evalMut.isPending}
            loading={evalMut.isPending}
          />
        </View>
      )}
    </ScrollView>
  );
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return Colors.success + '22';
    case 'medium': return Colors.secondary + '22';
    case 'hard': return Colors.error + '22';
    default: return Colors.primary + '22';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 120 },
  title: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.text },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12, borderColor: Colors.border, borderWidth: 1 },
  cardTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.text },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, color: Colors.text, backgroundColor: '#fff' },
  row: { flexDirection: 'row', gap: 8 },
  error: { color: Colors.error },
  help: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  
  // Enhanced task display
  tasksContainer: { gap: 12 },
  sectionTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.text, marginBottom: 8 },
  taskCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border },
  selectedTask: { borderColor: Colors.primary, backgroundColor: Colors.primary + '11' },
  taskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  taskTypeIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.text },
  taskType: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  difficultyText: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium, color: Colors.text },
  taskDescription: { fontSize: FontSizes.sm, color: Colors.text, lineHeight: 20 },
  timeLimit: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 4 },
  
  // Enhanced evaluation display
  evaluationResult: { gap: 12 },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scoreInfo: { flex: 1 },
  scoreText: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.text },
  scoreLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  feedback: { fontSize: FontSizes.base, color: Colors.text, backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, lineHeight: 20 },
  suggestions: { gap: 4 },
  suggestionsTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.text },
  suggestionItem: { fontSize: FontSizes.sm, color: Colors.textSecondary, paddingLeft: 8 },
  
  // Enhanced recommendations display
  recommendationsContainer: { gap: 12 },
  recommendationCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  recTitle: { flex: 1, fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.text },
  recType: { fontSize: FontSizes.xs, color: Colors.primary, backgroundColor: Colors.primary + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  recRationale: { fontSize: FontSizes.sm, color: Colors.text, lineHeight: 18 },
  recDuration: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 4 },
  
  // Speech-to-text enhancements
  recordingSection: { alignItems: 'center', gap: 12 },
  recordButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary },
  recordingActive: { backgroundColor: Colors.error + '22', borderColor: Colors.error },
  recordingStatus: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center' },
  transcriptionResult: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, gap: 6 },
  transcriptionTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.text },
  transcriptionText: { fontSize: FontSizes.base, color: Colors.text, fontStyle: 'italic' },
  transcriptionLang: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  
  // Selected task practice
  selectedTaskInfo: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 8 },
  selectedTaskTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.text },
  selectedTaskDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 4 },
});