import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import IndexPage from '../archive/components/index.jsx';
import AboutPage from '../archive/components/about.jsx';
import Services2Page from '../archive/components/services2.jsx';
import ReferencePage from '../archive/components/reference.jsx';
import ContactPage from '../archive/components/contact.jsx';
import CategoryPage from '../archive/components/category__eb_af_b8-_eb_b6_84_eb_a5_98.jsx';
import AuthorWebihomePage from '../archive/components/author_webihome.jsx';
import Offline2023Offline1201Page from '../archive/components/2023_offline_1201.jsx';
import Offline2024Offline0705Page from '../archive/components/2024_offline_0705.jsx';
import Offline2024Offline0904Page from '../archive/components/2024_offline_0904.jsx';
import Offline2024Offline1028Page from '../archive/components/2024_offline_1028.jsx';

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

// 메인 App 컴포넌트
function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/about/" element={<AboutPage />} />
          <Route path="/services2/" element={<Services2Page />} />
          <Route path="/reference/" element={<ReferencePage />} />
          <Route path="/contact/" element={<ContactPage />} />

          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/author/webihome/" element={<AuthorWebihomePage />} />

          <Route path="/2023_offline_1201/" element={<Offline2023Offline1201Page />} />
          <Route path="/2024_offline_0705/" element={<Offline2024Offline0705Page />} />
          <Route path="/2024_offline_0904/" element={<Offline2024Offline0904Page />} />
          <Route path="/2024_offline_1028/" element={<Offline2024Offline1028Page />} />

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
  );
}

export default App;
