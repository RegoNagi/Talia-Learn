'use client';

import { useState, useEffect, useCallback } from 'react';
import { classSpaceApi } from '@/services/api';
import { 
  Post, 
  LiveSession, 
  HomeworkItem, 
  QuizItem, 
  ResourceItem, 
  StudentHealthData, 
  StudentSkillsData,
  ClassSpaceFilterState,
  User
} from '@/types/classSpace';

export function useClassSpace() {
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
  const [healthData, setHealthData] = useState<StudentHealthData[]>([]);
  const [skillsData, setSkillsData] = useState<StudentSkillsData[]>([]);

  // Search/Filter states for Resources
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceCategory, setResourceCategory] = useState('All Categories');

  // Loading states
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingHomework, setIsLoadingHomework] = useState(true);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);

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
    classSpaceApi.getCurrentUser().then(setCurrentUser);
  }, []);

  // Fetch Posts
  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const data = await classSpaceApi.getPosts(filters);
      setPosts(data);
    } catch (e) {
      console.error('Failed to fetch posts', e);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [filters]);

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
  const fetchHomework = useCallback(async () => {
    setIsLoadingHomework(true);
    try {
      const data = await classSpaceApi.getHomeworkList(filters);
      setHomeworkList(data);
    } catch (e) {
      console.error('Failed to fetch homework', e);
    } finally {
      setIsLoadingHomework(false);
    }
  }, [filters]);

  // Fetch Quizzes
  const fetchQuizzes = useCallback(async () => {
    setIsLoadingQuizzes(true);
    try {
      const data = await classSpaceApi.getQuizzesList(filters);
      setQuizzes(data);
    } catch (e) {
      console.error('Failed to fetch quizzes', e);
    } finally {
      setIsLoadingQuizzes(false);
    }
  }, [filters]);

  // Fetch Resources
  const fetchResources = useCallback(async () => {
    setIsLoadingResources(true);
    try {
      const data = await classSpaceApi.getResourcesList(resourceSearch, resourceCategory);
      setResources(data);
    } catch (e) {
      console.error('Failed to fetch resources', e);
    } finally {
      setIsLoadingResources(false);
    }
  }, [resourceSearch, resourceCategory]);

  // Fetch Segregated Health Data
  const fetchHealthData = useCallback(async () => {
    setIsLoadingHealth(true);
    try {
      const data = await classSpaceApi.getHealthData(filters);
      setHealthData(data);
    } catch (e) {
      console.error('Failed to fetch health data', e);
    } finally {
      setIsLoadingHealth(false);
    }
  }, [filters]);

  // Fetch Segregated Skills Data
  const fetchSkillsData = useCallback(async () => {
    setIsLoadingSkills(true);
    try {
      const data = await classSpaceApi.getSkillsData(filters);
      setSkillsData(data);
    } catch (e) {
      console.error('Failed to fetch skills data', e);
    } finally {
      setIsLoadingSkills(false);
    }
  }, [filters]);

  // Execute all fetches on filter change
  useEffect(() => {
    fetchPosts();
    fetchLiveSessions();
    fetchHomework();
    fetchQuizzes();
    fetchHealthData();
    fetchSkillsData();
  }, [fetchPosts, fetchLiveSessions, fetchHomework, fetchQuizzes, fetchHealthData, fetchSkillsData]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Mutations
  const createPost = async (postData: Partial<Post>) => {
    try {
      const newPost = await classSpaceApi.createPost(postData);
      setPosts(prev => [newPost, ...prev]);
      showNotification('Post published successfully to Class Space!');
    } catch (e) {
      showNotification('Failed to publish post.');
    }
  };

  const reactToPost = async (postId: string, reaction: keyof Post['interactions']) => {
    try {
      const updated = await classSpaceApi.reactToPost(postId, reaction);
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
    } catch (e) {
      console.error(e);
    }
  };

  const addComment = async (postId: string, commentText: string) => {
    try {
      const updated = await classSpaceApi.addComment(postId, commentText);
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
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
      const newHw = await classSpaceApi.createHomework(data);
      setHomeworkList(prev => [newHw, ...prev]);
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
    // Health Data
    healthData,
    isLoadingHealth,
    // Skills Data
    skillsData,
    isLoadingSkills,
    // Toast
    toastMessage,
    showNotification
  };
}
