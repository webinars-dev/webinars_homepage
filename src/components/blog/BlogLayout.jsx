import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * 블로그 레이아웃 컴포넌트
 * 기존 Salient 테마와 일관된 헤더/푸터를 사용
 */
export default function BlogLayout({ children, title = '블로그' }) {
  const location = useLocation();
  const containerRef = useRef(null);

  useEffect(() => {
    // 페이지 이동 시 스크롤 최상단으로
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    // Salient 테마 스타일 적용을 위한 body 클래스
    document.body.classList.add('material', 'blog-page');
    document.body.setAttribute('data-header-color', 'dark');

    return () => {
      document.body.classList.remove('blog-page');
    };
  }, []);

  return (
    <div id="ajax-content-wrap" ref={containerRef}>
      {/* 헤더 - 메인 사이트와 동일한 스타일 */}
      <div id="header-space" data-header-mobile-fixed="1" style={{ height: '0px' }}></div>

      <div
        id="header-outer"
        data-has-menu="true"
        data-using-logo="1"
        data-format="default"
        data-header-resize="0"
        data-cart="false"
        data-transparency-option="0"
        data-box-shadow="small"
        data-shrink-num="6"
        data-full-width="true"
        data-using-secondary="0"
        data-mobile-fixed="1"
        data-ptnm="false"
        data-lhe="animated_underline"
        data-remove-border="true"
        className="transparent entrance-animation"
        style={{
          background: '#ffffff',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          boxShadow: '0 1px 0 rgba(0,0,0,0.06)'
        }}
      >
        <header id="top" style={{ padding: '20px 0' }}>
          <div className="container" style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 20px' }}>
            <div className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="col span_3">
                <Link
                  id="logo"
                  to="/"
                  style={{ display: 'inline-block' }}
                >
                  <img
                    className="stnd skip-lazy default-logo"
                    width="190"
                    height="32"
                    alt="WEBINARS"
                    src="/wp-content/uploads/2022/11/img_logo2.png"
                    style={{ height: '24px', width: 'auto' }}
                  />
                </Link>
              </div>

              <div className="col span_9" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <nav>
                  <ul
                    className="sf-menu"
                    style={{
                      display: 'flex',
                      gap: '30px',
                      listStyle: 'none',
                      margin: 0,
                      padding: 0
                    }}
                  >
                    <li className="menu-item">
                      <Link to="/about/" style={navLinkStyle}>
                        <span className="menu-title-text">ABOUT</span>
                      </Link>
                    </li>
                    <li className="menu-item">
                      <Link to="/services2/" style={navLinkStyle}>
                        <span className="menu-title-text">SERVICES</span>
                      </Link>
                    </li>
                    <li className="menu-item">
                      <Link to="/reference/" style={navLinkStyle}>
                        <span className="menu-title-text">REFERENCE</span>
                      </Link>
                    </li>
                    <li className="menu-item">
                      <Link to="/contact/" style={navLinkStyle}>
                        <span className="menu-title-text">CONTACT</span>
                      </Link>
                    </li>
                    <li className="menu-item">
                      <Link to="/blog/" style={navLinkStyle}>
                        <span className="menu-title-text">BLOG</span>
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container-wrap" style={{ paddingTop: '70px' }}>
        <div className="main-content">
          {children}
        </div>
      </div>

      {/* 푸터 - 기존 사이트와 동일한 스타일 */}
      <div
        id="footer-outer"
        data-midnight="light"
        style={{
          background: '#ffffff',
          padding: '40px 0 30px',
          borderTop: '1px solid #eee'
        }}
      >
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 90px' }}>
          {/* 회사 정보 - 좌측 정렬 (기존 사이트와 동일) */}
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: '#000000', fontSize: '12px', lineHeight: '1.8', margin: 0, fontWeight: 'bold' }}>
              &copy; 2022년 주식회사 웨비나스. 모든 저작권 소유.
            </p>
            <p style={{ color: '#000000', fontSize: '12px', lineHeight: '1.8', margin: '16px 0 0 0', fontWeight: 'bold' }}>
              대표 박재오<br />
              07208 서울특별시 영등포구 선유로49길 23, 209호
            </p>
            <p style={{ color: '#000000', fontSize: '12px', lineHeight: '1.8', margin: '16px 0 0 0', fontWeight: 'bold' }}>
              전화 02 6342 6834, 팩스 02 6342 6849, 이메일 sales@webinars.co.kr
            </p>
          </div>
        </div>
      </div>

      {/* 컨택 아이콘 - 기존 이미지 사용 */}
      <div className="teldiv" style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 99999
      }}>
        <Link to="/contact/">
          <img decoding="async" src="/images/ui/tel.png" alt="Contact" />
        </Link>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap');

        .blog-page {
          font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* 블로그 GNB 메뉴 스타일 - 흰색 배경에 검은색 텍스트 */
        .blog-page #header-outer .menu-item a,
        .blog-page #header-outer .menu-item a span {
          color: #000000 !important;
          font-weight: 900 !important;
          font-size: 20px !important;
          text-transform: uppercase !important;
          letter-spacing: 0 !important;
          line-height: 14px !important;
          font-family: 'hyphen', 'Noto Sans KR', sans-serif !important;
        }

        .blog-page #header-outer .menu-item a:hover,
        .blog-page #header-outer .menu-item a:hover span {
          color: #0066cc !important;
        }

        .footer-col a:hover {
          color: #fff !important;
        }

        /* 모바일 반응형 */
        @media (max-width: 768px) {
          #header-outer nav {
            display: none;
          }

          .container-wrap {
            padding-top: 60px !important;
          }
        }
      `}</style>
    </div>
  );
}

const navLinkStyle = {
  color: '#000000',
  textDecoration: 'none',
  fontSize: '20px',
  fontWeight: '900',
  textTransform: 'uppercase',
  letterSpacing: '0',
  lineHeight: '14px',
  fontFamily: "'hyphen', 'Noto Sans KR', sans-serif",
  transition: 'color 0.2s'
};
