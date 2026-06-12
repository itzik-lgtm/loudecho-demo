// One prospect followed across three page contexts — the demo's climax.
// Each touchpoint carries the same decision-trace shape used by the replay scene.
const BASE = '/ramp/creatives/';

export const PERSONA = {
  name: 'Jordan Mitchell',
  age: 34,
  title: 'VP Finance',
  company: 'Series B startup · 140 employees',
  location: 'Austin, TX',
  initials: 'JM',
};

export const TOUCHPOINTS = [
  {
    id: 1,
    stage: 'Awareness',
    title: 'First encounter',
    template: 'news',
    article: {
      publisher: 'Reuters',
      url: 'reuters.com/markets/us/fed-holds-rates-inflation-2-1-2026',
      title: 'Fed Holds Rates Steady as Inflation Cools to 2.1%',
      topic: 'Economy',
      byline: 'By Howard Klein · Markets · 8:42 AM CT',
    },
    cohort: 'New Visitor',
    cohortStyle: 'bg-gray-100 text-med-em',
    signals: { topic: 'Economy', device: 'Desktop · Chrome', geo: 'Austin, TX', recency: '0 impressions / 24h' },
    funnel: [
      { step: 'Eligible pool',        count: 158 },
      { step: 'Format 728×90',        count: 38 },
      { step: 'Topic: Economy',       count: 12 },
      { step: 'Cohort: New Visitor',  count: 5 },
      { step: 'Winner',               count: 1 },
    ],
    creative: {
      imageUrl: BASE + 'stock_market_8-1.jpg',
      axis: '728×90',
      tagline: 'Sleep well, while we automate your spend',
      cta: 'Learn more',
    },
    reason: 'New visitor on an economy page → finance-contextualized awareness creative with a soft CTA. No retargeting data yet, so the engine optimizes for brand recall.',
    outcome: { label: 'Impression — no click', icon: '○', style: 'bg-gray-100 text-med-em' },
  },
  {
    id: 2,
    stage: 'Consideration',
    title: 'High-intent visit',
    template: 'sports',
    article: {
      publisher: 'ESPN',
      url: 'espn.com/nfl/story/power-rankings-week-7',
      title: 'NFL Week 7 Power Rankings: Who Rises, Who Falls',
      topic: 'Football',
      byline: 'By Dana Torres · NFL · 12:17 PM CT',
    },
    cohort: 'High-Intent · visited ramp.com',
    cohortStyle: 'bg-info-bg text-brand-text',
    signals: { topic: 'Football', device: 'Mobile · Safari', geo: 'Austin, TX', recency: '1 impression / 24h' },
    funnel: [
      { step: 'Eligible pool',         count: 158 },
      { step: 'Format 300×250',        count: 64 },
      { step: 'Topic: Sports',         count: 21 },
      { step: 'Cohort: High-Intent',   count: 8 },
      { step: 'Winner',                count: 1 },
    ],
    creative: {
      imageUrl: BASE + '0000_00_Ramp__sports_20260325_145445_5-4_attempt2.jpg',
      axis: '300×250',
      tagline: 'Slay the receipt monster, focus on winning.',
      cta: 'Get started',
    },
    reason: 'Jordan visited ramp.com yesterday → the engine skips awareness and serves a sports-contextualized retargeting creative with a direct CTA, matched to the page he’s actually reading.',
    outcome: { label: 'Click — visited pricing page', icon: '→', style: 'bg-success-bg text-success' },
  },
  {
    id: 3,
    stage: 'Action',
    title: 'Decision stage',
    template: 'finance',
    article: {
      publisher: 'Bloomberg',
      url: 'bloomberg.com/news/cfo-spend-visibility-guide-2026',
      title: 'The CFO’s Guide to Spend Visibility in 2026',
      topic: 'Expense Management',
      byline: 'By Priya Raman · Finance · 4:55 PM CT',
    },
    cohort: 'High-Intent · demo requested',
    cohortStyle: 'bg-draft-bg text-draft',
    signals: { topic: 'Expense Management', device: 'Desktop · Chrome', geo: 'Austin, TX', recency: '2 impressions / 24h' },
    funnel: [
      { step: 'Eligible pool',           count: 158 },
      { step: 'Format 300×600',          count: 18 },
      { step: 'Topic: Finance',          count: 9 },
      { step: 'Cohort: Demo requested',  count: 3 },
      { step: 'Winner',                  count: 1 },
    ],
    creative: {
      imageUrl: BASE + '0001_00_Ramp__finance_20260323_093438_9-16_attempt2_logo=True_main_subject_occulted=True.jpg',
      axis: '300×600',
      tagline: 'One card, total control. Play offense, not defence.',
      cta: 'Book a demo',
    },
    reason: 'Demo requested but not booked, reading expense-management content → high-confidence half-page creative with a closing CTA. Frequency pacing allows one more touch today.',
    outcome: { label: 'Click → Demo booked', icon: '✓', style: 'bg-success text-white' },
  },
];

export const JOURNEY_CLOSER =
  'Three contexts, three different decisions for the same person — not because anyone wrote a rule, but because the engine understood where Jordan was in the buying journey.';
