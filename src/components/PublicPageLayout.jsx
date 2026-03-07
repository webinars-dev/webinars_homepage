import React, { useEffect, useMemo, useRef, useState } from 'react';
import SharedFooter from './SharedFooter';
import {
  DEFAULT_FOOTER_THEME,
  extractFooterThemeFromHtml,
  normalizeFooterTheme,
  resolveFooterThemeFromDom,
} from '../lib/footerTheme';

export default function PublicPageLayout({ children, footerThemeSourceHtml, footerThemeOverride }) {
  const contentRef = useRef(null);
  const sourceTheme = useMemo(() => (
    footerThemeOverride
      ? normalizeFooterTheme(footerThemeOverride)
      : extractFooterThemeFromHtml(footerThemeSourceHtml)
  ), [footerThemeOverride, footerThemeSourceHtml]);
  const [footerTheme, setFooterTheme] = useState(sourceTheme || DEFAULT_FOOTER_THEME);

  useEffect(() => {
    if (sourceTheme) {
      setFooterTheme(sourceTheme);
      return undefined;
    }

    const applyDomTheme = () => {
      setFooterTheme(normalizeFooterTheme(resolveFooterThemeFromDom(contentRef.current)));
    };

    applyDomTheme();
    const frameId = window.requestAnimationFrame(applyDomTheme);

    return () => window.cancelAnimationFrame(frameId);
  }, [children, sourceTheme]);

  return (
    <>
      <div ref={contentRef} className="public-page-layout__content" style={{ display: 'contents' }}>
        {children}
      </div>
      <SharedFooter theme={footerTheme} />
    </>
  );
}
