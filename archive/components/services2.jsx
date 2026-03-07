import React from 'react';
import PageRenderer from '../../src/components/PageRenderer';
import PublicPageLayout from '../../src/components/PublicPageLayout';
import pageHtml from '../pages/services2.html?raw';

const Services2Page = () => (
  <PublicPageLayout footerThemeSourceHtml={pageHtml}>
    <PageRenderer html={pageHtml} stripLegacyFooter />
  </PublicPageLayout>
);

export default Services2Page;
