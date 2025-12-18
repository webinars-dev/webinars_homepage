import { supabase } from '../lib/supabase';

const isMissingTableError = (error) => {
  if (!error) return false;
  if (error.code === '42P01') return true; // undefined_table
  return typeof error.message === 'string' && error.message.includes('reference_items');
};

/**
 * 공개용 레퍼런스 목록 (발행된 항목만)
 */
export async function getPublishedReferenceItems() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reference_items')
    .select('id, category, title, client, image_url, modal_path, modal_html, col_span, order, created_at, updated_at')
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    console.error('Error fetching published reference items:', error);
    throw error;
  }

  return data || [];
}
