import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import * as adminUserService from '../../services/adminUserService';

import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';

function EyeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M9.9 9.9A3 3 0 0 0 14.1 14.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.2 6.2C3.7 8 2.5 12 2.5 12s3.5 7 9.5 7c2.1 0 3.9-.6 5.4-1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 5.3c5.1 1.4 7 6.7 7 6.7s-1.4 2.8-4.2 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminAdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    createUser: true,
  });

  const [editForm, setEditForm] = useState({
    userId: '',
    email: '',
    name: '',
    password: '',
  });

  const currentUserId = user?.id || null;
  const adminCount = admins.length;

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminUserService.getAdmins();
      setAdmins(data);
    } catch (err) {
      setError(err?.message || '관리자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const selfAdmin = useMemo(() => {
    if (!currentUserId) return null;
    return admins.find((admin) => admin.id === currentUserId) || null;
  }, [admins, currentUserId]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await adminUserService.upsertAdmin(form);
      setForm({ email: '', name: '', password: '', createUser: true });
      setShowCreatePassword(false);
      await fetchAdmins();
      alert('관리자 권한이 적용되었습니다.');
    } catch (err) {
      setError(err?.message || '요청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStart = (admin) => {
    setEditError(null);
    setShowEditPassword(false);
    setEditForm({
      userId: admin.id,
      email: admin.email || '',
      name: admin.name || '',
      password: '',
    });
  };

  const handleEditCancel = () => {
    setEditError(null);
    setShowEditPassword(false);
    setEditForm({ userId: '', email: '', name: '', password: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditing(true);
    setEditError(null);

    try {
      await adminUserService.updateAdmin(editForm);
      await fetchAdmins();
      handleEditCancel();
      alert('관리자 정보가 수정되었습니다.');
    } catch (err) {
      setEditError(err?.message || '수정 요청에 실패했습니다.');
    } finally {
      setEditing(false);
    }
  };

  const handleRevoke = async (admin) => {
    const displayName = admin?.email || admin?.name || admin?.id;
    if (!window.confirm(`"${displayName}" 관리자 권한을 제거하시겠습니까?`)) return;

    try {
      await adminUserService.revokeAdmin(admin.id);
      await fetchAdmins();
    } catch (err) {
      alert('권한 제거 실패: ' + (err?.message || '알 수 없는 오류'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">관리자 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">블로그/레퍼런스 관리자 계정을 추가하거나 권한을 제거합니다.</p>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">관리자 추가</CardTitle>
          <CardDescription>
            새 계정 생성 또는 기존 계정(이미 Supabase Auth에 존재) 승격이 가능합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="admin-email">이메일</Label>
              <Input
                id="admin-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="admin@webinars.co.kr"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-name">이름 (선택)</Label>
              <Input
                id="admin-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="홍길동"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">
                초기 비밀번호 {form.createUser ? <span className="text-destructive">(필수)</span> : '(선택)'}
              </Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showCreatePassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="8자 이상"
                  disabled={!form.createUser}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setShowCreatePassword((prev) => !prev)}
                  disabled={!form.createUser}
                  aria-label={showCreatePassword ? '초기 비밀번호 숨기기' : '초기 비밀번호 보기'}
                >
                  {showCreatePassword ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                id="admin-create-user"
                checked={form.createUser}
                onChange={(e) => setForm((prev) => ({ ...prev, createUser: e.target.checked }))}
              />
              <Label htmlFor="admin-create-user" className="text-sm">
                새 계정 생성
              </Label>
            </div>

            {error && (
              <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? '처리 중...' : '관리자 추가/승격'}
              </Button>
              <Button type="button" variant="outline" onClick={fetchAdmins} disabled={loading || submitting}>
                새로고침
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {editForm.userId && (
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-base">관리자 정보 수정</CardTitle>
            <CardDescription>비밀번호는 입력한 경우에만 변경됩니다. (8자 이상)</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleEditSubmit}>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="admin-edit-email">이메일</Label>
                <Input
                  id="admin-edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-edit-name">이름 (선택)</Label>
                <Input
                  id="admin-edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-edit-password">새 비밀번호 (선택)</Label>
                <div className="relative">
                  <Input
                    id="admin-edit-password"
                    type={showEditPassword ? 'text' : 'password'}
                    value={editForm.password}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="8자 이상"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={() => setShowEditPassword((prev) => !prev)}
                    aria-label={showEditPassword ? '새 비밀번호 숨기기' : '새 비밀번호 보기'}
                  >
                    {showEditPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </div>
              </div>

              {editError && (
                <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
                  {editError}
                </div>
              )}

              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit" disabled={editing}>
                  {editing ? '저장 중...' : '저장'}
                </Button>
                <Button type="button" variant="outline" disabled={editing} onClick={handleEditCancel}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {selfAdmin && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">현재 로그인</Badge>
              <span className="text-muted-foreground">{selfAdmin.email}</span>
            </div>
            <div className="text-muted-foreground">관리자 {adminCount}명</div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">로딩 중...</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">관리자 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => {
                  const isSelf = admin.id === currentUserId;
                  return (
                    <TableRow key={admin.id}>
                      <TableCell>{admin.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{admin.email || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="success">{admin.role || 'admin'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(admin.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => handleEditStart(admin)}>
                            수정
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={isSelf || adminCount <= 1}
                            onClick={() => handleRevoke(admin)}
                          >
                            {isSelf ? '내 계정' : adminCount <= 1 ? '마지막 관리자' : '권한 제거'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
