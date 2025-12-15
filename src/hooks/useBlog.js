import { useState, useEffect, useCallback } from 'react';
import * as blogService from '../services/blogService';

/**
 * 블로그 포스트 목록 훅
 */
export function usePosts({ page = 1, categorySlug, tagSlug } = {}) {
  const [data, setData] = useState({
    posts: [],
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPosts() {
      setLoading(true);
      setError(null);

      try {
        const result = await blogService.getPosts({ page, categorySlug, tagSlug });
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch posts');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPosts();

    return () => {
      cancelled = true;
    };
  }, [page, categorySlug, tagSlug]);

  return { ...data, loading, error };
}

/**
 * 블로그 포스트 상세 훅
 */
export function usePost(slug) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPost() {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await blogService.getPostBySlug(slug);
        if (!cancelled) {
          setPost(result);
          if (!result) {
            setError('Post not found');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch post');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPost();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { post, loading, error };
}

/**
 * 이전/다음 포스트 훅
 */
export function useAdjacentPosts(postId, publishedAt) {
  const [adjacent, setAdjacent] = useState({ prev: null, next: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAdjacent() {
      if (!postId || !publishedAt) {
        setLoading(false);
        return;
      }

      try {
        const result = await blogService.getAdjacentPosts(postId, publishedAt);
        if (!cancelled) {
          setAdjacent(result);
        }
      } catch (err) {
        console.error('Error fetching adjacent posts:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAdjacent();

    return () => {
      cancelled = true;
    };
  }, [postId, publishedAt]);

  return { ...adjacent, loading };
}

/**
 * 관련 포스트 훅
 */
export function useRelatedPosts(postId, categoryId, limit = 3) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRelated() {
      if (!postId || !categoryId) {
        setLoading(false);
        return;
      }

      try {
        const result = await blogService.getRelatedPosts(postId, categoryId, limit);
        if (!cancelled) {
          setPosts(result);
        }
      } catch (err) {
        console.error('Error fetching related posts:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRelated();

    return () => {
      cancelled = true;
    };
  }, [postId, categoryId, limit]);

  return { posts, loading };
}

/**
 * 카테고리 목록 훅
 */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const result = await blogService.getCategories();
        if (!cancelled) {
          setCategories(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch categories');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}

/**
 * 태그 목록 훅
 */
export function useTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTags() {
      try {
        const result = await blogService.getTags();
        if (!cancelled) {
          setTags(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch tags');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTags();

    return () => {
      cancelled = true;
    };
  }, []);

  return { tags, loading, error };
}

/**
 * 인기 포스트 훅
 */
export function usePopularPosts(limit = 5) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPopular() {
      try {
        const result = await blogService.getPopularPosts(limit);
        if (!cancelled) {
          setPosts(result);
        }
      } catch (err) {
        console.error('Error fetching popular posts:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPopular();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { posts, loading };
}
