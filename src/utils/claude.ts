import type { SearchResult } from '../types';

export async function getClaudeAnswer(
  query: string,
  results: SearchResult[]
): Promise<string | null> {
  // Build context from top results
  const context = results
    .slice(0, 5)
    .map((r) => {
      const topMoments = r.momentScores
        .slice(0, 3)
        .map((ms) => `  - [${ms.moment.timestamp}] ${ms.moment.text}`)
        .join('\n');
      return `Meeting: ${r.meeting.title} (${r.meeting.date})\nParticipants: ${r.meeting.participants.join(', ')}\nKey moments:\n${topMoments}`;
    })
    .join('\n\n---\n\n');

  try {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context }),
    });

    const data = await res.json();

    if (data.error === 'no_api_key') {
      return null; // Fall back to pre-baked answers
    }

    return data.answer || null;
  } catch {
    return null; // Fall back to pre-baked answers
  }
}
