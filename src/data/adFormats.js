// Canonical IAB ad format definitions — single source of truth for all ad creative rendering.

export const IAB_DIMENSIONS = {
  '160×600': [160, 600],
  '300×250': [300, 250],
  '300×600': [300, 600],
  '728×90':  [728, 90],
};

// CSS aspect-ratio string for image containers
export const ASPECT_RATIOS = {
  '160×600': '160 / 600',
  '300×250': '300 / 250',
  '300×600': '300 / 600',
  '728×90':  '728 / 90',
};

// CTA font size using container query units so it scales with container width.
// Derived from production: 13px ÷ axis-width ≈ N cqw.
export function ctaFontSize(axis) {
  if (axis === '160×600') return '8.1cqw';
  if (axis === '728×90')  return '1.8cqw';
  return '4.3cqw';
}

// Logo and CTA overlay positions as % of container dimensions.
// Derived from production HTML/CSS (px → % of IAB pixel dimensions).
//
//   728×90:  logo top-right,    cta mid-right (below logo)
//   300×600: logo bottom-right, cta bottom-left
//   160×600: both bottom-center
//   300×250: logo bottom-left,  cta bottom-right
export const AD_OVERLAYS = {
  '728×90': {
    logo: { left: '89.56%', top: '16.67%', width: '8.93%',  height: '21.11%' },
    cta:  { left: '84.48%', top: '50%',    width: '14.15%', height: '31.11%' },
  },
  '300×600': {
    logo: { left: '60.67%', top: '91.67%', width: '35.33%', height: '5%'    },
    cta:  { left: '5.67%',  top: '90.83%', width: '44.67%', height: '6.5%'  },
  },
  '160×600': {
    logo: { left: '27.5%',  top: '86.5%',  width: '45.63%', height: '3.5%'  },
    cta:  { left: '18.13%', top: '92.5%',  width: '64.38%', height: '4.67%' },
  },
  '300×250': {
    logo: { left: '3.67%',  top: '86.4%',  width: '24.33%', height: '8.4%'  },
    cta:  { left: '62.33%', top: '85.2%',  width: '34.33%', height: '11.2%' },
  },
};
