import React, { useEffect, useMemo, useRef, useState, createContext, useContext } from 'react';
import ReactDOM from 'react-dom';
import ModalContent from './ModalContent';

// Modal Context to prevent nested modals
const ModalContext = createContext(false);

const ATTRIBUTE_REGEX = /([\\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const ASSET_INFO_URL = '/asset-info.json';
const loadedAssets = {
  styles: new Set(),
  scripts: new Set()
};
let assetInfoPromise = null;

const getBodyAttributes = () => {
  if (typeof document === 'undefined') return {};
  const attributes = {};
  Array.from(document.body.attributes).forEach((attr) => {
    attributes[attr.name] = attr.value;
  });
  return attributes;
};

const parseAttributes = (attrString = '') => {
  const attributes = {};
  let match;
  while ((match = ATTRIBUTE_REGEX.exec(attrString)) !== null) {
    const [, name, dq, sq, bare] = match;
    attributes[name] = (dq ?? sq ?? bare ?? '').trim();
  }
  return attributes;
};

const extractPageData = (html) => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return { bodyAttrs: {}, bodyContent: html, title: '', headNodes: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const bodyAttrs = doc.body
    ? Array.from(doc.body.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {})
    : {};

  const bodyContent = doc.body?.innerHTML || html;
  const title = doc.title || '';
  const headNodes = doc.head ? Array.from(doc.head.children).map((node) => node.cloneNode(true)) : [];

  return { bodyAttrs, bodyContent, title, headNodes };
};

const defaultBodyAttributes = getBodyAttributes();

const applyBodyAttributes = (nextAttrs) => {
  if (typeof document === 'undefined') return defaultBodyAttributes;
  const body = document.body;
  const previous = getBodyAttributes();

  Array.from(body.attributes).forEach((attr) => {
    if (!(attr.name in nextAttrs)) {
      body.removeAttribute(attr.name);
    }
  });

  Object.entries(nextAttrs).forEach(([name, value]) => {
    if (value === undefined || value === null) {
      body.removeAttribute(name);
    } else {
      body.setAttribute(name, value);
    }
  });

  return previous;
};

const restoreBodyAttributes = (attrs) => {
  if (typeof document === 'undefined') return;
  const body = document.body;
  Array.from(body.attributes).forEach((attr) => body.removeAttribute(attr.name));
  Object.entries(attrs).forEach(([name, value]) => {
    body.setAttribute(name, value);
  });
};

const loadAssetInfo = async () => {
  if (!assetInfoPromise) {
    assetInfoPromise = fetch(ASSET_INFO_URL).then((res) => res.json());
  }
  return assetInfoPromise;
};

const ensureStyles = (styles = []) => {
  if (typeof document === 'undefined') return;
  styles.forEach((href) => {
    if (loadedAssets.styles.has(href)) return;
    if (document.querySelector(`link[data-local-asset="${href}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.localAsset = href;
    document.head.appendChild(link);
    loadedAssets.styles.add(href);
  });
};

const loadScript = (src) =>
  new Promise((resolve) => {
    if (loadedAssets.scripts.has(src) || document.querySelector(`script[data-local-asset="${src}"]`)) {
      loadedAssets.scripts.add(src);
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.dataset.localAsset = src;
    script.onload = () => {
      loadedAssets.scripts.add(src);
      resolve();
    };
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });

const ensureScriptsSequential = async (scripts = []) => {
  for (const src of scripts) {
    // eslint-disable-next-line no-await-in-loop
    await loadScript(src);
  }
};

const WEBINARS_HOST_REGEX = /(^|\.)webinars\.co\.kr$/i;

const normalizeWebinarsAssetUrl = (url) => {
  if (!url) return url;
  if (typeof window === 'undefined') return url;

  // Keep data/blob URLs intact.
  if (/^(data|blob):/i.test(url)) return url;

  try {
    const isAbsolute = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url) || url.startsWith('//');
    const base = window.location.origin;
    const urlObj = isAbsolute ? new URL(url) : new URL(url, base);

    if (WEBINARS_HOST_REGEX.test(urlObj.hostname)) {
      return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }

    return url;
  } catch {
    return url;
  }
};

const isLocalHostname = (hostname = '') => {
  if (!hostname) return false;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0';
};

const isMacEnvironment = () => {
  if (typeof navigator === 'undefined') return false;
  const platform = navigator.platform || '';
  const ua = navigator.userAgent || '';
  return /Mac/i.test(platform) || /Macintosh/i.test(ua);
};

const getHangulNormalizationForm = () => {
  // Production(Vercel/Linux)에서는 NFC가 필요하고,
  // macOS 로컬 개발(Vite dev server)에서는 NFD URL이 실제 파일 매칭에 유리합니다.
  if (typeof window === 'undefined') return 'NFC';
  if (isLocalHostname(window.location.hostname) && isMacEnvironment()) return 'NFD';
  return 'NFC';
};

// Helper function to encode Korean characters in URL
const encodeKoreanUrl = (url) => {
  if (!url) return url;

  const shouldReturnRelative = !/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url) && !url.startsWith('//');
  const normalizationForm = getHangulNormalizationForm();

  // Split URL into parts to preserve the protocol and domain
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const urlObj = new URL(url, base);
    // Encode each path segment separately to handle Korean filenames
    const encodedPath = urlObj.pathname
      .split('/')
      .map((segment) => encodeURIComponent(decodeURIComponent(segment).normalize(normalizationForm)))
      .join('/');
    urlObj.pathname = encodedPath;

    return shouldReturnRelative ? `${urlObj.pathname}${urlObj.search}${urlObj.hash}` : urlObj.toString();
  } catch {
    // If URL parsing fails, try simple encoding
    return url
      .normalize(normalizationForm)
      .replace(/[\u3131-\uD79D]/g, (char) => encodeURIComponent(char));
  }
};

const rewriteCssAssetUrls = (cssText = '') =>
  cssText.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (match, quote, rawUrl) => {
    // Ignore data/blob URLs and fragments.
    if (/^(data|blob):/i.test(rawUrl) || rawUrl.startsWith('#')) return match;

    const normalized = normalizeWebinarsAssetUrl(rawUrl);
    const encoded = encodeKoreanUrl(normalized);
    return `url(${quote}${encoded}${quote})`;
  });

const rewriteSrcset = (srcset = '') =>
  srcset
    .split(',')
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return trimmed;
      const [candidateUrl, ...rest] = trimmed.split(/\s+/);
      const normalizedCandidate = normalizeWebinarsAssetUrl(candidateUrl);
      const encodedCandidate = encodeKoreanUrl(normalizedCandidate);
      return [encodedCandidate, ...rest].join(' ');
    })
    .join(', ');

const normalizeDomAssetUrls = (root) => {
  if (!root) return;

  root.querySelectorAll('[data-nectar-img-src]').forEach((node) => {
    const raw = node.getAttribute('data-nectar-img-src');
    if (!raw) return;
    const normalized = normalizeWebinarsAssetUrl(raw);
    const encoded = encodeKoreanUrl(normalized);
    node.setAttribute('data-nectar-img-src', encoded);

    const rawSrcset = node.getAttribute('data-nectar-img-srcset');
    if (!rawSrcset) return;
    node.setAttribute('data-nectar-img-srcset', rewriteSrcset(rawSrcset));
  });

  root.querySelectorAll('img[src]').forEach((img) => {
    const raw = img.getAttribute('src');
    if (!raw) return;
    const normalized = normalizeWebinarsAssetUrl(raw);
    const encoded = encodeKoreanUrl(normalized);
    if (encoded !== raw) img.setAttribute('src', encoded);
  });

  root.querySelectorAll('img[srcset], source[srcset]').forEach((node) => {
    const raw = node.getAttribute('srcset');
    if (!raw) return;
    const rewritten = rewriteSrcset(raw);
    if (rewritten !== raw) node.setAttribute('srcset', rewritten);
  });

  root.querySelectorAll('link[rel="preload"][as="image"][href]').forEach((link) => {
    const raw = link.getAttribute('href');
    if (!raw) return;
    const normalized = normalizeWebinarsAssetUrl(raw);
    const encoded = encodeKoreanUrl(normalized);
    if (encoded !== raw) link.setAttribute('href', encoded);
  });

  root.querySelectorAll('[style*="url("]').forEach((node) => {
    const style = node.getAttribute('style');
    if (!style) return;
    const rewritten = rewriteCssAssetUrls(style);
    if (rewritten !== style) node.setAttribute('style', rewritten);
  });
};

const hydrateNectarMedia = (root) => {
  if (!root) return;

  const nectarNodes = root.querySelectorAll('[data-nectar-img-src]');
  nectarNodes.forEach((node) => {
    const src = node.getAttribute('data-nectar-img-src');
    if (!src) return;

    const normalizedSrc = normalizeWebinarsAssetUrl(src);
    const encodedSrc = encodeKoreanUrl(normalizedSrc);

    if (node.tagName === 'IMG') {
      const currentSrc = node.getAttribute('src');
      if (currentSrc) {
        const normalizedCurrent = normalizeWebinarsAssetUrl(currentSrc);
        const encodedCurrent = encodeKoreanUrl(normalizedCurrent);
        if (encodedCurrent !== currentSrc) node.setAttribute('src', encodedCurrent);
      }

      const hasPlaceholder =
        node.getAttribute('src')?.startsWith('data:image/svg+xml') ||
        !node.getAttribute('src');
      if (hasPlaceholder) {
        node.setAttribute('src', encodedSrc);
      }

      const srcset = node.getAttribute('data-nectar-img-srcset');
      if (srcset) {
        node.setAttribute('srcset', rewriteSrcset(srcset));
      }
    } else if (!node.style.backgroundImage) {
      node.style.backgroundImage = `url(${encodedSrc})`;
    }
  });

  // Fix background-image URLs with Korean characters in inline styles
  const bgElements = root.querySelectorAll('[style*="background-image"]');
  bgElements.forEach((node) => {
    const style = node.getAttribute('style');
    if (!style) return;

    // Extract URL from background-image
    const urlMatch = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/);
    if (urlMatch && urlMatch[1]) {
      const originalUrl = urlMatch[1];
      const normalized = normalizeWebinarsAssetUrl(originalUrl);
      const encodedUrl = encodeKoreanUrl(normalized);
      node.style.backgroundImage = `url("${encodedUrl}")`;
    }
  });

  // Fix opacity for elements hidden by Salient theme lazy loading animations
  // Including .menu-item for GNB navigation items that get hidden after modal close
  // IMPORTANT: Exclude .has-animation elements to preserve their scroll-triggered animations
  const hiddenElements = root.querySelectorAll('.column-image-bg, .wpb_column, .img-with-animation, .wpb_row, .menu-item');
  hiddenElements.forEach((node) => {
    // Skip elements that have has-animation class - let Waypoint handle their opacity
    if ((node.classList.contains('has-animation') && !node.classList.contains('animated-in')) ||
        node.classList.contains('wpb_animate_when_almost_visible')) {
      return;
    }
    const computedStyle = window.getComputedStyle(node);
    if (computedStyle.opacity === '0') {
      node.style.opacity = '1';
    }
  });

  // Fix img-with-aniamtion-wrap elements (note: "aniamtion" is a typo in the original WordPress theme)
  // These contain icons/images that need their opacity forced to 1 during SPA navigation
  const imgAnimationWraps = root.querySelectorAll('.img-with-aniamtion-wrap, .img-with-aniamtion-wrap .inner, .img-with-aniamtion-wrap .hover-wrap, .img-with-aniamtion-wrap .hover-wrap-inner');
  imgAnimationWraps.forEach((node) => {
    node.style.opacity = '1';
    node.style.transform = 'none';
  });

  // Fix nectar-split-heading letter-reveal animations that are stuck in initial state
  const splitHeadingInners = root.querySelectorAll('.nectar-split-heading span .inner');
  splitHeadingInners.forEach((node) => {
    // Let CSS handle the reveal transition; only ensure the animated class is applied once
    if (!node.classList.contains('animated')) {
      requestAnimationFrame(() => node.classList.add('animated'));
    }
  });

  // Fix row-bg-wrap elements with zoom-out-reveal animation that are stuck at opacity 0 and scale(0.7)
  const rowBgWraps = root.querySelectorAll('.row-bg-wrap[data-bg-animation="zoom-out-reveal"]');
  rowBgWraps.forEach((node) => {
    node.style.opacity = '1';
    node.style.transform = 'none'; // Reset the scale(0.7) animation state
    // Also fix the inner-wrap transform for the zoom effect
    const innerWrap = node.querySelector('.inner-wrap');
    if (innerWrap) {
      innerWrap.style.transform = 'scale(1)';
    }
  });

  // Fix all inner-wrap elements that may have opacity 0 from animations
  // This is critical for homepage hero section background images
  const innerWraps = root.querySelectorAll('.inner-wrap');
  innerWraps.forEach((node) => {
    const computedStyle = window.getComputedStyle(node);
    if (computedStyle.opacity === '0') {
      node.style.opacity = '1';
    }
  });

  // Fix nectar-mask-reveal-bg elements
  const maskRevealElements = root.querySelectorAll('.nectar-mask-reveal-bg');
  maskRevealElements.forEach((node) => {
    node.style.clipPath = 'none';
    node.style.webkitClipPath = 'none';
  });

  // Fix column-image-bg-wrap elements with mask-reveal animation
  // These have clip-path: inset(100%) that hides the background images
  const columnBgWraps = root.querySelectorAll('.column-image-bg-wrap[data-bg-animation="mask-reveal"]');
  columnBgWraps.forEach((node) => {
    // Remove clip-path completely to show the image
    node.style.clipPath = 'none';
    node.style.webkitClipPath = 'none';
  });

  // Fix GNB navigation that gets hidden after modal close
  // The nav element inside header gets display:none after modal operations
  const headerNav = root.querySelector('header nav');
  if (headerNav) {
    const navStyle = window.getComputedStyle(headerNav);
    if (navStyle.display === 'none') {
      headerNav.style.display = 'flex';
    }
  }

  // Fix parallax layer heights for service section cards
  // During SPA navigation, the Salient theme's parallax script doesn't initialize correctly
  // and sets height to 54px instead of the correct value based on parent column height
  const parallaxLayers = root.querySelectorAll('.column-image-bg.parallax-layer');
  parallaxLayers.forEach((layer) => {
    const computedStyle = window.getComputedStyle(layer);
    const currentHeight = parseInt(computedStyle.height, 10);

    // If height is incorrectly small (< 100px), recalculate based on parent
    if (currentHeight < 100) {
      // Find the parent column wrapper (wpb_column)
      const parentColumn = layer.closest('.wpb_column');
      if (parentColumn) {
        // Get the parent's actual height
        const parentHeight = parentColumn.offsetHeight;
        if (parentHeight > 100) {
          layer.style.height = `${parentHeight}px`;
        }
      }
    }
  });

  // Fix header-outer visibility - trigger entrance animation
  // The header starts with opacity: 0 and needs the entrance-animation class to become visible
  const headerOuter = document.querySelector('#header-outer');
  if (headerOuter) {
    // Ensure the header has the entrance-animation class for the CSS animation to work
    if (!headerOuter.classList.contains('entrance-animation')) {
      headerOuter.classList.add('entrance-animation');
    }
    // Also ensure opacity is set correctly after animation delay
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(headerOuter);
      if (computedStyle.opacity === '0') {
        headerOuter.style.opacity = '1';
      }
    }, 200);
  }

  // Note: full-width-section styling is now handled by CSS in inline-styles.css
  // using calc(-50vw + 50%) for proper centering

  // Handle page-submenu sticky behavior (services2 page)
  // Use data-custom-sticky to avoid conflict with WordPress theme's JavaScript
  const pageSubmenu = root.querySelector('.page-submenu[data-custom-sticky="true"]');
  if (pageSubmenu) {
    const stickyWrapper = pageSubmenu.parentElement;

    // Remove stuck and no-trans classes first (WordPress theme might add them)
    pageSubmenu.classList.remove('stuck', 'no-trans');

    // Wait for layout to stabilize, then calculate initial offset
    setTimeout(() => {
      // Remove again in case WordPress added them after our initial removal
      pageSubmenu.classList.remove('stuck', 'no-trans');

      const rect = stickyWrapper.getBoundingClientRect();
      const initialOffsetTop = rect.top + window.scrollY;

      console.log('[PageRenderer] page-submenu sticky setup:', {
        initialOffsetTop,
        scrollY: window.scrollY,
        rectTop: rect.top
      });

      // Get all menu items and their corresponding section IDs
      const menuItems = pageSubmenu.querySelectorAll('ul li');
      const sectionIds = [];
      menuItems.forEach((item) => {
        const link = item.querySelector('a');
        if (link) {
          const href = link.getAttribute('href');
          if (href && href.startsWith('#')) {
            sectionIds.push({
              id: href.substring(1),
              menuItem: item
            });
          }
        }
      });

      // Don't set any menu item as active by default
      // Selection box only appears when scrolled to a specific section

      const handleScroll = () => {
        // Check if we've scrolled past the initial position
        if (window.scrollY >= initialOffsetTop) {
          if (!pageSubmenu.classList.contains('stuck')) {
            pageSubmenu.classList.add('stuck');
          }
        } else {
          if (pageSubmenu.classList.contains('stuck')) {
            pageSubmenu.classList.remove('stuck');
          }
        }

        // Update current-menu-item based on scroll position
        // Find which section is currently in view
        let currentSection = null;
        const scrollPosition = window.scrollY + 200; // Offset for header

        sectionIds.forEach(({ id, menuItem }) => {
          const section = document.getElementById(id);
          if (section) {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
              currentSection = menuItem;
            }
          }
        });

        // Update active class
        menuItems.forEach((item) => {
          item.classList.remove('current-menu-item');
        });

        if (currentSection) {
          currentSection.classList.add('current-menu-item');
        }
        // No default selection - box only appears when scrolled to a section
      };

      // Initial check
      handleScroll();

      // Add scroll listener
      window.addEventListener('scroll', handleScroll, { passive: true });

      // Store cleanup function on the element for later removal
      pageSubmenu._scrollCleanup = () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }, 300);
  }
};

// Modal Component
const Modal = ({ isOpen, onClose, path }) => {
  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '90%',
          maxWidth: '1080px',
          maxHeight: '90vh',
          backgroundColor: 'white',
          borderRadius: '4px',
          boxShadow: '0 20px 70px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          style={{
            position: 'absolute',
            top: '12px',
            right: '14px',
            background: 'none',
            border: 'none',
            fontSize: '32px',
            lineHeight: 1,
            color: '#333',
            cursor: 'pointer',
            zIndex: 10,
            padding: '4px 8px',
            fontWeight: 300
          }}
          onClick={onClose}
        >
          &times;
        </button>
        <div
          className="modal-scroll-container"
          style={{ overflow: 'overlay', maxHeight: '90vh' }}
        >
          <style>{`
            .modal-scroll-container {
              overflow: overlay !important; /* 스크롤바가 콘텐츠 위에 오버레이 - 공간 차지 안함 */
              scrollbar-width: thin; /* Firefox */
              scrollbar-color: transparent transparent; /* Firefox - 기본 투명 */
            }
            .modal-scroll-container::-webkit-scrollbar {
              width: 6px;
              background: transparent;
            }
            .modal-scroll-container::-webkit-scrollbar-track {
              background: transparent;
            }
            .modal-scroll-container::-webkit-scrollbar-thumb {
              background: transparent;
              border-radius: 3px;
              transition: background 0.2s;
            }
            .modal-scroll-container:hover::-webkit-scrollbar-thumb {
              background: rgba(0, 0, 0, 0.25);
            }
            .modal-scroll-container:hover {
              scrollbar-color: rgba(0, 0, 0, 0.25) transparent; /* Firefox - hover 시 표시 */
            }
            /* overlay를 지원하지 않는 브라우저를 위한 폴백 */
            @supports not (overflow: overlay) {
              .modal-scroll-container {
                overflow: auto !important;
                scrollbar-gutter: stable; /* 스크롤바 공간 항상 예약 */
              }
            }
          `}</style>
          <ModalContext.Provider value={true}>
            <ModalContent path={path} />
          </ModalContext.Provider>
        </div>
      </div>
    </div>,
    document.body
  );
};

const PageRenderer = ({ html }) => {
  const containerRef = useRef(null);
  const isInsideModal = useContext(ModalContext);
  const [modalState, setModalState] = useState({
    isOpen: false,
    path: null
  });

  const pageData = useMemo(() => extractPageData(html), [html]);

  useEffect(() => {
    // Don't change document title when inside a modal
    if (isInsideModal) return;
    if (pageData.title) {
      document.title = pageData.title;
    }
  }, [pageData.title, isInsideModal]);

  useEffect(() => {
    // Don't change body attributes when inside a modal - this was causing the main page content to disappear
    if (isInsideModal) return;
    const previous = applyBodyAttributes(pageData.bodyAttrs);
    return () => restoreBodyAttributes(previous);
  }, [pageData.bodyAttrs, isInsideModal]);

  useEffect(() => {
    // Don't modify head nodes when inside a modal
    if (isInsideModal) return undefined;
    if (!pageData.headNodes?.length || typeof document === 'undefined') return undefined;

    // 페이지 내 lazy-load 데이터 속성을 먼저 정규화한 뒤 테마 스크립트를 주입해야
    // 테마 스크립트가 잘못된(원격/혼합콘텐츠) URL로 배경 이미지를 세팅하지 않습니다.
    normalizeDomAssetUrls(containerRef.current);

    const appended = pageData.headNodes.map((node) => {
      const clone = node.cloneNode(true);
      if (clone.tagName === 'STYLE' && clone.textContent) {
        clone.textContent = rewriteCssAssetUrls(clone.textContent);
      }
      document.head.appendChild(clone);
      return clone;
    });

    return () => {
      appended.forEach((node) => {
        if (node.parentNode === document.head) {
          document.head.removeChild(node);
        }
      });
    };
  }, [pageData.headNodes, isInsideModal]);

  useEffect(() => {
    // CRITICAL: Reset animation elements BEFORE hydrateNectarMedia runs
    // This ensures they stay at opacity: 0 for smooth scroll-triggered animations
    const resetAnimationElements = () => {
      const animationElements = document.querySelectorAll('.has-animation:not(.animated-in)');
      animationElements.forEach((el) => {
        // Reset inline styles that would override CSS opacity: 0
        el.style.opacity = '';
        el.style.transform = '';
        // Ensure the element is visible but ready for animation
        el.classList.remove('animated-in');
      });
    };

    // Reset before hydration
    resetAnimationElements();

    // 모달/일반 페이지 공통: DOM에 남아있는 원격/혼합콘텐츠 URL을 로컬로 정규화
    // (모달은 headNodes 주입을 하지 않기 때문에 여기서도 꼭 처리해야 함)
    normalizeDomAssetUrls(containerRef.current);

    // Now hydrate (but this will skip .has-animation elements due to our fix)
    hydrateNectarMedia(containerRef.current);

    // Fix #header-space height for fixed header (single pass to avoid multiple layout shifts)
    const fixHeaderSpace = () => {
      const headerSpace = document.querySelector('#header-space');
      const headerOuter = document.querySelector('#header-outer');

      if (!headerSpace || !headerOuter) return;

      const headerHeight = headerOuter.offsetHeight || 96;
      const currentHeight = headerSpace.offsetHeight;

      if (currentHeight === 0 || Math.abs(currentHeight - headerHeight) > 10) {
        headerSpace.style.height = `${headerHeight}px`;
      }
    };

    // Run once after theme scripts have executed
    setTimeout(fixHeaderSpace, 150);

    // Fallback header scroll handler for SPA navigation
    // Salient theme's scroll handler doesn't reinitialize on SPA route changes
    // This provides the same hide-on-scroll-down, show-on-scroll-up behavior
    const initHeaderScrollHandler = () => {
      const headerOuter = document.querySelector('#header-outer');
      const body = document.body;

      // Only apply if data-hhun="1" is set (header hide up/down on scroll)
      if (!body.getAttribute('data-hhun') || body.getAttribute('data-hhun') !== '1') {
        return;
      }

      if (!headerOuter) return;

      // Apply fallback handler without forcing window scroll (avoid visible jump)
      setupFallbackScrollHandler(headerOuter);
    };

    const setupFallbackScrollHandler = (headerOuter) => {
      let lastScrollY = window.scrollY;
      let ticking = false;
      const headerHeight = headerOuter.offsetHeight || 96;

      const updateHeader = () => {
        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY;
        const scrollingUp = currentScrollY < lastScrollY;

        // At top of page
        if (currentScrollY <= 10) {
          headerOuter.classList.add('at-top');
          headerOuter.classList.remove('scrolling', 'invisible');
          headerOuter.style.transform = '';
        }
        // Scrolling down - hide header
        else if (scrollingDown && currentScrollY > headerHeight) {
          headerOuter.classList.remove('at-top');
          headerOuter.classList.add('scrolling', 'invisible');
          headerOuter.style.transform = `translateY(-${headerHeight}px)`;
        }
        // Scrolling up - show header
        else if (scrollingUp) {
          headerOuter.classList.remove('invisible');
          headerOuter.classList.add('scrolling');
          headerOuter.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
        ticking = false;
      };

      const onScroll = () => {
        if (!ticking) {
          requestAnimationFrame(updateHeader);
          ticking = true;
        }
      };

      // Store handler reference for cleanup
      window.__salientFallbackScrollHandler = onScroll;
      window.addEventListener('scroll', onScroll, { passive: true });
    };

    // Cleanup previous handler if exists
    if (window.__salientFallbackScrollHandler) {
      window.removeEventListener('scroll', window.__salientFallbackScrollHandler);
      window.__salientFallbackScrollHandler = null;
    }

    // Delay slightly to ensure DOM is ready
    setTimeout(initHeaderScrollHandler, 50);

    // Animation function - mimics anime.js behavior from original Salient theme
    // Original uses: duration: 700ms, easing: easeOutQuart, translateY: [75, 0]
    // All elements in viewport animate SIMULTANEOUSLY (no stagger)
    const ANIMATION_DURATION = 700; // ms

    // easeOutQuart - exact match to Salient theme
    // t^4 curve for smooth deceleration
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    // Animate a single element (called for each element simultaneously)
    const animateElement = (el) => {
      if (el.classList.contains('animated-in')) return;

      const startTime = performance.now();
      const animation = el.getAttribute('data-animation') || 'fade-in-from-bottom';
      const dataDelay = parseInt(el.getAttribute('data-delay') || '0', 10);

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime - dataDelay;

        if (elapsed < 0) {
          requestAnimationFrame(animate);
          return;
        }

        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const easedProgress = easeOutQuart(progress);

        let transform = '';

        switch (animation) {
          case 'fade-in-from-bottom':
            // Original Salient theme uses translateY: 75px
            transform = `translateY(${75 * (1 - easedProgress)}px)`;
            break;
          case 'fade-in-from-left':
            transform = `translateX(${-45 * (1 - easedProgress)}px)`;
            break;
          case 'fade-in-from-right':
            transform = `translateX(${45 * (1 - easedProgress)}px)`;
            break;
          case 'grow-in':
            transform = `scale(${0.75 + 0.25 * easedProgress})`;
            break;
          case 'flip-in':
            transform = `rotateY(${25 * (1 - easedProgress)}deg)`;
            break;
          case 'zoom-out':
            transform = `scale(${1.2 - 0.2 * easedProgress})`;
            break;
          default:
            transform = `translateY(${75 * (1 - easedProgress)}px)`;
        }

        el.style.opacity = String(easedProgress);
        el.style.transform = transform;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.classList.add('animated-in');
        }
      };

      requestAnimationFrame(animate);
    };

    // Animate multiple elements simultaneously (no stagger - matches original)
    const animateElementsSimultaneously = (elements) => {
      if (!elements || elements.length === 0) return;
      // Each element starts its own animation immediately
      elements.forEach((el) => animateElement(el));
    };

    // Fallback animation handler using IntersectionObserver
    const initFallbackAnimations = () => {
      setupFallbackAnimationObserver();

      // Animate elements already in viewport simultaneously (no stagger - matches original)
      requestAnimationFrame(() => {
        const stillNotAnimated = document.querySelectorAll('.has-animation:not(.animated-in)');
        const viewportHeight = window.innerHeight;

        // Filter to elements in viewport
        const inViewportNotAnimated = Array.from(stillNotAnimated).filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top < viewportHeight * 0.9 && rect.bottom > 0;
        });

        // Animate all viewport elements simultaneously (matches original Salient behavior)
        animateElementsSimultaneously(inViewportNotAnimated);
      });
    };

    const setupFallbackAnimationObserver = () => {
      if (window.__animationObserver) {
        window.__animationObserver.disconnect();
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated-in')) {
              // Use JavaScript animation instead of CSS transition
              animateElement(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -10% 0px'
        }
      );

      document.querySelectorAll('.has-animation:not(.animated-in)').forEach((el) => {
        observer.observe(el);
      });

      window.__animationObserver = observer;
    };

    // Initialize fallback animations after DOM is ready and painted
    // Double requestAnimationFrame ensures layout is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initFallbackAnimations();

        // Fix: Initialize counter animations for stats-number elements
        // These use data-counter-value attribute and animate from 0 to target value
        const initCounterAnimations = () => {
          const counterElements = document.querySelectorAll('.stats-number[data-counter-value]');
          if (counterElements.length === 0) return;

          // CountUp animation function
          const animateCounter = (element) => {
            const targetValue = parseInt(element.getAttribute('data-counter-value'), 10);
            const speed = parseFloat(element.getAttribute('data-speed')) || 2;
            const separator = element.getAttribute('data-separator') || ',';
            const duration = speed * 1000; // Convert to milliseconds

            // Don't re-animate if already animated
            if (element.dataset.counterAnimated === 'true') return;
            element.dataset.counterAnimated = 'true';

            const startTime = performance.now();
            const startValue = 0;

            const formatNumber = (num) => {
              return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
            };

            const updateCounter = (currentTime) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);

              // Easing function (easeOutQuart for smooth deceleration)
              const easeOutQuart = 1 - Math.pow(1 - progress, 4);
              const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutQuart);

              element.textContent = formatNumber(currentValue);

              if (progress < 1) {
                requestAnimationFrame(updateCounter);
              }
            };

            requestAnimationFrame(updateCounter);
          };

          // Use IntersectionObserver to trigger animation when visible
          const counterObserver = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  animateCounter(entry.target);
                  counterObserver.unobserve(entry.target);
                }
              });
            },
            {
              threshold: 0.3,
              rootMargin: '0px 0px -50px 0px'
            }
          );

          counterElements.forEach((el) => {
            // Reset to 0 initially
            el.textContent = '0';
            counterObserver.observe(el);
          });
        };

        initCounterAnimations();

        // Fix: Add radio button circles via JavaScript
        // CSS ::before doesn't work reliably on SPA navigation, so we always use JS
        const applyRadioCircleStyles = (scope = document) => {
          const radioInputs = scope.querySelectorAll('input[type="radio"]');
          radioInputs.forEach((input) => {
            const label = input.nextElementSibling;
            if (!label || label.tagName !== 'LABEL') return;

            const span = label.querySelector('span');
            const circle = span?.querySelector('.radio-circle');
            if (!circle) return;

            circle.style.background = input.checked
              ? 'radial-gradient(circle, #333 0%, #333 35%, #fff 35%, #fff 100%)'
              : '#fff';
          });
        };

        const radioInputs = document.querySelectorAll('input[type="radio"]');
        radioInputs.forEach((input) => {
          const label = input.nextElementSibling;
          if (label && label.tagName === 'LABEL') {
            const span = label.querySelector('span');
            if (span && !span.querySelector('.radio-circle')) {
              // Create a visual circle element
              const circle = document.createElement('span');
              circle.className = 'radio-circle';
              circle.style.cssText = `
                display: inline-block;
                width: 20px;
                height: 20px;
                margin: -4px 8px 0 0;
                vertical-align: middle;
                border-radius: 50%;
                background: #fff;
                box-sizing: border-box;
                cursor: pointer;
              `;
              span.insertBefore(circle, span.firstChild);
            }

            if (input.dataset.radioCircleBound !== 'true') {
              input.addEventListener('change', () => applyRadioCircleStyles());
              input.dataset.radioCircleBound = 'true';
            }
          }
        });
        applyRadioCircleStyles();
      });
    });
  }, [pageData.bodyContent]);

  useEffect(() => {
    let cancelled = false;

    const loadAssets = async () => {
      try {
        const info = await loadAssetInfo();
        if (cancelled || !info) return;
        ensureStyles(info.stylesheets);
        await ensureScriptsSequential(info.scripts);
      } catch (error) {
        console.error('Failed to load local assets', error);
      }
    };

    loadAssets();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const normalizeModalHref = (href) => {
      if (!href) return null;
      if (href.startsWith('http')) return href;

      // For local development, use local URLs
      if (href.startsWith('/wp/')) {
        // Remove /wp/ prefix and return as local path with trailing slash
        let localPath = href.replace('/wp/', '/');
        // Ensure trailing slash for routes
        if (!localPath.endsWith('/') && !localPath.includes('?') && !localPath.includes('#')) {
          localPath += '/';
        }
        console.log('[Modal] Original:', href, '-> Normalized:', localPath);
        return localPath;
      }

      return href;
    };

    const handleClick = (event) => {
      // Don't handle modal clicks if we're already inside a modal
      if (isInsideModal) return;

      // Check if click is on or inside a modal link
      let target = event.target;
      let modalLink = null;
      let anchor = null;

      // Traverse up the DOM tree
      while (target && target !== document.body) {
        // Check if current element is the anchor
        if (target.tagName === 'A' && target.classList.contains('column-link')) {
          anchor = target;
        }
        // Check if current element or its parent has modal-link class
        if (target.classList.contains('modal-link')) {
          modalLink = target;
        }
        target = target.parentElement;
      }

      // If we found both modal-link container and anchor, handle the modal
      if (modalLink && anchor) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();

        const href = anchor.getAttribute('href');
        if (!href) return;

        const normalizedPath = normalizeModalHref(href);
        console.log('[Modal] Opening with path:', normalizedPath);

        setModalState({
          isOpen: true,
          path: normalizedPath
        });
      }
    };

    // Handle Ultimate Addons Expandable Section (더보기 button)
    const handleExpandableSection = (event) => {
      let target = event.target;
      let expMain = null;

      // Traverse up to find ult_exp_section-main element
      while (target && target !== document.body) {
        if (target.classList && target.classList.contains('ult_exp_section-main')) {
          expMain = target;
          break;
        }
        target = target.parentElement;
      }

      if (expMain) {
        event.preventDefault();
        event.stopPropagation();

        // Find the parent ult_exp_section wrapper
        const expSection = expMain.closest('.ult_exp_section');
        if (!expSection) return;

        // Find the sibling ult_exp_content element
        const expLayer = expSection.closest('.ult_exp_section_layer');
        if (!expLayer) return;

        const expContent = expLayer.querySelector('.ult_exp_content');
        if (!expContent) return;

        // Toggle the expanded state
        const isExpanded = expSection.classList.contains('ult_active_section');
        const effect = expSection.getAttribute('data-effect') || 'slideToggle';

        if (isExpanded) {
          // Collapse
          expSection.classList.remove('ult_active_section');
          if (effect === 'slideToggle') {
            expContent.style.transition = 'height 0.3s ease-out, opacity 0.3s ease-out';
            expContent.style.height = expContent.scrollHeight + 'px';
            requestAnimationFrame(() => {
              expContent.style.height = '0';
              expContent.style.opacity = '0';
            });
            setTimeout(() => {
              expContent.style.display = 'none';
              expContent.style.height = '';
              expContent.style.transition = '';
            }, 300);
          } else {
            expContent.style.display = 'none';
          }
        } else {
          // Expand
          expSection.classList.add('ult_active_section');
          if (effect === 'slideToggle') {
            expContent.style.display = 'block';
            expContent.style.height = '0';
            expContent.style.opacity = '0';
            expContent.style.overflow = 'hidden';
            const targetHeight = expContent.scrollHeight;
            expContent.style.transition = 'height 0.3s ease-out, opacity 0.3s ease-out';
            requestAnimationFrame(() => {
              expContent.style.height = targetHeight + 'px';
              expContent.style.opacity = '1';
            });
            setTimeout(() => {
              expContent.style.height = '';
              expContent.style.overflow = '';
              expContent.style.transition = '';
            }, 300);
          } else {
            expContent.style.display = 'block';
            expContent.style.opacity = '1';
          }
        }
      }
    };

    // Handle Ultimate Addons modal (overlay-show class)
    const handleUltimateAddonsModal = (event) => {
      let target = event.target;
      let overlayTrigger = null;

      // Traverse up to find overlay-show element
      while (target && target !== document.body) {
        if (target.classList && target.classList.contains('overlay-show')) {
          overlayTrigger = target;
          break;
        }
        target = target.parentElement;
      }

      if (overlayTrigger) {
        event.preventDefault();
        event.stopPropagation();

        // Get the data-class-id which links to the overlay
        const classId = overlayTrigger.getAttribute('data-class-id');
        if (!classId) return;

        // Find the corresponding overlay
        const overlay = document.querySelector(`.ult-overlay.${classId}`);
        if (!overlay) return;

        // Show the overlay
        overlay.style.display = 'block';
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';

        // Find and show the modal content
        const modalContent = overlay.querySelector('.ult_modal-content');
        if (modalContent) {
          modalContent.classList.remove('ult-hide');
          modalContent.style.opacity = '1';
          modalContent.style.transform = 'translateY(0)';
        }

        // Handle close button
        const closeBtn = overlay.querySelector('.ult-overlay-close');
        if (closeBtn) {
          const closeHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            overlay.style.display = 'none';
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            document.body.style.overflow = '';
            closeBtn.removeEventListener('click', closeHandler);
          };
          closeBtn.addEventListener('click', closeHandler);
        }

        // Handle overlay background click to close
        const overlayClickHandler = (e) => {
          if (e.target === overlay) {
            overlay.style.display = 'none';
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            document.body.style.overflow = '';
            overlay.removeEventListener('click', overlayClickHandler);
          }
        };
        overlay.addEventListener('click', overlayClickHandler);

        // Handle ESC key to close
        const escHandler = (e) => {
          if (e.key === 'Escape') {
            overlay.style.display = 'none';
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            document.body.style.overflow = '';
            document.removeEventListener('keydown', escHandler);
          }
        };
        document.addEventListener('keydown', escHandler);
      }
    };

    // Handle mobile hamburger menu toggle
    const handleMobileMenuToggle = (event) => {
      let target = event.target;
      let toggleBtn = null;
      let closeBtn = null;

      // Traverse up to find toggle button or close button
      while (target && target !== document.body) {
        // Check for hamburger toggle button
        if (target.closest('.slide-out-widget-area-toggle')) {
          toggleBtn = target.closest('.slide-out-widget-area-toggle').querySelector('a');
          break;
        }
        // Check for close button inside slide-out menu
        if (target.classList && target.classList.contains('slide_out_area_close')) {
          closeBtn = target;
          break;
        }
        target = target.parentElement;
      }

      if (toggleBtn || closeBtn) {
        event.preventDefault();
        event.stopPropagation();

        const slideOutArea = document.querySelector('#slide-out-widget-area');
        const menuToggleLink = document.querySelector('.slide-out-widget-area-toggle a');

        if (!slideOutArea || !menuToggleLink) return;

        const isOpen = menuToggleLink.classList.contains('open');

        if (isOpen || closeBtn) {
          // Close menu
          menuToggleLink.classList.remove('open', 'animating');
          menuToggleLink.classList.add('closed');
          menuToggleLink.setAttribute('aria-expanded', 'false');
          slideOutArea.style.display = 'none';
          document.body.style.overflow = '';
        } else {
          // Open menu
          menuToggleLink.classList.remove('closed');
          menuToggleLink.classList.add('open', 'animating');
          menuToggleLink.setAttribute('aria-expanded', 'true');
          slideOutArea.style.display = 'block';
          document.body.style.overflow = 'hidden';
        }
      }
    };

    // Handle clicks on menu items inside slide-out menu (close menu after navigation)
    const handleSlideOutMenuClick = (event) => {
      const slideOutArea = document.querySelector('#slide-out-widget-area');
      if (!slideOutArea) return;

      // Check if click is on a menu item link inside the slide-out area
      const menuLink = event.target.closest('#slide-out-widget-area .menu-item a');
      if (menuLink) {
        // Close the menu after a short delay to allow navigation
        setTimeout(() => {
          const menuToggleLink = document.querySelector('.slide-out-widget-area-toggle a');
          if (menuToggleLink) {
            menuToggleLink.classList.remove('open', 'animating');
            menuToggleLink.classList.add('closed');
            menuToggleLink.setAttribute('aria-expanded', 'false');
          }
          slideOutArea.style.display = 'none';
          document.body.style.overflow = '';
        }, 100);
      }
    };

    // Add event listeners
    // NOTE: 일부 테마/플러그인 스크립트가 document 캡처 단계에서 stopImmediatePropagation을 호출해
    // document 리스너가 실행되지 않는 케이스가 있어, window 캡처 단계에서 먼저 처리합니다.
    window.addEventListener('click', handleClick, true);
    document.addEventListener('click', handleExpandableSection, true);
    document.addEventListener('click', handleUltimateAddonsModal, true);
    document.addEventListener('click', handleMobileMenuToggle, true);
    document.addEventListener('click', handleSlideOutMenuClick, false);

    return () => {
      window.removeEventListener('click', handleClick, true);
      document.removeEventListener('click', handleExpandableSection, true);
      document.removeEventListener('click', handleUltimateAddonsModal, true);
      document.removeEventListener('click', handleMobileMenuToggle, true);
      document.removeEventListener('click', handleSlideOutMenuClick, false);
    };
  }, [isInsideModal]);

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      path: null
    });
    // Re-hydrate the main page content after modal closes
    // This fixes the issue where images and GNB disappear after closing the modal
    // Use document.body to ensure GNB menu items (which are outside containerRef) are also fixed
    setTimeout(() => {
      normalizeDomAssetUrls(document.body);
      hydrateNectarMedia(document.body);

      // Fix: Restore ALL animation elements after modal closes
      // The IntersectionObserver has already unobserved elements that were animated,
      // and won't re-animate elements that were below viewport when modal opened.
      // To ensure all content is visible after modal closes, we restore all elements.

      // 1. Restore .has-animation elements (Salient theme animations)
      const hasAnimationElements = document.querySelectorAll('.has-animation');
      hasAnimationElements.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.classList.add('animated-in');
      });

      // 2. Restore WPBakery animation elements (wpb_fadeInUp, etc.)
      // These are text elements inside cards that have their own animation
      const wpbAnimElements = document.querySelectorAll('.wpb_animate_when_almost_visible');
      wpbAnimElements.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }, 0);
  };

  return (
    <>
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: pageData.bodyContent }} />
      {/* Only render modal if we're not inside another modal */}
      {!isInsideModal && (
        <Modal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          path={modalState.path}
        />
      )}
    </>
  );
};

export default PageRenderer;
