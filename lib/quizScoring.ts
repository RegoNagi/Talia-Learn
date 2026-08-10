import type { QuizQuestion } from '@/services/assignmentData';

// منطق تصحيح الاختبارات الآلي — منفصل عمدًا عن أي استدعاء لقاعدة البيانات
// عشان نقدر نختبره بدون أي اتصال حقيقي، ونتأكد إن حساب الدرجات صحيح
// قبل ما أي طالب حقيقي ياخد درجة غلط.
export interface QuizScoreResult {
  score: number;
  maxScore: number;
  needsManualReview: boolean;
}

export function calculateQuizScore(questions: QuizQuestion[], answers: Record<string, any>): QuizScoreResult {
  let score = 0;
  let maxScore = 0;
  let needsManualReview = false;

  for (const q of questions || []) {
    maxScore += q.points || 0;
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      const correctOption = (q.options || []).find((o) => o.isCorrect);
      const studentAnswer = answers[q.id];
      if (correctOption && studentAnswer === correctOption.id) {
        score += q.points || 0;
      }
    } else if (q.type === 'numeric_answer') {
      const studentAnswer = parseFloat(answers[q.id]);
      const correctValue = typeof q.numericAnswer === 'number' ? q.numericAnswer : NaN;
      const tolerance = q.numericTolerance || 0;
      if (!isNaN(studentAnswer) && !isNaN(correctValue) && Math.abs(studentAnswer - correctValue) <= tolerance) {
        score += q.points || 0;
      }
    } else if (q.type === 'matching' && Array.isArray(q.pairs) && q.pairs.length > 0) {
      const studentPairs = answers[q.id] || {};
      const correctCount = q.pairs.filter((p) => studentPairs[p.id] === p.right).length;
      score += (q.points || 0) * (correctCount / q.pairs.length);
    } else if (q.type === 'ordering' && Array.isArray(q.orderItems) && q.orderItems.length > 0) {
      const studentOrder: string[] = answers[q.id] || [];
      const correctPositions = q.orderItems.filter((item, idx) => studentOrder[idx] === item).length;
      score += (q.points || 0) * (correctPositions / q.orderItems.length);
    } else if (q.type === 'classification' && Array.isArray(q.classifyItems) && q.classifyItems.length > 0) {
      const studentAnswers = answers[q.id] || {};
      const correctCount = q.classifyItems.filter((item, idx) => studentAnswers[idx] === item.category).length;
      score += (q.points || 0) * (correctCount / q.classifyItems.length);
    } else if (q.type === 'drag_and_drop' && Array.isArray(q.dragItems) && q.dragItems.length > 0) {
      const studentAssignments = answers[q.id] || {};
      const correctCount = q.dragItems.filter((item) => studentAssignments[item.text] === item.zone).length;
      score += (q.points || 0) * (correctCount / q.dragItems.length);
    } else if (q.type === 'hotspot' && Array.isArray(q.hotspots) && q.hotspots.length > 0) {
      const selectedIdx = answers[q.id];
      const selectedHotspot = typeof selectedIdx === 'number' ? q.hotspots[selectedIdx] : null;
      if (selectedHotspot && selectedHotspot.isCorrect) {
        score += q.points || 0;
      }
    } else if (q.type === 'passage' && Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
      const subAnswers = answers[q.id] || {};
      for (const sq of q.subQuestions) {
        if (sq.type === 'اختيار من متعدد' || sq.type === 'صح أم خطأ') {
          const correctOption = (sq.options || []).find((o) => o.isCorrect);
          if (correctOption && subAnswers[sq.id] === correctOption.id) {
            score += sq.points || 0;
          }
        } else {
          // الأسئلة الفرعية "إجابة قصيرة" محتاجة مراجعة يدوية من المعلم
          needsManualReview = true;
        }
      }
    } else {
      // short_answer و file_upload محتاجين مراجعة يدوية من المعلم
      needsManualReview = true;
    }
  }

  return { score, maxScore, needsManualReview };
}
