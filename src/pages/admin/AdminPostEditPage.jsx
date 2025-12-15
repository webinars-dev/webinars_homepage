import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import * as adminService from '../../services/adminBlogService';
import { getCategories, getTags } from '../../services/blogService';
import './admin.css';

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const AUTOSAVE_INTERVAL = 30000; // 30초

export default function AdminPostEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const editorRef = useRef(null);
  const autosaveTimerRef = useRef(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category_id: '',
    tag_ids: [],
    status: 'draft',
    meta_title: '',
    meta_description: '',
    scheduled_at: ''
  });

  // 카테고리, 태그 로드
  useEffect(() => {
    Promise.all([getCategories(), getTags()])
      .then(([cats, tags]) => {
        setCategories(cats);
        setAllTags(tags);
      })
      .catch(console.error);
  }, []);

  // 포스트 데이터 로드 (수정 시)
  useEffect(() => {
    if (!isNew && id) {
      loadPost();
    }
  }, [id, isNew]);

  // 자동 저장 설정
  useEffect(() => {
    if (!isNew && formData.title) {
      autosaveTimerRef.current = setInterval(() => {
        handleAutosave();
      }, AUTOSAVE_INTERVAL);
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [isNew, formData.title]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const post = await adminService.getPostById(id);
      if (post) {
        setFormData({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          featured_image: post.featured_image || '',
          category_id: post.category_id || '',
          tag_ids: post.tag_ids || [],
          status: post.status || 'draft',
          meta_title: post.meta_title || '',
          meta_description: post.meta_description || '',
          scheduled_at: post.scheduled_at ? post.scheduled_at.slice(0, 16) : ''
        });
      } else {
        setError('포스트를 찾을 수 없습니다.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // 제목 변경 시 슬러그 자동 생성 (새 글 작성 시에만)
    if (name === 'title' && isNew && !formData.slug) {
      const slug = adminService.generateSlug(value);
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleEditorChange = ({ text }) => {
    setFormData(prev => ({ ...prev, content: text }));
  };

  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  };

  const handleImageUpload = async (file) => {
    try {
      const url = await adminService.uploadImage(file, id || 'temp');
      return url;
    } catch (err) {
      alert('이미지 업로드 실패: ' + err.message);
      return '';
    }
  };

  const handleFeaturedImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await adminService.uploadImage(file, id || 'temp');
      setFormData(prev => ({ ...prev, featured_image: url }));
    } catch (err) {
      alert('이미지 업로드 실패: ' + err.message);
    }
  };

  const handleAutosave = useCallback(async () => {
    if (!id || formData.status === 'published') return;

    try {
      await adminService.updatePost(id, {
        ...formData,
        status: 'draft'
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error('Autosave failed:', err);
    }
  }, [id, formData]);

  const handleSubmit = async (action) => {
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!formData.slug.trim()) {
      alert('슬러그를 입력해주세요.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let postData = { ...formData };

      // 액션에 따른 상태 설정
      if (action === 'publish') {
        postData.status = 'published';
      } else if (action === 'schedule') {
        if (!formData.scheduled_at) {
          alert('예약 발행 시간을 설정해주세요.');
          setSaving(false);
          return;
        }
        postData.status = 'scheduled';
        postData.scheduled_at = new Date(formData.scheduled_at).toISOString();
      } else {
        postData.status = 'draft';
      }

      let result;
      if (isNew) {
        result = await adminService.createPost(postData);
        navigate(`/admin/blog/edit/${result.id}`, { replace: true });
      } else {
        result = await adminService.updatePost(id, postData);
      }

      setLastSaved(new Date());

      if (action === 'publish') {
        alert('포스트가 발행되었습니다.');
        navigate('/admin/blog');
      } else if (action === 'schedule') {
        alert('포스트가 예약되었습니다.');
        navigate('/admin/blog');
      } else {
        alert('저장되었습니다.');
      }
    } catch (err) {
      setError(err.message);
      alert('저장 실패: ' + err.message);
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
    <div className="admin-page admin-post-edit">
      <div className="admin-page-header">
        <h1>{isNew ? '새 글 작성' : '글 수정'}</h1>
        <div className="admin-header-actions">
          {lastSaved && (
            <span className="admin-last-saved">
              마지막 저장: {lastSaved.toLocaleTimeString('ko-KR')}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="admin-error-banner">
          {error}
        </div>
      )}

      <div className="admin-post-form">
        <div className="admin-post-form-main">
          {/* 제목 */}
          <div className="admin-form-group">
            <label htmlFor="title">제목 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="포스트 제목을 입력하세요"
              className="admin-input admin-input-large"
            />
          </div>

          {/* 슬러그 */}
          <div className="admin-form-group">
            <label htmlFor="slug">
              슬러그 (URL) *
              <span className="admin-label-hint">/blog/{formData.slug || 'your-slug'}</span>
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="url-friendly-slug"
              className="admin-input"
            />
          </div>

          {/* 요약 */}
          <div className="admin-form-group">
            <label htmlFor="excerpt">요약 (150자 내외)</label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="포스트 요약을 입력하세요 (목록에 표시됩니다)"
              rows={3}
              className="admin-textarea"
            />
          </div>

          {/* Markdown 에디터 */}
          <div className="admin-form-group admin-form-group-editor">
            <label>본문 (Markdown)</label>
            <MdEditor
              ref={editorRef}
              value={formData.content}
              style={{ height: '500px' }}
              renderHTML={text => mdParser.render(text)}
              onChange={handleEditorChange}
              onImageUpload={handleImageUpload}
              placeholder="본문을 작성하세요... (Markdown 문법을 사용할 수 있습니다)"
              config={{
                view: { menu: true, md: true, html: true },
                canView: { menu: true, md: true, html: true, both: true, fullScreen: true, hideMenu: true },
                markdownClass: 'admin-markdown-preview',
                imageAccept: '.jpg,.jpeg,.png,.webp,.gif'
              }}
            />
          </div>
        </div>

        <div className="admin-post-form-sidebar">
          {/* 발행 상태 */}
          <div className="admin-sidebar-section">
            <h3>발행</h3>
            <div className="admin-form-group">
              <label>현재 상태</label>
              <span className={`admin-status-badge admin-status-${formData.status}`}>
                {formData.status === 'draft' && '임시저장'}
                {formData.status === 'published' && '발행됨'}
                {formData.status === 'scheduled' && '예약됨'}
              </span>
            </div>

            <div className="admin-form-group">
              <label htmlFor="scheduled_at">예약 발행 시간</label>
              <input
                type="datetime-local"
                id="scheduled_at"
                name="scheduled_at"
                value={formData.scheduled_at}
                onChange={handleChange}
                className="admin-input"
              />
            </div>

            <div className="admin-publish-buttons">
              <button
                onClick={() => handleSubmit('draft')}
                disabled={saving}
                className="admin-btn"
              >
                {saving ? '저장 중...' : '임시 저장'}
              </button>
              {formData.scheduled_at && (
                <button
                  onClick={() => handleSubmit('schedule')}
                  disabled={saving}
                  className="admin-btn admin-btn-primary"
                >
                  예약 발행
                </button>
              )}
              <button
                onClick={() => handleSubmit('publish')}
                disabled={saving}
                className="admin-btn admin-btn-success"
              >
                {formData.status === 'published' ? '업데이트' : '즉시 발행'}
              </button>
            </div>
          </div>

          {/* 대표 이미지 */}
          <div className="admin-sidebar-section">
            <h3>대표 이미지</h3>
            {formData.featured_image && (
              <div className="admin-featured-image-preview">
                <img src={formData.featured_image} alt="대표 이미지" />
                <button
                  onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                  className="admin-btn admin-btn-small admin-btn-danger"
                >
                  제거
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFeaturedImageUpload}
              className="admin-file-input"
            />
          </div>

          {/* 카테고리 */}
          <div className="admin-sidebar-section">
            <h3>카테고리</h3>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="admin-select"
            >
              <option value="">카테고리 선택</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 태그 */}
          <div className="admin-sidebar-section">
            <h3>태그</h3>
            <div className="admin-tag-list">
              {allTags.map(tag => (
                <label key={tag.id} className="admin-tag-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.tag_ids.includes(tag.id)}
                    onChange={() => handleTagToggle(tag.id)}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>

          {/* SEO */}
          <div className="admin-sidebar-section">
            <h3>SEO 설정</h3>
            <div className="admin-form-group">
              <label htmlFor="meta_title">메타 제목</label>
              <input
                type="text"
                id="meta_title"
                name="meta_title"
                value={formData.meta_title}
                onChange={handleChange}
                placeholder="SEO 제목 (비워두면 포스트 제목 사용)"
                className="admin-input"
              />
            </div>
            <div className="admin-form-group">
              <label htmlFor="meta_description">메타 설명</label>
              <textarea
                id="meta_description"
                name="meta_description"
                value={formData.meta_description}
                onChange={handleChange}
                placeholder="SEO 설명 (비워두면 요약 사용)"
                rows={3}
                className="admin-textarea"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
