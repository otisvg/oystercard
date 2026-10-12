export type StyleKind = 'filler' | 'cliche' | 'redundancy' | 'repetition';

export interface StyleIssue {
  from: number;
  to: number;
  kind: StyleKind;
  message: string;
}

export type StyleKinds = Record<StyleKind, boolean>;

export const STYLE_LABELS: Record<StyleKind, string> = {
  filler: 'Filler words',
  cliche: 'Clichés',
  redundancy: 'Redundancies',
  repetition: 'Repeated words',
};

const FILLERS = [
  'very', 'really', 'just', 'actually', 'basically', 'literally', 'quite', 'rather', 'somewhat',
  'totally', 'simply', 'certainly', 'definitely', 'extremely', 'honestly', 'obviously',
  'seriously', 'truly', 'kind of', 'sort of', 'a bit', 'a little bit', 'I think', 'I believe',
  'I feel like', 'in my opinion', 'needless to say', 'it goes without saying', 'to be honest',
  'that being said', 'for all intents and purposes', 'as a matter of fact',
];

const CLICHES = [
  'at the end of the day', 'avoid like the plague', 'think outside the box', 'low-hanging fruit',
  'last but not least', 'only time will tell', 'in the nick of time', 'a perfect storm',
  'game changer', 'move the needle', 'at the drop of a hat', 'few and far between',
  'easier said than done', 'every cloud has a silver lining', 'all walks of life',
  'better late than never', 'crystal clear', 'a blessing in disguise', 'read between the lines',
  'tip of the iceberg', 'when all is said and done', 'it is what it is', 'hit the ground running',
  'par for the course', 'push the envelope', 'on the same page', 'paradigm shift',
  'best of both worlds', 'back to square one', 'the elephant in the room', 'needle in a haystack',
  'in this day and age', 'calm before the storm', 'cool as a cucumber', 'the writing on the wall',
  'a level playing field', 'take it to the next level', 'touch base', 'circle back',
  'it\'s not rocket science', 'what goes around comes around', 'time will tell',
];

// Phrase → the shorter phrasing it should become.
const REDUNDANCIES: Record<string, string> = {
  'absolutely essential': 'essential',
  'added bonus': 'bonus',
  'advance planning': 'planning',
  'advance warning': 'warning',
  'basic fundamentals': 'fundamentals',
  'close proximity': 'proximity',
  'collaborate together': 'collaborate',
  'completely finished': 'finished',
  'completely unanimous': 'unanimous',
  'due to the fact that': 'because',
  'each and every': 'each',
  'end result': 'result',
  'final outcome': 'outcome',
  'first and foremost': 'first',
  'for the purpose of': 'to',
  'free gift': 'gift',
  'future plans': 'plans',
  'general consensus': 'consensus',
  'in order to': 'to',
  'in spite of the fact that': 'although',
  'at this point in time': 'now',
  'join together': 'join',
  'merge together': 'merge',
  'new innovation': 'innovation',
  'past experience': 'experience',
  'past history': 'history',
  'plan ahead': 'plan',
  'postpone until later': 'postpone',
  'refer back': 'refer',
  'repeat again': 'repeat',
  'return back': 'return',
  'revert back': 'revert',
  'still remains': 'remains',
  'sum total': 'total',
  'the reason why is because': 'because',
  'true facts': 'facts',
  'unexpected surprise': 'surprise',
  'very unique': 'unique',
  'ATM machine': 'ATM',
  'PIN number': 'PIN',
};

// Doubles that are often correct English.
const ALLOWED_REPEATS = new Set(['had', 'that', 'is', 'do', 'bye', 'no', 'ha']);

const WORD_CHAR = "[\\p{L}\\p{N}'’-]";

function phrasePattern(phrases: string[]): RegExp {
  const alternatives = [...phrases]
    .sort((a, b) => b.length - a.length)
    .map((phrase) =>
      phrase
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/['’]/g, "['’]")
        .replace(/-/g, '[-\\s]')
        .replace(/ /g, '\\s+'),
    );
  return new RegExp(`(?<!${WORD_CHAR})(?:${alternatives.join('|')})(?!${WORD_CHAR})`, 'giu');
}

const PATTERNS = {
  filler: phrasePattern(FILLERS),
  cliche: phrasePattern(CLICHES),
  redundancy: phrasePattern(Object.keys(REDUNDANCIES)),
};

const REDUNDANCY_FIX = new Map(
  Object.entries(REDUNDANCIES).map(([phrase, fix]) => [phrase.toLowerCase(), fix]),
);

const REPEAT = /(?<![\p{L}\p{N}'’])([\p{L}\p{N}'’]+)\s+\1(?![\p{L}\p{N}'’])/giu;

function messageFor(kind: Exclude<StyleKind, 'repetition'>, phrase: string): string {
  switch (kind) {
    case 'filler':
      return `Filler: “${phrase}” can usually go.`;
    case 'cliche':
      return `Cliché: “${phrase}”. Say it your own way.`;
    case 'redundancy': {
      const fix = REDUNDANCY_FIX.get(phrase.toLowerCase().replace(/\s+/g, ' '));
      return `Redundant: try “${fix}”.`;
    }
  }
}

/** Style issues in `text`, sorted by position, with overlaps resolved in favour of longer phrases. */
export function findStyleIssues(text: string, kinds: StyleKinds): StyleIssue[] {
  const found: StyleIssue[] = [];

  for (const kind of ['cliche', 'redundancy', 'filler'] as const) {
    if (!kinds[kind]) continue;
    for (const match of text.matchAll(PATTERNS[kind])) {
      found.push({
        from: match.index,
        to: match.index + match[0].length,
        kind,
        message: messageFor(kind, match[0]),
      });
    }
  }

  if (kinds.repetition) {
    for (const match of text.matchAll(REPEAT)) {
      if (ALLOWED_REPEATS.has(match[1].toLowerCase())) continue;
      found.push({
        from: match.index,
        to: match.index + match[0].length,
        kind: 'repetition',
        message: `Repeated word: “${match[1]}”.`,
      });
    }
  }

  found.sort((a, b) => a.from - b.from || b.to - b.from - (a.to - a.from));
  const issues: StyleIssue[] = [];
  for (const issue of found) {
    const last = issues.at(-1);
    if (last && issue.from < last.to) continue;
    issues.push(issue);
  }
  return issues;
}
