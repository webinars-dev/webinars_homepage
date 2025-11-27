import React from 'react';
import PageRenderer from '../../src/components/PageRenderer';

const html = `
<div class="page-container">
    <div class="content-wrap">
        <h1>Webinar Live Streaming #10</h1>
        <div class="page-content">
            <p>This content is displayed in a modal popup.</p>
        </div>
    </div>
</div>
`;

const WebinarLiveStreaming10Page = () => {
    return <PageRenderer html={html} />;
};

export default WebinarLiveStreaming10Page;