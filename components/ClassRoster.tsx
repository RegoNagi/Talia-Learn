'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, ChevronDown, Check, LayoutGrid, List as ListIcon, X, MessageSquare, Phone, AlertCircle, FileText, ImageIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  grade: number;
  path: 'standard' | 'empowerment' | 'excellence';
  avatar: string;
  status: 'active' | 'absent_today';
  phone: string;
  notesCount: number;
  notes: BehaviorNote[];
}

const MOCK_STUDENTS: Student[] = [
  { id: '1', nameAr: 'أحمد محمود', nameEn: 'Ahmed Mahmoud', academicId: 'STD-2401', className: '10-A', attendance: 94, grade: 88, path: 'excellence', avatar: 'https://picsum.photos/seed/ahmad/100', status: 'active', phone: '+971 50 123 4567', notesCount: 2, notes: [{ id: 'n1', text: 'تأخر في تسليم الواجب', date: '2023-10-25' }, { id: 'n2', text: 'مشاغبة في الفصل', date: '2023-10-26' }] },
  { id: '2', nameAr: 'سارة خالد', nameEn: 'Sarah Khaled', academicId: 'STD-2402', className: '10-B', attendance: 71, grade: 65, path: 'empowerment', avatar: 'https://picsum.photos/seed/sarak/100', status: 'absent_today', phone: '+971 50 234 5678', notesCount: 5, notes: [{ id: 'n3', text: 'غياب متكرر', date: '2023-10-20' }, { id: 'n4', text: 'عدم الانتباه في الحصة', date: '2023-10-22' }, { id: 'n5', text: 'تأخر عن الطابور الصباحي', date: '2023-10-24' }, { id: 'n6', text: 'عدم إحضار الكتاب المدرسي', date: '2023-10-25' }, { id: 'n7', text: 'تحدث أثناء الشرح', date: '2023-10-26' }] },
  { id: '3', nameAr: 'يوسف العلي', nameEn: 'Yousef Al-Ali', academicId: 'STD-2403', className: '10-A', attendance: 98, grade: 92, path: 'standard', avatar: 'https://picsum.photos/seed/yousef/100', status: 'active', phone: '+971 50 345 6789', notesCount: 0, notes: [] },
  { id: '4', nameAr: 'فاطمة محمد', nameEn: 'Fatima Mohammed', academicId: 'STD-2404', className: '11-C', attendance: 85, grade: 78, path: 'standard', avatar: 'https://picsum.photos/seed/fatima/100', status: 'active', phone: '+971 50 456 7890', notesCount: 1, notes: [{ id: 'n8', text: 'نسيان الواجب', date: '2023-10-21' }] },
  { id: '5', nameAr: 'عمر زيدان', nameEn: 'Omar Zaidan', academicId: 'STD-2405', className: '10-B', attendance: 99, grade: 96, path: 'excellence', avatar: 'https://picsum.photos/seed/omar/100', status: 'active', phone: '+971 50 567 8901', notesCount: 0, notes: [] },
  { id: '6', nameAr: 'لينة حسن', nameEn: 'Leena Hassan', academicId: 'STD-2406', className: '11-C', attendance: 82, grade: 74, path: 'empowerment', avatar: 'https://picsum.photos/seed/leena/100', status: 'active', phone: '+971 50 678 9012', notesCount: 3, notes: [{ id: 'n9', text: 'استخدام الهاتف المحمول في الفصل', date: '2023-10-18' }, { id: 'n10', text: 'تأخر عن الحصة الأولى', date: '2023-10-23' }, { id: 'n11', text: 'عدم الالتزام بالزي المدرسي', date: '2023-10-26' }] },
  { id: '7', nameAr: 'محمد جابر', nameEn: 'Mohammed Jaber', academicId: 'STD-2407', className: '10-A', attendance: 95, grade: 89, path: 'standard', avatar: 'https://picsum.photos/seed/jaber/100', status: 'absent_today', phone: '+971 50 789 0123', notesCount: 1, notes: [{ id: 'n12', text: 'التحدث بصوت عالٍ في الممرات', date: '2023-10-25' }] },
];

export function ClassRoster({ language = 'ar' }: { language?: 'ar' | 'en' }) {
  const isRtl = language === 'ar';
  
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isClassFilterOpen, setIsClassFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPath, setFilterPath] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isNotesListOpen, setIsNotesListOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.nameAr.includes(searchQuery) || s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || s.academicId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesPath = filterPath === 'all' || s.path === filterPath;
    const matchesClass = filterClass === 'all' || s.className === filterClass;
    return matchesSearch && matchesStatus && matchesPath && matchesClass;
  });

  const handleSaveNote = () => {
    if (!noteText.trim() || !selectedStudent) return;
    
    const newNote = {
      id: editingNoteId || Date.now().toString(),
      text: noteText,
      date: new Date().toISOString().split('T')[0]
    };

    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudent.id) {
        if (editingNoteId) {
          const updatedNotes = s.notes.map(n => n.id === editingNoteId ? newNote : n);
          return { ...s, notes: updatedNotes };
        } else {
          return { ...s, notesCount: s.notesCount + 1, notes: [...s.notes, newNote] };
        }
      }
      return s;
    }));
    
    setSelectedStudent(prev => {
      if (!prev) return null;
      if (editingNoteId) {
        const updatedNotes = prev.notes.map(n => n.id === editingNoteId ? newNote : n);
        return { ...prev, notes: updatedNotes };
      } else {
        return { ...prev, notesCount: prev.notesCount + 1, notes: [...prev.notes, newNote] };
      }
    });
    
    setNoteText('');
    setEditingNoteId(null);
    setIsNoteModalOpen(false);
  };

  const handleDeleteNote = (noteId: string) => {
    if (!selectedStudent) return;
    
    if (confirm(isRtl ? 'هل أنت متأكد من حذف هذه الملاحظة؟' : 'Are you sure you want to delete this note?')) {
      setStudents(prev => prev.map(s => {
        if (s.id === selectedStudent.id) {
          return { ...s, notesCount: Math.max(0, s.notesCount - 1), notes: s.notes.filter(n => n.id !== noteId) };
        }
        return s;
      }));
      
      setSelectedStudent(prev => prev ? { 
        ...prev, 
        notesCount: Math.max(0, prev.notesCount - 1), 
        notes: prev.notes.filter(n => n.id !== noteId) 
      } : null);
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

  const handlePublishNote = (noteId: string) => {
    if (!selectedStudent) return;
    
    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudent.id) {
        return { 
          ...s, 
          notes: s.notes.map(n => n.id === noteId ? { ...n, published: !n.published } : n) 
        };
      }
      return s;
    }));
    
    setSelectedStudent(prev => prev ? { 
      ...prev, 
      notes: prev.notes.map(n => n.id === noteId ? { ...n, published: !n.published } : n) 
    } : null);
  };

  const getPathBadge = (path: string) => {
    if (path === 'empowerment') {
      return (
        <span className="inline-block px-2.5 py-1 text-[10px] font-bold rounded-md bg-orange-50 text-orange-600 border border-orange-100">
          {isRtl ? 'مسار التمكين' : 'Empowerment Path'}
        </span>
      );
    }
    if (path === 'excellence') {
      return (
        <span className="inline-block px-2.5 py-1 text-[10px] font-bold rounded-md bg-green-50 text-green-600 border border-green-100">
          {isRtl ? 'مسار التميز' : 'Excellence Path'}
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-1 text-[10px] font-bold rounded-md bg-gray-50 text-gray-600 border border-gray-100">
        {isRtl ? 'المسار الأساسي' : 'Standard Path'}
      </span>
    );
  };

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
                       {['all', '10-A', '10-B', '11-C'].map((cls) => (
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
                 className={`flex items-center justify-between gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors w-full sm:w-auto ${isFilterOpen || filterStatus !== 'all' || filterPath !== 'all' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
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
                       <div className="h-px bg-gray-100 w-full" />
                       <div>
                         <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{isRtl ? 'المسار التعليمي' : 'Learning Path'}</label>
                         <div className="space-y-1 text-sm">
                           {['all', 'standard', 'empowerment', 'excellence'].map((path) => (
                             <button
                               key={path}
                               onClick={() => setFilterPath(path)}
                               className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700 text-start"
                             >
                               <span>
                                 {path === 'all' && (isRtl ? 'الكل' : 'All')}
                                 {path === 'standard' && (isRtl ? 'المسار الأساسي' : 'Standard Path')}
                                 {path === 'empowerment' && (isRtl ? 'مسار التمكين' : 'Empowerment Path')}
                                 {path === 'excellence' && (isRtl ? 'مسار التميز' : 'Excellence Path')}
                               </span>
                               {filterPath === path && <Check size={14} className="text-orange-500" />}
                             </button>
                           ))}
                         </div>
                       </div>
                     </div>
                     {(filterStatus !== 'all' || filterPath !== 'all') && (
                       <button 
                         onClick={() => { setFilterStatus('all'); setFilterPath('all'); }}
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
        {filteredStudents.length === 0 ? (
          <div className="py-20 text-center bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-center shadow-none">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
               <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700">{isRtl ? 'لا توجد نتائج مطابقة' : 'No matching results'}</h3>
            <p className="text-sm text-gray-500 mt-1">{isRtl ? 'جرب البحث باسم آخر أو تغيير إعدادات التصفية' : 'Try searching with a different name or clear filters'}</p>
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
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{isRtl ? 'التقييم' : 'Grade'}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-start">{isRtl ? 'المسار التعليمي' : 'Learning Path'}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-end"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map(student => (
                      <tr 
                        key={student.id} 
                        onClick={() => setSelectedStudent(student)}
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
                          <span className="font-bold text-gray-800 border-none m-0 leading-tight">
                            {student.grade}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPathBadge(student.path)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-end">
                          <button 
                            onClick={(e) => { 
                               e.stopPropagation(); 
                               alert(isRtl ? `بدء محادثة مع: ${student.nameAr}` : `Start chat with: ${student.nameEn}`);
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
                    onClick={() => setSelectedStudent(student)}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-none hover:border-gray-300 transition-all cursor-pointer relative group flex flex-col"
                  >
                    <div className="absolute top-4 start-4 z-10 hidden sm:block">
                      <button 
                         onClick={(e) => { 
                           e.stopPropagation(); 
                           alert(isRtl ? `بدء محادثة مع: ${student.nameAr}` : `Start chat with: ${student.nameEn}`);
                         }}
                         className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 p-2 rounded-lg transition-colors shadow-none"
                         title={isRtl ? 'مراسلة مباشرة' : 'Direct Message'}
                      >
                         <MessageSquare size={18} />
                      </button>
                    </div>
                    <div className="absolute top-4 end-4 z-10">
                      {getPathBadge(student.path)}
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
                      <div className="flex flex-col items-center bg-gray-50 rounded-xl p-2 border border-gray-100">
                         <span className="text-[10px] text-gray-500 font-bold mb-1">{isRtl ? 'التقييم العام' : 'Grade'}</span>
                         <span className="font-black text-sm text-gray-700">{student.grade}%</span>
                      </div>
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
                  {getPathBadge(selectedStudent.path)}
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

                  {/* Contact Info */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-gray-500">
                        <Phone size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400">{isRtl ? 'هاتف ولي الأمر' : 'Parent Phone'}</p>
                        <p className="text-sm font-bold text-gray-700" dir="ltr">{selectedStudent.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Inter-module action buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button 
                      onClick={() => alert(isRtl ? `تم فتح المحادثة الفورية مع: ${selectedStudent.nameAr}` : `Opened instant chat with: ${selectedStudent.nameEn}`)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl text-sm font-bold transition-all border border-transparent hover:border-orange-200"
                    >
                      <MessageSquare size={18} />
                      {isRtl ? 'فتح محادثة فورية' : 'Open Instant Chat'}
                    </button>
                    <button 
                      onClick={() => alert(isRtl ? `عرض السجل الأكاديمي للطالب: ${selectedStudent.nameAr}` : `View academic profile for: ${selectedStudent.nameEn}`)}
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

    </div>
  );
}
