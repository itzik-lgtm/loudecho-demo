import { runSimulation } from '../lib/simulator';
import { AXES } from './variants';

/**
 * Day-7 campaign report — deterministic, derived from the same seeded
 * simulation math that powers the decision engine. All numbers are framed
 * in the UI as projections from the decision-engine simulation.
 */

const CAMPAIGN_DAYS = 7;
const TOTAL_AD_CALLS = 5_000_000;
const BASELINE_CTR = 0.0062;   // static-creative benchmark
const CAMPAIGN_CTR = 0.0086;   // LoudEcho contextual pool → +38.7%

function makePrng(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

export function buildReport(launchPool) {
  const sim = runSimulation({ vertical: 'Finance', calculatedImpressions: TOTAL_AD_CALLS }, launchPool);
  const prng = makePrng(99);

  const impressions = sim.totalFilled;
  const clicks = Math.round(impressions * CAMPAIGN_CTR);
  const demosBooked = Math.round(clicks * 0.037); // click → demo conversion

  // Top variants from the simulation's power-law serving, decorated with CTR
  const leaderboard = sim.topVariants.slice(0, 10).map((v, i) => {
    // Winners skew above campaign average; tail regresses toward it
    const ctr = CAMPAIGN_CTR * (1.45 - i * 0.07) * (0.95 + prng() * 0.1);
    return { ...v, ctr, clicks: Math.round(v.impressions * ctr) };
  });

  // CTR by topic — ordered by impression share from the simulation histogram
  const ctrByTopic = Object.entries(sim.topicHistogram)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([topic, impr]) => ({
      topic,
      impressions: impr,
      ctr: CAMPAIGN_CTR * (0.8 + prng() * 0.55),
    }))
    .sort((a, b) => b.ctr - a.ctr);

  // CTR by format
  const formatShare = { '300×250': 0.42, '728×90': 0.27, '300×600': 0.19, '160×600': 0.12 };
  const ctrByFormat = AXES
    .filter(axis => launchPool.some(v => v.axis === axis))
    .map(axis => ({
      format: axis,
      impressions: Math.round(impressions * (formatShare[axis] ?? 0.1)),
      ctr: CAMPAIGN_CTR * (0.78 + prng() * 0.5),
    }))
    .sort((a, b) => b.ctr - a.ctr);

  return {
    days: CAMPAIGN_DAYS,
    totalAdCalls: TOTAL_AD_CALLS,
    impressions,
    fillRate: sim.fillRate,
    clicks,
    demosBooked,
    campaignCtr: CAMPAIGN_CTR,
    baselineCtr: BASELINE_CTR,
    upliftPct: Math.round(((CAMPAIGN_CTR - BASELINE_CTR) / BASELINE_CTR) * 100),
    leaderboard,
    ctrByTopic,
    ctrByFormat,
    coverage: {
      uniqueArticles: sim.uniqueArticlesSampled,
      articlePoolSize: sim.articlePoolSize,
      variantsServed: sim.distinctControlledAdsServed,
      variantsTotal: sim.totalControlledAds,
    },
    funnel: [
      { label: 'Impressions',  value: impressions },
      { label: 'Clicks',       value: clicks },
      { label: 'Demos booked', value: demosBooked },
    ],
  };
}
