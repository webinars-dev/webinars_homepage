import React, { useEffect, useMemo, useRef } from 'react';

const BODY_REGEX = /<body([^>]*)>([\s\S]*?)<\/body>/i;
const TITLE_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;
const ATTRIBUTE_REGEX = /([\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

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
  const bodyMatch = BODY_REGEX.exec(html);
  const bodyAttrs = bodyMatch ? parseAttributes(bodyMatch[1]) : {};
  const bodyContent = bodyMatch ? bodyMatch[2] : html;
  const title = TITLE_REGEX.exec(html)?.[1]?.trim() ?? '';
  return { bodyAttrs, bodyContent, title };
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
};

const PageRenderer = ({ html }) => {
  const containerRef = useRef(null);

  const pageData = useMemo(() => extractPageData(html), [html]);

  useEffect(() => {
    if (pageData.title) {
      document.title = pageData.title;
    }
  }, [pageData.title]);

  useEffect(() => {
    const previous = applyBodyAttributes(pageData.bodyAttrs);
    return () => restoreBodyAttributes(previous);
  }, [pageData.bodyAttrs]);

  useEffect(() => {
    hydrateNectarMedia(containerRef.current);
    window.dispatchEvent(new Event('load'));
    window.dispatchEvent(new Event('resize'));
  }, [pageData.bodyContent]);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: pageData.bodyContent }} />;
};

export default PageRenderer;
