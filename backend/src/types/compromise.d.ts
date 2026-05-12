declare module 'compromise' {
  interface Doc {
    match: (match: string) => Doc;
    has: (match: string) => boolean;
    if: (match: string) => Doc;
    notIf: (match: string) => Doc;
    splitOn: (match: string) => Doc;
    before: (match: string) => Doc;
    after: (match: string) => Doc;
    lookAhead: (match: string) => Doc;
    groups: (group: string) => Doc;
    text: () => string;
    terms: () => Term[];
    nouns: () => Doc;
    verbs: () => Doc;
    adjectives: () => Doc;
    numbers: () => Doc;
    sentences: () => Doc;
    json: () => Array<{ text: string; terms?: Term[] }>;
    length: number;
    found: boolean;
    wordCount: () => number;
    normalize: () => Doc;
    compute: (method: string) => Doc;
    sort: (method: string) => Doc;
  }

  interface Term {
    text: string;
    normal: string;
    tags: Set<string>;
  }

  interface NlpResult {
    (text: string): Doc;
    extend: (plugin: Record<string, unknown>) => void;
    world: Record<string, unknown>;
    model: Record<string, unknown>;
    methods: Record<string, unknown>;
    hooks: Record<string, unknown>;
  }

  const nlp: NlpResult;
  export default nlp;
}
