const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

test.describe('Blog markdown renderer', () => {
  test('parses raw HTML before sanitizing public blog content', async () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/components/blog/MarkdownRenderer.jsx'),
      'utf8'
    );

    expect(source).toContain("import rehypeRaw from 'rehype-raw';");
    expect(source).toMatch(/rehypePlugins=\{\[\s*rehypeRaw,\s*\[rehypeSanitize, customSchema\]/);
    expect(source).toContain("img: ['src', 'alt', 'title', 'width', 'height', 'loading']");
  });
});
