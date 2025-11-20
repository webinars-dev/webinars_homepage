import React from 'react';
import PageRenderer from '../../src/components/PageRenderer';
import pageHtml from '../pages/contact.html?raw';

const ContactPage = () => <PageRenderer html={pageHtml} />;

export default ContactPage;
