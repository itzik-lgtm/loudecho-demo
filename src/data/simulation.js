const IMGS = {
  swim:        '/ramp/ramp-sports-swim.jpg',
  adventure:   '/ramp/ramp-adventure.jpg',
  finance:     '/ramp/ramp-finance-portrait.jpg',
  finance2:    '/ramp/ramp-finance-portrait-2.png',
  stock:       '/ramp/ramp-stock-market.jpg',
  celebrity:   '/ramp/ramp-celebrity.jpg',
  celebrity2:  '/ramp/ramp-celebrity-2.png',
  lifestyle:   '/ramp/ramp-lifestyle.png',
  innovation:  '/ramp/ramp-innovation.png',
  leaderboard: '/ramp/ramp-finance-leaderboard.jpg',
};

export const BID_EVENTS = [
  { id: 1,  cohort: 'High-intent (visited ramp.com)',  page: 'WSJ.com — Markets',              variant: 'Stock market · "Invest in your trade"',        rule: 'Cohort: high-intent → retargeting creative', confidence: 94, img: IMGS.stock,       axis: '300×250', cta: 'Get started' },
  { id: 2,  cohort: 'New visitor',                     page: 'NYTimes.com — Finance',           variant: 'Finance portrait · cashflow tagline',          rule: 'Finance context → suppress lifestyle imagery', confidence: 88, img: IMGS.finance,     axis: '300×600', cta: 'Get started' },
  { id: 3,  cohort: 'New visitor',                     page: 'ESPN.com — Sports',               variant: 'Swim · "Control spend. Swim free."',           rule: 'Sports context → sports variant',              confidence: 79, img: IMGS.swim,         axis: '300×250', cta: 'See how it works' },
  { id: 4,  cohort: 'Cart abandoner',                  page: 'CNN.com — Politics',              variant: 'Lifestyle · "Embrace the good life"',          rule: 'Cart abandoner + freq ≥ 3 → urgency',         confidence: 91, img: IMGS.lifestyle,    axis: '300×250', cta: 'Get started' },
  { id: 5,  cohort: 'High-intent (visited ramp.com)',  page: 'TheAtlantic.com — Culture',      variant: 'Celebrity · "Launch your client\'s star"',     rule: 'Cohort: high-intent → retargeting creative', confidence: 89, img: IMGS.celebrity,   axis: '300×600', cta: 'Book a demo' },
  { id: 6,  cohort: 'New visitor',                     page: 'Vogue.com — Business',            variant: 'Adventure · "Run finance on autopilot"',       rule: 'New visitor → awareness mode',               confidence: 82, img: IMGS.adventure,    axis: '300×250', cta: 'Learn more' },
  { id: 7,  cohort: 'High-intent (visited ramp.com)',  page: 'Bloomberg.com — Markets',         variant: 'Stock market · "Invest in your trade"',        rule: 'Cohort: high-intent → retargeting creative', confidence: 93, img: IMGS.stock,       axis: '300×250', cta: 'Get started' },
  { id: 8,  cohort: 'Returning visitor',               page: 'NYMag.com — Style',               variant: 'Lifestyle · "Embrace the good life"',          rule: 'Lifestyle context → lifestyle variant',        confidence: 77, img: IMGS.lifestyle,    axis: '300×250', cta: 'Get started' },
  { id: 9,  cohort: 'Cart abandoner',                  page: 'WashingtonPost.com — Health',     variant: 'Finance · "Slay the receipt monster"',         rule: 'Cart abandoner + freq ≥ 3 → urgency',         confidence: 88, img: IMGS.finance2,    axis: '300×600', cta: 'Book a demo' },
  { id: 10, cohort: 'High-intent (visited ramp.com)',  page: 'Forbes.com — Entrepreneurs',      variant: 'Innovation · "Unlock innovation"',             rule: 'Cohort: high-intent → retargeting creative', confidence: 96, img: IMGS.innovation,  axis: '300×250', cta: 'Get started' },
  { id: 11, cohort: 'New visitor',                     page: 'Bloomberg.com — Tech',            variant: 'Finance portrait · cashflow tagline',          rule: 'Finance context → suppress lifestyle imagery', confidence: 85, img: IMGS.finance,     axis: '300×600', cta: 'Get started' },
  { id: 12, cohort: 'High-intent (visited ramp.com)',  page: 'GQ.com — Style',                  variant: 'Celebrity · "Launch your client\'s star"',     rule: 'Cohort: high-intent → retargeting creative', confidence: 90, img: IMGS.celebrity2,  axis: '300×600', cta: 'Book a demo' },
  { id: 13, cohort: 'New visitor',                     page: 'ESPN.com — NBA',                  variant: 'Adventure · "Conquer adventure"',              rule: 'Sports context → sports variant',              confidence: 74, img: IMGS.adventure,    axis: '300×250', cta: 'Learn more' },
  { id: 14, cohort: 'Returning visitor',               page: 'NYTimes.com — Travel',            variant: 'Lifestyle · "Embrace the good life"',          rule: 'New visitor → awareness mode',               confidence: 81, img: IMGS.lifestyle,    axis: '300×250', cta: 'Get started' },
  { id: 15, cohort: 'Cart abandoner',                  page: 'Vox.com — Science',               variant: 'Finance · "Invest in your cashflow"',          rule: 'Cart abandoner + freq ≥ 3 → urgency',         confidence: 92, img: IMGS.finance2,    axis: '300×600', cta: 'Book a demo' },
  { id: 16, cohort: 'High-intent (visited ramp.com)',  page: 'TechCrunch.com — Startups',       variant: 'Innovation · "Unlock innovation"',             rule: 'Cohort: high-intent → retargeting creative', confidence: 87, img: IMGS.innovation,  axis: '300×250', cta: 'Get started' },
  { id: 17, cohort: 'New visitor',                     page: 'Forbes.com — Investing',          variant: 'Stock market · "Invest in your trade"',        rule: 'Finance context → suppress lifestyle imagery', confidence: 86, img: IMGS.stock,       axis: '300×250', cta: 'Get started' },
  { id: 18, cohort: 'New visitor',                     page: 'Refinery29 — Career',             variant: 'Swim · "Control spend. Swim free."',           rule: 'New visitor → awareness mode',               confidence: 80, img: IMGS.swim,         axis: '300×250', cta: 'See how it works' },
  { id: 19, cohort: 'High-intent (visited ramp.com)',  page: 'Inc.com — Growth',                variant: 'Finance · cashflow tagline',                   rule: 'Cohort: high-intent → retargeting creative', confidence: 95, img: IMGS.finance,     axis: '300×600', cta: 'Get started' },
  { id: 20, cohort: 'Cart abandoner',                  page: 'Atlantic.com — Ideas',            variant: 'Lifestyle · "Embrace the good life"',          rule: 'Cart abandoner + freq ≥ 3 → urgency',         confidence: 89, img: IMGS.lifestyle,    axis: '300×250', cta: 'Get started' },
  { id: 21, cohort: 'High-intent (visited ramp.com)',  page: 'FastCompany.com — Innovation',    variant: 'Innovation · "Unlock innovation"',             rule: 'Cohort: high-intent → retargeting creative', confidence: 91, img: IMGS.innovation,  axis: '300×250', cta: 'Get started' },
  { id: 22, cohort: 'New visitor',                     page: 'TheGuardian.com — Sport',         variant: 'Adventure · "Conquer adventure"',              rule: 'Sports context → sports variant',              confidence: 76, img: IMGS.adventure,    axis: '300×250', cta: 'Learn more' },
  { id: 23, cohort: 'Returning visitor',               page: 'Wired.com — Business',            variant: 'Finance portrait · cashflow tagline',          rule: 'New visitor → awareness mode',               confidence: 83, img: IMGS.finance2,    axis: '300×600', cta: 'Get started' },
  { id: 24, cohort: 'High-intent (visited ramp.com)',  page: 'HBR.org — Leadership',            variant: 'Celebrity · "Launch your client\'s star"',     rule: 'Cohort: high-intent → retargeting creative', confidence: 88, img: IMGS.celebrity,   axis: '300×600', cta: 'Book a demo' },
  { id: 25, cohort: 'Cart abandoner',                  page: 'CNN.com — Health',                variant: 'Stock market · "Invest in your trade"',        rule: 'Cart abandoner + freq ≥ 3 → urgency',         confidence: 93, img: IMGS.stock,       axis: '300×250', cta: 'Get started' },

  // CNN-specific rows for chat panel
  { id: 4.1, cohort: 'High-intent (visited ramp.com)', page: 'CNN.com — Tech',                 variant: 'Innovation · "Unlock innovation"',             rule: 'Cohort: high-intent → retargeting creative',  confidence: 92, img: IMGS.innovation,  axis: '300×250', cta: 'Get started' },
  { id: 4.2, cohort: 'New visitor',                    page: 'CNN.com — Health',               variant: 'Finance · "Slay the receipt monster"',         rule: 'New visitor → awareness mode',                confidence: 78, img: IMGS.finance,     axis: '300×600', cta: 'Get started' },
  { id: 4.3, cohort: 'Returning visitor',              page: 'CNN.com — World',                variant: 'Lifestyle · "Embrace the good life"',          rule: 'Lifestyle context → lifestyle variant',         confidence: 75, img: IMGS.lifestyle,    axis: '300×250', cta: 'Get started' },
  { id: 4.4, cohort: 'High-intent (visited ramp.com)', page: 'CNN.com — Business',             variant: 'Stock market · "Invest in your trade"',        rule: 'Cohort: high-intent → retargeting creative',  confidence: 89, img: IMGS.stock,       axis: '300×250', cta: 'Get started' },
  { id: 4.5, cohort: 'New visitor',                    page: 'CNN.com — Sports',               variant: 'Adventure · "Conquer adventure"',              rule: 'Sports context → sports variant',               confidence: 77, img: IMGS.adventure,    axis: '300×250', cta: 'Learn more' },
];

export const CNN_EVENTS = BID_EVENTS.filter(e => e.page.includes('CNN'));

export const UNDERPERFORMING = [
  { id: 1, img: IMGS.lifestyle,  variant: 'Lifestyle — "Embrace the good life"',      ctr: '0.29%', site: 'Finance sites', reason: 'Lifestyle tone underperforms 68% below benchmark on finance/business content', axis: '300×250', cta: 'Get started' },
  { id: 2, img: IMGS.celebrity,  variant: 'Celebrity — "Launch your client\'s star"', ctr: '0.31%', site: 'Finance sites', reason: 'Entertainment framing mismatched to finance audience intent',                    axis: '300×600', cta: 'Book a demo' },
  { id: 3, img: IMGS.adventure,  variant: 'Adventure — "Conquer adventure"',          ctr: '0.27%', site: 'Finance sites', reason: 'Outdoor character underperforms on single-reader editorial content',             axis: '300×250', cta: 'Learn more'  },
];
