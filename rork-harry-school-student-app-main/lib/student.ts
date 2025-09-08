import { supabase, Student, StudentRanking, PointsTransaction, Hometask, StudentHometaskSubmission, VocabularyWord, StudentVocabularyProgress, Schedule, Referral, ReferralReward, isSupabaseEnabled } from './supabase';
import { Platform } from 'react-native';
import { CEFR_PACKS, VocabItem } from '@/constants/vocabulary_packs';

// Mock data for fallback when Supabase is not available
const MOCK_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001';

// Generate proper UUIDs for mock data
function generateMockUUID(prefix: string): string {
  const timestamp = Date.now().toString(16).padStart(12, '0');
  const random = Math.random().toString(16).substring(2, 14).padStart(12, '0');
  return `${prefix.padStart(8, '0')}-${timestamp.substring(0, 4)}-${timestamp.substring(4, 8)}-${timestamp.substring(8, 12)}-${random}`;
}

const shouldUseMock = () => Platform.OS === 'web' || !isSupabaseEnabled;

const mockStudent: Student = {
  id: '00000000-0000-0000-0000-000000000002',
  organization_id: MOCK_ORGANIZATION_ID,
  first_name: 'Test',
  last_name: 'Student',
  full_name: 'Test Student',
  email: 'student@harryschool.com',
  phone: '+1234567890',
  date_of_birth: '2005-01-01',
  enrollment_date: '2023-09-01',
  enrollment_status: 'active',
  grade_level: '10th Grade',
  profile_image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  streak_days: 7,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockRanking: StudentRanking = {
  id: generateMockUUID('ranking1'),
  organization_id: MOCK_ORGANIZATION_ID,
  student_id: '00000000-0000-0000-0000-000000000002',
  total_points: 1250,
  available_coins: 125,
  spent_coins: 25,
  current_level: 12,
  current_rank: 1,
  last_activity_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockPointsHistory: PointsTransaction[] = [
  {
    id: generateMockUUID('points01'),
    organization_id: MOCK_ORGANIZATION_ID,
    student_id: '00000000-0000-0000-0000-000000000002',
    transaction_type: 'earned',
    points_amount: 50,
    coins_earned: 5,
    reason: 'Completed English Grammar lesson',
    category: 'lesson',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: generateMockUUID('points02'),
    organization_id: MOCK_ORGANIZATION_ID,
    student_id: '00000000-0000-0000-0000-000000000002',
    transaction_type: 'earned',
    points_amount: 30,
    coins_earned: 3,
    reason: 'Completed Math homework',
    category: 'homework',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: generateMockUUID('points03'),
    organization_id: MOCK_ORGANIZATION_ID,
    student_id: '00000000-0000-0000-0000-000000000002',
    transaction_type: 'bonus',
    points_amount: 100,
    coins_earned: 10,
    reason: 'Weekly streak bonus',
    category: 'streak',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
];

const mockHometasks: (Hometask & { submission?: StudentHometaskSubmission })[] = [
  {
    id: generateMockUUID('hometask1'),
    organization_id: MOCK_ORGANIZATION_ID,
    lesson_id: generateMockUUID('lesson01'),
    title: 'English Grammar Exercise',
    description: 'Complete the grammar exercises on present perfect tense',
    type: 'quiz',
    difficulty: 'medium',
    content: { questions: [] },
    points_reward: 50,
    time_limit: 30,
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    is_published: true,
    created_by: generateMockUUID('teacher1'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateMockUUID('hometask2'),
    organization_id: MOCK_ORGANIZATION_ID,
    lesson_id: generateMockUUID('lesson02'),
    title: 'Math Problem Set',
    description: 'Solve algebraic equations',
    type: 'text',
    difficulty: 'hard',
    content: { problems: [] },
    points_reward: 75,
    time_limit: 45,
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // In 2 days
    is_published: true,
    created_by: generateMockUUID('teacher2'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    submission: {
      id: generateMockUUID('submiss2'),
      organization_id: MOCK_ORGANIZATION_ID,
      student_id: '00000000-0000-0000-0000-000000000002',
      hometask_id: generateMockUUID('hometask2'),
      submission_data: { answers: [] },
      score: 85,
      max_score: 100,
      percentage: 85,
      feedback: 'Great work! Keep it up.',
      is_completed: true,
      completed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      graded_at: new Date().toISOString(),
      graded_by: generateMockUUID('teacher2'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

// Mock lessons data
interface Lesson {
  id: string;
  organization_id: string;
  title: string;
  subject: string;
  description: string;
  objectives: string[];
  materials: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  status: 'upcoming' | 'in_progress' | 'completed';
  teacher: string;
  created_at: string;
  updated_at: string;
}

const mockLessons: Lesson[] = [
  {
    id: generateMockUUID('lesson01'),
    organization_id: MOCK_ORGANIZATION_ID,
    title: 'Introduction to Present Perfect Tense',
    subject: 'English Grammar',
    description: 'Learn how to use present perfect tense in English with practical examples and exercises.',
    objectives: [
      'Understand the structure of present perfect tense',
      'Learn when to use present perfect vs simple past',
      'Practice with real-world examples',
      'Complete interactive exercises'
    ],
    materials: [
      'https://example.com/grammar-guide.pdf',
      'https://example.com/practice-exercises.pdf',
      'https://example.com/audio-examples.mp3'
    ],
    difficulty: 'medium',
    duration: 45,
    status: 'upcoming',
    teacher: 'Ms. Johnson',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateMockUUID('lesson02'),
    organization_id: MOCK_ORGANIZATION_ID,
    title: 'Algebraic Equations Fundamentals',
    subject: 'Mathematics',
    description: 'Master the basics of solving linear and quadratic equations with step-by-step methods.',
    objectives: [
      'Solve linear equations with one variable',
      'Understand quadratic equation basics',
      'Apply algebraic methods to word problems',
      'Practice with various equation types'
    ],
    materials: [
      'https://example.com/algebra-textbook.pdf',
      'https://example.com/equation-solver-tool.html',
      'https://example.com/practice-problems.pdf'
    ],
    difficulty: 'hard',
    duration: 60,
    status: 'completed',
    teacher: 'Mr. Smith',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateMockUUID('lesson03'),
    organization_id: MOCK_ORGANIZATION_ID,
    title: 'World War II Overview',
    subject: 'History',
    description: 'Comprehensive overview of World War II causes, major events, and consequences.',
    objectives: [
      'Identify the main causes of WWII',
      'Understand key battles and turning points',
      'Analyze the impact on different countries',
      'Discuss the war\'s lasting effects'
    ],
    materials: [
      'https://example.com/wwii-timeline.pdf',
      'https://example.com/historical-documents.pdf',
      'https://example.com/documentary-links.html'
    ],
    difficulty: 'medium',
    duration: 50,
    status: 'in_progress',
    teacher: 'Mrs. Lee',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateMockUUID('lesson04'),
    organization_id: MOCK_ORGANIZATION_ID,
    title: 'Basic Chemistry: Atoms and Molecules',
    subject: 'Science',
    description: 'Introduction to atomic structure and molecular bonding in chemistry.',
    objectives: [
      'Understand atomic structure',
      'Learn about electron configuration',
      'Explore chemical bonding types',
      'Practice molecular formulas'
    ],
    materials: [
      'https://example.com/chemistry-basics.pdf',
      'https://example.com/periodic-table.pdf',
      'https://example.com/molecular-models.html'
    ],
    difficulty: 'easy',
    duration: 40,
    status: 'upcoming',
    teacher: 'Mr. Brown',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockSchedule: Schedule[] = [
  {
    id: generateMockUUID('schedule1'),
    organization_id: MOCK_ORGANIZATION_ID,
    title: 'English Grammar',
    subject: 'English',
    teacher: 'Ms. Johnson',
    start_time: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // In 2 hours
    end_time: new Date(Date.now() + 1000 * 60 * 60 * 3.5).toISOString(), // In 3.5 hours
    location: 'Room 201',
    type: 'class',
    status: 'upcoming',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateMockUUID('schedule2'),
    organization_id: MOCK_ORGANIZATION_ID,
    title: 'Math Quiz',
    subject: 'Mathematics',
    teacher: 'Mr. Smith',
    start_time: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(), // In 6 hours
    end_time: new Date(Date.now() + 1000 * 60 * 60 * 7).toISOString(), // In 7 hours
    location: 'Room 105',
    type: 'exam',
    status: 'upcoming',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Build vocabulary from CEFR packs with RU/UZ translations stored as JSON in translation
const baseVocabulary: (VocabularyWord & { progress?: StudentVocabularyProgress })[] = Object.entries(CEFR_PACKS).flatMap(([level, items], idxLevel: number) => {
  return (items as VocabItem[]).map((it: VocabItem, i: number) => ({
    id: generateMockUUID(`vocab${level}${String(i + 1).padStart(3, '0')}`),
    organization_id: MOCK_ORGANIZATION_ID,
    word: it.word,
    translation: JSON.stringify({ ru: it.ru, uz: it.uz }),
    definition: it.definition,
    pronunciation: it.pronunciation ?? '',
    example_sentence: it.example ?? '',
    image_url: 'https://images.unsplash.com/photo-1520975730397-9b722b3f43f4?w=300&h=200&fit=crop',
    difficulty: idxLevel <= 1 ? 'easy' : idxLevel <= 3 ? 'medium' : 'hard',
    category: level,
    created_by: generateMockUUID('teacher1'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
});

// Legacy extras removed in favor of structured CEFR packs
const extraWordTuples: Array<[word: string, translation: string, definition: string, difficulty: 'easy'|'medium'|'hard', category: string]> = [
  ['Adapt', 'Adaptar', 'Make (something) suitable for a new use or purpose; modify', 'easy', 'general'],
  ['Benevolent', 'Benevolente', 'Well meaning and kindly', 'medium', 'character'],
  ['Cobble', 'Empedrar', 'Roughly assemble or put together something from available parts', 'medium', 'general'],
  ['Dexterous', 'Diestro', 'Showing or having skill, especially with the hands', 'hard', 'skills'],
  ['Evoke', 'Evocar', 'Bring or recall to the conscious mind', 'easy', 'communication'],
  ['Foster', 'Fomentar', 'Encourage the development of (something)', 'easy', 'general'],
  ['Gravitate', 'Sentir atracción por', 'Move toward or be attracted to a place, person, or thing', 'medium', 'science'],
  ['Heed', 'Prestar atención', 'Pay attention to; take notice of', 'easy', 'general'],
  ['Ignite', 'Encender', 'Catch fire or cause to catch fire; arouse or inflame', 'easy', 'science'],
  ['Jubilant', 'Jubiloso', 'Feeling or expressing great happiness and triumph', 'medium', 'emotion'],
  ['Kinship', 'Parentesco', 'Blood relationship; a sharing of characteristics or origins', 'medium', 'society'],
  ['Lucid', 'Lúcido', 'Expressed clearly; easy to understand', 'easy', 'communication'],
  ['Malleable', 'Maleable', 'Easily influenced; pliable', 'hard', 'science'],
  ['Nimble', 'Ágil', 'Quick and light in movement or action; agile', 'easy', 'fitness'],
  ['Overt', 'Manifiesto', 'Done or shown openly; not hidden', 'medium', 'law'],
  ['Plausible', 'Plausible', 'Seeming reasonable or probable', 'easy', 'logic'],
  ['Quell', 'Sofocar', 'Put an end to (a rebellion or other disorder), typically by force', 'medium', 'history'],
  ['Revere', 'Reverenciar', 'Feel deep respect or admiration for something', 'medium', 'character'],
  ['Savvy', 'Astucia', 'Shrewdness and practical knowledge', 'easy', 'business'],
  ['Tangible', 'Tangible', 'Perceptible by touch; clear and definite; real', 'easy', 'general'],
  ['Ubiquitous', 'Ubicuo', 'Present, appearing, or found everywhere', 'hard', 'advanced'],
  ['Venture', 'Arriesgar', 'Dare to do something or go somewhere that may be dangerous or unpleasant', 'easy', 'business'],
  ['Wary', 'Cauteloso', 'Feeling or showing caution about possible dangers or problems', 'easy', 'character'],
  ['Yield', 'Ceder', 'Give way to arguments, demands, or pressure; produce or provide', 'easy', 'general'],
  ['Zealous', 'Celoso/Entusiasta', 'Having or showing zeal', 'medium', 'character'],
  ['Ameliorate', 'Mejorar', 'Make something bad or unsatisfactory better', 'hard', 'advanced'],
  ['Bolster', 'Reforzar', 'Support or strengthen; prop up', 'medium', 'general'],
  ['Cohesive', 'Cohesivo', 'Characterized by or causing cohesion', 'medium', 'science'],
  ['Derive', 'Derivar', 'Obtain something from (a specified source)', 'easy', 'general'],
  ['Emulate', 'Emular', 'Match or surpass (a person or achievement), typically by imitation', 'medium', 'work'],
  ['Feasible', 'Factible', 'Possible to do easily or conveniently', 'easy', 'business'],
  ['Guile', 'Engaño', 'Sly or cunning intelligence', 'hard', 'character'],
  ['Hinder', 'Obstaculizar', 'Create difficulties resulting in delay or obstruction', 'easy', 'general'],
  ['Imminent', 'Inminente', 'About to happen', 'medium', 'general'],
  ['Jargon', 'Jerga', 'Special words used by a profession or group', 'easy', 'communication'],
  ['Kudos', 'Felicidades', 'Praise and honor received for an achievement', 'easy', 'general'],
  ['Latent', 'Latente', 'Existing but not yet developed or manifest; hidden', 'medium', 'science'],
  ['Mitigate', 'Mitigar', 'Make less severe, serious, or painful', 'medium', 'general'],
  ['Notion', 'Noción', 'A conception of or belief about something', 'easy', 'general'],
  ['Ordeal', 'Calvario', 'A painful or horrific experience', 'medium', 'general'],
  ['Pristine', 'Prístino', 'In its original condition; unspoiled', 'medium', 'nature'],
  ['Robust', 'Robusto', 'Strong and healthy; vigorous', 'easy', 'general'],
  ['Substantiate', 'Sustentar', 'Provide evidence to support the truth of something', 'hard', 'advanced'],
  ['Terse', 'Conciso', 'Sparing in the use of words; abrupt', 'medium', 'communication'],
  ['Unravel', 'Desentrañar', 'Investigate and solve or explain; undo', 'medium', 'general'],
  ['Viable', 'Viable', 'Capable of working successfully; feasible', 'easy', 'business'],
  ['Whimsical', 'Caprichoso', 'Playfully quaint or fanciful', 'medium', 'art'],
  ['Yearn', 'Anhelar', 'Have an intense feeling of longing', 'easy', 'emotion'],
  ['Zenith', 'Cenit', 'The time at which something is most powerful or successful', 'hard', 'astronomy'],
  ['Alleviate', 'Aliviar', 'Make suffering less severe', 'medium', 'health'],
  ['Breach', 'Brecha', 'An act of breaking a law, agreement, or code of conduct', 'medium', 'law'],
  ['Candidacy', 'Candidatura', 'The state of being a candidate', 'medium', 'civics'],
  ['Deter', 'Disuadir', 'Discourage someone from doing something by instilling doubt or fear', 'easy', 'law'],
  ['Eminent', 'Eminente', 'Famous and respected within a profession', 'medium', 'society'],
  ['Futile', 'Fútil', 'Incapable of producing any useful result; pointless', 'medium', 'general'],
  ['Genuine', 'Genuino', 'Truly what something is said to be; authentic', 'easy', 'general'],
  ['Harbor', 'Albergar', 'Keep (a thought or feeling) in one’s mind; give shelter to', 'easy', 'general'],
  ['Imperative', 'Imperativo', 'Of vital importance; crucial', 'medium', 'general'],
  ['Jovial', 'Jovial', 'Cheerful and friendly', 'easy', 'emotion'],
  ['Kinetic', 'Cinético', 'Relating to or resulting from motion', 'medium', 'science'],
  ['Linger', 'Tardarse', 'Stay in a place longer than necessary', 'easy', 'general'],
  ['Meager', 'Exiguo', 'Lacking in quantity or quality', 'medium', 'general'],
  ['Niche', 'Nicho', 'A comfortable or suitable position in life or employment', 'easy', 'business'],
  ['Opaque', 'Opaco', 'Not able to be seen through; not transparent', 'medium', 'science'],
  ['Pivotal', 'Crucial', 'Of crucial importance', 'easy', 'general'],
  ['Quaint', ' Pintoresco', 'Attractively unusual or old-fashioned', 'medium', 'art'],
  ['Rhetoric', 'Retórica', 'The art of effective or persuasive speaking or writing', 'hard', 'communication'],
  ['Sparse', 'Escaso', 'Thinly dispersed or scattered', 'medium', 'general'],
  ['Tranquil', 'Tranquilo', 'Free from disturbance; calm', 'easy', 'nature'],
  ['Undermine', 'Socavar', 'Damage or weaken gradually', 'medium', 'general'],
  ['Vigilant', 'Vigilante', 'Keeping careful watch for possible danger', 'easy', 'security'],
  ['Withstand', 'Resistir', 'Remain undamaged or unaffected by; resist', 'easy', 'general'],
];

const extraVocabulary: (VocabularyWord & { progress?: StudentVocabularyProgress })[] = [];

const mockVocabulary: (VocabularyWord & { progress?: StudentVocabularyProgress })[] = [
  ...baseVocabulary,
];

const mockLeaderboard: StudentRanking[] = [
  mockRanking,
  {
    id: generateMockUUID('ranking2'),
    organization_id: MOCK_ORGANIZATION_ID,
    student_id: '00000000-0000-0000-0000-000000000003',
    total_points: 1100,
    available_coins: 110,
    spent_coins: 15,
    current_level: 11,
    current_rank: 2,
    last_activity_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateMockUUID('ranking3'),
    organization_id: MOCK_ORGANIZATION_ID,
    student_id: '00000000-0000-0000-0000-000000000004',
    total_points: 950,
    available_coins: 95,
    spent_coins: 30,
    current_level: 9,
    current_rank: 3,
    last_activity_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export interface StudentWithRanking extends Student {
  ranking?: StudentRanking;
}

class StudentService {
  async getStudentProfile(studentId: string): Promise<Student | null> {
    try {
      if (shouldUseMock()) {
        return mockStudent;
      }
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) {
        console.warn('Get student profile error (using mock):', JSON.stringify(error, null, 2));
        return mockStudent;
      }

      return data;
    } catch (err) {
      console.warn('Get student profile exception (using mock):', err as any);
      return mockStudent;
    }
  }

  async getStudentRanking(studentId: string): Promise<StudentRanking | null> {
    try {
      if (shouldUseMock()) {
        return mockRanking;
      }
      const { data, error } = await supabase
        .from('student_rankings')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (error) {
        console.warn('Get student ranking error (using mock):', JSON.stringify(error, null, 2));
        return mockRanking;
      }

      return data;
    } catch (err) {
      console.warn('Get student ranking exception (using mock):', err as any);
      return mockRanking;
    }
  }

  async getStudentWithRanking(studentId: string): Promise<StudentWithRanking | null> {
    try {
      const [student, ranking] = await Promise.all([
        this.getStudentProfile(studentId),
        this.getStudentRanking(studentId),
      ]);

      if (!student) {
        return null;
      }

      return {
        ...student,
        ranking: ranking || undefined,
      };
    } catch (err) {
      console.error('Get student with ranking exception:', err);
      return null;
    }
  }

  async getLeaderboard(organizationId: string, limit: number = 10): Promise<StudentRanking[]> {
    try {
      if (shouldUseMock() || !organizationId) {
        return mockLeaderboard.slice(0, limit);
      }

      const { data, error } = await supabase
        .from('student_rankings')
        .select('*')
        .eq('organization_id', organizationId)
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Get leaderboard error (using mock):', JSON.stringify(error, null, 2));
        return mockLeaderboard.slice(0, limit);
      }

      if (!data || data.length === 0) {
        console.log('No leaderboard data found, using mock data');
        return mockLeaderboard.slice(0, limit);
      }

      // Add rank based on order
      const rankedData = (data as StudentRanking[]).map((item: StudentRanking, index: number) => ({
        ...item,
        current_rank: index + 1,
      }));

      return rankedData;
    } catch (err) {
      console.warn('Get leaderboard exception (using mock):', JSON.stringify(err, null, 2));
      return mockLeaderboard.slice(0, limit);
    }
  }

  async getPointsHistory(studentId: string, limit: number = 20): Promise<PointsTransaction[]> {
    try {
      if (shouldUseMock()) {
        return mockPointsHistory.slice(0, limit);
      }
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Get points history error (using mock):', JSON.stringify(error, null, 2));
        return mockPointsHistory.slice(0, limit);
      }

      return data || mockPointsHistory.slice(0, limit);
    } catch (err) {
      console.warn('Get points history exception (using mock):', err as any);
      return mockPointsHistory.slice(0, limit);
    }
  }

  private async getOrganizationIdForStudent(studentId: string): Promise<string | null> {
    try {
      // For now, always return the mock organization ID since we don't have proper auth
      // In a real app, this would come from the authenticated user's profile
      console.log('Using mock organization ID for student:', studentId);
      return MOCK_ORGANIZATION_ID;
    } catch (err) {
      console.error('getOrganizationIdForStudent exception:', JSON.stringify(err, null, 2));
      console.log('Using mock organization ID');
      return MOCK_ORGANIZATION_ID;
    }
  }

  async ensureStudentAndRanking(userId: string, defaults?: Partial<Student>): Promise<void> {
    try {
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingStudent) {
        const orgId = await this.getOrganizationIdForStudent(userId);
        if (!orgId) {
          console.log('ensureStudentAndRanking skipped: no organization_id for user');
        } else {
          await supabase
            .from('students')
            .insert({
              id: userId,
              organization_id: orgId,
              first_name: defaults?.first_name ?? 'Student',
              last_name: defaults?.last_name ?? 'User',
              full_name: `${defaults?.first_name ?? 'Student'} ${defaults?.last_name ?? 'User'}`,
              date_of_birth: defaults?.date_of_birth ?? '2005-01-01',
              enrollment_date: defaults?.enrollment_date ?? new Date().toISOString().slice(0, 10),
              enrollment_status: 'active',
              grade_level: defaults?.grade_level ?? '10th Grade',
              email: defaults?.email,
              phone: defaults?.phone,
              profile_image_url: defaults?.profile_image_url,
            } as any);
        }
      }

      const { data: existingRanking } = await supabase
        .from('student_rankings')
        .select('id')
        .eq('student_id', userId)
        .maybeSingle();

      if (!existingRanking) {
        const orgId = await this.getOrganizationIdForStudent(userId);
        if (orgId) {
          await supabase
            .from('student_rankings')
            .insert({
              organization_id: orgId,
              student_id: userId,
              total_points: 0,
              available_coins: 0,
              spent_coins: 0,
              current_level: 1,
              last_activity_at: new Date().toISOString(),
            });
        }
      }
    } catch (err) {
      console.log('ensureStudentAndRanking error', err);
    }
  }

  async awardPoints(
    studentId: string,
    points: number,
    reason: string,
    category: string = 'manual'
  ): Promise<boolean> {
    try {
      const orgId = await this.getOrganizationIdForStudent(studentId);
      if (!orgId) {
        console.error('Award points error: missing organization_id for student');
        return false;
      }

      const { error } = await supabase
        .from('points_transactions')
        .insert({
          student_id: studentId,
          organization_id: orgId,
          transaction_type: points > 0 ? 'earned' : 'deducted',
          points_amount: points,
          coins_earned: Math.floor(points / 10),
          reason,
          category,
        });

      if (error) {
        console.error('Award points error:', error);
        return false;
      }

      // Update student ranking (this would typically be handled by a database trigger)
      await this.updateStudentRanking(studentId, points);

      return true;
    } catch (err) {
      console.error('Award points exception:', err);
      return false;
    }
  }

  private async updateStudentRanking(studentId: string, pointsChange: number): Promise<void> {
    try {
      const currentRanking = await this.getStudentRanking(studentId);
      
      if (currentRanking) {
        const newTotalPoints = currentRanking.total_points + pointsChange;
        const newCoins = currentRanking.available_coins + Math.floor(pointsChange / 10);
        const newLevel = Math.max(1, Math.floor(newTotalPoints / 100));

        await supabase
          .from('student_rankings')
          .update({
            total_points: newTotalPoints,
            available_coins: newCoins,
            current_level: newLevel,
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId);
      } else {
        // Create new ranking record
        const orgId = await this.getOrganizationIdForStudent(studentId);
        if (!orgId) return;
        await supabase
          .from('student_rankings')
          .insert({
            student_id: studentId,
            organization_id: orgId,
            total_points: Math.max(0, pointsChange),
            available_coins: Math.max(0, Math.floor(pointsChange / 10)),
            spent_coins: 0,
            current_level: Math.max(1, Math.floor(pointsChange / 100)),
            last_activity_at: new Date().toISOString(),
          });
      }
    } catch (err) {
      console.error('Update student ranking exception:', err);
    }
  }

  // Hometasks methods
  async getStudentHometasks(studentId: string, filter?: 'all' | 'pending' | 'completed'): Promise<(Hometask & { submission?: StudentHometaskSubmission })[]> {
    try {
      if (shouldUseMock()) {
        return this.filterMockHometasks(mockHometasks, filter);
      }
      const orgId = await this.getOrganizationIdForStudent(studentId);
      if (!orgId) {
        return this.filterMockHometasks(mockHometasks, filter);
      }

      // First try hometasks table, then fall back to tasks table if it doesn't exist
      let hometasks, hometasksError: any;

      const primary = await supabase
        .from('hometasks')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      hometasks = primary.data;
      hometasksError = primary.error;

      if (hometasksError && (hometasksError.code === 'PGRST205' || String(hometasksError.message || '').includes('Could not find the table'))) {
        const fallback = await supabase
          .from('tasks')
          .select('*')
          .eq('organization_id', orgId)
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        hometasks = fallback.data;
        hometasksError = fallback.error;

        if (!hometasksError) {
          console.log('Using fallback table "tasks" for hometasks');
        }
      }

      if (hometasksError) {
        console.warn('Get student hometasks error (using mock):', JSON.stringify(hometasksError, null, 2));
        return this.filterMockHometasks(mockHometasks, filter);
      }

      if (!hometasks || hometasks.length === 0) {
        return this.filterMockHometasks(mockHometasks, filter);
      }

      // Then get submissions for this student
      const { data: submissions, error: submissionsError } = await supabase
        .from('student_hometask_submissions')
        .select('*')
        .eq('student_id', studentId)
        .eq('organization_id', orgId);

      if (submissionsError) {
        console.error('Get student submissions error:', JSON.stringify(submissionsError, null, 2));
      }

      // Combine hometasks with their submissions
      const processedTasks = (hometasks as Hometask[]).map((task: Hometask) => {
        const submission = (submissions as StudentHometaskSubmission[] | undefined)?.find((sub: StudentHometaskSubmission) => sub.hometask_id === task.id);
        return {
          ...task,
          submission: submission || undefined,
        } as Hometask & { submission?: StudentHometaskSubmission };
      });

      if (filter === 'pending') {
        return processedTasks.filter((task: Hometask & { submission?: StudentHometaskSubmission }) => !task.submission?.is_completed);
      }
      if (filter === 'completed') {
        return processedTasks.filter((task: Hometask & { submission?: StudentHometaskSubmission }) => task.submission?.is_completed);
      }
      return processedTasks;
    } catch (err) {
      console.warn('Get student hometasks exception (using mock):', JSON.stringify(err, null, 2));
      return this.filterMockHometasks(mockHometasks, filter);
    }
  }

  private filterMockHometasks(tasks: (Hometask & { submission?: StudentHometaskSubmission })[], filter?: 'all' | 'pending' | 'completed') {
    if (filter === 'pending') {
      return tasks.filter((task: Hometask & { submission?: StudentHometaskSubmission }) => !task.submission?.is_completed);
    }
    if (filter === 'completed') {
      return tasks.filter((task: Hometask & { submission?: StudentHometaskSubmission }) => task.submission?.is_completed);
    }
    return tasks;
  }

  async submitHometask(
    studentId: string,
    hometaskId: string,
    submissionData: any
  ): Promise<StudentHometaskSubmission | null> {
    try {
      const orgId = await this.getOrganizationIdForStudent(studentId);
      if (!orgId) return null;

      const { data, error } = await supabase
        .from('student_hometask_submissions')
        .upsert({
          organization_id: orgId,
          student_id: studentId,
          hometask_id: hometaskId,
          submission_data: submissionData,
          max_score: 100,
          is_completed: true,
          completed_at: new Date().toISOString(),
          submitted_at: new Date().toISOString(),
        }, { onConflict: 'student_id,hometask_id' })
        .select()
        .single();

      if (error) {
        console.error('Submit hometask error:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Submit hometask exception:', err);
      return null;
    }
  }

  // Vocabulary methods
  async getStudentVocabulary(studentId: string): Promise<(VocabularyWord & { progress?: StudentVocabularyProgress })[]> {
    try {
      if (shouldUseMock()) {
        return mockVocabulary;
      }
      const orgId = await this.getOrganizationIdForStudent(studentId);
      if (!orgId) {
        return mockVocabulary;
      }

      // First get vocabulary words
      const { data: words, error: wordsError } = await supabase
        .from('vocabulary_words')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (wordsError) {
        console.warn('Get student vocabulary error (using mock):', JSON.stringify(wordsError, null, 2));
        return mockVocabulary;
      }

      if (!words || words.length === 0) {
        return mockVocabulary;
      }

      // Then get progress for this student
      const { data: progress, error: progressError } = await supabase
        .from('student_vocabulary_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('organization_id', orgId);

      if (progressError) {
        console.warn('Get vocabulary progress error:', JSON.stringify(progressError, null, 2));
      }

      // Combine words with their progress
      return (words as VocabularyWord[]).map((word: VocabularyWord) => {
        const wordProgress = (progress as StudentVocabularyProgress[] | undefined)?.find((p: StudentVocabularyProgress) => p.vocabulary_word_id === word.id);
        return {
          ...word,
          progress: wordProgress || undefined,
        };
      });
    } catch (err) {
      console.warn('Get student vocabulary exception (using mock):', JSON.stringify(err, null, 2));
      return mockVocabulary;
    }
  }

  async updateVocabularyProgress(
    studentId: string,
    vocabularyWordId: string,
    updates: Partial<StudentVocabularyProgress>
  ): Promise<StudentVocabularyProgress | null> {
    try {
      const orgId = await this.getOrganizationIdForStudent(studentId);
      if (!orgId) return null;

      if (shouldUseMock()) {
        const idx = mockVocabulary.findIndex((w: VocabularyWord & { progress?: StudentVocabularyProgress }) => w.id === vocabularyWordId);
        const base = mockVocabulary[idx];
        const prev = base?.progress;
        const merged: StudentVocabularyProgress = {
          id: prev?.id ?? generateMockUUID('progress'),
          organization_id: orgId,
          student_id: studentId,
          vocabulary_word_id: vocabularyWordId,
          mastery_level: prev?.mastery_level ?? 1,
          is_favorite: prev?.is_favorite ?? false,
          review_count: prev?.review_count ?? 0,
          correct_count: prev?.correct_count ?? 0,
          created_at: prev?.created_at ?? new Date().toISOString(),
          last_reviewed: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...updates,
        };
        if (idx !== -1) {
          mockVocabulary[idx] = {
            ...mockVocabulary[idx],
            progress: merged,
          } as typeof mockVocabulary[number];
        }
        return merged;
      }

      const { data, error } = await supabase
        .from('student_vocabulary_progress')
        .upsert({
          organization_id: orgId,
          student_id: studentId,
          vocabulary_word_id: vocabularyWordId,
          mastery_level: 1,
          is_favorite: false,
          review_count: 0,
          correct_count: 0,
          ...updates,
          last_reviewed: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'student_id,vocabulary_word_id' })
        .select()
        .single();

      if (error) {
        console.error('Update vocabulary progress error:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Update vocabulary progress exception:', err);
      return null;
    }
  }

  // Lessons methods
  async getStudentLessons(studentId: string, filter?: 'all' | 'upcoming' | 'completed' | 'in_progress'): Promise<Lesson[]> {
    try {
      if (shouldUseMock()) {
        return this.filterMockLessons(mockLessons, filter);
      }
      const orgId = await this.getOrganizationIdForStudent(studentId);
      if (!orgId) {
        return this.filterMockLessons(mockLessons, filter);
      }

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Get student lessons error (using mock):', JSON.stringify(error, null, 2));
        return this.filterMockLessons(mockLessons, filter);
      }

      if (!data || data.length === 0) {
        return this.filterMockLessons(mockLessons, filter);
      }

      return this.filterMockLessons(data as Lesson[], filter);
    } catch (err) {
      console.warn('Get student lessons exception (using mock):', JSON.stringify(err, null, 2));
      return this.filterMockLessons(mockLessons, filter);
    }
  }

  private filterMockLessons(lessons: Lesson[], filter?: 'all' | 'upcoming' | 'completed' | 'in_progress') {
    if (filter === 'upcoming') {
      return lessons.filter((lesson: Lesson) => lesson.status === 'upcoming');
    }
    if (filter === 'completed') {
      return lessons.filter((lesson: Lesson) => lesson.status === 'completed');
    }
    if (filter === 'in_progress') {
      return lessons.filter((lesson: Lesson) => lesson.status === 'in_progress');
    }
    return lessons;
  }

  // Schedule methods
  async getStudentSchedule(studentId: string, date?: string): Promise<Schedule[]> {
    try {
      if (shouldUseMock()) {
        return mockSchedule;
      }
      const orgId = await this.getOrganizationIdForStudent(studentId);
      if (!orgId) {
        return mockSchedule;
      }

      let baseQuery = supabase
        .from('schedules')
        .select('*')
        .eq('organization_id', orgId)
        .order('start_time', { ascending: true });

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        baseQuery = baseQuery
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString());
      }

      const { data, error } = await baseQuery;

      if (error) {
        if (error.code === 'PGRST205' || String(error.message || '').includes('Could not find the table')) {
          return mockSchedule;
        }
        console.warn('Get student schedule error (using mock):', JSON.stringify(error, null, 2));
        return mockSchedule;
      }

      if (!data || data.length === 0) {
        return mockSchedule;
      }

      return data;
    } catch (err) {
      console.warn('Get student schedule exception (using mock):', JSON.stringify(err, null, 2));
      return mockSchedule;
    }
  }

  // Real-time subscriptions
  subscribeToRankingUpdates(studentId: string, callback: (ranking: StudentRanking) => void) {
    return supabase
      .channel(`student_ranking_${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_rankings',
          filter: `student_id=eq.${studentId}`,
        },
        (payload: { new: StudentRanking }) => {
          console.log('Ranking updated:', payload.new);
          callback(payload.new);
        }
      )
      .subscribe();
  }

  subscribeToPointsTransactions(studentId: string, callback: (transaction: PointsTransaction) => void) {
    return supabase
      .channel(`points_transactions_${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_transactions',
          filter: `student_id=eq.${studentId}`,
        },
        (payload: { new: PointsTransaction }) => {
          console.log('New points transaction:', payload.new);
          callback(payload.new);
        }
      )
      .subscribe();
  }

  subscribeToHometaskUpdates(studentId: string, callback: (hometask: Hometask) => void) {
    return supabase
      .channel(`hometasks_${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hometasks',
        },
        (payload: { new: Hometask }) => {
          console.log('Hometask updated:', payload.new);
          callback(payload.new);
        }
      )
      .subscribe();
  }
}

export const studentService = new StudentService();

// React Query hooks
export const useStudentProfile = (studentId: string) => {
  return {
    queryKey: ['student', 'profile', studentId],
    queryFn: () => studentService.getStudentProfile(studentId),
    enabled: !!studentId,
  };
};

export const useStudentRanking = (studentId: string) => {
  return {
    queryKey: ['student', 'ranking', studentId],
    queryFn: () => studentService.getStudentRanking(studentId),
    enabled: !!studentId,
  };
};

export const useStudentWithRanking = (studentId: string) => {
  return {
    queryKey: ['student', 'withRanking', studentId],
    queryFn: () => studentService.getStudentWithRanking(studentId),
    enabled: !!studentId,
  };
};

export const useStudentHometasks = (studentId: string, filter?: 'all' | 'pending' | 'completed') => {
  return {
    queryKey: ['student', 'hometasks', studentId, filter],
    queryFn: () => studentService.getStudentHometasks(studentId, filter),
    enabled: !!studentId,
  };
};

export const useStudentVocabulary = (studentId: string) => {
  return {
    queryKey: ['student', 'vocabulary', studentId],
    queryFn: () => studentService.getStudentVocabulary(studentId),
    enabled: !!studentId,
  };
};

export const useStudentSchedule = (studentId: string, date?: string) => {
  return {
    queryKey: ['student', 'schedule', studentId, date],
    queryFn: () => studentService.getStudentSchedule(studentId, date),
    enabled: !!studentId,
  };
};

export const useLeaderboard = (organizationId: string, limit: number = 10) => {
  return {
    queryKey: ['leaderboard', organizationId, limit],
    queryFn: () => studentService.getLeaderboard(organizationId, limit),
    enabled: !!organizationId,
  };
};

export const usePointsHistory = (studentId: string, limit: number = 20) => {
  return {
    queryKey: ['student', 'pointsHistory', studentId, limit],
    queryFn: () => studentService.getPointsHistory(studentId, limit),
    enabled: !!studentId,
  };
};

export const useStudentLessons = (studentId: string, filter?: 'all' | 'upcoming' | 'completed' | 'in_progress') => {
  return {
    queryKey: ['student', 'lessons', studentId, filter],
    queryFn: () => studentService.getStudentLessons(studentId, filter),
    enabled: !!studentId,
  };
};

export type { Lesson };
export { mockLessons };