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
  for (const sec of sections) {
    const byPeriod = await getAttendanceForDate(sec.id, today);
    Object.values(byPeriod).forEach((statuses) => {
      Object.entries(statuses).forEach(([studentId, status]) => {
        total++;
        if (status === 'present' || status === 'late') present++;
        else if (status === 'absent') absentStudentIds.push(studentId);
      });
    });
  }
  return { present, total, absentStudentIds };
}

// بيجيب ملخص التصحيح المطلوب (واجبات + كويزات) عبر كل فصول المعلم والمواد
export async function getGradingSummaries(sections: LearnClassSection[], subjects: string[], teacherId: string): Promise<{ assignments: GradingSummary[]; quizzes: GradingSummary[] }> {
  const assignments: GradingSummary[] = [];
  const quizzes: GradingSummary[] = [];

  for (const sec of sections) {
    for (const subject of subjects) {
      const scope = { teacherId, classId: sec.id, subject };
      const [assList, quizList] = await Promise.all([getAssignments(scope), getQuizzes(scope)]);

      for (const a of assList) {
        if (a.status !== 'Active') continue;
        const subs = await getSubmissionsForAssignment(a.id, sec.id);
        const submitted = subs.filter((s) => s.submittedAt);
        const toGrade = submitted.filter((s) => s.grade === null).length;
        if (toGrade > 0) {
          assignments.push({ toGrade, totalSubmissions: submitted.length, className: sec.name, title: a.title, assessmentId: a.id, type: 'assignment' });
        }
      }

      for (const q of quizList) {
        if (q.status !== 'Active') continue;
        const attempts = await getQuizAttemptsForQuiz(q.id, sec.id);
        const needsReview = attempts.filter((at: any) => at.needsManualReview && at.status === 'submitted');
        if (needsReview.length > 0) {
          quizzes.push({ toGrade: needsReview.length, totalSubmissions: attempts.length, className: sec.name, title: q.title, assessmentId: q.id, type: 'quiz' });
        }
      }
    }
  }
  return { assignments, quizzes };
}

// بيجيب جدول النهاردة الحقيقي (حصص أسبوعية + حصص مباشرة) لكل فصول المعلم، مرتب بالوقت
export async function getTodaySchedule(sections: LearnClassSection[], subjects: string[]): Promise<ScheduleItem[]> {
  const items: ScheduleItem[] = [];
  const today = new Date();
  const arabicDayName = WEEK_DAY_MAP_AR[today.getDay()];
  const todayKey = today.toISOString().slice(0, 10);

  for (const sec of sections) {
    const periods = await getPeriods(sec.id);
    periods.filter((p) => p.day === arabicDayName).forEach((p) => {
      items.push({ id: `period-${p.id}`, time: p.startTime, title: p.subject, className: sec.name, isLive: false });
    });

    for (const subject of subjects) {
      const sessions = await getLiveSessions(sec.id, subject);
      sessions.forEach((s) => {
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
    }
  }

  return items.sort((a, b) => a.time.localeCompare(b.time));
}

// بيجيب تقدّم المحتوى الحقيقي (عدد الدروس المكتملة من إجمالي الدروس) لكل فصل ومادة
export async function getContentProgression(sections: LearnClassSection[], subjects: string[], teacherId: string): Promise<ProgressionItem[]> {
  const results: ProgressionItem[] = [];
  for (const sec of sections) {
    for (const subject of subjects) {
      const units = await getUnits({ teacherId, classId: sec.id, subject });
      if (units.length === 0) continue;
      const lessons = await getLessons(units.map((u) => u.id));
      const completed = lessons.filter((l) => l.isComplete).length;
      results.push({ className: sec.name, subject, completed, total: lessons.length });
    }
  }
  return results;
}

// بيجيب عدد "المكافآت" (نقاط تحدي) اللي لسه محتاجة تصحيح/منح نقاط
export async function getPendingRewardsCount(sections: LearnClassSection[], subjects: string[]): Promise<number> {
  let pending = 0;
  for (const sec of sections) {
    for (const subject of subjects) {
      const challenge = await getActiveChallenge(sec.id, subject);
      if (!challenge) continue;
      const subs = await getChallengeSubmissions(challenge.id);
      pending += subs.filter((s) => s.xpAwarded === null).length;
    }
  }
  return pending;
}
