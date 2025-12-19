import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminRole } from '../../hooks/useAdminRole.jsx';
import * as adminUserService from '../../services/adminUserService';
import * as adminDashboardService from '../../services/adminDashboardService';

import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';

const GA4_URL = 'https://analytics.google.com/analytics/web/#/a37767683p3';

const formatNumber = (value) => {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return new Intl.NumberFormat('ko-KR').format(num);
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminDashboardPage() {
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blogStats, setBlogStats] = useState(null);
  const [blogError, setBlogError] = useState(null);
  const [referenceStats, setReferenceStats] = useState(null);
  const [referenceError, setReferenceError] = useState(null);
  const [adminCount, setAdminCount] = useState(null);
  const [adminError, setAdminError] = useState(null);

  const hasAnyData = useMemo(() => {
    if (isAdmin && blogStats) return true;
    if (referenceStats) return true;
    if (isAdmin && adminCount !== null) return true;
    return false;
  }, [adminCount, blogStats, isAdmin, referenceStats]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (roleLoading) return;

      setLoading(true);
      setError(null);
      setBlogError(null);
      setReferenceError(null);
      setAdminError(null);

      try {
        const tasks = [];

        if (isAdmin) {
          tasks.push(
            adminDashboardService
              .getBlogStats()
              .then((data) => ({ key: 'blog', data }))
              .catch((err) => ({ key: 'blog', error: err }))
          );
          tasks.push(
            adminUserService
              .getAdmins()
              .then((admins) => ({ key: 'admins', data: admins?.length || 0 }))
              .catch((err) => ({ key: 'admins', error: err }))
          );
        }

        tasks.push(
          adminDashboardService
            .getReferenceStats()
            .then((data) => ({ key: 'reference', data }))
            .catch((err) => ({ key: 'reference', error: err }))
        );

        const results = await Promise.all(tasks);

        if (cancelled) return;

        for (const result of results) {
          if (result.error) {
            setError(result.error?.message || '대시보드 정보를 불러오지 못했습니다.');
            if (result.key === 'blog') setBlogError(result.error?.message || '블로그 통계를 불러오지 못했습니다.');
            if (result.key === 'reference') setReferenceError(result.error?.message || '레퍼런스 통계를 불러오지 못했습니다.');
            if (result.key === 'admins') setAdminError(result.error?.message || '관리자 정보를 불러오지 못했습니다.');
            continue;
          }

          if (result.key === 'blog') setBlogStats(result.data);
          if (result.key === 'reference') setReferenceStats(result.data);
          if (result.key === 'admins') setAdminCount(result.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, roleLoading]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">블로그/레퍼런스 운영 현황을 확인합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={GA4_URL} target="_blank" rel="noreferrer">
              GA4 열기
            </a>
          </Button>
          <Button asChild>
            <Link to={isAdmin ? '/admin/blog' : '/admin/reference'}>관리로 이동</Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && !hasAnyData ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">로딩 중...</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {isAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">블로그</CardTitle>
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin/blog">포스트 관리</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {blogError && (
                  <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {blogError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">전체</div>
                    <div className="mt-1 text-lg font-semibold">{formatNumber(blogStats?.total)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">총 조회수</div>
                    <div className="mt-1 text-lg font-semibold">{formatNumber(blogStats?.totalViews)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">발행</div>
                    <div className="mt-1 font-medium">{formatNumber(blogStats?.published)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">초안</div>
                    <div className="mt-1 font-medium">{formatNumber(blogStats?.draft)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">예약</div>
                    <div className="mt-1 font-medium">{formatNumber(blogStats?.scheduled)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">최근 업데이트</div>
                  <div className="space-y-2">
                    {(blogStats?.recent || []).map((post) => (
                      <div key={post.id} className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{(post.title || '').trim() || '(제목 없음)'}</div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {post.status || '-'} · {formatDateTime(post.updated_at)}
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-xs text-muted-foreground">
                          조회 {formatNumber(post.view_count || 0)}
                        </div>
                      </div>
                    ))}
                    {(!blogStats?.recent || blogStats?.recent.length === 0) && (
                      <div className="text-sm text-muted-foreground">최근 항목이 없습니다.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">레퍼런스</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link to="/admin/reference">레퍼런스 관리</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {referenceError && (
                <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {referenceError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">전체</div>
                  <div className="mt-1 text-lg font-semibold">{formatNumber(referenceStats?.total)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">발행</div>
                  <div className="mt-1 text-lg font-semibold">{formatNumber(referenceStats?.published)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">최근 업데이트</div>
                <div className="space-y-2">
                  {(referenceStats?.recent || []).map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{(item.title || '').split('\n')[0] || '(제목 없음)'}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {(item.category || '-').trim()} · {formatDateTime(item.updated_at)}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        {item.is_published ? '발행' : '비발행'}
                      </div>
                    </div>
                  ))}
                  {(!referenceStats?.recent || referenceStats?.recent.length === 0) && (
                    <div className="text-sm text-muted-foreground">최근 항목이 없습니다.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">관리자</CardTitle>
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin/admins">관리자 관리</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {adminError && (
                  <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {adminError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">등록된 관리자</div>
                    <div className="mt-1 text-lg font-semibold">{formatNumber(adminCount)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">GA4</div>
                    <div className="mt-1">
                      <a className="text-sm font-medium underline-offset-4 hover:underline" href={GA4_URL} target="_blank" rel="noreferrer">
                        분석 열기
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  상세 트래픽 분석은 GA4에서 확인하세요.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
