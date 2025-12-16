import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as adminReferenceService from '../../services/adminReferenceService';

import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">레퍼런스 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">Supabase 레퍼런스 카드/모달 콘텐츠를 관리합니다.</p>
        </div>
        <Button asChild>
          <Link to="/admin/reference/new">+ 새 레퍼런스</Link>
        </Button>
      </div>

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
          <CardContent className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">순서</th>
                  <th className="px-3 py-2 font-medium">타입</th>
                  <th className="px-3 py-2 font-medium">제목</th>
                  <th className="px-3 py-2 font-medium">고객사</th>
                  <th className="px-3 py-2 font-medium">발행</th>
                  <th className="px-3 py-2 font-medium">업데이트</th>
                  <th className="px-3 py-2 text-right font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="px-3 py-3 align-top text-muted-foreground">{item.order ?? 0}</td>
                    <td className="px-3 py-3 align-top">{item.category || '-'}</td>
                    <td className="px-3 py-3 align-top">
                      <Link
                        to={`/admin/reference/edit/${item.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {(item.title || '').split('\n')[0] || '(제목 없음)'}
                      </Link>
                    </td>
                    <td className="px-3 py-3 align-top text-muted-foreground">
                      {(item.client || '').split('\n')[0] || '-'}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Badge variant={item.is_published ? 'success' : 'secondary'}>
                        {item.is_published ? '발행' : '비발행'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 align-top text-muted-foreground">{formatDate(item.updated_at)}</td>
                    <td className="px-3 py-3 align-top">
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
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.id, item.title)}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
