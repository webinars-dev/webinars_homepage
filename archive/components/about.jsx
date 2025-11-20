import React from 'react';
import PageRenderer from '../../src/components/PageRenderer';
import pageHtml from '../pages/about.html?raw';

const AboutPage = () => <PageRenderer html={pageHtml} />;

export default AboutPage;
