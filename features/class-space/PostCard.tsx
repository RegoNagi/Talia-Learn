'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Lightbulb, 
  CheckCircle, 
  Heart, 
  PartyPopper, 
  MessageSquare, 
  Send, 
  MoreHorizontal,
  Tag
} from 'lucide-react';
import { motion } from 'motion/react';
import { Post, User } from '@/types/classSpace';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onReact: (postId: string, reaction: keyof Post['interactions']) => void;
  onAddComment: (postId: string, commentText: string) => void;
}

export function PostCard({ post, currentUser, onReact, onAddComment }: PostCardProps) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(true);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  const comments = post.comments;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs mb-5 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 relative overflow-hidden border border-slate-200 shrink-0">
              <Image
                src={post.author.avatar || 'https://picsum.photos/seed/skinner/100'}
                alt={post.author.name}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{post.author.name}</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                {post.author.role ? `${post.author.role.charAt(0).toUpperCase() + post.author.role.slice(1)} • ` : ''}{post.timestamp}
              </p>
            </div>
          </div>

          {post.topicTag && (
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-lg">
              #{post.topicTag}
            </span>
          )}
        </div>

        {/* Post text */}
        <p className="text-slate-800 text-xs leading-relaxed mt-3 font-medium">
          {post.content}
        </p>
      </div>

      {/* Media Image (only when the post actually has one) */}
      {post.media?.url && (
        <div className="px-4 pb-3">
          <div className="relative w-full h-60 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <Image
              src={post.media.url}
              alt="Post media"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Reaction bar */}
      <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
          <button onClick={() => onReact(post.id, 'insightful')} className="flex items-center gap-1 hover:text-amber-600">
            <span>💡</span> <span>{post.interactions.insightful}</span>
          </button>
          <button onClick={() => onReact(post.id, 'helpful')} className="flex items-center gap-1 hover:text-emerald-600">
            <span>✅</span> <span>{post.interactions.helpful}</span>
          </button>
          <button onClick={() => onReact(post.id, 'love')} className="flex items-center gap-1 hover:text-pink-600">
            <span>❤️</span> <span>{post.interactions.love}</span>
          </button>
          <button onClick={() => onReact(post.id, 'celebration')} className="flex items-center gap-1 hover:text-orange-600">
            <span>🎉</span> <span>{post.interactions.celebration}</span>
          </button>
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
        >
          <MessageSquare size={14} />
          <span>{comments.length} Comments</span>
        </button>
      </div>

      {/* Comment Thread */}
      {showComments && (
        <div className="px-4 py-3 bg-slate-50/40 border-t border-slate-100 space-y-2.5">
          {comments.map((comm) => (
            <div key={comm.id} className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-slate-200 relative overflow-hidden shrink-0">
                <Image
                  src={comm.author.avatar || `https://picsum.photos/seed/${comm.author.id}/100`}
                  alt={comm.author.name}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-extrabold text-slate-900 text-xs">{comm.author.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{comm.timestamp}</span>
                </div>
                <p className="text-slate-700 text-xs font-medium">{comm.content}</p>
              </div>
            </div>
          ))}

          {/* Comment Form */}
          <form onSubmit={handleSendComment} className="flex gap-2 pt-1">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
}
