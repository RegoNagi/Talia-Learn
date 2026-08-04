'use client';
import { motion } from 'motion/react';
import { X, Calendar, Clock, Video, Users, Link as LinkIcon, Save } from 'lucide-react';
import { useState } from 'react';

interface ScheduleSessionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ar' | 'en';
}

export function ScheduleSessionPopup({ isOpen, onClose, language }: ScheduleSessionPopupProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [platform, setPlatform] = useState('Google Meet');

  if (!isOpen) return null;

  const isRtl = language === 'ar';

  const handleSave = () => {
    // Just close for now
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Video size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              {isRtl ? 'إنشاء جلسة أونلاين' : 'Schedule Online Session'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-200/50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              {isRtl ? 'عنوان الجلسة' : 'Session Title'}
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isRtl ? 'مثال: مراجعة الوحدة الأولى' : 'e.g. Chapter 1 Review'}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                {isRtl ? 'التاريخ' : 'Date'}
              </label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all text-sm text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400" />
                {isRtl ? 'الوقت' : 'Time'}
              </label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all text-sm text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <LinkIcon size={14} className="text-slate-400" />
              {isRtl ? 'المنصة' : 'Platform'}
            </label>
            <div className="flex gap-2">
              {['Google Meet', 'Zoom', 'Microsoft Teams'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${platform === p ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            {isRtl ? 'إنشاء' : 'Schedule'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
