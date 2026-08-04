import { 
  Post, 
  LiveSession, 
  HomeworkItem, 
  QuizItem, 
  ResourceItem, 
  StudentHealthData, 
  StudentSkillsData,
  ClassSpaceFilterState,
  AIChallenge,
  User
} from '@/types/classSpace';

// Helper to simulate network latency
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_CURRENT_USER: User = {
  id: 'u-sarah',
  name: 'Sarah Jenkins',
  role: 'teacher',
  avatar: 'https://picsum.photos/seed/sarah/100',
  className: '10-A',
  grade: 'Grade 10',
};

const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    author: {
      id: 'u-sarah',
      name: 'Sarah Jenkins',
      role: 'teacher',
      avatar: 'https://picsum.photos/seed/sarah/100',
    },
    timestamp: '10 mins ago',
    content: 'Welcome students to our Grade 10 Mathematics & Physics Class Space! Please check the resources tab for Unit 1 study guides, and review the live session schedule for upcoming interactive reviews.',
    topicTag: 'Announcement',
    rewardBadge: {
      icon: '⭐',
      text: 'Class Sticky'
    },
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=80',
    },
    interactions: {
      insightful: 14,
      helpful: 28,
      love: 35,
      celebration: 19,
      thinking: 3,
    },
    comments: [
      {
        id: 'comm-1',
        author: {
          id: 'u-alex',
          name: 'Alex Johnson',
          role: 'student',
          avatar: 'https://picsum.photos/seed/alex/100',
        },
        content: 'Thank you Ms. Jenkins! Will the recording of tomorrow\'s session be posted?',
        timestamp: '5 mins ago'
      },
      {
        id: 'comm-2',
        author: {
          id: 'u-sarah',
          name: 'Sarah Jenkins',
          role: 'teacher',
          avatar: 'https://picsum.photos/seed/sarah/100',
        },
        content: 'Yes Alex! All live sessions are automatically archived in the Resources widget.',
        timestamp: '2 mins ago'
      }
    ]
  },
  {
    id: 'post-2',
    author: {
      id: 'u-ai-bot',
      name: 'Talia AI Assistant',
      role: 'admin',
      avatar: 'https://picsum.photos/seed/talia-ai/100',
    },
    type: 'challenge',
    timestamp: '1 hour ago',
    content: 'Solve this quick 3D Matrix Vector transformation problem! Earn +100 XP towards your STEM Mastery level.',
    challenge: {
      id: 'ch-1',
      title: 'Matrix Vector Challenge #4',
      description: 'Compute the determinant of matrix A = [[2, 4], [1, 3]] and state if it is invertible.',
      xpReward: 100,
      subject: 'Mathematics',
      grade: 'Grade 10',
    },
    interactions: {
      insightful: 22,
      helpful: 15,
      love: 42,
      celebration: 30,
      thinking: 12,
    },
    comments: []
  },
  {
    id: 'post-3',
    author: {
      id: 'u-david',
      name: 'David Miller',
      role: 'student',
      avatar: 'https://picsum.photos/seed/david/100',
    },
    timestamp: '3 hours ago',
    content: 'Which lab setup option did everyone pick for the Physics Newton Law experiment? Share your lab partner preferences below!',
    topicTag: 'Question',
    media: {
      type: 'poll',
      options: [
        { id: 'opt-1', text: 'Air Track Frictionless Motion', votes: 14 },
        { id: 'opt-2', text: 'Freefall Photogate Sensor', votes: 22 },
        { id: 'opt-3', text: 'Incline Plane Dynamics', votes: 8 },
      ]
    },
    interactions: {
      insightful: 5,
      helpful: 9,
      love: 12,
      celebration: 4,
      thinking: 18,
    },
    comments: []
  }
];

const INITIAL_LIVE_SESSIONS: LiveSession[] = [
  {
    id: 'ls-1',
    title: 'Algebraic Vectors & Matrix Operators Live Review',
    subject: 'Mathematics',
    grade: 'Grade 10',
    className: '10-A',
    scheduledAt: '2026-08-03T11:00:00Z',
    durationMinutes: 45,
    hostName: 'Sarah Jenkins',
    hostAvatar: 'https://picsum.photos/seed/sarah/100',
    status: 'live',
    joinUrl: 'https://meet.google.com/abc-defg-hij',
    attendeesCount: 18
  },
  {
    id: 'ls-2',
    title: 'Physics Lab: Kinematics & Motion Graphs',
    subject: 'Physics',
    grade: 'Grade 10',
    className: '10-B',
    scheduledAt: '2026-08-04T09:30:00Z',
    durationMinutes: 60,
    hostName: 'Dr. Robert Vance',
    hostAvatar: 'https://picsum.photos/seed/robert/100',
    status: 'upcoming',
    joinUrl: 'https://meet.google.com/xyz-uvwx-rst',
    attendeesCount: 0
  },
  {
    id: 'ls-3',
    title: 'Chemistry Organic Compounds Office Hours',
    subject: 'Chemistry',
    grade: 'Grade 11',
    className: '11-A',
    scheduledAt: '2026-08-02T14:00:00Z',
    durationMinutes: 30,
    hostName: 'Sarah Jenkins',
    hostAvatar: 'https://picsum.photos/seed/sarah/100',
    status: 'completed',
    attendeesCount: 24
  }
];

const INITIAL_HOMEWORK: HomeworkItem[] = [
  {
    id: 'hw-1',
    title: 'Problem Set 4: Quadratic Functions & Parabolas',
    subject: 'Mathematics',
    grade: 'Grade 10',
    className: '10-A',
    dueDate: '2026-08-05T23:59:00Z',
    totalStudents: 28,
    submittedCount: 22,
    status: 'active',
    instructions: 'Complete exercises 1 through 15 on page 142. Upload a scan or PDF of your handwritten step-by-step solutions.'
  },
  {
    id: 'hw-2',
    title: 'Physics Experiment 2 Lab Report',
    subject: 'Physics',
    grade: 'Grade 10',
    className: '10-A',
    dueDate: '2026-08-02T18:00:00Z',
    totalStudents: 28,
    submittedCount: 28,
    status: 'grading',
    instructions: 'Include error margin calculations, data tables, and acceleration curves.'
  },
  {
    id: 'hw-3',
    title: 'Thermodynamics Essay & Case Study',
    subject: 'Physics',
    grade: 'Grade 11',
    className: '11-B',
    dueDate: '2026-07-28T23:59:00Z',
    totalStudents: 25,
    submittedCount: 25,
    status: 'closed'
  }
];

const INITIAL_QUIZZES: QuizItem[] = [
  {
    id: 'qz-1',
    title: 'Unit 1 Midterm Matrix Diagnostic',
    subject: 'Mathematics',
    grade: 'Grade 10',
    className: '10-A',
    durationMinutes: 30,
    totalQuestions: 15,
    totalPoints: 100,
    status: 'published',
    submissionsCount: 19
  },
  {
    id: 'qz-2',
    title: 'Vectors & Force Vectors Checkpoint',
    subject: 'Physics',
    grade: 'Grade 10',
    className: '10-A',
    durationMinutes: 20,
    totalQuestions: 10,
    totalPoints: 50,
    status: 'published',
    submissionsCount: 26
  },
  {
    id: 'qz-3',
    title: 'Organic Nomenclature Pre-Quiz',
    subject: 'Chemistry',
    grade: 'Grade 11',
    className: '11-A',
    durationMinutes: 15,
    totalQuestions: 8,
    totalPoints: 40,
    status: 'draft',
    submissionsCount: 0
  }
];

const INITIAL_RESOURCES: ResourceItem[] = [
  {
    id: 'res-1',
    title: 'Interactive 3D Geometry SCORM Module',
    type: 'SCORM',
    subject: 'Mathematics',
    grade: 'Grade 10',
    fileSize: '42 MB',
    url: '#',
    category: 'Interactive Labs',
    downloadsCount: 142
  },
  {
    id: 'res-2',
    title: 'Physics Mechanics Equation Reference Guide (PDF)',
    type: 'PDF',
    subject: 'Physics',
    grade: 'Grade 10',
    fileSize: '3.4 MB',
    url: '#',
    category: 'Study Guides',
    downloadsCount: 310
  },
  {
    id: 'res-3',
    title: 'Lecture Recording: Matrix Linear Transformations',
    type: 'VIDEO',
    subject: 'Mathematics',
    grade: 'Grade 10',
    duration: '38 mins',
    url: '#',
    category: 'Recorded Sessions',
    downloadsCount: 98
  },
  {
    id: 'res-4',
    title: 'Audio Lecture Recap: Newton Third Law Deep Dive',
    type: 'AUDIO',
    subject: 'Physics',
    grade: 'Grade 10',
    duration: '14 mins',
    url: '#',
    category: 'Audio Summaries',
    downloadsCount: 64
  }
];

// --- SEGREGATED HEALTH DATA MOCK (Wellbeing, Sleep, Attendance, Activity) ---
const INITIAL_HEALTH_DATA: StudentHealthData[] = [
  {
    id: 'h-1',
    studentId: 'st-101',
    studentName: 'Alex Johnson',
    avatar: 'https://picsum.photos/seed/alex/100',
    className: '10-A',
    attendancePercentage: 98,
    sleepHoursAverage: 8.2,
    physicalActivityMinutes: 45,
    moodStatus: 'Happy',
    wellbeingScore: 92,
    lastLoggedDate: '2026-08-03',
  },
  {
    id: 'h-2',
    studentId: 'st-102',
    studentName: 'Emma Thompson',
    avatar: 'https://picsum.photos/seed/emma/100',
    className: '10-A',
    attendancePercentage: 94,
    sleepHoursAverage: 7.5,
    physicalActivityMinutes: 60,
    moodStatus: 'Focused',
    wellbeingScore: 88,
    lastLoggedDate: '2026-08-03',
  },
  {
    id: 'h-3',
    studentId: 'st-103',
    studentName: 'Liam Chen',
    avatar: 'https://picsum.photos/seed/liam/100',
    className: '10-A',
    attendancePercentage: 86,
    sleepHoursAverage: 5.8,
    physicalActivityMinutes: 15,
    moodStatus: 'Tired',
    wellbeingScore: 64,
    lastLoggedDate: '2026-08-03',
    alerts: ['Sleep under 6 hours for 3 consecutive days', 'Attendance dropped below 90%']
  },
  {
    id: 'h-4',
    studentId: 'st-104',
    studentName: 'Sophia Rodriguez',
    avatar: 'https://picsum.photos/seed/sophia/100',
    className: '10-B',
    attendancePercentage: 100,
    sleepHoursAverage: 8.8,
    physicalActivityMinutes: 50,
    moodStatus: 'Happy',
    wellbeingScore: 96,
    lastLoggedDate: '2026-08-03',
  },
  {
    id: 'h-5',
    studentId: 'st-105',
    studentName: 'Noah Smith',
    avatar: 'https://picsum.photos/seed/noah/100',
    className: '10-B',
    attendancePercentage: 91,
    sleepHoursAverage: 6.4,
    physicalActivityMinutes: 30,
    moodStatus: 'Stressed',
    wellbeingScore: 72,
    lastLoggedDate: '2026-08-03',
    alerts: ['High stress reported before Math Midterm']
  }
];

// --- SEGREGATED SKILLS DATA MOCK (Bloom's Taxonomy & Competencies) ---
const INITIAL_SKILLS_DATA: StudentSkillsData[] = [
  {
    id: 'sk-1',
    studentId: 'st-101',
    studentName: 'Alex Johnson',
    avatar: 'https://picsum.photos/seed/alex/100',
    className: '10-A',
    subject: 'Mathematics',
    bloomLevels: {
      remember: 95,
      understand: 90,
      apply: 85,
      analyze: 80,
      evaluate: 72,
      create: 68
    },
    competencies: {
      criticalThinking: 84,
      problemSolving: 88,
      collaboration: 92,
      digitalLiteracy: 95
    },
    overallMasteryPercentage: 86,
    topSkill: 'Digital Literacy & Applied Problem Solving',
    needsImprovementSkill: 'Evaluation & Complex Synthesis'
  },
  {
    id: 'sk-2',
    studentId: 'st-102',
    studentName: 'Emma Thompson',
    avatar: 'https://picsum.photos/seed/emma/100',
    className: '10-A',
    subject: 'Mathematics',
    bloomLevels: {
      remember: 98,
      understand: 96,
      apply: 92,
      analyze: 90,
      evaluate: 88,
      create: 84
    },
    competencies: {
      criticalThinking: 92,
      problemSolving: 90,
      collaboration: 96,
      digitalLiteracy: 90
    },
    overallMasteryPercentage: 92,
    topSkill: 'Peer Collaboration & Creative Design',
    needsImprovementSkill: 'Speed in Time-bounded Exams'
  },
  {
    id: 'sk-3',
    studentId: 'st-103',
    studentName: 'Liam Chen',
    avatar: 'https://picsum.photos/seed/liam/100',
    className: '10-A',
    subject: 'Physics',
    bloomLevels: {
      remember: 80,
      understand: 75,
      apply: 65,
      analyze: 58,
      evaluate: 50,
      create: 45
    },
    competencies: {
      criticalThinking: 62,
      problemSolving: 60,
      collaboration: 70,
      digitalLiteracy: 78
    },
    overallMasteryPercentage: 65,
    topSkill: 'Factual Memory & Digital Tools',
    needsImprovementSkill: 'Analytical Problem Solving'
  }
];

// Stateful local stores for mutations simulation
let postsStore = [...INITIAL_POSTS];
let liveSessionsStore = [...INITIAL_LIVE_SESSIONS];
let homeworkStore = [...INITIAL_HOMEWORK];
let quizzesStore = [...INITIAL_QUIZZES];
let resourcesStore = [...INITIAL_RESOURCES];
let healthStore = [...INITIAL_HEALTH_DATA];
let skillsStore = [...INITIAL_SKILLS_DATA];

export const classSpaceApi = {
  // Current User
  async getCurrentUser(): Promise<User> {
    await delay(150);
    return MOCK_CURRENT_USER;
  },

  // Posts
  async getPosts(filters?: ClassSpaceFilterState): Promise<Post[]> {
    await delay(300);
    let result = [...postsStore];
    if (filters && filters.status && filters.status !== 'All Status') {
      if (filters.status === 'Challenges') {
        result = result.filter(p => p.type === 'challenge');
      } else if (filters.status === 'Announcements') {
        result = result.filter(p => p.topicTag === 'Announcement');
      }
    }
    return result;
  },

  async createPost(postData: Partial<Post>): Promise<Post> {
    await delay(400);
    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: MOCK_CURRENT_USER,
      timestamp: 'Just now',
      content: postData.content || '',
      topicTag: postData.topicTag || 'General',
      media: postData.media,
      type: postData.type || 'standard',
      challenge: postData.challenge,
      interactions: {
        insightful: 0,
        helpful: 0,
        love: 0,
        celebration: 0,
        thinking: 0
      },
      comments: []
    };
    postsStore = [newPost, ...postsStore];
    return newPost;
  },

  async reactToPost(postId: string, reactionType: keyof Post['interactions']): Promise<Post> {
    await delay(200);
    postsStore = postsStore.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          interactions: {
            ...p.interactions,
            [reactionType]: p.interactions[reactionType] + 1
          }
        };
      }
      return p;
    });
    const updated = postsStore.find(p => p.id === postId);
    if (!updated) throw new Error('Post not found');
    return updated;
  },

  async addComment(postId: string, commentText: string): Promise<Post> {
    await delay(250);
    postsStore = postsStore.map(p => {
      if (p.id === postId) {
        const newComm = {
          id: `comm-${Date.now()}`,
          author: MOCK_CURRENT_USER,
          content: commentText,
          timestamp: 'Just now'
        };
        return {
          ...p,
          comments: [...p.comments, newComm]
        };
      }
      return p;
    });
    const updated = postsStore.find(p => p.id === postId);
    if (!updated) throw new Error('Post not found');
    return updated;
  },

  // Live Sessions
  async getLiveSessions(filters?: ClassSpaceFilterState): Promise<LiveSession[]> {
    await delay(300);
    let list = [...liveSessionsStore];
    if (filters?.className && filters.className !== 'All Classes') {
      list = list.filter(s => s.className === filters.className || s.className === 'All');
    }
    return list;
  },

  async scheduleLiveSession(sessionData: Omit<LiveSession, 'id' | 'hostName' | 'hostAvatar' | 'status'>): Promise<LiveSession> {
    await delay(450);
    const newSession: LiveSession = {
      ...sessionData,
      id: `ls-${Date.now()}`,
      hostName: MOCK_CURRENT_USER.name,
      hostAvatar: MOCK_CURRENT_USER.avatar,
      status: 'upcoming',
      attendeesCount: 0,
      joinUrl: `https://meet.google.com/room-${Math.floor(Math.random()*1000)}`
    };
    liveSessionsStore = [newSession, ...liveSessionsStore];
    return newSession;
  },

  // Homework
  async getHomeworkList(filters?: ClassSpaceFilterState): Promise<HomeworkItem[]> {
    await delay(300);
    let list = [...homeworkStore];
    if (filters?.className && filters.className !== 'All Classes') {
      list = list.filter(h => h.className === filters.className);
    }
    return list;
  },

  async createHomework(data: Omit<HomeworkItem, 'id' | 'submittedCount' | 'status'>): Promise<HomeworkItem> {
    await delay(400);
    const newItem: HomeworkItem = {
      ...data,
      id: `hw-${Date.now()}`,
      submittedCount: 0,
      status: 'active'
    };
    homeworkStore = [newItem, ...homeworkStore];
    return newItem;
  },

  // Quizzes
  async getQuizzesList(filters?: ClassSpaceFilterState): Promise<QuizItem[]> {
    await delay(300);
    let list = [...quizzesStore];
    if (filters?.className && filters.className !== 'All Classes') {
      list = list.filter(q => q.className === filters.className);
    }
    return list;
  },

  async createQuiz(data: Omit<QuizItem, 'id' | 'submissionsCount'>): Promise<QuizItem> {
    await delay(400);
    const newQuiz: QuizItem = {
      ...data,
      id: `qz-${Date.now()}`,
      submissionsCount: 0
    };
    quizzesStore = [newQuiz, ...quizzesStore];
    return newQuiz;
  },

  // Resources
  async getResourcesList(query?: string, category?: string): Promise<ResourceItem[]> {
    await delay(250);
    let list = [...resourcesStore];
    if (category && category !== 'All Categories') {
      list = list.filter(r => r.category.toLowerCase() === category.toLowerCase());
    }
    if (query && query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q));
    }
    return list;
  },

  // --- DISTINCT HEALTH DATA ENDPOINTS ---
  async getHealthData(filters?: ClassSpaceFilterState): Promise<StudentHealthData[]> {
    await delay(350);
    let list = [...healthStore];
    if (filters?.className && filters.className !== 'All Classes') {
      list = list.filter(h => h.className === filters.className);
    }
    return list;
  },

  // --- DISTINCT SKILLS DATA ENDPOINTS ---
  async getSkillsData(filters?: ClassSpaceFilterState): Promise<StudentSkillsData[]> {
    await delay(350);
    let list = [...skillsStore];
    if (filters?.className && filters.className !== 'All Classes') {
      list = list.filter(s => s.className === filters.className);
    }
    return list;
  }
};
