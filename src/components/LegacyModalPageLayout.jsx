import React, { useEffect, useRef } from 'react';

const isLegacyFooterSpacerRow = (node) => {
  if (!node?.matches?.('.wpb_row.vc_row-fluid.vc_row')) return false;
  if (!node.querySelector('.divider-wrap')) return false;

  const trimmedText = (node.textContent || '').replace(/\s+/g, '');
  const hasMeaningfulContent = Boolean(node.querySelector('h1, h2, h3, h4, h5, h6, p, img, a'));

  return !trimmedText && !hasMeaningfulContent;
};

const removeLegacyModalFooters = (root) => {
  if (!root) return;

  const footerSections = new Set();
  root.querySelectorAll('.footer_partner').forEach((node) => {
    const section = node.closest('.wpb_row.vc_row-fluid.vc_row.full-width-content')
      || node.closest('.wpb_row.vc_row-fluid.vc_row');
    if (section) {
      footerSections.add(section);
      return;
    }

    node.remove();
  });

  footerSections.forEach((section) => {
    const nextSibling = section.nextElementSibling;
    section.remove();

    if (isLegacyFooterSpacerRow(nextSibling)) {
      nextSibling.remove();
    }
  });

  root.querySelectorAll('#footer-outer, footer, .teldiv').forEach((node) => node.remove());
};

export default function LegacyModalPageLayout({ children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const cleanup = () => removeLegacyModalFooters(root);
    cleanup();

    const observer = new MutationObserver(() => cleanup());
    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="legacy-modal-page">
      {children}
    </div>
  );
}
