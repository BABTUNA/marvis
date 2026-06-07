import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

function claudeProxy(): Plugin {
  return {
    name: 'claude-proxy',
    configureServer(server) {
      server.middlewares.use('/api/claude', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'no_api_key', answer: '' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { query, context } = JSON.parse(body);

            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-haiku-4-5',
                max_tokens: 256,
                system: [
                  {
                    type: 'text',
                    text: `You are Orrery, an AI assistant that synthesizes insights across meeting transcripts. Answer in 1-2 concise sentences. Be specific — cite names, numbers, dates when available. If the answer spans multiple meetings, say so. Never hedge with "it seems" — be direct.`,
                    cache_control: { type: 'ephemeral' },
                  }
                ],
                messages: [
                  {
                    role: 'user',
                    content: `Based on these meeting excerpts, answer the question.\n\nQuestion: ${query}\n\nMeeting excerpts:\n${context}`,
                  }
                ],
              }),
            });

            const data = await response.json() as any;
            const answer = data.content?.[0]?.text || '';

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ answer }));
          } catch (err: any) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message, answer: '' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), claudeProxy()],
})
