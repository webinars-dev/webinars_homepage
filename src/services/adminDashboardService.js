import { supabase } from '../lib/supabase';

const PAGE_SIZE = 1000;
const MAX_ROWS_FOR_SUM = 20000;

const sumPostViews = async () => {
  if (!supabase) return null;

  let totalViews = 0;
  let offset = 0;

  while (offset < MAX_ROWS_FOR_SUM) {
    const { data, error } = await supabase
      .from('posts')
      .select('view_count')
      .is('deleted_at', null)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      totalViews += Number(row?.view_count || 0);
    }

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return totalViews;
};

const getExactCount = async (query) => {
  const { count, error } = await query.select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
};

export async function getBlogStats() {
  if (!supabase) return null;

  const base = supabase.from('posts').is('deleted_at', null);

  const [total, published, draft, scheduled, totalViewsResult, recentResult] = await Promise.all([
    getExactCount(base),
    getExactCount(base.eq('status', 'published')),
    getExactCount(base.eq('status', 'draft')),
    getExactCount(base.eq('status', 'scheduled')),
    sumPostViews(),
    supabase
      .from('posts')
      .select('id, slug, title, status, updated_at, view_count')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (recentResult.error) throw recentResult.error;

  return {
    total,
    published,
    draft,
    scheduled,
    totalViews: totalViewsResult,
    recent: recentResult.data || [],
  };
}

export async function getReferenceStats() {
  if (!supabase) return null;

  const base = supabase.from('reference_items').is('deleted_at', null);

  const [total, published, recentResult] = await Promise.all([
    getExactCount(base),
    getExactCount(base.eq('is_published', true)),
    supabase
      .from('reference_items')
      .select('id, title, category, updated_at, is_published')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (recentResult.error) throw recentResult.error;

  return {
    total,
    published,
    recent: recentResult.data || [],
  };
}

