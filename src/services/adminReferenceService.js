import { supabase } from '../lib/supabase';

const isMissingTableError = (error) => {
  if (!error) return false;
  if (error.code === '42P01') return true; // undefined_table
  return typeof error.message === 'string' && error.message.includes('reference_items');
};

const requireUser = async () => {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Not authenticated');
  return user;
};

export async function getAdminReferenceItems() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reference_items')
    .select('id, category, title, client, image_url, modal_path, modal_html, col_span, order, is_published, created_at, updated_at')
    .is('deleted_at', null)
    .order('order', { ascending: true })
    .order('updated_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    console.error('Error fetching admin reference items:', error);
    throw error;
  }

  return data || [];
}

export async function getReferenceItemById(id) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('reference_items')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    if (isMissingTableError(error)) return null;
    throw error;
  }

  return data;
}

export async function createReferenceItem(fields) {
  await requireUser();

  const { data, error } = await supabase
    .from('reference_items')
    .insert(fields)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReferenceItem(id, fields) {
  await requireUser();

  const { data, error } = await supabase
    .from('reference_items')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function softDeleteReferenceItem(id) {
  await requireUser();

  const { error } = await supabase
    .from('reference_items')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function publishReferenceItem(id) {
  return updateReferenceItem(id, { is_published: true });
}

export async function unpublishReferenceItem(id) {
  return updateReferenceItem(id, { is_published: false });
}

/**
 * 레퍼런스 이미지 업로드
 */
export async function uploadReferenceImage(file, referenceId = 'temp') {
  const user = await requireUser();

  // 파일 확장자 검증
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('허용되지 않는 파일 형식입니다. (jpg, png, webp, gif만 가능)');
  }

  // 파일 크기 검증 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('파일 크기는 10MB 이하여야 합니다.');
  }

  // 파일명 생성
  const ext = file.name.split('.').pop();
  const fileName = `references/${referenceId}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(fileName, file, {
      cacheControl: '31536000',
      upsert: false
    });

  if (error) throw error;

  // Public URL 반환
  const { data: { publicUrl } } = supabase.storage
    .from('blog-images')
    .getPublicUrl(data.path);

  return publicUrl;
}
