/**
 * Nano Banana 2 — variant regeneration from operator feedback.
 *
 * When VITE_USE_MOCK_NANO_BANANA=true the local mock runs (picks a different
 * static image from the same IAB axis pool with a fake delay). Otherwise the
 * request is forwarded to the Vite dev-server middleware at /api/generate-variant,
 * which calls the real Gemini image-generation API server-side.
 *
 * Request shape:
 *   { sourceVariantId, sourceImageUrl, prompt, context: {
 *       pageId, campaignId, selectedChangeType, brandConstraints, sourceAxis } }
 *
 * Response shape:
 *   { variantId, imageUrl, sourceVariantId, generationPrompt, createdFromFeedback: true }
 */

import { IMAGE_POOLS } from '../data/variants';
import { DEMO_MODE, demoDelay } from './demoMode';

// ── Development mock (VITE_USE_MOCK_NANO_BANANA=true) ────────────────────────
let _mockId = 20000;

async function mockGenerateVariant(request, signal) {
  const { sourceVariantId, sourceImageUrl, prompt, context = {} } = request;
  const { sourceAxis = '300×250' } = context;

  const delay = DEMO_MODE ? 900 + Math.random() * 500 : 2000 + Math.random() * 1500;
  await demoDelay(delay, signal);

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const pool       = IMAGE_POOLS[sourceAxis] ?? [];
  const candidates = pool.filter(img => img.file !== sourceImageUrl);
  const img        = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
  if (!img) throw new Error('No alternative image available for this format.');

  return {
    variantId:          String(++_mockId),
    imageUrl:           img.file,
    sourceVariantId,
    generationPrompt:   prompt,
    createdFromFeedback: true,
  };
}

// ── Real API call (Gemini, via Vite middleware) ───────────────────────────────
async function realGenerateVariant(request, signal) {
  let response;
  try {
    response = await fetch('/api/generate-variant', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(request),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Network error — could not reach the generation API.', { cause: err });
  }

  if (!response.ok) {
    let message = `Generation failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.error) message = body.error;
    } catch { /* ignore parse error */ }
    throw new Error(message);
  }

  return response.json();
}

// ── Public entry point ────────────────────────────────────────────────────────
export function generateVariant(request, signal) {
  if (DEMO_MODE || import.meta.env.VITE_USE_MOCK_NANO_BANANA === 'true') {
    return mockGenerateVariant(request, signal);
  }
  return realGenerateVariant(request, signal);
}
