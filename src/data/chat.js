export const CHAT_SCRIPTS = [
  {
    keywords: ['cnn', 'yesterday'],
    response: "Here's a breakdown of what ran on CNN yesterday — 6 unique variants served across multiple placements.",
    panel: 'cnn-table',
  },
  {
    keywords: ['underperform', 'finance'],
    response: "3 variants are underperforming on finance sites (CTR < 0.4%). I'd recommend retiring them or routing them to non-finance inventory.",
    panel: 'underperforming',
  },
  {
    keywords: ['lifestyle', 'sport'],
    response: "Rule created: On sports content, serve lifestyle variants only. Active immediately across all live inventory.",
    panel: 'rule-created',
  },
  {
    keywords: ['how many', 'pool', 'variant'],
    response: "Currently 247 variants in the active pool: 89 auto-approved, 42 pending human review, 116 serving live.",
    panel: 'pool-stats',
  },
  {
    keywords: ['fill rate'],
    response: "Fill rate across all live inventory is 78.3% — up 2.1pp from last week. Finance content leads at 84%, sports is lowest at 71%. No-fill is mostly frequency cap (25%) and policy filter (20%).",
  },
  {
    keywords: ['frequency cap'],
    response: "Frequency cap set to 3 impressions per user per day. This will affect ~18% of current serving volume and should reduce no-fill from frequency cap by an estimated 40%.",
  },
  {
    keywords: ['latency'],
    response: "Median decision latency is 51ms (p50), 82ms (p95). The top bottleneck is contextual signal fetch at 23ms — within acceptable range. No timeouts in the last 24h.",
  },
  {
    keywords: ['best performing', 'topic'],
    response: "Finance is your top-performing topic: 1.2% CTR, 84% fill rate. Technology is second at 0.9% CTR. Lifestyle is gaining — up 0.3pp week-over-week.",
  },
  {
    keywords: ['budget'],
    response: "At your current fill rate of 78%, a 5M impression campaign would require approximately $42,000 at a $7 CPM. Recommended daily pacing: ~$1,400/day over 30 days.",
  },
  {
    keywords: ['consideration'],
    response: "The Consideration stage variant achieved a 1.4% CTR — 40% above the Awareness stage baseline. It's the strongest performer in Jordan's journey segment.",
  },
  {
    keywords: ['pause', 'low'],
    response: "Done — I've paused 3 variants with CTR below 0.3%. They've entered the review queue. Estimated uplift: +8% of those impressions will redirect to stronger performers.",
  },
  {
    keywords: ['reach'],
    response: "At current pacing, you'll hit 1M impressions in approximately 7 hours. Projected 24h reach: 3.4M across 890K unique users.",
  },
];

export const SUGGESTED_QUERIES = [
  "Show me what ran on CNN yesterday",
  "Which variants are underperforming on finance sites?",
  "Only serve lifestyle variants on sports content",
];

// Per-scene suggested queries for the global assistant (keyed by scene index)
// Scenes: 0 Brief · 1 Generate & Review · 2 Live Decisions · 3 Go Live · 4 Results
export const SCENE_SUGGESTIONS = {
  0: [
    "How many variants are in the pool?",
    "What's our target fill rate?",
    "What topics perform best for Ramp?",
  ],
  1: [
    "How many variants are in the pool?",
    "Which variants are underperforming on finance sites?",
    "What's the latency breakdown?",
  ],
  2: [
    "Show me what ran on CNN yesterday",
    "How did the consideration stage perform?",
    "Only serve lifestyle variants on sports content",
  ],
  3: [
    "How long until we reach 1M impressions?",
    "Set a frequency cap of 3 per user",
    "What's our projected budget?",
  ],
  4: [
    "Which variants are underperforming on finance sites?",
    "Pause low-performing variants",
    "Only serve lifestyle variants on sports content",
  ],
};

export const FALLBACK_RESPONSE = "Got it — I've queued that for the next decision cycle. I'll surface the results in your next morning report.";
