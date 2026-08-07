'use client';

import React, { useState, useRef, useEffect, startTransition } from 'react';
import Image from 'next/image';
import { Search, Send, Zap, ChevronDown, Check, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMyMessages, markMessageAsRead, AppMessage } from '@/services/messagesData';

interface ChatContact {
  id: string;
  nameEn: string;
  nameAr: string;
  role: 'student' | 'parent' | 'teacher';
  avatar: string;
  previewAr: string;
  previewEn: string;
  timeAr: string;
  timeEn: string;
  unread: boolean;
  online: boolean;
  academicId: string;
  className?: string;        // for students
  path?: 'standard' | 'empowerment' | 'excellence'; // for students
  studentNameAr?: string;    // for parents
  studentNameEn?: string;    // for parents
  departmentAr?: string;     // for teachers
  departmentEn?: string;     // for teachers
}

const MOCK_CHATS: ChatContact[] = [
  { id: '1', nameAr: 'أحمد علي', nameEn: 'Ahmed Ali', role: 'student', academicId: 'STD-1001', className: '10-A', path: 'empowerment', previewAr: 'شكراً جزيلاً لك', previewEn: 'Thank you very much', timeAr: '10:30 ص', timeEn: '10:30 AM', unread: true, online: true, avatar: 'https://picsum.photos/seed/ahmad/100' },
  { id: '2', nameAr: 'فاطمة محمد', nameEn: 'Fatima Mohammed', role: 'parent', academicId: 'PRT-2001', studentNameAr: 'يوسف العلي', studentNameEn: 'Yousef Al-Ali', previewAr: 'متى موعد اللقاء القادم؟', previewEn: 'When is the next meeting?', timeAr: 'أمس', timeEn: 'Yesterday', unread: false, online: false, avatar: 'https://picsum.photos/seed/fatima/100' },
  { id: '3', nameAr: 'أ. سارة سعيد', nameEn: 'Sarah Saeed', role: 'teacher', academicId: 'TCH-3001', departmentAr: 'قسم الرياضيات', departmentEn: 'Math Department', previewAr: 'تم إرسال الملفات المطلوبة.', previewEn: 'Required files have been sent.', timeAr: 'الإثنين', timeEn: 'Monday', unread: false, online: true, avatar: 'https://picsum.photos/seed/sarasc/100' },
  { id: '4', nameAr: 'يوسف محمود', nameEn: 'Yousef Mahmoud', role: 'student', academicId: 'STD-1002', className: '11-B', path: 'excellence', previewAr: 'هل يمكنني مراجعة الاختبار؟', previewEn: 'Can I review the test?', timeAr: 'الأحد', timeEn: 'Sunday', unread: true, online: false, avatar: 'https://picsum.photos/seed/yousef/100' },
  { id: '5', nameAr: 'خالد زيدان', nameEn: 'Khaled Zaidan', role: 'student', academicId: 'STD-1003', className: '10-A', path: 'standard', previewAr: 'سأرسل الواجب اليوم.', previewEn: 'I will send the homework today.', timeAr: 'الثلاثاء', timeEn: 'Tuesday', unread: false, online: true, avatar: 'https://picsum.photos/seed/khaled/100' },
  { id: '6', nameAr: 'محمد حسن (ولي أمر)', nameEn: 'Mohammed Hassan (Parent)', role: 'parent', academicId: 'PRT-2002', studentNameAr: 'لينة حسن', studentNameEn: 'Leena Hassan', previewAr: 'شكراً لاهتمامكم', previewEn: 'thanks for your care', timeAr: 'الأربعاء', timeEn: 'Wednesday', unread: false, online: true, avatar: 'https://picsum.photos/seed/mhassan/100' },
  { id: '7', nameAr: 'أ. عمر الخالدي', nameEn: 'Omar Al-Khalidi', role: 'teacher', academicId: 'TCH-3002', departmentAr: 'الإدارة', departmentEn: 'Administration', previewAr: 'اجتماع القسم غداً.', previewEn: 'Department meeting tomorrow.', timeAr: 'الخميس', timeEn: 'Thursday', unread: true, online: false, avatar: 'https://picsum.photos/seed/omar/100' },
];

const MOCK_MESSAGES = [
  { id: 'm1', senderId: '1', textAr: 'السلام عليكم أستاذ، بخصوص الواجب الأخير، هل يمكنني تسليمه غداً؟', textEn: 'Hello teacher, regarding the last assignment, can I submit it tomorrow?', timeAr: '10:15 ص', timeEn: '10:15 AM', isMine: false },
  { id: 'm2', senderId: 'me', textAr: 'وعليكم السلام. لا بأس، يمكنك تسليمه غداً قبل نهاية اليوم الدراسي.', textEn: 'Hello. It is fine, you can submit it tomorrow before the end of the school day.', timeAr: '10:20 ص', timeEn: '10:20 AM', isMine: true },
  { id: 'm3', senderId: '1', textAr: 'شكراً جزيلاً لك', textEn: 'Thank you very much', timeAr: '10:30 ص', timeEn: '10:30 AM', isMine: false }
];

const CANNED_RESPONSES = {
  ar: [
    { label: 'غياب متكرر', text: 'أرجو الانتباه إلى أن هناك غياباً متكرراً للطالب خلال الأسبوع الماضي.' },
    { label: 'أداء ممتاز', text: 'أود أن أهنئكم على الأداء الممتاز والمشاركة الفعالة في الفصل.' },
    { label: 'برجاء مراجعة الواجب', text: 'برجاء التأكد من مراجعة وتسليم الواجب الأخير في الموعد المحدد.' }
  ],
  en: [
    { label: 'Frequent Absence', text: 'Please note there has been frequent absence over the past week.' },
    { label: 'Excellent Performance', text: 'I would like to commend the excellent performance and active participation.' },
    { label: 'Check Assignment', text: 'Please ensure to review and submit the latest assignment on time.' }
  ]
};

// Custom Dropdown Component
function FilterDropdown({ options, value, onChange, placeholder }: { options: {id: string, label: string}[], value: string, onChange: (val: string) => void, placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = value === 'all' ? placeholder : options.find(o => o.id === value)?.label || placeholder;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-none"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
            className="absolute top-full start-0 w-full mt-1 bg-white border border-gray-100 rounded-xl z-20 py-1 shadow-none"
          >
            <button
              onClick={() => { onChange('all'); setIsOpen(false); }}
              className="w-full flex items-center px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 text-start"
            >
              <span className="flex-1">All</span>
              {value === 'all' && <Check size={14} className="text-orange-500" />}
            </button>
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                className="w-full flex items-center px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 text-start"
              >
                <span className="flex-1">{opt.label}</span>
                {value === opt.id && <Check size={14} className="text-orange-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MessagesCenter({ language = 'ar', authUser }: { language?: 'ar' | 'en'; authUser?: any }) {
  const isRtl = language === 'ar';

  const [realMessages, setRealMessages] = useState<AppMessage[]>([]);
  const [isLoadingReal, setIsLoadingReal] = useState(true);
  const recipientId = authUser?.parentId || authUser?.studentId || authUser?.teacherId;
  const recipientRole = authUser?.role;

  useEffect(() => {
    if (!recipientId || !recipientRole) { startTransition(() => setIsLoadingReal(false)); return; }
    getMyMessages(recipientId, recipientRole).then((msgs) => {
      setRealMessages(msgs);
      setIsLoadingReal(false);
    });
  }, [recipientId, recipientRole]);

  const handleOpenRealMessage = async (msg: AppMessage) => {
    if (!msg.isRead) {
      await markMessageAsRead(msg.id);
      setRealMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m)));
    }
  };
  
  const [activeTab, setActiveTab] = useState<'student' | 'parent' | 'teacher'>('student');
  const [activeChatId, setActiveChatId] = useState<string>('1');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  
  // Sub-filters
  const [classFilter, setClassFilter] = useState('all');
  const [parentSearch, setParentSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const filteredChats = MOCK_CHATS.filter(c => {
    if (c.role !== activeTab) return false;
    
    if (activeTab === 'student' && classFilter !== 'all' && c.className !== classFilter) return false;
    if (activeTab === 'parent' && parentSearch) {
      const studentName = isRtl ? c.studentNameAr : c.studentNameEn;
      if (!studentName?.toLowerCase().includes(parentSearch.toLowerCase())) return false;
    }
    if (activeTab === 'teacher' && deptFilter !== 'all') {
      const dept = isRtl ? c.departmentAr : c.departmentEn;
      if (dept !== deptFilter) return false;
    }
    
    return true;
  });

  const activeChat = MOCK_CHATS.find(c => c.id === activeChatId) || filteredChats[0] || MOCK_CHATS[0];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;
    
    setMessages([...messages, {
      id: Date.now().toString(),
      senderId: 'me',
      textAr: messageInput,
      textEn: messageInput,
      timeAr: 'الآن',
      timeEn: 'Now',
      isMine: true
    }]);
    setMessageInput('');
  };

  const handleCannedResponse = (text: string) => {
    setMessageInput(prev => prev ? `${prev} ${text}` : text);
  };

  const getPathBadge = (path?: string) => {
    if (!path) return null;
    if (path === 'empowerment') {
      return (
        <span className="inline-block px-3 py-1 text-xs font-bold rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
          {isRtl ? 'مسار التمكين' : 'Empowerment Path'}
        </span>
      );
    }
    if (path === 'excellence') {
      return (
        <span className="inline-block px-3 py-1 text-xs font-bold rounded-lg bg-green-50 text-green-600 border border-green-100">
          {isRtl ? 'مسار التميز' : 'Excellence Path'}
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 text-xs font-bold rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
        {isRtl ? 'المسار الأساسي' : 'Standard Path'}
      </span>
    );
  };

  const classOptions = [
    { id: '10-A', label: isRtl ? 'الصف 10-أ' : 'Class 10-A' },
    { id: '10-B', label: isRtl ? 'الصف 10-ب' : 'Class 10-B' },
    { id: '11-B', label: isRtl ? 'الصف 11-ب' : 'Class 11-B' },
  ];

  const deptOptions = [
    { id: isRtl ? 'قسم الرياضيات' : 'Math Department', label: isRtl ? 'قسم الرياضيات' : 'Math Dept' },
    { id: isRtl ? 'الإدارة' : 'Administration', label: isRtl ? 'الإدارة' : 'Administration' },
  ];

  const cannedList = CANNED_RESPONSES[isRtl ? 'ar' : 'en'];

  return (
    <div className="space-y-4">
      {recipientId && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4" dir={isRtl ? 'rtl' : 'ltr'}>
          <h3 className="text-sm font-bold text-gray-800 mb-3">{isRtl ? 'إشعارات من المعلمين' : 'Notifications from Teachers'}</h3>
          {isLoadingReal ? (
            <p className="text-xs text-gray-400">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : realMessages.length === 0 ? (
            <p className="text-xs text-gray-400">{isRtl ? 'مفيش رسائل لسه.' : 'No messages yet.'}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {realMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleOpenRealMessage(msg)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${msg.isRead ? 'border-gray-100 bg-gray-50/50' : 'border-orange-200 bg-orange-50'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-800">{msg.senderName}</span>
                    <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  {msg.subject && <p className="text-xs font-semibold text-gray-600 mb-0.5">{msg.subject}</p>}
                  <p className="text-xs text-gray-600">{msg.content}</p>
                  {!msg.isRead && <span className="inline-block mt-1 text-[9px] font-bold text-orange-600 uppercase">{isRtl ? 'جديد' : 'New'}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    <div className="h-[calc(100vh-140px)] w-full bg-white border border-gray-100 flex overflow-hidden rounded-2xl shadow-none" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Column 1: Advanced Directory & Chat List (30%) */}
      <div className="w-[30%] min-w-[320px] flex flex-col bg-white border-e border-gray-100 z-10 shrink-0">
        <div className="p-4 border-b border-gray-100 shadow-none flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-800">{isRtl ? 'الرسائل' : 'Messages'}</h2>
          
          {/* Primary Role Tabs */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button 
              onClick={() => { setActiveTab('student'); setClassFilter('all'); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-colors shadow-none ${activeTab === 'student' ? 'bg-white text-orange-600 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {isRtl ? 'الطلاب' : 'Students'}
            </button>
            <button 
              onClick={() => { setActiveTab('parent'); setParentSearch(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-colors shadow-none ${activeTab === 'parent' ? 'bg-white text-orange-600 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {isRtl ? 'أولياء الأمور' : 'Parents'}
            </button>
            <button 
              onClick={() => { setActiveTab('teacher'); setDeptFilter('all'); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-colors shadow-none ${activeTab === 'teacher' ? 'bg-white text-orange-600 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {isRtl ? 'المعلمين' : 'Teachers'}
            </button>
          </div>

          {/* Dynamic Sub-Filters */}
          <div className="w-full">
            {activeTab === 'student' && (
               <FilterDropdown 
                 options={classOptions} 
                 value={classFilter} 
                 onChange={setClassFilter} 
                 placeholder={isRtl ? 'فلترة بالفصل' : 'Filter by Class'} 
               />
            )}
            {activeTab === 'parent' && (
               <div className="relative">
                 <span className="absolute top-1/2 -translate-y-1/2 text-gray-400 start-3">
                   <Search size={16} />
                 </span>
                 <input 
                   type="text" 
                   value={parentSearch}
                   onChange={(e) => setParentSearch(e.target.value)}
                   placeholder={isRtl ? 'اكتب اسم الطالب للبحث...' : 'Search by student name...'}
                   className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 ps-9 text-sm focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-300 transition-colors placeholder:text-gray-400"
                 />
               </div>
            )}
            {activeTab === 'teacher' && (
               <FilterDropdown 
                 options={deptOptions} 
                 value={deptFilter} 
                 onChange={setDeptFilter} 
                 placeholder={isRtl ? 'فلترة بالقسم' : 'Filter by Dept'} 
               />
            )}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredChats.map((chat) => (
            <button 
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all shadow-none text-start border-s-4 ${activeChatId === chat.id ? 'bg-orange-50 border-orange-500' : 'bg-white hover:bg-gray-50 border-transparent'}`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shadow-none">
                  <Image src={chat.avatar} alt={chat.nameEn} fill className="object-cover rounded-full" />
                </div>
                {chat.online && (
                  <span className="absolute bottom-0 end-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={`font-bold text-sm truncate ${activeChatId === chat.id ? 'text-orange-900' : 'text-gray-800'}`}>{isRtl ? chat.nameAr : chat.nameEn}</h3>
                  <span className={`text-[10px] shrink-0 font-medium ${chat.unread ? 'text-orange-600' : 'text-gray-400'}`}>{isRtl ? chat.timeAr : chat.timeEn}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs truncate ${chat.unread ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>
                    {isRtl ? chat.previewAr : chat.previewEn}
                  </p>
                  {chat.unread && (
                    <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 ms-2"></span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {filteredChats.length === 0 && (
            <div className="text-center p-6 text-gray-400 text-sm">
              {isRtl ? 'لا توجد رسائل مطابقة.' : 'No matching chats.'}
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Active Chat & Canned Responses (45%) */}
      <div className="w-[45%] flex flex-col bg-slate-50/20 shrink-0 border-e border-gray-100">
        
        {/* Chat Header (Sticky Top) */}
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 shrink-0 bg-white sticky top-0 z-10 shadow-none">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 relative shadow-none">
               <Image src={activeChat.avatar} alt={activeChat.nameEn} fill className="object-cover rounded-full" />
             </div>
             <div>
               <h3 className="font-bold text-gray-800 text-sm leading-tight">{isRtl ? activeChat.nameAr : activeChat.nameEn}</h3>
               <p className="text-xs text-gray-500 mt-0.5">
                 {activeChat.role === 'student' ? (isRtl ? `طالب • ${activeChat.className}` : `Student • ${activeChat.className}`)
                 : activeChat.role === 'parent' ? (isRtl ? `ولي أمر الطالب: ${activeChat.studentNameAr}` : `Parent of: ${activeChat.studentNameEn}`)
                 : (isRtl ? `معلم • ${activeChat.departmentAr}` : `Teacher • ${activeChat.departmentEn}`)}
               </p>
             </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div className="flex justify-center">
            <span className="text-[10px] font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
              {isRtl ? 'اليوم' : 'Today'}
            </span>
          </div>
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.isMine ? 'ms-auto items-end' : 'me-auto items-start'}`}>
               <div className={`px-4 py-3 shadow-none ${msg.isMine 
                  ? 'bg-orange-500 text-white rounded-2xl rounded-ee-none' 
                  : 'bg-white border border-gray-100 text-gray-700 rounded-2xl rounded-es-none'
               }`}>
                 <p className="text-sm leading-relaxed">{isRtl ? msg.textAr : msg.textEn}</p>
               </div>
               <div className="flex items-center gap-1 mt-1 text-gray-400">
                 <span className="text-[10px] font-medium">{isRtl ? msg.timeAr : msg.timeEn}</span>
                 {msg.isMine && <CheckCircle2 size={12} className="text-orange-400" />}
               </div>
            </div>
          ))}
        </div>

        {/* Sticky Input Area */}
        <div className="bg-white border-t border-gray-100 sticky bottom-0 z-10 flex flex-col shadow-none">
          {/* Canned Responses */}
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-b border-gray-50">
            {cannedList.map((canned, idx) => (
              <button 
                key={idx}
                onClick={() => handleCannedResponse(canned.text)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-xs font-bold hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors whitespace-nowrap shadow-none"
              >
                <Zap size={12} className="text-orange-400" />
                {canned.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex flex-col p-3 gap-2">
            <textarea 
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={isRtl ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
              className="w-full bg-transparent resize-none focus:outline-none text-sm text-gray-800 px-2 py-1 min-h-[44px] max-h-32 custom-scrollbar placeholder:text-gray-400"
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="flex justify-end px-2">
              <button 
                type="submit" 
                disabled={!messageInput.trim()} 
                className={`flex items-center justify-center p-2 rounded-xl transition-all shadow-none ${messageInput.trim() ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-400'}`}
              >
                <Send size={18} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Column 3: Participant Intelligence (25%) */}
      <div className="flex-1 min-w-[200px] flex flex-col bg-white border-s border-gray-100 py-10 px-6 shrink-0 relative shadow-none">
         <div className="flex flex-col items-center text-center">
            <div className="w-28 h-28 rounded-full overflow-hidden border border-gray-100 mb-5 shadow-none relative">
               <Image src={activeChat.avatar} alt={activeChat.nameEn} fill className="object-cover rounded-full" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{isRtl ? activeChat.nameAr : activeChat.nameEn}</h3>
            <p className="text-sm text-gray-500 font-mono mb-6">{activeChat.academicId}</p>

            {activeChat.role === 'student' && (
              <div className="w-full mb-6 flex justify-center">
                {getPathBadge(activeChat.path)}
              </div>
            )}

            <button className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors shadow-none flex items-center justify-center gap-2">
              <FileText size={16} className="text-gray-400" />
              {isRtl ? 'فتح السجل الشامل' : 'Open Full Record'}
            </button>
         </div>
      </div>

    </div>
    </div>
  );
}
