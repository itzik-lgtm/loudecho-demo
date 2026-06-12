/**
 * Demo mode — single switch for all live API integrations.
 *
 * Default ON: every external call (Claude image analysis, Gemini variant
 * generation) returns a scripted response near-instantly, so a live
 * presentation can never stall on a network call.
 *
 * To present with real APIs, set in .env.local and restart the dev server:
 *   VITE_DEMO_MODE=false
 *
 * The legacy per-API flags (VITE_USE_MOCK_ANALYZE, VITE_USE_MOCK_NANO_BANANA)
 * still force their individual mocks even when demo mode is off.
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

/** Abortable sleep used by scripted responses to keep a believable beat. */
export function demoDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}
