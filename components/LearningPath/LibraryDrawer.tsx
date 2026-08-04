'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Search, FileText, PlayCircle, BrainCircuit, Plus, Check, Calendar, Layers } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface LibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetUnitTitle: string;
}

export function LibraryDrawer({ isOpen, onClose, targetUnitTitle }: LibraryDrawerProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'unit' | 'week'>('unit');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const libraryItems = [
    { id: 'lib1', title: 'Matrices in Real World Applications', type: 'video', week: 'Week 1', unit: 'Unit 1', tags: ['Core'] },
    { id: 'lib2', title: 'Determinants Calculation Guide', type: 'pdf', week: 'Week 1', unit: 'Unit 1', tags: ['Reference'] },
    { id: 'lib3', title: 'Practice Set: Matrix Multiplication', type: 'quiz', week: 'Week 2', unit: 'Unit 1', tags: ['Assessment'] },
    { id: 'lib4', title: 'Vector Spaces Overview', type: 'video', week: 'Week 3', unit: 'Unit 2', tags: ['Core'] },
    { id: 'lib5', title: 'Linear Independence Worksheet', type: 'pdf', week: 'Week 3', unit: 'Unit 2', tags: ['Reference'] },
  ];

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredItems = libraryItems.filter(item => {
    if (activeTab === 'unit') {
      // Simple filter logic for demo - in real app would match selected unit context
      return true; 
    }
    return true;
  });

  // Group items for display
  const groupedItems = filteredItems.reduce((acc, item) => {
    const key = activeTab === 'unit' ? item.unit : item.week;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof libraryItems>);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-[100] overflow-y-auto flex flex-col border-l border-slate-100"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Official Curriculum Library</h3>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search resources..." 
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all"
                />
              </div>

              {/* Tabs */}
              <div className="flex p-1 bg-slate-200/50 rounded-xl">
                <button
                  onClick={() => setActiveTab('unit')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2
                    ${activeTab === 'unit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Layers size={14} /> By Unit
                </button>
                <button
                  onClick={() => setActiveTab('week')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2
                    ${activeTab === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Calendar size={14} /> By Academic Week
                </button>
              </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
              {Object.entries(groupedItems).map(([groupTitle, items]) => (
                <div key={groupTitle}>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">{groupTitle}</h4>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const isSelected = selectedItems.includes(item.id);
                      return (
                        <div 
                          key={item.id}
                          onClick={() => toggleSelection(item.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 group relative overflow-hidden
                            ${isSelected 
                              ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                              : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-start gap-3 relative z-10">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                              ${item.type === 'video' ? 'bg-red-50 text-red-500' :
                                item.type === 'pdf' ? 'bg-blue-50 text-blue-500' :
                                'bg-purple-50 text-purple-500'
                              }`}
                            >
                              {item.type === 'video' ? <PlayCircle size={20} /> :
                               item.type === 'pdf' ? <FileText size={20} /> :
                               <BrainCircuit size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-sm truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                {item.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex gap-1">
                                  {item.tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                              ${isSelected 
                                ? 'bg-indigo-500 border-indigo-500 text-white' 
                                : 'border-slate-200 text-transparent group-hover:border-indigo-300'
                              }`}
                            >
                              <Check size={14} strokeWidth={3} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-10">
              <button 
                disabled={selectedItems.length === 0}
                onClick={onClose}
                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg
                  ${selectedItems.length > 0 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
              >
                <Plus size={20} />
                {selectedItems.length > 0 
                  ? `Inject ${selectedItems.length} items` 
                  : 'Select items to inject'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
