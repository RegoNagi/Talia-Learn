'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, FileText, Brain } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { sanitizeRichHtml, textToHtml } from '@/lib/richText';
import { renderMathIn } from '@/lib/mathRender';
import { videoFromSpec } from '@/lib/media';
import { DOK_LEVELS, normalizeDok } from '@/lib/dok';

/** كلاسات الجداول والقوائم جوه المحتوى الغني (نفسها في المحرر والعرض) */
export const RICH_CLASSES =
  'leading-relaxed break-words [&_table]:border-collapse [&_table]:my-2 [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-1.5 [&_th]:border [&_th]:border-slate-300 [&_th]:px-3 [&_th]:py-1.5 [&_th]:bg-slate-100 [&_th]:font-bold [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:list-decimal [&_ol]:ps-6 [&_a]:text-violet-700 [&_a]:underline [&_blockquote]:border-s-4 [&_blockquote]:border-slate-300 [&_blockquote]:ps-3 [&_blockquote]:text-slate-600 [&_h3]:text-lg [&_h3]:font-extrabold [&_h4]:font-bold [&_.tl-math]:inline-block [&_.tl-math]:align-middle [&_.tl-math]:mx-0.5';

interface RichContentProps {
  /** HTML غني (هيتنضف قبل العرض) */
  html?: string | null;
  /** نص عادي بديل لو مفيش html (بيحافظ على السطور) */
  text?: string | null;
  className?: string;
}

/** بيعرض نص السؤال الغني: HTML منضّف + معادلات KaTeX */
export function RichContent({ html, text, className = '' }: RichContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const safe = useMemo(() => (html ? sanitizeRichHtml(html) : text ? textToHtml(text) : ''), [html, text]);
  // لازم الكائن ده يفضل ثابت: React 19 بيقارن الكائن نفسه، ولو اتغيّر بيعيد كتابة innerHTML ويمسح رسم المعادلات
  const inner = useMemo(() => ({ __html: safe }), [safe]);

  useLayoutEffect(() => {
    if (ref.current) renderMathIn(ref.current);
  }, [safe]);

  if (!safe) return null;
  return <div ref={ref} dir="auto" className={`${RICH_CLASSES} ${className}`} dangerouslySetInnerHTML={inner} />;
}

export interface StemData {
  title?: string;
  titleHtml?: string;
  questionImageUrl?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  videoStart?: number;
  videoEnd?: number;
  hint?: { text?: string; fileUrl?: string; fileName?: string };
  dok?: number;
}

export function VideoPlayer({ videoUrl, videoStart, videoEnd, className = '' }: Pick<StemData, 'videoUrl' | 'videoStart' | 'videoEnd'> & { className?: string }) {
  const v = videoFromSpec({ videoUrl, videoStart, videoEnd });
  if (!v) return null;
  if (v.kind === 'file') {
    return <video src={v.src} controls preload="metadata" className={`w-full max-h-80 rounded-2xl bg-black ${className}`} />;
  }
  return (
    <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black ${className}`}>
      <iframe
        src={v.src}
        title="video"
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        loading="lazy"
      />
    </div>
  );
}

export function DokBadge({ dok, language = 'ar' }: { dok?: number; language?: 'ar' | 'en' }) {
  const l = normalizeDok(dok);
  const d = DOK_LEVELS.find((x) => x.level === l);
  if (!d) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${d.color}`} title={language === 'ar' ? d.descAr : d.descEn}>
      <Brain size={11} /> DOK {d.level} · {language === 'ar' ? d.ar : d.en}
    </span>
  );
}

export function HintBox({ hint, language = 'ar', startOpen = false }: { hint?: StemData['hint']; language?: 'ar' | 'en'; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  if (!hint || (!hint.text?.trim() && !hint.fileUrl)) return null;
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 hover:bg-amber-100">
        <Lightbulb size={13} /> {open ? (language === 'ar' ? 'إخفاء التلميح' : 'Hide hint') : (language === 'ar' ? 'عرض التلميح' : 'Show hint')}
      </button>
      {open && (
        <div className="mt-2 bg-amber-50/60 border border-amber-200 rounded-2xl p-3 text-sm text-amber-900 space-y-2">
          {hint.text?.trim() && <p className="whitespace-pre-wrap" dir="auto">{hint.text}</p>}
          {hint.fileUrl && (
            <a href={hint.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 underline">
              <FileText size={13} /> {hint.fileName || (language === 'ar' ? 'ملف التلميح' : 'Hint file')}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

interface StemProps {
  data: StemData;
  language?: 'ar' | 'en';
  titleClassName?: string;
  /** يعرض التلميح (للطالب: زر يكشفه) */
  showHint?: boolean;
  /** يعرض شارة العمق المعرفي (للمعلم/المراجع، مش للطالب) */
  showDok?: boolean;
  hintOpen?: boolean;
}

/** مقدمة السؤال كاملة: النص الغني + الصورة + الصوت + الفيديو + التلميح */
export function QuestionStem({ data, language = 'ar', titleClassName = 'text-lg font-bold text-slate-800', showHint = true, showDok = false, hintOpen = false }: StemProps) {
  const img = data.questionImageUrl || data.imageUrl;
  return (
    <div className="space-y-3">
      <RichContent html={data.titleHtml} text={data.title} className={titleClassName} />
      {img && <img src={img} alt="" className="max-h-56 rounded-2xl border border-slate-200" />}
      {data.audioUrl && <audio src={data.audioUrl} controls className="w-full" />}
      <VideoPlayer videoUrl={data.videoUrl} videoStart={data.videoStart} videoEnd={data.videoEnd} />
      {showDok && <DokBadge dok={data.dok} language={language} />}
      {showHint && <HintBox hint={data.hint} language={language} startOpen={hintOpen} />}
    </div>
  );
}
