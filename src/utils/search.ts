import type { Meeting, MeetingsData, SearchResult } from '../types';

const stopwords = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'from', 'they',
  'this', 'that', 'with', 'will', 'each', 'make', 'like', 'just', 'over',
  'such', 'than', 'them', 'very', 'some', 'what', 'about', 'which', 'when',
  'would', 'there', 'their', 'said', 'into', 'also', 'more', 'other', 'then',
  'these', 'could', 'only', 'after', 'those', 'being', 'most', 'where',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export class SearchEngine {
  private vocab: Record<string, number>;
  private idf: Record<string, number>;
  private meetings: Meeting[];
  private vecDim: number;

  constructor(data: MeetingsData) {
    this.vocab = data.vocab;
    this.idf = data.idf;
    this.meetings = data.meetings;
    this.vecDim = data.meta.vectorDim;
  }

  embedQuery(query: string): number[] {
    const tokens = tokenize(query);
    const tf: Record<string, number> = {};
    for (const t of tokens) {
      if (this.vocab[t] !== undefined) {
        tf[t] = (tf[t] || 0) + 1;
      }
    }

    const vec = new Array(this.vecDim).fill(0);
    const maxTf = Math.max(...Object.values(tf), 1);

    for (const [word, count] of Object.entries(tf)) {
      const idx = this.vocab[word];
      const normalizedTf = 0.5 + 0.5 * (count / maxTf);
      const idfVal = this.idf[word] || 0;
      vec[idx] = normalizedTf * idfVal;
    }

    const norm = Math.sqrt(vec.reduce((s: number, v: number) => s + v * v, 0)) || 1;
    return vec.map((v: number) => v / norm);
  }

  search(query: string, topK = 20): SearchResult[] {
    if (!query.trim()) return [];

    const qVec = this.embedQuery(query);

    const results: SearchResult[] = this.meetings.map((meeting) => {
      const score = cosine(qVec, meeting.vector);
      const momentScores = meeting.moments
        .map((moment) => ({
          moment,
          score: cosine(qVec, moment.vector),
        }))
        .sort((a, b) => b.score - a.score);

      return { meeting, score, momentScores };
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  getMeetings(): Meeting[] {
    return this.meetings;
  }
}
