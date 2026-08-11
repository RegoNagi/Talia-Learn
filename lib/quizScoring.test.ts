import { describe, it, expect } from 'vitest';
import { calculateQuizScore } from './quizScoring';
import type { QuizQuestion } from '@/services/assignmentData';

describe('calculateQuizScore', () => {
  it('يدي الطالب صفر لو مفيش أي أسئلة', () => {
    const result = calculateQuizScore([], {});
    expect(result).toEqual({ score: 0, maxScore: 0, needsManualReview: false });
  });

  it('يحسب اختيار من متعدد صح وغلط صح', () => {
    const questions: QuizQuestion[] = [
      { id: 'q1', text: '', type: 'multiple_choice', points: 5, options: [
        { id: 'a', text: 'خطأ', isCorrect: false },
        { id: 'b', text: 'صح', isCorrect: true },
      ] },
    ];
    expect(calculateQuizScore(questions, { q1: 'b' })).toEqual({ score: 5, maxScore: 5, needsManualReview: false });
    expect(calculateQuizScore(questions, { q1: 'a' })).toEqual({ score: 0, maxScore: 5, needsManualReview: false });
    expect(calculateQuizScore(questions, {})).toEqual({ score: 0, maxScore: 5, needsManualReview: false });
  });

  it('يحسب صح أم خطأ بنفس منطق الاختيار من متعدد', () => {
    const questions: QuizQuestion[] = [
      { id: 'q1', text: '', type: 'true_false', points: 2, options: [
        { id: 'true', text: 'صح', isCorrect: true },
        { id: 'false', text: 'خطأ', isCorrect: false },
      ] },
    ];
    expect(calculateQuizScore(questions, { q1: 'true' }).score).toBe(2);
  });

  it('يقبل الإجابة الرقمية جوه هامش السماحية ويرفض برّاها', () => {
    const questions: QuizQuestion[] = [
      { id: 'q1', text: '', type: 'numeric_answer', points: 10, numericAnswer: 100, numericTolerance: 2 },
    ];
    expect(calculateQuizScore(questions, { q1: '101' }).score).toBe(10);
    expect(calculateQuizScore(questions, { q1: '98' }).score).toBe(10);
    expect(calculateQuizScore(questions, { q1: '95' }).score).toBe(0);
    expect(calculateQuizScore(questions, { q1: 'مش رقم' }).score).toBe(0);
  });

  it('يدي درجة جزئية للمطابقة على حسب عدد الأزواج الصح', () => {
    const questions: QuizQuestion[] = [
      { id: 'q1', text: '', type: 'matching', points: 4, pairs: [
        { id: 'p1', left: 'A', right: '1' },
        { id: 'p2', left: 'B', right: '2' },
      ] },
    ];
    expect(calculateQuizScore(questions, { q1: { p1: '1', p2: 'wrong' } }).score).toBe(2);
    expect(calculateQuizScore(questions, { q1: { p1: '1', p2: '2' } }).score).toBe(4);
  });

  it('يدي درجة جزئية للترتيب على حسب المواقع الصح', () => {
    const questions: QuizQuestion[] = [
      { id: 'q1', text: '', type: 'ordering', points: 3, orderItems: ['A', 'B', 'C'] },
    ];
    expect(calculateQuizScore(questions, { q1: ['A', 'B', 'C'] }).score).toBe(3);
    expect(calculateQuizScore(questions, { q1: ['A', 'C', 'B'] }).score).toBe(1);
  });

  it('يدي درجة جزئية للتصنيف على حسب العناصر الصح', () => {
    const questions: QuizQuestion[] = [
      { id: 'q1', text: '', type: 'classification', points: 2, classifyItems: [
        { text: 'قطة', category: 'حيوان' },
        { text: 'وردة', category: 'نبات' },
      ] },
    ];
    expect(calculateQuizScore(questions, { q1: { 0: 'حيوان', 1: 'نبات' } }).score).toBe(2);
    expect(calculateQuizScore(questions, { q1: { 0: 'حيوان', 1: 'حيوان' } }).score).toBe(1);
  });

  it('يدي درجة جزئية للسحب والإفلات على حسب العناصر الصح', () => {
    const questions: QuizQuestion[] = [
      { id: 'q1', text: '', type: 'drag_and_drop', points: 4, dragItems: [
        { text: 'X', zone: 'zoneA' },
        { text: 'Y', zone: 'zoneB' },
      ] },
    ];
    expect(calculateQuizScore(questions, { q1: { X: 'zoneA', Y: 'zoneB' } }).score).toBe(4);
    expect(calculateQuizScore(questions, { q1: { X: 'zoneB', Y: 'zoneB' } }).score).toBe(2);
  });

  it('يحسب المنطقة التفاعلية (hotspot) صح وغلط', () => {
    const questions: QuizQuestion[] = [
      { id: 'q1', text: '', type: 'hotspot', points: 5, hotspots: [
        { xPercent: 10, yPercent: 10, label: 'A', isCorrect: false },
        { xPercent: 50, yPercent: 50, label: 'B', isCorrect: true },
      ] },
    ];
    expect(calculateQuizScore(questions, { q1: 1 }).score).toBe(5);
    expect(calculateQuizScore(questions, { q1: 0 }).score).toBe(0);
  });

  it('القطعة بأسئلة فرعية اختيارية بس تتحسب أوتوماتيك، وميحتاجش مراجعة', () => {
    const questions: QuizQuestion[] = [
      { id: 'q1', text: '', type: 'passage', points: 0, subQuestions: [
        { id: 'sq1', title: '', type: 'اختيار من متعدد', points: 3, options: [
          { id: 'a', text: '', isCorrect: true },
          { id: 'b', text: '', isCorrect: false },
        ] },
      ] },
    ];
    const result = calculateQuizScore(questions, { q1: { sq1: 'a' } });
    expect(result.score).toBe(3);
    expect(result.needsManualReview).toBe(false);
  });

  it('القطعة بسؤال فرعي إجابة قصيرة تحتاج مراجعة يدوية إلزامية', () => {
    const questions: QuizQuestion[] = [
      { id: 'q1', text: '', type: 'passage', points: 0, subQuestions: [
        { id: 'sq1', title: '', type: 'إجابة قصيرة', points: 3 },
      ] },
    ];
    const result = calculateQuizScore(questions, { q1: {} });
    expect(result.needsManualReview).toBe(true);
  });

  it('short_answer و file_upload لازم يتعلّموا كـ يحتاجوا مراجعة يدوية دايمًا', () => {
    const shortAnswer: QuizQuestion[] = [{ id: 'q1', text: '', type: 'short_answer', points: 5 }];
    const fileUpload: QuizQuestion[] = [{ id: 'q1', text: '', type: 'file_upload', points: 5 }];
    expect(calculateQuizScore(shortAnswer, {}).needsManualReview).toBe(true);
    expect(calculateQuizScore(fileUpload, {}).needsManualReview).toBe(true);
  });

  it('يجمع الدرجة الكلية من أسئلة متعددة الأنواع صح', () => {
    const questions: QuizQuestion[] = [
      { id: 'q1', text: '', type: 'multiple_choice', points: 5, options: [{ id: 'a', text: '', isCorrect: true }] },
      { id: 'q2', text: '', type: 'numeric_answer', points: 3, numericAnswer: 10, numericTolerance: 0 },
    ];
    const result = calculateQuizScore(questions, { q1: 'a', q2: '10' });
    expect(result.score).toBe(8);
    expect(result.maxScore).toBe(8);
  });
});
