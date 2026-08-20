import { supabase } from '@/lib/supabaseClient';
import { getMyClassSections, getStudentsByIds, getAttendancePercentagesForStudents } from './attendanceData';
import { getGradebookConfigFull, getRealAssessments, getRealGradeEntries } from './gradebookSync';
import { getRecentNotesForStudents } from './rosterData';

export interface StudentRiskData {
  id: string;
  name: string;
  grade: string;
  className: string;
  attendance: number;
  overallAverage: number | null; // متوسط أداء الطالب في كل التقييمات اللي أخدها فعليًا، بغض النظر عن المادة — null لو لسه مفيش درجات مسجّلة
  gradedCount: number; // عدد التقييمات المحسوبة في المتوسط ده
  recentNote: string | null;
}

// بيجيب بيانات الرادار الحقيقية لكل طلاب المعلم: الحضور، متوسط الأداء (على كل مادة أو مادة واحدة لو اتحددت)، وآخر ملاحظة سلوكية
export async function getRiskDataForTeacher(teacherId: string, subjects: string[], subjectFilter?: string): Promise<StudentRiskData[]> {
  const sections = await getMyClassSections(teacherId);
  const allStudentIds = Array.from(new Set(sections.flatMap((s) => s.students)));
  if (allStudentIds.length === 0) return [];

  const classByStudent: Record<string, { name: string; grade: string }> = {};
  sections.forEach((sec) => sec.students.forEach((sid) => { classByStudent[sid] = { name: sec.name, grade: sec.gradeLevel }; }));

  const [studentRows, attendanceMap] = await Promise.all([
    getStudentsByIds(allStudentIds),
    getAttendancePercentagesForStudents(allStudentIds),
  ]);

  const scopedSubjects = subjectFilter && subjectFilter !== 'all' ? [subjectFilter] : subjects;

  // لكل مادة بيدرّسها المعلم (أو مادة واحدة بس لو اتفلترت) ولكل صف من صفوفه، بنجمع كل الدرجات الحقيقية المسجّلة
  // studentPercentages[studentId] = مصفوفة بكل نسبة درجة (score/maxScore * 100) حصلها الطالب في أي تقييم
  const studentPercentages: Record<string, number[]> = {};
  for (const grade of new Set(sections.map((s) => s.gradeLevel))) {
    for (const subject of scopedSubjects) {
      const config = await getGradebookConfigFull(subject, grade);
      if (!config) continue;
      const [assessments, entries] = await Promise.all([
        getRealAssessments(config.id),
        getRealGradeEntries(config.id),
      ]);
      const maxScoreByAssessment: Record<string, number> = {};
      assessments.forEach((a) => { maxScoreByAssessment[a.id] = a.maxScore; });

      entries.forEach((e) => {
        if (e.score === null || e.score === undefined) return;
        const maxScore = maxScoreByAssessment[e.assessmentId];
        if (!maxScore) return;
        if (!studentPercentages[e.studentId]) studentPercentages[e.studentId] = [];
        studentPercentages[e.studentId].push((e.score / maxScore) * 100);
      });
    }
  }

  const recentNotesByStudent = await getRecentNotesForStudents(studentRows.map((s) => s.id));

  const results: StudentRiskData[] = [];
  for (const s of studentRows) {
    const cls = classByStudent[s.id];
    if (!cls) continue;

    const percentages = studentPercentages[s.id] || [];
    const overallAverage = percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : null;

    results.push({
      id: s.id,
      name: s.name,
      grade: cls.grade,
      className: cls.name,
      attendance: attendanceMap[s.id] ?? 0,
      overallAverage,
      gradedCount: percentages.length,
      recentNote: recentNotesByStudent[s.id] || null,
    });
  }
  return results;
}


export interface RiskSettings {
  criticalAttendance: number;
  criticalMinAverage: number;
  warningAttendance: number;
  warningMinAverage: number;
}

const DEFAULT_RISK_SETTINGS: RiskSettings = {
  criticalAttendance: 75,
  criticalMinAverage: 50,
  warningAttendance: 85,
  warningMinAverage: 65,
};

// بيجيب معايير التحذير المبكر الحقيقية بتاعة المدرسة (إعداد واحد للمدرسة كلها، بيتعدّل من Talia 360 — الدرجات من Gradebook والحضور من تاب الحضور)
export async function getRiskSettings(): Promise<RiskSettings> {
  const { data, error } = await supabase.from('early_warning_criteria').select('*').limit(1).maybeSingle();
  if (error || !data) return DEFAULT_RISK_SETTINGS;
  return {
    criticalAttendance: data.critical_attendance,
    criticalMinAverage: data.critical_min_average,
    warningAttendance: data.warning_attendance,
    warningMinAverage: data.warning_min_average,
  };
}
