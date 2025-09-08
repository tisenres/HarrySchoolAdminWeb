import { Homework } from '@/types';

export const MOCK_HOMEWORK: Homework[] = [
  {
    id: '1',
    title: 'Essay: My Summer Vacation',
    description: 'Write a 500-word essay about your summer vacation experiences. Include descriptive language and proper grammar.',
    subject: 'English',
    teacher: 'Ms. Johnson',
    assigned_date: '2024-01-15T09:00:00Z',
    due_date: '2024-01-22T23:59:00Z',
    status: 'pending',
    priority: 'high',
    type: 'assignment',
    requirements: [
      'Minimum 500 words',
      'Include introduction, body, and conclusion',
      'Use descriptive language',
      'Check grammar and spelling',
      'Submit as PDF or Word document'
    ],
    attachments: ['https://example.com/essay-guidelines.pdf'],
    estimated_time: 120
  },
  {
    id: '2',
    title: 'Math Practice: Quadratic Equations',
    description: 'Complete exercises 1-20 from Chapter 8. Show all work and steps for full credit.',
    subject: 'Mathematics',
    teacher: 'Mr. Smith',
    assigned_date: '2024-01-16T10:30:00Z',
    due_date: '2024-01-18T08:00:00Z',
    status: 'submitted',
    priority: 'medium',
    type: 'practice',
    requirements: [
      'Complete exercises 1-20',
      'Show all work and steps',
      'Use proper mathematical notation',
      'Submit handwritten or typed solutions'
    ],
    submission_url: 'https://drive.google.com/file/d/abc123/view',
    submitted_at: '2024-01-17T20:15:00Z',
    estimated_time: 90
  },
  {
    id: '3',
    title: 'Science Project: Solar System Model',
    description: 'Create a 3D model of the solar system with accurate planet sizes and distances. Include a presentation explaining each planet.',
    subject: 'Science',
    teacher: 'Dr. Wilson',
    assigned_date: '2024-01-10T14:00:00Z',
    due_date: '2024-01-25T16:00:00Z',
    status: 'graded',
    priority: 'high',
    type: 'project',
    requirements: [
      'Create 3D model of solar system',
      'Include all 8 planets',
      'Accurate relative sizes',
      'Prepare 5-minute presentation',
      'Include fun facts about each planet'
    ],
    submission_url: 'https://drive.google.com/file/d/xyz789/view',
    submitted_at: '2024-01-24T15:30:00Z',
    grade: 95,
    max_grade: 100,
    feedback: 'Excellent work! Very creative model and informative presentation. Great attention to detail.',
    estimated_time: 300
  },
  {
    id: '4',
    title: 'History Reading: World War II',
    description: 'Read Chapter 12 and answer the discussion questions at the end. Be prepared for class discussion.',
    subject: 'History',
    teacher: 'Mrs. Brown',
    assigned_date: '2024-01-17T11:00:00Z',
    due_date: '2024-01-19T09:00:00Z',
    status: 'overdue',
    priority: 'medium',
    type: 'reading',
    requirements: [
      'Read Chapter 12 completely',
      'Answer all discussion questions',
      'Take notes on key events',
      'Prepare for class discussion'
    ],
    estimated_time: 60
  },
  {
    id: '5',
    title: 'Spanish Vocabulary Quiz Prep',
    description: 'Study vocabulary words 1-50 from Unit 3. Quiz will cover definitions, pronunciation, and usage in sentences.',
    subject: 'Spanish',
    teacher: 'Señora Garcia',
    assigned_date: '2024-01-18T13:30:00Z',
    due_date: '2024-01-20T10:00:00Z',
    status: 'pending',
    priority: 'high',
    type: 'quiz',
    requirements: [
      'Study vocabulary words 1-50',
      'Practice pronunciation',
      'Create example sentences',
      'Review grammar rules from Unit 3'
    ],
    attachments: ['https://example.com/spanish-vocab-list.pdf'],
    estimated_time: 45
  },
  {
    id: '6',
    title: 'Art Portfolio: Self Portrait',
    description: 'Create a self-portrait using any medium of your choice. Include an artist statement explaining your creative process.',
    subject: 'Art',
    teacher: 'Ms. Davis',
    assigned_date: '2024-01-12T15:00:00Z',
    due_date: '2024-01-26T15:00:00Z',
    status: 'submitted',
    priority: 'low',
    type: 'project',
    requirements: [
      'Create original self-portrait',
      'Use any artistic medium',
      'Write 200-word artist statement',
      'Explain creative process and inspiration'
    ],
    submission_url: 'https://drive.google.com/file/d/art456/view',
    submitted_at: '2024-01-25T14:20:00Z',
    estimated_time: 180
  }
];

export const getHomeworkByStatus = (status: Homework['status']) => {
  return MOCK_HOMEWORK.filter(hw => hw.status === status);
};

export const getUpcomingHomework = () => {
  const now = new Date();
  return MOCK_HOMEWORK.filter(hw => {
    const dueDate = new Date(hw.due_date);
    return dueDate > now && hw.status !== 'submitted' && hw.status !== 'graded';
  }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
};

export const getPastHomework = () => {
  return MOCK_HOMEWORK.filter(hw => 
    hw.status === 'submitted' || hw.status === 'graded' || hw.status === 'overdue'
  ).sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
};

export const getHomeworkStats = () => {
  const total = MOCK_HOMEWORK.length;
  const pending = MOCK_HOMEWORK.filter(hw => hw.status === 'pending').length;
  const submitted = MOCK_HOMEWORK.filter(hw => hw.status === 'submitted').length;
  const graded = MOCK_HOMEWORK.filter(hw => hw.status === 'graded').length;
  const overdue = MOCK_HOMEWORK.filter(hw => hw.status === 'overdue').length;
  
  return { total, pending, submitted, graded, overdue };
};