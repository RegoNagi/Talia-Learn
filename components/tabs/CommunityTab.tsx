'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Heart, Share2, MoreHorizontal, Pin } from 'lucide-react';
import { Post } from '@/types/course';
import Image from 'next/image';

export function CommunityTab() {
  const [posts] = useState<Post[]>([
    {
      id: '1',
      authorId: 'teacher1',
      content: "📢 Welcome to Advanced Mathematics! I've posted the syllabus in the Content tab. Please review it before our first live session on Tuesday.",
      timestamp: '2 hours ago',
      likes: 24,
      comments: 5,
    },
    {
      id: '2',
      authorId: 'student1',
      content: "Does anyone have a good resource for understanding Eigenvectors? I'm struggling a bit with the visualization.",
      timestamp: '4 hours ago',
      likes: 8,
      comments: 12,
    }
  ]);

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Composer */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex-shrink-0 relative overflow-hidden">
            <Image 
              src="https://picsum.photos/seed/teacher/100" 
              alt="User" 
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1">
            <textarea 
              placeholder="Share something with the class..." 
              className="w-full bg-slate-50 rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none h-24"
            />
            <div className="flex justify-between items-center mt-3">
              <div className="flex gap-2">
                {/* Attachments icons would go here */}
              </div>
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {posts.map((post) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 relative overflow-hidden">
                   <Image 
                     src={`https://picsum.photos/seed/${post.authorId}/100`} 
                     alt="Author" 
                     fill
                     className="object-cover"
                     referrerPolicy="no-referrer"
                   />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {post.authorId === 'teacher1' ? 'Dr. Sarah Miller' : 'Alex Johnson'}
                  </h3>
                  <p className="text-xs text-slate-400">{post.timestamp}</p>
                </div>
              </div>
              <button className="text-slate-300 hover:text-slate-600">
                <MoreHorizontal size={20} />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed mb-4">
              {post.content}
            </p>

            <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
              <button className="flex items-center gap-2 text-slate-400 hover:text-pink-500 transition-colors text-sm">
                <Heart size={18} /> {post.likes}
              </button>
              <button className="flex items-center gap-2 text-slate-400 hover:text-indigo-500 transition-colors text-sm">
                <MessageCircle size={18} /> {post.comments}
              </button>
              <button className="flex items-center gap-2 text-slate-400 hover:text-indigo-500 transition-colors text-sm ml-auto">
                <Share2 size={18} /> Share
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
