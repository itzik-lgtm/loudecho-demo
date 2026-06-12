import { useState, useEffect, useRef, useMemo } from 'react';
import SceneHeader from '../components/SceneHeader';
import DecisionFunnel from '../components/DecisionFunnel';
import PublisherPageMock from '../components/PublisherPageMock';
import AdLightbox from '../components/AdLightbox';
import { generateDecisionStream, accumulateMetrics } from '../data/decisions';
import { generateVariants } from '../data/variants';
import { ASPECT_RATIOS } from '../data/adFormats';
import { PERSONA, TOUCHPOINTS } from '../data/journey';

const STAGE_LABELS = ['Awareness', 'Consideration', 'Action'];

// 7-second serving burst, then the feed settles into results
const INTERLUDE_MS = 7000;
const INTERLUDE_EVENTS = 14;

const VERTICAL_TEMPLATE = { Finance: 'finance', Sports: 'sports' };
const articleTemplate = vertical => VERTICAL_TEMPLATE[vertical] ?? 'news';

const OUTCOME_STYLES = {
  impression: 'bg-info-bg text-brand-text',
  click:      'bg-success-bg text-success',
  'no-fill':  'bg-red-50 text-fail',
};

function SignalChips({ signals, compact = false }) {
  const chips = [
    { icon: '📄', label: signals.topic },
    { icon: '👥', label: signals.cohort?.split(' · ')[0] },
    { icon: '📍', label: signals.geo },
    { icon: '💻', label: signals.device },
    { icon: '🕐', label: signals.recency },
  ].filter(c => c.label);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {chips.map((c, i) => (
        <span key={i} className={`${compact ? 'text-[9px] px-1.5' : 'text-[10px] px-2'} py-0.5 rounded-full bg-gray-100 text-med-em flex items-center gap-1`}>
          <span>{c.icon}</span>
          <span className="font-medium">{c.label}</span>
        </span>
      ))}
    </div>
  );
}

/** Decision row — expandable into the full trace (publisher page + funnel). */
function DecisionCard({ event, expanded, onToggle, onZoom }) {
  const isNoFill = event.outcome === 'no-fill';
  return (
    <div
      onClick={onToggle}
      className={`row-fade-in rounded-xl border bg-white transition-all cursor-pointer ${
        expanded ? 'border-brand shadow-md' : isNoFill ? 'border-red-100 hover:border-red-200' : 'border-line hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-4 px-4 py-2.5">
        <div className="w-14 shrink-0">
          {event.winner ? (
            <div
              className="rounded-md overflow-hidden border border-line bg-gray-50"
              style={{ aspectRatio: ASPECT_RATIOS[event.winner.axis] ?? '300 / 250', maxHeight: 48 }}
              onClick={e => { e.stopPropagation(); onZoom(event.winner); }}
            >
              <img src={event.winner.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ) : (
            <div className="h-10 rounded-md border border-dashed border-red-200 bg-red-50/50 flex items-center justify-center">
              <span className="text-[8px] font-bold text-fail">NO FILL</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs text-dark truncate">
            <span className="font-bold">{event.article.publisher}</span>
            <span className="text-low-em"> · </span>
            <span className="font-medium text-med-em">{event.article.title}</span>
          </p>
          <SignalChips signals={event.signals} compact />
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${OUTCOME_STYLES[event.outcome]}`}>
            {event.outcome}
          </span>
          <span className="text-[10px] text-low-em tabular-nums">{event.latencyMs}ms</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-line-soft px-4 py-4 fade-in" onClick={e => e.stopPropagation()}>
          <div className="flex gap-5 items-start">
            {event.winner && (
              <div className="w-[42%] shrink-0">
                <PublisherPageMock
                  template={articleTemplate(event.article.vertical)}
                  article={{ ...event.article, byline: `${event.article.publisher} · ${event.article.topic}` }}
                  creative={{ imageUrl: event.winner.imageUrl, axis: event.winner.axis, cta: event.winner.cta ?? 'Learn more' }}
                  onAdClick={() => onZoom(event.winner)}
                />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-low-em uppercase tracking-wider mb-1.5">Decision trace</p>
                <DecisionFunnel funnel={event.funnel} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-med-em leading-relaxed">{event.reason}</p>
                {event.winner && (
                  <p className="text-[10px] text-low-em">
                    Variant #{event.winner.id} · {event.winner.axis} · "{event.winner.tagline}"
                  </p>
                )}
                <p className="text-[10px] text-low-em font-mono">{event.article.url}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const fmtK = n => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const NO_FILL_WEIGHTS = [
  ['No matching variant', 0.40],
  ['Frequency cap',       0.25],
  ['Policy filter',       0.20],
  ['Latency timeout',     0.15],
];

/** Live serving totals derived from the ticking decision counter. */
function computeLiveStats(decided, sampleMetrics, poolSize) {
  // Fill rate from the sample, with a subtle live wobble
  const fillRate = Math.min(0.95, Math.max(0.7, sampleMetrics.fillRate + Math.sin(decided / 3700) * 0.012));
  const filled = Math.round(decided * fillRate);
  const noFill = decided - filled;
  // Variant coverage grows toward the pool size as volume accumulates
  const distinct = Math.min(poolSize, Math.round(poolSize * 0.85 * (1 - Math.exp(-decided / (poolSize * 150)))));
  const p50 = 51 + Math.round(Math.sin(decided / 53) * 2);
  const p95 = 83 + Math.round(Math.sin(decided / 91) * 3);
  // Topic distribution: scale the sample shares to the live filled total
  const sampleTotal = Object.values(sampleMetrics.topicCounts).reduce((a, b) => a + b, 0) || 1;
  const topics = Object.entries(sampleMetrics.topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([topic, n]) => [topic, Math.round(filled * (n / sampleTotal))]);
  const noFillReasons = NO_FILL_WEIGHTS.map(([reason, w]) => [reason, Math.round(noFill * w)]);
  return { fillRate, filled, distinct, p50, p95, topics, noFillReasons };
}

/** Aggregate serving results — live totals that climb with the counter. */
function ServingResults({ stats }) {
  const maxTopic = stats.topics[0]?.[1] ?? 1;
  return (
    <div className="fade-in glass-card rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Fill rate',         value: `${(stats.fillRate * 100).toFixed(1)}%` },
          { label: 'Filled',            value: fmtK(stats.filled) },
          { label: 'Distinct variants', value: stats.distinct },
          { label: 'p50 latency',       value: `${stats.p50}ms` },
          { label: 'p95 latency',       value: `${stats.p95}ms` },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-lg border border-line px-3 py-2">
            <p className="text-[9px] font-semibold text-low-em uppercase tracking-wider">{m.label}</p>
            <p className="text-sm font-bold text-dark tabular-nums mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {stats.topics.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-semibold text-low-em uppercase tracking-wider">Impressions by topic</p>
            {stats.topics.map(([topic, n]) => (
              <div key={topic} className="flex items-center gap-2">
                <span className="text-[10px] text-med-em w-24 truncate shrink-0">{topic}</span>
                <div className="flex-1 h-1.5 rounded-full bg-line-soft overflow-hidden">
                  <div className="h-full bg-brand rounded-full transition-all duration-700" style={{ width: `${(n / maxTopic) * 100}%` }} />
                </div>
                <span className="text-[10px] font-bold text-dark tabular-nums w-9 text-right shrink-0">{fmtK(n)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-1.5">
          <p className="text-[9px] font-semibold text-low-em uppercase tracking-wider">No-fill reasons</p>
          {stats.noFillReasons.map(([reason, n]) => (
            <div key={reason} className="flex items-center justify-between">
              <span className="text-[10px] text-med-em truncate">{reason}</span>
              <span className="text-[10px] font-bold text-fail tabular-nums">{fmtK(n)}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-low-em">Live totals — the feed below is a sample; click any row to drill into the full trace.</p>
    </div>
  );
}

function Touchpoint({ tp, onZoom }) {
  return (
    <div className="fade-in-up flex gap-5">
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div className="w-8 h-8 rounded-full bg-dark text-white flex items-center justify-center text-xs font-bold">
          {tp.id}
        </div>
        <div className="flex-1 w-px bg-line mt-2" />
      </div>

      <div className="flex-1 min-w-0 pb-8 space-y-3">
        <div className="flex items-center gap-2.5">
          <h3 className="font-bold text-dark text-lg">{tp.title}</h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-low-em">{tp.stage}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tp.cohortStyle}`}>
            👥 {tp.cohort}
          </span>
        </div>

        <div className="grid grid-cols-[1.2fr,1fr] gap-5 items-start">
          <PublisherPageMock
            template={tp.template}
            article={tp.article}
            creative={tp.creative}
            onAdClick={() => onZoom(tp.creative)}
          />

          <div className="space-y-3">
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-low-em uppercase tracking-wider mb-1.5">Detected signals</p>
                <SignalChips signals={tp.signals} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-low-em uppercase tracking-wider mb-1.5">Decision trace</p>
                <DecisionFunnel funnel={tp.funnel} compact />
              </div>
              <div className="rounded-lg bg-info-bg/60 border border-brand/15 px-3 py-2.5">
                <p className="text-xs text-dark leading-relaxed">
                  <span className="font-bold text-brand-text">Why this ad: </span>{tp.reason}
                </p>
              </div>
            </div>

            <div className={`rounded-xl px-4 py-3 flex items-center gap-2.5 ${tp.outcome.style}`}>
              <span className="font-bold text-sm">{tp.outcome.icon}</span>
              <span className="text-sm font-semibold">{tp.outcome.label}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Scene3LiveDecisions({ onNext, campaignConfig }) {
  const launchPool = useMemo(() => {
    if (campaignConfig?.launchPool?.length) return campaignConfig.launchPool;
    // Presenter jumped straight here — use the recommended bucket as a stand-in pool
    return generateVariants(247, 0).filter(v => v.bucket === 'recommended');
  }, [campaignConfig]);

  const [phase, setPhase] = useState('serving');   // serving | results | journey
  const [visibleEvents, setVisibleEvents] = useState(0);
  const [decidedCount, setDecidedCount] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [revealed, setRevealed] = useState(1);
  const [lightbox, setLightbox] = useState(null);
  const decidedRef = useRef(0);

  const events = useMemo(
    () => generateDecisionStream({ vertical: 'Finance', launchPool, count: INTERLUDE_EVENTS, seed: 42 }),
    [launchPool]
  );

  const visible = events.slice(0, visibleEvents);
  const metrics = useMemo(() => accumulateMetrics(visible), [visible]);

  // Serving burst: stream rows while the big counter ticks at engine speed
  useEffect(() => {
    if (phase !== 'serving') return;
    const start = Date.now();
    const interval = setInterval(() => {
      const t = Date.now() - start;
      setVisibleEvents(Math.min(INTERLUDE_EVENTS, Math.floor((t / INTERLUDE_MS) * INTERLUDE_EVENTS)));
      // ~12.4k decisions/sec with a little jitter
      decidedRef.current += Math.round(1240 + Math.random() * 300);
      setDecidedCount(decidedRef.current);
      if (t >= INTERLUDE_MS) {
        clearInterval(interval);
        setVisibleEvents(INTERLUDE_EVENTS);
        setPhase('results');
      }
    }, 100);
    return () => clearInterval(interval);
  }, [phase]);

  // Keep the counter ticking slowly while results are reviewed — it's live
  useEffect(() => {
    if (phase !== 'results') return;
    const interval = setInterval(() => {
      decidedRef.current += Math.round(1240 + Math.random() * 300);
      setDecidedCount(decidedRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const complete = revealed >= TOUCHPOINTS.length;
  const isJourney = phase === 'journey';

  return (
    <div className="flex flex-col h-full overflow-hidden fade-in">
      <SceneHeader
        title={isJourney ? 'One user. Three contexts. Three decisions.' : 'Live Decisions'}
        subtitle={isJourney
          ? 'Follow Jordan across a single day — and watch the engine adapt at every touchpoint.'
          : 'Your launch pool is serving. Every impression decided in ~50ms — and every decision explained.'}
        badge={isJourney ? (complete ? 'Demo booked' : undefined) : (phase === 'results' ? 'Serving healthy' : undefined)}
        cta={
          isJourney
            ? (complete && onNext ? { label: 'Launch campaign →', onClick: () => onNext(campaignConfig) } : undefined)
            : (phase === 'results' ? { label: "Follow one user's journey →", onClick: () => setPhase('journey') } : undefined)
        }
      />

      <div className="flex-1 overflow-y-auto">

        {/* ── Serving + results ── */}
        {!isJourney && (
          <div className="max-w-3xl mx-auto px-8 py-6 space-y-4">
            <div className="rounded-2xl bg-dark text-white px-6 py-4 flex items-center gap-5">
              <span className="text-4xl font-black tabular-nums leading-none" style={{ minWidth: '6ch' }}>
                {decidedCount.toLocaleString()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">decisions made since you started watching</p>
                <p className="text-xs text-white/50">{launchPool.length} approved variants serving live</p>
              </div>
              <div className="flex-1" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </div>

            {/* Aggregate results land when the burst settles — totals climb live */}
            {phase === 'results' && (
              <ServingResults stats={computeLiveStats(decidedCount, metrics, launchPool.length)} />
            )}

            <div className="space-y-1.5">
              {visible.map(e => (
                <DecisionCard
                  key={e.id}
                  event={e}
                  expanded={expandedId === e.id}
                  onToggle={() => phase === 'results' && setExpandedId(id => (id === e.id ? null : e.id))}
                  onZoom={setLightbox}
                />
              ))}
            </div>

            <div className="flex justify-center pt-1 pb-4">
              <button
                onClick={() => setPhase('journey')}
                className="text-xs font-semibold text-dark border border-dark px-4 py-2 rounded-lg hover:bg-dark hover:text-white transition-colors"
              >
                Follow one user's journey →
              </button>
            </div>
          </div>
        )}

        {/* ── Journey drill-down ── */}
        {isJourney && (
          <div className="max-w-5xl mx-auto px-8 py-6 space-y-6 fade-in">
            <button
              onClick={() => setPhase('results')}
              className="text-xs font-semibold text-med-em hover:text-dark transition-colors"
            >
              ← Back to live feed
            </button>

            {/* Persona card */}
            <div className="glass-card rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-dark text-white flex items-center justify-center text-sm font-bold shrink-0">
                {PERSONA.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-dark">{PERSONA.name}, {PERSONA.age} — {PERSONA.location}</p>
                <p className="text-xs text-med-em">{PERSONA.title} · {PERSONA.company}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {STAGE_LABELS.map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                      i < revealed ? 'bg-brand text-white' : 'bg-gray-100 text-low-em'
                    }`}>
                      {label}
                    </span>
                    {i < STAGE_LABELS.length - 1 && <span className="w-3 h-px bg-line" />}
                  </div>
                ))}
              </div>
            </div>

            {TOUCHPOINTS.slice(0, revealed).map(tp => (
              <Touchpoint key={tp.id} tp={tp} onZoom={setLightbox} />
            ))}

            {!complete && (
              <div className="flex justify-center pb-4">
                <button
                  onClick={() => setRevealed(r => Math.min(r + 1, TOUCHPOINTS.length))}
                  className="bg-dark text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  Next touchpoint →
                </button>
              </div>
            )}
          </div>
        )}
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
