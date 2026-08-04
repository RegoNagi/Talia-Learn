'use client';

import { Plus, Wand2, FileText, PenTool, Video } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ActionItem {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick?: () => void;
}

interface MagicButtonProps {
  actions?: ActionItem[];
}

export function MagicButton({ actions }: MagicButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Default actions if none provided
  const defaultActions: ActionItem[] = [
    { icon: <Wand2 size={20} />, label: "AI Generate Quiz", color: "bg-purple-500" },
    { icon: <FileText size={20} />, label: "New Assignment", color: "bg-blue-500" },
    { icon: <Video size={20} />, label: "Live Session", color: "bg-red-500" },
    { icon: <PenTool size={20} />, label: "Create Post", color: "bg-emerald-500" },
  ];

  const currentActions = actions || defaultActions;

  return (
    <div className="fixed bottom-8 right-8 z-30">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 mb-2 flex flex-col gap-2 items-end"
          >
            {currentActions.map((action, index) => (
              <ActionButton key={index} {...action} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95
          ${isOpen ? 'bg-slate-800 rotate-45' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}
        `}
      >
        <Plus size={28} />
      </button>
    </div>
  );
}

function ActionButton({ icon, label, color, onClick }: ActionItem) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 group">
      <span className="bg-white text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
      <div className={`${color} w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110`}>
        {icon}
      </div>
    </button>
  );
}
