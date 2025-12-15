import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function BlogPagination({ currentPage, totalPages, basePath = '/blog' }) {
  const location = useLocation();

  if (totalPages <= 1) return null;

  // 페이지 범위 계산 (현재 페이지 주변 2개씩)
  const getPageRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const getPageUrl = (page) => {
    const params = new URLSearchParams(location.search);
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page);
    }
    const queryString = params.toString();
    return `${basePath}${queryString ? `?${queryString}` : ''}`;
  };

  const pages = getPageRange();

  return (
    <nav className="blog-pagination" aria-label="페이지 네비게이션">
      {/* 이전 페이지 */}
      {currentPage > 1 ? (
        <Link
          to={getPageUrl(currentPage - 1)}
          className="pagination-btn prev"
          aria-label="이전 페이지"
        >
          <span className="pagination-arrow">←</span>
          <span className="pagination-text">이전</span>
        </Link>
      ) : (
        <span className="pagination-btn prev disabled">
          <span className="pagination-arrow">←</span>
          <span className="pagination-text">이전</span>
        </span>
      )}

      {/* 페이지 번호 */}
      <div className="pagination-numbers">
        {pages.map((page, index) =>
          page === '...' ? (
            <span key={`dots-${index}`} className="pagination-dots">
              ...
            </span>
          ) : (
            <Link
              key={page}
              to={getPageUrl(page)}
              className={`pagination-number ${page === currentPage ? 'active' : ''}`}
              aria-label={`페이지 ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {/* 다음 페이지 */}
      {currentPage < totalPages ? (
        <Link
          to={getPageUrl(currentPage + 1)}
          className="pagination-btn next"
          aria-label="다음 페이지"
        >
          <span className="pagination-text">다음</span>
          <span className="pagination-arrow">→</span>
        </Link>
      ) : (
        <span className="pagination-btn next disabled">
          <span className="pagination-text">다음</span>
          <span className="pagination-arrow">→</span>
        </span>
      )}

      <style>{`
        .blog-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin: 40px 0;
          padding: 20px 0;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(.disabled) {
          background: #f5f5f5;
          border-color: #ccc;
        }

        .pagination-btn.disabled {
          color: #ccc;
          cursor: not-allowed;
        }

        .pagination-arrow {
          font-size: 16px;
        }

        .pagination-numbers {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pagination-number {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
          height: 40px;
          font-size: 14px;
          color: #333;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .pagination-number:hover:not(.active) {
          background: #f5f5f5;
        }

        .pagination-number.active {
          background: #0066cc;
          color: #fff;
          font-weight: 600;
        }

        .pagination-dots {
          padding: 0 8px;
          color: #999;
        }

        @media (max-width: 640px) {
          .pagination-text {
            display: none;
          }

          .pagination-btn {
            padding: 10px 12px;
          }

          .pagination-number {
            min-width: 36px;
            height: 36px;
          }
        }
      `}</style>
    </nav>
  );
}
