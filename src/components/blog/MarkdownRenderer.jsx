import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

// XSS 방지를 위한 커스텀 스키마
const ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'www.slideshare.net',
];

const customSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'iframe'],
  attributes: {
    ...defaultSchema.attributes,
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    a: ['href', 'title', 'target', 'rel'],
    code: ['className'],
    iframe: [
      'src',
      'width',
      'height',
      'title',
      'frameBorder',
      'allowFullScreen',
      'allow',
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ['https'],
  },
};

// iframe src 검증 컴포넌트
const validateIframeSrc = (src) => {
  if (!src) return false;
  try {
    const url = new URL(src);
    return ALLOWED_IFRAME_HOSTS.includes(url.host);
  } catch {
    return false;
  }
};

// 커스텀 컴포넌트
const components = {
  // iframe 검증
  iframe: ({ node, ...props }) => {
    if (!validateIframeSrc(props.src)) {
      return null;
    }
    return (
      <div className="markdown-iframe-container">
        <iframe
          {...props}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </div>
    );
  },

  // 이미지에 lazy loading 추가
  img: ({ node, ...props }) => (
    <img {...props} loading="lazy" className="markdown-image" />
  ),

  // 외부 링크에 target="_blank" 추가
  a: ({ node, children, ...props }) => {
    const isExternal =
      props.href?.startsWith('http') && !props.href?.includes('webinars.co.kr');

    return (
      <a
        {...props}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    );
  },

  // 코드 블록 스타일링
  pre: ({ node, children, ...props }) => (
    <pre className="markdown-code-block" {...props}>
      {children}
    </pre>
  ),

  // 인라인 코드 스타일링
  code: ({ node, inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code className="markdown-inline-code" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },

  // 테이블 래퍼
  table: ({ node, children, ...props }) => (
    <div className="markdown-table-container">
      <table {...props}>{children}</table>
    </div>
  ),
};

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="markdown-content">
      <ReactMarkdown
        rehypePlugins={[
          rehypeSlug,
          rehypeHighlight,
          [rehypeSanitize, customSchema],
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>

      <style>{`
        .markdown-content {
          font-size: 16px;
          line-height: 1.8;
          color: #333;
        }

        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          margin-top: 32px;
          margin-bottom: 16px;
          font-weight: 700;
          line-height: 1.4;
        }

        .markdown-content h1 { font-size: 28px; }
        .markdown-content h2 { font-size: 24px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
        .markdown-content h3 { font-size: 20px; }
        .markdown-content h4 { font-size: 18px; }

        .markdown-content p {
          margin: 16px 0;
        }

        .markdown-content ul,
        .markdown-content ol {
          margin: 16px 0;
          padding-left: 24px;
        }

        .markdown-content li {
          margin: 8px 0;
        }

        .markdown-content blockquote {
          margin: 24px 0;
          padding: 16px 24px;
          border-left: 4px solid #0066cc;
          background: #f8f9fa;
          font-style: italic;
        }

        .markdown-content blockquote p {
          margin: 0;
        }

        .markdown-image {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 24px 0;
        }

        .markdown-iframe-container {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          margin: 24px 0;
          border-radius: 8px;
        }

        .markdown-iframe-container iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .markdown-code-block {
          margin: 24px 0;
          padding: 16px;
          background: #1e1e1e;
          border-radius: 8px;
          overflow-x: auto;
        }

        .markdown-code-block code {
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.5;
        }

        .markdown-inline-code {
          padding: 2px 6px;
          background: #f0f0f0;
          border-radius: 4px;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 0.9em;
          color: #d63384;
        }

        .markdown-table-container {
          overflow-x: auto;
          margin: 24px 0;
        }

        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
        }

        .markdown-content th,
        .markdown-content td {
          padding: 12px;
          border: 1px solid #ddd;
          text-align: left;
        }

        .markdown-content th {
          background: #f5f5f5;
          font-weight: 600;
        }

        .markdown-content tr:nth-child(even) {
          background: #fafafa;
        }

        .markdown-content hr {
          margin: 32px 0;
          border: none;
          border-top: 1px solid #eee;
        }

        .markdown-content a {
          color: #0066cc;
          text-decoration: none;
        }

        .markdown-content a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
