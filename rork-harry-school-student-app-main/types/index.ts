export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  points: number;
  coins: number;
  level: number;
  rank: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit?: number;
  content: any;
  is_completed: boolean;
  completion_date?: string;
  score?: number;
  created_at: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  translation: string;
  definition: string;
  pronunciation?: string;
  example_sentence?: string;
  image_url?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  is_favorite: boolean;
  mastery_level: number;
  last_reviewed?: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points_reward: number;
  coins_reward: number;
  is_unlocked: boolean;
  unlocked_at?: string;
  category: 'learning' | 'social' | 'streak' | 'special';
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  points: number;
  level: number;
  rank: number;
}

export interface Schedule {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  start_time: string;
  end_time: string;
  location: string;
  type: 'class' | 'homework' | 'exam' | 'event';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Grade {
  id: string;
  subject: string;
  assignment: string;
  score: number;
  max_score: number;
  percentage: number;
  grade_letter: string;
  date: string;
  teacher: string;
  feedback?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  image_url: string;
  cost_coins: number;
  category: 'virtual' | 'physical' | 'privilege';
  is_available: boolean;
  stock_count?: number;
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacher: string;
  assigned_date: string;
  due_date: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  type: 'assignment' | 'project' | 'reading' | 'practice' | 'quiz';
  requirements: string[];
  attachments?: string[];
  submission_url?: string;
  submitted_at?: string;
  grade?: number;
  max_grade?: number;
  feedback?: string;
  estimated_time?: number;
}