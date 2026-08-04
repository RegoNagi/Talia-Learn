'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, CheckCircle, Clock, MessageSquare, AlertTriangle, 
  BookOpen, Video, ChevronDown, Check, Send, AlertCircle, TrendingDown, Bell,
  FileText, Brain
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

// Reusable Select Component
function CustomSelect({ 
  label,
  options, 
  value, 
  onChange 
}: { 
  label?: string;
  options: {id: string, label: string}[], 
  value: string, 
  onChange: (val: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.id === value)?.label || value;

  return (
    <div className="relative z-20 flex flex-col gap-1.5" ref={dropdownRef}>
      {label && <label className="text-xs font-bold text-slate-500">{label}</label>}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 px-4 py-2.5 bg-white border rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm w-full min-w-[160px] ${isOpen ? 'border-orange-500 ring-2 ring-orange-50' : 'border-slate-200'}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
            className="absolute top-full start-0 w-full mt-1.5 bg-white border border-slate-100 rounded-xl z-50 py-1 shadow-lg overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto">
              {options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { onChange(opt.id); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-sm text-start transition-colors ${value === opt.id ? 'text-orange-600 font-bold bg-orange-50/50' : 'text-slate-700 font-medium'}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.id && <Check size={16} className="text-orange-600 shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TeacherDashboard({ language = 'ar', userRole }: { language?: 'ar' | 'en', userRole?: string }) {
  const [grade, setGrade] = useState('4');
  const [selectedClass, setSelectedClass] = useState('all');
  const [activeSubject, setActiveSubject] = useState('math');

  const filterOptions = {
    grade: [
      { id: '4', label: 'Grade 4' },
      { id: '5', label: 'Grade 5' }
    ],
    classes: [
      { id: 'all', label: 'All Classes' },
      { id: '4A', label: '4A' },
      { id: '4B', label: '4B' }
    ]
  };

  const subjects = [
    { id: 'math', label: 'Mathematics' },
    { id: 'science', label: 'Science' },
    { id: 'arabic', label: 'Arabic' },
    { id: 'history', label: 'History' },
  ];

  // Mock aggregated vs specific class data
  const isAllClasses = selectedClass === 'all';
  
  const kpis = {
    totalStudents: isAllClasses ? 56 : 28,
    attendance: isAllClasses ? { present: 54, absent: 2 } : { present: 28, absent: 0 },
    homework: isAllClasses ? 12 : 5,
    assignments: isAllClasses ? 3 : 1,
    assessments: isAllClasses ? 2 : 1,
  };

  const pendingTasks = [
    { id: 1, title: 'Grade First Weekly Assessment', class: '4A', type: 'assessment', urgent: true },
    { id: 2, title: 'Review Algebra Assignment', class: '4B', type: 'homework', urgent: false },
    { id: 3, title: 'Prepare Fractions Lesson', class: '4A', type: 'prep', urgent: false },
  ];

  const radarAlerts = [
    { id: 1, student: 'Ahmed Hassan', avatar: 'https://picsum.photos/seed/ahmed/100', issue: 'Drop in Weekly Assessment grades', type: 'academic', class: '4A' },
    { id: 2, student: 'Sarah Mohamed', avatar: 'https://picsum.photos/seed/sarah2/100', issue: 'Exceeded absence limit', type: 'attendance', class: '4B' },
  ];

  const schedule = [
    { id: 1, time: '08:00 AM', title: 'Math', type: 'physical', location: 'Bldg A - Class 4A', status: 'completed' },
    { id: 2, time: '10:30 AM', title: 'Live Review', type: 'virtual', location: 'Online - Class 4B', status: 'current' },
    { id: 3, time: '12:00 PM', title: 'Science', type: 'physical', location: 'Main Lab - Class 4C', status: 'upcoming' },
  ];

  const visibleTasks = isAllClasses ? pendingTasks : pendingTasks.filter(t => t.class === selectedClass);
  const visibleAlerts = isAllClasses ? radarAlerts : radarAlerts.filter(a => a.class === selectedClass);

  return (
    <div className="w-full flex flex-col gap-6" dir="ltr">
      {/* 1. Master Filter & Subject Chips */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 self-start w-fit">
        <div className="flex gap-4 items-end">
          <div className="w-[180px]">
            <CustomSelect label="Grade" options={filterOptions.grade} value={grade} onChange={setGrade} />
          </div>
          <div className="w-[180px]">
            <CustomSelect label="Class" options={filterOptions.classes} value={selectedClass} onChange={setSelectedClass} />
          </div>
        </div>

        <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
          {subjects.map(subj => {
            const isActive = activeSubject === subj.id;
            return (
              <button
                key={subj.id}
                onClick={() => setActiveSubject(subj.id)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all text-sm ${
                  isActive 
                    ? 'bg-blue-600 text-white border border-transparent' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {subj.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Live KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-600">Total Students</span>
            <span className="text-3xl font-bold text-slate-900 mt-2">{kpis.totalStudents}</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-600">Today&apos;s Attendance</span>
            <span className="text-3xl font-bold text-slate-900 mt-2 flex items-baseline gap-2">
              {kpis.attendance.present}
              <span className="text-sm font-medium text-slate-500">/ {kpis.attendance.absent} Absent</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-600">Homework</span>
            <span className="text-3xl font-bold text-slate-900 mt-2">{kpis.homework}</span>
            <span className="text-xs text-slate-500 mt-1">To grade</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-600">Assignments</span>
            <span className="text-3xl font-bold text-slate-900 mt-2">{kpis.assignments}</span>
            <span className="text-xs text-slate-500 mt-1">Active</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-600">Assessments</span>
            <span className="text-3xl font-bold text-slate-900 mt-2">{kpis.assessments}</span>
            <span className="text-xs text-slate-500 mt-1">General</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
        </div>

        {/* KPI 6 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-600">Weekly Assessment</span>
            <span className="text-3xl font-bold text-slate-900 mt-2">{isAllClasses ? 5 : 2}</span>
            <span className="text-xs text-slate-500 mt-1">To grade</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Brain size={24} />
          </div>
        </div>
      </div>

      {/* 3. Main Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Right Column (Takes 2 cols on xl) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Action Center & To-Do */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Bell className="text-orange-500" size={24} />
                Action Center
              </h2>
              <button className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors">
                View All
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {visibleTasks.map(task => (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-orange-100 hover:bg-orange-50/30 transition-all bg-slate-50/50 group gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 sm:mt-0 shrink-0 ${task.urgent ? 'bg-rose-500 animate-pulse ring-4 ring-rose-100' : 'bg-slate-300'}`}></div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">{task.title}</h4>
                      {isAllClasses && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-slate-600 shadow-sm">
                          Class {task.class}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-orange-200 shrink-0">
                    Start
                  </button>
                </div>
              ))}
              {visibleTasks.length === 0 && (
                <div className="text-center py-8 text-slate-500 font-medium">
                  No pending tasks.
                </div>
              )}
            </div>
          </div>

          {/* Content Progression */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
              <BookOpen className="text-blue-500" size={24} />
              Content Progression
            </h2>
            
            <div className="flex flex-col gap-6">
              {isAllClasses ? (
                <>
                  <div className="group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-700">Class 4A</span>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-sm">65%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full group-hover:scale-y-110 transition-transform origin-left" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div className="group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-700">Class 4B</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-sm">42%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full group-hover:scale-y-110 transition-transform origin-left" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-700">Unit 1: Numbers</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-sm">100%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div className="group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-700">Unit 2: Geometry</span>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-sm">30%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full group-hover:scale-y-110 transition-transform origin-left" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Left Column (Takes 1 col on xl) */}
        <div className="flex flex-col gap-6">
          
          {/* Today's Schedule (Moved Up & Enhanced) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
              <Clock className="text-indigo-500" size={24} />
              Today&apos;s Schedule
            </h2>
            
            <div className="relative border-s-2 border-slate-100 ms-4 space-y-8">
              {schedule.map(item => (
                <div key={item.id} className="relative ps-6">
                  {/* Timeline dot */}
                  <div className={`absolute -start-[11px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm ${item.status === 'completed' ? 'bg-slate-300' : item.status === 'current' ? (item.type === 'virtual' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500') : 'bg-indigo-300'}`}></div>
                  
                  <div className="flex flex-col gap-2">
                    <span className={`text-xs font-bold ${item.status === 'completed' ? 'text-slate-400' : 'text-slate-500'}`}>{item.time}</span>
                    <h4 className={`font-bold text-base ${item.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{item.title}</h4>
                    
                    {/* Striking Visual Distinction */}
                    {item.type === 'virtual' ? (
                      <div className="mt-1 flex flex-col gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100">
                        <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                          <Video size={14} className="animate-pulse" />
                          {item.location}
                        </div>
                        {item.status === 'current' && (
                          <button className="flex items-center justify-center gap-2 w-full py-2.5 bg-rose-600 text-white font-bold text-sm rounded-lg hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200">
                            Join Live Stream
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                        <Users size={14} />
                        {item.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Radar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
              <AlertTriangle className="text-rose-500" size={24} />
              Student Radar
            </h2>
            
            <div className="flex flex-col gap-4">
              {visibleAlerts.map(alert => (
                <div key={alert.id} className="p-4 rounded-xl bg-rose-50/80 border border-rose-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <Image src={alert.avatar} alt={alert.student} fill className="object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{alert.student}</h4>
                        {isAllClasses && (
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-100">Class {alert.class}</span>
                        )}
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-white border border-rose-200 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors shadow-sm" title="Send Message">
                      <Send size={14} />
                    </button>
                  </div>
                  <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
                    {alert.type === 'academic' ? <TrendingDown size={14} className="text-rose-500 shrink-0 mt-0.5" /> : <Clock size={14} className="text-rose-500 shrink-0 mt-0.5" />}
                    <p className="text-xs font-bold text-rose-700 leading-relaxed">{alert.issue}</p>
                  </div>
                </div>
              ))}
              {visibleAlerts.length === 0 && (
                <div className="text-center py-6 text-slate-500 font-medium text-sm">
                  No active alerts.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

