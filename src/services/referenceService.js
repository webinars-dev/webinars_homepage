import { supabase } from '../lib/supabase';

const PUBLIC_REFERENCE_LIST_COLUMNS = [
  'id',
  'category',
  'title',
  'client',
  'image_url',
  'modal_path',
  'col_span',
  'order',
  'created_at',
  'updated_at',
].join(', ');

const configuredTimeoutMs = Number(import.meta.env?.VITE_REFERENCE_ITEMS_TIMEOUT_MS);
const DEFAULT_REFERENCE_ITEMS_TIMEOUT_MS =
  Number.isFinite(configuredTimeoutMs) && configuredTimeoutMs > 0 ? configuredTimeoutMs : 8000;

const isMissingTableError = (error) => {
  if (!error) return false;
  if (error.code === '42P01') return true; // undefined_table
  return typeof error.message === 'string' && error.message.includes('reference_items');
};

const isAbortError = (error) => {
  return error?.name === 'AbortError' || error?.message === 'AbortError';
};

const isUnavailableError = (error) => {
  const message = String(error?.message || error?.details || '');
  return isAbortError(error) || /failed to fetch|timed?out|aborted/i.test(message);
};

/**
 * 공개용 레퍼런스 목록 (발행된 항목만)
 */
export async function getPublishedReferenceItems(options = {}) {
  if (!supabase) return [];

  const timeoutMs = options.timeoutMs ?? DEFAULT_REFERENCE_ITEMS_TIMEOUT_MS;
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeoutId =
    controller && Number.isFinite(timeoutMs) && timeoutMs > 0
      ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
      : null;

  try {
    let query = supabase
      .from('reference_items')
      .select(PUBLIC_REFERENCE_LIST_COLUMNS)
      .eq('is_published', true)
      .is('deleted_at', null)
      .order('order', { ascending: true })
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (controller && typeof query.abortSignal === 'function') {
      query = query.abortSignal(controller.signal);
    }

    const { data, error } = await query;

    if (error) {
      if (isMissingTableError(error)) return [];
      if (isUnavailableError(error)) {
        throw new Error('레퍼런스 데이터를 불러오지 못했습니다.');
      }
      console.error('Error fetching published reference items:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    if (isUnavailableError(error)) {
      throw new Error('레퍼런스 데이터를 불러오지 못했습니다.');
    }
    throw error;
  } finally {
    if (timeoutId) globalThis.clearTimeout(timeoutId);
  }
}

/**
 * 공개용 레퍼런스 모달 HTML (카드 클릭 시 단건 지연 로드)
 */
export async function getReferenceModalHtmlById(id, options = {}) {
  if (!supabase || !id) return '';

  const timeoutMs = options.timeoutMs ?? DEFAULT_REFERENCE_ITEMS_TIMEOUT_MS;
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeoutId =
    controller && Number.isFinite(timeoutMs) && timeoutMs > 0
      ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
      : null;

  try {
    let query = supabase
      .from('reference_items')
      .select('modal_html')
      .eq('id', id)
      .eq('is_published', true)
      .is('deleted_at', null)
      .limit(1);

    if (controller && typeof query.abortSignal === 'function') {
      query = query.abortSignal(controller.signal);
    }

    const { data, error } = await query;

    if (error) {
      if (isMissingTableError(error)) return '';
      if (isUnavailableError(error)) {
        throw new Error('모달 콘텐츠를 불러오지 못했습니다.');
      }
      console.error('Error fetching reference modal html:', error);
      throw error;
    }

    return data?.[0]?.modal_html || '';
  } catch (error) {
    if (isUnavailableError(error)) {
      throw new Error('모달 콘텐츠를 불러오지 못했습니다.');
    }
    throw error;
  } finally {
    if (timeoutId) globalThis.clearTimeout(timeoutId);
  }
}
