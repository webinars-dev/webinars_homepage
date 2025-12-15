import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, RequireAuth } from '../../hooks/useAuth.jsx';
import AdminLoginPage from './AdminLoginPage';
import './admin.css';

function AdminLayoutContent() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <Link to="/admin/blog">
            <h2>WEBINARS</h2>
            <span>Blog Admin</span>
          </Link>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin/blog" end className={({ isActive }) => isActive ? 'active' : ''}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            포스트 관리
          </NavLink>
          <NavLink to="/admin/blog/new" className={({ isActive }) => isActive ? 'active' : ''}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            새 글 작성
          </NavLink>
        </nav>

        <div className="admin-user">
          <div className="admin-user-info">
            <span className="admin-user-email">{user?.email}</span>
          </div>
          <button onClick={handleSignOut} className="admin-signout-btn">
            로그아웃
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
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
