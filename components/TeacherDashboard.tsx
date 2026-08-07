'use client';

import React, { useState, useRef, useEffect, startTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { getMyClassSections, LearnClassSection } from '@/services/attendanceData';
import {
  getTodayAttendanceSummary,
  getGradingSummaries,
  getTodaySchedule,
  getContentProgression,
  getPendingRewardsCount,
  AttendanceSummary,
  GradingSummary,
  ScheduleItem,
  ProgressionItem,
} from '@/services/dashboardData';

const ACCENT = '#ea580c';

function Icon({ path, size = 16, stroke = 'currentColor', width = 1.8 }: { path: string; size?: number; stroke?: string; width?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function RingProgress({ value, size = 106, stroke = 9, label, sub }: { value: number; size?: number; stroke?: number; label: string; sub: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(value, 100) / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px` }}>
      <svg viewBox="0 0 80 80" width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={40} cy={40} r={r} fill="none" stroke="#f4f4f5" strokeWidth={stroke} />
        <circle cx={40} cy={40} r={r} fill="none" stroke={ACCENT} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 90 ? 27 : 15, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>{label}</span>
        <span style={{ fontSize: size > 90 ? 10.5 : 9, color: '#a1a1aa', whiteSpace: 'nowrap' }}>{sub}</span>
      </div>
    </div>
  );
}

function FlatFilterDropdown({ options, value, onChange, placeholder }: { options: { id: string; label: string }[]; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const selectedLabel = value === 'all' ? placeholder : options.find((o) => o.id === value)?.label || placeholder;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, color: '#09090b', background: '#fff', border: '1px solid #e4e4e7', borderRadius: 11, padding: '8px 13px', cursor: 'pointer' }}
      >
        <Icon path="M4 5h16v12H4zM8 21h8M12 17v4" stroke="#a1a1aa" />
        {selectedLabel}
        <Icon path="m6 9 6 6 6-6" size={13} stroke="#a1a1aa" width={2} />
      </button>
      {isOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 7px)', left: 0, zIndex: 50, minWidth: 176, background: '#fff', border: '1px solid #e4e4e7', borderRadius: 14, boxShadow: '0 18px 40px rgba(16,24,40,0.12)', padding: 5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button onClick={() => { onChange('all'); setIsOpen(false); }} style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: value === 'all' ? 600 : 500, color: value === 'all' ? '#09090b' : '#71717a', background: 'transparent', border: 'none', borderRadius: 9, padding: '8px 10px', textAlign: 'left', cursor: 'pointer' }}>
            {placeholder === 'Class' ? 'All classes' : 'All'}
          </button>
          {options.map((opt) => (
            <button key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); }} style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: value === opt.id ? 600 : 500, color: value === opt.id ? '#09090b' : '#71717a', background: 'transparent', border: 'none', borderRadius: 9, padding: '8px 10px', textAlign: 'left', cursor: 'pointer' }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TeacherDashboard({ language = 'en', userRole = 'teacher', authUser, onNavigate }: { language?: 'ar' | 'en'; userRole?: string; authUser?: any; onNavigate?: (space: string) => void }) {
  const router = useRouter();
  const isRtl = language === 'ar';
  const teacherId: string | undefined = authUser?.teacherId;
  const subjectsAll: string[] = authUser?.subjects || [];

  const [sections, setSections] = useState<LearnClassSection[]>([]);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const [attendance, setAttendance] = useState<AttendanceSummary>({ present: 0, total: 0, absentStudentIds: [] });
  const [grading, setGrading] = useState<{ assignments: GradingSummary[]; quizzes: GradingSummary[] }>({ assignments: [], quizzes: [] });
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [progression, setProgression] = useState<ProgressionItem[]>([]);
  const [pendingRewards, setPendingRewards] = useState(0);

  const scopedSections = sections.filter((s) => (gradeFilter === 'all' || s.gradeLevel === gradeFilter) && (classFilter === 'all' || s.id === classFilter));
  const scopedSubjects = subjectFilter === 'all' ? subjectsAll : [subjectFilter];

  useEffect(() => {
    if (!teacherId) { startTransition(() => setIsLoading(false)); return; }
    getMyClassSections(teacherId).then(setSections);
  }, [teacherId]);

  useEffect(() => {
    if (!teacherId || sections.length === 0) { if (!teacherId) startTransition(() => setIsLoading(false)); return; }
    startTransition(() => setIsLoading(true));
    Promise.all([
      getTodayAttendanceSummary(scopedSections),
      getGradingSummaries(scopedSections, scopedSubjects, teacherId),
      getTodaySchedule(scopedSections, scopedSubjects),
      getContentProgression(scopedSections, scopedSubjects, teacherId),
      getPendingRewardsCount(scopedSections, scopedSubjects),
    ]).then(([att, grd, sch, prog, rewards]) => {
      setAttendance(att);
      setGrading(grd);
      setSchedule(sch);
      setProgression(prog);
      setPendingRewards(rewards);
      setIsLoading(false);
    });
  }, [teacherId, sections, gradeFilter, classFilter, subjectFilter]);

  if (userRole !== 'teacher') {
    return (
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>{isRtl ? 'الرئيسية' : 'Home'}</h1>
        <p style={{ color: '#71717a', fontSize: 14 }}>{isRtl ? 'مرحبًا بيك' : 'Welcome'}</p>
      </div>
    );
  }

  const totalAssignmentsToGrade = grading.assignments.reduce((s, a) => s + a.toGrade, 0);
  const totalQuizzesToGrade = grading.quizzes.reduce((s, q) => s + q.toGrade, 0);
  const totalSubmissions = grading.assignments.reduce((s, a) => s + a.totalSubmissions, 0);
  const submissionAvgPct = totalSubmissions > 0 ? Math.round((grading.assignments.reduce((s, a) => s + (a.totalSubmissions - a.toGrade), 0) / totalSubmissions) * 100) : 0;
  const liveNowCount = schedule.filter((s) => s.isLive).length;
  const heroQuiz = grading.quizzes[0];

  const gradeOptions = Array.from(new Set(sections.map((s) => s.gradeLevel))).map((g) => ({ id: g, label: isRtl ? `الصف ${g}` : `Grade ${g}` }));
  const classOptions = sections.filter((s) => gradeFilter === 'all' || s.gradeLevel === gradeFilter).map((s) => ({ id: s.id, label: s.name }));
  const subjectOptions = subjectsAll.map((s) => ({ id: s, label: s }));

  const actionItems = [
    ...grading.assignments.map((a) => ({ kind: 'assignment' as const, title: (isRtl ? 'تصحيح: ' : 'Grade: ') + a.title, className: a.className, detail: `${a.toGrade} ${isRtl ? 'بانتظار التصحيح' : 'waiting'}`, assessmentId: a.assessmentId })),
    ...grading.quizzes.map((q) => ({ kind: 'quiz' as const, title: (isRtl ? 'تصحيح: ' : 'Grade: ') + q.title, className: q.className, detail: `${q.toGrade} ${isRtl ? 'بانتظار التصحيح' : 'waiting'}`, assessmentId: q.assessmentId })),
  ].slice(0, 6);

  const goToAssessments = (classId: string, subject: string) => router.push(`/courses/${classId}__${encodeURIComponent(subject)}?tab=assessments`);
  const findSectionByName = (name: string) => sections.find((s) => s.name === name);

  const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #f0f0f2', borderRadius: 20, boxShadow: '0 1px 2px rgba(16,24,40,0.04)' };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px 44px 24px', fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 22, flexWrap: 'wrap', padding: '26px 2px 16px 2px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#a1a1aa' }}>
            <span>TaliaLearn</span><span>/</span><span style={{ color: '#09090b', fontWeight: 500 }}>{isRtl ? 'الرئيسية' : 'Home'}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em' }}>{isRtl ? 'لوحة التحكم' : 'Dashboard'}</h1>
          <p style={{ margin: 0, fontSize: 12.5, color: '#71717a' }}>
            {new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })} · {schedule.length} {isRtl ? 'حصص اليوم' : 'periods today'} · {liveNowCount} {isRtl ? 'مباشر الآن' : 'live now'}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ position: 'sticky', top: 10, zIndex: 40, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', border: '1px solid #f0f0f2', borderRadius: 16, boxShadow: '0 6px 22px rgba(16,24,40,0.05)', padding: '9px 12px', marginBottom: 16 }}>
        <FlatFilterDropdown options={gradeOptions} value={gradeFilter} onChange={(v) => { setGradeFilter(v); setClassFilter('all'); }} placeholder={isRtl ? 'الصف' : 'Grade'} />
        <FlatFilterDropdown options={classOptions} value={classFilter} onChange={setClassFilter} placeholder={isRtl ? 'الفصل' : 'Class'} />
        <span style={{ width: 1, height: 24, background: '#f0f0f2' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {subjectsAll.map((subj) => {
            const on = subjectFilter === subj;
            return (
              <button
                key={subj}
                onClick={() => setSubjectFilter(on ? 'all' : subj)}
                style={{ whiteSpace: 'nowrap', fontFamily: 'inherit', fontSize: 12.5, fontWeight: on ? 600 : 500, color: on ? '#fff' : '#71717a', background: on ? ACCENT : 'transparent', border: `1px solid ${on ? ACCENT : 'transparent'}`, borderRadius: 999, padding: '7px 14px', cursor: 'pointer' }}
              >
                {subj}
              </button>
            );
          })}
        </div>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontSize: 11.5, color: '#71717a' }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: ACCENT }} />
          {scopedSubjects.length === subjectsAll.length ? (isRtl ? 'كل المواد' : 'All subjects') : scopedSubjects.join(', ')} · {gradeFilter === 'all' ? (isRtl ? 'كل الصفوف' : 'All grades') : gradeFilter}
        </span>
      </div>

      {isLoading ? (
        <div style={{ ...cardStyle, padding: 60, textAlign: 'center', color: '#a1a1aa', fontSize: 13 }}>{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : (
      <>
      {/* Row 1 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <section style={{ ...cardStyle, flex: '1.35 1 340px', minWidth: 0, padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#71717a' }}>{isRtl ? 'حضور اليوم' : "Today's Attendance"}</span>
              <span style={{ fontSize: 11.5, color: '#a1a1aa' }}>{isRtl ? 'إجمالي فصولك' : 'Across your classes'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <RingProgress value={attendance.total > 0 ? (attendance.present / attendance.total) * 100 : 0} label={attendance.total > 0 ? `${Math.round((attendance.present / attendance.total) * 100)}%` : '—'} sub={isRtl ? 'حاضر' : 'present'} />
            <div style={{ flex: '1 1 190px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.82, color: ACCENT }}>{attendance.present}</span>
                <span style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', color: '#a1a1aa', paddingBottom: 2 }}>/ {attendance.total}</span>
              </div>
              <span style={{ fontSize: 11, color: '#a1a1aa' }}>{isRtl ? 'حاضر من الإجمالي' : 'present of total students'}</span>
              {attendance.absentStudentIds.length > 0 && (
                <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#be123c', background: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: 999, padding: '4px 9px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: '#e11d48' }} />
                  {attendance.absentStudentIds.length} {isRtl ? 'غايب' : 'Absent'}
                </span>
              )}
            </div>
          </div>
          <button type="button" onClick={() => onNavigate && onNavigate('attendance')} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: ACCENT, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
            {isRtl ? 'تسجيل الحضور' : 'Take Attendance'}
            <Icon path="M5 12h14M13 6l6 6-6 6" size={14} width={2} />
          </button>
        </section>

        <section style={{ flex: '0.95 1 250px', minWidth: 0, position: 'relative', overflow: 'hidden', borderRadius: 20, background: 'linear-gradient(155deg,#fb923c 0%,#ea580c 55%,#c2410c 100%)', color: '#fff', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 12px 30px rgba(234,88,12,0.22)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>{isRtl ? 'تصحيح الكويزات' : 'Quiz Grading'}</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.82 }}>{totalQuizzesToGrade}</span>
          </div>
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.82)' }}>
            {heroQuiz ? `${heroQuiz.title} · ${heroQuiz.className}` : (isRtl ? 'مفيش كويزات محتاجة تصحيح' : 'No quizzes need grading')}
          </span>
          <button
            type="button"
            disabled={!heroQuiz}
            onClick={() => { if (heroQuiz) { const sec = findSectionByName(heroQuiz.className); if (sec) goToAssessments(sec.id, scopedSubjects[0] || subjectsAll[0]); } }}
            style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#c2410c', background: '#fff', border: 'none', borderRadius: 11, padding: '11px 16px', cursor: heroQuiz ? 'pointer' : 'default', opacity: heroQuiz ? 1 : 0.6 }}
          >
            {isRtl ? 'صحّح الآن' : 'Grade Now'}
            <Icon path="M5 12h14M13 6l6 6-6 6" size={14} width={2.2} />
          </button>
        </section>

        <section style={{ ...cardStyle, flex: '0.85 1 230px', minWidth: 0, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#71717a' }}>{isRtl ? 'نسبة التسليم' : 'Submission Rate'}</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.86, color: ACCENT }}>{submissionAvgPct}%</span>
              <span style={{ fontSize: 11, color: '#a1a1aa' }}>{isRtl ? 'متوسط التسليم' : 'Avg. Submissions'}</span>
            </div>
            <RingProgress value={submissionAvgPct} size={64} stroke={5} label={`${submissionAvgPct}%`} sub="" />
          </div>
          <span style={{ marginTop: 'auto', fontSize: 11, color: '#a1a1aa' }}>{isRtl ? `عبر ${scopedSections.length} فصول` : `Across ${scopedSections.length} classes`}</span>
        </section>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 14 }}>
        <section style={{ ...cardStyle, flex: '1 1 210px', minWidth: 0, padding: 18, display: 'flex', flexDirection: 'column', gap: 13 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#71717a' }}>{isRtl ? 'واجبات' : 'Homework'}</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
            <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.86, color: ACCENT }}>{totalAssignmentsToGrade}</span>
            <span style={{ fontSize: 21, fontWeight: 400, color: '#a1a1aa', paddingBottom: 2 }}>/ {totalSubmissions}</span>
          </div>
          <span style={{ fontSize: 11, color: '#a1a1aa' }}>{isRtl ? 'محتاجة تصحيح من إجمالي التسليمات' : 'to grade of submissions'}</span>
          <button type="button" onClick={() => scopedSections[0] && goToAssessments(scopedSections[0].id, scopedSubjects[0] || subjectsAll[0])} style={{ marginTop: 'auto', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: ACCENT, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
            {isRtl ? 'صحّح الآن' : 'Grade Now'}
            <Icon path="M5 12h14M13 6l6 6-6 6" size={14} width={2} />
          </button>
        </section>

        <section style={{ ...cardStyle, flex: '1 1 210px', minWidth: 0, padding: 18, display: 'flex', flexDirection: 'column', gap: 13 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#71717a' }}>{isRtl ? 'حصص مباشرة اليوم' : 'Live Sessions Today'}</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
            <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.86, color: ACCENT }}>{liveNowCount}</span>
            <span style={{ fontSize: 21, fontWeight: 400, color: '#a1a1aa', paddingBottom: 2 }}>/ {schedule.length}</span>
          </div>
          <span style={{ fontSize: 11, color: '#a1a1aa' }}>{isRtl ? 'مباشر الآن من إجمالي حصص اليوم' : 'live now of periods today'}</span>
          <button type="button" onClick={() => onNavigate && onNavigate('calendar')} style={{ marginTop: 'auto', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: ACCENT, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
            {isRtl ? 'عرض الجدول' : 'View Schedule'}
            <Icon path="M5 12h14M13 6l6 6-6 6" size={14} width={2} />
          </button>
        </section>

        <section style={{ ...cardStyle, flex: '1 1 210px', minWidth: 0, padding: 18, display: 'flex', flexDirection: 'column', gap: 13 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#71717a' }}>{isRtl ? 'مكافآت التحديات المعلّقة' : 'Pending Rewards'}</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
            <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.86, color: ACCENT }}>{pendingRewards}</span>
          </div>
          <span style={{ fontSize: 11, color: '#a1a1aa' }}>{isRtl ? 'مشاركة محتاجة منح نقاط' : 'challenge submissions to award'}</span>
        </section>
      </div>

      {/* Row 3: Action Center + Today's Schedule */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 14 }}>
        <section style={{ ...cardStyle, flex: '1.3 1 400px', minWidth: 0, padding: '20px 20px 6px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>{isRtl ? 'مركز الإجراءات' : 'Action Center'}</h2>
              {actionItems.length > 0 && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: ACCENT, background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 999, padding: '2px 8px' }}>{actionItems.length} {isRtl ? 'معلّق' : 'pending'}</span>
              )}
            </div>
          </div>
          {actionItems.length === 0 ? (
            <p style={{ padding: '20px 2px 24px', color: '#a1a1aa', fontSize: 12.5, textAlign: 'center' }}>{isRtl ? 'كل حاجة متصحّحة، مفيش إجراءات معلّقة' : "You're all caught up — no pending actions"}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {actionItems.map((item, idx) => {
                const sec = findSectionByName(item.className);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 2px', borderTop: '1px solid #f4f4f5' }}>
                    <span style={{ width: 34, height: 34, borderRadius: 11, background: '#fff7ed', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 34px' }}>
                      <Icon path={item.kind === 'quiz' ? 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z' : 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{item.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: '#3f3f46', background: '#f4f4f5', borderRadius: 6, padding: '2px 7px' }}>{item.className}</span>
                        <span style={{ fontSize: 11, color: '#a1a1aa' }}>{item.detail}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => sec && goToAssessments(sec.id, scopedSubjects[0] || subjectsAll[0])}
                      style={{ whiteSpace: 'nowrap', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#fff', background: `linear-gradient(180deg,#fb923c,${ACCENT})`, border: `1px solid ${ACCENT}`, borderRadius: 9, padding: '8px 18px', cursor: 'pointer' }}
                    >
                      {isRtl ? 'ابدأ' : 'Start'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section style={{ ...cardStyle, flex: '1 1 320px', minWidth: 0, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>{isRtl ? 'جدول اليوم' : "Today's Schedule"}</h2>
          </div>
          {schedule.length === 0 ? (
            <p style={{ color: '#a1a1aa', fontSize: 12.5, textAlign: 'center', padding: '20px 0' }}>{isRtl ? 'مفيش حصص اليوم' : 'No periods today'}</p>
          ) : (
            <div>
              {schedule.map((item, idx) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '44px 14px minmax(0,1fr)', columnGap: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: item.isLive ? 700 : 600, color: item.isLive ? ACCENT : '#71717a', paddingTop: 3 }}>{item.time}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: item.isLive ? ACCENT : '#09090b', marginTop: 6 }} />
                    {idx < schedule.length - 1 && <span style={{ flex: 1, width: 1.5, background: '#f4f4f5' }} />}
                  </span>
                  <div style={{ paddingBottom: 15 }}>
                    {item.isLive ? (
                      <div style={{ background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', border: '1px solid #fed7aa', borderRadius: 16, padding: '14px 15px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c2410c' }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: ACCENT }} /> {isRtl ? 'مباشر' : 'Live'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{item.title}</span>
                          <span style={{ fontSize: 11, color: '#b45309' }}>{item.className}</span>
                        </div>
                        <a href={item.joinUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#fff', background: `linear-gradient(180deg,#fb923c,${ACCENT})`, border: 'none', borderRadius: 11, padding: '11px 16px', textDecoration: 'none' }}>
                          <Icon path="m10 8 6 4-6 4V8z" size={15} width={2} /> {isRtl ? 'انضم للبث' : 'Join Live Stream'}
                        </a>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</span>
                        <span style={{ alignSelf: 'flex-start', fontSize: 10.5, fontWeight: 600, color: '#3f3f46', background: '#fafafa', border: '1px solid #f0f0f2', borderRadius: 7, padding: '3px 8px' }}>{item.className}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Content Progression */}
      <section style={{ ...cardStyle, marginTop: 14, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>{isRtl ? 'تقدّم المحتوى' : 'Content Progression'}</h2>
        </div>
        {progression.length === 0 ? (
          <p style={{ color: '#a1a1aa', fontSize: 12.5, textAlign: 'center', padding: '20px 0' }}>{isRtl ? 'مفيش دروس مضافة لسه' : 'No lessons added yet'}</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {progression.map((p, idx) => {
              const pct = p.total > 0 ? (p.completed / p.total) * 100 : 0;
              return (
                <div key={idx} style={{ flex: '1 1 240px', minWidth: 0, border: '1px solid #f4f4f5', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.className} · {p.subject}</span>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 0.9 }}>{p.completed}</span>
                    <span style={{ fontSize: 11.5, color: '#a1a1aa', paddingBottom: 2 }}>{isRtl ? `من ${p.total} درس` : `of ${p.total} lessons`}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: '#f4f4f5', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#fdba74,#ea580c)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      </>
      )}
    </div>
  );
}
