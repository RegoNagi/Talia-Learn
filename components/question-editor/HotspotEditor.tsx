'use client';

import { UploadCloud, Trash2 } from 'lucide-react';

export interface Hotspot {
  xPercent: number;
  yPercent: number;
  label: string;
  isCorrect: boolean;
}

interface HotspotEditorProps {
  imageUrl: string;
  hotspots: Hotspot[];
  isUploading: boolean;
  onUpload: (file: File) => void;
  onImageClick: (xPercent: number, yPercent: number) => void;
  onMarkCorrect: (index: number) => void;
  onRemoveHotspot: (index: number) => void;
  onRemoveImage: () => void;
  language?: 'ar' | 'en';
}

// محرر أسئلة "المنطقة التفاعلية" — رفع صورة، وضع علامات بالضغط عليها، وتحديد العلامة الصحيحة.
// مشترك بين بنك الأسئلة ومنشئ التقييمات، كل واحد بيوصّل حالته الخاصة عن طريق الـ props دي.
export function HotspotEditor({
  imageUrl,
  hotspots,
  isUploading,
  onUpload,
  onImageClick,
  onMarkCorrect,
  onRemoveHotspot,
  onRemoveImage,
  language = 'en',
}: HotspotEditorProps) {
  const isAr = language === 'ar';

  return (
    <div className="space-y-3">
      {!imageUrl ? (
        <label className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-2 text-slate-400 hover:bg-slate-50 cursor-pointer transition-colors">
          <UploadCloud size={24} />
          <span className="text-sm font-bold">{isUploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'ارفع صورة السؤال' : 'Upload question image')}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
        </label>
      ) : (
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-2">{isAr ? 'دوس على الصورة عشان تحط علامة منطقة جديدة' : 'Click on the image to place a new hotspot marker'}</p>
          <div
            className="relative inline-block border border-slate-200 rounded-xl overflow-hidden cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
              const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
              onImageClick(xPercent, yPercent);
            }}
          >
            <img src={imageUrl} alt="" className="max-w-full max-h-96 block" />
            {hotspots.map((hs, idx) => (
              <div
                key={idx}
                style={{ left: `${hs.xPercent}%`, top: `${hs.yPercent}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${hs.isCorrect ? 'bg-emerald-500 border-white text-white' : 'bg-white border-slate-400 text-slate-600'}`}
                onClick={(e) => e.stopPropagation()}
              >
                {hs.label}
              </div>
            ))}
          </div>
          <button onClick={onRemoveImage} className="text-xs font-bold text-red-500 hover:text-red-600 mt-2 block">
            {isAr ? 'إزالة الصورة والبدء من جديد' : 'Remove image and start over'}
          </button>
        </div>
      )}
      {hotspots.length > 0 && (
        <div className="space-y-2">
          {hotspots.map((hs, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">{hs.label}</span>
              <button
                onClick={() => onMarkCorrect(idx)}
                className={`flex-1 text-left px-4 py-2 rounded-xl text-sm font-bold transition-colors ${hs.isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
              >
                {hs.isCorrect ? (isAr ? 'الإجابة الصحيحة' : 'Correct Answer') : (isAr ? 'دوس عشان تخليها الصح' : 'Click to mark correct')}
              </button>
              <button
                onClick={() => onRemoveHotspot(idx)}
                className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
