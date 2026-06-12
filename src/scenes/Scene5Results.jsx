import { useState, useMemo } from 'react';
import SceneHeader from '../components/SceneHeader';
import AdLightbox from '../components/AdLightbox';
import { buildReport } from '../data/report';
import { generateVariants } from '../data/variants';
import { ASPECT_RATIOS } from '../data/adFormats';

const fmtPct = x => `${(x * 100).toFixed(2)}%`;
const fmtK = n => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

function BarRow({ label, value, max, display }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-med-em w-28 truncate shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-line-soft overflow-hidden">
        <div className="h-full bg-brand rounded-full" style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-[11px] font-bold text-dark tabular-nums w-14 text-right shrink-0">{display}</span>
    </div>
  );
}

export default function Scene5Results({ onReset, campaignConfig }) {
  const launchPool = useMemo(() => {
    if (campaignConfig?.launchPool?.length) return campaignConfig.launchPool;
    return generateVariants(247, 0).filter(v => v.bucket === 'recommended');
  }, [campaignConfig]);

  const report = useMemo(() => buildReport(launchPool), [launchPool]);
  const [lightbox, setLightbox] = useState(null);

  const maxTopicCtr = report.ctrByTopic[0]?.ctr ?? 1;
  const maxFormatCtr = report.ctrByFormat[0]?.ctr ?? 1;
  const maxFunnel = report.funnel[0]?.value ?? 1;

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <SceneHeader
        title="Day 7 — Campaign Results"
        subtitle="One seed creative. Seven days of contextual decisioning. Here's what it earned."
        badge="Live for 7 days"
        cta={{ label: '↺ Start new campaign', onClick: onReset }}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-6 space-y-6">

          {/* ── Hero: uplift vs baseline ── */}
          <div className="rounded-2xl bg-dark text-white px-7 py-6 flex items-center gap-8">
            <div className="shrink-0">
              <p className="text-6xl font-black leading-none text-emerald-400">+{report.upliftPct}%</p>
              <p className="text-sm font-bold mt-1.5">CTR vs static creative baseline</p>
            </div>
            <div className="flex-1 max-w-sm space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-semibold">LoudEcho contextual pool</span>
                  <span className="font-bold tabular-nums">{fmtPct(report.campaignCtr)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-white/60">Static creative benchmark</span>
                  <span className="text-white/60 tabular-nums">{fmtPct(report.baselineCtr)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-white/40 rounded-full" style={{ width: `${(report.baselineCtr / report.campaignCtr) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Impressions delivered', value: report.impressions.toLocaleString() },
              { label: 'Fill rate',             value: `${Math.round(report.fillRate * 100)}%` },
              { label: 'Clicks',                value: report.clicks.toLocaleString() },
              { label: 'Demos booked',          value: report.demosBooked.toLocaleString() },
            ].map(s => (
              <div key={s.label} className="glass-card rounded-xl px-4 py-3.5">
                <p className="text-[10px] font-semibold text-low-em uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-bold text-dark tabular-nums mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Variant leaderboard: podium + table ── */}
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-dark text-base">Top performing variants</h3>
              <p className="text-xs text-low-em">The engine discovered these winners — ranked by impressions served.</p>
            </div>

            {/* Podium — top 3 */}
            <div className="grid grid-cols-3 gap-4">
              {report.leaderboard.slice(0, 3).map((v, i) => (
                <div
                  key={v.id}
                  className="glass-card rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative"
                  onClick={() => setLightbox(v)}
                >
                  <span className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center shadow ${
                    i === 0 ? 'bg-amber-400 text-white' : 'bg-dark text-white'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="h-44 bg-gray-50 flex items-center justify-center p-2">
                    <img
                      src={v.imageUrl}
                      alt=""
                      loading="lazy"
                      className="max-h-full max-w-full object-contain rounded"
                      style={{ aspectRatio: ASPECT_RATIOS[v.axis] }}
                    />
                  </div>
                  <div className="px-3 py-2 space-y-0.5">
                    <p className="text-[11px] font-semibold text-dark truncate">"{v.tagline}"</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-med-em">{v.topic} · {v.axis}</span>
                      <span className="text-[10px] font-bold text-dark tabular-nums shrink-0">
                        {fmtK(v.impressions)} · <span className="text-success">{fmtPct(v.ctr)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ranks 4–10 — compact table */}
            <div className="glass-card rounded-xl overflow-hidden">
              {(() => {
                const rest = report.leaderboard.slice(3);
                const maxImpr = rest[0]?.impressions ?? 1;
                return rest.map((v, i) => (
                  <div
                    key={v.id}
                    onClick={() => setLightbox(v)}
                    className="flex items-center gap-3 px-4 py-2 border-b border-line-soft last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[11px] font-bold text-low-em tabular-nums w-4 shrink-0">{i + 4}</span>
                    <div className="w-12 h-8 shrink-0 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                      <img src={v.imageUrl} alt="" loading="lazy" className="max-h-full max-w-full object-contain" style={{ aspectRatio: ASPECT_RATIOS[v.axis] }} />
                    </div>
                    <span className="text-[11px] text-dark truncate flex-1 min-w-0">"{v.tagline}"</span>
                    <span className="text-[10px] text-med-em w-24 truncate shrink-0 hidden lg:block">{v.topic}</span>
                    <span className="text-[10px] font-mono text-med-em w-16 shrink-0">{v.axis}</span>
                    <div className="w-28 h-1.5 rounded-full bg-line-soft overflow-hidden shrink-0 hidden md:block">
                      <div className="h-full bg-brand rounded-full" style={{ width: `${(v.impressions / maxImpr) * 100}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-dark tabular-nums w-14 text-right shrink-0">{fmtK(v.impressions)}</span>
                    <span className="text-[11px] font-semibold text-success tabular-nums w-14 text-right shrink-0">{fmtPct(v.ctr)}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* ── CTR breakdowns ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5 space-y-3">
              <p className="text-[10px] font-bold text-low-em uppercase tracking-wider">CTR by topic</p>
              <div className="space-y-2">
                {report.ctrByTopic.map(t => (
                  <BarRow key={t.topic} label={t.topic} value={t.ctr} max={maxTopicCtr} display={fmtPct(t.ctr)} />
                ))}
              </div>
            </div>
            <div className="glass-card rounded-xl p-5 space-y-3">
              <p className="text-[10px] font-bold text-low-em uppercase tracking-wider">CTR by format</p>
              <div className="space-y-2">
                {report.ctrByFormat.map(f => (
                  <BarRow key={f.format} label={f.format} value={f.ctr} max={maxFormatCtr} display={fmtPct(f.ctr)} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Coverage + journey funnel ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5 space-y-3">
              <p className="text-[10px] font-bold text-low-em uppercase tracking-wider">Coverage</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-med-em">Articles reached</span>
                  <span className="text-xs font-bold text-dark tabular-nums">
                    {report.coverage.uniqueArticles.toLocaleString()} / {report.coverage.articlePoolSize.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-med-em">Variants served</span>
                  <span className="text-xs font-bold text-dark tabular-nums">
                    {report.coverage.variantsServed} / {report.coverage.variantsTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-med-em">Total ad calls</span>
                  <span className="text-xs font-bold text-dark tabular-nums">{report.totalAdCalls.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5 space-y-3">
              <p className="text-[10px] font-bold text-low-em uppercase tracking-wider">Journey funnel</p>
              <div className="space-y-2">
                {report.funnel.map(step => (
                  <BarRow key={step.label} label={step.label} value={Math.log10(step.value + 1)} max={Math.log10(maxFunnel + 1)} display={fmtK(step.value)} />
                ))}
              </div>
              <p className="text-[10px] text-low-em pt-1">
                {report.demosBooked.toLocaleString()} demos booked — Jordan was one of them.
              </p>
            </div>
          </div>

          <p className="text-[10px] text-low-em text-center pb-2">
            Projected from the decision-engine simulation · seeded and reproducible
          </p>

        </div>
      </div>

      {lightbox && (
        <AdLightbox
          imageUrl={lightbox.imageUrl}
          axis={lightbox.axis}
          cta={lightbox.cta}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
