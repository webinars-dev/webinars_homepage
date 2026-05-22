import { supabase } from '../lib/supabase';

const isMissingTableError = (error) => {
  if (!error) return false;
  if (error.code === '42P01') return true; // undefined_table
  return typeof error.message === 'string' && error.message.includes('reference_items');
};

const ADMIN_REFERENCE_LIST_COLUMNS = [
  'id',
  'category',
  'title',
  'client',
  'image_url',
  'modal_path',
  'col_span',
  'order',
  'is_published',
  'created_at',
  'updated_at',
].join(', ');

const ADMIN_REFERENCE_LIST_COLUMNS_WITH_MODAL_HTML = [
  'id',
  'category',
  'title',
  'client',
  'image_url',
  'modal_path',
  'modal_html',
  'col_span',
  'order',
  'is_published',
  'created_at',
  'updated_at',
].join(', ');

const DATA_IMAGE_SRC_SELECTOR = 'img[src^="data:image/"]';
const IMAGE_TYPE_TO_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const requireUser = async () => {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Not authenticated');
  return user;
};

export async function getAdminReferenceItems(options = {}) {
  if (!supabase) return [];
  const columns = options.includeModalHtml
    ? ADMIN_REFERENCE_LIST_COLUMNS_WITH_MODAL_HTML
    : ADMIN_REFERENCE_LIST_COLUMNS;

  const { data, error } = await supabase
    .from('reference_items')
    .select(columns)
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
    .select('id')
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
    .select('id')
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
  const fallbackExt = IMAGE_TYPE_TO_EXTENSION[file.type] || 'bin';
  const ext = file.name?.includes('.') ? file.name.split('.').pop() : fallbackExt;
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

function dataUrlToFile(dataUrl, index) {
  const match = String(dataUrl).match(/^data:([^;,]+)(;base64)?,(.*)$/);
  if (!match) {
    throw new Error('지원하지 않는 이미지 데이터 형식입니다.');
  }

  const mimeType = match[1].toLowerCase();
  if (!IMAGE_TYPE_TO_EXTENSION[mimeType]) {
    throw new Error(`허용되지 않는 이미지 형식입니다. (${mimeType})`);
  }

  const isBase64 = !!match[2];
  const rawData = match[3] || '';
  const binaryString = isBase64 ? atob(rawData) : decodeURIComponent(rawData);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const ext = IMAGE_TYPE_TO_EXTENSION[mimeType];
  return new File([bytes], `modal-image-${index}.${ext}`, { type: mimeType });
}

/**
 * modal_html에 붙어 들어온 base64 이미지를 Storage URL로 치환한다.
 */
export async function replaceEmbeddedReferenceImages(html, referenceId = 'modal') {
  if (!html || !/src\s*=\s*(["'])data:image\//i.test(html)) {
    return { html: html || '', convertedCount: 0 };
  }

  if (typeof DOMParser === 'undefined') {
    throw new Error('브라우저에서만 이미지 변환을 실행할 수 있습니다.');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = Array.from(doc.querySelectorAll(DATA_IMAGE_SRC_SELECTOR));

  if (images.length === 0) {
    return { html, convertedCount: 0 };
  }

  const uploadedUrls = new Map();
  let convertedCount = 0;

  for (const [index, image] of images.entries()) {
    const src = image.getAttribute('src');
    if (!src) continue;

    let publicUrl = uploadedUrls.get(src);
    if (!publicUrl) {
      const file = dataUrlToFile(src, index + 1);
      publicUrl = await uploadReferenceImage(file, referenceId);
      uploadedUrls.set(src, publicUrl);
    }

    image.setAttribute('src', publicUrl);

    if (image.getAttribute('srcset')?.includes('data:image/')) {
      image.removeAttribute('srcset');
    }

    convertedCount += 1;
  }

  return {
    html: doc.body.innerHTML,
    convertedCount,
  };
}
