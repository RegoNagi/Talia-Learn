'use client';

import { Check, Trash2, Plus } from 'lucide-react';

export interface SubQuestion {
  id: string;
  title: string;
  type: string; // 'اختيار من متعدد' | 'صح أم خطأ' | 'إجابة قصيرة'
  points: number;
  options?: { id: string; text: string; isCorrect: boolean }[];
}

interface SubQuestionEditorProps {
  subQuestion: SubQuestion;
  index: number;
  onUpdate: (patch: Partial<SubQuestion>) => void;
  onDelete: () => void;
  language?: 'ar' | 'en';
}

// صف محرر سؤال فرعي واحد داخل سؤال "القطعة" — نص السؤال، النوع، الدرجة، وخيارات الإجابة.
// مشترك بين بنك الأسئلة ومنشئ التقييمات، كل واحد بيوصّل حالته الخاصة عن طريق onUpdate/onDelete.
export function SubQuestionEditor({ subQuestion: sq, index, onUpdate, onDelete, language = 'en' }: SubQuestionEditorProps) {
  const isAr = language === 'ar';
  const options = sq.options || [];

  const handleTypeChange = (newType: string) => {
    let newOptions = sq.options;
    if (newType === 'صح أم خطأ') {
      newOptions = [
        { id: crypto.randomUUID(), text: isAr ? 'صح' : 'True', isCorrect: true },
        { id: crypto.randomUUID(), text: isAr ? 'خطأ' : 'False', isCorrect: false },
      ];
    } else if (newType === 'اختيار من متعدد' && sq.type !== 'اختيار من متعدد') {
      newOptions = [
        { id: crypto.randomUUID(), text: '', isCorrect: true },
        { id: crypto.randomUUID(), text: '', isCorrect: false },
      ];
    }
    onUpdate({ type: newType, options: newOptions });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
        <input
          type="text"
          value={sq.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder={isAr ? `نص السؤال الفرعي ${index + 1}` : `Sub-question ${index + 1} text`}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-colors"
        />
        <select
          value={sq.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-40 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-violet-400"
        >
          <option value="اختيار من متعدد">{isAr ? 'اختيار من متعدد' : 'Multiple Choice'}</option>
          <option value="صح أم خطأ">{isAr ? 'صح أم خطأ' : 'True/False'}</option>
          <option value="إجابة قصيرة">{isAr ? 'إجابة قصيرة' : 'Short Answer'}</option>
        </select>
        <input
          type="number"
          min="1"
          value={sq.points}
          onChange={(e) => onUpdate({ points: Number(e.target.value) })}
          className="w-16 bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-xs font-bold text-slate-700 text-center focus:outline-none focus:border-violet-400"
          title={isAr ? 'الدرجة' : 'Points'}
        />
        <button
          onClick={onDelete}
          className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {sq.type === 'اختيار من متعدد' && (
        <div className="space-y-2 pr-10">
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <button
                onClick={() => onUpdate({ options: options.map(o => ({ ...o, isCorrect: o.id === opt.id })) })}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${opt.isCorrect ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}
              >
                {opt.isCorrect && <Check size={12} className="text-white" />}
              </button>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => onUpdate({ options: options.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o) })}
                placeholder={isAr ? 'نص الاختيار' : 'Option text'}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-violet-400"
              />
              {options.length > 2 && (
                <button
                  onClick={() => onUpdate({ options: options.filter(o => o.id !== opt.id) })}
                  className="shrink-0 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button
              onClick={() => onUpdate({ options: [...options, { id: crypto.randomUUID(), text: '', isCorrect: false }] })}
              className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 px-1"
            >
              <Plus size={13} /> {isAr ? 'إضافة اختيار' : 'Add option'}
            </button>
          )}
        </div>
      )}

      {sq.type === 'صح أم خطأ' && (
        <div className="space-y-2 pr-10">
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <button
                onClick={() => onUpdate({ options: options.map(o => ({ ...o, isCorrect: o.id === opt.id })) })}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${opt.isCorrect ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}
              >
                {opt.isCorrect && <Check size={12} className="text-white" />}
              </button>
              <span className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700">{opt.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
