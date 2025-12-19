import React, { useEffect, useMemo, useState } from 'react';

import * as adminAnalyticsService from '../../services/adminAnalyticsService';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Select } from './ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';

const GA4_URL = 'https://analytics.google.com/analytics/web/#/a37767683p3';

const formatNumber = (value) => {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return new Intl.NumberFormat('ko-KR').format(num);
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export default function AdminAnalyticsPage() {
  const [rangeDays, setRangeDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);

  const overview = payload?.overview || null;

  const dailyRows = useMemo(() => {
    return Array.isArray(payload?.daily) ? payload.daily : [];
  }, [payload?.daily]);

  const topPages = useMemo(() => {
    return Array.isArray(payload?.topPages) ? payload.topPages : [];
  }, [payload?.topPages]);

  const topBlogPages = useMemo(() => {
    return Array.isArray(payload?.topBlogPages) ? payload.topBlogPages : [];
  }, [payload?.topBlogPages]);

  const topReferencePages = useMemo(() => {
    return Array.isArray(payload?.topReferencePages) ? payload.topReferencePages : [];
  }, [payload?.topReferencePages]);

  const fetchData = async (days) => {
    setLoading(true);
    setError(null);

    try {
      const data = await adminAnalyticsService.getAnalytics({ rangeDays: days });
      setPayload(data);
    } catch (err) {
      setPayload(null);
      setError(err?.message || '통계 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(rangeDays);
  }, [rangeDays]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">통계분석</h1>
          <p className="mt-1 text-sm text-muted-foreground">Google Analytics 4 데이터를 기반으로 기본 지표를 확인합니다.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(rangeDays)}
            onChange={(event) => setRangeDays(Number(event.target.value))}
            className="w-[180px]"
          >
            <option value="7">최근 7일</option>
            <option value="30">최근 30일</option>
            <option value="90">최근 90일</option>
          </Select>

          <Button asChild variant="outline">
            <a href={GA4_URL} target="_blank" rel="noreferrer">
              GA4 열기
            </a>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
          <div className="mt-1 text-xs text-destructive/80">
            서버 환경 변수에 `GA4_PROPERTY_ID` 및 `GA4_SERVICE_ACCOUNT_JSON`(또는 `GA4_CLIENT_EMAIL`/`GA4_PRIVATE_KEY`) 설정이 필요할 수 있습니다.
          </div>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">로딩 중...</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">활성 사용자</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{formatNumber(overview?.activeUsers)}</div>
                <div className="mt-1 text-xs text-muted-foreground">최근 {rangeDays}일</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">세션</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{formatNumber(overview?.sessions)}</div>
                <div className="mt-1 text-xs text-muted-foreground">최근 {rangeDays}일</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">페이지뷰</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{formatNumber(overview?.pageViews)}</div>
                <div className="mt-1 text-xs text-muted-foreground">최근 {rangeDays}일</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">이벤트</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{formatNumber(overview?.eventCount)}</div>
                <div className="mt-1 text-xs text-muted-foreground">최근 {rangeDays}일</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">일별 추이</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>일자</TableHead>
                      <TableHead>활성 사용자</TableHead>
                      <TableHead>세션</TableHead>
                      <TableHead className="text-right">페이지뷰</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyRows.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="text-muted-foreground">{formatDate(row.date)}</TableCell>
                        <TableCell>{formatNumber(row.activeUsers)}</TableCell>
                        <TableCell>{formatNumber(row.sessions)}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.pageViews)}</TableCell>
                      </TableRow>
                    ))}
                    {dailyRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                          데이터가 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">TOP 페이지</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>경로</TableHead>
                      <TableHead className="text-right">페이지뷰</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPages.map((row) => (
                      <TableRow key={row.path}>
                        <TableCell className="font-medium">{row.path}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.pageViews)}</TableCell>
                      </TableRow>
                    ))}
                    {topPages.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                          데이터가 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">TOP 블로그 페이지</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>경로</TableHead>
                      <TableHead className="text-right">페이지뷰</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topBlogPages.map((row) => (
                      <TableRow key={row.path}>
                        <TableCell className="font-medium">{row.path}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.pageViews)}</TableCell>
                      </TableRow>
                    ))}
                    {topBlogPages.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                          데이터가 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">TOP 레퍼런스 페이지</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>경로</TableHead>
                      <TableHead className="text-right">페이지뷰</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topReferencePages.map((row) => (
                      <TableRow key={row.path}>
                        <TableCell className="font-medium">{row.path}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.pageViews)}</TableCell>
                      </TableRow>
                    ))}
                    {topReferencePages.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                          데이터가 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

