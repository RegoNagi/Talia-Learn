import { BookOpen } from 'lucide-react';

export default function LibraryPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Library</h1>
        <p className="text-slate-500 mt-2">Your learning resources will appear here.</p>
      </div>
    </div>
  );
}
