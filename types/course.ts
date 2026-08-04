
export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  level?: number;
  coins?: number;
}

export interface Task {
  id: string;
  title: string;
  type: 'assignment' | 'quiz' | 'reading' | 'live_session' | 'grading';
  dueDate: string; // ISO Date
  completed: boolean;
  courseId: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  instructorId: string;
  themeColor: string; // e.g., 'lavender', 'mint', 'coral'
  officialCategories: string[]; // "Locked" categories from core
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  mediaUrl?: string;
}

export interface Module {
  id: string;
  title: string;
  status: 'locked' | 'active' | 'completed';
  type: 'lesson' | 'quiz' | 'project';
  position: { x: number; y: number }; // For Quest Map
}

export interface GradeEntry {
  studentId: string;
  studentName: string;
  avatarUrl: string;
  grades: Record<string, number | null>; // category -> score
}
