import { AD_OVERLAYS, ASPECT_RATIOS, ctaFontSize } from '../data/adFormats';

/**
 * A Ramp ad creative rendered at its IAB aspect ratio with the
 * wordmark + CTA overlays. Fills its parent's width.
 */
export default function AdCreative({ imageUrl, axis = '300×250', cta, className = '', onClick }) {
  const ov = AD_OVERLAYS[axis];
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: ASPECT_RATIOS[axis] ?? '300 / 250', containerType: 'inline-size', backgroundColor: '#e4f222' }}
    >
      <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {ov && (
        <>
          <img src="/ramp/ramp-wordmark.svg" alt="Ramp"
            style={{ position: 'absolute', left: ov.logo.left, top: ov.logo.top, width: ov.logo.width, height: ov.logo.height, objectFit: 'contain', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: ov.cta.left, top: ov.cta.top, width: ov.cta.width, height: ov.cta.height, backgroundColor: '#e4f222', borderRadius: '6.88px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', pointerEvents: 'none' }}>
            <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 500, color: '#1a1919', fontSize: ctaFontSize(axis), lineHeight: 1, whiteSpace: 'nowrap' }}>
              {cta}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
