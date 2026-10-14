'use client';

import { useEffect, useState } from 'react';
import { Mic, Video, Lightbulb, Brain, Library, Upload, X, Loader2, Search, FileText, PlayCircle, Volume2, Link as LinkIcon } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { VideoPlayer } from './RichContent';
import { parseVideoUrl, parseTime, formatTime } from '@/lib/media';
import { DOK_LEVELS } from '@/lib/dok';
import { uploadQuestionAudio, uploadQuestionVideo, uploadQuestionAttachment, type QuestionHint } from '@/services/questionBankData';
import { getOfficialCurriculumResources } from '@/services/academicData';

export interface LibraryPick { title: string; url: string; kind: 'video' | 'audio' | 'link' }

interface Props {
  language: 'ar' | 'en';
  subject: string;
  grade: string;
  questionType: string;
  audioUrl: string;
  setAudioUrl: (v: string) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  videoStart: string;
  setVideoStart: (v: string) => void;
  videoEnd: string;
  setVideoEnd: (v: string) => void;
  hint: QuestionHint;
  setHint: (h: QuestionHint) => void;
  dok: number | undefined;
  setDok: (d: 1 | 2 | 3 | 4 | undefined) => void;
  /** لما المعلم يختار مورد من المكتبة وهو رابط/ملف، بيتحط في نص السؤال */
  onInsertLink: (url: string, title: string) => void;
}

function resKind(type: string, url: string): LibraryPick['kind'] {
  const tl = (type || '').toLowerCase();
  if (tl.includes('video') || /\.(mp4|webm|mov)(\?|$)/i.test(url) || /youtu\.?be|vimeo/i.test(url)) return 'video';
  if (tl.includes('audio') || /\.(mp3|m4a|wav|ogg)(\?|$)/i.test(url)) return 'audio';
  return 'link';
}

function LibraryPickerModal({ language, grade, subject, onPick, onClose }: { language: 'ar' | 'en'; grade: string; subject: string; onPick: (p: LibraryPick) => void; onClose: () => void }) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const [items, setItems] = useState<LibraryPick[] | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    let alive = true;
    getOfficialCurriculumResources(grade, subject).then((rows) => {
      if (alive) setItems(rows.filter((r) => r.url).map((r) => ({ title: r.title, url: r.url, kind: resKind(r.type, r.url) })));
    });
    return () => { alive = false; };
  }, [grade, subject]);
  const shown = (items || []).filter((i) => !q.trim() || i.title.toLowerCase().includes(q.toLowerCase()));
  const icon = (k: LibraryPick['kind']) => (k === 'video' ? <PlayCircle size={16} className="text-rose-500" /> : k === 'audio' ? <Volume2 size={16} className="text-amber-500" /> : <FileText size={16} className="text-slate-500" />);
  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800">{t('إدراج من مكتبة المنهج', 'Insert from the curriculum library')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100" aria-label="close"><X size={18} /></button>
        </div>
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute end-3 top-2.5 text-slate-400" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('ابحث عن مورد...', 'Search resources...')} className="w-full h-9 ps-3 pe-9 rounded-xl border border-slate-200 text-sm" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">{subject} · {grade}</p>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {items === null && <div className="p-8 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>}
          {items && shown.length === 0 && <p className="p-8 text-center text-sm text-slate-400">{t('مفيش موارد للمادة والصف ده.', 'No resources for this subject and grade.')}</p>}
          {shown.map((i, idx) => (
            <button key={idx} type="button" onClick={() => onPick(i)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-violet-50 text-start">
              {icon(i.kind)}
              <span className="flex-1 text-sm font-bold text-slate-700 truncate">{i.title}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{i.kind === 'video' ? t('فيديو', 'Video') : i.kind === 'audio' ? t('صوت', 'Audio') : t('رابط', 'Link')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const chip = (on: boolean) => `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${on ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-white border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600'}`;

export function StemExtras(p: Props) {
  const { language: lang } = p;
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [open, setOpen] = useState<{ audio: boolean; video: boolean; hint: boolean }>({
    audio: !!p.audioUrl || p.questionType === 'مقطع صوتي',
    video: !!p.videoUrl,
    hint: !!(p.hint.text || p.hint.fileUrl),
  });
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState<'' | 'audio' | 'video' | 'hint'>('');
  const [err, setErr] = useState('');
  const [library, setLibrary] = useState(false);

  const toggle = (k: keyof typeof open) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const uploadAudioFile = async (file: File): Promise<boolean> => {
    setErr('');
    setBusy('audio');
    const r = await uploadQuestionAudio(file);
    setBusy('');
    if (r) { p.setAudioUrl(r.url); return true; }
    setErr(t('فشل رفع الصوت', 'Audio upload failed'));
    return false;
  };

  const pick = (item: LibraryPick) => {
    setLibrary(false);
    if (item.kind === 'video') { p.setVideoUrl(item.url); setOpen((o) => ({ ...o, video: true })); }
    else if (item.kind === 'audio') { p.setAudioUrl(item.url); setOpen((o) => ({ ...o, audio: true })); }
    else p.onInsertLink(item.url, item.title);
  };

  const parsed = p.videoUrl ? parseVideoUrl(p.videoUrl) : null;
  const sVal = parseTime(p.videoStart);
  const eVal = parseTime(p.videoEnd);

  return (
    <div className="mb-6 space-y-4" data-testid="stem-extras">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={chip(open.audio)} onClick={() => toggle('audio')}><Mic size={13} />{t('صوت', 'Audio')}</button>
        <button type="button" className={chip(open.video)} onClick={() => toggle('video')}><Video size={13} />{t('فيديو', 'Video')}</button>
        <button type="button" className={chip(open.hint)} onClick={() => toggle('hint')}><Lightbulb size={13} />{t('تلميح', 'Hint')}</button>
        <button type="button" className={chip(false)} onClick={() => setLibrary(true)}><Library size={13} />{t('من المكتبة', 'From library')}</button>
      </div>

      {open.audio && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3" data-testid="audio-field">
          <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Mic size={13} />{t('مقطع صوتي للسؤال', 'Question audio')}</p>
          {p.audioUrl ? (
            <div className="flex items-center gap-3">
              <audio src={p.audioUrl} controls className="flex-1" />
              <button type="button" onClick={() => p.setAudioUrl('')} className="text-xs font-bold text-red-500 hover:text-red-600 shrink-0">{t('إزالة', 'Remove')}</button>
            </div>
          ) : recording ? (
            <AudioRecorder language={lang} onUse={uploadAudioFile} onCancel={() => setRecording(false)} />
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setRecording(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"><Mic size={14} />{t('سجّل بالميكروفون', 'Record')}</button>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
                {busy === 'audio' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}{t('ارفع ملف صوت', 'Upload audio')}
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAudioFile(f); e.target.value = ''; }} />
              </label>
            </div>
          )}
          {p.questionType === 'مقطع صوتي' && <p className="text-xs font-semibold text-slate-400">{t('الطالب هيسمع المقطع ده ويختار الإجابة الصحيحة من الاختيارات تحت.', 'The student listens to this clip and picks the correct answer below.')}</p>}
        </div>
      )}

      {open.video && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3" data-testid="video-field">
          <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Video size={13} />{t('فيديو للسؤال', 'Question video')}</p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <LinkIcon size={14} className="absolute start-3 top-3 text-slate-400" />
              <input dir="ltr" value={p.videoUrl} onChange={(e) => p.setVideoUrl(e.target.value.trim())} placeholder="https://youtu.be/…  |  vimeo.com/…  |  .mp4" className="w-full h-10 ps-9 pe-3 rounded-xl border border-slate-200 text-sm" aria-label="video url" />
            </div>
            <label className="inline-flex items-center gap-2 px-3 h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0">
              {busy === 'video' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}{t('ارفع فيديو', 'Upload')}
              <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = '';
                if (!f) return;
                setErr(''); setBusy('video');
                const r = await uploadQuestionVideo(f);
                setBusy('');
                if ('url' in r) p.setVideoUrl(r.url); else setErr(r.error);
              }} />
            </label>
            {p.videoUrl && <button type="button" onClick={() => { p.setVideoUrl(''); p.setVideoStart(''); p.setVideoEnd(''); }} className="text-xs font-bold text-red-500 shrink-0">{t('إزالة', 'Remove')}</button>}
          </div>
          {p.videoUrl && !parsed && <p className="text-xs font-semibold text-red-600">{t('الرابط ده مش مدعوم. استخدم يوتيوب أو فيميو أو رابط ملف mp4/webm.', 'Unsupported link. Use YouTube, Vimeo or an mp4/webm file link.')}</p>}
          {parsed && (
            <>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                <label className="flex items-center gap-2">{t('يبدأ من', 'Start')}
                  <input dir="ltr" value={p.videoStart} onChange={(e) => p.setVideoStart(e.target.value)} placeholder="0:00" className="w-20 h-8 px-2 rounded-lg border border-slate-200 text-center" aria-label="start" />
                </label>
                <label className="flex items-center gap-2">{t('ينتهي عند', 'End')}
                  <input dir="ltr" value={p.videoEnd} onChange={(e) => p.setVideoEnd(e.target.value)} placeholder="1:30" className="w-20 h-8 px-2 rounded-lg border border-slate-200 text-center" aria-label="end" />
                </label>
                {(p.videoStart && sVal === undefined) || (p.videoEnd && eVal === undefined) ? <span className="text-red-600">{t('الوقت بصيغة د:ث', 'Use m:ss')}</span> : null}
                {sVal !== undefined && eVal !== undefined && eVal <= sVal && <span className="text-red-600">{t('النهاية لازم تبقى بعد البداية', 'End must be after start')}</span>}
                {sVal !== undefined && <span className="text-slate-400 font-normal">{formatTime(sVal)}{eVal !== undefined ? ` → ${formatTime(eVal)}` : ''}</span>}
              </div>
              <div className="max-w-md"><VideoPlayer videoUrl={p.videoUrl} videoStart={sVal} videoEnd={eVal} /></div>
            </>
          )}
        </div>
      )}

      {open.hint && (
        <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-4 space-y-3" data-testid="hint-field">
          <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5"><Lightbulb size={13} />{t('تلميح (يظهر للطالب لو طلبه)', 'Hint (shown only if the student asks)')}</p>
          <textarea value={p.hint.text || ''} onChange={(e) => p.setHint({ ...p.hint, text: e.target.value })} rows={2} placeholder={t('اكتب تلميح يساعد الطالب من غير ما يكشف الإجابة…', 'Write a hint that helps without giving the answer…')} className="w-full p-3 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:border-amber-400" />
          {p.hint.fileUrl ? (
            <div className="flex items-center gap-3 text-xs font-bold text-amber-800">
              <FileText size={14} /><a href={p.hint.fileUrl} target="_blank" rel="noopener noreferrer" className="underline truncate">{p.hint.fileName || p.hint.fileUrl}</a>
              <button type="button" onClick={() => p.setHint({ ...p.hint, fileUrl: undefined, fileName: undefined })} className="text-red-500">{t('إزالة', 'Remove')}</button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200 bg-white text-xs font-bold text-amber-800 hover:bg-amber-50 cursor-pointer">
              {busy === 'hint' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}{t('أرفق ملف للتلميح (PDF / صورة / صوت)', 'Attach a hint file (PDF / image / audio)')}
              <input type="file" accept="application/pdf,image/*,audio/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = '';
                if (!f) return;
                setErr(''); setBusy('hint');
                const r = await uploadQuestionAttachment(f);
                setBusy('');
                if ('url' in r) p.setHint({ ...p.hint, fileUrl: r.url, fileName: f.name }); else setErr(r.error);
              }} />
            </label>
          )}
        </div>
      )}

      <div data-testid="dok-field">
        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-2"><Brain size={13} />{t('العمق المعرفي (DOK)', 'Depth of Knowledge (DOK)')}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DOK_LEVELS.map((d) => {
            const on = p.dok === d.level;
            return (
              <button key={d.level} type="button" aria-pressed={on} onClick={() => p.setDok(on ? undefined : d.level)} className={`text-start p-3 rounded-2xl border transition-all ${on ? `${d.color} ring-2 ring-offset-1 ring-violet-300` : 'bg-white border-slate-200 hover:border-violet-300'}`}>
                <p className="text-xs font-extrabold">DOK {d.level} · {lang === 'ar' ? d.ar : d.en}</p>
                <p className="text-[11px] font-medium opacity-80 mt-1 leading-snug">{lang === 'ar' ? d.descAr : d.descEn}</p>
              </button>
            );
          })}
        </div>
      </div>

      {err && <p className="text-xs font-semibold text-red-600" role="alert">{err}</p>}
      {library && <LibraryPickerModal language={lang} grade={p.grade} subject={p.subject} onPick={pick} onClose={() => setLibrary(false)} />}
    </div>
  );
}
