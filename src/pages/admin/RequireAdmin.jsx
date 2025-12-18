import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminRole } from '../../hooks/useAdminRole.jsx';

import { Button } from './ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.jsx';

export default function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAdminRole();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">권한 확인 중...</CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">접근 권한이 없습니다</CardTitle>
          <CardDescription>해당 메뉴는 관리자만 사용할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/reference">레퍼런스 관리로 이동</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/admin/login">다시 로그인</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return children;
}

