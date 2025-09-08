import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { GeneratedTaskItem } from '@/lib/ai';
import Button from '@/components/ui/Button';
import { CheckCircle, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react-native';

export interface TaskRunnerAnswerRecord {
  taskId: string;
  answer: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
}

interface TaskRunnerProps {
  tasks: GeneratedTaskItem[];
  onFinish?: (summary: { answers: TaskRunnerAnswerRecord[]; totalScore: number; totalMax: number; correctCount: number }) => void;
}

export default function TaskRunner({ tasks, onFinish }: TaskRunnerProps) {
  const [index, setIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, TaskRunnerAnswerRecord>>({});
  const [selectedOption, setSelectedOption] = useState<string>('');

  const current = tasks[index];

  const options = useMemo(() => {
    const content = (current?.content ?? {}) as any;
    const opts = Array.isArray(content?.options) ? (content.options as string[]) : [];
    return opts;
  }, [current]);

  useEffect(() => {
    setSelectedOption('');
  }, [index]);

  const handleSelect = useCallback((opt: string) => {
    setSelectedOption(opt);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!current) return;
    const content = (current.content ?? {}) as any;
    const correctAnswer: string | undefined = (content?.correct_answer ?? content?.answer ?? '').toString();
    const userAnswer = selectedOption || '';
    const isCorrect = correctAnswer ? userAnswer.trim() === correctAnswer.trim() : false;
    const score = isCorrect ? (current.points ?? 10) : 0;
    const record: TaskRunnerAnswerRecord = {
      taskId: current.id,
      answer: userAnswer,
      isCorrect,
      score,
      maxScore: current.points ?? 10,
    };
    setAnswers((prev) => ({ ...prev, [current.id]: record }));
    if (index < tasks.length - 1) {
      setIndex((i) => i + 1);
    } else {
      const records = Object.values({ ...answers, [current.id]: record });
      const totalScore = records.reduce((s, r) => s + r.score, 0);
      const totalMax = records.reduce((s, r) => s + r.maxScore, 0);
      const correctCount = records.filter((r) => r.isCorrect).length;
      onFinish?.({ answers: records, totalScore, totalMax, correctCount });
    }
  }, [current, index, tasks.length, selectedOption, answers, onFinish]);

  if (!current) {
    return (
      <View style={styles.center} testID="task-runner-empty">
        <Text style={styles.emptyText}>No tasks to run</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="task-runner">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} testID="btn-prev">
          <ChevronLeft size={22} color={index === 0 ? Colors.border : Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Question {index + 1} / {tasks.length}</Text>
        <TouchableOpacity onPress={() => setIndex((i) => Math.min(tasks.length - 1, i + 1))} disabled={index === tasks.length - 1} testID="btn-next">
          <ChevronRight size={22} color={index === tasks.length - 1 ? Colors.border : Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.qHeader}>
          <View style={styles.badge}><Text style={styles.badgeText}>{current.type}</Text></View>
          <View style={[styles.badge, { backgroundColor: getDifficultyColor(current.difficulty) }]}>
            <Text style={styles.badgeText}>{current.difficulty}</Text>
          </View>
          <View style={styles.points}><CheckCircle size={14} color={Colors.success} /><Text style={styles.pointsText}>{current.points} pts</Text></View>
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.description}>{current.description}</Text>

        {options.length > 0 ? (
          <View style={styles.options}>
            {options.map((opt, i) => {
              const selected = selectedOption === opt;
              return (
                <TouchableOpacity
                  key={`${current.id}-opt-${i}`}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => handleSelect(opt)}
                  testID={`opt-${i}`}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.noOptions}>
            <HelpCircle size={18} color={Colors.textSecondary} />
            <Text style={styles.noOptionsText}>This question has no options. Please generate again.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button title={index === tasks.length - 1 ? 'Finish' : 'Submit'} onPress={handleSubmit} disabled={!selectedOption} testID="btn-submit" />
      </View>
    </View>
  );
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return Colors.success;
    case 'medium': return Colors.secondary;
    case 'hard': return Colors.error;
    default: return Colors.primary;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.base },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  headerTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.text },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  qHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },
  points: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 },
  pointsText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  title: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.text },
  description: { fontSize: FontSizes.base, color: Colors.textSecondary, lineHeight: 20 },
  options: { gap: 10 },
  option: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '11' },
  optionText: { fontSize: FontSizes.base, color: Colors.text },
  optionTextSelected: { color: Colors.primary, fontWeight: FontWeights.semibold },
  noOptions: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12 },
  noOptionsText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
});