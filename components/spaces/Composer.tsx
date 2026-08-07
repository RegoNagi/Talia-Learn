'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Video, FileText, BarChart2, Mic, Tag, Plus, X, Zap } from 'lucide-react';
import Image from 'next/image';
import { CreateChallengeModal } from '../CreateChallengeModal';

export function Composer({ onPublishChallenge, onPublishPost, language = 'en' }: { onPublishChallenge: (challenge: { title: string; xp: number; task: string }) => void, onPublishPost: (post: any) => void, language?: 'ar' | 'en' }) {
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

