import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import * as adminService from '../../services/adminBlogService';
import { getCategories, getTags } from '../../services/blogService';

import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Select } from './ui/select.jsx';
import { Textarea } from './ui/textarea.jsx';

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
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">로딩 중...</CardContent>
      </Card>
    );
  }

  const statusLabel =
    formData.status === 'draft'
      ? '임시저장'
      : formData.status === 'published'
        ? '발행됨'
        : formData.status === 'scheduled'
          ? '예약됨'
          : formData.status || '-';

  const statusVariant =
    formData.status === 'published'
      ? 'success'
      : formData.status === 'scheduled'
        ? 'default'
        : formData.status === 'publish_failed'
          ? 'destructive'
          : formData.status === 'archived'
            ? 'outline'
            : 'secondary';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{isNew ? '새 글 작성' : '글 수정'}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            {lastSaved && <span>마지막 저장: {lastSaved.toLocaleTimeString('ko-KR')}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/blog')} disabled={saving}>
            목록
          </Button>
          <Button type="button" variant="secondary" onClick={() => handleSubmit('draft')} disabled={saving}>
            {saving ? '저장 중...' : '임시 저장'}
          </Button>
          {formData.scheduled_at && (
            <Button type="button" variant="outline" onClick={() => handleSubmit('schedule')} disabled={saving}>
              예약 발행
            </Button>
          )}
          <Button type="button" onClick={() => handleSubmit('publish')} disabled={saving}>
            {formData.status === 'published' ? '업데이트' : '즉시 발행'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">콘텐츠</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="포스트 제목을 입력하세요"
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">슬러그 (URL) *</Label>
              <div className="text-xs text-muted-foreground">
                /blog/{formData.slug || 'your-slug'}
              </div>
              <Input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="url-friendly-slug"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">요약 (150자 내외)</Label>
              <Textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="포스트 요약을 입력하세요 (목록에 표시됩니다)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>본문 (Markdown)</Label>
              <div className="admin-form-group-editor overflow-hidden rounded-md border border-input bg-background">
                <MdEditor
                  ref={editorRef}
                  value={formData.content}
                  style={{ height: '500px' }}
                  renderHTML={(text) => mdParser.render(text)}
                  onChange={handleEditorChange}
                  onImageUpload={handleImageUpload}
                  placeholder="본문을 작성하세요... (Markdown 문법을 사용할 수 있습니다)"
                  config={{
                    view: { menu: true, md: true, html: true },
                    canView: {
                      menu: true,
                      md: true,
                      html: true,
                      both: true,
                      fullScreen: true,
                      hideMenu: true,
                    },
                    markdownClass: 'admin-markdown-preview',
                    imageAccept: '.jpg,.jpeg,.png,.webp,.gif',
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">발행</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">예약 발행 시간</Label>
                <Input
                  type="datetime-local"
                  id="scheduled_at"
                  name="scheduled_at"
                  value={formData.scheduled_at}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  예약 시간을 입력하면 “예약 발행” 버튼이 활성화됩니다.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">대표 이미지</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.featured_image ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-md border bg-muted">
                    <img src={formData.featured_image} alt="대표 이미지" className="h-auto w-full" />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setFormData((prev) => ({ ...prev, featured_image: '' }))}
                  >
                    제거
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">업로드된 이미지가 없습니다.</div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleFeaturedImageUpload}
                className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">카테고리</CardTitle>
            </CardHeader>
            <CardContent>
              <Select name="category_id" value={formData.category_id} onChange={handleChange}>
                <option value="">카테고리 선택</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">태그</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const checked = formData.tag_ids.includes(tag.id);
                  return (
                    <label
                      key={tag.id}
                      className={[
                        'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                        checked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50',
                      ].join(' ')}
                    >
                      <Checkbox checked={checked} onChange={() => handleTagToggle(tag.id)} />
                      {tag.name}
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">메타 제목</Label>
                <Input
                  type="text"
                  id="meta_title"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleChange}
                  placeholder="SEO 제목 (비워두면 포스트 제목 사용)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">메타 설명</Label>
                <Textarea
                  id="meta_description"
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  placeholder="SEO 설명 (비워두면 요약 사용)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
