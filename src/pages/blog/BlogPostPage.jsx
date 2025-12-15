import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { usePost, useAdjacentPosts, useRelatedPosts } from '../../hooks/useBlog';
import BlogLayout from '../../components/blog/BlogLayout';
import MarkdownRenderer from '../../components/blog/MarkdownRenderer';
import BlogCard from '../../components/blog/BlogCard';
import SEOHead, { createBlogPostingJsonLd } from '../../components/blog/SEOHead';

export default function BlogPostPage() {
  const { slug } = useParams();
  const { post, loading, error } = usePost(slug);
  const { prev, next } = useAdjacentPosts(post?.id, post?.published_at);
  const { posts: relatedPosts } = useRelatedPosts(post?.id, post?.category?.id);

  // 로딩 상태
  if (loading) {
    return (
      <BlogLayout title="로딩 중...">
        <div className="blog-post-loading">
          <div className="loading-spinner" />
          <p>글을 불러오는 중...</p>
        </div>
        <style>{pageStyles}</style>
      </BlogLayout>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <BlogLayout title="오류">
        <div className="blog-post-error">
          <h1>글을 찾을 수 없습니다</h1>
          <p>{error}</p>
          <Link to="/blog" className="back-to-list-btn">
            블로그 목록으로 돌아가기
          </Link>
        </div>
        <style>{pageStyles}</style>
      </BlogLayout>
    );
  }

  // 포스트가 없는 경우
  if (!post) {
    return (
      <BlogLayout title="404">
        <div className="blog-post-error">
          <h1>글을 찾을 수 없습니다</h1>
          <p>요청하신 글이 존재하지 않거나 삭제되었습니다.</p>
          <Link to="/blog" className="back-to-list-btn">
            블로그 목록으로 돌아가기
          </Link>
        </div>
        <style>{pageStyles}</style>
      </BlogLayout>
    );
  }

  const publishedDate = post.published_at
    ? format(new Date(post.published_at), 'yyyy년 M월 d일', { locale: ko })
    : '';

  const pageUrl = `https://webinars.co.kr/blog/${post.slug}`;
  const jsonLd = createBlogPostingJsonLd({
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    url: pageUrl,
    image: post.featured_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    authorName: post.author?.name || '웨비나스',
    tags: post.tags?.map((t) => t.name) || [],
  });

  return (
    <BlogLayout title={post.title}>
      {/* SEO Head */}
      <SEOHead
        title={`${post.meta_title || post.title} | 웨비나스 블로그`}
        description={post.meta_description || post.excerpt}
        url={pageUrl}
        image={post.featured_image}
        type="article"
        article={{
          author: post.author?.name,
          publishedTime: post.published_at,
          modifiedTime: post.updated_at,
          tags: post.tags?.map((t) => t.name),
        }}
        jsonLd={jsonLd}
      />

      {/* 헤더 */}
      <header className="post-header">
        {post.featured_image && (
          <div
            className="post-hero"
            style={{ backgroundImage: `url(${post.featured_image})` }}
          >
            <div className="post-hero-overlay" />
          </div>
        )}

        <div className="post-header-content">
          <div className="post-breadcrumb">
            <Link to="/blog">블로그</Link>
            {post.category && (
              <>
                <span className="separator">/</span>
                <Link to={`/blog/category/${post.category.slug}`}>
                  {post.category.name}
                </Link>
              </>
            )}
          </div>

          <h1 className="post-title">{post.title}</h1>

          {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}

          <div className="post-meta">
            {post.author && (
              <div className="post-author">
                {post.author.avatar_url && (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.name}
                    className="author-avatar"
                  />
                )}
                <span className="author-name">{post.author.name}</span>
              </div>
            )}
            <span className="post-date">{publishedDate}</span>
            <span className="post-views">조회 {post.view_count}</span>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/blog/tag/${tag.slug}`}
                  className="tag"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 본문 */}
      <div className="post-body-wrapper">
        <article className="post-content">
          <MarkdownRenderer content={post.content} />
        </article>

        {/* 작성자 정보 */}
        {post.author && post.author.bio && (
          <div className="post-author-box">
            <div className="author-info">
              {post.author.avatar_url && (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.name}
                  className="author-avatar-large"
                />
              )}
              <div className="author-details">
                <h3>{post.author.name}</h3>
                <p>{post.author.bio}</p>
              </div>
            </div>
          </div>
        )}

        {/* 이전/다음 포스트 네비게이션 */}
        <nav className="post-navigation">
          {prev ? (
            <Link to={`/blog/${prev.slug}`} className="nav-prev">
              <span className="nav-label">이전 글</span>
              <span className="nav-title">{prev.title}</span>
            </Link>
          ) : (
            <div className="nav-prev disabled" />
          )}

          {next ? (
            <Link to={`/blog/${next.slug}`} className="nav-next">
              <span className="nav-label">다음 글</span>
              <span className="nav-title">{next.title}</span>
            </Link>
          ) : (
            <div className="nav-next disabled" />
          )}
        </nav>
      </div>

      {/* 관련 포스트 */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="related-posts">
          <div className="related-posts-inner">
            <h2>관련 글</h2>
            <div className="related-posts-grid">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 목록으로 돌아가기 */}
      <div className="back-to-list-wrapper">
        <Link to="/blog" className="back-to-list-btn">
          ← 블로그 목록으로
        </Link>
      </div>

      <style>{pageStyles}</style>
    </BlogLayout>
  );
}

const pageStyles = `
  .blog-post-loading,
  .blog-post-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    text-align: center;
    padding: 60px 20px;
    background: #ffffff;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid #e9ecef;
    border-top-color: #000000;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .blog-post-error h1 {
    font-size: 28px;
    color: #333;
    margin-bottom: 12px;
  }

  .blog-post-error p {
    color: #666;
    margin-bottom: 24px;
  }

  .back-to-list-btn {
    display: inline-block;
    padding: 14px 28px;
    background: #000000;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .back-to-list-btn:hover {
    background: #333333;
    transform: translateY(-2px);
  }

  /* 헤더 - 화이트 테마 */
  .post-header {
    position: relative;
    background: #ffffff;
    min-height: auto;
    display: block;
    padding-top: 120px;
  }

  .post-hero {
    position: relative;
    max-width: 1180px;
    margin: 0 auto 40px;
    height: 400px;
    background-size: cover;
    background-position: center;
    border-radius: 12px;
    overflow: hidden;
  }

  .post-hero-overlay {
    display: none;
  }

  .post-header-content {
    position: relative;
    z-index: 1;
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 20px 60px;
    width: 100%;
  }

  .post-breadcrumb {
    margin-bottom: 20px;
  }

  .post-breadcrumb a {
    color: #666666;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;
  }

  .post-breadcrumb a:hover {
    color: #0066cc;
  }

  .post-breadcrumb .separator {
    margin: 0 10px;
    color: #cccccc;
  }

  .post-title {
    font-family: 'hyphen', sans-serif;
    font-size: 48px;
    font-weight: 700;
    color: #000000;
    line-height: 1.2;
    margin: 0 0 20px;
    word-break: keep-all;
  }

  @media (max-width: 768px) {
    .post-header {
      padding-top: 80px;
    }

    .post-hero {
      height: 250px;
      border-radius: 8px;
    }

    .post-title {
      font-size: 32px;
    }

    .post-header-content {
      padding: 0 20px 40px;
    }
  }

  .post-excerpt {
    font-size: 18px;
    color: #333333;
    line-height: 1.7;
    margin: 0 0 24px;
  }

  .post-meta {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    color: #666666;
    font-size: 14px;
  }

  .post-author {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .author-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e0e0e0;
  }

  .author-name {
    font-weight: 500;
    color: #333333;
  }

  .post-tags {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 20px;
  }

  .post-tags .tag {
    padding: 6px 14px;
    background: #f5f5f5;
    color: #333333;
    border-radius: 20px;
    font-size: 13px;
    text-decoration: none;
    transition: background 0.2s;
    border: 1px solid #e0e0e0;
  }

  .post-tags .tag:hover {
    background: #e0e0e0;
  }

  /* 본문 영역 */
  .post-body-wrapper {
    background: #ffffff;
  }

  .post-content {
    max-width: 1180px;
    margin: 0 auto;
    padding: 60px 20px;
    background: white;
    position: relative;
    z-index: 2;
    border-radius: 0;
    box-shadow: none;
    border-top: 1px solid #e0e0e0;
  }

  /* 작성자 박스 */
  .post-author-box {
    max-width: 1180px;
    margin: 0 auto;
    padding: 40px 20px;
    background: white;
    border-top: 1px solid #eee;
  }

  .author-info {
    display: flex;
    gap: 24px;
    align-items: center;
  }

  .author-avatar-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #f0f0f0;
  }

  .author-details h3 {
    margin: 0 0 8px;
    font-size: 18px;
    color: #333;
  }

  .author-details p {
    margin: 0;
    color: #666;
    line-height: 1.7;
    font-size: 14px;
  }

  @media (max-width: 640px) {
    .author-info {
      flex-direction: column;
      text-align: center;
    }
  }

  /* 네비게이션 */
  .post-navigation {
    max-width: 1180px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    padding: 20px;
    background: white;
    border-top: 1px solid #eee;
    border-radius: 0;
  }

  @media (max-width: 640px) {
    .post-navigation {
      grid-template-columns: 1fr;
    }
  }

  .nav-prev,
  .nav-next {
    display: flex;
    flex-direction: column;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
    text-decoration: none;
    transition: all 0.2s;
    border: 1px solid transparent;
  }

  .nav-prev:hover,
  .nav-next:hover {
    background: #f0f0f5;
    border-color: #e0e0e0;
    transform: translateY(-2px);
  }

  .nav-prev.disabled,
  .nav-next.disabled {
    visibility: hidden;
  }

  .nav-next {
    text-align: right;
  }

  .nav-label {
    font-size: 12px;
    color: #888;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .nav-title {
    font-size: 15px;
    color: #333;
    font-weight: 500;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* 관련 포스트 */
  .related-posts {
    background: #f5f5f5;
    padding: 60px 0;
  }

  .related-posts-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .related-posts h2 {
    font-size: 28px;
    margin: 0 0 32px;
    text-align: center;
    color: #333;
  }

  .related-posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
  }

  /* 목록으로 돌아가기 */
  .back-to-list-wrapper {
    text-align: center;
    padding: 40px 20px 80px;
    background: #ffffff;
  }

  .back-to-list-wrapper .back-to-list-btn {
    background: transparent;
    color: #000000;
    border: 2px solid #000000;
  }

  .back-to-list-wrapper .back-to-list-btn:hover {
    background: #000000;
    color: white;
  }
`;
