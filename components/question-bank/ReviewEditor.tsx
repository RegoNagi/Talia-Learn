'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { BankQuestion, BankQuestionContent } from '@/services/questionBankData';

const DIFFICULTIES = ['سهل', 'متوسط', 'صعب'];
const BLOOMS = ['تذكر', 'فهم', 'تطبيق', 'تحليل', 'تقييم', 'ابتكار'];
const OPTION_TYPES = ['اختيار من متعدد', 'صح أم خطأ', 'مقطع صوتي'];
const EDITABLE_TYPES = [...OPTION_TYPES, 'أكمل الفراغ', 'إجابة قصيرة', 'إجابة رقمية', 'سؤال مقالي', 'توصيل', 'ترتيب'];

export interface ReviewPatch {
  unit: string;
  lesson: string | null;
  bloomLevel: string;
  difficulty: string;
  question: BankQuestionContent;
}

interface Props {
  q: BankQuestion;
  language: 'ar' | 'en';
  saving: boolean;
  onSave: (patch: ReviewPatch, approveAfter: boolean) => void;
  onCancel: () => void;
}

const input = 'w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-violet-400';
const label = 'flex flex-col gap-1 text-xs font-bold text-slate-500';

export function ReviewEditor({ q, language, saving, onSave, onCancel }: Props) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const c = q.question || ({ title: q.title } as BankQuestionContent);

  const [title, setTitle] = useState(q.title);
  const [unit, setUnit] = useState(q.unit || '');
  const [lesson, setLesson] = useState(q.lesson || '');
  const [bloom, setBloom] = useState(q.bloomLevel);
  const [difficulty, setDifficulty] = useState(q.difficulty);
  const [options, setOptions] = useState(() => (c.options || []).map((o, i) => ({ ...o, id: o.id || String(i + 1) })));
  const [correctAnswer, setCorrectAnswer] = useState(c.correctAnswer || '');
  const [modelAnswer, setModelAnswer] = useState(c.modelAnswer || '');
  const [numAnswer, setNumAnswer] = useState(c.numericAnswer === null || c.numericAnswer === undefined ? '' : String(c.numericAnswer));
  const [numTol, setNumTol] = useState(String(c.numericTolerance ?? 0));
  const [numUnit, setNumUnit] = useState(c.numericUnit || '');
  const [pairs, setPairs] = useState(() => (c.pairs || []).map((p) => ({ ...p })));
  const [orderItems, setOrderItems] = useState<string[]>(() => [...(c.orderItems || [])]);

  const canEditContent = EDITABLE_TYPES.includes(q.type);
  const hasOptions = OPTION_TYPES.includes(q.type);

  const build = (): ReviewPatch => {
    const content: BankQuestionContent = { ...c, title: title.trim() };
    if (hasOptions) {
      content.options = options;
      content.correctOption = Math.max(0, options.findIndex((o) => o.isCorrect));
    }
    if (q.type === 'أكمل الفراغ' || q.type === 'إجابة قصيرة') content.correctAnswer = correctAnswer.trim() || undefined;
    if (q.type === 'سؤال مقالي') content.modelAnswer = modelAnswer.trim() || undefined;
    if (q.type === 'إجابة رقمية') {
      content.numericAnswer = numAnswer.trim() === '' || Number.isNaN(Number(numAnswer)) ? null : Number(numAnswer);
      content.numericTolerance = Number(numTol) || 0;
      content.numericUnit = numUnit.trim() || undefined;
    }
    if (q.type === 'توصيل') content.pairs = pairs;
    if (q.type === 'ترتيب') content.orderItems = orderItems;
    return { unit: unit.trim() || q.unit, lesson: lesson.trim() || null, bloomLevel: bloom, difficulty, question: content };
  };

  return (
    <div className="bg-white border border-violet-200 rounded-2xl p-6 space-y-5">
      <p className="text-xs text-violet-700 bg-violet-50 rounded-lg px-3 py-2">{t('أي تعديل هنا بيتسجل في سجل المراجعة باسمك.', 'Every edit here is recorded in the review log under your name.')}</p>

      <label className={label}>
        {t('نص السؤال', 'Question text')}
        <textarea className="w-full min-h-20 p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-violet-400" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={label}>{t('الوحدة', 'Unit')}<input className={input} value={unit} onChange={(e) => setUnit(e.target.value)} /></label>
        <label className={label}>{t('الدرس', 'Lesson')}<input className={input} value={lesson} onChange={(e) => setLesson(e.target.value)} /></label>
        <label className={label}>{t('الصعوبة', 'Difficulty')}
          <select className={input} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>{DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}</select>
        </label>
        <label className={label}>{t('مستوى بلوم', 'Bloom level')}
          <select className={input} value={bloom} onChange={(e) => setBloom(e.target.value)}>{BLOOMS.map((b) => <option key={b}>{b}</option>)}</select>
        </label>
      </div>

      {hasOptions && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500">{t('الخيارات (اختار الإجابة الصحيحة)', 'Options (pick the correct one)')}</p>
          {options.map((o, i) => (
            <div key={o.id} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={o.isCorrect} onChange={() => setOptions((prev) => prev.map((x, j) => ({ ...x, isCorrect: j === i })))} />
              <input className={input} value={o.text} onChange={(e) => setOptions((prev) => prev.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
              {q.type === 'اختيار من متعدد' && options.length > 2 && (
                <button onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600" aria-label="remove"><Trash2 size={16} /></button>
              )}
            </div>
          ))}
          {q.type === 'اختيار من متعدد' && options.length < 6 && (
            <button onClick={() => setOptions((prev) => [...prev, { id: `n${Date.now()}`, text: '', isCorrect: false }])} className="text-xs font-bold text-violet-700 flex items-center gap-1"><Plus size={14} />{t('إضافة خيار', 'Add option')}</button>
          )}
        </div>
      )}

      {(q.type === 'أكمل الفراغ' || q.type === 'إجابة قصيرة') && (
        <label className={label}>{t('الإجابة الصحيحة', 'Correct answer')}<input className={input} value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} /></label>
      )}

      {q.type === 'سؤال مقالي' && (
        <label className={label}>{t('الإجابة النموذجية', 'Model answer')}
          <textarea className="w-full min-h-20 p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-violet-400" value={modelAnswer} onChange={(e) => setModelAnswer(e.target.value)} />
        </label>
      )}

      {q.type === 'إجابة رقمية' && (
        <div className="grid grid-cols-3 gap-4">
          <label className={label}>{t('الإجابة', 'Answer')}<input className={input} inputMode="decimal" value={numAnswer} onChange={(e) => setNumAnswer(e.target.value)} /></label>
          <label className={label}>{t('هامش الخطأ ±', 'Tolerance ±')}<input className={input} inputMode="decimal" value={numTol} onChange={(e) => setNumTol(e.target.value)} /></label>
          <label className={label}>{t('الوحدة', 'Unit')}<input className={input} value={numUnit} onChange={(e) => setNumUnit(e.target.value)} /></label>
        </div>
      )}

      {q.type === 'توصيل' && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500">{t('الأزواج', 'Pairs')}</p>
          {pairs.map((p, i) => (
            <div key={p.id || i} className="flex items-center gap-2">
              <input className={input} value={p.left} onChange={(e) => setPairs((prev) => prev.map((x, j) => (j === i ? { ...x, left: e.target.value } : x)))} />
              <input className={input} value={p.right} onChange={(e) => setPairs((prev) => prev.map((x, j) => (j === i ? { ...x, right: e.target.value } : x)))} />
              {pairs.length > 2 && <button onClick={() => setPairs((prev) => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600" aria-label="remove"><Trash2 size={16} /></button>}
            </div>
          ))}
          <button onClick={() => setPairs((prev) => [...prev, { id: `n${Date.now()}`, left: '', right: '' }])} className="text-xs font-bold text-violet-700 flex items-center gap-1"><Plus size={14} />{t('إضافة زوج', 'Add pair')}</button>
        </div>
      )}

      {q.type === 'ترتيب' && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500">{t('العناصر بالترتيب الصحيح', 'Items in the correct order')}</p>
          {orderItems.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-xs font-bold text-slate-400">{i + 1}</span>
              <input className={input} value={it} onChange={(e) => setOrderItems((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))} />
              {orderItems.length > 2 && <button onClick={() => setOrderItems((prev) => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600" aria-label="remove"><Trash2 size={16} /></button>}
            </div>
          ))}
          <button onClick={() => setOrderItems((prev) => [...prev, ''])} className="text-xs font-bold text-violet-700 flex items-center gap-1"><Plus size={14} />{t('إضافة عنصر', 'Add item')}</button>
        </div>
      )}

      {!canEditContent && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          {t('محتوى النوع ده (' + q.type + ') بيتعدل بالكامل من محرر البنك. هنا تقدر تعدل النص والخصائص بس.', `Full content of "${q.type}" is edited in the bank editor. Here you can edit the text and properties only.`)}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={onCancel} disabled={saving} className="px-5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg">{t('إلغاء', 'Cancel')}</button>
        <button onClick={() => onSave(build(), false)} disabled={saving || !title.trim()} className="px-5 py-2 text-sm font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">{t('حفظ التعديل', 'Save edit')}</button>
        <button onClick={() => onSave(build(), true)} disabled={saving || !title.trim()} className="px-5 py-2 text-sm font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}{t('حفظ واعتماد', 'Save & approve')}
        </button>
      </div>
    </div>
  );
}
