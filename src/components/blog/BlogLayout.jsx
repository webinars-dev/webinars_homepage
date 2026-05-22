import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PublicPageLayout from '../PublicPageLayout';

const BODY_ATTRIBUTES = {
  'data-header-color': 'custom',
  'data-force-header-trans-color': 'light',
  'data-slide-out-widget-area': 'true',
  'data-slide-out-widget-area-style': 'fullscreen-alt',
  'data-user-set-ocm': 'off',
  'data-full-width-header': 'true',
  'data-bg-header': 'false',
};

const LOGO_IMAGES = [
  {
    className: 'stnd skip-lazy default-logo',
    src: '/wp-content/uploads/2022/11/img_logo2.png',
  },
  {
    className: 'starting-logo skip-lazy default-logo',
    src: '/wp-content/uploads/2022/11/img_logo.png',
  },
  {
    className: 'starting-logo dark-version skip-lazy default-logo',
    src: '/wp-content/uploads/2022/11/img_logo2.png',
  },
];

const MENU_ITEMS = [
  {
    id: 'menu-item-1685',
    label: 'about',
    to: '/about/',
    className: 'menu-item menu-item-type-post_type menu-item-object-page nectar-regular-menu-item menu-item-1685',
  },
  {
    id: 'menu-item-1689',
    label: 'services',
    to: '/services2/',
    className: 'menu-item menu-item-type-post_type menu-item-object-page nectar-regular-menu-item menu-item-1689',
  },
  {
    id: 'menu-item-1688',
    label: 'reference',
    to: '/reference/',
    className: 'menu-item menu-item-type-post_type menu-item-object-page nectar-regular-menu-item menu-item-1688',
  },
  {
    id: 'menu-item-1686',
    label: 'Contact',
    to: '/contact/',
    className: 'menu-item menu-item-type-post_type menu-item-object-page nectar-regular-menu-item menu-item-1686',
  },
  {
    id: 'menu-item-blog',
    label: 'Blog',
    to: '/blog/',
    className: 'menu-item menu-item-type-custom menu-item-object-custom nectar-regular-menu-item menu-item-blog',
  },
];

const normalizePath = (path = '/') => (path.endsWith('/') ? path : `${path}/`);

const isCurrentMenuItem = (pathname, menuPath) => {
  const currentPath = normalizePath(pathname);
  const currentMenuPath = normalizePath(menuPath);

  if (currentMenuPath === '/blog/') {
    return currentPath === currentMenuPath || currentPath.startsWith('/blog/');
  }

  return currentPath === currentMenuPath;
};

export default function BlogLayout({ children }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const body = document.body;
    const hadMaterialClass = body.classList.contains('material');
    const hadBlogPageClass = body.classList.contains('blog-page');
    const previousAttrs = Object.fromEntries(
      Object.keys(BODY_ATTRIBUTES).map((name) => [name, body.getAttribute(name)])
    );

    body.classList.add('material', 'blog-page');
    Object.entries(BODY_ATTRIBUTES).forEach(([name, value]) => {
      body.setAttribute(name, value);
    });

    return () => {
      if (!hadMaterialClass) {
        body.classList.remove('material');
      }
      if (!hadBlogPageClass) {
        body.classList.remove('blog-page');
      }

      Object.entries(previousAttrs).forEach(([name, value]) => {
        if (value === null) {
          body.removeAttribute(name);
          return;
        }

        body.setAttribute(name, value);
      });
    };
  }, []);

  useEffect(() => {
    const headerOuter = document.querySelector('#header-outer');
    if (!headerOuter) return undefined;

    let lastScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    let ticking = false;
    let topRestoreTimer = null;
    const headerHeight = headerOuter.offsetHeight || 96;

    const restoreHeaderAtTop = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      if (currentScrollY > 10) return false;

      headerOuter.classList.add('at-top');
      headerOuter.classList.remove('scrolling', 'invisible', 'scrolled-down');
      headerOuter.style.transform = '';
      headerOuter.style.opacity = '';
      headerOuter.style.visibility = '';
      lastScrollY = currentScrollY;
      return true;
    };

    const scheduleTopRestore = () => {
      if (topRestoreTimer) {
        window.clearTimeout(topRestoreTimer);
      }

      topRestoreTimer = window.setTimeout(() => {
        restoreHeaderAtTop();
        topRestoreTimer = null;
      }, 180);
    };

    const updateHeader = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollingUp = currentScrollY < lastScrollY;

      if (currentScrollY <= 10) {
        restoreHeaderAtTop();
      } else if (scrollingDown && currentScrollY > headerHeight) {
        headerOuter.classList.remove('at-top');
        headerOuter.classList.add('scrolling', 'invisible');
        headerOuter.style.transform = `translateY(-${headerHeight}px)`;
      } else if (scrollingUp) {
        headerOuter.classList.remove('invisible');
        headerOuter.classList.add('scrolling');
        headerOuter.style.transform = 'translateY(0)';
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
      scheduleTopRestore();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', scheduleTopRestore, { passive: true });
    window.addEventListener('touchend', scheduleTopRestore, { passive: true });
    window.addEventListener('wheel', scheduleTopRestore, { passive: true });

    return () => {
      if (topRestoreTimer) {
        window.clearTimeout(topRestoreTimer);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', scheduleTopRestore);
      window.removeEventListener('touchend', scheduleTopRestore);
      window.removeEventListener('wheel', scheduleTopRestore);
    };
  }, [location.pathname]);

  return (
    <div id="ajax-content-wrap">
      <div id="header-space" data-header-mobile-fixed="1"></div>

      <div
        id="header-outer"
        data-has-menu="true"
        data-has-buttons="no"
        data-header-button_style="default"
        data-using-pr-menu="false"
        data-mobile-fixed="1"
        data-ptnm="false"
        data-lhe="animated_underline"
        data-user-set-bg="#ffffff"
        data-format="default"
        data-permanent-transparent="false"
        data-megamenu-rt="1"
        data-remove-fixed="0"
        data-header-resize="0"
        data-cart="false"
        data-transparency-option=""
        data-box-shadow="none"
        data-shrink-num="6"
        data-using-secondary="0"
        data-using-logo="1"
        data-logo-height="24"
        data-m-logo-height="21"
        data-padding="36"
        data-full-width="true"
        data-condense="false"
        data-remove-border="true"
        className="detached at-top entrance-animation"
      >
        <header id="top">
          <div className="container">
            <div className="row">
              <div className="col span_3">
                <Link
                  id="logo"
                  to="/"
                  data-supplied-ml-starting-dark="false"
                  data-supplied-ml-starting="false"
                  data-supplied-ml="false"
                >
                  {LOGO_IMAGES.map((image) => (
                    <img
                      key={image.className}
                      className={image.className}
                      width="380"
                      height="64"
                      alt="WEBINARS - 통합 프로모션의 새로운 표준"
                      src={image.src}
                      srcSet={`${image.src} 1x, ${image.src} 2x`}
                    />
                  ))}
                </Link>
              </div>

              <div className="col span_9 col_last">
                <nav aria-label="주요 메뉴">
                  <ul className="sf-menu sf-js-enabled sf-arrows">
                    {MENU_ITEMS.map((item) => {
                      const isCurrent = isCurrentMenuItem(location.pathname, item.to);
                      const itemClassName = isCurrent
                        ? `${item.className} current-menu-item current_page_item`
                        : item.className;

                      return (
                        <li key={item.id} id={item.id} className={itemClassName}>
                          <Link to={item.to} aria-current={isCurrent ? 'page' : undefined}>
                            <span className="menu-title-text" style={{ color: '#000000' }}>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  <ul className="buttons sf-menu" data-user-set-ocm="off" />
                </nav>

                <button
                  type="button"
                  className={`blog-mobile-menu-toggle${isMobileMenuOpen ? ' is-open' : ''}`}
                  aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
                  aria-controls="blog-mobile-menu"
                  aria-expanded={isMobileMenuOpen}
                  onClick={() => setIsMobileMenuOpen((open) => !open)}
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-color-stripe"></div>
      </div>

      <div
        id="blog-mobile-menu"
        className={`blog-mobile-menu${isMobileMenuOpen ? ' is-open' : ''}`}
        hidden={!isMobileMenuOpen}
      >
        <nav aria-label="모바일 주요 메뉴">
          <ul>
            {MENU_ITEMS.map((item) => {
              const isCurrent = isCurrentMenuItem(location.pathname, item.to);

              return (
                <li key={`mobile-${item.id}`}>
                  <Link
                    to={item.to}
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <PublicPageLayout>
        <div className="container-wrap blog-container-wrap">
          <div className="main-content">
            {children}
          </div>
        </div>
      </PublicPageLayout>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap');

        .blog-page {
          font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .blog-page .blog-container-wrap {
          padding-top: 0;
        }

        .blog-page #header-outer {
          background: transparent !important;
          box-shadow: none !important;
        }

        .blog-page #header-outer nav {
          display: flex;
          justify-content: flex-end;
        }

        .blog-page #header-outer nav > .sf-menu {
          display: flex;
          align-items: center;
        }

        .blog-page #header-outer nav > .buttons.sf-menu {
          display: none;
        }

        .blog-page .blog-mobile-menu-toggle,
        .blog-page .blog-mobile-menu {
          display: none;
        }

        .blog-page .footer-col a:hover {
          color: #fff !important;
        }

        @media (max-width: 999px) {
          .blog-page #header-outer .container,
          .blog-page #header-outer .container .row {
            width: 100%;
          }

          .blog-page #header-outer .container .row {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .blog-page #header-outer .col.span_3 {
            width: auto;
          }

          .blog-page #header-outer .col.span_9.col_last {
            width: auto;
            margin-left: auto;
          }

          .blog-page #header-outer nav {
            display: none !important;
            justify-content: flex-start;
          }

          .blog-page #header-outer nav > .sf-menu {
            flex-wrap: wrap;
          }

          .blog-page .blog-mobile-menu-toggle {
            display: inline-flex;
            position: relative;
            z-index: 10005;
            width: 44px;
            height: 44px;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 5px;
            padding: 0;
            border: 0;
            border-radius: 0;
            background: transparent;
            cursor: pointer;
          }

          .blog-page .blog-mobile-menu-toggle span {
            display: block;
            width: 22px;
            height: 2px;
            background: #071c34;
            transition: transform 0.2s ease, opacity 0.2s ease;
          }

          .blog-page .blog-mobile-menu-toggle.is-open span:nth-child(1) {
            transform: translateY(7px) rotate(45deg);
          }

          .blog-page .blog-mobile-menu-toggle.is-open span:nth-child(2) {
            opacity: 0;
          }

          .blog-page .blog-mobile-menu-toggle.is-open span:nth-child(3) {
            transform: translateY(-7px) rotate(-45deg);
          }

          .blog-page .blog-mobile-menu {
            display: block;
            position: fixed;
            top: 65px;
            left: 0;
            right: 0;
            z-index: 10000;
            background: #fff;
            border-top: 1px solid rgba(7, 28, 52, 0.08);
            box-shadow: 0 18px 42px rgba(7, 28, 52, 0.14);
          }

          .blog-page .blog-mobile-menu[hidden] {
            display: none;
          }

          .blog-page .blog-mobile-menu nav {
            display: block !important;
          }

          .blog-page .blog-mobile-menu ul {
            list-style: none;
            margin: 0;
            padding: 10px 28px 18px;
          }

          .blog-page .blog-mobile-menu li {
            border-bottom: 1px solid rgba(7, 28, 52, 0.08);
          }

          .blog-page .blog-mobile-menu li:last-child {
            border-bottom: 0;
          }

          .blog-page .blog-mobile-menu a {
            display: block;
            padding: 17px 0;
            color: #071c34;
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 15px;
            font-weight: 700;
            line-height: 1.2;
            text-transform: uppercase;
          }
        }
      `}</style>
    </div>
  );
}
