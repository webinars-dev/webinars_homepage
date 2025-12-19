import React, { useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, RequireAuth } from '../../hooks/useAuth.jsx';
import { useAdminRole } from '../../hooks/useAdminRole.jsx';
import AdminLoginPage from './AdminLoginPage';
import './admin.css';
import './admin-ui.css';

import { Button } from './ui/button.jsx';
import { cn } from './ui/cn.js';
import { Separator } from './ui/separator.jsx';

function AdminLayoutContent() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'admin-inter-noto-sans';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="admin-ui min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
            <Link to={isAdmin ? '/admin/blog' : '/admin/reference'} className="flex items-baseline gap-2">
              <span className="text-base font-semibold tracking-tight">WEBINARS</span>
              <span className="text-xs font-medium text-muted-foreground">Admin</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {isAdmin ? (
              <>
                <NavLink
                  to="/admin/blog"
                  end
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                    )
                  }
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                  포스트 관리
                </NavLink>
                <NavLink
                  to="/admin/blog/new"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                    )
                  }
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  새 글 작성
                </NavLink>

                <NavLink
                  to="/admin/reference"
                  end
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                    )
                  }
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M4 4h16v2H4V4zm0 7h16v2H4v-2zm0 7h16v2H4v-2z" />
                  </svg>
                  레퍼런스 관리
                </NavLink>
                <NavLink
                  to="/admin/reference/new"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                    )
                  }
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  새 레퍼런스
                </NavLink>

                <Separator className="my-3 bg-sidebar-border" />

                <NavLink
                  to="/admin/admins"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                    )
                  }
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V21h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V21h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  관리자 관리
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/admin/reference"
                  end
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                    )
                  }
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M4 4h16v2H4V4zm0 7h16v2H4v-2zm0 7h16v2H4v-2z" />
                  </svg>
                  레퍼런스 관리
                </NavLink>
                <NavLink
                  to="/admin/reference/new"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                    )
                  }
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  새 레퍼런스
                </NavLink>
              </>
            )}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full justify-center"
              onClick={handleSignOut}
            >
              로그아웃
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-background">
          <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <RequireAuth fallback={<AdminLoginPage />}>
      <AdminLayoutContent />
    </RequireAuth>
  );
}
