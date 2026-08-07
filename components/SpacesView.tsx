'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, X, Zap } from 'lucide-react';
import { getRealPosts, createRealPost, getRealSchoolPosts, createRealSchoolPost, reactToRealPost, addRealComment, getActiveChallenge, createChallenge, getChallengeSubmissions, getTopChallengers, RealChallenge, ChallengeSubmission } from '@/services/classSpaceData';
import { Post } from './spaces/types';
import { PostCard } from './spaces/PostCard';
import { Composer } from './spaces/Composer';
import { ChallengeSubmitForm } from './spaces/ChallengeSubmitForm';
import { ChallengeSubmissionRow } from './spaces/ChallengeSubmissionRow';
import { SpacesSidebar } from './spaces/SpacesSidebar';

const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    space: 'school',
    author: { name: 'Principal Skinner', role: 'Admin', avatar: 'https://picsum.photos/seed/skinner/100' },
    timestamp: '2 hours ago',
    content: 'Annual Science Fair next week! We are so excited to see the innovative projects our students have been working on. Parents are welcome to attend on Friday afternoon.',
    topicTag: 'Event',
    media: {
      type: 'image',
      url: 'https://picsum.photos/seed/sciencefair/800/400'
    },
    interactions: { insightful: 12, helpful: 45, love: 128, celebration: 50, thinking: 2 },
    comments: [
      { id: 'c1', author: { name: 'Parent A', avatar: 'https://picsum.photos/seed/p1/100', role: 'Parent' }, content: 'Can not wait!', timestamp: '1 hour ago' },
      { id: 'c2', author: { name: 'Parent B', avatar: 'https://picsum.photos/seed/p2/100', role: 'Parent' }, content: 'Will there be parking?', timestamp: '45 mins ago' },
      { id: 'c3', author: { name: 'Admin', avatar: 'https://picsum.photos/seed/skinner/100', role: 'Admin' }, content: 'Yes, overflow parking is available.', timestamp: '10 mins ago' }
    ]
  },
  {
    id: 'p2',
    space: 'subject',
    author: { name: 'Alex Johnson', role: 'Teacher', avatar: 'https://picsum.photos/seed/alex/100' },
    timestamp: '4 hours ago',
    content: 'Does anyone have a good resource for understanding Eigenvectors? I am struggling a bit with the visualization part of the formula.',
    topicTag: 'Question',
    interactions: { insightful: 2, helpful: 0, love: 4, celebration: 0, thinking: 10 },
    comments: [
      {
        id: 'c1',
        author: { name: 'Dr. Sarah Miller', role: 'Teacher', avatar: 'https://picsum.photos/seed/teacher/100' },
        content: 'I just uploaded a short video explanation covering this exact topic! Check the module resources, or watch it here.',
        timestamp: '3 hours ago'
      }
    ]
  },
  {
    id: 'p3',
    space: 'class',
    author: { name: 'Ms. Davis', role: 'Teacher', avatar: 'https://picsum.photos/seed/davis/100' },
    timestamp: 'Today at 9:00 AM',
    content: 'Class of 2026 Breakfast 🥞 What a great way to start the morning! So proud of this group.',
    topicTag: 'Social',
    rewardBadge: { icon: '🏆', text: 'Best Class Spirit' },
    media: {
      type: 'image',
      url: 'https://picsum.photos/seed/breakfast/800/400'
    },
    interactions: { insightful: 0, helpful: 0, love: 56, celebration: 20, thinking: 0 },
    comments: []
  },
  {
    id: 'p4',
    space: 'class',
    author: { name: 'Student Council', role: 'Organization', avatar: 'https://picsum.photos/seed/council/100' },
    timestamp: 'Yesterday',
    content: 'Which project topic do you prefer for Term 2? We need your input to finalize the curriculum options!',
    topicTag: 'Poll',
    media: {
      type: 'poll',
      options: [
        { text: 'Space Exploration', votes: 45 },
        { text: 'Artificial Intelligence', votes: 89 },
        { text: 'Renewable Energy', votes: 32 }
      ]
    },
    interactions: { insightful: 8, helpful: 12, love: 24, celebration: 5, thinking: 15 },
    comments: []
  },
  {
    id: 'p4_b',
    space: 'class',
    author: { name: 'Sarah Jenkins', role: 'Teacher', avatar: 'https://picsum.photos/seed/sarah/100' },
    timestamp: '2 hours ago',
    content: 'Do not forget about the Science Museum trip next Wednesday! Please submit your permission slips if you have not already.',
    topicTag: 'Reminder',
    media: {
      type: 'image',
      url: 'https://picsum.photos/seed/museum/800/400'
    },
    interactions: { insightful: 1, helpful: 5, love: 18, celebration: 0, thinking: 0 },
    comments: [
      { id: 'c1', author: { name: 'Alex Johnson', avatar: 'https://picsum.photos/seed/alex/100', role: 'Student' }, content: 'I cant wait!', timestamp: '1 hour ago' }
    ]
  },
  {
    id: 'p5',
    space: 'subject',
    author: { name: 'Dr. Sarah Miller', role: 'Teacher', avatar: 'https://picsum.photos/seed/teacher/100' },
    timestamp: '2 days ago',
    content: 'I have compiled a comprehensive study guide for the upcoming midterm. Please review it and let me know if you have any questions during office hours.',
    topicTag: 'Resource',
    media: {
      type: 'document',
      title: 'Midterm_Exam_Prep_Guide_v2.pdf'
    },
    interactions: { insightful: 34, helpful: 89, love: 45, celebration: 10, thinking: 0 },
    comments: []
  },
  {
    id: 'p6',
    space: 'subject',
    author: { name: 'Dr. Sarah Miller', role: 'Teacher', avatar: 'https://picsum.photos/seed/teacher/100' },
    timestamp: '3 days ago',
    content: 'Here is a quick audio recap of today\'s lecture on Matrix Transformations. Listen to it while commuting!',
    topicTag: 'Audio',
    media: {
      type: 'audio',
      url: '#'
    },
    interactions: { insightful: 15, helpful: 40, love: 20, celebration: 5, thinking: 2 },
    comments: []
  },
  {
    id: 'p7',
    space: 'school',
    author: { name: 'Librarian Smith', role: 'Staff', avatar: 'https://picsum.photos/seed/smith/100' },
    timestamp: '1 week ago',
    content: 'Check out this amazing article on the future of EdTech. Highly recommended read for all staff and students.',
    topicTag: 'Reading',
    media: {
      type: 'link',
      url: 'https://example.com/edtech',
      linkPreview: {
        title: 'The Future of EdTech in 2026',
        description: 'How AI and VR are reshaping the classroom experience.',
        image: 'https://picsum.photos/seed/edtech/800/400',
        domain: 'educationweekly.com'
      }
    },
    interactions: { insightful: 50, helpful: 20, love: 15, celebration: 2, thinking: 30 },
    comments: []
  }
];


export function SpacesView({ space, language = 'en', classId, subject, authUser, onNavigate }: { space: 'school' | 'class' | 'subject', language?: 'ar' | 'en', classId?: string, subject?: string, authUser?: any, onNavigate?: (tab: string) => void }) {
  const isRealScope = space === 'subject' && !!classId && !!subject;
  const isRealSchoolScope = space === 'school';
  const isAnyRealScope = isRealScope || isRealSchoolScope;
  const currentUserId = authUser?.teacherId || authUser?.studentId || authUser?.userId || '';
  const currentUserRole = authUser?.role || 'teacher';
  const currentUserName = authUser?.name || 'User';

  const [posts, setPosts] = useState<Post[]>(isAnyRealScope ? [] : MOCK_POSTS);
  const [isLoadingReal, setIsLoadingReal] = useState(isAnyRealScope);
  const [toast, setToast] = useState<string | null>(null);

  const mapRealPost = (p: any): Post => ({
    id: p.id,
    space,
    type: p.type || 'standard',
    author: { name: p.author.name, role: p.author.role, avatar: p.author.avatar || `https://picsum.photos/seed/${p.author.id}/100` },
    timestamp: p.timestamp,
    content: p.content,
    topicTag: p.topicTag,
    media: p.media,
    interactions: p.interactions,
    comments: (p.comments || []).map((c: any) => ({
      id: c.id,
      author: { name: c.author.name, avatar: c.author.avatar || `https://picsum.photos/seed/${c.author.id}/100`, role: c.author.role },
      content: c.content,
      timestamp: c.timestamp,
    })),
  });

  useEffect(() => {
    if (!isAnyRealScope) return;
    setIsLoadingReal(true);
    const fetchPosts = isRealScope ? getRealPosts(classId!, subject!) : getRealSchoolPosts();
    fetchPosts.then((real) => {
      setPosts(real.map(mapRealPost));
      setIsLoadingReal(false);
    });
  }, [isAnyRealScope, isRealScope, classId, subject]);

  const [activeChallenge, setActiveChallenge] = useState<RealChallenge | null>(null);
  const [topChallengers, setTopChallengers] = useState<ChallengeSubmission[]>([]);
  const [isChallengeSubmitOpen, setIsChallengeSubmitOpen] = useState(false);
  const [isChallengeGradeOpen, setIsChallengeGradeOpen] = useState(false);
  const [challengeSubmissions, setChallengeSubmissions] = useState<ChallengeSubmission[]>([]);

  const refreshChallenge = async () => {
    if (!isRealScope) return;
    const ch = await getActiveChallenge(classId!, subject!);
    setActiveChallenge(ch);
    if (ch) {
      const top = await getTopChallengers(ch.id);
      setTopChallengers(top);
    } else {
      setTopChallengers([]);
    }
  };

  useEffect(() => {
    refreshChallenge();
  }, [isRealScope, classId, subject]);

  const filteredPosts = isAnyRealScope ? posts : posts.filter(p => p.space === space);

  const handleReact = async (postId: string, type: keyof Post['interactions']) => {
    if (!isAnyRealScope || !currentUserId) return;
    await reactToRealPost(postId, currentUserId, type);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, interactions: { ...p.interactions, [type]: p.interactions[type] + 1 } } : p));
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!isAnyRealScope || !currentUserId) return;
    await addRealComment(postId, currentUserId, currentUserRole, currentUserName, text);
    const newComment = { id: `local-${Date.now()}`, author: { name: currentUserName, avatar: `https://picsum.photos/seed/${currentUserId}/100`, role: currentUserRole }, content: text, timestamp: 'Just now' };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
  };

  const handlePublishChallenge = async (challenge: { title: string; xp: number; task: string }) => {
    if (isRealScope && currentUserId) {
      const { ok } = await createChallenge({
        classId: classId!,
        subject: subject!,
        teacherId: currentUserId,
        title: challenge.title,
        task: challenge.task,
        maxXp: challenge.xp,
      });
      if (ok) {
        await refreshChallenge();
        setToast("🚀 Challenge Published to Space!");
        setTimeout(() => setToast(null), 3000);
      }
      return;
    }
    const newPost: Post = {
      id: `p-${Date.now()}`,
      space,
      type: 'challenge',
      author: {
        name: currentUserName,
        role: currentUserRole,
        avatar: `https://picsum.photos/seed/${currentUserId || 'user'}/100`
      },
      timestamp: 'Just now',
      content: challenge.task,
      challenge: {
        title: challenge.title,
        xp: challenge.xp
      },
      interactions: { insightful: 0, helpful: 0, love: 0, celebration: 0, thinking: 0 },
      comments: []
    };

    setPosts([newPost, ...posts]);
    setToast("🚀 Challenge Published to Space!");
    setTimeout(() => setToast(null), 3000);
  };

  const handlePublishPost = async (postData: { content: string, topicTag: string, media?: any }) => {
    if (isRealScope && currentUserId) {
      const newPost = await createRealPost({
        classId: classId!,
        subject: subject!,
        authorId: currentUserId,
        authorRole: currentUserRole,
        authorName: currentUserName,
        content: postData.content,
        topicTag: postData.topicTag,
        media: postData.media,
      });
      if (newPost) setPosts(prev => [mapRealPost(newPost), ...prev]);
    } else if (isRealSchoolScope && currentUserId) {
      const newPost = await createRealSchoolPost({
        authorId: currentUserId,
        authorRole: currentUserRole,
        authorName: currentUserName,
        content: postData.content,
        topicTag: postData.topicTag,
        media: postData.media,
      });
      if (newPost) setPosts(prev => [mapRealPost(newPost), ...prev]);
    } else {
      const newPost: Post = {
        id: `p-${Date.now()}`,
        space,
        type: 'standard',
        author: {
          name: currentUserName,
          role: currentUserRole,
          avatar: `https://picsum.photos/seed/${currentUserId || 'user'}/100`
        },
        timestamp: 'Just now',
        content: postData.content,
        topicTag: postData.topicTag || undefined,
        media: postData.media,
        interactions: { insightful: 0, helpful: 0, love: 0, celebration: 0, thinking: 0 },
        comments: []
      };
      setPosts(prev => [newPost, ...prev]);
    }
    setToast(language === 'ar' ? 'تم نشر مشاركتك بنجاح!' : 'Post published successfully!');
    setTimeout(() => setToast(null), 3000);
  };

  const getSpaceTitle = () => {
    if (language === 'ar') {
      switch (space) {
        case 'school': return 'مساحة المدرسة';
        case 'class': return 'مساحة الفصل';
        case 'subject': return 'مساحة المادة';
      }
    }
    switch (space) {
      case 'school': return 'School Space';
      case 'class': return 'Class Space';
      case 'subject': return 'Subject Space';
    }
  };

  const getSpaceSubtitle = () => {
    if (language === 'ar') {
      switch (space) {
        case 'school': return 'أخبار المدرسة العالمية';
        case 'class': return 'يوميات وتحديثات الفصل';
        case 'subject': return 'المناقشات الأكاديمية';
      }
    }
    switch (space) {
      case 'school': return 'Global News Feed';
      case 'class': return 'Class Story & Updates';
      case 'subject': return 'Academic Discussion';
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 pb-24">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">{getSpaceTitle()}</h2>
        <p className="text-slate-500">{getSpaceSubtitle()}</p>
      </div>

      <div className="flex gap-8 justify-center">
        <div className="flex-1 max-w-3xl space-y-8">
          <Composer 
            onPublishChallenge={handlePublishChallenge} 
            onPublishPost={handlePublishPost} 
            language={language}
          />

          {isRealScope && activeChallenge && (
            <div className="border-2 border-orange-400 bg-gradient-to-br from-white to-orange-50/30 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <Zap className="absolute -bottom-6 -right-6 w-48 h-48 opacity-5 text-orange-500" />
              <div className="relative z-10">
                <div className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider inline-flex items-center gap-1 mb-4">
                  <Zap size={14} className="fill-orange-700" /> {currentUserRole === 'teacher' ? 'Your Active Challenge' : 'New Challenge'}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{activeChallenge.title}</h3>
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black px-4 py-1.5 rounded-full shadow-md shadow-orange-500/30 shrink-0">
                    Up to {activeChallenge.maxXp} XP
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed mb-6">{activeChallenge.task}</p>
                {currentUserRole === 'teacher' ? (
                  <button
                    onClick={async () => { setChallengeSubmissions(await getChallengeSubmissions(activeChallenge.id)); setIsChallengeGradeOpen(true); }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-transform active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} /> View Submissions
                  </button>
                ) : (
                  <button
                    onClick={() => setIsChallengeSubmitOpen(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-transform active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <Zap size={18} className="fill-white" /> Accept Challenge
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {isLoadingReal ? (
              <p className="text-slate-400 text-center py-10">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
            ) : (
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onReact={isAnyRealScope ? handleReact : undefined} onAddComment={isAnyRealScope ? handleAddComment : undefined} />
              ))}
            </AnimatePresence>
            )}
          </div>
        </div>

        <SpacesSidebar space={space} language={language} classId={classId} subject={subject} teacherId={authUser?.teacherId} authUser={authUser} isRealScope={isRealScope} topChallengers={topChallengers} hasActiveChallenge={!!activeChallenge} onNavigate={onNavigate} />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl font-medium z-50 flex items-center gap-2 border border-slate-700"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student: Submit to Challenge */}
      <AnimatePresence>
        {isChallengeSubmitOpen && activeChallenge && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl">
              <div className="bg-orange-500 p-4 text-white flex justify-between items-center">
                <h3 className="font-extrabold text-sm">{activeChallenge.title}</h3>
                <button onClick={() => setIsChallengeSubmitOpen(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
              </div>
              <ChallengeSubmitForm
                challenge={activeChallenge}
                studentId={currentUserId}
                onSubmitted={() => { setIsChallengeSubmitOpen(false); setToast('Submitted!'); setTimeout(() => setToast(null), 2000); }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Teacher: View & Grade Submissions */}
      <AnimatePresence>
        {isChallengeGradeOpen && activeChallenge && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
              <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
                <h3 className="font-extrabold text-sm">{activeChallenge.title} — Submissions</h3>
                <button onClick={() => setIsChallengeGradeOpen(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3 overflow-y-auto">
                {challengeSubmissions.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No submissions yet.</p>
                ) : challengeSubmissions.map((sub) => (
                  <ChallengeSubmissionRow
                    key={sub.id}
                    submission={sub}
                    maxXp={activeChallenge.maxXp}
                    onGraded={async () => { setChallengeSubmissions(await getChallengeSubmissions(activeChallenge.id)); refreshChallenge(); }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
