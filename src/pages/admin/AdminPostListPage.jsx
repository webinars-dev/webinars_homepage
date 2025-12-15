import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as adminService from '../../services/adminBlogService';
import './admin.css';

const STATUS_LABELS = {
  draft: '임시저장',
  published: '발행됨',
  scheduled: '예약됨',
  archived: '보관됨',
  publish_failed: '발행실패'
};

const STATUS_COLORS = {
  draft: '#6b7280',
  published: '#10b981',
  scheduled: '#3b82f6',
  archived: '#9ca3af',
  publish_failed: '#ef4444'
};

export default function AdminPostListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const statusFilter = searchParams.get('status') || '';

  useEffect(() => {
    fetchPosts();
  }, [currentPage, statusFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminService.getAdminPosts({
        page: currentPage,
        status: statusFilter || undefined
      });
      setPosts(result.posts);
      setPagination({
        page: result.page,
        totalPages: result.totalPages,
        total: result.total
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title}" 포스트를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await adminService.deletePost(id);
      fetchPosts();
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    }
  };

  const handlePublish = async (id) => {
    try {
      await adminService.publishPost(id);
      fetchPosts();
    } catch (err) {
      alert('발행 실패: ' + err.message);
    }
  };

  const handleUnpublish = async (id) => {
    try {
      await adminService.unpublishPost(id);
      fetchPosts();
    } catch (err) {
      alert('비발행 실패: ' + err.message);
    }
  };

  const handleFilterChange = (status) => {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>포스트 관리</h1>
        <Link to="/admin/blog/new" className="admin-btn admin-btn-primary">
          + 새 글 작성
        </Link>
      </div>

      <div className="admin-filters">
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="admin-select"
        >
          <option value="">전체 상태</option>
          <option value="draft">임시저장</option>
          <option value="published">발행됨</option>
          <option value="scheduled">예약됨</option>
          <option value="publish_failed">발행실패</option>
        </select>
        <span className="admin-filter-count">
          총 {pagination.total}개의 포스트
        </span>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>로딩 중...</p>
        </div>
      ) : error ? (
        <div className="admin-error">
          <p>{error}</p>
          <button onClick={fetchPosts} className="admin-btn">
            다시 시도
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="admin-empty">
          <p>포스트가 없습니다.</p>
          <Link to="/admin/blog/new" className="admin-btn admin-btn-primary">
            첫 번째 글 작성하기
          </Link>
        </div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>카테고리</th>
                  <th>상태</th>
                  <th>작성일</th>
                  <th>발행일</th>
                  <th>조회수</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className="admin-table-title">
                      <Link to={`/admin/blog/edit/${post.id}`}>
                        {post.title || '(제목 없음)'}
                      </Link>
                      {post.slug && (
                        <span className="admin-table-slug">/{post.slug}</span>
                      )}
                    </td>
                    <td>{post.category?.name || '-'}</td>
                    <td>
                      <span
                        className="admin-status-badge"
                        style={{ backgroundColor: STATUS_COLORS[post.status] }}
                      >
                        {STATUS_LABELS[post.status] || post.status}
                      </span>
                    </td>
                    <td>{formatDate(post.created_at)}</td>
                    <td>{formatDate(post.published_at)}</td>
                    <td>{post.view_count || 0}</td>
                    <td className="admin-table-actions">
                      <Link
                        to={`/admin/blog/edit/${post.id}`}
                        className="admin-btn admin-btn-small"
                      >
                        수정
                      </Link>
                      {post.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(post.id)}
                          className="admin-btn admin-btn-small admin-btn-success"
                        >
                          발행
                        </button>
                      )}
                      {post.status === 'published' && (
                        <button
                          onClick={() => handleUnpublish(post.id)}
                          className="admin-btn admin-btn-small admin-btn-warning"
                        >
                          비발행
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="admin-btn admin-btn-small admin-btn-danger"
                      >
                        삭제
                      </button>
                      {post.status === 'published' && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-btn admin-btn-small"
                        >
                          보기
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="admin-pagination">
              <button
                disabled={currentPage <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(currentPage - 1));
                  setSearchParams(params);
                }}
                className="admin-btn"
              >
                이전
              </button>
              <span>
                {currentPage} / {pagination.totalPages}
              </span>
              <button
                disabled={currentPage >= pagination.totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(currentPage + 1));
                  setSearchParams(params);
                }}
                className="admin-btn"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
