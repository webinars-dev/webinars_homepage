import React, { useEffect } from 'react';
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
              </div>
            </div>
          </div>
        </header>

        <div className="bg-color-stripe"></div>
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
          background: transparent;
          box-shadow: none;
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

        .blog-page .footer-col a:hover {
          color: #fff !important;
        }

        @media (max-width: 999px) {
          .blog-page #header-outer nav {
            justify-content: flex-start;
          }

          .blog-page #header-outer nav > .sf-menu {
            flex-wrap: wrap;
          }

        }
      `}</style>
    </div>
  );
}
