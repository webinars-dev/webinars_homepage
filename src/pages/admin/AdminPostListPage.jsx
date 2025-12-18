import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as adminService from '../../services/adminBlogService';

import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Select } from './ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';

const STATUS_LABELS = {
  draft: '임시저장',
  published: '발행됨',
  scheduled: '예약됨',
  archived: '보관됨',
  publish_failed: '발행실패',
};

const getStatusVariant = (status) => {
  switch (status) {
    case 'published':
      return 'success';
    case 'scheduled':
      return 'default';
    case 'publish_failed':
      return 'destructive';
    case 'archived':
      return 'outline';
    case 'draft':
    default:
      return 'secondary';
  }
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">포스트 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">블로그 글을 작성/발행/관리합니다.</p>
        </div>
        <Button asChild>
          <Link to="/admin/blog/new">+ 새 글 작성</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onChange={(e) => handleFilterChange(e.target.value)} className="w-48">
              <option value="">전체 상태</option>
              <option value="draft">임시저장</option>
              <option value="published">발행됨</option>
              <option value="scheduled">예약됨</option>
              <option value="publish_failed">발행실패</option>
            </Select>
            <div className="text-sm text-muted-foreground">총 {pagination.total}개의 포스트</div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">로딩 중...</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="text-sm text-destructive">{error}</div>
            <Button type="button" variant="outline" className="mt-4" onClick={fetchPosts}>
              다시 시도
            </Button>
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="text-sm text-muted-foreground">포스트가 없습니다.</div>
            <Button asChild className="mt-4">
              <Link to="/admin/blog/new">첫 번째 글 작성하기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">목록</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead>발행일</TableHead>
                    <TableHead>조회수</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <Link to={`/admin/blog/edit/${post.id}`} className="font-medium hover:underline">
                            {post.title || '(제목 없음)'}
                          </Link>
                          {post.slug && <div className="text-xs text-muted-foreground">/blog/{post.slug}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{post.category?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(post.status)}>{STATUS_LABELS[post.status] || post.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(post.created_at)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(post.published_at)}</TableCell>
                      <TableCell className="text-muted-foreground">{post.view_count || 0}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/admin/blog/edit/${post.id}`}>수정</Link>
                          </Button>

                          {post.status === 'draft' && (
                            <Button type="button" size="sm" onClick={() => handlePublish(post.id)}>
                              발행
                            </Button>
                          )}

                          {post.status === 'published' && (
                            <Button type="button" size="sm" variant="secondary" onClick={() => handleUnpublish(post.id)}>
                              비발행
                            </Button>
                          )}

                          <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(post.id, post.title)}>
                            삭제
                          </Button>

                          {post.status === 'published' && post.slug && (
                            <Button asChild size="sm" variant="outline">
                              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                보기
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {pagination.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(currentPage - 1));
                  setSearchParams(params);
                }}
              >
                이전
              </Button>
              <div className="text-sm text-muted-foreground">
                {currentPage} / {pagination.totalPages}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(currentPage + 1));
                  setSearchParams(params);
                }}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
