import React, { useEffect } from 'react';
import PageRenderer from './PageRenderer';
import pageHtml from '../../archive/pages/thank-you.html?raw';

const NAVER_WCS_SCRIPT_ID = 'naver-wcslog-script';
const NAVER_WCS_SRC = '//wcs.naver.net/wcslog.js';
const NAVER_WA_ID = 's_23a1cf30b639';
const NAVER_CONVERSION_TYPE = 'custom001';

const loadNaverWcsScript = () =>
  new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    if (window.wcs) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(NAVER_WCS_SCRIPT_ID)
      || document.querySelector('script[src*="wcslog.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', resolve, { once: true });
      setTimeout(resolve, 1500);
      return;
    }

    const script = document.createElement('script');
    script.id = NAVER_WCS_SCRIPT_ID;
    script.type = 'text/javascript';
    script.src = NAVER_WCS_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = resolve;
    document.head.appendChild(script);
  });

const trackNaverCustomConversion = () => {
  if (typeof window === 'undefined' || !window.wcs) return;

  window.wcs_add = window.wcs_add || {};
  window.wcs_add.wa = NAVER_WA_ID;
  window.wcs.trans({ type: NAVER_CONVERSION_TYPE });
};

const ContactThankYou = () => {
  useEffect(() => {
    let cancelled = false;

    loadNaverWcsScript().then(() => {
      if (!cancelled) {
        trackNaverCustomConversion();
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return <PageRenderer html={pageHtml} />;
};

export default ContactThankYou;
