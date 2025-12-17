import React, { memo, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';

import PageRenderer from '../../components/PageRenderer';
import pageHtml from '../../../archive/pages/reference.html?raw';
import { getPublishedReferenceItems } from '../../services/referenceService';
import './reference2.css';

const WEBINARS_HOST_REGEX = /(^|\.)webinars\.co\.kr$/i;
const StaticPageRenderer = memo(PageRenderer);

const LAYOUTS = {
  square: 'square',
  masonry: 'masonry',
};

const normalizeColSpan = (colSpan) => {
  const value = Number(colSpan);
  if (value === 8 || value === 12) return value;
  return 4;
};

const getColSpanSize = (colSpan) => {
  const value = Number(colSpan);
  if (value === 12) return 'large';
  if (value === 8) return 'medium';
  return 'small';
};

const getColSpanUnits = (colSpan) => {
  const normalized = normalizeColSpan(colSpan);
  if (normalized === 12) return 2; // large: 2열
  if (normalized === 8) return 2;  // medium: 2열
  return 1; // small: 1열
};

const packReferenceItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const remaining = items.slice();
  const packed = [];

  while (remaining.length > 0) {
    const first = remaining.shift();
    const firstUnits = getColSpanUnits(first.col_span);

    if (firstUnits === 3) {
      packed.push(first);
      continue;
    }

    if (firstUnits === 2) {
      const smallIndex = remaining.findIndex((item) => getColSpanUnits(item.col_span) === 1);
      if (smallIndex !== -1) {
        packed.push(first, remaining.splice(smallIndex, 1)[0]);
      } else {
        packed.push(first);
      }
      continue;
    }

    const wideIndex = remaining.findIndex((item) => getColSpanUnits(item.col_span) === 2);
    const firstSmallIndex = remaining.findIndex((item) => getColSpanUnits(item.col_span) === 1);
    const secondSmallIndex =
      firstSmallIndex === -1
        ? -1
        : remaining.findIndex(
            (item, index) => index !== firstSmallIndex && getColSpanUnits(item.col_span) === 1
          );

    const canFillWithWide = wideIndex !== -1;
    const canFillWithTwoSmalls = firstSmallIndex !== -1 && secondSmallIndex !== -1;

    if (canFillWithWide && canFillWithTwoSmalls) {
      const wideCost = wideIndex;
      const smallCost = Math.max(firstSmallIndex, secondSmallIndex);

      if (wideCost <= smallCost) {
        packed.push(first, remaining.splice(wideIndex, 1)[0]);
        continue;
      }

      const [smallA, smallB] =
        firstSmallIndex < secondSmallIndex ? [firstSmallIndex, secondSmallIndex] : [secondSmallIndex, firstSmallIndex];
      const second = remaining.splice(smallB, 1)[0];
      const firstOther = remaining.splice(smallA, 1)[0];
      packed.push(first, firstOther, second);
      continue;
    }

    if (canFillWithWide) {
      packed.push(first, remaining.splice(wideIndex, 1)[0]);
      continue;
    }

    if (canFillWithTwoSmalls) {
      const [smallA, smallB] =
        firstSmallIndex < secondSmallIndex ? [firstSmallIndex, secondSmallIndex] : [secondSmallIndex, firstSmallIndex];
      const second = remaining.splice(smallB, 1)[0];
      const firstOther = remaining.splice(smallA, 1)[0];
      packed.push(first, firstOther, second);
      continue;
    }

    if (firstSmallIndex !== -1) {
      packed.push(first, remaining.splice(firstSmallIndex, 1)[0]);
      continue;
    }

    packed.push(first);
  }

  return packed;
};

const normalizeWebinarsAssetUrl = (url) => {
  if (!url) return url;
  if (typeof window === 'undefined') return url;
  if (/^(data|blob):/i.test(url)) return url;

  if (url.startsWith('/wp/wp-content/')) return url.replace('/wp/wp-content/', '/wp-content/');

  try {
    const isAbsolute = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url) || url.startsWith('//');
    const urlObj = isAbsolute ? new URL(url) : new URL(url, window.location.origin);

    if (WEBINARS_HOST_REGEX.test(urlObj.hostname)) {
      return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }
  } catch {
    // ignore
  }

  return url;
};

const encodeKoreanUrl = (url) => {
  if (!url) return url;
  if (/^(data|blob):/i.test(url)) return url;

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

  const normalizationForm =
    typeof window !== 'undefined' && isLocalHostname(window.location.hostname) && isMacEnvironment()
      ? 'NFD'
      : 'NFC';

  const shouldReturnRelative = !/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url) && !url.startsWith('//');

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const urlObj = new URL(url, base);
    urlObj.pathname = urlObj.pathname
      .split('/')
      .map((segment) => encodeURIComponent(decodeURIComponent(segment).normalize(normalizationForm)))
      .join('/');
    return shouldReturnRelative ? `${urlObj.pathname}${urlObj.search}${urlObj.hash}` : urlObj.toString();
  } catch {
    return url
      .normalize(normalizationForm)
      .replace(/[\u3131-\uD79D]/g, (char) => encodeURIComponent(char));
  }
};

const normalizeImageUrl = (url) => {
  const normalized = normalizeWebinarsAssetUrl(url);
  return encodeKoreanUrl(normalized);
};

const normalizeModalPath = (path) => {
  if (!path) return '';

  let next = path.trim();
  if (!next) return '';

  if (/^https?:\/\//i.test(next)) {
    try {
      const urlObj = new URL(next);
      if (!WEBINARS_HOST_REGEX.test(urlObj.hostname)) return next;
      next = `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    } catch {
      return next;
    }
  }

  if (!next.startsWith('/')) next = `/${next}`;
  if (next.startsWith('/wp/wp-content/')) next = next.replace('/wp/wp-content/', '/wp-content/');

  const base = next.split(/[?#]/)[0];
  const suffix = next.slice(base.length);
  const hasExt = /\.[a-zA-Z\d]{1,6}$/.test(base);
  const withSlash = !hasExt && !base.endsWith('/') ? `${base}/` : base;
  return `${withSlash}${suffix}`;
};

// "준비 중" 기본 모달 HTML
const DEFAULT_MODAL_HTML = `
<div style="text-align: center; padding: 40px 20px;">
  <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #111827;">이벤트 정보</h2>
  <p style="font-size: 16px; color: #6b7280;">상세 정보를 준비 중입니다.</p>
</div>
`;

function Reference2Grid({ items, loading, error, layout = LAYOUTS.square, onOpenModal }) {
  const arrangedItems = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    if (layout === LAYOUTS.masonry) return packReferenceItems(safeItems);
    return safeItems;
  }, [items, layout]);

  const cards = useMemo(() => {
    return arrangedItems.map((item) => {
      const sizeClass = getColSpanSize(item.col_span);
      const spanClassName = `reference2-card--${sizeClass}`;
      const hasModalHtml = !!item.modal_html?.trim();
      const hasModalPath = !!item.modal_path;
      const hasModal = hasModalHtml || hasModalPath;

      // 모든 모달 가능 카드는 React 모달 사용 (WordPress 모달 회피)
      const cardClassName = [
        'reference2-card',
        layout === LAYOUTS.square ? 'reference2-card--square' : '',
        spanClassName,
        hasModal ? 'reference2-card--has-modal' : '',
      ]
        .filter(Boolean)
        .join(' ');

      const bgUrl = item.image_url ? normalizeImageUrl(item.image_url) : '';

      const handleClick = (e) => {
        if (!hasModal) return;

        e.preventDefault();
        e.stopPropagation();
        // WordPress 모달 시스템의 이벤트 가로채기 방지 (네이티브 이벤트 사용)
        e.nativeEvent?.stopImmediatePropagation?.();

        // modal_html이 있으면 해당 HTML 사용, 없으면 기본 "준비 중" 메시지 표시
        onOpenModal?.(hasModalHtml ? item.modal_html : DEFAULT_MODAL_HTML);
      };

      return (
        <div key={item.id} className={cardClassName}>
          {/* 모든 모달 카드는 button 사용 (WordPress 모달 시스템 완전 회피) */}
          {hasModal && (
            <button
              type="button"
              className="reference2-card-link"
              aria-label={`${item.category || 'REFERENCE'} ${item.title || ''}`.trim()}
              onClick={handleClick}
            />
          )}
          <div className="reference2-card-bg" style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : undefined} />
          <div className="reference2-card-overlay" />
          <div className="reference2-card-content">
            {item.category && <h2 className="reference2-card-category">{item.category}</h2>}
            <div className="reference2-divider" />
            {item.title && <h5 className="reference2-card-title">{item.title}</h5>}
            <div className="reference2-divider reference2-divider--small" />
            {item.client && <h5 className="reference2-card-client">{item.client}</h5>}
          </div>
        </div>
      );
    });
  }, [arrangedItems, layout, onOpenModal]);

  const gridClassName = [
    'reference2-grid',
    layout === LAYOUTS.square ? 'reference2-grid--square' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="reference2-wrap" data-testid="reference2-grid" data-layout={layout}>
      {loading ? (
        <div className="reference2-state">로딩 중...</div>
      ) : error ? (
        <div className="reference2-state reference2-state--error">{error}</div>
      ) : cards.length === 0 ? (
        <div className="reference2-state">등록된 레퍼런스가 없습니다.</div>
      ) : (
        <div className={gridClassName}>
          {cards}
        </div>
      )}
    </div>
  );
}

// modal_html 내 이미지 URL의 한글을 NFC 정규화 후 인코딩
const encodeKoreanUrlsInHtml = (html) => {
  if (!html) return html;

  // src와 srcset 속성의 URL에서 한글을 인코딩
  return html.replace(
    /(src|srcset)="([^"]+)"/gi,
    (match, attr, urls) => {
      // srcset은 여러 URL을 포함할 수 있음 (쉼표로 구분)
      const encodedUrls = urls.split(',').map((urlPart) => {
        const trimmed = urlPart.trim();
        // URL과 크기 지정자 분리 (예: "url 1920w")
        const [url, ...rest] = trimmed.split(/\s+/);
        try {
          const urlObj = new URL(url);
          // pathname의 각 세그먼트를 NFC 정규화 후 인코딩
          urlObj.pathname = urlObj.pathname
            .split('/')
            .map((segment) => {
              try {
                // 디코딩 -> NFC 정규화 -> 인코딩
                const decoded = decodeURIComponent(segment);
                const normalized = decoded.normalize('NFC');
                return encodeURIComponent(normalized);
              } catch {
                // 디코딩 실패 시 원본을 NFC 정규화 후 인코딩
                const normalized = segment.normalize('NFC');
                return encodeURIComponent(normalized);
              }
            })
            .join('/');
          const encodedUrl = urlObj.toString();
          return rest.length > 0 ? `${encodedUrl} ${rest.join(' ')}` : encodedUrl;
        } catch {
          // URL 파싱 실패 시 한글만 NFC 정규화 후 인코딩
          return trimmed
            .normalize('NFC')
            .replace(/[\u3131-\uD79D]/g, (char) => encodeURIComponent(char));
        }
      });
      return `${attr}="${encodedUrls.join(', ')}"`;
    }
  );
};

function HtmlModal({ html, onClose }) {
  useEffect(() => {
    if (!html) return () => {};

    // 스크롤 위치 저장
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // html 요소에 overflow 적용 (body 대신)
    const htmlEl = document.documentElement;
    const originalOverflow = htmlEl.style.overflow;
    htmlEl.style.overflow = 'hidden';

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('keydown', handleEsc);
      // overflow 복원
      htmlEl.style.overflow = originalOverflow;
      // 스크롤 위치 복원
      window.scrollTo(scrollX, scrollY);
    };
  }, [html, onClose]);

  if (!html) return null;

  return ReactDOM.createPortal(
    <div className="reference2-modal-overlay" onClick={onClose}>
      <div className="reference2-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="reference2-modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <div
          className="reference2-modal-body"
          dangerouslySetInnerHTML={{ __html: encodeKoreanUrlsInHtml(html) }}
        />
      </div>
    </div>,
    document.body
  );
}

export default function Reference2Page({ layout = LAYOUTS.square } = {}) {
  const [mountNode, setMountNode] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalHtml, setModalHtml] = useState(null);

  const handleOpenModal = (html) => setModalHtml(html);
  const handleCloseModal = () => setModalHtml(null);

  useLayoutEffect(() => {
    const container = document.querySelector('#modal-ready');
    if (!container) return;

    const existing = container.querySelector('#reference2-root');
    if (existing) {
      setMountNode(existing);
      return;
    }

    const referenceRows = Array.from(container.querySelectorAll('.wpb_row.reference'));
    if (referenceRows.length === 0) return;

    const placeholder = document.createElement('div');
    placeholder.id = 'reference2-root';
    placeholder.className = 'reference2-root';

    const firstRow = referenceRows[0];
    firstRow.parentNode.insertBefore(placeholder, firstRow);
    referenceRows.forEach((row) => row.remove());

    setMountNode(placeholder);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getPublishedReferenceItems();
        if (cancelled) return;
        setItems(data);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || '레퍼런스 데이터를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <StaticPageRenderer html={pageHtml} />
      {mountNode &&
        ReactDOM.createPortal(
          <Reference2Grid items={items} loading={loading} error={error} layout={layout} onOpenModal={handleOpenModal} />,
          mountNode
        )}
      <HtmlModal html={modalHtml} onClose={handleCloseModal} />
    </>
  );
}
