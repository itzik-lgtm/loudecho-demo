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
      onLaunched?.();
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

      <div className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto px-8 py-6 space-y-5 h-full flex flex-col">

          {/* Advertiser strip + variant count — one row */}
          <div className="glass-card rounded-xl px-5 py-4 flex items-center gap-5">
            {advertiser && (
              <>
                {isRamp ? (
                  <img src="/ramp/ramp-logo.png" alt="Ramp" className="w-10 h-10 rounded-xl shrink-0 object-contain" />
                ) : (
                  <AdvertiserLogo adv={advertiser} size={10} />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-dark text-base leading-tight">{advertiser.name}</span>
                    {advertiser.category && (
                      <span className="text-[10px] font-semibold bg-gray-100 text-med-em px-2 py-0.5 rounded-full">{advertiser.category}</span>
                    )}
                  </div>
                </div>
                <div className="w-px h-8 bg-line-soft shrink-0 mx-1" />
              </>
            )}
            <div className={`flex items-center gap-3 transition-all duration-700 ${isLive ? 'opacity-100' : 'opacity-60'}`}>
              <span className="text-4xl font-black text-dark tabular-nums leading-none">{variantCount}</span>
              <div>
                <p className="text-[10px] font-bold text-low-em uppercase tracking-widest leading-none mb-1">
                  {isLive ? 'Variants deployed' : 'Variants ready'}
                </p>
                {isLive && (
                  <div className="flex items-center gap-1.5 fade-in">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-semibold text-success">Live</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
            <div className="glass-card rounded-xl p-4 space-y-2">
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

            <div className="glass-card rounded-xl p-4 space-y-2">
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

            <div className="glass-card rounded-xl p-4 space-y-2">
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

            <div className="glass-card rounded-xl p-4 space-y-2">
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
            <div className="flex flex-col items-center gap-2 py-1">
              <button
                onClick={() => setPhase('launching')}
                disabled={phase === 'launching'}
                className={`bg-dark text-white font-bold px-14 py-3.5 rounded-lg text-base transition-all ${
                  phase === 'launching' ? 'animate-pulse opacity-70 cursor-not-allowed' : 'hover:opacity-90'
                }`}
              >
                {phase === 'launching' ? 'Publishing…' : 'Launch campaign'}
              </button>
            </div>
          ) : (
            <div className="fade-in flex items-center justify-center gap-6 py-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success text-white flex items-center justify-center text-lg font-bold shadow-lg shrink-0">✓</div>
                <p className="text-xl font-bold text-dark">Campaign live.</p>
              </div>
              <button
                onClick={() => onNext(campaignConfig)}
                className="bg-dark text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity"
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
