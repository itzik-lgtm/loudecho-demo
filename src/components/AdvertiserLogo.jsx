import { useState, useEffect } from 'react';

export default function AdvertiserLogo({ adv, size = 8 }) {
  // Try sources in order: logoUrl (Firebase Storage) → clearbit (domain) → letter avatar
  const src0 = adv.logoUrl || null;
  const src1 = adv.domain ? `https://logo.clearbit.com/${adv.domain}` : null;
  const initStage = src0 ? 0 : src1 ? 1 : 2;
  const [stage, setStage] = useState(initStage); // 0=logoUrl, 1=clearbit, 2=avatar
  const src = stage === 0 ? src0 : stage === 1 ? src1 : null;
  const advance = () => setStage(s => s + 1);
  // Reset when advertiser changes
  useEffect(() => setStage(src0 ? 0 : src1 ? 1 : 2), [adv.id]);

  const sz = `w-${size} h-${size}`;
  if (src) {
    return (
      <div className={`${sz} rounded-full overflow-hidden shrink-0 bg-gray-100`}>
        <img src={src} alt={adv.name} className="w-full h-full object-cover" onError={advance} />
      </div>
    );
  }
  const letter = (adv.name || '?')[0].toUpperCase();
  const hue = [...(adv.name || '')].reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0) % 360;
  return (
    <div className={`${sz} rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold`} style={{ background: `hsl(${Math.abs(hue)},55%,50%)` }}>
      {letter}
    </div>
  );
}
