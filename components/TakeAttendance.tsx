'use client';

import { useState, useEffect, startTransition } from 'react';
import { ChevronDown, Calendar, Search, CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';
import {
  getMyClassSections, getStudentsByIds, getPeriods, getAttendanceSettings,
  getAttendanceForDate, saveAttendanceSession,
  LearnClassSection, LearnStudent, LearnPeriod,
} from '@/services/attendanceData';

interface TakeAttendanceProps {
  language: 'ar' | 'en';
  teacherId: string;
}

export function TakeAttendance({ language, teacherId }: TakeAttendanceProps) {
  const isRtl = language === 'ar';
  const todayStr = new Date().toISOString().slice(0, 10);

  const [realClasses, setRealClasses] = useState<LearnClassSection[]>([]);
  const [realStudents, setRealStudents] = useState<LearnStudent[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [attendanceMode, setAttendanceMode] = useState<'Daily' | 'Period'>('Period');
  const [realPeriods, setRealPeriods] = useState<LearnPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, string>>>({});
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  const isToday = selectedDate === todayStr;

  useEffect(() => {
    startTransition(() => setIsLoadingClasses(true));
    Promise.all([getMyClassSections(teacherId), getAttendanceSettings()]).then(([classes, settings]) => {
      setRealClasses(classes);
      setAttendanceMode(settings.mode);
      setIsLoadingClasses(false);
    });
  }, [teacherId]);

  useEffect(() => {
    if (!selectedClass) return;
    const cls = realClasses.find((c) => c.id === selectedClass);
    if (cls) getStudentsByIds(cls.students).then(setRealStudents);
  }, [selectedClass, realClasses]);

  useEffect(() => {
    if (selectedClass && attendanceMode === 'Period') {
      getPeriods(selectedClass).then((p) => {
        setRealPeriods(p);
        setSelectedPeriodId(p.length > 0 ? p[0].id : null);
      });
    }
  }, [selectedClass, attendanceMode]);

  useEffect(() => {
    if (selectedClass) {
      getAttendanceForDate(selectedClass, selectedDate).then(setAttendanceData);
    }
  }, [selectedClass, selectedDate]);

  const periodKey = attendanceMode === 'Period' ? (selectedPeriodId || 'daily') : 'daily';
  const currentAttendance = attendanceData[periodKey] || {};

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [periodKey]: { ...(prev[periodKey] || {}), [studentId]: status },
    }));
  };

  const markAllPresent = () => {
    const cls = realClasses.find((c) => c.id === selectedClass);
    if (!cls) return;
    const updates: Record<string, string> = {};
    cls.students.forEach((id) => { updates[id] = 'present'; });
    setAttendanceData((prev) => ({ ...prev, [periodKey]: updates }));
  };

  const goPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };
  const goNextDay = () => {
    if (isToday) return;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const saveAttendance = async () => {
    if (!isToday || !selectedClass) return;
    if (attendanceMode === 'Period' && !selectedPeriodId) return;
    setIsSavingAttendance(true);
    const statusMap: Record<string, string> = { present: 'Present', absent: 'Absent', late: 'Late', excused: 'Excused' };
    const records = realStudents.map((s) => ({
      studentId: s.id,
      status: statusMap[currentAttendance[s.id]] || 'Absent',
    }));
    const periodSubject = attendanceMode === 'Period' ? realPeriods.find((p) => p.id === selectedPeriodId)?.subject : 'يوم كامل';
    const sessionId = await saveAttendanceSession({
      sectionId: selectedClass,
      date: selectedDate,
      subject: periodSubject,
      periodId: attendanceMode === 'Period' ? selectedPeriodId : null,
      records,
    });
    setIsSavingAttendance(false);
    if (sessionId) {
      setAttendanceSaved(true);
      setTimeout(() => setAttendanceSaved(false), 3000);
    }
  };

  if (isLoadingClasses) {
    return <p className="text-center text-gray-400 py-20">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>;
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {!selectedClass ? (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center max-w-lg mx-auto mt-10">
          <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{isRtl ? 'اختر فصلاً' : 'Choose a class'}</h2>
          <p className="text-gray-500 mb-6">{isRtl ? 'اختر فصلاً لبدء تسجيل حضور اليوم.' : 'Pick a class to start taking attendance for today.'}</p>

          <div className="space-y-3">
            {realClasses.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-violet-500 hover:bg-violet-50 transition-all text-right"
              >
                <div>
                  <p className="font-bold text-gray-900">{cls.name}</p>
                  <p className="text-xs text-gray-500">{cls.gradeLevel} • {cls.students.length} {isRtl ? 'طلاب' : 'students'}</p>
                </div>
                <ChevronDown size={20} className="text-gray-400 -rotate-90" />
              </button>
            ))}
            {realClasses.length === 0 && (
              <p className="text-sm text-gray-400">{isRtl ? 'مش معيّن كمعلم رئيسي على أي فصل لسه.' : 'Not assigned as homeroom teacher on any class yet.'}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedClass(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronDown size={24} className="rotate-90 text-slate-600" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{realClasses.find((c) => c.id === selectedClass)?.name}</h2>
                <p className="text-slate-500">
                  {isRtl ? 'تسجيل الحضور' : 'Taking attendance'} {attendanceMode === 'Period' ? `${isRtl ? 'لـ' : 'for '}${realPeriods.find((p) => p.id === selectedPeriodId)?.subject || (isRtl ? 'حصة' : 'period')}` : isRtl ? '(يومي)' : '(daily)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1.5">
              <button onClick={goPrevDay} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronDown size={18} className="rotate-90 text-slate-600" />
              </button>
              <span className="text-sm font-bold text-slate-800 min-w-[110px] text-center">
                {isToday ? (isRtl ? 'النهاردة' : 'Today') : new Date(selectedDate).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <button onClick={goNextDay} disabled={isToday} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronDown size={18} className="-rotate-90 text-slate-600" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder={isRtl ? 'البحث عن طلاب...' : 'Search students...'}
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 text-sm w-64"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              </div>
              <button onClick={markAllPresent} disabled={!isToday} className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> {isRtl ? 'تحديد الكل كحاضر' : 'Mark all present'}
              </button>
              <button onClick={saveAttendance} disabled={isSavingAttendance || !isToday} className="bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 px-4 py-2 rounded-xl text-sm font-bold">
                {isSavingAttendance ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : attendanceSaved ? (isRtl ? 'تم الحفظ ✓' : 'Saved ✓') : !isToday ? (isRtl ? 'للعرض فقط' : 'View only') : (isRtl ? 'حفظ الحضور' : 'Save attendance')}
              </button>
            </div>
          </div>

          {!isToday && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
              {isRtl ? 'إنت بتعرض سجل حضور يوم مش النهاردة — التسجيل والتعديل متاح بس للنهاردة.' : "You're viewing a non-today attendance log — recording is only available for today."}
            </div>
          )}

          {attendanceMode === 'Period' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {realPeriods.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPeriodId(p.id)}
                    className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all ${
                      selectedPeriodId === p.id ? 'bg-violet-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p.subject}{p.startTime ? ` • ${p.startTime}` : ''}
                  </button>
                ))}
              </div>
              {realPeriods.length === 0 && (
                <p className="text-sm text-gray-400">{isRtl ? 'مفيش حصص للفصل ده لسه.' : 'No periods created for this class yet.'}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {realStudents.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map((student) => {
              const status = currentAttendance[student.id];
              return (
                <div key={student.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`}
                        alt={student.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-gray-900">{student.name}</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-violet-600 transition-colors p-2 hover:bg-gray-50 rounded-full">
                      <MessageSquare size={18} />
                    </button>
                  </div>

                  <div className="flex bg-gray-50 p-1 rounded-xl">
                    <button
                      onClick={() => handleStatusChange(student.id, 'present')}
                      disabled={!isToday}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 disabled:cursor-not-allowed ${
                        status === 'present' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 disabled:hover:bg-transparent'
                      }`}
                    >
                      {status === 'present' && <CheckCircle2 size={14} />} Present
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      disabled={!isToday}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 disabled:cursor-not-allowed ${
                        status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 disabled:hover:bg-transparent'
                      }`}
                    >
                      {status === 'absent' && <XCircle size={14} />} Absent
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'late')}
                      disabled={!isToday}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 disabled:cursor-not-allowed ${
                        status === 'late' ? 'bg-yellow-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 disabled:hover:bg-transparent'
                      }`}
                    >
                      {status === 'late' && <Clock size={14} />} Late
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
