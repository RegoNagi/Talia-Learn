import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Upload, FileText, File, X, Book, FileArchive, LayoutGrid, List, Folder, FolderPlus, Lock, Globe, Share2, Trash2, ChevronRight, Eye, Image as ImageIcon, Video, FileSpreadsheet, Film, Palette, ArrowLeft, ShieldCheck } from 'lucide-react';
import {
  getMaterialFolders, getMaterialFiles, getMyLibraryFolders, getMyLibraryFiles,
  createLibraryFolder, deleteLibraryFolder,
  toggleFolderPrivacy as toggleFolderPrivacyReal, toggleFilePrivacy as toggleFilePrivacyReal,
  addFolderToMaterial, addFileToMaterial, removeFolderFromMaterial, removeFileFromMaterial,
  updateFolderSharing, updateFileSharing,
  uploadLibraryFile, getLibraryFileDownloadUrl, deleteLibraryFile,
  getTeacherClassNames, getTeachersForSubject, getClassesForSubject, addOfficialResourceToMaterial,
  LibraryFolder, LibraryFile,
} from '@/services/libraryData';
import { LibraryDrawer } from '@/components/LearningPath/LibraryDrawer';

const colorThemeMap: Record<string, { bg: string; border: string; text: string; iconBg: string; activeRing: string }> = {
  indigo: { bg: 'bg-indigo-50/70', border: 'border-indigo-200 hover:border-indigo-400', text: 'text-indigo-700', iconBg: 'bg-indigo-100 text-indigo-600', activeRing: 'ring-indigo-500' },
  emerald: { bg: 'bg-emerald-50/70', border: 'border-emerald-200 hover:border-emerald-400', text: 'text-emerald-700', iconBg: 'bg-emerald-100 text-emerald-600', activeRing: 'ring-emerald-500' },
  amber: { bg: 'bg-amber-50/70', border: 'border-amber-200 hover:border-amber-400', text: 'text-amber-700', iconBg: 'bg-amber-100 text-amber-600', activeRing: 'ring-amber-500' },
  rose: { bg: 'bg-rose-50/70', border: 'border-rose-200 hover:border-rose-400', text: 'text-rose-700', iconBg: 'bg-rose-100 text-rose-600', activeRing: 'ring-rose-500' },
  purple: { bg: 'bg-purple-50/70', border: 'border-purple-200 hover:border-purple-400', text: 'text-purple-700', iconBg: 'bg-purple-100 text-purple-600', activeRing: 'ring-purple-500' },
  cyan: { bg: 'bg-cyan-50/70', border: 'border-cyan-200 hover:border-cyan-400', text: 'text-cyan-700', iconBg: 'bg-cyan-100 text-cyan-600', activeRing: 'ring-cyan-500' },
  blue: { bg: 'bg-blue-50/70', border: 'border-blue-200 hover:border-blue-400', text: 'text-blue-700', iconBg: 'bg-blue-100 text-blue-600', activeRing: 'ring-blue-500' },
  slate: { bg: 'bg-slate-100/70', border: 'border-slate-300 hover:border-slate-400', text: 'text-slate-700', iconBg: 'bg-slate-200 text-slate-700', activeRing: 'ring-slate-500' },
};

export function BrowseLibraryTab({ language = 'en', role = 'teacher', teacherId, classId, subject, grade, forcedMode }: { language?: 'en' | 'ar', role?: string, teacherId?: string, classId?: string, subject?: string, grade?: string, forcedMode?: 'material' | 'my-library' }) {
  const isRtl = language === 'ar';
  
  // State
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [targetClasses, setTargetClasses] = useState<{ id: string; name: string; arName: string }[]>([]);
  const [targetTeachers, setTargetTeachers] = useState<{ id: string; name: string }[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  // material = اللي بيبان للطلاب، my-library = مساحة المعلم الخاصة
  const [libraryMode, setLibraryMode] = useState<'material' | 'my-library'>(forcedMode || (role === 'teacher' ? 'my-library' : 'material'));
  const [isOfficialPickerOpen, setIsOfficialPickerOpen] = useState(false);

  useEffect(() => {
    if (forcedMode) setLibraryMode(forcedMode);
  }, [forcedMode]);

  const scope = teacherId && classId && subject ? { teacherId, classId, subject } : null;
  const requestIdRef = React.useRef(0);

  const refreshLibrary = () => {
    if (!scope) return;
    const thisRequestId = ++requestIdRef.current;
    setIsLoadingLibrary(true);
    const modeAtRequestTime = libraryMode;
    const foldersPromise = modeAtRequestTime === 'material' ? getMaterialFolders(scope) : getMyLibraryFolders(scope);
    const filesPromise = modeAtRequestTime === 'material' ? getMaterialFiles(scope) : getMyLibraryFiles(scope);
    // Material: فصولي أنا بس (لنفس المادة اللي أنا مدرّسها). My Library: أي فصل بيدرّس نفس المادة، مش مقصور عليّا
    const classesPromise = modeAtRequestTime === 'material' ? getTeacherClassNames(scope.teacherId) : getClassesForSubject(scope.subject, scope.classId);
    Promise.all([foldersPromise, filesPromise, classesPromise, getTeachersForSubject(scope.subject, scope.teacherId)]).then(([f, files_, classes, teachers]) => {
      // لو طلب تاني اتبعت بعد ده (مثلًا اتبدّل التاب بسرعة)، تجاهل النتيجة القديمة دي عشان ميحصلش "فلاش" لبيانات غلط
      if (thisRequestId !== requestIdRef.current) return;
      setFolders(f);
      setFiles(files_);
      setTargetClasses(classes.map(c => ({ id: c.id, name: c.name, arName: c.name })));
      setTargetTeachers(teachers);
      setIsLoadingLibrary(false);
    });
  };

  useEffect(() => {
    refreshLibrary();
  }, [scope?.classId, scope?.subject, libraryMode]);
  
  // Modals
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [shareItem, setShareItem] = useState<{ item: LibraryFolder | LibraryFile; isFolder: boolean } | null>(null);
  const [previewFile, setPreviewFile] = useState<LibraryFile | null>(null);

  // Form State
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('indigo');

  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState<LibraryFile['type']>('pdf');
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [uploadTargetFolder, setUploadTargetFolder] = useState<string | null>(currentFolderId);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Share Modal State
  const [selectedTargetLibs, setSelectedTargetLibs] = useState<string[]>([]);
  const [selectedTargetTeachers, setSelectedTargetTeachers] = useState<string[]>([]);
  const [shareSuccessToast, setShareSuccessToast] = useState(false);

  // Active Folder Breadcrumb chain
  const breadcrumbChain = useMemo(() => {
    const chain: LibraryFolder[] = [];
    let curr = currentFolderId;
    while (curr) {
      const f = folders.find(folder => folder.id === curr);
      if (f) {
        chain.unshift(f);
        curr = f.parentId;
      } else {
        break;
      }
    }
    return chain;
  }, [currentFolderId, folders]);

  // Current folder details
  const activeFolder = useMemo(() => {
    return folders.find(f => f.id === currentFolderId) || null;
  }, [currentFolderId, folders]);

  // Filtered Folders in active directory
  const currentFolders = useMemo(() => {
    return folders.filter(f => {
      const matchesDir = searchQuery ? true : f.parentId === currentFolderId;
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || typeFilter === 'folder';
      return matchesDir && matchesSearch && matchesType;
    });
  }, [folders, currentFolderId, searchQuery, typeFilter]);

  // Filtered Files in active directory
  const currentFiles = useMemo(() => {
    return files.filter(f => {
      const matchesDir = searchQuery ? true : f.folderId === currentFolderId;
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' 
        ? true 
        : typeFilter === 'doc' ? ['pdf', 'doc'].includes(f.type)
        : typeFilter === 'media' ? ['image', 'video'].includes(f.type)
        : typeFilter === 'sheet' ? ['sheet', 'slides'].includes(f.type)
        : f.type === typeFilter;
      return matchesDir && matchesSearch && matchesType;
    });
  }, [files, currentFolderId, searchQuery, typeFilter, libraryMode]);

  // Handlers
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !scope) return;

    const id = await createLibraryFolder(scope, {
      parentId: currentFolderId,
      name: newFolderName.trim(),
      color: newFolderColor,
      origin: libraryMode === 'my-library' ? 'my_library' : 'material',
    });

    if (id) {
      refreshLibrary();
      setIsNewFolderOpen(false);
      setNewFolderName('');
      setNewFolderColor('indigo');
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scope) return;
    setUploadError('');
    setIsUploading(true);
    const fname = uploadName.trim() || (uploadFileObj ? uploadFileObj.name : 'Untitled Document');
    
    let detectedType: LibraryFile['type'] = uploadType;
    if (uploadFileObj) {
      const ext = uploadFileObj.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') detectedType = 'pdf';
      else if (['doc', 'docx'].includes(ext || '')) detectedType = 'doc';
      else if (['ppt', 'pptx'].includes(ext || '')) detectedType = 'slides';
      else if (['xls', 'xlsx', 'csv'].includes(ext || '')) detectedType = 'sheet';
      else if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) detectedType = 'image';
      else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) detectedType = 'video';
      else if (['zip', 'rar', '7z', 'tar'].includes(ext || '')) detectedType = 'archive';
    }

    const { id, error } = await uploadLibraryFile(scope, {
      folderId: uploadTargetFolder,
      name: fname,
      type: detectedType,
      author: role === 'teacher' ? 'You (Teacher)' : 'Student',
      file: uploadFileObj,
      origin: libraryMode === 'my-library' ? 'my_library' : 'material',
    });

    setIsUploading(false);
    if (id) {
      refreshLibrary();
      setIsUploadOpen(false);
      setUploadName('');
      setUploadFileObj(null);
    } else {
      setUploadError(error || (isRtl ? 'حصل خطأ أثناء الرفع.' : 'Upload failed.'));
    }
  };

  const toggleFolderPrivacy = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const folder = folders.find(f => f.id === id);
    if (!folder) return;
    setFolders(prev => prev.map(f => f.id === id ? { ...f, isPublic: !f.isPublic } : f));
    await toggleFolderPrivacyReal(id, !folder.isPublic);
  };

  const toggleFilePrivacy = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const file = files.find(f => f.id === id);
    if (!file) return;
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isPublic: !f.isPublic } : f));
    await toggleFilePrivacyReal(id, !file.isPublic);
  };

  const deleteFolder = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(isRtl ? 'هل أنت تأكد من حذف هذا المجلد وجميع محتوياته؟' : 'Are you sure you want to delete this folder and its content?')) {
      const { ok } = await deleteLibraryFolder(id);
      if (ok) refreshLibrary();
    }
  };

  const deleteFile = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(isRtl ? 'هل أنت تأكد من حذف هذا الملف؟' : 'Are you sure you want to delete this file?')) {
      const file = files.find(f => f.id === id);
      const { ok } = await deleteLibraryFile(id, file?.storagePath || null);
      if (ok) refreshLibrary();
    }
  };

  const openShareModal = (item: LibraryFolder | LibraryFile, isFolder: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShareItem({ item, isFolder });
    setSelectedTargetLibs(item.sharedWithClasses || []);
    setSelectedTargetTeachers(item.sharedWithTeachers || []);
  };

  const handleSaveShare = async () => {
    if (!shareItem) return;
    const { item, isFolder } = shareItem;
    const { ok } = isFolder
      ? await updateFolderSharing(item.id, selectedTargetLibs, selectedTargetTeachers)
      : await updateFileSharing(item.id, selectedTargetLibs, selectedTargetTeachers);
    if (ok) {
      refreshLibrary();
      setShareSuccessToast(true);
      setTimeout(() => {
        setShareSuccessToast(false);
        setShareItem(null);
      }, 1200);
    }
  };

  const toggleFolderInMaterial = async (folder: LibraryFolder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const { ok } = folder.inMaterial ? await removeFolderFromMaterial(folder.id) : await addFolderToMaterial(folder.id);
    if (ok) refreshLibrary();
  };

  const toggleFileInMaterial = async (file: LibraryFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const { ok } = file.inMaterial ? await removeFileFromMaterial(file.id) : await addFileToMaterial(file.id);
    if (ok) refreshLibrary();
  };

  const renderFileIcon = (type: LibraryFile['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="text-rose-500 shrink-0" size={20} />;
      case 'doc': return <FileText className="text-blue-500 shrink-0" size={20} />;
      case 'slides': return <Film className="text-amber-500 shrink-0" size={20} />;
      case 'sheet': return <FileSpreadsheet className="text-emerald-500 shrink-0" size={20} />;
      case 'image': return <ImageIcon className="text-purple-500 shrink-0" size={20} />;
      case 'video': return <Video className="text-rose-600 shrink-0" size={20} />;
      case 'archive': return <FileArchive className="text-cyan-600 shrink-0" size={20} />;
      default: return <File className="text-slate-500 shrink-0" size={20} />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col h-full bg-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Notification Toast */}
      <AnimatePresence>
        {shareSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <ShieldCheck className="text-emerald-400" size={18} />
            {isRtl ? 'تم تحديث مشاركة المجلد/الملف بنجاح!' : 'Library folder/file shared successfully!'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Folder Modal */}
      <AnimatePresence>
        {isNewFolderOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4">
            <motion.form onSubmit={handleCreateFolder} initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <FolderPlus className="text-indigo-600" size={20} />
                  <h3 className="font-bold text-lg text-slate-900">{isRtl ? 'إنشاء مجلد جديد' : 'Create New Folder'}</h3>
                </div>
                <button type="button" onClick={() => setIsNewFolderOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
              </div>

              <label className="block text-xs font-bold text-slate-500 mb-1.5">{isRtl ? 'اسم المجلد' : 'Folder Title'}</label>
              <input autoFocus type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder={isRtl ? 'مثال: أوراق الفصل الأول' : 'e.g. Chapter 1 Handouts'} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 mb-5" />

              <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5"><Palette size={13} /> {isRtl ? 'لون المجلد' : 'Folder Color Theme'}</label>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {Object.keys(colorThemeMap).map((c) => (
                  <button type="button" key={c} onClick={() => setNewFolderColor(c)} className={`px-2 py-2.5 rounded-xl border text-xs font-bold capitalize flex items-center justify-center gap-1.5 ${newFolderColor === c ? `ring-2 ${colorThemeMap[c].activeRing} ${colorThemeMap[c].bg} ${colorThemeMap[c].text}` : 'border-slate-200 text-slate-500'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${colorThemeMap[c].iconBg}`} />
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsNewFolderOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm">{isRtl ? 'إنشاء المجلد' : 'Create Folder'}</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload File Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4">
            <motion.form onSubmit={handleUploadFile} initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <Upload className="text-indigo-600" size={20} />
                  <h3 className="font-bold text-lg text-slate-900">{isRtl ? 'رفع ملف للمكتبة' : 'Upload File to Library'}</h3>
                </div>
                <button type="button" onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
              </div>

              <label className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors block mb-5">
                <Upload className="mx-auto text-indigo-500 mb-3" size={26} />
                <p className="font-bold text-sm text-slate-800">{isRtl ? 'اضغط لاختيار ملف أو اسحبه هنا' : 'Click to browse or drag file here'}</p>
                <p className="text-[11px] text-slate-400 mt-1">{isRtl ? 'كل الصيغ متاحة: PDF, DOCX, PPTX, XLSX, صور, فيديو' : 'Supports all file formats: PDF, DOCX, PPTX, XLSX, Images, Video'}</p>
                <input type="file" className="hidden" onChange={(e) => setUploadFileObj(e.target.files?.[0] || null)} />
              </label>
              {uploadFileObj && <p className="text-xs text-slate-500 -mt-3 mb-4">{uploadFileObj.name}</p>}

              <label className="block text-xs font-bold text-slate-500 mb-1.5">{isRtl ? 'اسم الملف' : 'Document Title'}</label>
              <input type="text" value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder={isRtl ? 'اسم الملف اللي هيظهر' : 'File display title...'} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 mb-5" />

              <label className="block text-xs font-bold text-slate-500 mb-1.5">{isRtl ? 'المجلد الهدف' : 'Destination Folder'}</label>
              <select value={uploadTargetFolder || ''} onChange={(e) => setUploadTargetFolder(e.target.value || null)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white mb-5">
                <option value="">{isRtl ? 'المكتبة الرئيسية (بدون مجلد)' : 'Root Library (No Folder)'}</option>
                {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>

              {uploadError && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mb-4">{uploadError}</p>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsUploadOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" disabled={isUploading} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-60">{isUploading ? (isRtl ? 'جاري الرفع...' : 'Uploading...') : (isRtl ? 'رفع الملف' : 'Upload Document')}</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <Share2 className="text-indigo-600" size={20} />
                  <h3 className="font-bold text-lg text-slate-900">{isRtl ? 'مشاركة' : 'Share'}</h3>
                </div>
                <button onClick={() => setShareItem(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 mb-5">
                {shareItem.isFolder ? <Folder className={colorThemeMap[(shareItem.item as LibraryFolder).color]?.text} size={20} /> : renderFileIcon((shareItem.item as LibraryFile).type)}
                <div>
                  <p className="font-bold text-sm text-slate-800">{shareItem.item.name}</p>
                  <p className="text-[11px] text-slate-400">{shareItem.isFolder ? (isRtl ? 'مجلد' : 'Library Folder') : (isRtl ? 'ملف' : 'File')}</p>
                </div>
              </div>

              {libraryMode === 'material' ? (
                <>
                  <label className="block text-xs font-bold text-slate-500 mb-2">{isRtl ? 'شارك مع فصولي (لنفس المادة)' : 'Share with my classes (same subject)'}</label>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto mb-2">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50">
                      <input type="checkbox" checked={targetClasses.length > 0 && targetClasses.every((c) => selectedTargetLibs.includes(c.id))} onChange={(e) => setSelectedTargetLibs(e.target.checked ? targetClasses.map((c) => c.id) : [])} className="accent-indigo-600" />
                      <span className="text-xs font-bold text-slate-700">{isRtl ? 'كل فصولي' : 'All my classes'}</span>
                    </label>
                    {targetClasses.map((c) => (
                      <label key={c.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50">
                        <span className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                          <input type="checkbox" checked={selectedTargetLibs.includes(c.id)} onChange={() => setSelectedTargetLibs((prev) => prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id])} className="accent-indigo-600" />
                          {isRtl ? c.arName : c.name}
                        </span>
                      </label>
                    ))}
                    {targetClasses.length === 0 && <p className="text-xs text-slate-400 py-2">{isRtl ? 'مفيش فصول تانية عندك لسه.' : 'No other classes yet.'}</p>}
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-xs font-bold text-slate-500 mb-2">{isRtl ? 'شارك مع فصول (لنفس المادة)' : 'Share with classes (same subject)'}</label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto mb-4">
                    {targetClasses.map((c) => (
                      <label key={c.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50">
                        <span className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                          <input type="checkbox" checked={selectedTargetLibs.includes(c.id)} onChange={() => setSelectedTargetLibs((prev) => prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id])} className="accent-indigo-600" />
                          {isRtl ? c.arName : c.name}
                        </span>
                      </label>
                    ))}
                    {targetClasses.length === 0 && <p className="text-xs text-slate-400 py-2">{isRtl ? 'مفيش فصول تانية بتدرّس نفس المادة لسه.' : 'No other classes teaching this subject yet.'}</p>}
                  </div>

                  <label className="block text-xs font-bold text-slate-500 mb-2">{isRtl ? 'شارك مع معلمين (نفس المادة)' : 'Share with Teachers (same subject)'}</label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto mb-2">
                    {targetTeachers.map((t) => (
                      <label key={t.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50">
                        <span className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                          <input type="checkbox" checked={selectedTargetTeachers.includes(t.id)} onChange={() => setSelectedTargetTeachers((prev) => prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id])} className="accent-indigo-600" />
                          {t.name}
                        </span>
                      </label>
                    ))}
                    {targetTeachers.length === 0 && <p className="text-xs text-slate-400 py-2">{isRtl ? 'مفيش معلمين تانيين بيدرّسوا نفس المادة لسه.' : 'No other teachers of this subject yet.'}</p>}
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setShareItem(null)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleSaveShare} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm">{isRtl ? 'حفظ المشاركة' : 'Save & Update Sharing'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* من المكتبة الرسمية — نفس تصميم الـ Drawer الجانبي المستخدم في Learning Path بالظبط */}
      <LibraryDrawer
        isOpen={isOfficialPickerOpen}
        onClose={() => setIsOfficialPickerOpen(false)}
        targetUnitTitle={isRtl ? 'المادة' : 'Material'}
        language={language}
        grade={grade}
        subject={subject}
        teacherId={teacherId}
        classId={classId}
        onInject={async (items: any[]) => {
          if (!scope) return;
          for (const item of items) {
            await addOfficialResourceToMaterial(scope, { title: item.title, type: item.type, url: item.url || '' });
          }
          refreshLibrary();
        }}
      />
      <div className="flex flex-col gap-2.5 mb-3">
        {role === 'teacher' && !forcedMode && (
          <div className="flex gap-2">
            <button onClick={() => setLibraryMode('material')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${libraryMode === 'material' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Globe size={13} /> {isRtl ? 'Material (يشوفها الطلاب)' : 'Material (students see this)'}
            </button>
            <button onClick={() => setLibraryMode('my-library')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${libraryMode === 'my-library' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Lock size={13} /> {isRtl ? 'My Library (خاص بيك بس)' : 'My Library (private to you)'}
            </button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {libraryMode === 'material' ? (isRtl ? 'Material' : 'Material') : (isRtl ? 'مكتبتي' : 'My Library')}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {currentFolders.length} {isRtl ? 'مجلدات' : 'folders'} • {currentFiles.length} {isRtl ? 'ملفات' : 'files'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {libraryMode === 'material' && role === 'teacher' && (
              <button
                onClick={() => setIsOfficialPickerOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-indigo-200"
              >
                <Book size={16} />
                <span>{isRtl ? 'من المكتبة الرسمية' : 'From Official Library'}</span>
              </button>
            )}
            <button
              onClick={() => { setIsNewFolderOpen(true); }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200"
            >
              <FolderPlus size={16} className="text-indigo-600" />
              <span>{isRtl ? 'مجلد جديد' : 'New Folder'}</span>
            </button>

            <button
              onClick={() => {
                setUploadTargetFolder(currentFolderId);
                setIsUploadOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Upload size={16} />
              <span>{isRtl ? 'رفع ملفات' : 'Upload File'}</span>
            </button>
          </div>
        </div>

        {/* Search, Filters & View Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={isRtl ? 'البحث في المجلدات والملفات...' : 'Search folders and files...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {[
              { id: 'all', label: isRtl ? 'الكل' : 'All' },
              { id: 'folder', label: isRtl ? 'المجلدات' : 'Folders' },
              { id: 'doc', label: isRtl ? 'المستندات' : 'Docs & PDFs' },
              { id: 'media', label: isRtl ? 'وسائط' : 'Images & Video' },
              { id: 'sheet', label: isRtl ? 'جداول وعروض' : 'Sheets & Slides' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  typeFilter === f.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shrink-0 self-end md:self-auto">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
              title={isRtl ? 'عرض شبكي' : 'Grid View'}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
              title={isRtl ? 'عرض قائمة' : 'List View'}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Breadcrumb Trail */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
            <button 
              onClick={() => setCurrentFolderId(null)}
              className={`flex items-center gap-1 hover:text-indigo-600 transition-colors ${currentFolderId === null ? 'font-bold text-slate-900' : 'text-slate-500'}`}
            >
              <Folder size={14} className="text-indigo-500" />
              <span>{libraryMode === 'material' ? (isRtl ? 'المحتوى' : 'Material') : (isRtl ? 'المكتبة الرئيسية' : 'My Library')}</span>
            </button>

            {breadcrumbChain.map((crumb) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight size={12} className="text-slate-300 shrink-0" />
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className={`hover:text-indigo-600 transition-colors whitespace-nowrap ${currentFolderId === crumb.id ? 'font-bold text-slate-900' : 'text-slate-500'}`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {currentFolderId && (
            <button
              onClick={() => setCurrentFolderId(activeFolder?.parentId || null)}
              className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors font-semibold shrink-0"
            >
              <ArrowLeft size={14} />
              <span>{isRtl ? 'رجوع' : 'Back'}</span>
            </button>
          )}
        </div>
      </div>

      {/* File & Folder Grid / List Display */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-12 custom-scrollbar pr-1">
        {isLoadingLibrary ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p className="text-sm font-medium">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        ) : currentFolders.length === 0 && currentFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-xs">
              <FolderPlus size={28} className="text-indigo-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              {searchQuery ? (isRtl ? 'لا توجد نتائج بحث' : 'No matching items') : (isRtl ? 'المجلد فارغ' : 'This folder is empty')}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              {searchQuery ? (isRtl ? 'لم نتمكن من العثور على أي ملفات.' : 'Try adjusting your search terms.') : (isRtl ? 'يمكنك إنشاء مجلد جديد.' : 'Start by creating a folder or uploading course files.')}
            </p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="space-y-8">
              {/* Folder Cards */}
              {currentFolders.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Folder size={14} />
                    <span>{isRtl ? 'المجلدات' : 'Folders'} ({currentFolders.length})</span>
                  </h2>
                  {libraryMode === 'material' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {currentFolders.map((folder) => {
                        const theme = colorThemeMap[folder.color] || colorThemeMap.indigo;
                        const folderFilesCount = files.filter(f => f.folderId === folder.id).length;
                        return (
                          <div
                            key={folder.id}
                            onClick={() => setCurrentFolderId(folder.id)}
                            className="group relative p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col items-center text-center gap-2"
                          >
                            <Folder size={44} className={theme.text} fill="currentColor" fillOpacity={0.15} strokeWidth={1.5} />
                            <div className="min-w-0 w-full">
                              <h3 className="font-bold text-sm text-slate-800 truncate">{folder.name}</h3>
                              <p className="text-[11px] text-slate-400">{folderFilesCount} {isRtl ? 'عنصر' : 'items'}</p>
                            </div>

                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button onClick={(e) => toggleFolderPrivacy(folder.id, e)} className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-slate-800">
                                {folder.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                              </button>
                              <button onClick={(e) => openShareModal(folder, true, e)} className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600">
                                <Share2 size={12} />
                              </button>
                              <button onClick={(e) => deleteFolder(folder.id, e)} className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-rose-600">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentFolders.map((folder) => {
                        const theme = colorThemeMap[folder.color] || colorThemeMap.indigo;
                        const folderFilesCount = files.filter(f => f.folderId === folder.id).length;
                        return (
                          <div
                            key={folder.id}
                            onClick={() => setCurrentFolderId(folder.id)}
                            className={`group relative p-5 rounded-2xl border ${theme.border} ${theme.bg} transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between h-[180px]`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${theme.iconBg} shadow-xs`}>
                                  <Folder size={26} />
                                </div>
                                <div className="min-w-0">
                                  <h3 className={`font-bold text-base ${theme.text} truncate`}>{folder.name}</h3>
                                  <p className="text-xs text-slate-400 font-medium mt-0.5">{folderFilesCount} items</p>
                                </div>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-black/5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                              <div className="flex items-center gap-1.5">
                                <button onClick={(e) => toggleFolderPrivacy(folder.id, e)} className="p-1 rounded-md transition-colors bg-slate-200/80 hover:bg-slate-300">
                                  {folder.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                                </button>
                                <span>Created {folder.createdAt}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => toggleFolderInMaterial(folder, e)}
                                  title={folder.inMaterial ? (isRtl ? 'موجود في Material' : 'In Material') : (isRtl ? 'إضافة لـ Material' : 'Add to Material')}
                                  className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 ${folder.inMaterial ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/80 text-slate-600 hover:bg-slate-300'}`}
                                >
                                  <Book size={11} /> {folder.inMaterial ? (isRtl ? 'في Material' : 'In Material') : (isRtl ? 'أضف لـ Material' : 'Add to Material')}
                                </button>
                                <button onClick={(e) => openShareModal(folder, true, e)} className="p-1 text-slate-500 hover:text-indigo-600 rounded-md">
                                  <Share2 size={13} />
                                </button>
                                <button onClick={(e) => deleteFolder(folder.id, e)} className="p-1 text-slate-400 hover:text-rose-600 rounded-md">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
              )}

              {/* File Cards */}
              {currentFiles.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText size={14} />
                    <span>{isRtl ? 'الملفات والمستندات' : 'Files & Documents'} ({currentFiles.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentFiles.map((file) => (
                      <div key={file.id} className="group bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between h-[150px]">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                              {renderFileIcon(file.type)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{file.name}</h3>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{file.size} • {file.author}</p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          {libraryMode === 'my-library' ? (
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => toggleFilePrivacy(file.id, e)} title={isRtl ? 'يبان لزميلك المعلم' : 'Visible to co-teacher'} className="p-1 px-2 rounded-md text-[10px] font-bold flex items-center gap-1 bg-slate-100">
                                {file.isPublic ? <Globe size={11} /> : <Lock size={11} />}
                              </button>
                              <button
                                onClick={(e) => toggleFileInMaterial(file, e)}
                                title={file.inMaterial ? (isRtl ? 'موجود في Material' : 'In Material') : (isRtl ? 'إضافة لـ Material' : 'Add to Material')}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 ${file.inMaterial ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                              >
                                <Book size={11} /> {file.inMaterial ? (isRtl ? 'في Material' : 'In Material') : (isRtl ? 'أضف لـ Material' : 'Add to Material')}
                              </button>
                            </div>
                          ) : <span />}
                          <div className="flex items-center gap-1">
                            <button onClick={() => file.storagePath ? window.open(getLibraryFileDownloadUrl(file.storagePath), '_blank') : setPreviewFile(file)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg">
                              <Eye size={14} />
                            </button>
                            <button onClick={(e) => openShareModal(file, false, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg">
                              <Share2 size={14} />
                            </button>
                            <button onClick={(e) => deleteFile(file.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tabular List View */
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse" dir={isRtl ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">Type / Size</th>
                    <th className="px-5 py-3.5 hidden md:table-cell">Date Created</th>
                    <th className="px-5 py-3.5">Privacy</th>
                    <th className="px-5 py-3.5 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {currentFolders.map((folder) => {
                    const folderFilesCount = files.filter(f => f.folderId === folder.id).length;
                    return (
                    <tr key={folder.id} onClick={() => setCurrentFolderId(folder.id)} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Folder size={16} />
                          </div>
                          <span className="font-bold text-slate-800">{folder.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 uppercase hidden sm:table-cell">{isRtl ? `${folderFilesCount} عنصر` : `${folderFilesCount} items`}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{folder.createdAt}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold">{folder.isPublic ? 'Public' : 'Private'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => openShareModal(folder, true, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"><Share2 size={14} /></button>
                          <button onClick={(e) => deleteFolder(folder.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {currentFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            {renderFileIcon(file.type)}
                          </div>
                          <span className="font-bold text-slate-800">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 uppercase hidden sm:table-cell">{file.type} • {file.size}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{file.createdAt}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold">{file.isPublic ? 'Public' : 'Private'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => file.storagePath ? window.open(getLibraryFileDownloadUrl(file.storagePath), '_blank') : setPreviewFile(file)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"><Eye size={14} /></button>
                          <button onClick={(e) => deleteFile(file.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <AnimatePresence>
        {previewFile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setPreviewFile(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl p-6 w-[420px] max-w-full shadow-none border border-slate-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-base font-bold text-slate-800">{previewFile.name}</h3>
                <button onClick={() => setPreviewFile(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center gap-3 text-slate-400">
                <FileText size={40} />
                <p className="text-sm font-medium">{isRtl ? 'مفيش معاينة حية متاحة لهذا الملف' : 'No live preview available for this file'}</p>
              </div>
              <div className="mt-4 text-xs text-slate-500 space-y-1">
                <p>{isRtl ? 'النوع:' : 'Type:'} {previewFile.type.toUpperCase()}</p>
                <p>{isRtl ? 'الحجم:' : 'Size:'} {previewFile.size}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}