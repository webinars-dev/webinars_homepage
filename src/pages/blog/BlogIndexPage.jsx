import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { usePosts, useCategories } from '../../hooks/useBlog';
import BlogLayout from '../../components/blog/BlogLayout';
import BlogPagination from '../../components/blog/BlogPagination';
import SEOHead from '../../components/blog/SEOHead';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function BlogIndexPage() {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const categorySlug = searchParams.get('category');
  const tagSlug = searchParams.get('tag');

  const { posts, total, totalPages, loading, error } = usePosts({
    page,
    categorySlug,
    tagSlug,
  });

  const { categories } = useCategories();

  // 현재 필터 정보
  const currentCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;

  return (
    <BlogLayout title="블로그">
      <SEOHead
        title="블로그 | 웨비나스"
        description="웨비나스의 인사이트와 소식을 만나보세요. 웨비나, 하이브리드 이벤트, 라이브 스트리밍 관련 최신 정보를 제공합니다."
        url="https://webinars.co.kr/blog"
        type="website"
      />

      {/* 페이지 헤더 */}
      <div className="blog-page-header">
        <div className="blog-page-header-inner">
          <div className="blog-header-top">
            <div>
              <h1 className="blog-title">Blog</h1>
              <p className="blog-subtitle">웨비나스의 인사이트와 소식을 만나보세요</p>
            </div>
          </div>
        </div>
      </div>

      <div className="blog-content-wrapper">
        <div className="blog-container">
          <main className="blog-main">
            {/* 필터 표시 */}
            {(categorySlug || tagSlug) && (
              <div className="blog-filter-info">
                {currentCategory && (
                  <span className="filter-badge">
                    카테고리: {currentCategory.name}
                  </span>
                )}
                {tagSlug && <span className="filter-badge">태그: #{tagSlug}</span>}
                <Link to="/blog" className="filter-clear">
                  모든 글 보기
                </Link>
              </div>
            )}

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
                <p>아직 작성된 글이 없습니다.</p>
                <span className="empty-sub">곧 새로운 콘텐츠로 찾아뵙겠습니다.</span>
              </div>
            )}

            {/* 포스트 목록 */}
            {!loading && !error && posts.length > 0 && (
              <>
                <div className="blog-list">
                  {posts.map((post) => {
                    const formattedDate = post.published_at
                      ? format(new Date(post.published_at), 'yyyy.M.d', { locale: ko })
                      : '';
                    return (
                      <article key={post.id} className="blog-list-item">
                        <Link to={`/blog/${post.slug}`} className="blog-list-link">
                          <h2 className="blog-list-title">{post.title}</h2>
                          <p className="blog-list-excerpt">{post.excerpt}</p>
                          <span className="blog-list-date">{formattedDate}</span>
                        </Link>
                      </article>
                    );
                  })}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <BlogPagination
                    currentPage={page}
                    totalPages={totalPages}
                    basePath="/blog"
                    queryParams={
                      categorySlug
                        ? { category: categorySlug }
                        : tagSlug
                          ? { tag: tagSlug }
                          : {}
                    }
                  />
                )}

                {/* 결과 요약 */}
                <div className="blog-summary">
                  <p>
                    총 {total}개의 글 중 {(page - 1) * 12 + 1}-
                    {Math.min(page * 12, total)}번째
                  </p>
                  <Link to="/admin/blog/new" className="blog-write-link">
                    글 작성
                  </Link>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <style>{`
        .blog-page-header {
          background: #ffffff;
          padding: 120px 20px 60px;
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .blog-page-header-inner {
          position: relative;
          z-index: 1;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .blog-title {
          font-family: 'hyphen', sans-serif;
          color: #000000;
          font-size: 86px;
          font-weight: 700;
          margin: 0 0 16px;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          line-height: 1.08;
        }

        .blog-subtitle {
          color: #333333;
          font-size: 20px;
          margin: 0;
          font-weight: 700;
          line-height: 1.6;
        }

        .blog-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
        }

        .blog-content-wrapper {
          background: #ffffff;
          padding: 60px 0;
          min-height: 60vh;
        }

        .blog-container {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 20px;
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

        .blog-filter-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding: 16px 20px;
          background: #f5f5f5;
          border-radius: 12px;
          border: 1px solid #e0e0e0;
        }

        .filter-badge {
          padding: 6px 14px;
          background: #000000;
          color: #fff;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        .filter-clear {
          margin-left: auto;
          color: #0066cc;
          font-size: 14px;
          text-decoration: none;
          font-weight: 500;
        }

        .filter-clear:hover {
          text-decoration: underline;
        }

        .blog-loading,
        .blog-error,
        .blog-empty {
          text-align: center;
          padding: 80px 20px;
          background: #f5f5f5;
          border-radius: 12px;
          border: 1px solid #e0e0e0;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #e9ecef;
          border-top-color: #000000;
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
          margin: 0 0 8px;
        }

        .blog-empty .empty-sub {
          color: #888;
          font-size: 14px;
        }

        /* 블로그 리스트 스타일 */
        .blog-list {
          display: flex;
          flex-direction: column;
        }

        .blog-list-item {
          border-bottom: 1px solid #e0e0e0;
        }

        .blog-list-item:last-child {
          border-bottom: none;
        }

        .blog-list-link {
          display: block;
          padding: 32px 0;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .blog-list-link:hover {
          opacity: 0.7;
        }

        .blog-list-title {
          font-family: 'hyphen', 'Noto Sans KR', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #000000;
          margin: 0 0 12px;
          line-height: 1.4;
          word-break: keep-all;
        }

        .blog-list-excerpt {
          font-size: 15px;
          color: #666666;
          line-height: 1.7;
          margin: 0 0 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .blog-list-date {
          font-size: 13px;
          color: #999999;
        }

        @media (max-width: 640px) {
          .blog-list-link {
            padding: 24px 0;
          }

          .blog-list-title {
            font-size: 18px;
          }

          .blog-list-excerpt {
            font-size: 14px;
          }
        }

        .blog-summary {
          text-align: center;
          margin-top: 32px;
          color: #888;
          font-size: 14px;
        }

        .blog-write-link {
          display: inline-block;
          margin-top: 12px;
          color: #aaa;
          font-size: 12px;
          text-decoration: none;
          transition: color 0.2s;
        }

        .blog-write-link:hover {
          color: #666;
        }
      `}</style>
    </BlogLayout>
  );
}
