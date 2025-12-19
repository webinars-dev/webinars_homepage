import { supabase } from '../lib/supabase';

/**
 * 관리자용 포스트 목록 조회 (모든 상태)
 */
export async function getAdminPosts({ page = 1, pageSize = 20, status } = {}) {
  if (!supabase) {
    return { posts: [], total: 0, page: 1, pageSize, totalPages: 0 };
  }

  let query = supabase
    .from('posts')
    .select(`
      id,
      slug,
      title,
      excerpt,
      featured_image,
      status,
      published_at,
      scheduled_at,
      created_at,
      updated_at,
      view_count,
      author:authors!posts_author_id_fkey(id, name),
      category:categories(id, name, slug)
    `, { count: 'exact' })
    .is('deleted_at', null)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: posts, error, count } = await query;

  if (error) {
    console.error('Error fetching admin posts:', error);
    throw error;
  }

  return {
    posts: posts || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
}

/**
 * 포스트 상세 조회 (관리자용 - 모든 상태)
 */
export async function getPostById(id) {
  if (!supabase) return null;

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:authors!posts_author_id_fkey(id, name, avatar_url),
      category:categories(id, name, slug)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // 태그 가져오기
  const { data: postTags } = await supabase
    .from('post_tags')
    .select('tag_id, tag:tags(id, name, slug)')
    .eq('post_id', post.id);

  return {
    ...post,
    tags: postTags?.map(pt => pt.tag) || [],
    tag_ids: postTags?.map(pt => pt.tag_id) || []
  };
}

/**
 * 새 포스트 생성
 */
export async function createPost(postData) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 작성자 정보 가져오기 또는 생성
  let { data: author } = await supabase
    .from('authors')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!author) {
    // 작성자가 없으면 생성
    const { data: newAuthor, error: authorError } = await supabase
      .from('authors')
      .insert({
        id: user.id,
        name: user.email?.split('@')[0] || 'Admin',
        email: user.email,
        role: 'admin'
      })
      .select()
      .single();

    if (authorError) throw authorError;
    author = newAuthor;
  }

  const { tag_ids, ...postFields } = postData;

  // 빈 문자열을 null로 변환 (timestamp 필드)
  if (postFields.scheduled_at === '') {
    postFields.scheduled_at = null;
  }

  const now = new Date().toISOString();
  if (postFields.status === 'published' && !postFields.published_at) {
    postFields.published_at = now;
    postFields.published_by = user.id;
    postFields.scheduled_at = null;
  }

  // 포스트 생성
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      ...postFields,
      author_id: author.id,
      status: postFields.status || 'draft',
      created_at: now,
      updated_at: now
    })
    .select()
    .single();

  if (error) throw error;

  // 태그 연결
  if (tag_ids?.length > 0) {
    const postTags = tag_ids.map(tag_id => ({
      post_id: post.id,
      tag_id
    }));

    const { error: tagError } = await supabase
      .from('post_tags')
      .insert(postTags);

    if (tagError) {
      console.error('Error linking tags:', tagError);
    }
  }

  return post;
}

/**
 * 포스트 수정
 */
export async function updatePost(id, postData) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { tag_ids, ...postFields } = postData;

  // 빈 문자열을 null로 변환 (timestamp 필드)
  if (postFields.scheduled_at === '') {
    postFields.scheduled_at = null;
  }

  if (postFields.status === 'published') {
    const { data: currentPost, error: currentError } = await supabase
      .from('posts')
      .select('status, published_at')
      .eq('id', id)
      .single();

    if (currentError) throw currentError;

    if (!currentPost?.published_at || currentPost?.status !== 'published') {
      postFields.published_at = new Date().toISOString();
      postFields.published_by = user.id;
      postFields.scheduled_at = null;
    }
  }

  // 포스트 업데이트
  const { data: post, error } = await supabase
    .from('posts')
    .update({
      ...postFields,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // 기존 태그 삭제 후 새로 연결
  if (tag_ids !== undefined) {
    await supabase
      .from('post_tags')
      .delete()
      .eq('post_id', id);

    if (tag_ids?.length > 0) {
      const postTags = tag_ids.map(tag_id => ({
        post_id: id,
        tag_id
      }));

      const { error: tagError } = await supabase
        .from('post_tags')
        .insert(postTags);

      if (tagError) {
        console.error('Error linking tags:', tagError);
      }
    }
  }

  return post;
}

/**
 * 포스트 삭제 (soft delete)
 */
export async function deletePost(id) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('posts')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id
    })
    .eq('id', id);

  if (error) throw error;
}

/**
 * 포스트 발행
 */
export async function publishPost(id) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      published_by: user.id,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 포스트 비발행 (draft로 변경)
 */
export async function unpublishPost(id) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .update({
      status: 'draft',
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 이미지 업로드
 */
export async function uploadImage(file, postId = 'temp') {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 파일 확장자 검증
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('허용되지 않는 파일 형식입니다. (jpg, png, webp, gif만 가능)');
  }

  // 파일 크기 검증 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('파일 크기는 5MB 이하여야 합니다.');
  }

  // 파일명 생성
  const ext = file.name.split('.').pop();
  const fileName = `${user.id}/${postId}/${crypto.randomUUID()}.${ext}`;

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

/**
 * 카테고리 CRUD
 */
export async function createCategory({ name, slug, description, order = 0 }) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug, description, order })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id, { name, slug, description, order }) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('categories')
    .update({ name, slug, description, order, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * 태그 CRUD
 */
export async function createTag({ name, slug }) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('tags')
    .insert({ name, slug })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTag(id) {
  if (!supabase) throw new Error('Supabase is not configured');

  // 먼저 post_tags에서 삭제
  await supabase
    .from('post_tags')
    .delete()
    .eq('tag_id', id);

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * 슬러그 생성 유틸
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
