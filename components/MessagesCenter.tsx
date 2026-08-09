'use client';

import React, { useState, useRef, useEffect, startTransition } from 'react';
import { Search, Send, Zap, ChevronDown, Check, CheckCircle2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getMyMessages,
  markMessageAsRead,
  getConversation,
  sendMessage,
  sendMessageToStudentParent,
  getMyStudentContacts,
  getMyParentContacts,
  getAllTeacherContacts,
  AppMessage,
  MessageContact,
} from '@/services/messagesData';

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

  const myId = authUser?.parentId || authUser?.studentId || authUser?.teacherId;
  const myRole = authUser?.role;
  const myName = authUser?.name || '';
  const isTeacher = myRole === 'teacher';

  // === صندوق "إشعارات من المعلمين" — كان موجود من قبل وحقيقي بالفعل، سايبينه زي ما هو ===
  const [realMessages, setRealMessages] = useState<AppMessage[]>([]);
  const [isLoadingReal, setIsLoadingReal] = useState(true);

  useEffect(() => {
    if (!myId || !myRole) { startTransition(() => setIsLoadingReal(false)); return; }
    getMyMessages(myId, myRole).then((msgs) => {
      setRealMessages(msgs);
      setIsLoadingReal(false);
    });
  }, [myId, myRole]);

  const handleOpenRealMessage = async (msg: AppMessage) => {
    if (!msg.isRead) {
      await markMessageAsRead(msg.id);
      setRealMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m)));
    }
  };

  // === مركز المحادثات الحقيقي — بيبان بس للمعلم (نفس الأدوار الثلاثة اللي كانت في التصميم الأصلي) ===
  const [activeTab, setActiveTab] = useState<'student' | 'parent' | 'teacher'>('student');
  const [studentContacts, setStudentContacts] = useState<MessageContact[]>([]);
  const [parentContacts, setParentContacts] = useState<MessageContact[]>([]);
  const [teacherContacts, setTeacherContacts] = useState<MessageContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  useEffect(() => {
    if (!isTeacher || !authUser?.teacherId) { startTransition(() => setIsLoadingContacts(false)); return; }
    startTransition(() => setIsLoadingContacts(true));
    Promise.all([
      getMyStudentContacts(authUser.teacherId),
      getMyParentContacts(authUser.teacherId),
      getAllTeacherContacts(authUser.teacherId),
    ]).then(([students, parents, teachers]) => {
      setStudentContacts(students);
      setParentContacts(parents);
      setTeacherContacts(teachers);
      setIsLoadingContacts(false);
    });
  }, [isTeacher, authUser?.teacherId]);

  const contactsForTab = activeTab === 'student' ? studentContacts : activeTab === 'parent' ? parentContacts : teacherContacts;

  const [classFilter, setClassFilter] = useState('all');
  const [parentSearch, setParentSearch] = useState('');
  const classOptions = Array.from(new Set(studentContacts.map((c) => c.className).filter((c): c is string => !!c))).map((c) => ({ id: c, label: c }));

  const filteredContacts = contactsForTab.filter((c) => {
    if (activeTab === 'student' && classFilter !== 'all' && c.className !== classFilter) return false;
    if (activeTab === 'parent' && parentSearch) {
      if (!c.studentName?.toLowerCase().includes(parentSearch.toLowerCase())) return false;
    }
    return true;
  });

  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  useEffect(() => {
    if (filteredContacts.length > 0 && !filteredContacts.find((c) => c.id === activeContactId)) {
      startTransition(() => setActiveContactId(filteredContacts[0].id));
    }
  }, [filteredContacts, activeContactId]);

  const activeContact = filteredContacts.find((c) => c.id === activeContactId) || filteredContacts[0] || null;

  const [conversation, setConversation] = useState<AppMessage[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  const refreshConversation = () => {
    if (!myId || !myRole || !activeContact) { setConversation([]); return; }
    startTransition(() => setIsLoadingConversation(true));
    getConversation(myId, myRole, activeContact.id, activeContact.role).then((msgs) => {
      setConversation(msgs);
      setIsLoadingConversation(false);
    });
  };

  useEffect(() => {
    startTransition(() => { refreshConversation(); });
  }, [myId, myRole, activeContact?.id, activeContact?.role]);

  const [messageInput, setMessageInput] = useState('');
  const [alsoSendEmail, setAlsoSendEmail] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeContact || !myId || !myRole) return;
    setIsSending(true);
    setSendError('');

    const result = activeContact.role === 'parent'
      ? await sendMessageToStudentParent({
          senderId: myId,
          senderRole: myRole,
          senderName: myName,
          studentId: activeContact.studentId || activeContact.id,
          content: messageInput,
          sendEmailCopy: alsoSendEmail,
        })
      : await sendMessage({
          senderId: myId,
          senderRole: myRole,
          senderName: myName,
          recipientId: activeContact.id,
          recipientRole: activeContact.role,
          content: messageInput,
          sendEmailCopy: alsoSendEmail,
        });

    setIsSending(false);
    if (result.ok) {
      setMessageInput('');
      refreshConversation();
    } else {
      setSendError(result.error || (isRtl ? 'حصل خطأ أثناء الإرسال' : 'An error occurred while sending'));
    }
  };

  const handleCannedResponse = (text: string) => {
    setMessageInput(prev => prev ? `${prev} ${text}` : text);
  };

  const cannedList = CANNED_RESPONSES[isRtl ? 'ar' : 'en'];

  if (!isTeacher) {
    // الطلاب وأولياء الأمور بيشوفوا صندوق الإشعارات بس دلوقتي — مركز المحادثات الكامل مخصوص للمعلم
    return (
      <div className="space-y-4">
        {myId && (
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {myId && (
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
      
      {/* Column 1: Directory & Chat List */}
      <div className="w-[30%] min-w-[320px] flex flex-col bg-white border-e border-gray-100 z-10 shrink-0">
        <div className="p-4 border-b border-gray-100 shadow-none flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-800">{isRtl ? 'الرسائل' : 'Messages'}</h2>
          
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
              onClick={() => { setActiveTab('teacher'); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-colors shadow-none ${activeTab === 'teacher' ? 'bg-white text-orange-600 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {isRtl ? 'المعلمين' : 'Teachers'}
            </button>
          </div>

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
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {isLoadingContacts ? (
            <div className="text-center p-6 text-gray-400 text-sm">{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : filteredContacts.map((contact) => (
            <button 
              key={contact.id}
              onClick={() => setActiveContactId(contact.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all shadow-none text-start border-s-4 ${activeContactId === contact.id ? 'bg-orange-50 border-orange-500' : 'bg-white hover:bg-gray-50 border-transparent'}`}
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0 text-lg">
                {contact.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm truncate ${activeContactId === contact.id ? 'text-orange-900' : 'text-gray-800'}`}>{contact.name}</h3>
                <p className="text-xs truncate text-gray-500">
                  {contact.role === 'student' && contact.className}
                  {contact.role === 'parent' && (isRtl ? `ولي أمر: ${contact.studentName}` : `Parent of: ${contact.studentName}`)}
                  {contact.role === 'teacher' && (isRtl ? 'معلم' : 'Teacher')}
                </p>
              </div>
            </button>
          ))}
          {!isLoadingContacts && filteredContacts.length === 0 && (
            <div className="text-center p-6 text-gray-400 text-sm">
              {isRtl ? 'لا توجد جهات اتصال مطابقة.' : 'No matching contacts.'}
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Active Conversation */}
      <div className="flex-1 flex flex-col bg-slate-50/20 shrink-0">
        
        {activeContact ? (
        <>
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 shrink-0 bg-white sticky top-0 z-10 shadow-none">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0">
               {activeContact.name?.charAt(0) || '?'}
             </div>
             <div>
               <h3 className="font-bold text-gray-800 text-sm leading-tight">{activeContact.name}</h3>
               <p className="text-xs text-gray-500 mt-0.5">
                 {activeContact.role === 'student' ? (isRtl ? `طالب • ${activeContact.className || ''}` : `Student • ${activeContact.className || ''}`)
                 : activeContact.role === 'parent' ? (isRtl ? `ولي أمر الطالب: ${activeContact.studentName}` : `Parent of: ${activeContact.studentName}`)
                 : (isRtl ? 'معلم' : 'Teacher')}
               </p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {isLoadingConversation ? (
            <p className="text-center text-xs text-gray-400">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : conversation.length === 0 ? (
            <p className="text-center text-xs text-gray-400">{isRtl ? 'لسه مفيش رسائل في المحادثة دي.' : 'No messages in this conversation yet.'}</p>
          ) : conversation.map((msg) => {
            const isMine = msg.senderId === myId && msg.senderRole === myRole;
            return (
              <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMine ? 'ms-auto items-end' : 'me-auto items-start'}`}>
                 <div className={`px-4 py-3 shadow-none ${isMine 
                    ? 'bg-orange-500 text-white rounded-2xl rounded-ee-none' 
                    : 'bg-white border border-gray-100 text-gray-700 rounded-2xl rounded-es-none'
                 }`}>
                   <p className="text-sm leading-relaxed">{msg.content}</p>
                 </div>
                 <div className="flex items-center gap-1 mt-1 text-gray-400">
                   <span className="text-[10px] font-medium">{new Date(msg.createdAt).toLocaleString()}</span>
                   {isMine && <CheckCircle2 size={12} className="text-orange-400" />}
                 </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white border-t border-gray-100 sticky bottom-0 z-10 flex flex-col shadow-none">
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

          {sendError && <p className="px-4 pt-2 text-xs font-bold text-rose-600">{sendError}</p>}

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
            <div className="flex justify-between items-center px-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={alsoSendEmail}
                  onChange={(e) => setAlsoSendEmail(e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <Mail size={14} className="text-gray-400" />
                {isRtl ? 'ابعت كمان نسخة إيميل' : 'Also send an email copy'}
              </label>
              <button 
                type="submit" 
                disabled={!messageInput.trim() || isSending} 
                className={`flex items-center justify-center p-2 rounded-xl transition-all shadow-none ${messageInput.trim() && !isSending ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-400'}`}
              >
                <Send size={18} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </div>
          </form>
        </div>
        </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            {isRtl ? 'اختار جهة اتصال عشان تبدأ محادثة' : 'Select a contact to start a conversation'}
          </div>
        )}

      </div>

    </div>
    </div>
  );
}
