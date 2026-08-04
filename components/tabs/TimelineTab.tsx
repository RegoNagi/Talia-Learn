'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, CheckCircle2, AlertCircle, BookOpen, BrainCircuit, ClipboardList } from 'lucide-react';

interface TimelineEvent {
  id: string;
  title: string;
  type: 'lesson' | 'assessment' | 'unit_start' | 'lesson-plan';
  date: string;
  time?: string;
  status: 'completed' | 'upcoming' | 'overdue' | 'teacher-only';
  isTeacherOnly?: boolean;
}

interface WeekGroup {
  id: string;
  title: string;
  dateRange: string;
  events: TimelineEvent[];
}

interface TimelineTabProps {
  role?: string;
  language?: string;
}

const initialWeeks: WeekGroup[] = [
  {
    id: 'w1',
    title: 'Week 1',
    dateRange: 'Sept 1 - Sept 7',
    events: [
      { id: 'lp-1', title: 'Lesson Plan: Matrix Basics', type: 'lesson-plan', date: 'Mon, Sept 1', time: 'Teacher Only Material', status: 'teacher-only', isTeacherOnly: true },
      { id: 'e1', title: 'Unit 1: Introduction to Matrices', type: 'unit_start', date: 'Mon, Sept 1', status: 'completed' },
      { id: 'e2', title: '1.1 What is a Matrix?', type: 'lesson', date: 'Tue, Sept 2', time: '10:00 AM', status: 'completed' },
      { id: 'e3', title: '1.2 Matrix Notation', type: 'lesson', date: 'Thu, Sept 4', time: '2:00 PM', status: 'completed' },
    ]
  },
  {
    id: 'w2',
    title: 'Week 2',
    dateRange: 'Sept 8 - Sept 14',
    events: [
      { id: 'e4', title: '1.3 Basic Operations Quiz', type: 'assessment', date: 'Tue, Sept 9', time: 'Due 11:59 PM', status: 'overdue' },
      { id: 'e5', title: 'Review: Matrix Basics', type: 'lesson', date: 'Wed, Sept 10', time: '10:00 AM', status: 'upcoming' },
    ]
  }
];

export function TimelineTab({ role = 'student', language = 'en' }: TimelineTabProps) {
  const [weeks, setWeeks] = useState<WeekGroup[]>(initialWeeks);

  const handleMarkAsComplete = (weekId: string, eventId: string) => {
    setWeeks(prevWeeks => 
      prevWeeks.map(week => {
        if (week.id === weekId) {
          return {
            ...week,
            events: week.events.map(event => 
              event.id === eventId ? { ...event, status: 'completed' as const } : event
            )
          };
        }
        return week;
      })
    );
  };

  return (
    <div className="h-full max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Weekly Plan</h2>
        <p className="text-slate-500 text-sm mt-1">Chronological view of your course schedule</p>
      </div>

      <div className="space-y-8 relative">
        {/* Vertical Line */}
        <div className="absolute left-[19px] rtl:right-[19px] rtl:left-auto top-4 bottom-0 w-0.5 bg-slate-100 -z-10" />

        {weeks.map((week) => (
          <div key={week.id} className="relative">
            {/* Week Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border-4 border-white shadow-sm flex items-center justify-center z-10 shrink-0">
                <Calendar size={18} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{week.title}</h3>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{week.dateRange}</p>
              </div>
            </div>

            {/* Events */}
            <div className="space-y-4 ltr:pl-14 rtl:pr-14">
              {week.events.map((event) => {
                if (event.isTeacherOnly && role !== 'teacher') return null;
                
                return (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group flex-wrap gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      ${event.type === 'unit_start' ? 'bg-indigo-100 text-indigo-600' :
                        event.type === 'assessment' ? 'bg-purple-100 text-purple-600' :
                        event.type === 'lesson-plan' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-50 text-blue-500'}`}
                    >
                      {event.type === 'unit_start' ? <BookOpen size={20} /> :
                       event.type === 'assessment' ? <BrainCircuit size={20} /> :
                       event.type === 'lesson-plan' ? <ClipboardList size={20} /> :
                       <Clock size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm">{event.title}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-medium text-slate-400">{event.date}</span>
                        {event.time && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                            <span className="text-xs text-slate-400">{event.time}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge or Actions */}
                  <div className="flex items-center gap-2">
                    {event.type === 'lesson-plan' ? (
                      <button 
                        onClick={() => alert('Previewing Lesson Plan: Matrix Basics')} 
                        className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer"
                      >
                        {language === 'ar' ? 'معاينة' : 'Preview'}
                      </button>
                    ) : (
                      <>
                        {event.status === 'completed' && (
                          <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">
                            <CheckCircle2 size={14} /> {language === 'ar' ? 'مكتمل' : 'Done'}
                          </span>
                        )}
                        {event.status === 'overdue' && (
                          <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold">
                            <AlertCircle size={14} /> {language === 'ar' ? 'متأخر' : 'Overdue'}
                          </span>
                        )}
                        {event.status === 'upcoming' && (
                          <span className="text-slate-400 bg-slate-50 px-3 py-1 rounded-full text-xs font-bold border border-slate-100">
                            {language === 'ar' ? 'قادم' : 'Upcoming'}
                          </span>
                        )}
                        
                        {event.status !== 'completed' && (
                          <button
                            onClick={() => handleMarkAsComplete(week.id, event.id)}
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ml-2"
                          >
                            {language === 'ar' ? 'تحديد كمكتمل' : 'Mark as complete'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )})}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

