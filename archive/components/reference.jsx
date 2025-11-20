import React from 'react';
import PageRenderer from '../../src/components/PageRenderer';
import pageHtml from '../pages/reference.html?raw';

const ReferencePage = () => <PageRenderer html={pageHtml} />;

export default ReferencePage;
