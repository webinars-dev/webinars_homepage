import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as adminReferenceService from '../../services/adminReferenceService';

import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Textarea } from './ui/textarea.jsx';
import { RichTextEditor } from './ui/rich-text-editor.jsx';

const DEFAULT_FORM = {
  category: '',
  title: '',
  client: '',
  image_url: '',
  modal_path: '',
  modal_html: '',
  order: 0,
  is_published: false,
};

export default function AdminReferenceEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const fileInputRef = useRef(null);

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
        modal_html: item.modal_html || '',
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const publicUrl = await adminReferenceService.uploadReferenceImage(file, id || 'new');
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (err) {
      setError(err?.message || '이미지 업로드에 실패했습니다.');
      alert('업로드 실패: ' + (err?.message || '알 수 없는 오류'));
    } finally {
      setUploading(false);
      // 파일 입력 초기화 (같은 파일 재선택 가능하도록)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const previewStyle = useMemo(() => {
    return formData.image_url ? { backgroundImage: `url(${formData.image_url})` } : undefined;
  }, [formData.image_url]);

  // 에디터 이미지 업로드 핸들러
  const handleEditorImageUpload = async (file) => {
    const publicUrl = await adminReferenceService.uploadReferenceImage(file, id || 'modal');
    return publicUrl;
  };

  // 에디터 내용 변경 핸들러
  const handleEditorChange = (content) => {
    setFormData((prev) => ({ ...prev, modal_html: content }));
  };

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
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">로딩 중...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{isNew ? '새 레퍼런스' : '레퍼런스 수정'}</h1>
            <Badge variant={formData.is_published ? 'success' : 'secondary'}>
              {formData.is_published ? '발행' : '비발행'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            카드(배경 이미지/텍스트) + 모달 콘텐츠(HTML)를 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/reference')} disabled={saving}>
            목록
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">타입(상단 텍스트)</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="예) OFFLINE, DESIGN / PUBLICATION"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Textarea
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={'예) 2024\\nRMAF\\nAnnual Symposium'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">고객사</Label>
                <Textarea
                  id="client"
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  placeholder={'예) IOC /\\n강원동계청소년올림픽 조직위원회'}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">배경 이미지</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>이미지 업로드</Label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? '업로드 중...' : '파일 선택'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  jpg, png, webp, gif (최대 10MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">또는 URL 직접 입력</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="예) https://webinars.co.kr/wp-content/uploads/..."
                />
              </div>

              {formData.image_url && (
                <div className="space-y-2">
                  <Label>미리보기</Label>
                  <div className="relative aspect-video overflow-hidden rounded-sm border bg-muted">
                    <img
                      src={formData.image_url}
                      alt="배경 이미지 미리보기"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">모달 내용(HTML)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <RichTextEditor
                value={formData.modal_html}
                onChange={handleEditorChange}
                onImageUpload={handleEditorImageUpload}
                placeholder="모달에 표시할 내용을 입력하세요..."
              />
              <p className="text-xs text-muted-foreground">
                비워두면 기존 아카이브 모달이 표시됩니다. 입력하면 DB의 HTML이 우선 적용됩니다.
                <br />
                툴바의 이미지 버튼으로 이미지를 업로드할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">정렬 · 발행</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order">정렬 순서</Label>
                <Input id="order" name="order" type="number" value={formData.order} onChange={handleChange} />
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox name="is_published" checked={formData.is_published} onChange={handleChange} />
                발행
              </label>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">카드 미리보기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="relative overflow-hidden rounded-sm bg-muted text-white"
                style={{ minHeight: 280 }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={previewStyle}
                />
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative space-y-4 p-6">
                  <div className="text-lg font-semibold leading-tight">
                    {formData.category || 'TYPE'}
                  </div>
                  <div className="h-px w-5 bg-white/60" />
                  <div className="whitespace-pre-line text-sm font-semibold leading-relaxed">
                    {formData.title || '제목'}
                  </div>
                  <div className="h-px w-5 bg-white/60" />
                  <div className="whitespace-pre-line text-sm font-semibold leading-relaxed">
                    {formData.client || '고객사'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>모달 HTML</span>
                  <span className="truncate font-mono">
                    {formData.modal_html?.trim() ? '입력됨' : '없음'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
