import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// ── Image analysis API (Anthropic Claude) ─────────────────────────────────────
// Proxies the Anthropic vision call server-side so VITE_ANTHROPIC_API_KEY stays
// out of the browser and CORS is never an issue.
// Frontend calls POST /api/analyze-image with { base64, mediaType }.
function analyzeImageApiPlugin(env) {
  return {
    name: 'analyze-image-api',
    configureServer(server) {
      server.middlewares.use('/api/analyze-image', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.writeHead(405).end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          res.writeHead(503).end(JSON.stringify({
            error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local.',
          }));
          return;
        }

        let body;
        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          body = JSON.parse(Buffer.concat(chunks).toString());
        } catch {
          res.writeHead(400).end(JSON.stringify({ error: 'Invalid JSON request body.' }));
          return;
        }

        const { base64, mediaType, prompt } = body;
        if (!base64 || !mediaType || !prompt) {
          res.writeHead(400).end(JSON.stringify({ error: 'base64, mediaType, and prompt are required.' }));
          return;
        }

        let anthropicRes;
        try {
          anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 1500,
              messages: [{
                role: 'user',
                content: [
                  { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
                  { type: 'text', text: prompt },
                ],
              }],
            }),
            signal: AbortSignal.timeout(30_000),
          });
        } catch (err) {
          console.error('[analyze-image] Anthropic network error:', err.message);
          res.writeHead(502).end(JSON.stringify({ error: 'Could not reach the Anthropic API.' }));
          return;
        }

        if (!anthropicRes.ok) {
          let detail = `HTTP ${anthropicRes.status}`;
          try { const b = await anthropicRes.json(); detail = b?.error?.message ?? detail; } catch { /* ignore */ }
          console.error('[analyze-image] Anthropic error:', detail);
          const is401 = anthropicRes.status === 401;
          const msg = is401
            ? `Invalid API key — if you just updated .env.local, restart the dev server (Vite loads env once at startup).`
            : `Image analysis failed: ${detail}`;
          res.writeHead(is401 ? 401 : anthropicRes.status >= 500 ? 502 : anthropicRes.status).end(JSON.stringify({ error: msg }));
          return;
        }

        const payload = await anthropicRes.json();
        res.writeHead(200).end(JSON.stringify(payload));
      });
    },
  };
}

// ── Nano Banana 2 / Gemini image-generation API ───────────────────────────────
// Runs as Vite dev-server middleware so GEMINI_API_KEY never reaches the browser.
// Frontend calls POST /api/generate-variant; this plugin handles it server-side.
function generateVariantApiPlugin(env) {
  return {
    name: 'generate-variant-api',
    configureServer(server) {
      server.middlewares.use('/api/generate-variant', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.writeHead(405).end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const apiKey = env.GEMINI_API_KEY;
        const model  = env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';

        if (!apiKey) {
          res.writeHead(503).end(JSON.stringify({
            error:
              'GEMINI_API_KEY is not configured. ' +
              'Add it to .env.local, or set VITE_USE_MOCK_NANO_BANANA=true ' +
              'in .env.local to use the development mock.',
          }));
          return;
        }

        // ── Parse request body ────────────────────────────────────────────────
        let body;
        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          body = JSON.parse(Buffer.concat(chunks).toString());
        } catch {
          res.writeHead(400).end(JSON.stringify({ error: 'Invalid JSON request body.' }));
          return;
        }

        const { sourceVariantId, sourceImageUrl, prompt, context = {} } = body;
        if (!sourceImageUrl || !prompt) {
          res.writeHead(400).end(JSON.stringify({ error: 'sourceImageUrl and prompt are required.' }));
          return;
        }

        // ── Resolve source image to base64 ────────────────────────────────────
        let imageBase64, imageMimeType;
        try {
          if (sourceImageUrl.startsWith('data:')) {
            // Already a data URL (iterative refinement — image was generated previously)
            const commaIdx = sourceImageUrl.indexOf(',');
            imageMimeType = sourceImageUrl.slice(5, sourceImageUrl.indexOf(';'));
            imageBase64   = sourceImageUrl.slice(commaIdx + 1);
          } else if (sourceImageUrl.startsWith('/')) {
            // Local public asset — read from disk
            const localPath = `${process.cwd()}/public${sourceImageUrl}`;
            const buf = fs.readFileSync(localPath);
            imageBase64   = buf.toString('base64');
            const ext     = localPath.split('.').pop().toLowerCase();
            imageMimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
          } else {
            // Remote URL — fetch and convert
            const imgRes = await fetch(sourceImageUrl, { signal: AbortSignal.timeout(10_000) });
            if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
            const buf = await imgRes.arrayBuffer();
            imageBase64   = Buffer.from(buf).toString('base64');
            imageMimeType = (imgRes.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
          }
        } catch (err) {
          console.error('[generate-variant] Failed to load source image:', err.message);
          res.writeHead(400).end(JSON.stringify({
            error: 'Could not load the source image. Check that the image URL is publicly accessible.',
          }));
          return;
        }

        // ── Build creative-direction prompt ───────────────────────────────────
        const axisLabel  = context.sourceAxis || '300×250';
        const geminiPrompt =
          `You are an ad creative editor. This is a ${axisLabel} display advertisement background image. ` +
          `Apply the following creative direction to it: "${prompt}". ` +
          `Maintain the same photographic style and composition; only apply the requested change. ` +
          `Return the edited image and nothing else.`;

        // ── Call Gemini generateContent ───────────────────────────────────────
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        let geminiRes;
        try {
          geminiRes = await fetch(geminiUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
                  { text: geminiPrompt },
                ],
              }],
              generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
            }),
            signal: AbortSignal.timeout(60_000),
          });
        } catch (err) {
          console.error('[generate-variant] Gemini network error:', err.message);
          res.writeHead(502).end(JSON.stringify({
            error: 'Could not reach the Gemini API. Check your network connection and try again.',
          }));
          return;
        }

        if (!geminiRes.ok) {
          const raw = await geminiRes.text().catch(() => '');
          console.error(`[generate-variant] Gemini ${geminiRes.status}:`, raw);
          if (geminiRes.status === 429) {
            res.writeHead(429).end(JSON.stringify({ error: 'Rate limit reached — please wait a moment and try again.' }));
          } else if (geminiRes.status === 401 || geminiRes.status === 403) {
            res.writeHead(503).end(JSON.stringify({ error: 'Invalid or unauthorized GEMINI_API_KEY.' }));
          } else {
            res.writeHead(502).end(JSON.stringify({ error: `Gemini API error (${geminiRes.status}). Try again or adjust your prompt.` }));
          }
          return;
        }

        // ── Extract generated image ───────────────────────────────────────────
        let geminiData;
        try {
          geminiData = await geminiRes.json();
        } catch {
          res.writeHead(502).end(JSON.stringify({ error: 'Malformed response from Gemini API.' }));
          return;
        }

        const parts     = geminiData?.candidates?.[0]?.content?.parts ?? [];
        const imgPart   = parts.find(p => p.inlineData ?? p.inline_data);
        const inlineData = imgPart?.inlineData ?? imgPart?.inline_data;

        if (!inlineData?.data) {
          console.error('[generate-variant] No image in Gemini response:', JSON.stringify(geminiData).slice(0, 500));
          res.writeHead(502).end(JSON.stringify({
            error: 'Gemini did not return an image for this prompt. Try rephrasing your feedback.',
          }));
          return;
        }

        const generatedImageUrl = `data:${inlineData.mimeType ?? inlineData.mime_type};base64,${inlineData.data}`;
        const variantId         = `nb2-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        res.writeHead(200).end(JSON.stringify({
          variantId,
          imageUrl:         generatedImageUrl,
          sourceVariantId,
          generationPrompt: prompt,
          createdFromFeedback: true,
        }));
      });
    },
  };
}

// ── Advertisers API — reads from Postgres public.advertisers ─────────────────
function advertisersApiPlugin(env) {
  return {
    name: 'advertisers-api',
    configureServer(server) {
      // Build IAB code → label map once at server start
      let iabMap = {};
      try {
        const raw = JSON.parse(fs.readFileSync('./src/data/iab-categories.json', 'utf8'));
        for (const cat of raw.iab.iab_categories) {
          iabMap[cat.code] = cat.label;
          for (const sub of cat.subcategories ?? []) iabMap[sub.code] = sub.label;
        }
      } catch {}

      server.middlewares.use('/api/advertisers', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method !== 'GET') {
          res.writeHead(405).end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        const connStr = env.READ_ONLY_DATABASE_URL;
        if (!connStr) {
          res.writeHead(503).end(JSON.stringify({ error: 'READ_ONLY_DATABASE_URL not configured' }));
          return;
        }
        try {
          const { Pool } = await import('pg');
          const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false }, max: 2 });
          const { rows } = await pool.query(
            `SELECT advertiser_id AS id, name, domain, logo_url, category
             FROM public.advertisers
             WHERE status = 'active'
               AND logo_url IS NOT NULL
               AND logo_url != ''
               AND name NOT IN ('Default Advertiser', 'Test Advertiser')
             ORDER BY name ASC`
          );
          await pool.end();
          const advertisers = rows.map(r => {
            let cats = [];
            try { cats = typeof r.category === 'string' ? JSON.parse(r.category) : (r.category ?? []); } catch {}
            const rawCat = cats[0] ?? '';
            return { id: r.id, name: r.name, domain: r.domain, logoUrl: r.logo_url || null, category: iabMap[rawCat] ?? rawCat };
          });
          res.writeHead(200).end(JSON.stringify({ advertisers }));
        } catch (err) {
          console.error('[advertisers-api]', err.message);
          res.writeHead(500).end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), analyzeImageApiPlugin(env), generateVariantApiPlugin(env), advertisersApiPlugin(env)],
  }
})
