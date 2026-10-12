// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './render';

describe('renderMarkdown', () => {
  it('renders Markdown with typographic quotes', () => {
    expect(renderMarkdown('# Hi\n\n"Quoted" *text*')).toContain('<em>text</em>');
    expect(renderMarkdown('"Quoted"')).toContain('“Quoted”');
  });

  it('tags blocks with their source line', () => {
    const html = renderMarkdown('# One\n\nTwo\n\n- three');
    expect(html).toContain('<h1 data-line="0">');
    expect(html).toContain('<p data-line="2">');
    expect(html).toContain('<ul data-line="4">');
  });

  it('removes scripts and event handlers', () => {
    const html = renderMarkdown('<script>alert(1)</script><img src="x" onerror="alert(1)">');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
  });

  it('opens links in a new tab', () => {
    expect(renderMarkdown('[a](https://example.com)')).toContain('target="_blank"');
  });

  it('renders task lists', () => {
    const html = renderMarkdown('- [ ] todo\n- [x] done');
    expect(html).toContain('<input type="checkbox" disabled=""> todo');
    expect(html).toContain('checked=""');
    expect(html).toContain('class="task"');
  });
});
