import DOMPurify from 'dompurify';
import MarkdownIt, { type StateCore } from 'markdown-it';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

// Tag block elements with their source line so the preview can scroll alongside the editor.
md.core.ruler.push('source_lines', (state: StateCore) => {
  for (const token of state.tokens) {
    if (token.map && token.nesting >= 0 && token.type !== 'inline') {
      token.attrSet('data-line', String(token.map[0]));
    }
  }
});

// GitHub-style task lists: "- [ ] todo" and "- [x] done".
md.core.ruler.push('task_lists', (state: StateCore) => {
  const tokens = state.tokens;
  for (let i = 2; i < tokens.length; i++) {
    const inline = tokens[i];
    if (inline.type !== 'inline' || tokens[i - 2].type !== 'list_item_open') continue;
    const match = /^\[([ xX])\]\s/.exec(inline.content);
    const first = inline.children?.[0];
    if (!match || !first || first.type !== 'text') continue;
    first.content = first.content.slice(match[0].length);
    const checkbox = new state.Token('html_inline', '', 0);
    checkbox.content = `<input type="checkbox" disabled${match[1] === ' ' ? '' : ' checked'}> `;
    inline.children!.unshift(checkbox);
    tokens[i - 2].attrJoin('class', 'task');
  }
});

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Links open outside the app so you don't navigate away from your writing.
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/** Render Markdown to sanitised HTML. */
export function renderMarkdown(source: string): string {
  return DOMPurify.sanitize(md.render(source), { ADD_ATTR: ['target'] });
}
