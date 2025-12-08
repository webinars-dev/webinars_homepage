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

              // Update circle on input change
              const updateCircle = () => {
                if (input.checked) {
                  circle.style.background = 'radial-gradient(circle, #333 0%, #333 35%, #fff 35%, #fff 100%)';
                } else {
                  circle.style.background = '#fff';
                }
              };
              input.addEventListener('change', updateCircle);
              updateCircle(); // Initial state
            }
          }
        });
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
