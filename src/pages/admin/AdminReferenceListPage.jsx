import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as adminReferenceService from '../../services/adminReferenceService';

import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';

const parseKoreanDate = (raw) => {
  const text = String(raw || '').replace(/\u00a0/g, ' ').trim();
  if (!text) return null;

  const korean = text.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (korean) {
    const [, y, m, d] = korean;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dotted = text.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (dotted) {
    const [, y, m, d] = dotted;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

const extractDateFromModalHtml = (html) => {
  if (typeof html !== 'string' || !html.trim()) return null;
  if (typeof DOMParser === 'undefined') return null;

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const labelCandidates = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,strong,b,p,span,div'));

    const normalize = (value) => String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

    for (const node of labelCandidates) {
      const label = normalize(node.textContent);
      if (!label) continue;
      if (label === '일자' || label.endsWith(' 일자') || label.includes('일자')) {
        const next = node.nextElementSibling;
        const nextText = normalize(next?.textContent);
        const parsed = parseKoreanDate(nextText);
        if (parsed) return parsed;
      }

      if (node.classList?.contains('re_1') && label.includes('일자')) {
        const next = node.nextElementSibling;
        const nextText = normalize(next?.textContent);
        const parsed = parseKoreanDate(nextText);
        if (parsed) return parsed;
      }
    }

    // fallback: first occurrence of a yyyy년 m월 d일 pattern
    const bodyText = normalize(doc.body?.textContent);
    return parseKoreanDate(bodyText);
  } catch {
    return null;
  }
};

const inferDateFromModalPath = (path) => {
  const value = String(path || '');
  if (!value) return null;

  // e.g. wp_2024_offline_1028, wp_2024_hybrid_0904
  const match = value.match(/(?:^|\/)(?:wp_)?(20\d{2})_[a-z]+_(\d{2})(\d{2})(?:\/|$)/i);
  if (match) {
    const [, y, mm, dd] = match;
    const date = new Date(Number(y), Number(mm) - 1, Number(dd));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

export default function AdminReferenceListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState(null);

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

  const getEventDate = (item) => {
    const htmlDate = extractDateFromModalHtml(item.modal_html);
    if (htmlDate) return htmlDate;
    const inferred = inferDateFromModalPath(item.modal_path);
    if (inferred) return inferred;
    const fallback = item.updated_at || item.created_at;
    const fallbackDate = fallback ? new Date(fallback) : null;
    return fallbackDate && !Number.isNaN(fallbackDate.getTime()) ? fallbackDate : null;
  };

  const formatEventDate = (item) => {
    const date = getEventDate(item);
    if (!date) return '-';
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const handleAutoReorder = async () => {
    if (reordering) return;
    if (!items.length) return;

    setReordering(true);
    setReorderError(null);

    try {
      const sorted = [...items].sort((a, b) => {
        const aTime = getEventDate(a)?.getTime() ?? 0;
        const bTime = getEventDate(b)?.getTime() ?? 0;
        return bTime - aTime;
      });

      for (let i = 0; i < sorted.length; i += 1) {
        const item = sorted[i];
        const nextOrder = i + 1;
        if (Number(item.order) === nextOrder) continue;
        await adminReferenceService.updateReferenceItem(item.id, { order: nextOrder });
      }

      await fetchItems();
      alert('최근 일자 기준으로 순위를 재정렬했습니다.');
    } catch (err) {
      setReorderError(err?.message || '순위 조정에 실패했습니다.');
    } finally {
      setReordering(false);
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">레퍼런스 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">Supabase 레퍼런스 카드/모달 콘텐츠를 관리합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleAutoReorder} disabled={reordering || loading}>
            {reordering ? '정렬 중...' : '최근 일자 기준 정렬'}
          </Button>
          <Button asChild>
            <Link to="/admin/reference/new">+ 새 레퍼런스</Link>
          </Button>
        </div>
      </div>

      {reorderError && (
        <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {reorderError}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">로딩 중...</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="text-sm text-destructive">{error}</div>
            <Button type="button" variant="outline" className="mt-4" onClick={fetchItems}>
              다시 시도
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="text-sm text-muted-foreground">레퍼런스가 없습니다.</div>
            <Button asChild className="mt-4">
              <Link to="/admin/reference/new">첫 레퍼런스 추가하기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">목록</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>순서</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>고객사</TableHead>
                  <TableHead>일자</TableHead>
                  <TableHead>발행</TableHead>
                  <TableHead>업데이트</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">{item.order ?? index + 1}</TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell className="font-medium">
                      <Link to={`/admin/reference/edit/${item.id}`} className="hover:underline">
                        {(item.title || '').split('\n')[0] || '(제목 없음)'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{(item.client || '').split('\n')[0] || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{formatEventDate(item)}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_published ? 'success' : 'secondary'}>
                        {item.is_published ? '발행' : '비발행'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(item.updated_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/admin/reference/edit/${item.id}`}>수정</Link>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={item.is_published ? 'secondary' : 'default'}
                          onClick={() => handlePublishToggle(item)}
                        >
                          {item.is_published ? '비발행' : '발행'}
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(item.id, item.title)}>
                          삭제
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
