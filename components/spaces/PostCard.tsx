'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, MessageSquare, Heart, CheckCircle, Lightbulb, MoreHorizontal, Send, Tag, PartyPopper, Brain, Link as LinkIcon, Play, Zap } from 'lucide-react';
import Image from 'next/image';
import { Post } from './types';

export function PostCard({ post, onReact, onAddComment }: { post: Post; onReact?: (postId: string, type: keyof Post['interactions']) => void; onAddComment?: (postId: string, text: string) => void }) {
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentText, setCommentText] = useState('');
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
        <button onClick={() => onReact?.(post.id, 'insightful')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-yellow-50 text-slate-500 hover:text-yellow-600 transition-colors text-sm font-medium">
          <Lightbulb size={18} className="text-yellow-500" /> 
          <span>{post.interactions.insightful}</span>
        </button>
        <button onClick={() => onReact?.(post.id, 'helpful')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium">
          <CheckCircle size={18} className="text-emerald-500" /> 
          <span>{post.interactions.helpful}</span>
        </button>
        <button onClick={() => onReact?.(post.id, 'love')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-pink-50 text-slate-500 hover:text-pink-600 transition-colors text-sm font-medium">
          <Heart size={18} className="text-pink-500" /> 
          <span>{post.interactions.love}</span>
        </button>
        <button onClick={() => onReact?.(post.id, 'celebration')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-orange-50 text-slate-500 hover:text-orange-600 transition-colors text-sm font-medium">
          <PartyPopper size={18} className="text-orange-500" /> 
          <span>{post.interactions.celebration}</span>
        </button>
        <button onClick={() => onReact?.(post.id, 'thinking')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-purple-50 text-slate-500 hover:text-purple-600 transition-colors text-sm font-medium">
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

      {/* Add Comment */}
      {onAddComment && (
        <div className="px-6 py-4 border-t border-slate-50 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && commentText.trim()) {
                onAddComment(post.id, commentText.trim());
                setCommentText('');
              }
            }}
            placeholder="Write a comment..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <button
            onClick={() => { if (commentText.trim()) { onAddComment(post.id, commentText.trim()); setCommentText(''); } }}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </motion.div>
  );
}
