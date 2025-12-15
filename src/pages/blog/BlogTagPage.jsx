import React from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { usePosts, useTags } from '../../hooks/useBlog';
import BlogLayout from '../../components/blog/BlogLayout';
import BlogCard from '../../components/blog/BlogCard';
import BlogSidebar from '../../components/blog/BlogSidebar';
import BlogPagination from '../../components/blog/BlogPagination';
import SEOHead from '../../components/blog/SEOHead';

export default function BlogTagPage() {
  const { tagSlug } = useParams();
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { posts, total, totalPages, loading, error } = usePosts({
    page,
    tagSlug,
  });

  const { tags } = useTags();
  const currentTag = tags.find((t) => t.slug === tagSlug);

  return (
    <BlogLayout title={currentTag ? `#${currentTag.name} - 블로그` : '블로그'}>
      <SEOHead
        title={currentTag ? `#${currentTag.name} | 웨비나스 블로그` : '블로그 | 웨비나스'}
        description={`#${currentTag?.name || tagSlug} 태그와 관련된 웨비나스 블로그 글 모음`}
        url={`https://webinars.co.kr/blog/tag/${tagSlug}`}
      />

      {/* 페이지 헤더 */}
      <div className="blog-page-header">
        <div className="blog-page-header-inner">
          <nav className="blog-breadcrumb">
            <Link to="/blog">블로그</Link>
            <span className="separator">/</span>
            <span>태그</span>
          </nav>
          <h1 className="blog-title">#{currentTag?.name || tagSlug}</h1>
          <p className="blog-subtitle">태그와 관련된 글 모음</p>
        </div>
      </div>

      <div className="blog-content-wrapper">
        <div className="blog-container">
          <main className="blog-main">
            {/* 로딩 상태 */}
            {loading && (
              <div className="blog-loading">
                <div className="loading-spinner" />
                <p>글을 불러오는 중...</p>
              </div>
            )}

            {/* 에러 상태 */}
            {error && (
              <div className="blog-error">
                <p>글을 불러오는 중 오류가 발생했습니다.</p>
                <p className="error-detail">{error}</p>
              </div>
            )}

            {/* 빈 상태 */}
            {!loading && !error && posts.length === 0 && (
              <div className="blog-empty">
                <div className="empty-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM14.14 11.86L11.14 15.73L9 13.14L6 17H18L14.14 11.86Z" fill="#ccc"/>
                  </svg>
                </div>
                <p>이 태그로 작성된 글이 없습니다.</p>
                <Link to="/blog" className="back-link">
                  모든 글 보기
                </Link>
              </div>
            )}

            {/* 포스트 목록 */}
            {!loading && !error && posts.length > 0 && (
              <>
                <div className="blog-grid">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <BlogPagination
                    currentPage={page}
                    totalPages={totalPages}
                    basePath={`/blog/tag/${tagSlug}`}
                  />
                )}

                {/* 결과 요약 */}
                <div className="blog-summary">
                  <p>
                    총 {total}개의 글 중 {(page - 1) * 12 + 1}-
                    {Math.min(page * 12, total)}번째
                  </p>
                </div>
              </>
            )}
          </main>

          <aside className="blog-sidebar-wrapper">
            <BlogSidebar />
          </aside>
        </div>
      </div>

      <style>{pageStyles}</style>
    </BlogLayout>
  );
}

const pageStyles = `
  .blog-page-header {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 80px 20px 60px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .blog-page-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/></svg>');
    background-size: 100px 100px;
    opacity: 0.5;
  }

  .blog-page-header-inner {
    position: relative;
    z-index: 1;
    max-width: 800px;
    margin: 0 auto;
  }

  .blog-breadcrumb {
    margin-bottom: 16px;
    font-size: 14px;
  }

  .blog-breadcrumb a {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transition: color 0.2s;
  }

  .blog-breadcrumb a:hover {
    color: white;
  }

  .blog-breadcrumb .separator {
    margin: 0 10px;
    color: rgba(255, 255, 255, 0.4);
  }

  .blog-breadcrumb span:last-child {
    color: rgba(255, 255, 255, 0.9);
  }

  .blog-title {
    font-family: 'hyphen', sans-serif;
    color: white;
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 16px;
    letter-spacing: -0.02em;
  }

  .blog-subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: 18px;
    margin: 0;
    font-weight: 400;
  }

  .blog-content-wrapper {
    background: #f5f5f5;
    padding: 60px 0;
    min-height: 60vh;
  }

  .blog-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 40px;
  }

  @media (max-width: 992px) {
    .blog-container {
      grid-template-columns: 1fr;
    }

    .blog-sidebar-wrapper {
      order: -1;
    }
  }

  @media (max-width: 768px) {
    .blog-title {
      font-size: 36px;
    }

    .blog-page-header {
      padding: 60px 20px 40px;
    }
  }

  .blog-main {
    min-width: 0;
  }

  .blog-loading,
  .blog-error,
  .blog-empty {
    text-align: center;
    padding: 80px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid #e9ecef;
    border-top-color: #1a1a2e;
    border-radius: 50%;
    margin: 0 auto 20px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .blog-error {
    color: #dc3545;
  }

  .error-detail {
    font-size: 14px;
    color: #6c757d;
    margin-top: 8px;
  }

  .blog-empty .empty-icon {
    margin-bottom: 20px;
  }

  .blog-empty p {
    font-size: 18px;
    color: #333;
    margin: 0 0 16px;
  }

  .back-link {
    display: inline-block;
    padding: 12px 24px;
    background: #1a1a2e;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: background 0.2s;
  }

  .back-link:hover {
    background: #2d2d44;
  }

  .blog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }

  @media (max-width: 640px) {
    .blog-grid {
      grid-template-columns: 1fr;
    }
  }

  .blog-summary {
    text-align: center;
    margin-top: 32px;
    color: #888;
    font-size: 14px;
  }

  .blog-sidebar-wrapper {
    position: sticky;
    top: 90px;
    height: fit-content;
  }
`;
