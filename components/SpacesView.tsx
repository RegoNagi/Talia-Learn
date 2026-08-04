'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, Video, FileText, BarChart2, MessageSquare, 
  Heart, CheckCircle, Lightbulb, MoreHorizontal, Send, Mic, 
  Tag, Star, Trophy, PartyPopper, Brain, Link as LinkIcon, Play, Plus, X, Zap, Sparkles, ArrowRight, ChevronRight, Calendar
} from 'lucide-react';
import Image from 'next/image';

interface Post {
  id: string;
  space: 'school' | 'class' | 'subject';
  type?: 'standard' | 'challenge';
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  timestamp: string;
  content: string;
  challenge?: {
    title: string;
    xp: number;
  };
  topicTag?: string;
  rewardBadge?: {
    icon: string;
    text: string;
  };
  media?: {
    type: 'image' | 'video' | 'poll' | 'document' | 'audio' | 'link';
    url?: string;
    title?: string;
    options?: { text: string; votes: number }[];
    linkPreview?: {
      title: string;
      description: string;
      image: string;
      domain: string;
    };
  };
  interactions: {
    insightful: number;
    helpful: number;
    love: number;
    celebration: number;
    thinking: number;
  };
  comments: {
    id: string;
    author: { name: string; avatar: string; role: string };
    content: string;
    timestamp: string;
  }[];
}

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

function PostCard({ post }: { post: Post }) {
  const [showAllComments, setShowAllComments] = useState(false);
  const visibleComments = showAllComments ? post.comments : post.comments.slice(0, 2);

  if (post.type === 'challenge' && post.challenge) {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="border-2 border-orange-400 bg-gradient-to-br from-white to-orange-50/30 rounded-2xl p-6 shadow-sm relative overflow-hidden"
      >
        <Zap className="absolute -bottom-6 -right-6 w-48 h-48 opacity-5 text-orange-500" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider inline-flex items-center gap-1">
              <Zap size={14} className="fill-orange-700" /> New Challenge
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 relative overflow-hidden border border-white shadow-sm">
                 <Image 
                   src={post.author.avatar} 
                   alt={post.author.name} 
                   fill
                   className="object-cover"
                   referrerPolicy="no-referrer"
                 />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-slate-800 text-xs">{post.author.name}</h3>
                <p className="text-[10px] text-slate-400">{post.timestamp}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <h3 className="text-xl font-bold text-slate-800">{post.challenge.title}</h3>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black px-4 py-1.5 rounded-full shadow-md shadow-orange-500/30 shrink-0">
              +{post.challenge.xp} XP
            </div>
          </div>
          
          <p className="text-slate-600 leading-relaxed mb-6">
            {post.content}
          </p>
          
          <button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-transform active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2">
            <Zap size={18} className="fill-white" /> Accept Challenge
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Post Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 relative overflow-hidden border-2 border-white shadow-sm">
               <Image 
                 src={post.author.avatar} 
                 alt={post.author.name} 
                 fill
                 className="object-cover"
                 referrerPolicy="no-referrer"
               />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base">{post.author.name}</h3>
                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {post.author.role}
                </span>
                {post.rewardBadge && (
                  <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-yellow-200">
                    <span>{post.rewardBadge.icon}</span> {post.rewardBadge.text}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-400">{post.timestamp}</p>
                {post.topicTag && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-xs font-medium text-indigo-500 flex items-center gap-1">
                      <Tag size={12} /> {post.topicTag}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button className="text-slate-300 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Post Content */}
        <p className="text-slate-800 leading-relaxed mt-4 text-[16px]">
          {post.content}
        </p>
      </div>

      {/* Post Media */}
      {post.media && (
        <div className="px-6 pb-4">
          {post.media.type === 'image' && post.media.url && (
            <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
              <Image 
                src={post.media.url} 
                alt="Post media" 
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {post.media.type === 'video' && post.media.url && (
            <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 flex items-center justify-center">
              <video src={post.media.url} controls className="w-full h-full object-cover" />
            </div>
          )}
          
          {post.media.type === 'poll' && post.media.options && (
            <div className="space-y-2 mt-2">
              {post.media.options.map((option, idx) => {
                const totalVotes = post.media!.options!.reduce((acc, curr) => acc + curr.votes, 0);
                const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
                return (
                  <button key={idx} className="relative w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-sm font-medium text-slate-700 flex justify-between items-center group overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-orange-100/50 z-0 transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                    <span className="relative z-10">{option.text}</span>
                    <div className="relative z-10 flex items-center gap-3">
                      <span className="text-xs text-slate-500">{percentage}%</span>
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-orange-400"></div>
                    </div>
                  </button>
                );
              })}
              <p className="text-xs text-slate-400 mt-2 text-right">{post.media.options.reduce((acc, curr) => acc + curr.votes, 0)} votes</p>
            </div>
          )}

          {post.media.type === 'document' && (
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-[#FAFAFA] mt-2 group cursor-pointer hover:border-orange-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm group-hover:text-orange-600 transition-colors">{post.media.title}</h4>
                <p className="text-xs text-slate-500">PDF Document • 2.4 MB</p>
              </div>
            </div>
          )}

          {post.media.type === 'audio' && (
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-[#FAFAFA] mt-2">
              <button className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm">
                <Play size={20} className="ml-1" />
              </button>
              <div className="flex-1">
                <div className="h-2 bg-slate-200 rounded-full w-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-1/3 rounded-full"></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500 font-medium">0:45</span>
                  <span className="text-xs text-slate-500 font-medium">2:30</span>
                </div>
              </div>
            </div>
          )}

          {post.media.type === 'link' && post.media.linkPreview && (
            <a href={post.media.url} target="_blank" rel="noopener noreferrer" className="block mt-2 rounded-2xl border border-slate-200 overflow-hidden hover:border-indigo-300 transition-colors group">
              <div className="relative h-48 w-full bg-slate-100">
                <Image 
                  src={post.media.linkPreview.image} 
                  alt="Link preview" 
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-4 bg-[#FAFAFA]">
                <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">{post.media.linkPreview.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{post.media.linkPreview.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-slate-400 font-medium">
                  <LinkIcon size={12} /> {post.media.linkPreview.domain}
                </div>
              </div>
            </a>
          )}
        </div>
      )}

      {/* Interaction Bar */}
      <div className="px-6 py-3 border-t border-slate-50 flex flex-wrap items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-yellow-50 text-slate-500 hover:text-yellow-600 transition-colors text-sm font-medium">
          <Lightbulb size={18} className="text-yellow-500" /> 
          <span>{post.interactions.insightful}</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium">
          <CheckCircle size={18} className="text-emerald-500" /> 
          <span>{post.interactions.helpful}</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-pink-50 text-slate-500 hover:text-pink-600 transition-colors text-sm font-medium">
          <Heart size={18} className="text-pink-500" /> 
          <span>{post.interactions.love}</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-orange-50 text-slate-500 hover:text-orange-600 transition-colors text-sm font-medium">
          <PartyPopper size={18} className="text-orange-500" /> 
          <span>{post.interactions.celebration}</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-purple-50 text-slate-500 hover:text-purple-600 transition-colors text-sm font-medium">
          <Brain size={18} className="text-purple-500" /> 
          <span>{post.interactions.thinking}</span>
        </button>
        
        <div className="flex-1"></div>
        
        <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium px-3 py-1.5 rounded-full hover:bg-slate-50">
          <MessageSquare size={18} /> {post.comments.length} Comments
        </button>
      </div>

      {/* Nested Comments */}
      {post.comments.length > 0 && (
        <div className="px-6 py-4 bg-[#FAFAFA] border-t border-slate-50">
          <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-slate-200">
            {visibleComments.map((comment) => (
              <div key={comment.id} className="flex gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white relative overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm">
                  <Image 
                    src={comment.author.avatar} 
                    alt={comment.author.name} 
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-800 text-sm">{comment.author.name}</h4>
                    <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
          {post.comments.length > 2 && (
            <button 
              onClick={() => setShowAllComments(!showAllComments)}
              className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline ml-12"
            >
              {showAllComments ? 'Show fewer comments' : `View ${post.comments.length - 2} more comments`}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

import { CreateChallengeModal } from './CreateChallengeModal';

function Composer({ onPublishChallenge, onPublishPost, language = 'en' }: { onPublishChallenge: (challenge: { title: string; xp: number; task: string }) => void, onPublishPost: (post: any) => void, language?: 'ar' | 'en' }) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; type: 'image' | 'video' | 'file' | 'audio'; name: string }[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isRecording, setIsRecording] = useState(false);
  const [topicTag, setTopicTag] = useState<string>('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);

  const tags = language === 'ar' ? ['فعالية', 'سؤال', 'مصدر', 'اجتماعي', 'إعلان'] : ['Event', 'Question', 'Resource', 'Social', 'Announcement'];
  const placeholderText = language === 'ar' ? 'شارك مصدرًا أو ابدأ نقاشًا...' : 'Share a resource or start a discussion...';

  const handleAddAttachment = (type: 'image' | 'video' | 'file') => {
    const mockNames = {
      image: 'diagram.png',
      video: 'lecture_recording.mp4',
      file: 'document.pdf',
    };
    setAttachments(prev => [...prev, {
      id: window.crypto.randomUUID(),
      type,
      name: mockNames[type]
    }]);
  };

  const handleAudioRecord = () => {
    if (isRecording) return;
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setAttachments(prev => [...prev, {
        id: window.crypto.randomUUID(),
        type: 'audio',
        name: 'ملاحظة_صوتية.mp3'
      }]);
    }, 2000);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handlePost = () => {
    if (!content.trim() && attachments.length === 0 && (!showPoll || pollOptions.every(o => !o.trim()))) return;

    let mediaObj: any = undefined;
    if (attachments.length > 0) {
      const firstMain = attachments[0];
      if (firstMain.type === 'image') mediaObj = { type: 'image', url: 'https://picsum.photos/seed/newpost/800/400' };
      else if (firstMain.type === 'video') mediaObj = { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' };
      else if (firstMain.type === 'file') mediaObj = { type: 'document', url: '#', title: firstMain.name };
      else if (firstMain.type === 'audio') mediaObj = { type: 'audio', url: '#' };
    } else if (showPoll) {
      mediaObj = { type: 'poll', options: pollOptions.filter(o => o.trim()).map(text => ({ text, votes: 0 })) };
    }

    onPublishPost({
        content,
        topicTag,
        media: mediaObj
    });
    
    setContent('');
    setAttachments([]);
    setShowPoll(false);
    setPollOptions(['', '']);
    setTopicTag('');
  };

  return (
    <>
      <div className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-none">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex-shrink-0 relative overflow-hidden border border-gray-200">
            <Image 
              src="https://picsum.photos/seed/alex/100" 
              alt="Current User" 
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholderText}
              className="w-full bg-gray-50/50 rounded-2xl p-4 text-base text-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-200 focus:border-orange-200 border border-transparent resize-none min-h-[80px] placeholder:text-gray-400 decoration-transparent"
            />
            
            {/* Attachments UI (Pills/Thumbnails) */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5 min-w-[120px] max-w-full">
                    {att.type === 'image' && <ImageIcon size={16} className="text-orange-500" />}
                    {att.type === 'video' && <Video size={16} className="text-orange-500" />}
                    {att.type === 'file' && <FileText size={16} className="text-orange-500" />}
                    {att.type === 'audio' && <Mic size={16} className="text-orange-500" />}
                    <span className="text-sm font-medium text-orange-700 truncate flex-1">{att.name}</span>
                    <button onClick={() => removeAttachment(att.id)} className="text-orange-400 hover:text-orange-600 focus:outline-none ml-1">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Poll UI */}
            {showPoll && (
              <div className="mt-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-gray-800">{language === 'ar' ? 'إنشاء استطلاع' : 'Create Poll'}</h4>
                  <button onClick={() => { setShowPoll(false); setPollOptions(['', '']); }} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <input 
                      key={idx}
                      type="text" 
                      placeholder={language === 'ar' ? `الخيار ${idx === 0 ? 'الأول' : idx === 1 ? 'الثاني' : idx + 1}` : `Option ${idx + 1}`}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-300"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                    />
                  ))}
                  <button 
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 mt-2"
                  >
                    <Plus size={14} /> {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
                  </button>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex justify-between flex-wrap items-center mt-3 border-t border-gray-100 pt-3 gap-y-3">
              {/* Left Side: Icons */}
              <div className="flex items-center gap-1">
                <button onClick={() => handleAddAttachment('image')} className="p-2 rounded-full text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title={language === 'ar' ? 'إضافة صورة' : 'Add Image'}>
                  <ImageIcon size={20} />
                </button>
                <button onClick={() => handleAddAttachment('video')} className="p-2 rounded-full text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title={language === 'ar' ? 'إضافة فيديو' : 'Add Video'}>
                  <Video size={20} />
                </button>
                <button onClick={() => handleAddAttachment('file')} className="p-2 rounded-full text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title={language === 'ar' ? 'إضافة ملف' : 'Add File'}>
                  <FileText size={20} />
                </button>
                <button 
                  onClick={() => setShowPoll(!showPoll)}
                  className={`p-2 rounded-full transition-colors ${showPoll ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'}`} 
                  title={language === 'ar' ? 'إنشاء استطلاع' : 'Create Poll'}
                >
                  <BarChart2 size={20} />
                </button>
                
                {isRecording ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 mx-1">
                    <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-bold text-red-600">{language === 'ar' ? 'جاري التسجيل 00:03...' : 'Recording 00:03...'}</span>
                  </div>
                ) : (
                  <button 
                    onClick={handleAudioRecord}
                    className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" 
                    title={language === 'ar' ? 'ملاحظة صوتية' : 'Voice Note'}
                  >
                    <Mic size={20} />
                  </button>
                )}

                <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block"></div>

                <div className="hidden sm:block">
                  <button 
                    onClick={() => setIsChallengeModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all border border-orange-100"
                  >
                    <Zap size={16} className="fill-orange-600" />
                    {language === 'ar' ? 'إنشاء تحدي' : 'Create Challenge'}
                  </button>
                </div>
              </div>

              {/* Right Side: Tag and Post */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors border ${topicTag ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                  >
                    <Tag size={16} />
                    {topicTag || (language === 'ar' ? 'ربط بموضوع' : 'Tag Topic')}
                  </button>
                  
                  <AnimatePresence>
                    {isTagDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 w-48 bg-white border border-gray-200 shadow-sm rounded-2xl py-2 z-50"
                      >
                        {tags.map(tag => (
                          <button 
                            key={tag}
                            onClick={() => { setTopicTag(tag); setIsTagDropdownOpen(false); }}
                            className="w-full text-right sm:text-left px-4 py-2 text-sm text-gray-700 font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                        {topicTag && (
                          <button 
                            onClick={() => { setTopicTag(''); setIsTagDropdownOpen(false); }}
                            className="w-full text-right sm:text-left px-4 py-2 text-sm text-red-600 font-medium hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
                          >
                            {language === 'ar' ? 'إزالة الموضوع' : 'Clear Tag'}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <button onClick={handlePost} className="bg-orange-500 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors flex items-center gap-2 border border-transparent shadow-sm">
                  {language === 'ar' ? 'نشر 🚀' : 'Post 🚀'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CreateChallengeModal 
        isOpen={isChallengeModalOpen} 
        onClose={() => setIsChallengeModalOpen(false)} 
        onPublish={(challenge) => {
          onPublishChallenge(challenge);
          setIsChallengeModalOpen(false);
        }}
      />
    </>
  );
}

function SpacesSidebar({ space, language = 'en' }: { space: 'school' | 'class' | 'subject', language?: 'ar' | 'en' }) {
  if (space === 'school') {
    return (
      <div className="w-80 flex-shrink-0 hidden xl:block space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Star className="text-yellow-500" size={20} /> Upcoming Events
          </h3>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold uppercase">Oct</span>
                <span className="text-lg font-black leading-none">24</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Science Fair</h4>
                <p className="text-xs text-slate-500">Main Hall • 2:00 PM</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold uppercase">Nov</span>
                <span className="text-lg font-black leading-none">02</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Parent-Teacher Meet</h4>
                <p className="text-xs text-slate-500">Online • 5:00 PM</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MessageSquare className="text-blue-500" size={20} /> Official Announcements
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
              <h4 className="font-semibold text-blue-800 text-sm">Winter Break Schedule</h4>
              <p className="text-xs text-blue-600 mt-1">School will be closed from Dec 20 to Jan 3.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (space === 'class') {
    return (
      <div className="w-80 flex-shrink-0 hidden xl:block space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} /> {language === 'ar' ? 'طالب الأسبوع' : 'Student of the Week'}
          </h3>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 relative overflow-hidden border-4 border-yellow-100 shadow-sm mb-3">
              <Image 
                src="https://picsum.photos/seed/studentweek/100" 
                alt="Student of the week" 
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="font-bold text-slate-800">Emma Thompson</h4>
            <p className="text-xs text-slate-500 mt-1">{language === 'ar' ? 'للمساعدة المتميزة في المشاريع الجماعية والحفاظ على سلوك إيجابي!' : 'For outstanding help during group projects and maintaining a positive attitude!'}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Heart className="text-pink-500" size={20} /> {language === 'ar' ? 'متعقب مزاج الفصل' : 'Class Mood Tracker'}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl">😊</span>
              <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-[65%]"></div>
              </div>
              <span className="text-xs font-bold text-slate-500">65%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl">🤔</span>
              <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 w-[25%]"></div>
              </div>
              <span className="text-xs font-bold text-slate-500">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl">😴</span>
              <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 w-[10%]"></div>
              </div>
              <span className="text-xs font-bold text-slate-500">10%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (space === 'subject') {
    return (
      <div className="w-80 flex-shrink-0 hidden xl:block space-y-4">
        {/* Compact Live Now Card */}
        <div className="bg-red-50/50 rounded-2xl border border-slate-100 border-l-[6px] border-l-red-500 shadow-md shadow-red-100/50 p-5 relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wide text-red-600 uppercase">Live Now</span>
          </div>
          <h4 className="text-slate-900 font-semibold mb-4 leading-tight">Matrix Transformations</h4>
          <div className="flex items-center gap-2">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95 shadow-sm">
              Join Session
            </button>
            <button className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95">
              Manage
            </button>
          </div>
        </div>

        {/* Compact Next Session Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Next Session</span>
          </div>
          <h4 className="text-base font-bold text-slate-800">Eigenvectors</h4>
          <p className="text-xs font-semibold text-indigo-500 mt-1">Tomorrow, 10:00 AM</p>
          <div className="flex justify-end mt-4 pt-3 border-t border-slate-50">
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 transition-colors group/link cursor-pointer">
              Open Calendar <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Compact Pending Assessments */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-orange-500" />
            <h4 className="text-sm font-bold text-slate-800">Pending Assessments</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between group cursor-pointer">
              <div className="flex flex-col">
                <h5 className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate max-w-[140px]">Matrix Quiz</h5>
                <p className="text-[10px] text-slate-400">12 submissions</p>
              </div>
              <span className="text-[9px] font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded-md">12 Review</span>
            </div>
            <div className="flex items-center justify-between group cursor-pointer">
              <div className="flex flex-col">
                <h5 className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate max-w-[140px]">HW Week 2</h5>
                <p className="text-[10px] text-slate-400">Grading deadline</p>
              </div>
              <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">Tomorrow</span>
            </div>
          </div>
          <div className="flex justify-end mt-4 pt-3 border-t border-slate-50">
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 transition-colors group/link">
              Open Gradebook <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <LinkIcon className="text-indigo-500" size={20} /> Important Resources
          </h3>
          <ul className="space-y-3">
            <li>
              <a href="#" className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">Syllabus 2023</h4>
                  <p className="text-xs text-slate-400">PDF • 1.2 MB</p>
                </div>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <LinkIcon size={18} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">Formula Cheat Sheet</h4>
                  <p className="text-xs text-slate-400">External Link</p>
                </div>
              </a>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            🏆 Top Challengers
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 bg-amber-50/50 rounded-lg p-2">
              <span className="text-xl">🥇</span>
              <div className="w-8 h-8 rounded-full bg-slate-100 relative overflow-hidden shrink-0 border border-amber-200">
                <Image 
                  src="https://picsum.photos/seed/top1/100" 
                  alt="Contributor" 
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-bold text-slate-800 text-sm truncate">Emma Thompson</span>
              <span className="ml-auto text-orange-600 font-bold text-sm">2,450 XP</span>
            </li>
            <li className="flex items-center gap-3 p-2">
              <span className="text-xl">🥈</span>
              <div className="w-8 h-8 rounded-full bg-slate-100 relative overflow-hidden shrink-0">
                <Image 
                  src="https://picsum.photos/seed/top2/100" 
                  alt="Contributor" 
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-medium text-slate-700 text-sm truncate">Liam Chen</span>
              <span className="ml-auto text-slate-600 font-bold text-sm">2,120 XP</span>
            </li>
            <li className="flex items-center gap-3 p-2">
              <span className="text-xl">🥉</span>
              <div className="w-8 h-8 rounded-full bg-slate-100 relative overflow-hidden shrink-0">
                <Image 
                  src="https://picsum.photos/seed/top3/100" 
                  alt="Contributor" 
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-medium text-slate-700 text-sm truncate">Sophia Patel</span>
              <span className="ml-auto text-slate-600 font-bold text-sm">1,980 XP</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return null;
}

export function SpacesView({ space, language = 'en' }: { space: 'school' | 'class' | 'subject', language?: 'ar' | 'en' }) {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [toast, setToast] = useState<string | null>(null);

  const filteredPosts = posts.filter(p => p.space === space);

  const handlePublishChallenge = (challenge: { title: string; xp: number; task: string }) => {
    const newPost: Post = {
      id: `p-${Date.now()}`,
      space,
      type: 'challenge',
      author: {
        name: 'Alex Johnson',
        role: 'Teacher',
        avatar: 'https://picsum.photos/seed/alex/100'
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

  const handlePublishPost = (postData: { content: string, topicTag: string, media?: any }) => {
    const newPost: Post = {
      id: `p-${Date.now()}`,
      space,
      type: 'standard',
      author: {
        name: 'Current User',
        role: 'Teacher',
        avatar: 'https://picsum.photos/seed/alex/100'
      },
      timestamp: 'Just now',
      content: postData.content,
      topicTag: postData.topicTag || undefined,
      media: postData.media,
      interactions: { insightful: 0, helpful: 0, love: 0, celebration: 0, thinking: 0 },
      comments: []
    };
    
    setPosts(prev => [newPost, ...prev]);
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

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        <SpacesSidebar space={space} language={language} />
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
    </div>
  );
}
