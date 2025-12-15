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
    .select('id, category, title, client, image_url, modal_path, col_span, order, is_published, created_at, updated_at')
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
  const user = await requireUser();

  const payload = {
    ...fields,
    updated_by: user.id,
  };

  const { data, error } = await supabase
    .from('reference_items')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReferenceItem(id, fields) {
  const user = await requireUser();

  const payload = {
    ...fields,
    updated_by: user.id,
  };

  const { data, error } = await supabase
    .from('reference_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function softDeleteReferenceItem(id) {
  const user = await requireUser();

  const { error } = await supabase
    .from('reference_items')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
      updated_by: user.id,
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

