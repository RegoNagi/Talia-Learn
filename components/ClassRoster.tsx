'use client';

import React, { useState, useEffect, startTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, Check, LayoutGrid, List as ListIcon, X, MessageSquare, AlertCircle, FileText, Plus, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMyClassSections, getStudentsByIds, getAttendancePercentagesForStudents } from '@/services/attendanceData';
import { getStudentNotes, getNoteCountsForStudents, addStudentNote, updateStudentNote, deleteStudentNote, getTodayAbsentStudentIds } from '@/services/rosterData';
import { sendMessageToStudentParent } from '@/services/messagesData';

export interface BehaviorNote {
  id: string;
  text: string;
  date: string;
  published?: boolean;
}

interface Student {
  id: string;
  nameAr: string;
  nameEn: string;
  academicId: string;
  className: string;
  attendance: number;
  avatar: string;
  status: 'active' | 'absent_today';
  notesCount: number;
  notes: BehaviorNote[];
}

export function ClassRoster({ language = 'ar', teacherId, authUser }: { language?: 'ar' | 'en'; teacherId?: string; authUser?: any }) {
  const isRtl = language === 'ar';
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [classIdByName, setClassIdByName] = useState<Record<string, string>>({});

  const [isMessageParentOpen, setIsMessageParentOpen] = useState(false);
  const [messageParentText, setMessageParentText] = useState('');
  const [isSendingParentMessage, setIsSendingParentMessage] = useState(false);
  const [parentMessageResult, setParentMessageResult] = useState('');

  const loadRoster = async () => {
    if (!teacherId) { startTransition(() => setIsLoading(false)); return; }
    startTransition(() => setIsLoading(true));
    const sections = await getMyClassSections(teacherId);
    setClassOptions(sections.map((s) => s.name));
    setClassIdByName(Object.fromEntries(sections.map((s) => [s.name, s.id])));

    const allStudentIds = Array.from(new Set(sections.flatMap((s) => s.students)));
    const [studentRows, attendanceMap, noteCounts, absentTodayIds] = await Promise.all([
      getStudentsByIds(allStudentIds),
      getAttendancePercentagesForStudents(allStudentIds),
      getNoteCountsForStudents(allStudentIds),
      getTodayAbsentStudentIds(allStudentIds),
    ]);

    const classByStudent: Record<string, string> = {};
    sections.forEach((sec) => sec.students.forEach((sid) => { classByStudent[sid] = sec.name; }));

    const mapped: Student[] = studentRows.map((s) => ({
      id: s.id,
      nameAr: s.name,
      nameEn: s.name,
      academicId: s.id.slice(0, 8).toUpperCase(),
      className: classByStudent[s.id] || '',
      attendance: attendanceMap[s.id] ?? 0,
      avatar: `https://picsum.photos/seed/${s.id}/100`,
      status: absentTodayIds.has(s.id) ? 'absent_today' : 'active',
      notesCount: noteCounts[s.id] || 0,
      notes: [],
    }));
    setStudents(mapped);
    setIsLoading(false);
  };

  useEffect(() => {
    startTransition(() => { loadRoster(); });
  }, [teacherId]);

  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isClassFilterOpen, setIsClassFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isNotesListOpen, setIsNotesListOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.nameAr.includes(searchQuery) || s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || s.academicId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesClass = filterClass === 'all' || s.className === filterClass;
    return matchesSearch && matchesStatus && matchesClass;
  });

  const mapNotes = (notes: { id: string; text: string; published: boolean; createdAt: string }[]): BehaviorNote[] =>
    notes.map(n => ({ id: n.id, text: n.text, published: n.published, date: new Date(n.createdAt).toLocaleDateString() }));

  const handleSaveNote = async () => {
    if (!noteText.trim() || !selectedStudent || !teacherId) return;

    if (editingNoteId) {
      await updateStudentNote(editingNoteId, { text: noteText });
    } else {
      await addStudentNote({ studentId: selectedStudent.id, teacherId, text: noteText, published: false });
    }

    const freshNotes = mapNotes(await getStudentNotes(selectedStudent.id));
    setSelectedStudent(prev => prev ? { ...prev, notes: freshNotes, notesCount: freshNotes.length } : null);
    setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, notesCount: freshNotes.length } : s));

    setNoteText('');
    setEditingNoteId(null);
    setIsNoteModalOpen(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedStudent) return;

    if (confirm(isRtl ? 'هل أنت متأكد من حذف هذه الملاحظة؟' : 'Are you sure you want to delete this note?')) {
      await deleteStudentNote(noteId);
      const freshNotes = mapNotes(await getStudentNotes(selectedStudent.id));
      setSelectedStudent(prev => prev ? { ...prev, notes: freshNotes, notesCount: freshNotes.length } : null);
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, notesCount: freshNotes.length } : s));
    }
  };

  const openAddNoteModal = () => {
    setEditingNoteId(null);
    setNoteText('');
    setIsNoteModalOpen(true);
  };

  const openEditNoteModal = (note: BehaviorNote) => {
    setEditingNoteId(note.id);
    setNoteText(note.text);
    setIsNoteModalOpen(true);
  };

  const handlePublishNote = async (noteId: string) => {
    if (!selectedStudent) return;
    const note = selectedStudent.notes.find(n => n.id === noteId);
    if (!note) return;
    await updateStudentNote(noteId, { published: !note.published });
    const freshNotes = mapNotes(await getStudentNotes(selectedStudent.id));
    setSelectedStudent(prev => prev ? { ...prev, notes: freshNotes } : null);
  };

  const openStudentDetail = async (student: Student) => {
    setSelectedStudent(student);
    const freshNotes = mapNotes(await getStudentNotes(student.id));
    setSelectedStudent(prev => prev && prev.id === student.id ? { ...prev, notes: freshNotes } : prev);
  };

  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);
  const [pendingGradebookStudent, setPendingGradebookStudent] = useState<Student | null>(null);

  const navigateToGradebook = (student: Student, subject: string) => {
    const classId = classIdByName[student.className];
    if (!classId || !subject) return;
    router.push(`/courses/${classId}__${encodeURIComponent(subject)}?tab=gradebook`);
  };

  const goToGradebook = (student: Student) => {
    const subjects = authUser?.subjects || [];
    if (subjects.length === 0) return;
    if (subjects.length === 1) {
      navigateToGradebook(student, subjects[0]);
      return;
    }
    setPendingGradebookStudent(student);
    setIsSubjectPickerOpen(true);
  };

  const handleSendParentMessage = async () => {
    if (!selectedStudent || !teacherId || !authUser?.name || !messageParentText.trim()) return;
    setIsSendingParentMessage(true);
    setParentMessageResult('');
    const { ok, error } = await sendMessageToStudentParent({
      senderId: teacherId,
      senderRole: 'teacher',
      senderName: authUser.name,
      studentId: selectedStudent.id,
      subject: `Regarding ${isRtl ? selectedStudent.nameAr : selectedStudent.nameEn}`,
      content: messageParentText.trim(),
    });
    setIsSendingParentMessage(false);
    if (ok) {
      setMessageParentText('');
      setIsMessageParentOpen(false);
    } else {
      setParentMessageResult(error || (isRtl ? 'حصل خطأ' : 'Something went wrong'));
    }
  };

  const getClassBadge = (className: string) => (
    <span className="inline-block px-2.5 py-1 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
      {className || (isRtl ? 'غير محدد' : 'Unassigned')}
    </span>
  );

  return (
    <div className={`w-full relative ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-6xl mx-auto space-y-6 text-gray-800">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-none">
          <div className="flex-1 w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
             {/* Search */}
             <div className="relative flex-1 max-w-sm">
               <span className="absolute top-1/2 -translate-y-1/2 text-gray-400 start-3">
                 <Search size={18} />
               </span>
               <input 
                 type="text"
                 placeholder={isRtl ? 'ابحث بالاسم أو الرقم الأكاديمي...' : 'Search by name or ID...'}
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 ps-9 text-sm focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-300 transition-colors placeholder:text-gray-400"
               />
             </div>

             {/* Class Filter Popover */}
             <div className="relative">
               <button 
                 onClick={() => setIsClassFilterOpen(!isClassFilterOpen)}
                 className={`flex items-center justify-between gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors w-full sm:w-auto ${isClassFilterOpen || filterClass !== 'all' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
               >
                 {filterClass === 'all' ? (isRtl ? 'كل الفصول' : 'All Classes') : filterClass}
                 <ChevronDown size={16} className={`transition-transform duration-200 ${isClassFilterOpen ? 'rotate-180' : ''}`} />
               </button>

               <AnimatePresence>
                 {isClassFilterOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: 8 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 8 }}
                     className="absolute top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl p-2 shadow-none z-20 start-0 sm:start-auto sm:end-0 text-start"
                   >
                     <div className="space-y-1">
                       {['all', ...classOptions].map((cls) => (
                         <button
                           key={cls}
                           onClick={() => { setFilterClass(cls); setIsClassFilterOpen(false); }}
                           className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 text-start text-sm"
                         >
                           <span>{cls === 'all' ? (isRtl ? 'كل الفصول' : 'All Classes') : cls}</span>
                           {filterClass === cls && <Check size={14} className="text-orange-500" />}
                         </button>
                       ))}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
               {isClassFilterOpen && (
                 <div className="fixed inset-0 z-10" onClick={() => setIsClassFilterOpen(false)} />
               )}
             </div>

             {/* Custom Filter Popover */}
             <div className="relative">
               <button 
                 onClick={() => setIsFilterOpen(!isFilterOpen)}
                 className={`flex items-center justify-between gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors w-full sm:w-auto ${isFilterOpen || filterStatus !== 'all' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
               >
                 {isRtl ? 'تصفية النتائج' : 'Filter Results'}
                 <ChevronDown size={16} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
               </button>

               <AnimatePresence>
                 {isFilterOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: 8 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 8 }}
                     className="absolute top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl p-4 shadow-none z-20 start-0 sm:start-auto sm:end-0 text-start"
                   >
                     <div className="space-y-4">
                       <div>
                         <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{isRtl ? 'حالة الحضور' : 'Attendance Status'}</label>
                         <div className="space-y-1 text-sm">
                           {['all', 'active', 'absent_today'].map((status) => (
                             <button
                               key={status}
                               onClick={() => setFilterStatus(status)}
                               className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700 text-start"
                             >
                               <span>
                                 {status === 'all' && (isRtl ? 'الكل' : 'All')}
                                 {status === 'active' && (isRtl ? 'نشط' : 'Active')}
                                 {status === 'absent_today' && (isRtl ? 'غائب اليوم' : 'Absent Today')}
                               </span>
                               {filterStatus === status && <Check size={14} className="text-orange-500" />}
                             </button>
                           ))}
                         </div>
                       </div>
                     </div>
                     {filterStatus !== 'all' && (
                       <button 
                         onClick={() => { setFilterStatus('all'); }}
                         className="mt-4 w-full py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                       >
                         {isRtl ? 'مسح التصفية' : 'Clear Filters'}
                       </button>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
               {isFilterOpen && (
                 <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
               )}
             </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 shrink-0 self-end sm:self-auto">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm border border-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
              title={isRtl ? 'عرض كروت' : 'Grid View'}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm border border-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
              title={isRtl ? 'عرض قائمة' : 'List View'}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>

        {/* Roster Area */}
        {isLoading ? (
          <div className="py-20 text-center bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-center shadow-none">
            <p className="text-sm text-gray-400">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-center shadow-none">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
               <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700">{students.length === 0 ? (isRtl ? 'لا يوجد طلاب بعد' : 'No students yet') : (isRtl ? 'لا توجد نتائج مطابقة' : 'No matching results')}</h3>
            <p className="text-sm text-gray-500 mt-1">{students.length === 0 ? (isRtl ? 'مفيش طلاب مسجّلين في فصولك لسه' : 'No students enrolled in your classes yet') : (isRtl ? 'جرب البحث باسم آخر أو تغيير إعدادات التصفية' : 'Try searching with a different name or clear filters')}</p>
          </div>
        ) : (
          <div className="relative">
            {viewMode === 'list' && (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-none overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-start">{isRtl ? 'الطالب' : 'Student'}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-start">{isRtl ? 'الرقم الأكاديمي' : 'Student ID'}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{isRtl ? 'الحضور' : 'Attendance'}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{isRtl ? 'الدرجات' : 'Grades'}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-start">{isRtl ? 'المسار التعليمي' : 'Learning Path'}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-end"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map(student => (
                      <tr 
                        key={student.id} 
                        onClick={() => openStudentDetail(student)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100 shrink-0 bg-white">
                              <Image src={student.avatar} alt={student.nameEn} fill className="object-cover" />
                              {student.status === 'absent_today' && (
                                <div className="absolute inset-0 bg-red-500/20 backdrop-blur-[1px]"></div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 border-none m-0 leading-tight">{isRtl ? student.nameAr : student.nameEn}</p>
                              {student.status === 'absent_today' && (
                                <span className="text-[10px] font-bold text-red-500 mt-0.5 inline-block">{isRtl ? 'غائب اليوم' : 'Absent Today'}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs font-medium">
                          {student.academicId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`font-bold ${student.attendance < 80 ? 'text-red-500' : 'text-gray-800'}`}>
                            {student.attendance}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); goToGradebook(student); }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {isRtl ? 'فتح السجل' : 'Open Gradebook'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getClassBadge(student.className)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-end">
                          <button 
                            onClick={(e) => { 
                               e.stopPropagation(); 
                               openStudentDetail(student);
                               setIsMessageParentOpen(true);
                            }}
                            className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 p-2 rounded-lg transition-colors shadow-none"
                            title={isRtl ? 'مراسلة مباشرة' : 'Direct Message'}
                          >
                            <MessageSquare size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStudents.map(student => (
                  <div 
                    key={student.id}
                    onClick={() => openStudentDetail(student)}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-none hover:border-gray-300 transition-all cursor-pointer relative group flex flex-col"
                  >
                    <div className="absolute top-4 start-4 z-10 hidden sm:block">
                      <button 
                         onClick={(e) => { 
                           e.stopPropagation(); 
                           openStudentDetail(student);
                           setIsMessageParentOpen(true);
                         }}
                         className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 p-2 rounded-lg transition-colors shadow-none"
                         title={isRtl ? 'مراسلة مباشرة' : 'Direct Message'}
                      >
                         <MessageSquare size={18} />
                      </button>
                    </div>
                    <div className="absolute top-4 end-4 z-10">
                      {getClassBadge(student.className)}
                    </div>
                    
                    <div className="flex flex-col items-center mt-3 text-center mb-5">
                      <div className="relative w-20 h-20 rounded-full border border-gray-100 overflow-hidden mb-3">
                         <Image src={student.avatar} alt={student.nameEn} fill className="object-cover" />
                         {student.status === 'absent_today' && (
                           <div className="absolute inset-0 bg-red-500/20 backdrop-blur-[1px]"></div>
                         )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">{isRtl ? student.nameAr : student.nameEn}</h3>
                      <p className="text-xs text-gray-500 font-mono">{student.academicId}</p>
                      {student.status === 'absent_today' && (
                        <span className="text-xs font-bold text-red-500 mt-2 bg-red-50 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-red-100">
                          <AlertCircle size={12} /> {isRtl ? 'غائب اليوم' : 'Absent Today'}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-50 pt-4">
                      <div className="flex flex-col items-center bg-gray-50 rounded-xl p-2 border border-gray-100">
                         <span className="text-[10px] text-gray-500 font-bold mb-1">{isRtl ? 'الحضور' : 'Attendance'}</span>
                         <span className={`font-black text-sm ${student.attendance < 80 ? 'text-red-500' : 'text-gray-700'}`}>{student.attendance}%</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); goToGradebook(student); }}
                        className="flex flex-col items-center justify-center bg-indigo-50 hover:bg-indigo-100 rounded-xl p-2 border border-indigo-100 transition-colors"
                      >
                         <span className="text-[10px] text-indigo-500 font-bold mb-1">{isRtl ? 'الدرجات' : 'Grades'}</span>
                         <span className="font-black text-xs text-indigo-700">{isRtl ? 'فتح السجل' : 'Open Gradebook'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/40 z-40 backdrop-blur-sm"
              onClick={() => setSelectedStudent(null)}
            />
            <motion.div 
              initial={{ x: isRtl ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 bottom-0 ${isRtl ? 'left-0 border-r' : 'right-0 border-l'} border-gray-200 w-full sm:w-[400px] bg-white z-50 shadow-none flex flex-col`}
            >
              {/* Drawer Header */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white shrink-0">
                <h2 className="text-base font-bold text-gray-800">{isRtl ? 'الملف الشخصي' : 'Student Profile'}</h2>
                <button onClick={() => setSelectedStudent(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
                
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="relative w-28 h-28 rounded-full overflow-hidden border border-gray-100 mb-4 bg-white">
                     <Image src={selectedStudent.avatar} alt={selectedStudent.nameEn} fill className="object-cover" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{isRtl ? selectedStudent.nameAr : selectedStudent.nameEn}</h3>
                  <p className="text-sm text-gray-500 font-mono mb-3">{selectedStudent.academicId}</p>
                  {getClassBadge(selectedStudent.className)}
                </div>

                <div className="space-y-6">
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1.5"><ListIcon size={14} className="text-gray-400" /> {isRtl ? 'معدل الحضور' : 'Attendance Rate'}</span>
                      <span className="text-2xl font-black text-gray-800">{selectedStudent.attendance}%</span>
                    </div>
                    <div 
                      onClick={() => setIsNotesListOpen(true)}
                      className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center relative group cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1.5"><AlertCircle size={14} className="text-gray-400" /> {isRtl ? 'ملاحظات سلوكية' : 'Behavior Notes'}</span>
                      <span className={`text-2xl font-black ${selectedStudent.notesCount > 0 ? 'text-amber-500' : 'text-gray-800'}`}>{selectedStudent.notesCount}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openAddNoteModal(); }}
                        className="absolute top-2 end-2 p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                        title={isRtl ? 'إضافة ملاحظة' : 'Add Note'}
                      >
                         <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Contact Parent */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-4">
                    <button
                      onClick={() => setIsMessageParentOpen(true)}
                      className="w-full flex items-center gap-3 hover:bg-gray-50 rounded-xl p-1 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 text-indigo-600">
                        <MessageSquare size={14} />
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <p className="text-sm font-bold text-gray-700">{isRtl ? 'راسل ولي الأمر' : 'Message Parent'}</p>
                        <p className="text-[11px] text-gray-400">{isRtl ? 'تصله في صفحة الرسائل' : 'Delivered to their Messages'}</p>
                      </div>
                    </button>
                  </div>

                  {/* Inter-module action buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button 
                      onClick={() => goToGradebook(selectedStudent)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold transition-all"
                    >
                      <FileText size={18} className="text-gray-400" />
                      {isRtl ? 'عرض السجل الأكاديمي' : 'View Academic Profile'}
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Note Modal */}
      <AnimatePresence>
        {isNoteModalOpen && selectedStudent && (
           <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
               onClick={() => setIsNoteModalOpen(false)}
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-none flex flex-col"
             >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                   <h2 className="text-base font-bold text-gray-900">
                     {editingNoteId ? (isRtl ? 'تعديل ملاحظة سلوكية' : 'Edit Behavior Note') : (isRtl ? 'إضافة ملاحظة سلوكية' : 'Add Behavior Note')}
                   </h2>
                   <button 
                     onClick={() => setIsNoteModalOpen(false)} 
                     className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full p-1.5 transition-colors"
                   >
                     <X size={20} />
                   </button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-500 mb-4">
                    {editingNoteId ? (isRtl ? `تعديل ملاحظة لـ ${selectedStudent.nameAr}` : `Edit note for ${selectedStudent.nameEn}`) : (isRtl ? `تسجيل ملاحظة لـ ${selectedStudent.nameAr}` : `Record a note for ${selectedStudent.nameEn}`)}
                  </p>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors shadow-none resize-none"
                    rows={4}
                    placeholder={isRtl ? 'اكتب الملاحظة هنا...' : 'Type note here...'}
                  />
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                   <button 
                     onClick={() => setIsNoteModalOpen(false)}
                     className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                   >
                     {isRtl ? 'إلغاء' : 'Cancel'}
                   </button>
                   <button 
                     onClick={handleSaveNote}
                     className="px-6 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 border border-orange-600 rounded-xl transition-colors shadow-none"
                   >
                     {isRtl ? 'حفظ الملاحظة' : 'Save Note'}
                   </button>
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Notes List Modal */}
      <AnimatePresence>
        {isNotesListOpen && selectedStudent && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
               onClick={() => setIsNotesListOpen(false)}
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-none flex flex-col max-h-[80vh]"
             >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                   <h2 className="text-base font-bold text-gray-900">
                     {isRtl ? 'الملاحظات السلوكية' : 'Behavior Notes'} - {isRtl ? selectedStudent.nameAr : selectedStudent.nameEn}
                   </h2>
                   <button 
                     onClick={() => setIsNotesListOpen(false)} 
                     className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full p-1.5 transition-colors"
                   >
                     <X size={20} />
                   </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                   {selectedStudent.notes.length === 0 ? (
                     <p className="text-sm text-gray-500 text-center py-8">{isRtl ? 'لا توجد ملاحظات سلوكية' : 'No behavior notes found'}</p>
                   ) : (
                     <div className="space-y-4">
                       {selectedStudent.notes.map(note => (
                         <div key={note.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 relative group">
                            <div className="flex items-center gap-2 mb-2">
                               <p className="text-xs font-bold text-gray-400">{note.date}</p>
                               {note.published && (
                                 <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                                   {isRtl ? 'منشور' : 'Published'}
                                 </span>
                               )}
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.text}</p>
                            <div className="absolute top-4 end-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                               <button onClick={() => handlePublishNote(note.id)} className={`text-xs font-bold bg-white px-2 py-1 border rounded-md shadow-sm transition-colors ${note.published ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : 'text-gray-400 border-gray-200 hover:text-green-600 hover:border-green-200'}`}>
                                 {note.published ? (isRtl ? 'إلغاء النشر' : 'Unpublish') : (isRtl ? 'نشر' : 'Publish')}
                               </button>
                               <button onClick={() => openEditNoteModal(note)} className="text-gray-400 hover:text-indigo-600 text-xs font-bold bg-white px-2 py-1 border border-gray-200 rounded-md shadow-sm">{isRtl ? 'تعديل' : 'Edit'}</button>
                               <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-600 text-xs font-bold bg-white px-2 py-1 border border-gray-200 rounded-md shadow-sm">{isRtl ? 'حذف' : 'Delete'}</button>
                            </div>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                   <button 
                     onClick={() => openAddNoteModal()}
                     className="px-6 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 border border-orange-600 rounded-xl transition-colors shadow-none flex items-center gap-2"
                   >
                     <Plus size={16} />
                     {isRtl ? 'إضافة ملاحظة' : 'Add Note'}
                   </button>
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Subject Picker for Gradebook */}
      <AnimatePresence>
        {isSubjectPickerOpen && pendingGradebookStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="bg-gray-900 p-4 text-white flex justify-between items-center">
                <h3 className="font-extrabold text-sm">{isRtl ? 'اختر المادة' : 'Select Subject'}</h3>
                <button onClick={() => setIsSubjectPickerOpen(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-2">
                {(authUser?.subjects || []).map((subj: string) => (
                  <button
                    key={subj}
                    onClick={() => {
                      navigateToGradebook(pendingGradebookStudent, subj);
                      setIsSubjectPickerOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-indigo-200 text-sm font-bold text-gray-700 transition-colors"
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Parent Modal */}
      <AnimatePresence>
        {isMessageParentOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl">
              <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                <h3 className="font-extrabold text-sm">{isRtl ? `رسالة لولي أمر ${selectedStudent.nameAr}` : `Message to ${selectedStudent.nameEn}'s Parent`}</h3>
                <button onClick={() => setIsMessageParentOpen(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-500">{isRtl ? 'هتوصل الرسالة دي مباشرة لحساب ولي الأمر في صفحة الرسائل.' : 'This message will be delivered directly to the parent\'s account in Messages.'}</p>
                <textarea
                  value={messageParentText}
                  onChange={(e) => setMessageParentText(e.target.value)}
                  rows={5}
                  placeholder={isRtl ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
                {parentMessageResult && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{parentMessageResult}</p>}
                <button
                  onClick={handleSendParentMessage}
                  disabled={!messageParentText.trim() || isSendingParentMessage}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Send size={16} /> {isSendingParentMessage ? (isRtl ? 'جاري الإرسال...' : 'Sending...') : (isRtl ? 'إرسال' : 'Send')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
