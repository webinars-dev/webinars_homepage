import React from 'react';
import PageRenderer from '../../src/components/PageRenderer';

const html = `
<div class="page-container">
    <div class="content-wrap">
        <h1>2024 Offline Event #7</h1>
        <div class="page-content">
            <p>This content is displayed in a modal popup.</p>
        </div>
    </div>
</div>
`;

const Webinar2024Offline7Page = () => {
    return <PageRenderer html={html} />;
};

export default Webinar2024Offline7Page;