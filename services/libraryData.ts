import { supabase } from '@/lib/supabaseClient';

export interface LibraryFolder {
  id: string;
  parentId: string | null;
  name: string;
  color: string;
  createdAt: string;
  isPublic: boolean;
  sharedWith: string[];
}

export interface LibraryFile {
  id: string;
  folderId: string | null;
  name: string;
  type: 'pdf' | 'doc' | 'slides' | 'sheet' | 'image' | 'video' | 'archive' | 'code' | 'other';
  size: string;
  createdAt: string;
  isPublic: boolean;
  author: string;
  sharedWith: string[];
  storagePath: string | null;
}

interface LibraryScope {
  teacherId: string;
  classId: string;
  subject: string;
}

export async function getLibraryFolders(scope: LibraryScope): Promise<LibraryFolder[]> {
  const { data, error } = await supabase
    .from('library_folders')
    .select('id, parent_id, name, color, created_at, is_public, shared_with')
    .eq('class_id', scope.classId)
    .eq('subject', scope.subject);

  if (error) {
    console.error('Error fetching library folders:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    isPublic: row.is_public,
    sharedWith: row.shared_with || [],
  }));
}

export async function getLibraryFiles(scope: LibraryScope): Promise<LibraryFile[]> {
  const { data, error } = await supabase
    .from('library_files')
    .select('id, folder_id, name, type, size_label, created_at, is_public, author_name, shared_with, storage_path')
    .eq('class_id', scope.classId)
    .eq('subject', scope.subject);

  if (error) {
    console.error('Error fetching library files:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    folderId: row.folder_id,
    name: row.name,
    type: row.type,
    size: row.size_label || '',
    createdAt: row.created_at,
    isPublic: row.is_public,
    author: row.author_name || '',
    sharedWith: row.shared_with || [],
    storagePath: row.storage_path,
  }));
}

export async function createLibraryFolder(scope: LibraryScope, input: { parentId: string | null; name: string; color: string; isPublic: boolean }): Promise<string | null> {
  const { data, error } = await supabase
    .from('library_folders')
    .insert({
      teacher_id: scope.teacherId,
      class_id: scope.classId,
      subject: scope.subject,
      parent_id: input.parentId,
      name: input.name,
      color: input.color,
      is_public: input.isPublic,
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
  if (error) {
    console.error('Error deleting library folder:', error);
    return false;
  }
  return true;
}

export async function toggleFolderPrivacy(id: string, isPublic: boolean): Promise<boolean> {
  const { error } = await supabase.from('library_folders').update({ is_public: isPublic }).eq('id', id);
  return !error;
}

export async function updateFolderSharing(id: string, sharedWith: string[]): Promise<boolean> {
  const { error } = await supabase.from('library_folders').update({ shared_with: sharedWith }).eq('id', id);
  return !error;
}

// بيرفع الملف فعليًا لـ Supabase Storage، وبعدين بيسجّل بياناته في جدول library_files
export async function uploadLibraryFile(
  scope: LibraryScope,
  input: { folderId: string | null; name: string; type: LibraryFile['type']; isPublic: boolean; author: string; file: File | null }
): Promise<string | null> {
  let storagePath: string | null = null;
  let sizeLabel = '1.5 MB';

  if (input.file) {
    const safeName = input.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    storagePath = `${scope.classId}/${scope.subject}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from('library-files').upload(storagePath, input.file);
    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      return null;
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
      is_public: input.isPublic,
      author_name: input.author,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error saving library file record:', error);
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
  if (error) {
    console.error('Error deleting library file:', error);
    return false;
  }
  return true;
}

export async function toggleFilePrivacy(id: string, isPublic: boolean): Promise<boolean> {
  const { error } = await supabase.from('library_files').update({ is_public: isPublic }).eq('id', id);
  return !error;
}

export async function updateFileSharing(id: string, sharedWith: string[]): Promise<boolean> {
  const { error } = await supabase.from('library_files').update({ shared_with: sharedWith }).eq('id', id);
  return !error;
}

// بيجيب كل الفصول الحقيقية بتاعة نفس المعلم (لخيار "شير مع كل فصولي")
export async function getTeacherClassNames(teacherId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('class_sections').select('id, name').eq('teacher_id', teacherId);
  if (error) return [];
  return data || [];
}
