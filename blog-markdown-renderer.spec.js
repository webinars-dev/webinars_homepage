const fs = require('fs');
const path = require('path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { test, expect } = require('@playwright/test');

test.describe('Blog markdown renderer', () => {
  test('parses raw HTML before sanitizing public blog content', async () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/components/blog/MarkdownRenderer.jsx'),
      'utf8'
    );

    expect(source).toContain("import rehypeRaw from 'rehype-raw';");
    expect(source).toMatch(
      /rehypePlugins=\{\[\s*rehypeRaw,\s*preserveSafeInlineStyles,\s*\[rehypeSanitize, customSchema\]/
    );
    expect(source).toContain("'display'");
    expect(source).toContain("'width'");
  });

  test('preserves safe image layout styles from editor HTML', async () => {
    const { createServer } = await import('vite');
    const server = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'silent',
    });

    try {
      const { default: MarkdownRenderer } = await server.ssrLoadModule(
        '/src/components/blog/MarkdownRenderer.jsx'
      );
      const html = renderToStaticMarkup(
        React.createElement(MarkdownRenderer, {
          content: `
<div style="display:flex; gap:16px; justify-content:space-between; align-items:flex-start;">
  <div style="width:33%; text-align:center;">
    <img src="https://example.com/a.png" style="width:100%; height:auto;">
  </div>
</div>
<img src="https://example.com/b.png" style="max-width:600px; width:100%; height:auto; background-image:url(https://bad.example/a.png);">
`,
        })
      );

      expect(html).toContain(
        'style="display:flex;gap:16px;justify-content:space-between;align-items:flex-start"'
      );
      expect(html).toContain('style="width:33%;text-align:center"');
      expect(html).toContain('style="width:100%;height:auto"');
      expect(html).toContain('style="max-width:600px;width:100%;height:auto"');
      expect(html).not.toContain('background-image');
    } finally {
      await server.close();
    }
  });
});
