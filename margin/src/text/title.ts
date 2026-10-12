const MAX_TITLE = 80;

/** A document's title is its first non-empty line, minus Markdown decoration. */
export function deriveTitle(content: string): string {
  const firstLine = content.split('\n').find((line) => line.trim() !== '') ?? '';
  const title = firstLine
    .replace(/^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+[.)]\s+)/, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~#]+/g, '')
    .trim();
  if (!title) return 'Untitled';
  return title.length > MAX_TITLE ? `${title.slice(0, MAX_TITLE - 1).trimEnd()}…` : title;
}

/** A filename-safe version of `title`, without an extension. */
export function fileNameFor(title: string): string {
  const name = title
    .replace(/…$/, '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .slice(0, 80)
    .trim();
  return name || 'Untitled';
}

/** Make `name` unique among `taken` by appending " 2", " 3", … */
export function uniqueName(name: string, taken: Set<string>): string {
  let candidate = name;
  for (let n = 2; taken.has(candidate.toLowerCase()); n++) candidate = `${name} ${n}`;
  taken.add(candidate.toLowerCase());
  return candidate;
}
