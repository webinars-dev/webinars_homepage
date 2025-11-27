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

const hydrateNectarMedia = (root) => {
  if (!root) return;

  const nectarNodes = root.querySelectorAll('[data-nectar-img-src]');
  nectarNodes.forEach((node) => {
    const src = node.getAttribute('data-nectar-img-src');
    if (!src) return;

    if (node.tagName === 'IMG') {
      const hasPlaceholder =
        node.getAttribute('src')?.startsWith('data:image/svg+xml') ||
        !node.getAttribute('src');
      if (hasPlaceholder) {
        node.setAttribute('src', src);
      }

      const srcset = node.getAttribute('data-nectar-img-srcset');
      if (srcset) {
        node.setAttribute('srcset', srcset);
      }
    } else if (!node.style.backgroundImage) {
      node.style.backgroundImage = `url(${src})`;
    }
  });

  // Fix opacity for elements hidden by Salient theme lazy loading animations
  // Including .menu-item for GNB navigation items that get hidden after modal close
  const hiddenElements = root.querySelectorAll('.column-image-bg, .wpb_column, .img-with-animation, .wpb_row, .menu-item');
  hiddenElements.forEach((node) => {
    const computedStyle = window.getComputedStyle(node);
    if (computedStyle.opacity === '0') {
      node.style.opacity = '1';
    }
  });

  // Fix nectar-split-heading letter-reveal animations that are stuck in initial state
  const splitHeadingInners = root.querySelectorAll('.nectar-split-heading span .inner');
  splitHeadingInners.forEach((node) => {
    // Reset transform to show the text (animation moves text from translateY(1.3em) to translateY(0))
    node.style.transform = 'translateY(0)';
    node.classList.add('animated');
  });

  // Also fix any wpb_animate_when_almost_visible elements that haven't been animated
  const animateElements = root.querySelectorAll('.wpb_animate_when_almost_visible');
  animateElements.forEach((node) => {
    node.style.opacity = '1';
    node.style.transform = 'none';
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

  // Fix GNB navigation that gets hidden after modal close
  // The nav element inside header gets display:none after modal operations
  const headerNav = root.querySelector('header nav');
  if (headerNav) {
    const navStyle = window.getComputedStyle(headerNav);
    if (navStyle.display === 'none') {
      headerNav.style.display = 'flex';
    }
  }

  // Note: full-width-section styling is now handled by CSS in inline-styles.css
  // using calc(-50vw + 50%) for proper centering
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

    const appended = pageData.headNodes.map((node) => {
      const clone = node.cloneNode(true);
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
    hydrateNectarMedia(containerRef.current);
    window.dispatchEvent(new Event('load'));
    window.dispatchEvent(new Event('resize'));
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

    // Add event listener
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
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
      hydrateNectarMedia(document.body);
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