import { ARTICLE_POOLS, VERTICAL_POOL_SIZES } from '../data/articles';

const SEED = 42;
const FILL_RATE = 0.78;
const MU_LOG = 3.906; // log-normal params → median ≈ 50ms, p95 ≈ 81ms
const SIGMA_LOG = 0.3;

function makePrng(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

export function runSimulation(config, launchPool) {
  const { vertical, calculatedImpressions } = config;
  const N = calculatedImpressions;
  const prng = makePrng(SEED);

  const articlePool = ARTICLE_POOLS[vertical] ?? ARTICLE_POOLS['Finance'];
  const articlePoolSize = VERTICAL_POOL_SIZES[vertical] ?? 4000;

  // 1. Fill / no-fill
  const totalFilled = Math.round(N * FILL_RATE);
  const totalNoFill = N - totalFilled;

  // 2. No-fill breakdown
  const noFillWeights = [
    ['No matching variant', 0.40],
    ['Frequency cap',       0.25],
    ['Policy filter',       0.20],
    ['Latency timeout',     0.15],
  ];
  const noFillReasonBreakdown = {};
  let rem = totalNoFill;
  for (let i = 0; i < noFillWeights.length - 1; i++) {
    const [label, w] = noFillWeights[i];
    noFillReasonBreakdown[label] = Math.round(totalNoFill * w);
    rem -= noFillReasonBreakdown[label];
  }
  noFillReasonBreakdown[noFillWeights[noFillWeights.length - 1][0]] = rem;

  // 3. Article coverage — coupon-collector saturation (multiplier 20 = realistic for large pools)
  const uniqueArticlesSampled = Math.min(
    articlePoolSize,
    Math.round(articlePoolSize * (1 - Math.exp(-N / (articlePoolSize * 20))))
  );

  // 4. Seeded shuffle → article samples
  const shuffled = [...articlePool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const articleSamples = shuffled.slice(0, Math.min(12, uniqueArticlesSampled));

  // 5. Controlled ad coverage
  // Power-law serving: top variants dominate; long tail rarely fires.
  // Ceiling is seeded at 73–88% to reflect realistic targeting + frequency constraints.
  const totalControlledAds = launchPool.length > 0 ? launchPool.length : 158;
  const maxCoverage = 0.73 + prng() * 0.15;
  const pressure = totalFilled / (totalControlledAds * 200);
  const coverageRate = maxCoverage * (1 - Math.exp(-pressure));
  const distinctControlledAdsServed = Math.min(
    totalControlledAds,
    Math.round(totalControlledAds * coverageRate)
  );
  const zeroImpressionControlledAds = totalControlledAds - distinctControlledAdsServed;

  // 6. Variant topic histogram
  const topicCounts = {};
  const ads = launchPool.length > 0 ? launchPool : [];
  for (const ad of ads) {
    const t = ad.topic ?? 'Other';
    topicCounts[t] = (topicCounts[t] ?? 0) + 1;
  }
  const topicHistogram = {};
  if (Object.keys(topicCounts).length > 0) {
    const entries = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
    let remFilled = totalFilled;
    for (let i = 0; i < entries.length - 1; i++) {
      const [t, cnt] = entries[i];
      topicHistogram[t] = Math.round(totalFilled * (cnt / totalControlledAds));
      remFilled -= topicHistogram[t];
    }
    topicHistogram[entries[entries.length - 1][0]] = Math.max(0, remFilled);
  }

  // 7. Latency — 1000 seeded log-normal samples
  const latencies = [];
  for (let i = 0; i < 1000; i++) {
    const u1 = Math.max(1e-12, prng());
    const u2 = prng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    latencies.push(Math.round(Math.exp(MU_LOG + z * SIGMA_LOG)));
  }
  latencies.sort((a, b) => a - b);
  const p50LatencyMs = latencies[499];
  const p95LatencyMs = latencies[949];

  // 8. Top served variants + touchpoint breakdown — power-law distributed impression share
  let topVariants = [];
  let touchpointImpressions = null;
  if (launchPool.length > 0) {
    const scored = launchPool.map(v => ({ v, s: prng() }));
    const totalScore = scored.reduce((acc, x) => acc + x.s * x.s, 0);
    topVariants = scored
      .map(x => ({ ...x.v, impressions: Math.round((x.s * x.s / totalScore) * totalFilled) }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 12);

    // Per-stage impression breakdown from power-law scores
    const TOUCHPOINT_LABELS = ['Awareness', 'Consideration', 'Action'];
    const stageScores = [0, 0, 0];
    for (const { v, s } of scored) {
      const idx = v.signalData?.journeyStage?.index ?? 0;
      if (idx >= 0 && idx < 3) stageScores[idx] += s * s;
    }
    const totalStageScore = stageScores.reduce((a, b) => a + b, 0) || 1;
    let rem = totalFilled;
    touchpointImpressions = TOUCHPOINT_LABELS.map((label, i) => {
      const impr = i < 2 ? Math.round(totalFilled * stageScores[i] / totalStageScore) : rem;
      rem -= impr;
      return { label, impressions: impr };
    });
  }

  return {
    config,
    totalAdCalls: N,
    totalFilled,
    totalNoFill,
    fillRate: FILL_RATE,
    noFillReasonBreakdown,
    articlePoolSize,
    uniqueArticlesSampled,
    articleSamples,
    distinctControlledAdsServed,
    totalControlledAds,
    zeroImpressionControlledAds,
    topicHistogram,
    topVariants,
    touchpointImpressions,
    p50LatencyMs,
    p95LatencyMs,
  };
}
