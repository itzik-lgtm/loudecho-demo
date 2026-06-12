import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IAB_DIMENSIONS, AD_OVERLAYS, ctaFontSize } from '../data/adFormats';

/**
 * Full-screen lightbox for a single ad creative.
 * Scales to 85% of the viewport while preserving IAB dimensions.
 * Closes on Escape or backdrop click.
 */
export default function AdLightbox({ imageUrl, axis = '300×250', cta, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ov = AD_OVERLAYS[axis];
  const [nw, nh] = IAB_DIMENSIONS[axis] ?? [300, 250];
  const scale = Math.min(window.innerWidth * 0.85 / nw, window.innerHeight * 0.85 / nh, 2);
  const dw = Math.round(nw * scale);
  const dh = Math.round(nh * scale);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm fade-in"
      onClick={onClose}
    >
      <div className="relative" onClick={e => e.stopPropagation()}>
        <div
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{ width: dw, height: dh, backgroundColor: '#e4f222', containerType: 'inline-size', position: 'relative' }}
        >
          <img src={imageUrl} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

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

          <span className="absolute bottom-3 right-3 text-[10px] font-mono font-bold bg-black/60 text-white px-2 py-1 rounded">
            {axis}
          </span>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
