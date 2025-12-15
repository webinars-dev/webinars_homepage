import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as adminReferenceService from '../../services/adminReferenceService';
import './admin.css';

const DEFAULT_FORM = {
  category: '',
  title: '',
  client: '',
  image_url: '',
  modal_path: '',
  col_span: 4,
  order: 0,
  is_published: false,
};

export default function AdminReferenceEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (!isNew) loadItem();
  }, [id, isNew]);

  const loadItem = async () => {
    setLoading(true);
    setError(null);
    try {
      const item = await adminReferenceService.getReferenceItemById(id);
      if (!item) {
        setError('레퍼런스를 찾을 수 없습니다.');
        return;
      }
      setFormData({
        category: item.category || '',
        title: item.title || '',
        client: item.client || '',
        image_url: item.image_url || '',
        modal_path: item.modal_path || '',
        col_span: item.col_span || 4,
        order: item.order ?? 0,
        is_published: !!item.is_published,
      });
    } catch (err) {
      setError(err?.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const previewStyle = useMemo(() => {
    return formData.image_url ? { backgroundImage: `url(${formData.image_url})` } : undefined;
  }, [formData.image_url]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        col_span: Number(formData.col_span) || 4,
        order: Number(formData.order) || 0,
      };

      if (isNew) {
        const created = await adminReferenceService.createReferenceItem(payload);
        alert('생성되었습니다.');
        navigate(`/admin/reference/edit/${created.id}`, { replace: true });
      } else {
        await adminReferenceService.updateReferenceItem(id, payload);
        alert('저장되었습니다.');
        navigate('/admin/reference');
      }
    } catch (err) {
      setError(err?.message || '저장에 실패했습니다.');
      alert('저장 실패: ' + (err?.message || '알 수 없는 오류'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>{isNew ? '새 레퍼런스' : '레퍼런스 수정'}</h1>
        <div className="admin-header-actions">
          <button
            onClick={() => navigate('/admin/reference')}
            className="admin-btn"
            disabled={saving}
          >
            목록
          </button>
          <button
            onClick={handleSubmit}
            className="admin-btn admin-btn-primary"
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      <div className="admin-post-form" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24 }}>
        <div className="admin-post-form-main">
          <div className="admin-form-group">
            <label htmlFor="category">타입(상단 텍스트)</label>
            <input
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="admin-input"
              placeholder="예) OFFLINE, DESIGN / PUBLICATION"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="title">제목 *</label>
            <textarea
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="admin-textarea"
              placeholder={'예) 2024\\nRMAF\\nAnnual Symposium'}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="client">고객사</label>
            <textarea
              id="client"
              name="client"
              value={formData.client}
              onChange={handleChange}
              className="admin-textarea"
              placeholder={'예) IOC /\\n강원동계청소년올림픽 조직위원회'}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="image_url">배경 이미지 URL</label>
            <input
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="admin-input"
              placeholder="예) https://webinars.co.kr/wp-content/uploads/..."
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="modal_path">
              모달 경로
              <span className="admin-label-hint">/wp/2024_offline_1010 또는 /2024_offline_1010/</span>
            </label>
            <input
              id="modal_path"
              name="modal_path"
              value={formData.modal_path}
              onChange={handleChange}
              className="admin-input"
              placeholder="/wp/2024_offline_1010"
            />
          </div>

          <div className="admin-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label htmlFor="col_span">가로 폭</label>
              <select
                id="col_span"
                name="col_span"
                value={String(formData.col_span)}
                onChange={handleChange}
                className="admin-select"
              >
                <option value="4">4 (기본)</option>
                <option value="8">8 (와이드)</option>
                <option value="12">12 (풀)</option>
              </select>
            </div>
            <div>
              <label htmlFor="order">정렬 순서</label>
              <input
                id="order"
                name="order"
                type="number"
                value={formData.order}
                onChange={handleChange}
                className="admin-input"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label>
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
                style={{ marginRight: 8 }}
              />
              발행
            </label>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 8, fontWeight: 600, color: '#111827' }}>미리보기</div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: 360,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#6b7280',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              ...previewStyle,
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
            <div style={{ position: 'relative', padding: 24, color: '#fff' }}>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>
                {formData.category || 'TYPE'}
              </div>
              <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.55)', margin: '16px 0' }} />
              <div style={{ whiteSpace: 'pre-line', fontSize: 16, fontWeight: 700, lineHeight: 1.5 }}>
                {formData.title || '제목'}
              </div>
              <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.55)', margin: '12px 0' }} />
              <div style={{ whiteSpace: 'pre-line', fontSize: 16, fontWeight: 700, lineHeight: 1.5 }}>
                {formData.client || '고객사'}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>
            실제 /reference2 페이지에서는 이미지 URL이 자동으로 인코딩(NFC)되어 표시됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}

