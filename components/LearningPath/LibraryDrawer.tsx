'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Search, FileText, PlayCircle, Volume2, Box, Link as LinkIcon, Check, BookOpen, Folder, Sparkles, ClipboardList } from 'lucide-react';
import { useState, useEffect, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { getOfficialCurriculumResources, getOfficialLessonPlans } from '@/services/academicData';
import { getLibraryFiles } from '@/services/libraryData';

interface LibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetUnitTitle: string;
  language?: 'en' | 'ar';
  grade?: string;
  subject?: string;
  teacherId?: string;
  classId?: string;
  onInject?: (items: LibraryItem[]) => void;
}

type FileType = 'all' | 'docs' | 'video' | 'audio' | 'scorm' | 'link';
type SourceType = 'official' | 'my-library' | 'lesson-plan';

interface LibraryItem {
  id: string;
  title: string;
  type: 'docs' | 'video' | 'audio' | 'scorm' | 'link';
  folder?: string;
  size?: string;
  url?: string;
}

interface LessonPlanItem {
  id: string;
  title: string;
  content: string;
  weekNumber: number | null;
}

// بيحوّل نوع المصدر الرسمي (من المنهج) لنفس الأنواع اللي شاشة الاستيراد بتفهمها
function normalizeOfficialType(type: string): LibraryItem['type'] {
  const t = (type || '').toLowerCase();
  if (t.includes('video')) return 'video';
  if (t.includes('link')) return 'link';
  if (t.includes('audio')) return 'audio';
  return 'docs';
}

export function LibraryDrawer({ isOpen, onClose, targetUnitTitle, language = 'en', grade, subject, teacherId, classId, onInject }: LibraryDrawerProps) {
  const [source, setSource] = useState<SourceType>('official');
  const [fileTypeFilter, setFileTypeFilter] = useState<FileType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [officialItems, setOfficialItems] = useState<LibraryItem[]>([]);
  const [myLibraryItems, setMyLibraryItems] = useState<LibraryItem[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlanItem[]>([]);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isRtl = language === 'ar';

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    startTransition(() => setIsLoading(true));
    const officialPromise = grade && subject ? getOfficialCurriculumResources(grade, subject) : Promise.resolve([]);
    const myLibraryPromise = teacherId && classId && subject ? getLibraryFiles({ teacherId, classId, subject }) : Promise.resolve([]);
    const lessonPlansPromise = grade && subject ? getOfficialLessonPlans(grade, subject) : Promise.resolve([]);

    Promise.all([officialPromise, myLibraryPromise, lessonPlansPromise]).then(([official, mine, plans]) => {
      setOfficialItems(official.map((r) => ({ id: r.id, title: r.title, type: normalizeOfficialType(r.type), url: r.url })));
      setMyLibraryItems(mine.map((f) => ({ id: f.id, title: f.name, type: (f.type === 'sheet' || f.type === 'slides' ? 'docs' : (f.type as any)) || 'docs', size: f.size })));
      setLessonPlans(plans);
      setIsLoading(false);
    });
  }, [isOpen, grade, subject, teacherId, classId]);

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const rawList: LibraryItem[] = source === 'official' ? officialItems : source === 'my-library' ? myLibraryItems : [];
  const filteredItems = rawList.filter(item => {
    if (fileTypeFilter !== 'all' && item.type !== fileTypeFilter) return false;
    if (searchQuery.trim() && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleInject = () => {
    const items = rawList.filter((i) => selectedItems.includes(i.id));
    onInject?.(items);
    setSelectedItems([]);
    onClose();
  };

  const fileTypeIcon = (type: LibraryItem['type']) => {
    switch (type) {
      case 'video': return <PlayCircle size={16} className="text-rose-500" />;
      case 'audio': return <Volume2 size={16} className="text-amber-500" />;
      case 'scorm': return <Box size={16} className="text-indigo-500" />;
      case 'link': return <LinkIcon size={16} className="text-blue-500" />;
      default: return <FileText size={16} className="text-slate-500" />;
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[90]" />
          <motion.div initial={{ x: isRtl ? '-100%' : '100%' }} animate={{ x: 0 }} exit={{ x: isRtl ? '-100%' : '100%' }} className="fixed top-0 right-0 h-full w-[440px] max-w-[92vw] bg-white shadow-2xl z-[100] flex flex-col border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-indigo-600" size={18} />
                  <h3 className="font-bold text-base">{isRtl ? 'مكتبة الموارد' : 'Official Curriculum Library'}</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X size={18} /></button>
              </div>
              <p className="text-xs text-slate-400">{isRtl ? 'الهدف: ' : 'Target: '}{targetUnitTitle}</p>
            </div>

            {/* Source Toggle */}
            <div className="grid grid-cols-3 gap-2 p-4 pb-2">
              <button onClick={() => setSource('official')} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold ${source === 'official' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <BookOpen size={14} /> {isRtl ? 'المكتبة الرسمية' : 'Official'}
              </button>
              <button onClick={() => setSource('my-library')} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold ${source === 'my-library' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Folder size={14} /> {isRtl ? 'مكتبتي' : 'My Library'}
              </button>
              <button onClick={() => setSource('lesson-plan')} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold ${source === 'lesson-plan' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <ClipboardList size={14} /> {isRtl ? 'الخطة الرسمية' : 'Lesson Plan'}
              </button>
            </div>

            {source !== 'lesson-plan' && (
              <div className="px-4">
                <div className="relative mb-3">
                  <Search className="absolute right-3 top-2.5 text-slate-400" size={14} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isRtl ? 'دوّر على مورد...' : 'Search resources...'} className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-xs" />
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(['all', 'docs', 'video', 'audio', 'scorm', 'link'] as FileType[]).map((t) => (
                    <button key={t} onClick={() => setFileTypeFilter(t)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${fileTypeFilter === t ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{t}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
              {isLoading ? (
                <p className="text-center text-xs text-slate-400 py-10">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
              ) : source === 'lesson-plan' ? (
                lessonPlans.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">{isRtl ? 'لسه مفيش خطة درس معتمدة لهذه المادة والصف.' : 'No approved lesson plan for this subject/grade yet.'}</p>
                ) : (
                  lessonPlans.map((plan) => (
                    <div key={plan.id} onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)} className="p-3 rounded-2xl border border-slate-200 bg-white cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0"><ClipboardList size={16} className="text-indigo-600" /></div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-xs text-slate-800 truncate">{plan.title}</h5>
                          {plan.weekNumber != null && <p className="text-[10px] text-slate-400 mt-0.5">{isRtl ? `الأسبوع ${plan.weekNumber}` : `Week ${plan.weekNumber}`}</p>}
                        </div>
                      </div>
                      {expandedPlanId === plan.id && (
                        <p className="mt-3 text-xs text-slate-600 whitespace-pre-wrap border-t border-slate-100 pt-3">{plan.content}</p>
                      )}
                    </div>
                  ))
                )
              ) : filteredItems.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-10">{isRtl ? 'مفيش موارد هنا لسه.' : 'No resources here yet.'}</p>
              ) : (
                filteredItems.map(item => (
                  <div key={item.id} onClick={() => toggleSelection(item.id)} className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-3 ${selectedItems.includes(item.id) ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200'}`}>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">{fileTypeIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-xs text-slate-800 truncate">{item.title}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase">{item.type} • {item.size || item.url || ''}</p>
                    </div>
                    {selectedItems.includes(item.id) && <Check size={16} className="text-indigo-600 shrink-0" />}
                  </div>
                ))
              )}
            </div>
            {source !== 'lesson-plan' && (
              <div className="p-4 border-t border-slate-100">
                <button disabled={selectedItems.length === 0} onClick={handleInject} className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white disabled:opacity-50">
                  {isRtl ? `إضافة ${selectedItems.length} عنصر للوحدة` : `Inject ${selectedItems.length} Items to Unit`}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
