import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const dict = {
  ar: {
    month: 'أكتوبر 2023',
    dayView: 'يوم',
    monthView: 'شهر',
    termView: 'ترم',
    gradeLabel: 'الصف',
    classLabel: 'الفصل',
    all: 'الكل',
    standardClasses: 'حصص دراسية',
    liveSessions: 'بث مباشر',
    events: 'أحداث وفعاليات',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
  },
  en: {
    month: 'October 2023',
    dayView: 'Day',
    monthView: 'Month',
    termView: 'Term',
    gradeLabel: 'Grade',
    classLabel: 'Class',
    all: 'All',
    standardClasses: 'Standard Classes',
    liveSessions: 'Live Sessions',
    events: 'Events',
    sunday: 'Sun',
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
  }
};

function FlatDropdown({ label, options, value, onChange, language }: { label: string, options: string[], value: string, onChange: (val: string) => void, language: 'ar' | 'en' }) {
  const [isOpen, setIsOpen] = useState(false);
  const isRtl = language === 'ar';

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-500">{label}:</span>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-none w-28"
        >
          <span className="truncate">{value}</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
            className={`absolute top-full mt-1 bg-white border border-gray-100 rounded-lg z-20 py-1 shadow-none w-32 ${isRtl ? 'right-0' : 'left-0'}`}
          >
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 font-bold"
              >
                <span>{opt}</span>
                {value === opt && <Check size={14} className="text-orange-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EducationalCalendar({ language = 'ar' }: { language?: 'ar' | 'en' }) {
  const t = dict[language];
  const isRtl = language === 'ar';
  
  const [activeView, setActiveView] = useState<'day' | 'month' | 'term'>('month');
  const [grade, setGrade] = useState(t.all);
  const [classFilter, setClassFilter] = useState(t.all);

  const viewOptions = [
    { id: 'day', label: t.dayView },
    { id: 'month', label: t.monthView },
    { id: 'term', label: t.termView },
  ];

  const daysOfWeek = [t.sunday, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday];
  const grades = [t.all, '10', '11', '12'];
  const classes = [t.all, '10-A', '10-B', '11-C'];

  // 5 weeks of 7 days
  const calendarGrid = Array.from({ length: 35 }, (_, i) => {
    return {
      day: i - 1, // Start from previous month end
      isCurrentMonth: i >= 2 && i < 33, // Just a mock representation
      events: getMockEvents(i)
    };
  });

  function getMockEvents(dayIndex: number) {
    if (dayIndex === 5) return [{ title: 'Math 101', class: '10-A', type: 'standard' }];
    if (dayIndex === 12) return [{ title: 'Review Session', class: '11-C', type: 'live' }, { title: 'Physics Lab', class: '10-B', type: 'standard' }];
    if (dayIndex === 15) return [{ title: 'Midterm Parent Mtg', class: 'All', type: 'event' }];
    if (dayIndex === 22) return [{ title: 'Chemistry', class: '10-A', type: 'standard' }];
    return [];
  }

  const getTypeStyles = (type: string) => {
    switch(type) {
      case 'standard': return 'bg-blue-50 border-s-4 border-blue-500 text-blue-700';
      case 'live': return 'bg-rose-50 border-s-4 border-rose-500 text-rose-700';
      case 'event': return 'bg-amber-50 border-s-4 border-amber-500 text-amber-700';
      default: return 'bg-gray-50 border-s-4 border-gray-400 text-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-none" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 2. Top Command Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
        
        {/* Left: Nav arrows & Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
            <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors">
              {isRtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors">
              {isRtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
          <h2 className="text-xl font-bold text-gray-800 font-cairo">{t.month}</h2>
        </div>

        {/* Center: View Switchers */}
        <div className="flex items-center bg-gray-50 border border-gray-100 p-1 rounded-xl">
          {viewOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setActiveView(opt.id as any)}
              className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                activeView === opt.id
                  ? 'bg-white shadow-sm border border-gray-100 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Right: Dropdowns */}
        <div className="flex items-center gap-6">
          <FlatDropdown label={t.gradeLabel} options={grades} value={grade} onChange={setGrade} language={language} />
          <FlatDropdown label={t.classLabel} options={classes} value={classFilter} onChange={setClassFilter} language={language} />
        </div>
      </div>

      {/* 3. The Main Layout (Split View) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel: Mini-Calendar & Filters (20%) */}
        <div className="w-64 shrink-0 border-e border-gray-100 px-4 py-6 bg-white overflow-y-auto custom-scrollbar">
          {/* Static Mini-Calendar (Mock) */}
          <div className="mb-8 p-1">
            <h3 className="text-sm font-bold text-gray-800 mb-4 ps-1">{t.month}</h3>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-[10px] font-bold text-gray-400">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: 31}).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-center h-7 w-7 text-xs rounded-full cursor-pointer hover:bg-gray-100 font-medium ${i + 1 === 15 ? 'bg-orange-100 text-orange-700 font-bold' : 'text-gray-600'}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 mb-6"></div>

          {/* Event Type Toggles */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 ps-1">{t.all}</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-200 text-blue-500 focus:ring-0" />
                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{t.standardClasses}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-200 text-rose-500 focus:ring-0" />
                <span className="text-sm font-bold text-gray-700 group-hover:text-rose-600 transition-colors">{t.liveSessions}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-200 text-amber-500 focus:ring-0" />
                <span className="text-sm font-bold text-gray-700 group-hover:text-amber-600 transition-colors">{t.events}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Panel: Calendar Canvas (80%) */}
        <div className="flex-1 bg-white p-6 overflow-y-auto">
          <div className="grid grid-cols-7 border-t border-s border-gray-100 rounded-xl overflow-hidden shadow-none">
            
            {/* Headers */}
            {daysOfWeek.map((day, i) => (
              <div key={i} className="text-center py-3 bg-gray-50 border-e border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500">{day}</span>
              </div>
            ))}

            {/* Grid Cells */}
            {calendarGrid.map((cell, i) => (
              <div 
                key={i} 
                className={`min-h-[120px] p-2 border-e border-b border-gray-100 ${cell.isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${cell.day === 15 && cell.isCurrentMonth ? 'bg-orange-500 text-white' : 'text-gray-500'}`}>
                    {cell.day > 0 && cell.day <= 31 ? cell.day : ''}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  {cell.events.map((ev, idx) => (
                    <div 
                      key={idx} 
                      className={`px-2.5 py-1.5 rounded text-xs font-bold shadow-none ${getTypeStyles(ev.type)} flex flex-col`}
                    >
                      <span className="truncate">{ev.title}</span>
                      <span className="text-[10px] opacity-80">{ev.class}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          </div>
        </div>

      </div>
    </div>
  );
}
