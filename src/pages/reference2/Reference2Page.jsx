import React, { memo, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';

import PageRenderer from '../../components/PageRenderer';
import pageHtml from '../../../archive/pages/reference.html?raw';
import { getPublishedReferenceItems } from '../../services/referenceService';
import './reference2.css';

const WEBINARS_HOST_REGEX = /(^|\.)webinars\.co\.kr$/i;
const StaticPageRenderer = memo(PageRenderer);

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

  const shouldReturnRelative = !/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url) && !url.startsWith('//');

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const urlObj = new URL(url, base);
    urlObj.pathname = urlObj.pathname
      .split('/')
      .map((segment) => encodeURIComponent(decodeURIComponent(segment).normalize('NFC')))
      .join('/');
    return shouldReturnRelative ? `${urlObj.pathname}${urlObj.search}${urlObj.hash}` : urlObj.toString();
  } catch {
    return url
      .normalize('NFC')
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

function Reference2Grid({ items, loading, error }) {
  const cards = useMemo(() => {
    return (items || []).map((item) => {
      const colSpan = Number(item.col_span) || 4;
      const cardClassName = `reference2-card reference2-card--span-${colSpan} ${item.modal_path ? 'modal-link' : ''}`;
      const modalHref = item.modal_path ? normalizeModalPath(item.modal_path) : '';
      const bgUrl = item.image_url ? normalizeImageUrl(item.image_url) : '';

      return (
        <div key={item.id} className={cardClassName}>
          {item.modal_path && (
            <a
              className="column-link"
              target="_self"
              href={modalHref}
              aria-label={`${item.category || 'REFERENCE'} ${item.title || ''}`.trim()}
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
  }, [items]);

  return (
    <div className="reference2-wrap" data-testid="reference2-grid">
      {loading ? (
        <div className="reference2-state">로딩 중...</div>
      ) : error ? (
        <div className="reference2-state reference2-state--error">{error}</div>
      ) : cards.length === 0 ? (
        <div className="reference2-state">등록된 레퍼런스가 없습니다.</div>
      ) : (
        <div className="reference2-grid">
          {cards}
        </div>
      )}
    </div>
  );
}

export default function Reference2Page() {
  const [mountNode, setMountNode] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          <Reference2Grid items={items} loading={loading} error={error} />,
          mountNode
        )}
    </>
  );
}
