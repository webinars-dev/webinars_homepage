import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as adminReferenceService from '../../services/adminReferenceService';
import './admin.css';

export default function AdminReferenceListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminReferenceService.getAdminReferenceItems();
      setItems(data);
    } catch (err) {
      setError(err?.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title || '(제목 없음)'}" 레퍼런스를 삭제하시겠습니까?`)) return;
    try {
      await adminReferenceService.softDeleteReferenceItem(id);
      fetchItems();
    } catch (err) {
      alert('삭제 실패: ' + (err?.message || '알 수 없는 오류'));
    }
  };

  const handlePublishToggle = async (item) => {
    try {
      if (item.is_published) {
        await adminReferenceService.unpublishReferenceItem(item.id);
      } else {
        await adminReferenceService.publishReferenceItem(item.id);
      }
      fetchItems();
    } catch (err) {
      alert('상태 변경 실패: ' + (err?.message || '알 수 없는 오류'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>레퍼런스 관리</h1>
        <Link to="/admin/reference/new" className="admin-btn admin-btn-primary">
          + 새 레퍼런스
        </Link>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>로딩 중...</p>
        </div>
      ) : error ? (
        <div className="admin-error">
          <p>{error}</p>
          <button onClick={fetchItems} className="admin-btn">
            다시 시도
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="admin-empty">
          <p>레퍼런스가 없습니다.</p>
          <Link to="/admin/reference/new" className="admin-btn admin-btn-primary">
            첫 레퍼런스 추가하기
          </Link>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>순서</th>
                <th>타입</th>
                <th>제목</th>
                <th>고객사</th>
                <th>발행</th>
                <th>업데이트</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.order ?? 0}</td>
                  <td>{item.category || '-'}</td>
                  <td className="admin-table-title">
                    <Link to={`/admin/reference/edit/${item.id}`}>
                      {(item.title || '').split('\n')[0] || '(제목 없음)'}
                    </Link>
                  </td>
                  <td>{(item.client || '').split('\n')[0] || '-'}</td>
                  <td>
                    <span
                      className="admin-status-badge"
                      style={{ backgroundColor: item.is_published ? '#10b981' : '#6b7280' }}
                    >
                      {item.is_published ? '발행' : '비발행'}
                    </span>
                  </td>
                  <td>{formatDate(item.updated_at)}</td>
                  <td className="admin-table-actions">
                    <Link to={`/admin/reference/edit/${item.id}`} className="admin-btn admin-btn-small">
                      수정
                    </Link>
                    <button
                      onClick={() => handlePublishToggle(item)}
                      className={`admin-btn admin-btn-small ${item.is_published ? 'admin-btn-warning' : 'admin-btn-success'}`}
                    >
                      {item.is_published ? '비발행' : '발행'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="admin-btn admin-btn-small admin-btn-danger"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

