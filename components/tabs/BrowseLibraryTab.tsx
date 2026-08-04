import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Download, Upload, FileText, Filter, Plus, File, ExternalLink, X, Book, FileArchive, LayoutGrid, List } from 'lucide-react';

interface LibraryDocument {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'slides';
  size: string;
  dateAdded: string;
  category: 'material' | 'past-papers';
  author: string;
}

const mockDocuments: LibraryDocument[] = [
  { id: '1', title: 'Chapter 1: Matrices Introduction', type: 'pdf', size: '2.4 MB', dateAdded: '2023-09-01', category: 'material', author: 'Dr. Smith' },
  { id: '2', title: 'Chapter 2: Vector Spaces', type: 'pdf', size: '3.1 MB', dateAdded: '2023-09-15', category: 'material', author: 'Dr. Smith' },
  { id: '3', title: 'Midterm 2022 Solutions', type: 'pdf', size: '1.2 MB', dateAdded: '2022-10-20', category: 'past-papers', author: 'Dept of Math' },
  { id: '4', title: 'Final Exam 2021', type: 'pdf', size: '1.5 MB', dateAdded: '2021-12-10', category: 'past-papers', author: 'Dept of Math' },
  { id: '5', title: 'Linear Transformations Notes', type: 'pdf', size: '4.0 MB', dateAdded: '2023-10-05', category: 'material', author: 'Dr. Smith' },
];

export function BrowseLibraryTab({ language = 'en', role = 'teacher' }: { language?: 'en' | 'ar', role?: string }) {
  const isRtl = language === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<'material' | 'past-papers'>('material');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<LibraryDocument[]>(mockDocuments);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const filteredDocs = documents.filter(doc => 
    doc.category === activeSubTab && 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle) return;
    
    const newDoc: LibraryDocument = {
      id: Math.random().toString(36).substr(2, 9),
      title: uploadTitle,
      type: 'pdf', // Mocked as PDF for demo
      size: uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB',
      dateAdded: new Date().toISOString().split('T')[0],
      category: activeSubTab,
      author: role === 'teacher' ? 'You' : 'Student',
    };
    
    setDocuments([newDoc, ...documents]);
    setIsUploadModalOpen(false);
    setUploadTitle('');
    setUploadFile(null);
  };

  const downloadFile = (doc: LibraryDocument) => {
    alert(isRtl ? `جاري تحميل ${doc.title}...` : `Downloading ${doc.title}...`);
  };

  const openFile = (doc: LibraryDocument) => {
    alert(isRtl ? `جاري فتح ${doc.title}...` : `Opening ${doc.title}...`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex border-b border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('material')}
            className={`px-6 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeSubTab === 'material' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            <Book size={18} />
            {isRtl ? 'المحتوى' : 'Content'}
          </button>
          <button
            onClick={() => setActiveSubTab('past-papers')}
            className={`px-6 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeSubTab === 'past-papers' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            <FileArchive size={18} />
            {isRtl ? 'اختبارات سابقة' : 'Past Papers'}
          </button>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:min-w-[250px]">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={isRtl ? 'ابحث في المكتبة...' : 'Search library...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          
          <div className="flex bg-slate-100 rounded-xl p-1 shrink-0">
             <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <LayoutGrid size={18} />
             </button>
             <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <List size={18} />
             </button>
          </div>
          
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 shadow-sm"
          >
            <Upload size={18} />
            <span className="hidden sm:inline">{isRtl ? 'رفع ملف' : 'Upload'}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-10 custom-scrollbar pr-2">
        {filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
               <FileText size={24} />
             </div>
             <h3 className="text-lg font-bold text-slate-700 mb-1">{isRtl ? 'لا توجد ملفات' : 'No files found'}</h3>
             <p className="text-sm text-slate-500 text-center max-w-sm">
               {isRtl ? 'لم يتم العثور على ملفات تطابق بحثك. يمكنك رفع ملف جديد.' : 'We could not find any files matching your search. You can upload a new file.'}
             </p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 transition-all shadow-sm group flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      doc.category === 'material' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {doc.category === 'material' ? <Book size={24} /> : <FileArchive size={24} />}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => downloadFile(doc)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title={isRtl ? 'تحميل' : 'Download'}>
                        <Download size={16} />
                      </button>
                      <button onClick={() => openFile(doc)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title={isRtl ? 'فتح' : 'Open'}>
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 line-clamp-2 mb-1">{doc.title}</h3>
                  <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate max-w-[120px]">{doc.author}</span>
                    <div className="flex items-center gap-2">
                       <span>{doc.size}</span>
                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                       <span>{new Date(doc.dateAdded).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
               <table className="w-full text-left border-collapse" dir={isRtl ? 'rtl' : 'ltr'}>
                 <thead>
                   <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                     <th className="px-6 py-4">{isRtl ? 'الاسم' : 'Name'}</th>
                     <th className="px-6 py-4 hidden sm:table-cell">{isRtl ? 'الحجم' : 'Size'}</th>
                     <th className="px-6 py-4 hidden md:table-cell">{isRtl ? 'المؤلف' : 'Author'}</th>
                     <th className="px-6 py-4 hidden sm:table-cell">{isRtl ? 'تاريخ الإضافة' : 'Date Added'}</th>
                     <th className="px-6 py-4 text-end">{isRtl ? 'إجراءات' : 'Actions'}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredDocs.map(doc => (
                     <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                             doc.category === 'material' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                           }`}>
                             {doc.category === 'material' ? <Book size={16} /> : <FileArchive size={16} />}
                           </div>
                           <span className="font-bold text-sm text-slate-800 line-clamp-1">{doc.title}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{doc.size}</td>
                       <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{doc.author}</td>
                       <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{new Date(doc.dateAdded).toLocaleDateString()}</td>
                       <td className="px-6 py-4 text-end">
                         <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => openFile(doc)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title={isRtl ? 'فتح' : 'Open'}>
                             <ExternalLink size={16} />
                           </button>
                           <button onClick={() => downloadFile(doc)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title={isRtl ? 'تحميل' : 'Download'}>
                             <Download size={16} />
                           </button>
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

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsUploadModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                 <h2 className="text-lg font-bold text-slate-900">
                   {isRtl ? 'رفع ملف جديد' : 'Upload New File'}
                 </h2>
                 <button 
                   onClick={() => setIsUploadModalOpen(false)} 
                   className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full p-1.5 transition-colors"
                 >
                   <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={handleUpload} className="p-6">
                 <div className="mb-5">
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">
                     {isRtl ? 'اسم الملف' : 'File Name'}
                   </label>
                   <input 
                     type="text" 
                     value={uploadTitle}
                     onChange={(e) => setUploadTitle(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
                     placeholder={isRtl ? 'أدخل اسم الملف...' : 'Enter file name...'}
                     required
                   />
                 </div>
                 
                 <div className="mb-6">
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">
                     {isRtl ? 'الملف' : 'File'}
                   </label>
                   <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer relative overflow-hidden">
                     <input 
                       type="file" 
                       onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                       className="absolute inset-0 opacity-0 cursor-pointer"
                       accept=".pdf,.doc,.docx,.ppt,.pptx"
                     />
                     <Upload className="text-indigo-400 mb-2" size={24} />
                     <p className="text-sm font-bold text-slate-700 mb-1">
                       {uploadFile ? uploadFile.name : (isRtl ? 'اختر ملفاً أو اسحبه هنا' : 'Choose a file or drag it here')}
                     </p>
                     <p className="text-xs text-slate-500">
                       {isRtl ? 'PDF, DOC, PPT حتى 50 ميغابايت' : 'PDF, DOC, PPT up to 50MB'}
                     </p>
                   </div>
                 </div>
                 
                 <div className="flex items-center justify-end gap-3 pt-2">
                   <button 
                     type="button"
                     onClick={() => setIsUploadModalOpen(false)}
                     className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                   >
                     {isRtl ? 'إلغاء' : 'Cancel'}
                   </button>
                   <button 
                     type="submit"
                     disabled={!uploadTitle}
                     className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
                   >
                     {isRtl ? 'رفع الملف' : 'Upload File'}
                   </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
