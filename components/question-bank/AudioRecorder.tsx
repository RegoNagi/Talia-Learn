'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square, RotateCcw, Check, Loader2 } from 'lucide-react';
import { pickRecorderMime, formatTime } from '@/lib/media';

interface Props {
  language: 'ar' | 'en';
  maxSeconds?: number;
  /** بيتنادى بالملف بعد ما المعلم يضغط "استخدم التسجيل"، ويرجّع true لو الرفع نجح */
  onUse: (file: File) => Promise<boolean> | boolean;
  onCancel?: () => void;
}

type Phase = 'idle' | 'recording' | 'recorded';

export function AudioRecorder({ language, maxSeconds = 300, onUse, onCancel }: Props) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef({ mime: '', ext: 'webm' });
  const blobRef = useRef<Blob | null>(null);

  const stopTracks = () => {
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  };

  useEffect(() => () => {
    stopTracks();
    if (rec.current && rec.current.state !== 'inactive') { rec.current.onstop = null; rec.current.stop(); }
  }, []);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const start = async () => {
    setError('');
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError(t('المتصفح ده مش بيدعم التسجيل الصوتي. استخدم "رفع ملف".', 'This browser does not support recording. Use "Upload file".'));
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      mimeRef.current = pickRecorderMime((m) => MediaRecorder.isTypeSupported(m));
      const r = new MediaRecorder(s, mimeRef.current.mime ? { mimeType: mimeRef.current.mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        const blob = new Blob(chunks.current, { type: r.mimeType || mimeRef.current.mime || 'audio/webm' });
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        setPhase('recorded');
        stopTracks();
      };
      rec.current = r;
      r.start(250);
      setSeconds(0);
      setPhase('recording');
      timer.current = setInterval(() => {
        setSeconds((x) => {
          if (x + 1 >= maxSeconds && rec.current?.state === 'recording') rec.current.stop();
          return x + 1;
        });
      }, 1000);
    } catch (e) {
      stopTracks();
      const denied = e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      const missing = e instanceof DOMException && e.name === 'NotFoundError';
      setError(denied
        ? t('مفيش إذن للميكروفون. اسمح بالوصول من إعدادات المتصفح وجرّب تاني.', 'Microphone permission was denied. Allow it in the browser settings and try again.')
        : missing
          ? t('مفيش ميكروفون متوصل بالجهاز.', 'No microphone was found.')
          : t('مقدرناش نبدأ التسجيل.', 'Could not start recording.'));
    }
  };

  const stop = () => { if (rec.current && rec.current.state === 'recording') rec.current.stop(); };

  const reset = () => {
    setPreviewUrl('');
    blobRef.current = null;
    setSeconds(0);
    setPhase('idle');
  };

  const use = async () => {
    if (!blobRef.current) return;
    setBusy(true);
    const file = new File([blobRef.current], `recording-${Date.now()}.${mimeRef.current.ext}`, { type: blobRef.current.type });
    const ok = await onUse(file);
    setBusy(false);
    if (ok) { reset(); onCancel?.(); } else setError(t('فشل رفع التسجيل. جرّب تاني.', 'Uploading the recording failed. Try again.'));
  };

  return (
    <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3" data-testid="audio-recorder">
      {phase === 'idle' && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={start} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-bold hover:bg-rose-700">
            <Mic size={16} /> {t('ابدأ التسجيل', 'Start recording')}
          </button>
          {onCancel && <button type="button" onClick={onCancel} className="text-xs font-bold text-slate-500 hover:text-slate-700">{t('إلغاء', 'Cancel')}</button>}
          <span className="text-xs text-slate-400">{t(`حد أقصى ${formatTime(maxSeconds)} دقيقة`, `Up to ${formatTime(maxSeconds)} min`)}</span>
        </div>
      )}
      {phase === 'recording' && (
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" /></span>
          <span className="font-mono text-sm font-bold text-slate-700" data-testid="rec-timer">{formatTime(seconds)}</span>
          <button type="button" onClick={stop} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-white text-sm font-bold hover:bg-slate-900">
            <Square size={14} /> {t('إيقاف', 'Stop')}
          </button>
        </div>
      )}
      {phase === 'recorded' && (
        <div className="space-y-3">
          <audio src={previewUrl} controls className="w-full" />
          <div className="flex items-center gap-3">
            <button type="button" onClick={use} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t('استخدم التسجيل', 'Use recording')}
            </button>
            <button type="button" onClick={reset} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
              <RotateCcw size={14} /> {t('إعادة التسجيل', 'Re-record')}
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs font-semibold text-red-600" role="alert">{error}</p>}
    </div>
  );
}
