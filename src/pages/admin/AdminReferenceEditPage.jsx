import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as adminReferenceService from '../../services/adminReferenceService';

import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Select } from './ui/select.jsx';
import { Textarea } from './ui/textarea.jsx';
import { cn } from './ui/cn.js';

const DEFAULT_FORM = {
  category: '',
  title: '',
  client: '',
  image_url: '',
  modal_path: '',
  modal_html: '',
  col_span: 4,
  order: 0,
  is_published: false,
};

const normalizeColSpan = (colSpan) => {
  const value = Number(colSpan);
  if (value === 8 || value === 12) return value;
  return 4;
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
        modal_html: item.modal_html || '',
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

  const normalizedColSpan = normalizeColSpan(formData.col_span);

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
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
              <CardTitle className="text-base">이미지 · 링크</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image_url">배경 이미지 URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="예) https://webinars.co.kr/wp-content/uploads/..."
                />
                <p className="text-xs text-muted-foreground">
                  로컬(mac) 환경에서는 한글 경로가 자동으로 인코딩되어 표시됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal_path">모달 경로</Label>
                <Input
                  id="modal_path"
                  name="modal_path"
                  value={formData.modal_path}
                  onChange={handleChange}
                  placeholder="/2024_offline_1010/"
                />
                <p className="text-xs text-muted-foreground">
                  예) <span className="font-mono">/wp/2024_offline_1010</span> 또는{' '}
                  <span className="font-mono">/2024_offline_1010/</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">모달 내용(HTML)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                id="modal_html"
                name="modal_html"
                value={formData.modal_html}
                onChange={handleChange}
                className="min-h-56"
                placeholder={'예) <h2 class="txt36">OFFLINE</h2>\\n<h5 class="txt18 w700">...</h5>'}
              />
              <p className="text-xs text-muted-foreground">
                비워두면 기존 아카이브 모달이 표시됩니다. 입력하면 DB의 HTML이 우선 적용됩니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">노출 · 정렬</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="col_span">가로 폭</Label>
                <Select id="col_span" name="col_span" value={String(formData.col_span)} onChange={handleChange}>
                  <option value="4">4 (기본)</option>
                  <option value="8">8 (와이드)</option>
                  <option value="12">12 (풀)</option>
                </Select>
                <p className="text-xs text-muted-foreground">
                  참고: 1000px 이하에서는 모든 카드가 한 줄로 표시됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">정렬 순서</Label>
                <Input id="order" name="order" type="number" value={formData.order} onChange={handleChange} />
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground md:col-span-2">
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
              <div className="grid grid-cols-12 gap-3">
                <div
                  className={cn(
                    'relative overflow-hidden rounded-xl bg-muted text-white',
                    normalizedColSpan === 4 && 'col-span-4',
                    normalizedColSpan === 8 && 'col-span-8',
                    normalizedColSpan === 12 && 'col-span-12'
                  )}
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

                {normalizedColSpan !== 12 && (
                  <div
                    className={cn(
                      'rounded-xl border border-dashed bg-muted/30',
                      normalizedColSpan === 8 ? 'col-span-4' : 'col-span-8'
                    )}
                    style={{ minHeight: 280 }}
                  />
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>가로 폭</span>
                  <span className="font-mono">{normalizedColSpan}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>모달 소스</span>
                  <span className="truncate font-mono" title={formData.modal_html?.trim() ? 'modal_html' : formData.modal_path || '-'}>
                    {formData.modal_html?.trim() ? 'modal_html' : formData.modal_path || '-'}
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
