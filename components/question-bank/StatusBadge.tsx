import type { BankQuestion } from '@/services/questionBankData';

// شارة حالة الاعتماد للسؤال في جدول البنك (معلّق / مرفوض + سبب الرفض)
export function StatusBadge({ q, language }: { q: BankQuestion; language: 'ar' | 'en' }) {
  if (q.status === 'approved') return null;
  const pending = q.status === 'pending';
  const label = pending ? (language === 'ar' ? 'بانتظار الاعتماد' : 'Pending approval') : (language === 'ar' ? 'مرفوض - يحتاج تعديل' : 'Rejected - needs changes');
  return (
    <div className="mt-1 max-w-[280px]">
      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${pending ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{label}</span>
      {!pending && q.rejectionNote && <p className="text-[11px] text-red-600 mt-1 whitespace-normal leading-snug">{q.rejectionNote}</p>}
    </div>
  );
}
