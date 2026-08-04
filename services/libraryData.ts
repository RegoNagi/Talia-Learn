import { supabase } from '@/lib/supabaseClient';

export interface LibraryFolder {
  id: string;
  teacherId: string;
  parentId: string | null;
  name: string;
  color: string;
  createdAt: string;
  isPublic: boolean;
  inMaterial: boolean;
  sharedWithClasses: string[];
  sharedWithTeachers: string[];
  origin: 'material' | 'my_library';
}

export interface LibraryFile {
  id: string;
  teacherId: string;
  folderId: string | null;
  name: string;
  type: 'pdf' | 'doc' | 'slides' | 'sheet' | 'image' | 'video' | 'archive' | 'code' | 'other';
  size: string;
  createdAt: string;
  isPublic: boolean;
  inMaterial: boolean;
  author: string;
  sharedWithClasses: string[];
  sharedWithTeachers: string[];
  storagePath: string | null;
  origin: 'material' | 'my_library';
}

interface LibraryScope {
  teacherId: string;
  classId: string;
  subject: string;
}

const FOLDER_SELECT = 'id, teacher_id, parent_id, name, color, created_at, is_public, in_material, shared_with, shared_with_teachers, origin';
const FILE_SELECT = 'id, teacher_id, folder_id, name, type, size_label, created_at, is_public, in_material, author_name, shared_with, shared_with_teachers, storage_path, origin';

function mapFolder(row: any): LibraryFolder {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    parentId: row.parent_id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    isPublic: row.is_public,
    inMaterial: row.in_material,
    sharedWithClasses: row.shared_with || [],
    sharedWithTeachers: row.shared_with_teachers || [],
    origin: row.origin || 'material',
  };
}

function mapFile(row: any): LibraryFile {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    folderId: row.folder_id,
    name: row.name,
    type: row.type,
    size: row.size_label || '',
    createdAt: row.created_at,
    isPublic: row.is_public,
    inMaterial: row.in_material,
    author: row.author_name || '',
    sharedWithClasses: row.shared_with || [],
    sharedWithTeachers: row.shared_with_teachers || [],
    storagePath: row.storage_path,
    origin: row.origin || 'material',
  };
}

function dedupe<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

// Material: عناصرها الأصلية + أي حاجة اتضافت لها من My Library + أي حاجة اتشاركت من فصول تانية
export async function getMaterialFolders(scope: LibraryScope): Promise<LibraryFolder[]> {
  const [ownRes, sharedRes] = await Promise.all([
    supabase.from('library_folders').select(FOLDER_SELECT).eq('class_id', scope.classId).eq('subject', scope.subject),
    supabase.from('library_folders').select(FOLDER_SELECT).contains('shared_with', [scope.classId]),
  ]);
  const own = (ownRes.data || []).filter((r: any) => r.origin === 'material' || r.in_material);
  const shared = sharedRes.data || [];
  return dedupe([...own, ...shared].map(mapFolder));
}

export async function getMaterialFiles(scope: LibraryScope): Promise<LibraryFile[]> {
  const [ownRes, sharedRes] = await Promise.all([
    supabase.from('library_files').select(FILE_SELECT).eq('class_id', scope.classId).eq('subject', scope.subject),
    supabase.from('library_files').select(FILE_SELECT).contains('shared_with', [scope.classId]),
  ]);
  const own = (ownRes.data || []).filter((r: any) => r.origin === 'material' || r.in_material);
  const shared = sharedRes.data || [];
  return dedupe([...own, ...shared].map(mapFile));
}

// My Library: بتاعتي أنا (كل حاجة)، + بتاعة زميلي المعلم في نفس الفصل والمادة لو خلاها عامة، + أي حاجة اتشاركت معايا بالاسم
export async function getMyLibraryFolders(scope: LibraryScope): Promise<LibraryFolder[]> {
  const [mineRes, coTeacherRes, sharedWithMeRes] = await Promise.all([
    supabase.from('library_folders').select(FOLDER_SELECT).eq('origin', 'my_library').eq('teacher_id', scope.teacherId),
    supabase.from('library_folders').select(FOLDER_SELECT).eq('origin', 'my_library').eq('class_id', scope.classId).eq('subject', scope.subject).eq('is_public', true),
    supabase.from('library_folders').select(FOLDER_SELECT).eq('subject', scope.subject).contains('shared_with_teachers', [scope.teacherId]),
  ]);
  const rows = [...(mineRes.data || []), ...(coTeacherRes.data || []), ...(sharedWithMeRes.data || [])];
  return dedupe(rows.map(mapFolder));
}

export async function getMyLibraryFiles(scope: LibraryScope): Promise<LibraryFile[]> {
  const [mineRes, coTeacherRes, sharedWithMeRes] = await Promise.all([
    supabase.from('library_files').select(FILE_SELECT).eq('origin', 'my_library').eq('teacher_id', scope.teacherId),
    supabase.from('library_files').select(FILE_SELECT).eq('origin', 'my_library').eq('class_id', scope.classId).eq('subject', scope.subject).eq('is_public', true),
    supabase.from('library_files').select(FILE_SELECT).eq('subject', scope.subject).contains('shared_with_teachers', [scope.teacherId]),
  ]);
  const rows = [...(mineRes.data || []), ...(coTeacherRes.data || []), ...(sharedWithMeRes.data || [])];
  return dedupe(rows.map(mapFile));
}

// عام الاستخدام العام (بيستخدمها LibraryDrawer عشان يجيب كل حاجة المعلم عنده بغض النظر عن المصدر)
export async function getLibraryFiles(scope: LibraryScope): Promise<LibraryFile[]> {
  const { data, error } = await supabase.from('library_files').select(FILE_SELECT).eq('class_id', scope.classId).eq('subject', scope.subject);
  if (error) { console.error('Error fetching library files:', error); return []; }
  return (data || []).map(mapFile);
}

export async function createLibraryFolder(scope: LibraryScope, input: { parentId: string | null; name: string; color: string; origin: 'material' | 'my_library' }): Promise<string | null> {
  const { data, error } = await supabase
    .from('library_folders')
    .insert({
      teacher_id: scope.teacherId,
      class_id: scope.classId,
      subject: scope.subject,
      parent_id: input.parentId,
      name: input.name,
      color: input.color,
      is_public: false,
      in_material: input.origin === 'material',
      origin: input.origin,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating library folder:', error);
    return null;
  }
  return data.id;
}

export async function deleteLibraryFolder(id: string): Promise<boolean> {
  const { error } = await supabase.from('library_folders').delete().eq('id', id);
  if (error) { console.error('Error deleting library folder:', error); return false; }
  return true;
}

// زر عام/خاص السريع: يبان لزميلك المعلم (نفس الفصل والمادة) ولا لأ — مش بينشر لـ Material
export async function toggleFolderPrivacy(id: string, isPublic: boolean): Promise<boolean> {
  const { error } = await supabase.from('library_folders').update({ is_public: isPublic }).eq('id', id);
  return !error;
}

export async function toggleFilePrivacy(id: string, isPublic: boolean): Promise<boolean> {
  const { error } = await supabase.from('library_files').update({ is_public: isPublic }).eq('id', id);
  return !error;
}

// زر "إضافة لـ Material" — بينشر بس لمادة المعلم ده نفسه، ومحدش غيره
export async function addFolderToMaterial(id: string): Promise<boolean> {
  const { error } = await supabase.from('library_folders').update({ in_material: true }).eq('id', id);
  return !error;
}
export async function addFileToMaterial(id: string): Promise<boolean> {
  const { error } = await supabase.from('library_files').update({ in_material: true }).eq('id', id);
  return !error;
}
export async function removeFolderFromMaterial(id: string): Promise<boolean> {
  const { error } = await supabase.from('library_folders').update({ in_material: false }).eq('id', id);
  return !error;
}
export async function removeFileFromMaterial(id: string): Promise<boolean> {
  const { error } = await supabase.from('library_files').update({ in_material: false }).eq('id', id);
  return !error;
}

// مشاركة مع فصول تانية و/أو معلمين بالاسم
export async function updateFolderSharing(id: string, sharedWithClasses: string[], sharedWithTeachers: string[]): Promise<boolean> {
  const { error } = await supabase.from('library_folders').update({ shared_with: sharedWithClasses, shared_with_teachers: sharedWithTeachers }).eq('id', id);
  return !error;
}
export async function updateFileSharing(id: string, sharedWithClasses: string[], sharedWithTeachers: string[]): Promise<boolean> {
  const { error } = await supabase.from('library_files').update({ shared_with: sharedWithClasses, shared_with_teachers: sharedWithTeachers }).eq('id', id);
  return !error;
}

export async function uploadLibraryFile(
  scope: LibraryScope,
  input: { folderId: string | null; name: string; type: LibraryFile['type']; author: string; file: File | null; origin: 'material' | 'my_library' }
): Promise<{ id: string | null; error: string | null }> {
  let storagePath: string | null = null;
  let sizeLabel = '1.5 MB';

  if (input.file) {
    const safeName = input.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    storagePath = `${scope.classId}/${scope.subject}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from('library-files').upload(storagePath, input.file);
    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      return { id: null, error: uploadError.message };
    }
    sizeLabel = `${(input.file.size / (1024 * 1024)).toFixed(1)} MB`;
  }

  const { data, error } = await supabase
    .from('library_files')
    .insert({
      teacher_id: scope.teacherId,
      class_id: scope.classId,
      subject: scope.subject,
      folder_id: input.folderId,
      name: input.name,
      type: input.type,
      size_label: sizeLabel,
      storage_path: storagePath,
      is_public: false,
      in_material: input.origin === 'material',
      author_name: input.author,
      origin: input.origin,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error saving library file record:', error);
    return { id: null, error: error?.message || 'Unknown error saving file record' };
  }
  return { id: data.id, error: null };
}

// بيضيف مصدر رسمي من منهج Talia 360 مباشرة لـ Material (بدون رفع حقيقي، بيسجّل بس مرجع URL)
export async function addOfficialResourceToMaterial(scope: LibraryScope, resource: { title: string; type: string; url: string }): Promise<string | null> {
  const { data, error } = await supabase
    .from('library_files')
    .insert({
      teacher_id: scope.teacherId,
      class_id: scope.classId,
      subject: scope.subject,
      folder_id: null,
      name: resource.title,
      type: (resource.type || 'link').toLowerCase().includes('video') ? 'video' : (resource.type || '').toLowerCase().includes('link') ? 'other' : 'pdf',
      size_label: '',
      storage_path: null,
      is_public: false,
      in_material: true,
      author_name: 'المنهج الرسمي',
      origin: 'material',
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('Error adding official resource to material:', error);
    return null;
  }
  return data.id;
}

export function getLibraryFileDownloadUrl(storagePath: string): string {
  const { data } = supabase.storage.from('library-files').getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function deleteLibraryFile(id: string, storagePath: string | null): Promise<boolean> {
  if (storagePath) {
    await supabase.storage.from('library-files').remove([storagePath]);
  }
  const { error } = await supabase.from('library_files').delete().eq('id', id);
  if (error) { console.error('Error deleting library file:', error); return false; }
  return true;
}

// بيجيب كل الفصول الحقيقية بتاعة نفس المعلم (لخيار "شير مع فصولي")
export async function getTeacherClassNames(teacherId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('class_sections').select('id, name').eq('teacher_id', teacherId);
  if (error) return [];
  return data || [];
}

// بيجيب باقي المعلمين اللي بيدرّسوا نفس المادة (في أي صف) — لخيار "شير مع معلم بالاسم"
export async function getTeachersForSubject(subject: string, excludeTeacherId: string): Promise<{ id: string; name: string }[]> {
  const { data: subjectRows, error } = await supabase.from('teacher_subjects').select('teacher_id').eq('subject', subject);
  if (error || !subjectRows) return [];
  const teacherIds = Array.from(new Set(subjectRows.map((r: any) => r.teacher_id))).filter((id) => id !== excludeTeacherId);
  if (teacherIds.length === 0) return [];
  const { data: teacherRows } = await supabase.from('teachers').select('id, user_id, users ( name )').in('id', teacherIds);
  return (teacherRows || []).map((row: any) => ({ id: row.id, name: row.users?.name || '' }));
}
