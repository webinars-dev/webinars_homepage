import { supabase } from '../lib/supabase';

const PAGE_SIZE = 12;

// Supabase가 없으면 빈 결과 반환
const emptyResult = { posts: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 };

/**
 * 발행된 블로그 포스트 목록 조회
 */
export async function getPosts({ page = 1, categorySlug, tagSlug } = {}) {
  if (!supabase) return emptyResult;

  let query = supabase
    .from('posts')
    .select(`
      id,
      slug,
      title,
      excerpt,
      featured_image,
      published_at,
      view_count,
      author:authors!posts_author_id_fkey(id, name, avatar_url),
      category:categories(id, name, slug)
    `, { count: 'exact' })
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  // 카테고리 필터
  if (categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (category) {
      query = query.eq('category_id', category.id);
    }
  }

  // 태그 필터
  if (tagSlug) {
    const { data: tag } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', tagSlug)
      .single();

    if (tag) {
      const { data: postIds } = await supabase
        .from('post_tags')
        .select('post_id')
        .eq('tag_id', tag.id);

      if (postIds?.length) {
        query = query.in('id', postIds.map(p => p.post_id));
      } else {
        return { posts: [], total: 0, page, pageSize: PAGE_SIZE, totalPages: 0 };
      }
    }
  }

  // 페이지네이션
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: posts, error, count } = await query;

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }

  // 각 포스트의 태그 가져오기
  const postsWithTags = await Promise.all(
    (posts || []).map(async (post) => {
      const { data: postTags } = await supabase
        .from('post_tags')
        .select('tag:tags(id, name, slug)')
        .eq('post_id', post.id);

      return {
        ...post,
        tags: postTags?.map(pt => pt.tag) || []
      };
    })
  );

  return {
    posts: postsWithTags,
    total: count || 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE)
  };
}

/**
 * 슬러그로 포스트 상세 조회
 */
export async function getPostBySlug(slug) {
  if (!supabase) return null;

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      id,
      slug,
      title,
      excerpt,
      content,
      featured_image,
      published_at,
      updated_at,
      view_count,
      meta_title,
      meta_description,
      author:authors!posts_author_id_fkey(id, name, avatar_url, bio),
      category:categories(id, name, slug)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching post:', error);
    throw error;
  }

  // 태그 가져오기
  const { data: postTags } = await supabase
    .from('post_tags')
    .select('tag:tags(id, name, slug)')
    .eq('post_id', post.id);

  // 조회수 증가 (RPC 함수 사용, 에러 무시)
  // RLS를 우회하여 익명 사용자도 조회수 증가 가능
  supabase
    .rpc('increment_view_count', { post_id: post.id })
    .then(({ error }) => {
      if (error) {
        console.warn('Failed to increment view count:', error.message);
      }
    });

  return {
    ...post,
    tags: postTags?.map(pt => pt.tag) || []
  };
}

/**
 * 이전/다음 포스트 가져오기
 */
export async function getAdjacentPosts(currentPostId, publishedAt) {
  if (!supabase) return { prev: null, next: null };

  const [prevResult, nextResult] = await Promise.all([
    // 이전 포스트 (더 오래된 것)
    supabase
      .from('posts')
      .select('id, slug, title, featured_image')
      .eq('status', 'published')
      .is('deleted_at', null)
      .lt('published_at', publishedAt)
      .neq('id', currentPostId)
      .order('published_at', { ascending: false })
      .limit(1)
      .single(),

    // 다음 포스트 (더 최신)
    supabase
      .from('posts')
      .select('id, slug, title, featured_image')
      .eq('status', 'published')
      .is('deleted_at', null)
      .gt('published_at', publishedAt)
      .neq('id', currentPostId)
      .order('published_at', { ascending: true })
      .limit(1)
      .single()
  ]);

  return {
    prev: prevResult.data || null,
    next: nextResult.data || null
  };
}

/**
 * 관련 포스트 가져오기 (같은 카테고리)
 */
export async function getRelatedPosts(postId, categoryId, limit = 3) {
  if (!supabase) return [];

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      slug,
      title,
      excerpt,
      featured_image,
      published_at
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .eq('category_id', categoryId)
    .neq('id', postId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }

  return posts || [];
}

/**
 * 모든 카테고리 가져오기
 */
export async function getCategories() {
  if (!supabase) return [];

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .order('order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return categories || [];
}

/**
 * 모든 태그 가져오기
 */
export async function getTags() {
  if (!supabase) return [];

  const { data: tags, error } = await supabase
    .from('tags')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }

  return tags || [];
}

/**
 * 인기 포스트 가져오기
 */
export async function getPopularPosts(limit = 5) {
  if (!supabase) return [];

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      slug,
      title,
      featured_image,
      view_count
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching popular posts:', error);
    return [];
  }

  return posts || [];
}
