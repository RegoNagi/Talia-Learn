'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  HeartPulse, 
  Brain, 
  CheckSquare, 
  BookOpen, 
  CheckCircle2,
  Sparkles,
  Radio,
  FileText,
  Target,
  FolderKanban,
  PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useClassSpace } from '@/hooks/useClassSpace';
import { ClassSpaceHeader } from './ClassSpaceHeader';
import { PostComposer } from './PostComposer';
import { PostCard } from './PostCard';
import { LiveSessionsWidget } from './LiveSessionsWidget';
import { HomeworkWidget } from './HomeworkWidget';
import { QuizzesWidget } from './QuizzesWidget';
import { ResourcesWidget } from './ResourcesWidget';
import { GradingWidget } from './GradingWidget';
import { HealthDataWidget } from './HealthDataWidget';
import { SkillsDataWidget } from './SkillsDataWidget';

export function ClassSpaceView() {
  const {
    filters,
    updateFilters,
    currentUser,
    posts,
    isLoadingPosts,
    createPost,
    reactToPost,
    addComment,
    liveSessions,
    isLoadingSessions,
    scheduleLiveSession,
    homeworkList,
    isLoadingHomework,
    createHomework,
    quizzes,
    isLoadingQuizzes,
    createQuiz,
    resources,
    isLoadingResources,
    resourceSearch,
    setResourceSearch,
    resourceCategory,
    setResourceCategory,
    healthData,
    isLoadingHealth,
    skillsData,
    isLoadingSkills,
    toastMessage
  } = useClassSpace();

  const [activeTab, setActiveTab] = useState<'wall' | 'assessments' | 'resources' | 'health' | 'skills'>('wall');
  const [wallFocus, setWallFocus] = useState<'all' | 'live' | 'homework' | 'quizzes' | 'resources' | 'grading'>('all');

  const liveCount = liveSessions.filter(s => s.status === 'live').length || 1;
  const homeworkCount = homeworkList.filter(h => h.status === 'active').length || 3;
  const quizCount = quizzes.length || 2;
  const resourceCount = resources.length || 4;
  const pendingGradingCount = 5;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans" dir="ltr">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 text-xs font-bold"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Filter Header Bar */}
      <ClassSpaceHeader
        filters={filters}
        onFilterChange={updateFilters}
        activeStudentsCount={28}
        liveSessionsCount={liveCount}
        activeHomeworkCount={homeworkCount}
      />

      {/* Reordered & Highlighted Navigation Sub-Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-[1400px] mx-auto flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
          {/* 1. Activity Feed Wall */}
          <button
            onClick={() => setActiveTab('wall')}
            className={`px-4 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
              activeTab === 'wall'
                ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MessageSquare size={16} className={activeTab === 'wall' ? 'text-orange-500' : ''} />
            <span>Class Activity Feed</span>
            <span className="bg-orange-100 text-orange-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              Live Wall
            </span>
          </button>

          {/* 2. Assignments & Quizzes */}
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-4 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
              activeTab === 'assessments'
                ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckSquare size={16} className={activeTab === 'assessments' ? 'text-amber-500' : ''} />
            <span>Assignments & Quizzes</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {homeworkCount + quizCount} Items
            </span>
          </button>

          {/* 3. SCORM & Resources */}
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
              activeTab === 'resources'
                ? 'border-teal-500 text-teal-600 bg-teal-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={16} className={activeTab === 'resources' ? 'text-teal-500' : ''} />
            <span>SCORM & Resources</span>
            <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {resourceCount} Docs
            </span>
          </button>

          {/* 4. Health & Wellbeing (Data Tab) */}
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
              activeTab === 'health'
                ? 'border-rose-500 text-rose-600 bg-rose-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <HeartPulse size={16} className="text-rose-500" />
            <span>Health & Wellbeing</span>
            <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
              Segregated Data
            </span>
          </button>

          {/* 5. Skills & Bloom's Taxonomy (Data Tab) */}
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
              activeTab === 'skills'
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Brain size={16} className="text-indigo-500" />
            <span>Skills & Bloom&apos;s Taxonomy</span>
            <span className="bg-indigo-100 text-indigo-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
              Segregated Data
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5">
        {activeTab === 'wall' && (
          <div className="space-y-5">
            {/* Quick Access Section Switcher (Responsive Mode Only - Icon & Badge Number) */}
            <div className="lg:hidden bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-2.5 shadow-2xs">
              <div className="flex items-center justify-between gap-1 mb-2 px-1">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  Quick Focus
                </span>
                <span className="text-[10px] font-bold text-slate-400">Tap to highlight section</span>
              </div>

              <div className="flex items-center justify-around gap-2 overflow-x-auto pb-1 px-1 custom-scrollbar">
                {/* All */}
                <button
                  onClick={() => setWallFocus('all')}
                  title="All Activity"
                  aria-label="All Activity"
                  className={`relative shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                    wallFocus === 'all'
                      ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2 shadow-md scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles size={18} />
                  <span className={`absolute -top-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-2xs border ${
                    wallFocus === 'all' ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-200 text-slate-800 border-white'
                  }`}>
                    ALL
                  </span>
                </button>

                {/* Live */}
                <button
                  onClick={() => setWallFocus('live')}
                  title="Live Sessions"
                  aria-label="Live Sessions"
                  className={`relative shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                    wallFocus === 'live'
                      ? 'bg-rose-500 text-white ring-2 ring-rose-500 ring-offset-2 shadow-md scale-105'
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <Radio size={18} className={wallFocus === 'live' ? 'animate-pulse' : ''} />
                  <span className={`absolute -top-1 -right-1 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-2xs border ${
                    wallFocus === 'live' ? 'bg-white text-rose-600 border-rose-500' : 'bg-rose-500 text-white border-white'
                  }`}>
                    {liveCount}
                  </span>
                </button>

                {/* Homework */}
                <button
                  onClick={() => setWallFocus('homework')}
                  title="Active Homework"
                  aria-label="Active Homework"
                  className={`relative shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                    wallFocus === 'homework'
                      ? 'bg-amber-500 text-white ring-2 ring-amber-500 ring-offset-2 shadow-md scale-105'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <FileText size={18} />
                  <span className={`absolute -top-1 -right-1 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-2xs border ${
                    wallFocus === 'homework' ? 'bg-slate-900 text-white border-amber-500' : 'bg-amber-500 text-white border-white'
                  }`}>
                    {homeworkCount}
                  </span>
                </button>

                {/* Quizzes */}
                <button
                  onClick={() => setWallFocus('quizzes')}
                  title="Quizzes"
                  aria-label="Quizzes"
                  className={`relative shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                    wallFocus === 'quizzes'
                      ? 'bg-purple-600 text-white ring-2 ring-purple-600 ring-offset-2 shadow-md scale-105'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  <Target size={18} />
                  <span className={`absolute -top-1 -right-1 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-2xs border ${
                    wallFocus === 'quizzes' ? 'bg-slate-900 text-white border-purple-500' : 'bg-purple-600 text-white border-white'
                  }`}>
                    {quizCount}
                  </span>
                </button>

                {/* Resources */}
                <button
                  onClick={() => setWallFocus('resources')}
                  title="SCORM & Resources"
                  aria-label="SCORM & Resources"
                  className={`relative shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                    wallFocus === 'resources'
                      ? 'bg-teal-600 text-white ring-2 ring-teal-600 ring-offset-2 shadow-md scale-105'
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                  }`}
                >
                  <FolderKanban size={18} />
                  <span className={`absolute -top-1 -right-1 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-2xs border ${
                    wallFocus === 'resources' ? 'bg-slate-900 text-white border-teal-500' : 'bg-teal-600 text-white border-white'
                  }`}>
                    {resourceCount}
                  </span>
                </button>

                {/* Grading */}
                <button
                  onClick={() => setWallFocus('grading')}
                  title="Pending Grading"
                  aria-label="Pending Grading"
                  className={`relative shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                    wallFocus === 'grading'
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2 shadow-md scale-105'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  <PenTool size={18} />
                  <span className={`absolute -top-1 -right-1 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-2xs border ${
                    wallFocus === 'grading' ? 'bg-slate-900 text-white border-indigo-500' : 'bg-indigo-600 text-white border-white'
                  }`}>
                    {pendingGradingCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Grid Layout with Section Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT COLUMN: Live Sessions -> Homework -> Quizzes (3 of 12 cols) */}
              <div className="lg:col-span-3 space-y-4">
                <div className={`transition-all rounded-2xl ${wallFocus === 'live' ? 'ring-4 ring-rose-400 ring-offset-2 shadow-lg' : ''}`}>
                  <LiveSessionsWidget
                    sessions={liveSessions}
                    isLoading={isLoadingSessions}
                    onScheduleSession={scheduleLiveSession}
                  />
                </div>

                <div className={`transition-all rounded-2xl ${wallFocus === 'homework' ? 'ring-4 ring-amber-400 ring-offset-2 shadow-lg' : ''}`}>
                  <HomeworkWidget
                    homeworkList={homeworkList}
                    isLoading={isLoadingHomework}
                    onCreateHomework={createHomework}
                  />
                </div>

                <div className={`transition-all rounded-2xl ${wallFocus === 'quizzes' ? 'ring-4 ring-purple-400 ring-offset-2 shadow-lg' : ''}`}>
                  <QuizzesWidget
                    quizzes={quizzes}
                    isLoading={isLoadingQuizzes}
                    onCreateQuiz={createQuiz}
                  />
                </div>
              </div>

              {/* MIDDLE COLUMN: Post Composer -> Post Cards Feed (6 of 12 cols) */}
              <div className="lg:col-span-6 space-y-4">
                <PostComposer
                  currentUser={currentUser}
                  onPublishPost={createPost}
                />

                {isLoadingPosts ? (
                  <div className="space-y-4">
                    <div className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                    <div className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 font-medium text-xs">
                    No posts published in this class space yet.
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onReact={reactToPost}
                      onAddComment={addComment}
                    />
                  ))
                )}
              </div>

              {/* RIGHT COLUMN: Important Resources -> Grading Widget (3 of 12 cols) */}
              <div className="lg:col-span-3 space-y-4">
                <div className={`transition-all rounded-2xl ${wallFocus === 'resources' ? 'ring-4 ring-teal-400 ring-offset-2 shadow-lg' : ''}`}>
                  <ResourcesWidget
                    resources={resources}
                    isLoading={isLoadingResources}
                    searchQuery={resourceSearch}
                    onSearchChange={setResourceSearch}
                    selectedCategory={resourceCategory}
                    onCategoryChange={setResourceCategory}
                  />
                </div>

                <div className={`transition-all rounded-2xl ${wallFocus === 'grading' ? 'ring-4 ring-indigo-400 ring-offset-2 shadow-lg' : ''}`}>
                  <GradingWidget />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Segregated Health Data Tab */}
        {activeTab === 'health' && (
          <HealthDataWidget
            healthData={healthData}
            isLoading={isLoadingHealth}
          />
        )}

        {/* Segregated Skills Data Tab */}
        {activeTab === 'skills' && (
          <SkillsDataWidget
            skillsData={skillsData}
            isLoading={isLoadingSkills}
          />
        )}

        {/* Assessments Tab */}
        {activeTab === 'assessments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <HomeworkWidget
              homeworkList={homeworkList}
              isLoading={isLoadingHomework}
              onCreateHomework={createHomework}
            />
            <QuizzesWidget
              quizzes={quizzes}
              isLoading={isLoadingQuizzes}
              onCreateQuiz={createQuiz}
            />
          </div>
        )}

        {/* SCORM & Study Materials Tab */}
        {activeTab === 'resources' && (
          <ResourcesWidget
            resources={resources}
            isLoading={isLoadingResources}
            searchQuery={resourceSearch}
            onSearchChange={setResourceSearch}
            selectedCategory={resourceCategory}
            onCategoryChange={setResourceCategory}
          />
        )}
      </main>
    </div>
  );
}
