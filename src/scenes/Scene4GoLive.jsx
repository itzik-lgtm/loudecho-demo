import { useState, useEffect, useMemo } from 'react';
import SceneHeader from '../components/SceneHeader';
import AdvertiserLogo from '../components/AdvertiserLogo';
import { generateVariants, AXES } from '../data/variants';

const BASE_VARIANTS = generateVariants(247, 0);

export default function Scene4GoLive({ onNext, onLaunched, campaignConfig }) {
  const [phase, setPhase] = useState('ready');
  const isLive = phase === 'live';

  const variantCount = campaignConfig?.launchPool?.length ?? 47;
  const signalTypes  = campaignConfig?.selectedSignalTypes ?? [];
  const changeTypes  = campaignConfig?.selectedChangeTypes ?? [];
  const topic        = campaignConfig?.topic ?? 'All Topics';
  const advertiser   = campaignConfig?.advertiser;
  const isRamp       = advertiser?.id === 'ramp' || advertiser?.name === 'Ramp';

  const pool = campaignConfig?.launchPool ?? BASE_VARIANTS;

  const formatCounts = useMemo(() =>
    AXES.map(axis => ({ axis, count: pool.filter(v => v.axis === axis).length }))
        .filter(f => f.count > 0),
    [pool]
  );

  // Top topics actually covered by the launch pool
  const topicStats = useMemo(() => {
    const counts = {};
    for (const v of pool) {
      const t = v.topic ?? 'Other';
      counts[t] = (counts[t] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return { total: sorted.length, top: sorted.slice(0, 4), rest: Math.max(0, sorted.length - 4) };
  }, [pool]);

  useEffect(() => {
    if (phase !== 'launching') return;
    const t = setTimeout(() => {
      setPhase('live');
      onLaunched?.();   // unlocks the Results step in the stepper
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <SceneHeader
        title="Go Live"
        subtitle="Activate your campaign across connected DSPs and exchanges."
        badge={isLive ? 'Live' : undefined}
        cta={isLive ? { label: 'Jump to Day 7 →', onClick: () => onNext(campaignConfig) } : undefined}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10 space-y-8">

          {/* Advertiser hero */}
          {advertiser && (
            <div className="glass-card rounded-2xl p-6 flex items-start gap-5">
              {isRamp ? (
                <img src="/ramp/ramp-logo.png" alt="Ramp" className="w-14 h-14 rounded-xl shrink-0 object-contain" />
              ) : (
                <AdvertiserLogo adv={advertiser} size={14} />
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-black text-dark">{advertiser.name}</h2>
                  {advertiser.category && (
                    <span className="text-[10px] font-semibold bg-gray-100 text-med-em px-2.5 py-1 rounded-full">{advertiser.category}</span>
                  )}
                  {advertiser.industry && (
                    <span className="text-[10px] font-semibold bg-gray-100 text-med-em px-2.5 py-1 rounded-full">{advertiser.industry}</span>
                  )}
                </div>
                {advertiser.brief && (
                  <p className="text-xs text-med-em leading-relaxed line-clamp-2">{advertiser.brief}</p>
                )}
                {advertiser.keyMessages?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {advertiser.keyMessages.map(msg => (
                      <span key={msg} className="text-[10px] font-semibold bg-info-bg text-brand-text px-2.5 py-1 rounded-full">"{msg}"</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hero count */}
          <div className={`transition-all duration-700 ${isLive ? 'opacity-100' : 'opacity-60'}`}>
            <p className="text-[11px] font-bold text-low-em uppercase tracking-widest mb-1">
              {isLive ? 'Variants deployed' : 'Variants ready'}
            </p>
            <div className="flex items-end gap-3">
              <span className="text-7xl font-black text-dark tabular-nums leading-none">{variantCount}</span>
              {isLive && (
                <div className="flex items-center gap-2 mb-2 fade-in">
                  <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-semibold text-success">Live</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats grid — one shared pattern: title → subtitle → pill cloud */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5 space-y-3">
              <p className="text-[10px] font-bold text-low-em uppercase tracking-wider">Formats</p>
              <p className="text-sm font-semibold text-dark">{formatCounts.length} IAB formats</p>
              <div className="flex flex-wrap gap-1.5">
                {formatCounts.map(({ axis, count }) => (
                  <span key={axis} className="text-[11px] font-semibold bg-gray-100 text-dark px-2.5 py-1 rounded-full">
                    {axis} <span className="text-low-em font-medium">×{count}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 space-y-3">
              <p className="text-[10px] font-bold text-low-em uppercase tracking-wider">Topics</p>
              <p className="text-sm font-semibold text-dark">{topic} · {topicStats.total} covered</p>
              <div className="flex flex-wrap gap-1.5">
                {topicStats.top.map(([t, n]) => (
                  <span key={t} className="text-[11px] font-semibold bg-gray-100 text-dark px-2.5 py-1 rounded-full">
                    {t} <span className="text-low-em font-medium">×{n}</span>
                  </span>
                ))}
                {topicStats.rest > 0 && (
                  <span className="text-[11px] font-medium text-low-em px-1 py-1">+ {topicStats.rest} more</span>
                )}
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 space-y-3">
              <p className="text-[10px] font-bold text-low-em uppercase tracking-wider">Signal Types</p>
              <p className="text-sm font-semibold text-dark">{signalTypes.length || '—'} selected</p>
              {signalTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {signalTypes.map(s => (
                    <span key={s} className="text-[11px] font-semibold bg-gray-100 text-dark px-2.5 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card rounded-xl p-5 space-y-3">
              <p className="text-[10px] font-bold text-low-em uppercase tracking-wider">Change Types</p>
              <p className="text-sm font-semibold text-dark">{changeTypes.length || '—'} applied</p>
              {changeTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {changeTypes.map(c => (
                    <span key={c} className="text-[11px] font-semibold bg-gray-100 text-dark px-2.5 py-1 rounded-full">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

{/* CTA / success */}
          {!isLive ? (
            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                onClick={() => setPhase('launching')}
                disabled={phase === 'launching'}
                className={`bg-dark text-white font-bold px-14 py-4 rounded-lg text-base transition-all ${
                  phase === 'launching' ? 'animate-pulse opacity-70 cursor-not-allowed' : 'hover:opacity-90'
                }`}
              >
                {phase === 'launching' ? 'Publishing…' : 'Launch campaign'}
              </button>
              {phase === 'ready' && (
                <p className="text-xs text-low-em">{variantCount} variants across {formatCounts.length} formats</p>
              )}
            </div>
          ) : (
            <div className="fade-in flex flex-col items-center gap-4 pt-2">
              <div className="w-14 h-14 rounded-full bg-success text-white flex items-center justify-center text-2xl font-bold shadow-lg">✓</div>
              <p className="text-2xl font-bold text-dark">Campaign live.</p>
              <button
                onClick={() => onNext(campaignConfig)}
                className="bg-dark text-white font-bold px-8 py-3 rounded-lg text-sm hover:opacity-90 transition-opacity"
              >
                Jump to Day 7 →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
