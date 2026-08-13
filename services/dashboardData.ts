import { supabase } from '@/lib/supabaseClient';
import { getMyClassSections, getPeriods, getAttendanceForDate, LearnClassSection } from './attendanceData';
import { getAssignments, getQuizzes, getSubmissionsForAssignment, getQuizAttemptsForQuiz } from './assignmentData';
import { getLiveSessions } from './liveSessionsData';
import { getActiveChallenge, getChallengeSubmissions } from './classSpaceData';
import { getUnits, getLessons } from './learningPathData';

const WEEK_DAY_MAP_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export interface DashboardScope {
  teacherId: string;
  subjects: string[];
}

export interface AttendanceSummary {
  present: number;
  total: number;
  absentStudentIds: string[];
}

export interface GradingSummary {
  toGrade: number;
  totalSubmissions: number;
  className: string;
  title: string;
  assessmentId: string;
  type: 'assignment' | 'quiz';
  category?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  className: string;
  isLive: boolean;
  joinUrl?: string;
  room?: string;
}

export interface ProgressionItem {
  className: string;
  subject: string;
  completed: number;
  total: number;
}

export interface ActionItem {
  id: string;
  title: string;
  className: string;
  detail: string;
  type: 'assignment' | 'quiz' | 'attendance';
  targetClassId?: string;
  targetSubject?: string;
}

// بيجيب نسبة الحضور الحقيقية للنهاردة عبر كل فصول المعلم
export async function getTodayAttendanceSummary(sections: LearnClassSection[]): Promise<AttendanceSummary> {
  const today = new Date().toISOString().slice(0, 10);
  let present = 0;
  let total = 0;
  const absentStudentIds: string[] = [];
  const allByPeriod = await Promise.all(sections.map((sec) => getAttendanceForDate(sec.id, today)));
  allByPeriod.forEach((byPeriod) => {
    Object.values(byPeriod).forEach((statuses) => {
      Object.entries(statuses).forEach(([studentId, status]) => {
        total++;
        if (status === 'present' || status === 'late') present++;
        else if (status === 'absent') absentStudentIds.push(studentId);
      });
    });
  });
  return { present, total, absentStudentIds };
}

// بيجيب ملخص التصحيح المطلوب (واجبات + كويزات) عبر كل فصول المعلم والمواد
export async function getGradingSummaries(sections: LearnClassSection[], subjects: string[], teacherId: string): Promise<{ assignments: GradingSummary[]; quizzes: GradingSummary[] }> {
  const combos = sections.flatMap((sec) => subjects.map((subject) => ({ sec, subject })));

  const perCombo = await Promise.all(combos.map(async ({ sec, subject }) => {
    const scope = { teacherId, classId: sec.id, subject };
    const [assList, quizList] = await Promise.all([getAssignments(scope), getQuizzes(scope)]);

    const activeAssignments = assList.filter((a) => a.status === 'Active');
    const activeQuizzes = quizList.filter((q) => q.status === 'Active');

    const [assignmentResults, quizResults] = await Promise.all([
      Promise.all(activeAssignments.map(async (a) => {
        const subs = await getSubmissionsForAssignment(a.id, sec.id);
        const submitted = subs.filter((s) => s.submittedAt);
        const toGrade = submitted.filter((s) => s.grade === null).length;
        return toGrade > 0 ? { toGrade, totalSubmissions: submitted.length, className: sec.name, title: a.title, assessmentId: a.id, type: 'assignment' as const, category: a.settings?.category || '' } : null;
      })),
      Promise.all(activeQuizzes.map(async (q) => {
        const attempts = await getQuizAttemptsForQuiz(q.id, sec.id);
        const needsReview = attempts.filter((at: any) => at.needsManualReview && at.status === 'submitted');
        return needsReview.length > 0 ? { toGrade: needsReview.length, totalSubmissions: attempts.length, className: sec.name, title: q.title, assessmentId: q.id, type: 'quiz' as const } : null;
      })),
    ]);

    return { assignmentResults, quizResults };
  }));

  const assignments: GradingSummary[] = [];
  const quizzes: GradingSummary[] = [];
  perCombo.forEach(({ assignmentResults, quizResults }) => {
    assignmentResults.forEach((r) => { if (r) assignments.push(r); });
    quizResults.forEach((r) => { if (r) quizzes.push(r); });
  });
  return { assignments, quizzes };
}

// بيجيب جدول النهاردة الحقيقي (حصص أسبوعية + حصص مباشرة) لكل فصول المعلم، مرتب بالوقت
export async function getTodaySchedule(sections: LearnClassSection[], subjects: string[]): Promise<ScheduleItem[]> {
  const items: ScheduleItem[] = [];
  const today = new Date();
  const arabicDayName = WEEK_DAY_MAP_AR[today.getDay()];
  const todayKey = today.toISOString().slice(0, 10);

  const combos = sections.flatMap((sec) => subjects.map((subject) => ({ sec, subject })));

  const [periodsBySections, sessionsByCombo] = await Promise.all([
    Promise.all(sections.map((sec) => getPeriods(sec.id))),
    Promise.all(combos.map(({ sec, subject }) => getLiveSessions(sec.id, subject))),
  ]);

  sections.forEach((sec, i) => {
    periodsBySections[i].filter((p) => p.day === arabicDayName).forEach((p) => {
      items.push({ id: `period-${p.id}`, time: p.startTime, title: p.subject, className: sec.name, isLive: false });
    });
  });

  combos.forEach(({ sec }, i) => {
    sessionsByCombo[i].forEach((s) => {
      if (new Date(s.scheduledAt).toISOString().slice(0, 10) === todayKey) {
        items.push({
          id: `live-${s.id}`,
          time: new Date(s.scheduledAt).toTimeString().slice(0, 5),
          title: s.title,
          className: sec.name,
          isLive: true,
          joinUrl: s.joinUrl,
        });
      }
    });
  });

  return items.sort((a, b) => a.time.localeCompare(b.time));
}

// بيجيب تقدّم المحتوى الحقيقي (عدد الدروس المكتملة من إجمالي الدروس) لكل فصل ومادة
export async function getContentProgression(sections: LearnClassSection[], subjects: string[], teacherId: string): Promise<ProgressionItem[]> {
  const combos = sections.flatMap((sec) => subjects.map((subject) => ({ sec, subject })));
  const perCombo = await Promise.all(combos.map(async ({ sec, subject }) => {
    const units = await getUnits({ teacherId, classId: sec.id, subject });
    if (units.length === 0) return null;
    const lessons = await getLessons(units.map((u) => u.id));
    const completed = lessons.filter((l) => l.isComplete).length;
    return { className: sec.name, subject, completed, total: lessons.length };
  }));
  return perCombo.filter((r): r is ProgressionItem => r !== null);
}

// بيجيب عدد "المكافآت" (نقاط تحدي) اللي لسه محتاجة تصحيح/منح نقاط
export async function getPendingRewardsCount(sections: LearnClassSection[], subjects: string[]): Promise<number> {
  const combos = sections.flatMap((sec) => subjects.map((subject) => ({ sec, subject })));
  const perCombo = await Promise.all(combos.map(async ({ sec, subject }) => {
    const challenge = await getActiveChallenge(sec.id, subject);
    if (!challenge) return 0;
    const subs = await getChallengeSubmissions(challenge.id);
    return subs.filter((s) => s.xpAwarded === null).length;
  }));
  return perCombo.reduce((a, b) => a + b, 0);
}
