export type Role = 'teacher' | 'student' | 'parent' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  className?: string;
  grade?: string;
}

export interface ClassSpaceFilterState {
  grade: string;
  className: string;
  subject: string;
  status: string;
}

export interface PostComment {
  id: string;
  author: User;
  content: string;
  timestamp: string;
}

export interface PostInteractions {
  insightful: number;
  helpful: number;
  love: number;
  celebration: number;
  thinking: number;
}

export interface PostMedia {
  type: 'image' | 'video' | 'poll' | 'document' | 'audio' | 'link';
  url?: string;
  title?: string;
  options?: { id: string; text: string; votes: number }[];
  linkPreview?: {
    title: string;
    description: string;
    image: string;
    domain: string;
  };
}

export interface AIChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  subject: string;
  grade: string;
}

export interface Post {
  id: string;
  author: User;
  timestamp: string;
  content: string;
  topicTag?: string;
  media?: PostMedia;
  interactions: PostInteractions;
  comments: PostComment[];
  type?: 'standard' | 'challenge';
  challenge?: AIChallenge;
  rewardBadge?: {
    icon: string;
    text: string;
  };
}

export interface LiveSession {
  id: string;
  title: string;
  subject: string;
  grade: string;
  className: string;
  scheduledAt: string;
  durationMinutes: number;
  hostName: string;
  hostAvatar: string;
  status: 'live' | 'upcoming' | 'completed';
  joinUrl?: string;
  attendeesCount?: number;
}

export interface HomeworkItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  className: string;
  dueDate: string;
  totalStudents: number;
  submittedCount: number;
  status: 'active' | 'grading' | 'closed';
  instructions?: string;
}

export interface QuizItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  className: string;
  durationMinutes: number;
  totalQuestions: number;
  totalPoints: number;
  status: 'draft' | 'published' | 'completed';
  submissionsCount: number;
}

export interface ResourceItem {
  id: string;
  title: string;
  type: 'SCORM' | 'PDF' | 'VIDEO' | 'AUDIO';
  subject: string;
  grade: string;
  fileSize?: string;
  duration?: string;
  url: string;
  category: string;
  downloadsCount: number;
}

// --- DISTINCT SEGREGATED DATA MODELS ---

export interface StudentHealthData {
  id: string;
  studentId: string;
  studentName: string;
  avatar: string;
  className: string;
  attendancePercentage: number;
  sleepHoursAverage: number;
  physicalActivityMinutes: number;
  moodStatus: 'Happy' | 'Neutral' | 'Focused' | 'Tired' | 'Stressed';
  wellbeingScore: number; // 0-100
  lastLoggedDate: string;
  alerts?: string[];
}

export interface BloomTaxonomyLevels {
  remember: number;  // 0-100%
  understand: number;
  apply: number;
  analyze: number;
  evaluate: number;
  create: number;
}

export interface CoreCompetencies {
  criticalThinking: number;
  problemSolving: number;
  collaboration: number;
  digitalLiteracy: number;
}

export interface StudentSkillsData {
  id: string;
  studentId: string;
  studentName: string;
  avatar: string;
  className: string;
  subject: string;
  bloomLevels: BloomTaxonomyLevels;
  competencies: CoreCompetencies;
  overallMasteryPercentage: number;
  topSkill: string;
  needsImprovementSkill: string;
}
