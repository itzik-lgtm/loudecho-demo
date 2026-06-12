import { ARTICLE_POOLS } from './articles';
import { JOURNEY_STAGES, AXES } from './variants';

/**
 * Deterministic ad-call decision stream for the replay scene.
 *
 * Each DecisionEvent represents one sampled ad call:
 *   { id, article, signals, funnel, winner, reason, latencyMs, outcome, noFillReason? }
 *
 * The funnel is the explainability core — candidate counts narrowing through
 * decision steps until a single winner remains.
 */

const MU_LOG = 3.906;   // log-normal latency: median ≈ 50ms, p95 ≈ 81ms
const SIGMA_LOG = 0.3;

const COHORTS = JOURNEY_STAGES.map(s => s.label);

const GEOS = [
  'New York, NY', 'San Francisco, CA', 'Austin, TX', 'Chicago, IL',
  'Seattle, WA', 'Boston, MA', 'Denver, CO', 'Atlanta, GA',
];
const DEVICES = ['Desktop · Chrome', 'Mobile · Safari', 'Desktop · Edge', 'Tablet · Safari', 'Mobile · Chrome'];

const NO_FILL_REASONS = [
  { reason: 'Frequency cap reached', detail: 'User has seen 3 Ramp impressions in the last 24h — cap is 3/24h.' },
  { reason: 'No matching variant', detail: 'No approved variant matches this page topic and requested format.' },
  { reason: 'Policy filter', detail: 'Page context flagged by brand-safety policy — Ramp excluded from this inventory.' },
];

function makePrng(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

function latencySample(prng) {
  const u1 = Math.max(1e-12, prng());
  const u2 = prng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.round(Math.exp(MU_LOG + z * SIGMA_LOG));
}

/**
 * Generate a deterministic stream of decision events.
 * @param {object} opts
 * @param {string} opts.vertical    — article pool to sample from
 * @param {Array}  opts.launchPool  — approved variants
 * @param {number} opts.count       — number of events
 * @param {number} opts.seed
 */
export function generateDecisionStream({ vertical, launchPool, count = 25, seed = 42 }) {
  const prng = makePrng(seed);
  const articles = ARTICLE_POOLS[vertical] ?? ARTICLE_POOLS['Finance'];
  const pool = launchPool?.length ? launchPool : [];
  const poolSize = pool.length || 158;

  // Pre-index pool by axis for winner picks
  const byAxis = {};
  for (const axis of AXES) byAxis[axis] = pool.filter(v => v.axis === axis);

  // Which events no-fill (~12%) — spread them out, never the first two
  const noFillEvery = Math.max(5, Math.round(count / Math.max(1, Math.round(count * 0.12))));

  const events = [];
  for (let i = 0; i < count; i++) {
    const article = articles[Math.floor(prng() * articles.length)];
    const cohortIdx = prng() < 0.55 ? 0 : prng() < 0.7 ? 1 : 2;
    const cohort = COHORTS[cohortIdx];
    const geo = GEOS[Math.floor(prng() * GEOS.length)];
    const device = DEVICES[Math.floor(prng() * DEVICES.length)];
    const impressions24h = Math.floor(prng() * 3);
    const latencyMs = latencySample(prng);

    const isNoFill = i >= 2 && (i + 1) % noFillEvery === 0;

    const signals = {
      topic: article.topic,
      vertical: article.vertical,
      cohort,
      cohortIndex: cohortIdx,
      geo,
      device,
      recency: `${impressions24h} impression${impressions24h === 1 ? '' : 's'} / 24h`,
    };

    if (isNoFill) {
      const nf = NO_FILL_REASONS[Math.floor(prng() * NO_FILL_REASONS.length)];
      events.push({
        id: i + 1,
        article,
        signals,
        funnel: [
          { step: 'Eligible pool', count: poolSize },
          { step: nf.reason, count: 0 },
        ],
        winner: null,
        reason: nf.detail,
        latencyMs: Math.round(latencyMs * 0.6),
        outcome: 'no-fill',
        noFillReason: nf.reason,
      });
      continue;
    }

    // Requested format — weight toward the common formats
    const axisRoll = prng();
    const axis = axisRoll < 0.45 ? '300×250' : axisRoll < 0.7 ? '728×90' : axisRoll < 0.88 ? '300×600' : '160×600';

    // Winner: prefer axis + topic match, then axis match, then any
    const axisPool = byAxis[axis]?.length ? byAxis[axis] : pool;
    const topicMatches = axisPool.filter(v => v.topic === article.topic);
    const winnerPool = topicMatches.length ? topicMatches : axisPool;
    const winner = winnerPool.length ? winnerPool[Math.floor(prng() * winnerPool.length)] : null;

    // Plausible narrowing counts derived from real pool proportions
    const formatCount = Math.max(2, byAxis[axis]?.length || Math.round(poolSize * 0.3));
    const topicCount  = Math.max(2, topicMatches.length || Math.round(formatCount * (0.25 + prng() * 0.2)));
    const cohortCount = Math.max(1, Math.round(topicCount * (0.3 + prng() * 0.25)));
    const freqCount   = Math.max(1, Math.round(cohortCount * 0.7));

    const funnel = [
      { step: 'Eligible pool',            count: poolSize },
      { step: `Format ${axis}`,           count: formatCount },
      { step: `Topic: ${article.topic}`,  count: topicCount },
      { step: `Cohort: ${cohort.split(' · ')[0]}`, count: cohortCount },
      { step: 'Frequency & pacing',       count: freqCount },
      { step: 'Winner',                   count: 1 },
    ];

    const outcome = prng() < 0.055 ? 'click' : 'impression';

    const reasonBits = [`${axis} slot`, `page topic “${article.topic}”`];
    if (cohortIdx > 0) reasonBits.push(cohort.toLowerCase());
    const reason = `Selected for ${reasonBits.join(' + ')} — highest predicted engagement of ${freqCount} finalists.`;

    events.push({
      id: i + 1,
      article,
      signals,
      axis,
      funnel,
      winner,
      reason,
      latencyMs,
      outcome,
    });
  }
  return events;
}

/** Accumulate rail metrics from the events revealed so far. */
export function accumulateMetrics(events) {
  const filled = events.filter(e => e.outcome !== 'no-fill');
  const clicks = events.filter(e => e.outcome === 'click').length;
  const latencies = events.map(e => e.latencyMs).sort((a, b) => a - b);
  const distinctAds = new Set(filled.map(e => e.winner?.id).filter(Boolean)).size;

  const topicCounts = {};
  for (const e of filled) {
    topicCounts[e.signals.topic] = (topicCounts[e.signals.topic] ?? 0) + 1;
  }

  const noFillCounts = {};
  for (const e of events) {
    if (e.outcome === 'no-fill') noFillCounts[e.noFillReason] = (noFillCounts[e.noFillReason] ?? 0) + 1;
  }

  const pct = (q) => latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * q))] : 0;

  return {
    adCalls: events.length,
    filled: filled.length,
    fillRate: events.length ? filled.length / events.length : 0,
    clicks,
    distinctAds,
    p50: pct(0.5),
    p95: pct(0.95),
    topicCounts,
    noFillCounts,
  };
}
