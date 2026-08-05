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

  // Fetch Posts
  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      if (scope?.classId && scope?.subject) {
        const data = await getRealPosts(scope.classId, scope.subject);
        setPosts(data);
      } else {
        const data = await classSpaceApi.getPosts(filters);
        setPosts(data);
      }
    } catch (e) {
      console.error('Failed to fetch posts', e);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [filters, scope?.classId, scope?.subject]);

  // Fetch Live Sessions
  const fetchLiveSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const data = await classSpaceApi.getLiveSessions(filters);
      setLiveSessions(data);
    } catch (e) {
      console.error('Failed to fetch live sessions', e);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [filters]);

  // Fetch Homework
  const hasRealScope = !!(scope?.classId && scope?.subject && (scope?.authUser?.teacherId));

  const fetchHomework = useCallback(async () => {
    setIsLoadingHomework(true);
    try {
      if (hasRealScope) {
        const data = await getRealHomeworkItems({ teacherId: scope!.authUser.teacherId, classId: scope!.classId!, subject: scope!.subject!, grade: scope?.grade || '', className: scope?.className || '' });
        setHomeworkList(data);
      } else {
        const data = await classSpaceApi.getHomeworkList(filters);
        setHomeworkList(data);
      }
    } catch (e) {
      console.error('Failed to fetch homework', e);
    } finally {
      setIsLoadingHomework(false);
    }
  }, [filters, hasRealScope, scope?.classId, scope?.subject]);

  // Fetch Quizzes
  const fetchQuizzes = useCallback(async () => {
    setIsLoadingQuizzes(true);
    try {
      if (hasRealScope) {
        const data = await getRealQuizItems({ teacherId: scope!.authUser.teacherId, classId: scope!.classId!, subject: scope!.subject!, grade: scope?.grade || '', className: scope?.className || '' });
        setQuizzes(data);
      } else {
        const data = await classSpaceApi.getQuizzesList(filters);
        setQuizzes(data);
      }
    } catch (e) {
      console.error('Failed to fetch quizzes', e);
    } finally {
      setIsLoadingQuizzes(false);
    }
  }, [filters, hasRealScope, scope?.classId, scope?.subject]);

  // Fetch Resources
  const fetchResources = useCallback(async () => {
    setIsLoadingResources(true);
    try {
      if (hasRealScope) {
        const data = await getRealResourceItems({ teacherId: scope!.authUser.teacherId, classId: scope!.classId!, subject: scope!.subject!, grade: scope?.grade || '' });
        setResources(data);
      } else {
        const data = await classSpaceApi.getResourcesList(resourceSearch, resourceCategory);
        setResources(data);
      }
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
    try {
      if (scope?.classId && scope?.subject && currentUser) {
        const newPost = await createRealPost({
          classId: scope.classId,
          subject: scope.subject,
          authorId: currentUser.id,
          authorRole: currentUser.role,
          authorName: currentUser.name,
          content: postData.content || '',
          topicTag: postData.topicTag,
          media: postData.media,
        });
        if (newPost) setPosts(prev => [newPost, ...prev]);
      } else {
        const newPost = await classSpaceApi.createPost(postData);
        setPosts(prev => [newPost, ...prev]);
      }
      showNotification('Post published successfully to Class Space!');
    } catch (e) {
      showNotification('Failed to publish post.');
    }
  };

  const reactToPost = async (postId: string, reaction: keyof Post['interactions']) => {
    try {
      if (scope?.classId && scope?.subject && currentUser) {
        await reactToRealPost(postId, currentUser.id, reaction);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, interactions: { ...p.interactions, [reaction]: p.interactions[reaction] + 1 } } : p));
      } else {
        const updated = await classSpaceApi.reactToPost(postId, reaction);
        setPosts(prev => prev.map(p => p.id === postId ? updated : p));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addComment = async (postId: string, commentText: string) => {
    try {
      if (scope?.classId && scope?.subject && currentUser) {
        await addRealComment(postId, currentUser.id, currentUser.role, currentUser.name, commentText);
        const newComment = { id: `local-${Date.now()}`, author: currentUser, content: commentText, timestamp: 'Just now' };
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
      } else {
        const updated = await classSpaceApi.addComment(postId, commentText);
        setPosts(prev => prev.map(p => p.id === postId ? updated : p));
      }
      showNotification('Comment added!');
    } catch (e) {
      console.error(e);
    }
  };

  const scheduleLiveSession = async (data: Omit<LiveSession, 'id' | 'hostName' | 'hostAvatar' | 'status'>) => {
    try {
      const newSession = await classSpaceApi.scheduleLiveSession(data);
      setLiveSessions(prev => [newSession, ...prev]);
      showNotification('Live broadcast session scheduled!');
    } catch (e) {
      showNotification('Error scheduling session.');
    }
  };

  const createHomework = async (data: Omit<HomeworkItem, 'id' | 'submittedCount' | 'status'>) => {
    try {
      if (hasRealScope) {
        const newHw = await createRealHomeworkItem({ teacherId: scope!.authUser.teacherId, classId: scope!.classId!, subject: scope!.subject! }, { title: data.title, dueDate: data.dueDate, instructions: data.instructions });
        if (newHw) setHomeworkList(prev => [newHw, ...prev]);
      } else {
        const newHw = await classSpaceApi.createHomework(data);
        setHomeworkList(prev => [newHw, ...prev]);
      }
      showNotification('Homework assignment created!');
    } catch (e) {
      showNotification('Error creating homework.');
    }
  };

  const createQuiz = async (data: Omit<QuizItem, 'id' | 'submissionsCount'>) => {
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
