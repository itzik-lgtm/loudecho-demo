/**
 * Image analysis using claude-haiku-4-5 (vision).
 *
 * Why not Florence-2?
 *   Microsoft Florence-2 (MIT) is preferred for open-source use, but its
 *   HuggingFace Serverless Inference endpoint has 20–60 s cold starts and is
 *   unreliable for live demos. To swap it in:
 *     1. Set VITE_HF_TOKEN in .env.local
 *     2. POST to https://api-inference.huggingface.co/models/microsoft/Florence-2-large
 *     3. Map the plain-text caption to the AnalysisResult shape below
 *
 * Configuration (add to .env.local):
 *   ANTHROPIC_API_KEY=sk-ant-...
 */

import { DEMO_MODE, demoDelay } from './demoMode';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export const CHANGE_TYPES = [
  'Tagline',
  'Background swap',
  'Product',
  'Character',
  'Composition/layout',
  'Color palette',
  'CTA',
];

export const SIGNAL_TYPES = [
  'Contextual',
  'Audience',
  'User journey',
  'Geo / location',
  'Time / calendar',
  'Weather',
  'Device',
  'Product / catalog',
  'External data',
];

/** Validate a File before sending it to the API. Throws a user-friendly Error. */
export function validateFile(file) {
  if (!file) throw new Error('No file selected.');
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error(
      `Unsupported file type "${file.type}". Please upload a JPEG, PNG, GIF, or WebP image.`,
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error('File is too large. Maximum supported size is 20 MB.');
  }
}

/** Read a File as a base64 string (no data-URL prefix). */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

function buildPrompt(brief) {
  return `Analyze this ad creative image alongside the campaign brief below. Respond with valid JSON only — no markdown fences, no prose outside the object.

Campaign brief: "${brief}"

{
  "summary": "one-sentence description of the scene and its advertising context",
  "objects": ["up to 6 key objects or visual elements present"],
  "text": ["each piece of readable text visible in the image; empty array if none"],
  "dominantColors": ["top 3 colors as hex codes where possible, e.g. '#1a2b3c', or descriptive names like 'warm beige'"],
  "backgroundType": "<one of: indoor | outdoor | studio | lifestyle | abstract | product-flat>",
  "mood": "one or two descriptive words, e.g. 'aspirational, minimal' or 'urgent, bold'",
  "compositionQuality": "one sentence assessing visual hierarchy, balance, and crowding",
  "characters": "describe any people or mascots present (age range, gender presentation, style); use null if none",
  "logoPresent": true,
  "logoSize": "<one of: large | medium | small | absent>",
  "logoPlacement": "<one of: top-left | top-right | bottom-left | bottom-right | bottom-center | watermark | other | absent>",
  "copySentiment": "<one of: positive | negative | neutral | urgent | absent>",
  "copyLength": "<one of: concise | appropriate | too long | absent>",
  "copyReadingLevel": "<one of: simple | moderate | complex | absent>",
  "weakSpots": ["up to 3 specific, actionable issues, e.g. 'CTA text is too small to read at display size'"],
  "recommendedSignalTypes": [
    { "type": "<one of the signal types listed below>", "reason": "one sentence tying this signal to the brief or image" }
  ],
  "recommendedChangeTypes": ["<2–3 change types from the list below, most impactful first>"]
}

Valid signal types (pick 2–3 most relevant based on the image AND the campaign brief):
- "Contextual" → adapt creative to the surrounding content/page context
- "Audience" → target by demographic, firmographic, or behavioral segment
- "User journey" → vary creative by funnel stage or prior ad exposure
- "Geo / location" → localize creative to region, city, or market
- "Time / calendar" → adapt to time of day, day of week, or seasonal moment
- "Weather" → react to current weather conditions at impression time
- "Device" → optimize for device type, OS, or browser
- "Product / catalog" → personalize with dynamic product or pricing data
- "External data" → react to live events, sports scores, market data, etc.

Valid change types (pick 2–3 most impactful for this specific creative):
- "Background swap" → background is dominant, cluttered, distracting, or mismatched
- "Tagline" → message is weak, generic, or absent
- "Product" → brand identity or hero product is absent, small, or poorly placed
- "Character" → a person or mascot is central and could be varied for audience targeting
- "Composition/layout" → composition is crowded, unbalanced, or key elements compete
- "Color palette" → colors are dull, inconsistent, visually chaotic, or off-brand
- "CTA" → creative lacks a clear call-to-action text or button`;
}

/**
 * Analyze an image file and recommend signal types and change types.
 *
 * @param {File}        file   - The image file to analyze.
 * @param {string}      brief  - The campaign brief text (used for signal type recommendations).
 * @param {AbortSignal} signal - Cancel token; stale results are discarded.
 * @returns {Promise<AnalysisResult>}
 */
export async function analyzeImage(file, brief, signal) {
  validateFile(file);

  // Demo mode (default): skip the live Claude call and return a scripted analysis.
  if (DEMO_MODE || import.meta.env.VITE_USE_MOCK_ANALYZE === 'true') {
    await demoDelay(DEMO_MODE ? 2000 : 2200, signal);
    return {
      summary: 'Bold, high-contrast creative with a clear focal subject and strong brand presence. Tagline is short and punchy; composition leaves room for contextual background variation.',
      objects: ['hero subject', 'wordmark', 'background'],
      text: ['Primary tagline', 'CTA'],
      dominantColors: ['#0a0a0a', '#C8FF00', '#ffffff'],
      backgroundType: 'photographic',
      mood: 'bold, energetic',
      compositionQuality: 'Strong focal hierarchy; wordmark clearly visible.',
      characters: null,
      logoPresent: true,
      logoSize: 'medium',
      logoPlacement: 'corner',
      copySentiment: 'bold',
      copyLength: 'short',
      copyReadingLevel: 'accessible',
      weakSpots: ['Background is static — limits contextual relevance across verticals'],
      recommendedSignalTypes: [
        { type: 'Contextual', reason: 'Adapts creative to the surrounding page content — always relevant for display advertising.' },
        { type: 'Audience',   reason: 'Different cohorts respond to different value props; messaging can flex by segment.' },
      ],
      recommendedChangeTypes: ['Tagline', 'Background swap'],
    };
  }

  const base64 = await fileToBase64(file);
  const prompt = buildPrompt(brief || '');

  let response;
  try {
    response = await fetch('/api/analyze-image', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, mediaType: file.type, prompt }),
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Network error — could not reach the analysis API.', { cause: err });
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body?.error ?? detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  const payload = await response.json();
  const raw = payload.content?.[0]?.text?.trim() ?? '';

  // Extract JSON even if the model accidentally wrapped it in fences
  const jsonStr = raw.startsWith('{')
    ? raw
    : (raw.match(/\{[\s\S]*\}/)?.[0] ?? '');

  if (!jsonStr) throw new Error('Received an empty or unreadable response from the API.');

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Could not parse analysis response. Try uploading the image again.');
  }

  // Sanitize recommendedSignalTypes
  if (!Array.isArray(parsed.recommendedSignalTypes)) {
    parsed.recommendedSignalTypes = [];
  } else {
    parsed.recommendedSignalTypes = parsed.recommendedSignalTypes
      .filter(s => s && SIGNAL_TYPES.includes(s.type))
      .slice(0, 3);
  }

  // Sanitize recommendedChangeTypes
  if (!Array.isArray(parsed.recommendedChangeTypes)) {
    parsed.recommendedChangeTypes = [];
  } else {
    parsed.recommendedChangeTypes = parsed.recommendedChangeTypes
      .filter(ct => CHANGE_TYPES.includes(ct))
      .slice(0, 3);
  }

  return parsed;
}
