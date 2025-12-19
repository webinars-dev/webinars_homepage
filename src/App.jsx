import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';

import IndexPage from '../archive/components/index.jsx';
import AboutPage from '../archive/components/about.jsx';
import Services2Page from '../archive/components/services2.jsx';
import ContactPage from '../archive/components/contact.jsx';
import CategoryPage from '../archive/components/category__eb_af_b8-_eb_b6_84_eb_a5_98.jsx';
import AuthorWebihomePage from '../archive/components/author_webihome.jsx';
import ContactThankYou from './components/ContactThankYou.jsx';

// 모달용 wp_ 페이지 imports
import Wp2023Offline1201Page from '../archive/components/wp_2023_offline_1201.jsx';
import Wp2024Hybrid4Page from '../archive/components/wp_2024_hybrid_4.jsx';
import Wp2024Hybrid5Page from '../archive/components/wp_2024_hybrid_5.jsx';
import Wp2024Hybrid8Page from '../archive/components/wp_2024_hybrid_8.jsx';
import Wp2024Offline0705Page from '../archive/components/wp_2024_offline_0705.jsx';
import Wp2024Offline0904Page from '../archive/components/wp_2024_offline_0904.jsx';
import Wp2024Offline0927Page from '../archive/components/wp_2024_offline_0927.jsx';
import Wp2024Offline1010Page from '../archive/components/wp_2024_offline_1010.jsx';
import Wp2024Offline1028Page from '../archive/components/wp_2024_offline_1028.jsx';
import Wp2024Offline2Page from '../archive/components/wp_2024_offline_2.jsx';
import Wp2024Offline3Page from '../archive/components/wp_2024_offline_3.jsx';
import Wp2024Offline6Page from '../archive/components/wp_2024_offline_6.jsx';
import Wp2024Offline9Page from '../archive/components/wp_2024_offline_9.jsx';
import Wp2024OfflineActs2024Page from '../archive/components/wp_2024_offline_acts2024.jsx';
import Wp2024OfflineRmaf0715Page from '../archive/components/wp_2024_offline_rmaf0715.jsx';
import WpHybrid1Page from '../archive/components/wp_hybrid_1.jsx';
import WpHybrid2Page from '../archive/components/wp_hybrid_2.jsx';
import WpHybrid3Page from '../archive/components/wp_hybrid_3.jsx';
import WpHybrid5Page from '../archive/components/wp_hybrid_5.jsx';
import WpHybrid6Page from '../archive/components/wp_hybrid_6.jsx';
import WpHybrid7Page from '../archive/components/wp_hybrid_7.jsx';
import WpHybrid8Page from '../archive/components/wp_hybrid_8.jsx';
import WpHybrid9Page from '../archive/components/wp_hybrid_9.jsx';
import WpHybrid11Page from '../archive/components/wp_hybrid_11.jsx';
import WpHybrid12Page from '../archive/components/wp_hybrid_12.jsx';
import WpSolution4Page from '../archive/components/wp_solution_4.jsx';
import WpWebinarLiveStreaming13Page from '../archive/components/wp_webinar_live-streaming_13.jsx';
import WpWebinarLiveStreaming14Page from '../archive/components/wp_webinar_live-streaming_14.jsx';
import WpWebinarLiveStreaming15Page from '../archive/components/wp_webinar_live-streaming_15.jsx';
import WpContactPage from '../archive/components/wp_contact.jsx';

// WEBINAR 서브디렉토리 컴포넌트
import Webinar2024DesignPublication1Page from '../archive/components/webinar_2024_design_publication_1.jsx';
import Webinar2024Offline7Page from '../archive/components/webinar_2024_offline_7.jsx';
import WebinarLiveStreaming10Page from '../archive/components/webinar_live_streaming_10.jsx';

// 블로그 페이지
import { BlogIndexPage, BlogPostPage, BlogCategoryPage, BlogTagPage } from './pages/blog';
import Reference2Page from './pages/reference2/Reference2Page.jsx';

// 관리자 페이지
import { AdminLayout, AdminLoginPage, AdminDashboardPage, AdminPostListPage, AdminPostEditPage, AdminReferenceListPage, AdminReferenceEditPage, AdminAdminsPage } from './pages/admin';
import ResetPasswordPage from './pages/admin/ResetPasswordPage.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import RequireAdmin from './pages/admin/RequireAdmin.jsx';

// 에러 바운더리 컴포넌트
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-container">
          <h1>페이지 로드 중 오류가 발생했습니다</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>새로고침</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Link adapter to handle internal navigation with WordPress style URLs
function LocalLinkAdapter() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const rewriteLinks = () => {
      const anchors = document.querySelectorAll(
        'a[href^="https://webinars.co.kr"], a[href^="http://webinars.co.kr"]'
      );

      anchors.forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (!href) return;

        try {
          const url = new URL(href);
          const path = `${url.pathname}${url.search}${url.hash}`;
          anchor.setAttribute('href', path || '/');
        } catch (error) {
          // ignore invalid URLs
        }
      });
    };

    const handleClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = event.target.closest('a');
      if (!anchor) return;
      if (anchor.target === '_blank') return;

      // Check if this is a modal link - more comprehensive check
      const isModalLink = anchor.classList.contains('column-link') &&
                          anchor.closest('.modal-link');

      // Also check if the click target is anywhere within a modal-link container
      const modalContainer = event.target.closest('.modal-link');

      if (isModalLink || modalContainer) {
        console.log('[LocalLinkAdapter] Skipping modal link:', anchor.href);
        return; // Let the modal handler process this
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const isAbsolute = href.startsWith('http://') || href.startsWith('https://');
      if (isAbsolute && !href.includes('webinars.co.kr')) {
        return;
      }

      // Check if this is a main navigation link (GNB)
      const isGnbLink = anchor.closest('nav') ||
                        anchor.closest('.menu') ||
                        anchor.closest('#Top_bar') ||
                        ['ABOUT', 'SERVICES', 'REFERENCE', 'CONTACT'].includes(anchor.textContent.trim().toUpperCase());

      try {
        const url = isAbsolute ? new URL(href) : null;
        const path = isAbsolute ? `${url.pathname}${url.search}${url.hash}` : href;

        console.log('[LocalLinkAdapter] Navigation:', {
          href,
          path,
          isGnbLink,
          currentPath: location.pathname
        });

        event.preventDefault();
        navigate(path || '/');
      } catch (error) {
        console.error('[LocalLinkAdapter] Navigation error:', error);
      }
    };

    rewriteLinks();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [navigate, location.key]);

  useEffect(() => {
    const anchors = document.querySelectorAll(
      'a[href^="https://webinars.co.kr"], a[href^="http://webinars.co.kr"]'
    );

    anchors.forEach((anchor) => {
      const href = anchor.getAttribute('href');
      if (!href) return;

      try {
        const url = new URL(href);
        const path = `${url.pathname}${url.search}${url.hash}`;
        anchor.setAttribute('href', path || '/');
      } catch (error) {
        // ignore invalid URLs
      }
    });
  }, [location.pathname, location.search, location.hash]);

  return null;
}

// 메인 App 컴포넌트
function App() {
  return (
    <AuthProvider>
      <Router>
        <LocalLinkAdapter />
        <ErrorBoundary>
          <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about/" element={<AboutPage />} />

          <Route path="/services2" element={<Services2Page />} />
          <Route path="/services2/" element={<Services2Page />} />
          <Route path="/services" element={<Services2Page />} />
          <Route path="/services/" element={<Services2Page />} />

          <Route path="/reference" element={<Reference2Page layout="masonry" />} />
          <Route path="/reference/" element={<Reference2Page layout="masonry" />} />
          <Route path="/reference2" element={<Reference2Page />} />
          <Route path="/reference2/" element={<Reference2Page />} />

          <Route path="/contact" element={<ContactPage />} />
          <Route path="/contact/" element={<ContactPage />} />
          <Route path="/contacts" element={<ContactPage />} />
          <Route path="/contacts/" element={<ContactPage />} />
          <Route path="/contact/thank-you" element={<ContactThankYou />} />
          <Route path="/contact/thank-you/" element={<ContactThankYou />} />

          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/author/webihome/" element={<AuthorWebihomePage />} />

          {/* 모달용 wp_ 페이지 라우트 */}
          <Route path="/2023_offline_1201/" element={<Wp2023Offline1201Page />} />
          <Route path="/2024_hybrid_4/" element={<Wp2024Hybrid4Page />} />
          <Route path="/2024_hybrid_5/" element={<Wp2024Hybrid5Page />} />
          <Route path="/2024_hybrid_8/" element={<Wp2024Hybrid8Page />} />
          <Route path="/2024_offline_0705/" element={<Wp2024Offline0705Page />} />
          <Route path="/2024_offline_0904/" element={<Wp2024Offline0904Page />} />
          <Route path="/2024_offline_0927/" element={<Wp2024Offline0927Page />} />
          <Route path="/2024_offline_1010/" element={<Wp2024Offline1010Page />} />
          <Route path="/2024_offline_1028/" element={<Wp2024Offline1028Page />} />
          <Route path="/2024_offline_2/" element={<Wp2024Offline2Page />} />
          <Route path="/2024_offline_3/" element={<Wp2024Offline3Page />} />
          <Route path="/2024_offline_6/" element={<Wp2024Offline6Page />} />
          <Route path="/2024_offline_9/" element={<Wp2024Offline9Page />} />
          <Route path="/2024_offline_acts2024/" element={<Wp2024OfflineActs2024Page />} />
          <Route path="/2024_offline_rmaf0715/" element={<Wp2024OfflineRmaf0715Page />} />
          <Route path="/hybrid_1/" element={<WpHybrid1Page />} />
          <Route path="/hybrid_2/" element={<WpHybrid2Page />} />
          <Route path="/hybrid_3/" element={<WpHybrid3Page />} />
          <Route path="/hybrid_5/" element={<WpHybrid5Page />} />
          <Route path="/hybrid_6/" element={<WpHybrid6Page />} />
          <Route path="/hybrid_7/" element={<WpHybrid7Page />} />
          <Route path="/hybrid_8/" element={<WpHybrid8Page />} />
          <Route path="/hybrid_9/" element={<WpHybrid9Page />} />
          <Route path="/hybrid_11/" element={<WpHybrid11Page />} />
          <Route path="/hybrid_12/" element={<WpHybrid12Page />} />
          <Route path="/solution_4/" element={<WpSolution4Page />} />
          <Route path="/webinar_live-streaming_13/" element={<WpWebinarLiveStreaming13Page />} />
          <Route path="/webinar_live-streaming_14/" element={<WpWebinarLiveStreaming14Page />} />
          <Route path="/webinar_live-streaming_15/" element={<WpWebinarLiveStreaming15Page />} />

          {/* WEBINAR 서브디렉토리 경로들 */}
          <Route path="/WEBINAR/2024_design_publication_1/" element={<Webinar2024DesignPublication1Page />} />
          <Route path="/WEBINAR/2024_offline_7/" element={<Webinar2024Offline7Page />} />
          <Route path="/WEBINAR/webinar_live-streaming_10/" element={<WebinarLiveStreaming10Page />} />

          {/* 블로그 라우트 */}
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/" element={<BlogIndexPage />} />
          <Route path="/blog/category/:categorySlug" element={<BlogCategoryPage />} />
          <Route path="/blog/tag/:tagSlug" element={<BlogTagPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />

          {/* 관리자 라우트 */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route
              path="blog"
              element={
                <RequireAdmin>
                  <AdminPostListPage />
                </RequireAdmin>
              }
            />
            <Route
              path="blog/new"
              element={
                <RequireAdmin>
                  <AdminPostEditPage />
                </RequireAdmin>
              }
            />
            <Route
              path="blog/edit/:id"
              element={
                <RequireAdmin>
                  <AdminPostEditPage />
                </RequireAdmin>
              }
            />
            <Route path="reference" element={<AdminReferenceListPage />} />
            <Route path="reference/new" element={<AdminReferenceEditPage />} />
            <Route path="reference/edit/:id" element={<AdminReferenceEditPage />} />
            <Route
              path="admins"
              element={
                <RequireAdmin>
                  <AdminAdminsPage />
                </RequireAdmin>
              }
            />
          </Route>

          <Route
            path="*"
            element={
              <div className="section">
                <div className="section_wrapper clearfix">
                  <div className="column one">
                    <h1>404 - 페이지를 찾을 수 없습니다</h1>
                    <p>요청하신 페이지가 존재하지 않습니다.</p>
                    <Link to="/">홈으로 돌아가기</Link>
                  </div>
                </div>
              </div>
            }
          />
          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;
