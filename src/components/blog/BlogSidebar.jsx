import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCategories, useTags, usePopularPosts } from '../../hooks/useBlog';

export default function BlogSidebar() {
  const { category: currentCategory, tag: currentTag } = useParams();
  const { categories, loading: categoriesLoading } = useCategories();
  const { tags, loading: tagsLoading } = useTags();
  const { posts: popularPosts, loading: popularLoading } = usePopularPosts(5);

  return (
    <aside className="blog-sidebar">
      {/* 인기 포스트 */}
      <div className="sidebar-section">
        <h3 className="sidebar-title">인기 포스트</h3>
        {popularLoading ? (
          <div className="sidebar-loading">로딩 중...</div>
        ) : popularPosts.length > 0 ? (
          <ul className="popular-posts">
            {popularPosts.map((post, index) => (
              <li key={post.id} className="popular-post-item">
                <span className="popular-post-rank">{index + 1}</span>
                <Link to={`/blog/${post.slug}`} className="popular-post-link">
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sidebar-empty">아직 포스트가 없습니다.</p>
        )}
      </div>

      {/* 카테고리 */}
      <div className="sidebar-section">
        <h3 className="sidebar-title">카테고리</h3>
        {categoriesLoading ? (
          <div className="sidebar-loading">로딩 중...</div>
        ) : (
          <ul className="category-list">
            <li className={!currentCategory ? 'active' : ''}>
              <Link to="/blog">전체</Link>
            </li>
            {categories.map((cat) => (
              <li
                key={cat.id}
                className={currentCategory === cat.slug ? 'active' : ''}
              >
                <Link to={`/blog/category/${cat.slug}`}>{cat.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 태그 클라우드 */}
      <div className="sidebar-section">
        <h3 className="sidebar-title">태그</h3>
        {tagsLoading ? (
          <div className="sidebar-loading">로딩 중...</div>
        ) : tags.length > 0 ? (
          <div className="tag-cloud">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/blog/tag/${tag.slug}`}
                className={`tag-item ${currentTag === tag.slug ? 'active' : ''}`}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="sidebar-empty">등록된 태그가 없습니다.</p>
        )}
      </div>

      <style>{`
        .blog-sidebar {
          width: 300px;
          flex-shrink: 0;
        }

        .sidebar-section {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .sidebar-title {
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 20px;
          padding-bottom: 14px;
          border-bottom: 2px solid #1a1a2e;
          color: #1a1a2e;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sidebar-loading,
        .sidebar-empty {
          font-size: 14px;
          color: #999;
        }

        /* 인기 포스트 */
        .popular-posts {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .popular-post-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .popular-post-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .popular-post-rank {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          background: #f5f5f5;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #999;
        }

        .popular-post-item:nth-child(-n+3) .popular-post-rank {
          background: #1a1a2e;
          color: #fff;
        }

        .popular-post-link {
          font-size: 14px;
          color: #444;
          text-decoration: none;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s;
        }

        .popular-post-link:hover {
          color: #1a1a2e;
        }

        /* 카테고리 */
        .category-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .category-list li {
          margin-bottom: 6px;
        }

        .category-list li:last-child {
          margin-bottom: 0;
        }

        .category-list a {
          display: block;
          padding: 10px 14px;
          font-size: 14px;
          color: #555;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .category-list a:hover {
          background: #f5f5f8;
          color: #1a1a2e;
        }

        .category-list li.active a {
          background: #1a1a2e;
          color: #fff;
        }

        /* 태그 클라우드 */
        .tag-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-item {
          display: inline-block;
          padding: 6px 14px;
          font-size: 13px;
          color: #666;
          background: #f5f5f8;
          border-radius: 20px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .tag-item:hover {
          background: #1a1a2e;
          color: #fff;
        }

        .tag-item.active {
          background: #1a1a2e;
          color: #fff;
        }

        @media (max-width: 1024px) {
          .blog-sidebar {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 20px;
          }

          .sidebar-section {
            margin-bottom: 0;
          }
        }
      `}</style>
    </aside>
  );
}
