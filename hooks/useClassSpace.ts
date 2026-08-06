'use client';

import { useState, useEffect, useCallback } from 'react';
import { classSpaceApi } from '@/services/api';
import { 
  Post, 
  LiveSession, 
  HomeworkItem, 
  QuizItem, 
  ResourceItem, 
  ClassSpaceFilterState,
  User
} from '@/types/classSpace';

import { getRealPosts, createRealPost, reactToRealPost, addRealComment, getRealHomeworkItems, createRealHomeworkItem, getRealQuizItems, getRealResourceItems } from '@/services/classSpaceData';
import { getLiveSessions as getRealLiveSessionsRaw } from '@/services/liveSessionsData';

export function useClassSpace(scope?: { authUser?: any; userRole?: 'teacher' | 'student' | 'parent' | 'qb_supervisor'; classId?: string; subject?: string; grade?: string; className?: string }) {
  const [filters, setFilters] = useState<ClassSpaceFilterState>({
    grade: 'Grade 10',
    className: 'All Classes',
    subject: 'Mathematics & Science',
    status: 'All Status'
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);

  // Search/Filter states for Resources
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceCategory, setResourceCategory] = useState('All Categories');

  // Loading states
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingHomework, setIsLoadingHomework] = useState(true);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isLoadingResources, setIsLoadingResources] = useState(true);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch Current User
  useEffect(() => {
    if (scope?.authUser) {
      setCurrentUser({
        id: scope.authUser.teacherId || scope.authUser.studentId || scope.authUser.userId,
        name: scope.authUser.name,
        role: (scope.userRole || 'student') as any,
        avatar: '',
      });
    } else {
      classSpaceApi.getCurrentUser().then(setCurrentUser);
    }
  }, [scope?.authUser, scope?.userRole]);

  // فصل ومادة محددين فعليًا (مش أي قيمة افتراضية فاضية) — هو الشرط الوحيد اللي بيسمح بجلب/إنشاء بيانات حقيقية.
  // لو مش متحقق، مفيش أي احتياطي وهمي خالص — كل الأقسام بترجع فاضية وتوري رسالة "اختر فصل ومادة".
  const hasRealScope = !!(scope?.classId && scope?.subject && scope?.authUser?.teacherId);

  // Fetch Posts
  const fetchPosts = useCallback(async () => {
    if (!hasRealScope) { setPosts([]); setIsLoadingPosts(false); return; }
    setIsLoadingPosts(true);
    try {
      const data = await getRealPosts(scope!.classId!, scope!.subject!);
      setPosts(data);
    } catch (e) {
      console.error('Failed to fetch posts', e);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [hasRealScope, scope?.classId, scope?.subject]);

  // Fetch Live Sessions
  const fetchLiveSessions = useCallback(async () => {
    if (!hasRealScope) { setLiveSessions([]); setIsLoadingSessions(false); return; }
    setIsLoadingSessions(true);
    try {
      const real = await getRealLiveSessionsRaw(scope!.classId!, scope!.subject!);
      const now = Date.now();
      const mapped: LiveSession[] = real.map((s) => {
        const start = new Date(s.scheduledAt).getTime();
        const status: LiveSession['status'] = Math.abs(now - start) < 60 * 60 * 1000 ? 'live' : (start > now ? 'upcoming' : 'completed');
        return {
          id: s.id,
          title: s.title,
          subject: scope!.subject!,
          grade: scope?.grade || '',
          className: scope?.className || '',
          scheduledAt: s.scheduledAt,
          durationMinutes: 45,
          hostName: scope?.authUser?.name || '',
          hostAvatar: '',
          status,
          joinUrl: s.joinUrl,
        } as LiveSession;
      });
      setLiveSessions(mapped);
    } catch (e) {
      console.error('Failed to fetch live sessions', e);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [hasRealScope, scope?.classId, scope?.subject]);

  // Fetch Homework
  const fetchHomework = useCallback(async () => {
    if (!hasRealScope) { setHomeworkList([]); setIsLoadingHomework(false); return; }
    setIsLoadingHomework(true);
    try {
      const data = await getRealHomeworkItems({ teacherId: scope!.authUser.teacherId, classId: scope!.classId!, subject: scope!.subject!, grade: scope?.grade || '', className: scope?.className || '' });
      setHomeworkList(data);
    } catch (e) {
      console.error('Failed to fetch homework', e);
    } finally {
      setIsLoadingHomework(false);
    }
  }, [hasRealScope, scope?.classId, scope?.subject]);

  // Fetch Quizzes
  const fetchQuizzes = useCallback(async () => {
    if (!hasRealScope) { setQuizzes([]); setIsLoadingQuizzes(false); return; }
    setIsLoadingQuizzes(true);
    try {
      const data = await getRealQuizItems({ teacherId: scope!.authUser.teacherId, classId: scope!.classId!, subject: scope!.subject!, grade: scope?.grade || '', className: scope?.className || '' });
      setQuizzes(data);
    } catch (e) {
      console.error('Failed to fetch quizzes', e);
    } finally {
      setIsLoadingQuizzes(false);
    }
  }, [hasRealScope, scope?.classId, scope?.subject]);

  // Fetch Resources
  const fetchResources = useCallback(async () => {
    if (!hasRealScope) { setResources([]); setIsLoadingResources(false); return; }
    setIsLoadingResources(true);
    try {
      const data = await getRealResourceItems({ teacherId: scope!.authUser.teacherId, classId: scope!.classId!, subject: scope!.subject!, grade: scope?.grade || '' });
      setResources(data);
    } catch (e) {
      console.error('Failed to fetch resources', e);
    } finally {
      setIsLoadingResources(false);
    }
  }, [resourceSearch, resourceCategory, hasRealScope, scope?.classId, scope?.subject]);

  // Execute all fetches on filter change
  useEffect(() => {
    fetchPosts();
    fetchLiveSessions();
    fetchHomework();
    fetchQuizzes();
  }, [fetchPosts, fetchLiveSessions, fetchHomework, fetchQuizzes]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Mutations
  const createPost = async (postData: Partial<Post>) => {
    if (!hasRealScope || !currentUser) {
      showNotification('اختار فصل ومادة الأول عشان تقدر تنشئ');
      return;
    }
    try {
      const newPost = await createRealPost({
        classId: scope!.classId!,
        subject: scope!.subject!,
        authorId: currentUser.id,
        authorRole: currentUser.role,
        authorName: currentUser.name,
        content: postData.content || '',
        topicTag: postData.topicTag,
        media: postData.media,
      });
      if (newPost) setPosts(prev => [newPost, ...prev]);
      showNotification('Post published successfully to Class Space!');
    } catch (e) {
      showNotification('Failed to publish post.');
    }
  };

  const reactToPost = async (postId: string, reaction: keyof Post['interactions']) => {
    if (!hasRealScope || !currentUser) return;
    try {
      await reactToRealPost(postId, currentUser.id, reaction);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, interactions: { ...p.interactions, [reaction]: p.interactions[reaction] + 1 } } : p));
    } catch (e) {
      console.error(e);
    }
  };

  const addComment = async (postId: string, commentText: string) => {
    if (!hasRealScope || !currentUser) return;
    try {
      await addRealComment(postId, currentUser.id, currentUser.role, currentUser.name, commentText);
      const newComment = { id: `local-${Date.now()}`, author: currentUser, content: commentText, timestamp: 'Just now' };
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
      showNotification('Comment added!');
    } catch (e) {
      console.error(e);
    }
  };

  const scheduleLiveSession = async (data: Omit<LiveSession, 'id' | 'hostName' | 'hostAvatar' | 'status'>) => {
    if (!hasRealScope) {
      showNotification('اختار فصل ومادة الأول عشان تقدر تنشئ');
      return;
    }
    try {
      const newSession = await classSpaceApi.scheduleLiveSession(data);
      setLiveSessions(prev => [newSession, ...prev]);
      showNotification('Live broadcast session scheduled!');
    } catch (e) {
      showNotification('Error scheduling session.');
    }
  };

  const createHomework = async (data: Omit<HomeworkItem, 'id' | 'submittedCount' | 'status'>) => {
    if (!hasRealScope) {
      showNotification('اختار فصل ومادة الأول عشان تقدر تنشئ');
      return;
    }
    try {
      const newHw = await createRealHomeworkItem({ teacherId: scope!.authUser.teacherId, classId: scope!.classId!, subject: scope!.subject! }, { title: data.title, dueDate: data.dueDate, instructions: data.instructions });
      if (newHw) setHomeworkList(prev => [newHw, ...prev]);
      showNotification('Homework assignment created!');
    } catch (e) {
      showNotification('Error creating homework.');
    }
  };

  const createQuiz = async (data: Omit<QuizItem, 'id' | 'submissionsCount'>) => {
    if (!hasRealScope) {
      showNotification('اختار فصل ومادة الأول عشان تقدر تنشئ');
      return;
    }
    try {
      const newQuiz = await classSpaceApi.createQuiz(data);
      setQuizzes(prev => [newQuiz, ...prev]);
      showNotification('Quiz diagnostic assessment published!');
    } catch (e) {
      showNotification('Error creating quiz.');
    }
  };

  const updateFilters = (newPartial: Partial<ClassSpaceFilterState>) => {
    setFilters(prev => ({ ...prev, ...newPartial }));
  };

  return {
    filters,
    updateFilters,
    currentUser,
    // Posts
    posts,
    isLoadingPosts,
    createPost,
    reactToPost,
    addComment,
    // Live Sessions
    liveSessions,
    isLoadingSessions,
    scheduleLiveSession,
    // Homework
    homeworkList,
    isLoadingHomework,
    createHomework,
    // Quizzes
    quizzes,
    isLoadingQuizzes,
    createQuiz,
    // Resources
    resources,
    isLoadingResources,
    resourceSearch,
    setResourceSearch,
    resourceCategory,
    setResourceCategory,
    // Toast
    toastMessage,
    showNotification
  };
}
