import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import Button from '@/components/ui/Button';
import { useGenerateTasks } from '@/lib/aiHooks';
import TaskRunner, { TaskRunnerAnswerRecord } from '@/components/ai/TaskRunner';
import { useStudent } from '@/providers/StudentProvider';

export default function AITasksScreen() {
  const gen = useGenerateTasks();
  const { awardPoints } = useStudent();

  const [subject, setSubject] = useState<string>('English grammar: past simple');
  const [focus, setFocus] = useState<string>('grammar');
  const [level, setLevel] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [count, setCount] = useState<number>(5);
  const [started, setStarted] = useState<boolean>(false);
  const [summary, setSummary] = useState<{ answers: TaskRunnerAnswerRecord[]; totalScore: number; totalMax: number; correctCount: number } | null>(null);

  const canStart = useMemo(() => subject.trim().length > 0 && count > 0 && count <= 20, [subject, count]);

  const onStart = useCallback(async () => {
    try {
      setSummary(null);
      setStarted(false);
      await gen.mutateAsync({ spec: { subject, level, count, types: ['quiz'], focus } });
      setStarted(true);
    } catch (e) {
      Alert.alert('Generation failed', 'Unable to generate tasks. Please try again.');
    }
  }, [gen, subject, level, count, focus]);

  const onFinish = useCallback(async (s: { answers: TaskRunnerAnswerRecord[]; totalScore: number; totalMax: number; correctCount: number }) => {
    setSummary(s);
    setStarted(false);
    try {
      const points = Math.max(5, s.totalScore);
      await awardPoints(points, `Completed AI quiz: ${subject}`, 'ai_quiz');
    } catch (err) {
      console.log('[AI Quiz] awardPoints error', err);
    }
  }, [awardPoints, subject]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'AI Quiz' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {!started && !gen.data && !summary && (
          <View style={styles.card} testID="ai-quiz-config">
            <Text style={styles.title}>Create a Quiz</Text>
            <TextInput value={subject} onChangeText={setSubject} placeholder="Subject (e.g., English grammar: past simple)" style={styles.input} testID="input-subject" />
            <TextInput value={focus} onChangeText={setFocus} placeholder="Focus (e.g., grammar, vocabulary)" style={styles.input} testID="input-focus" />
            <View style={styles.row}>
              {(['easy','medium','hard'] as const).map(l => (
                <TouchableOpacity key={l} style={[styles.levelBtn, level === l && styles.levelBtnActive]} onPress={() => setLevel(l)} testID={`level-${l}`}>
                  <Text style={[styles.levelText, level === l && styles.levelTextActive]}>{l.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.row}>
              {[3,5,10].map(n => (
                <TouchableOpacity key={n} style={[styles.countBtn, count === n && styles.countBtnActive]} onPress={() => setCount(n)} testID={`count-${n}`}>
                  <Text style={[styles.countText, count === n && styles.countTextActive]}>{n} Qs</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title={gen.isPending ? 'Generating…' : 'Start Quiz'} onPress={onStart} disabled={!canStart || gen.isPending} loading={gen.isPending} testID="btn-start-quiz" />
            {gen.isError && <Text style={styles.error}>Error: {String(gen.error?.message ?? 'Unknown')}</Text>}
          </View>
        )}

        {started && gen.data && gen.data.tasks && gen.data.tasks.length > 0 && (
          <View style={styles.runnerWrap} testID="ai-quiz-runner">
            <TaskRunner tasks={gen.data.tasks} onFinish={onFinish} />
          </View>
        )}

        {summary && (
          <View style={styles.card} testID="ai-quiz-summary">
            <Text style={styles.title}>Quiz Summary</Text>
            <Text style={styles.summaryText}>Score: {summary.totalScore}/{summary.totalMax}</Text>
            <Text style={styles.summaryText}>Correct: {summary.correctCount}/{summary.answers.length}</Text>
            <Button title="Create Another Quiz" onPress={() => { gen.reset(); setSummary(null); }} variant="outline" testID="btn-new-quiz" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 80 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.text },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, color: Colors.text, backgroundColor: '#fff' },
  row: { flexDirection: 'row', gap: 8 },
  levelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  levelBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  levelText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  levelTextActive: { color: '#fff' },
  countBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  countBtnActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  countText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  countTextActive: { color: '#fff' },
  error: { color: Colors.error },
  runnerWrap: { flex: 1, minHeight: 400 },
  summaryText: { fontSize: FontSizes.base, color: Colors.text },
});