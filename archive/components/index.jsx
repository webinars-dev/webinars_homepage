import React from 'react';
import PageRenderer from '../../src/components/PageRenderer';
import pageHtml from '../pages/index.html?raw';

const IndexPage = () => <PageRenderer html={pageHtml} />;

export default IndexPage;
