import React from 'react';
import PageRenderer from '../../src/components/PageRenderer';
import PublicPageLayout from '../../src/components/PublicPageLayout';
import pageHtml from '../pages/index.html?raw';

const IndexPage = () => (
  <PublicPageLayout footerThemeSourceHtml={pageHtml}>
    <PageRenderer html={pageHtml} stripLegacyFooter />
  </PublicPageLayout>
);

export default IndexPage;
