import { useState, useEffect, useRef, useMemo, useReducer } from 'react';
import { generateVariants, AXES, REASON_TYPES } from '../data/variants';
import { generateVariant } from '../lib/generateVariant';
import VariantCard from '../components/VariantCard';
import JudgePanel from '../components/JudgePanel';
import MasonryGrid from '../components/MasonryGrid';

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_VARIANTS = generateVariants(247, 0);
const TOTAL = BASE_VARIANTS.length;
const STREAM_DURATION = 10000;
const JUDGE_DURATION  = 6000;

// Seeded shuffle for display order — the mosaic spec requires formats to be
// interleaved across the layout, never clustered by size.
function seededShuffle(arr, seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
const DISPLAY_VARIANTS = seededShuffle(BASE_VARIANTS, 7);
const DISPLAY_INDEX = new Map(DISPLAY_VARIANTS.map((v, i) => [v.id, i]));

const uniq = arr => ['All', ...[...new Set(arr.filter(Boolean))].sort()];
const TOPICS    = uniq(BASE_VARIANTS.map(v => v.topic));

// Signal value extractor per signal type (mirrors SIGNAL_BADGE_MAP in VariantCard)
const SIGNAL_GETTER = {
  'Audience':          v => v.signalData?.audience,
  'User journey':      v => v.signalData?.journeyStage?.label,
  'Geo / location':    v => v.signalData?.geoLocation,
  'Time / calendar':   v => v.signalData?.timeCalendar,
  'Weather':           v => v.signalData?.weather,
  'Device':            v => v.signalData?.device?.type,
  'Product / catalog': v => v.signalData?.productCatalog,
  'External data':     v => v.signalData?.externalData,
};
// Pre-compute unique values per signal type
const SIGNAL_OPTIONS = Object.fromEntries(
  Object.entries(SIGNAL_GETTER).map(([type, get]) => [type, uniq(BASE_VARIANTS.map(get))])
);

// ── Empty state ───────────────────────────────────────────────────────────────

function FilterEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
      <span className="text-3xl">⊘</span>
      <p className="text-sm font-semibold text-gray-500">No variants match the current filters</p>
      <p className="text-xs text-gray-400">Try adjusting or clearing a filter above</p>
    </div>
  );
}

// ── Cluster helpers ───────────────────────────────────────────────────────────

function buildClusters(variants, variantOverrides, resolutions) {
  const map = {};
  for (const v of variants) {
    const bucket = variantOverrides[v.id]?.bucket ?? v.bucket;
    if (bucket !== 'needs-review') continue;
    const resolution = resolutions[v.id];
    const primaryType = v.reasons?.[0]?.type;
    if (!primaryType) continue;
    if (!map[primaryType]) map[primaryType] = { type: primaryType, all: [], pending: [] };
    map[primaryType].all.push(v);
    if (!resolution || resolution === 'pending') map[primaryType].pending.push(v);
  }
  return Object.values(map).sort((a, b) => b.all.length - a.all.length);
}

const mergeWithOverride = (v, overrides) => overrides[v.id] ? { ...v, ...overrides[v.id] } : v;
const toggleSet = (k) => prev => { const s = new Set(prev); s.has(k) ? s.delete(k) : s.add(k); return s; };

// ── Review domain state ───────────────────────────────────────────────────────
// One reducer owns every piece of state the review flow mutates together:
// per-variant resolutions, per-variant overrides (regen results, bucket moves),
// cluster feedback, selection, and regeneration progress.

const INITIAL_REVIEW = {
  resolutions: {},          // id → 'approved' | 'blocked' | 'archived'
  overrides: {},            // id → partial variant patch
  bulkApproved: false,
  clusterFeedback: {},      // reason type → feedback text
  selectedInCluster: new Set(),
  regeneratingClusters: new Set(),
};

function reviewReducer(state, action) {
  switch (action.type) {
    case 'resolve':
      return { ...state, resolutions: { ...state.resolutions, [action.id]: action.state } };
    case 'resolveMany':
      return { ...state, resolutions: { ...state.resolutions, ...action.entries } };
    case 'bulkApprove':
      return { ...state, bulkApproved: true, resolutions: { ...state.resolutions, ...action.entries } };
    case 'patchOverride':
      return {
        ...state,
        overrides: { ...state.overrides, [action.id]: { ...(state.overrides[action.id] ?? {}), ...action.patch } },
      };
    case 'clusterFeedback':
      return { ...state, clusterFeedback: { ...state.clusterFeedback, [action.clusterType]: action.value } };
    case 'toggleSelected': {
      const s = new Set(state.selectedInCluster);
      s.has(action.id) ? s.delete(action.id) : s.add(action.id);
      return { ...state, selectedInCluster: s };
    }
    case 'clusterRegenStart': {
      const s = new Set(state.regeneratingClusters);
      s.add(action.clusterType);
      return { ...state, regeneratingClusters: s };
    }
    case 'clusterRegenComplete': {
      const s = new Set(state.regeneratingClusters);
      s.delete(action.clusterType);
      return {
        ...state,
        regeneratingClusters: s,
        overrides: { ...state.overrides, ...action.overrides },
        resolutions: { ...state.resolutions, ...action.resolutions },
        selectedInCluster: new Set(),
      };
    }
    default:
      return state;
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Scene2GenerateJudgeReview({ onNext, campaignConfig }) {
  const selectedSignalTypes = campaignConfig?.selectedSignalTypes ?? [];
  const isJourneyMode = selectedSignalTypes.includes('User journey');

  // Phase
  const [phase, setPhase]             = useState('generating');
  const [visibleCount, setVisibleCount] = useState(0);
  const [judgeProgress, setJudgeProgress] = useState(0);
  const [elapsed, setElapsed]         = useState(0);

  // Review domain (one reducer; names preserved for downstream reads)
  const [review, dispatch] = useReducer(reviewReducer, INITIAL_REVIEW);
  const { resolutions, bulkApproved, clusterFeedback, selectedInCluster, regeneratingClusters } = review;
  const variantOverrides = review.overrides;

  // UI-only state
  const [activeTab, setActiveTab]     = useState('recommended');
  const [openCluster, setOpenCluster] = useState(null);
  const [filters, setFilters]         = useState({ topic: 'All' });
  const [signalFilters, setSignalFilters] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [openBlockedGroups, setOpenBlockedGroups] = useState(new Set());
  const [showLaunchOverlay, setShowLaunchOverlay] = useState(false);

  const startRef = useRef(Date.now());

  // Streaming
  useEffect(() => {
    startRef.current = Date.now();
    let v = 0;
    const interval = setInterval(() => {
      const t = Date.now() - startRef.current;
      const progress = Math.min(t / STREAM_DURATION, 1);
      const eased = progress;
      const target = Math.floor(eased * TOTAL);
      if (target > v) { setVisibleCount(target); v = target; }
      setElapsed(Math.floor(t / 1000));
      if (progress >= 1) {
        clearInterval(interval);
        setVisibleCount(TOTAL);
        setPhase('judging');
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);

  // Judging
  useEffect(() => {
    if (phase !== 'judging') return;
    const start = Date.now();
    const interval = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / JUDGE_DURATION) * 100, 100);
      setJudgeProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setPhase('ready');
      }
    }, 50);
    return () => clearInterval(interval);
  }, [phase]);

  // Auto-switch to Recommended when ready
  useEffect(() => {
    if (phase === 'ready') setActiveTab('recommended');
  }, [phase]);

  // Derived variant list (streaming slice, format-interleaved display order)
  const displayVariants = phase === 'generating' ? DISPLAY_VARIANTS.slice(0, visibleCount) : DISPLAY_VARIANTS;

  // Live bucket counts — zero during generation, trickle up during judging, subtract resolved in ready
  const liveCounts = useMemo(() => {
    if (phase === 'generating') return { recommended: 0, 'needs-review': 0, blocked: 0 };
    if (phase === 'judging') {
      const judged = DISPLAY_VARIANTS.slice(0, Math.floor((judgeProgress / 100) * TOTAL));
      const counts = { recommended: 0, 'needs-review': 0, blocked: 0 };
      for (const v of judged) counts[v.bucket] = (counts[v.bucket] ?? 0) + 1;
      return counts;
    }
    if (phase !== 'ready') {
      const counts = { recommended: 0, 'needs-review': 0, blocked: 0 };
      for (const v of displayVariants) counts[v.bucket] = (counts[v.bucket] ?? 0) + 1;
      return counts;
    }
    let recommended = 0, needsReview = 0, blocked = 0;
    for (const v of BASE_VARIANTS) {
      const bucket = variantOverrides[v.id]?.bucket ?? v.bucket;
      const res    = resolutions[v.id];
      const pending = !res || res === 'pending';
      if (res === 'blocked') { blocked++; continue; }  // explicitly declined → blocked tab
      if (!pending) continue;                           // approved/archived → out of all counts
      if (bucket === 'recommended')  recommended++;
      else if (bucket === 'needs-review') needsReview++;
      else if (bucket === 'blocked') blocked++;
    }
    return { recommended, 'needs-review': needsReview, blocked };
  }, [displayVariants, judgeProgress, phase, resolutions, variantOverrides]);

  // Clusters (ready phase only)
  const clusters = useMemo(() =>
    phase === 'ready' ? buildClusters(BASE_VARIANTS, variantOverrides, resolutions) : [],
    [phase, variantOverrides, resolutions]
  );
  const pendingClusters = useMemo(() => clusters.filter(c => c.pending.length > 0), [clusters]);

  // Pool stats
  const approvedCount = useMemo(() =>
    Object.values(resolutions).filter(r => r === 'approved').length,
    [resolutions]
  );
  // Auto-open first pending cluster after bulk approve
  useEffect(() => {
    if (!bulkApproved || pendingClusters.length === 0) return;
    if (!openCluster || !pendingClusters.find(c => c.type === openCluster)) {
      setOpenCluster(pendingClusters[0].type);
    }
  }, [bulkApproved, pendingClusters]);

  // Auto-advance cluster when current one empties
  useEffect(() => {
    if (!openCluster) return;
    const current = clusters.find(c => c.type === openCluster);
    if (current && current.pending.length === 0) {
      const next = pendingClusters.find(c => c.type !== openCluster);
      setOpenCluster(next ? next.type : null);
    }
  }, [clusters, openCluster, pendingClusters]);

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const setSignalFilter = (type, val) => setSignalFilters(prev => ({ ...prev, [type]: val }));

  const applyFilters = vs => vs.filter(v => {
    if (filters.topic    !== 'All' && v.topic           !== filters.topic)    return false;
    for (const [type, val] of Object.entries(signalFilters)) {
      if (val === 'All') continue;
      const getter = SIGNAL_GETTER[type];
      if (getter && getter(v) !== val) return false;
    }
    return true;
  });

  // ── Actions ──────────────────────────────────────────────────────────────

  const setResolution = (id, state) =>
    dispatch({ type: 'resolve', id, state });

  const handleBulkApprove = () => {
    const newRes = {};
    for (const v of BASE_VARIANTS) {
      const bucket = variantOverrides[v.id]?.bucket ?? v.bucket;
      const existing = resolutions[v.id];
      if (bucket === 'recommended' && (!existing || existing === 'pending')) {
        newRes[v.id] = 'approved';
      }
    }
    dispatch({ type: 'bulkApprove', entries: newRes });
    setActiveTab('launch-pool');
  };

  const handleResolveCard = (variantId, action, prompt) => {
    if (action === 'regenerate') {
      handleRegenCard(variantId, prompt);
    } else {
      setResolution(variantId, action === 'approve' ? 'approved' : action === 'block' ? 'blocked' : 'archived');
    }
  };

  const handleBulkCluster = (type, action) => {
    const c = clusters.find(cl => cl.type === type);
    if (!c) return;
    const newRes = {};
    for (const v of c.pending) {
      newRes[v.id] = action === 'approve' ? 'approved' : action === 'block' ? 'blocked' : 'archived';
    }
    dispatch({ type: 'resolveMany', entries: newRes });
  };

  const handleRegenCard = async (variantId, prompt) => {
    const original = BASE_VARIANTS.find(v => v.id === variantId);
    if (!original) return;

    dispatch({ type: 'patchOverride', id: variantId, patch: { regenerating: true } });

    try {
      const result = await generateVariant({
        sourceVariantId: variantId,
        sourceImageUrl:  original.imageUrl,
        prompt:          prompt ?? '',
        context: {
          sourceAxis:        original.axis,
          campaignId:        'ramp-q2-2026',
          pageId:            'generate-review',
          selectedChangeType: 'Background swap',
          brandConstraints:  'Ramp brand — bold, challenger tone',
        },
      });
      dispatch({
        type: 'patchOverride',
        id: variantId,
        // bucket/reasons intentionally unchanged — user must still approve
        patch: { regenerating: false, imageUrl: result.imageUrl, isNew: true },
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[handleRegenCard]', err);
      dispatch({ type: 'patchOverride', id: variantId, patch: { regenerating: false } });
    }
  };

  const handleRegenCluster = (type, scope) => {
    const feedback = clusterFeedback[type];
    if (!feedback?.trim()) return;
    const c = clusters.find(cl => cl.type === type);
    if (!c) return;

    const targets = scope === 'selected'
      ? c.pending.filter(v => selectedInCluster.has(v.id))
      : c.pending;
    if (targets.length === 0) return;

    dispatch({ type: 'clusterRegenStart', clusterType: type });
    setTimeout(() => {
      const overrides = {};
      const newRes = {};
      targets.forEach((v, i) => {
        if (i % 3 !== 2) {
          overrides[v.id] = { bucket: 'recommended', reasons: [] };
          newRes[v.id] = 'approved';
        }
      });
      dispatch({ type: 'clusterRegenComplete', clusterType: type, overrides, resolutions: newRes });
    }, 4000);
  };

  const handleSendToSimulation = () => {
    setShowLaunchOverlay(true);
    const launchPool = BASE_VARIANTS.filter(v => resolutions[v.id] === 'approved');
    setTimeout(() => onNext({ ...campaignConfig, launchPool }), 1800);
  };

  const toggleCardInCluster = (id) => dispatch({ type: 'toggleSelected', id });

  // ── Render ────────────────────────────────────────────────────────────────

  const secs = String(elapsed % 60).padStart(2, '0');
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');

  const poolLabel = approvedCount > 0
    ? `Launch pool: ${approvedCount} approved`
    : 'Launch pool: 0';

  const tabsLocked = phase !== 'ready';

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Page header ── */}
      <div className="glass-card-solid px-6 py-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-bold text-dark text-xl leading-tight">
              {phase === 'generating' ? 'Generating variants…' :
               phase === 'judging'    ? 'Running AI judges…' :
               'Generate & Review'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {phase === 'generating'
                ? `${visibleCount} of ${TOTAL} variants generated · ${mins}:${secs}`
                : phase === 'judging'
                ? `Scoring ${TOTAL} variants for brand safety, compliance, and quality…`
                : `${TOTAL} variants scored and bucketed. Approve the launch pool, or override any call.`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Pool counter */}
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              approvedCount > 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-50 text-gray-400 border-gray-200'
            }`}>
              {approvedCount > 0 ? '✓' : '○'}
              <span>{poolLabel}</span>
            </div>

            {/* Judging progress */}
            {phase === 'judging' && (
              <div className="flex items-center gap-2 w-40">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-brand rounded-full transition-all duration-75"
                    style={{ width: `${judgeProgress}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{Math.round(judgeProgress)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar + filters ── */}
      <div className="glass-card-solid border-b border-gray-200 px-6 pt-3 pb-0 shrink-0">
        {/* Tabs */}
        <div className={`flex gap-1 ${tabsLocked ? 'pointer-events-none' : ''}`}>
          {[
            { key: 'recommended',  label: 'Recommended',  count: liveCounts['recommended'] ?? 0, color: tabsLocked ? 'text-gray-400' : activeTab === 'recommended'  ? 'text-emerald-700' : 'text-emerald-600', locked: true  },
            { key: 'needs-review', label: 'Needs Review', count: liveCounts['needs-review'] ?? 0, color: tabsLocked ? 'text-gray-400' : activeTab === 'needs-review' ? 'text-amber-700'   : 'text-amber-600',   locked: true  },
            { key: 'blocked',      label: 'Blocked',      count: liveCounts['blocked']       ?? 0, color: tabsLocked ? 'text-gray-400' : activeTab === 'blocked'      ? 'text-red-700'     : 'text-red-600',     locked: true  },
            { key: 'launch-pool',  label: 'Launch Pool',  count: approvedCount,                    color: activeTab === 'launch-pool'  ? 'text-violet-700' : approvedCount > 0 ? 'text-violet-600' : 'text-gray-400', locked: false },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => !(tab.locked && tabsLocked) && setActiveTab(tab.key)}
              className={`relative px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                activeTab === tab.key && !(tab.locked && tabsLocked)
                  ? 'border-dark text-dark'
                  : 'border-transparent hover:border-gray-200'
              } ${tab.locked && tabsLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={tab.color}>
                {tab.label}{' '}
                <span key={tab.count} className="count-pop inline-block tabular-nums">
                  ({tab.count})
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 py-2 flex-wrap">
          {/* Topic filter */}
          {[{ key: 'topic', label: 'Topic', options: TOPICS }].map(({ key, label, options }) => {
            const active = filters[key] !== 'All';
            return (
              <div key={key} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 transition-all ${
                active ? 'bg-dark border-dark' : 'bg-white border-gray-200'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-white/60' : 'text-gray-400'}`}>{label}</span>
                <select
                  value={filters[key]}
                  onChange={e => setFilter(key, e.target.value)}
                  className={`text-xs font-semibold bg-transparent border-none outline-none cursor-pointer ${active ? 'text-white' : 'text-gray-700'}`}
                >
                  {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            );
          })}

          {/* Signal-based filters — one pill per selected signal type */}
          {selectedSignalTypes.filter(t => SIGNAL_GETTER[t]).map(type => {
            const val = signalFilters[type] ?? 'All';
            const active = val !== 'All';
            const options = SIGNAL_OPTIONS[type] ?? ['All'];
            return (
              <div key={type} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 transition-all ${
                active ? 'bg-brand/10 border-brand/40' : 'bg-white border-gray-200'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-brand-text' : 'text-gray-400'}`}>{type}</span>
                <select
                  value={val}
                  onChange={e => setSignalFilter(type, e.target.value)}
                  className={`text-xs font-semibold bg-transparent border-none outline-none cursor-pointer ${active ? 'text-brand-text' : 'text-gray-700'}`}
                >
                  {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            );
          })}

        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── RECOMMENDED TAB ── */}
        {activeTab === 'recommended' && (
          <div className="p-4 space-y-4">
            {/* Spectacle banner — live counter during generation, verdict tallies during judging */}
            {phase !== 'ready' && (
              <div className="fade-in rounded-2xl bg-dark text-white px-6 py-4 flex items-center gap-5">
                <span className="text-5xl font-black tabular-nums leading-none" style={{ minWidth: '3ch' }}>
                  {phase === 'generating' ? visibleCount : Math.floor((judgeProgress / 100) * TOTAL)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    {phase === 'generating' ? 'variants generated from one seed creative' : 'variants scored by 4 AI judges'}
                  </p>
                  <p className="text-xs text-white/50">
                    {phase === 'generating'
                      ? `4 IAB formats · every signal segment · ${mins}:${secs}`
                      : 'brand voice · visual QA · compliance · predicted performance'}
                  </p>
                </div>
                <div className="flex-1" />
                {phase === 'generating' ? (
                  <div className="w-44 h-1.5 rounded-full bg-white/10 overflow-hidden shrink-0">
                    <div className="h-full bg-brand rounded-full transition-all duration-200" style={{ width: `${(visibleCount / TOTAL) * 100}%` }} />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-sm font-bold tabular-nums shrink-0">
                    <span className="text-emerald-400">✓ {liveCounts['recommended']}</span>
                    <span className="text-amber-400">⚠ {liveCounts['needs-review']}</span>
                    <span className="text-red-400">✕ {liveCounts['blocked']}</span>
                  </div>
                )}
              </div>
            )}

            {/* Judge panel */}
            {phase === 'judging' && (
              <JudgePanel judgeProgress={judgeProgress} variants={BASE_VARIANTS} />
            )}

            {/* Bulk approve banner */}
            {phase === 'ready' && !bulkApproved && (
              <div className="fade-in rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-5">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-emerald-600 text-lg font-bold">✓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-dark text-base">
                    {liveCounts['recommended']} recommended variants are ready for the launch pool
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    These passed all brand safety, compliance, and quality checks.
                  </p>
                </div>
                <button
                  onClick={handleBulkApprove}
                  className="shrink-0 bg-dark text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Approve recommended launch pool
                </button>
              </div>
            )}

            {phase === 'ready' && bulkApproved && (
              <div className="fade-in rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-2.5 flex items-center gap-2">
                <span className="text-emerald-600 font-bold text-sm">✓</span>
                <span className="text-sm text-emerald-700 font-medium">{approvedCount} variants approved into launch pool</span>
              </div>
            )}

            {/* Mosaic — formats interleaved; journey mode groups by stage */}
            {(() => {
              // During generation/judging the full set streams in; verdicts land
              // live as the judges sweep. At ready the tab narrows to recommended.
              const pool = applyFilters(
                phase === 'ready'
                  ? DISPLAY_VARIANTS.filter(v => {
                      const bucket = variantOverrides[v.id]?.bucket ?? v.bucket;
                      const res = resolutions[v.id];
                      return bucket === 'recommended' && (!res || res === 'pending');
                    })
                  : displayVariants
              );

              const judgedCount = phase === 'judging' ? Math.floor((judgeProgress / 100) * TOTAL) : 0;

              const renderReviewCard = v => {
                const verdict = phase === 'judging' && (DISPLAY_INDEX.get(v.id) ?? Infinity) < judgedCount ? v.bucket : null;
                return (
                  <div className="relative">
                    <VariantCard
                      variant={mergeWithOverride(v, variantOverrides)}
                      showBucket={false}
                      resolutionState={resolutions[v.id]}
                      onResolve={(phase === 'ready' && (!resolutions[v.id] || resolutions[v.id] === 'pending')) ? (action, prompt) => handleResolveCard(v.id, action, prompt) : undefined}
                      resolveActions={['approve', 'block', 'regenerate']}
                      selectedSignalTypes={selectedSignalTypes}
                    />
                    {verdict && (
                      <div className={`card-pop absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-md ${
                        verdict === 'recommended' ? 'bg-emerald-500' : verdict === 'needs-review' ? 'bg-amber-400' : 'bg-red-500'
                      }`}>
                        {verdict === 'recommended' ? '✓' : verdict === 'needs-review' ? '!' : '✕'}
                      </div>
                    )}
                  </div>
                );
              };

              if (isJourneyMode) {
                const TOUCHPOINTS = [
                  { label: 'Stage 1: Awareness',     index: 0 },
                  { label: 'Stage 2: Consideration', index: 1 },
                  { label: 'Stage 3: Action',        index: 2 },
                ];
                const stages = TOUCHPOINTS
                  .map(({ label, index }) => ({
                    label,
                    index,
                    vs: pool.filter(v => (v.signalData?.journeyStage?.index ?? 0) === index),
                  }))
                  .filter(s => s.vs.length > 0);
                if (stages.length === 0 && phase === 'ready') return <FilterEmptyState />;
                return stages.map(({ label, index, vs }) => {
                  const stageKey = `stage:${index}`;
                  const stageCollapsed = collapsedGroups.has(stageKey);
                  return (
                    <div key={index} className="space-y-3">
                      <button
                        onClick={() => setCollapsedGroups(toggleSet(stageKey))}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors group"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          className={`shrink-0 text-gray-400 group-hover:text-gray-200 transition-transform ${stageCollapsed ? '-rotate-90' : ''}`}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        <span className="text-sm font-bold text-white tracking-wide">{label}</span>
                        <div className="flex-1" />
                        <span className="text-xs text-gray-400 font-medium">{vs.length} variants</span>
                      </button>
                      {!stageCollapsed && (
                        <MasonryGrid items={vs} renderItem={renderReviewCard} />
                      )}
                    </div>
                  );
                });
              }

              if (pool.length === 0 && phase === 'ready') return <FilterEmptyState />;
              return <MasonryGrid items={pool} renderItem={renderReviewCard} />;
            })()}
          </div>
        )}

        {/* ── NEEDS REVIEW TAB ── */}
        {activeTab === 'needs-review' && phase === 'ready' && (
          <div className="p-4 space-y-2">
            {/* Cluster summary */}
            <p className="text-sm text-gray-500 pb-1">
              {pendingClusters.length === 0
                ? 'All clusters resolved.'
                : `${pendingClusters.reduce((s, c) => s + c.pending.length, 0)} variants pending across ${pendingClusters.length} cluster${pendingClusters.length !== 1 ? 's' : ''}.`}
            </p>

            {/* Cluster accordions */}
            {clusters.every(c => applyFilters(c.all).length === 0) && <FilterEmptyState />}
            {clusters.filter(c => applyFilters(c.all).length > 0).map(cluster => (
              <ClusterAccordion
                key={cluster.type}
                cluster={cluster}
                isOpen={openCluster === cluster.type}
                isRegenerating={regeneratingClusters.has(cluster.type)}
                feedback={clusterFeedback[cluster.type] ?? ''}
                onFeedbackChange={val => dispatch({ type: 'clusterFeedback', clusterType: cluster.type, value: val })}
                selectedIds={selectedInCluster}
                onToggleCard={toggleCardInCluster}
                onOpen={() => setOpenCluster(cluster.type)}
                onClose={() => setOpenCluster(null)}
                resolutions={resolutions}
                variantOverrides={variantOverrides}
                onResolveCard={handleResolveCard}
                onBulkApprove={() => handleBulkCluster(cluster.type, 'approve')}
                onBulkBlock={() => handleBulkCluster(cluster.type, 'block')}
                onBulkArchive={() => handleBulkCluster(cluster.type, 'archive')}
                onRegenAll={() => handleRegenCluster(cluster.type, 'all')}
                onRegenSelected={() => handleRegenCluster(cluster.type, 'selected')}
                selectedSignalTypes={selectedSignalTypes}
              />
            ))}
          </div>
        )}

        {/* ── BLOCKED TAB ── */}
        {activeTab === 'blocked' && phase === 'ready' && (
          <div className="p-4 space-y-3">
            <p className="text-sm text-gray-500">
              {liveCounts['blocked']} blocked variants — not eligible unless regenerated.
            </p>
            {(() => {
              const pool = applyFilters(
                BASE_VARIANTS.filter(v => {
                  const bucket = variantOverrides[v.id]?.bucket ?? v.bucket;
                  const res = resolutions[v.id];
                  // originally blocked + untouched, OR explicitly declined from any tab
                  return res === 'blocked' || (bucket === 'blocked' && (!res || res === 'pending'));
                })
              );
              // Group by primary reason type
              const reasonMap = {};
              for (const v of pool) {
                const type = v.reasons?.[0]?.type ?? 'unknown';
                if (!reasonMap[type]) reasonMap[type] = [];
                reasonMap[type].push(v);
              }
              const reasonGroups = Object.entries(reasonMap).sort((a, b) => b[1].length - a[1].length);
              if (reasonGroups.length === 0) return <FilterEmptyState />;
              return reasonGroups.map(([type, vs]) => {
                const rtype = REASON_TYPES[type];
                const isOpen = openBlockedGroups.has(type);
                const toggle = () => setOpenBlockedGroups(toggleSet(type));
                return (
                  <div key={type} className={`rounded-2xl border overflow-hidden transition-all ${isOpen ? 'border-dark' : 'border-gray-200 hover:border-gray-300'}`}>
                    <button
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isOpen ? 'bg-dark text-white' : 'bg-white'}`}
                      onClick={toggle}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0 bg-red-400" />
                      <span className={`text-sm font-semibold flex-1 ${isOpen ? 'text-white' : 'text-dark'}`}>
                        {rtype?.label ?? type}
                      </span>
                      <span className={`text-xs font-medium tabular-nums shrink-0 ${isOpen ? 'text-white/60' : 'text-gray-400'}`}>
                        {vs.length} variant{vs.length !== 1 ? 's' : ''}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                        className={`shrink-0 transition-transform ${isOpen ? 'rotate-180 text-white/60' : 'text-gray-400'}`}>
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="border-t border-gray-100 p-4 space-y-3">
                        {rtype?.suggestedFix && (
                          <div className="rounded-xl bg-brand/5 border border-brand/15 px-3 py-2.5 text-sm">
                            <span className="font-semibold text-dark">Suggested fix: </span>
                            <span className="text-gray-600">{rtype.suggestedFix}</span>
                          </div>
                        )}
                        <MasonryGrid items={vs} renderItem={v => (
                          <VariantCard
                            variant={mergeWithOverride(v, variantOverrides)}
                            showBucket={false}
                            resolutionState={resolutions[v.id]}
                            onResolve={(!resolutions[v.id] || resolutions[v.id] === 'pending')
                              ? (action, prompt) => handleResolveCard(v.id, action, prompt)
                              : undefined}
                            resolveActions={['approve', 'block', 'regenerate']}
                            selectedSignalTypes={selectedSignalTypes}
                          />
                        )} />
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ── LAUNCH POOL TAB ── */}
        {activeTab === 'launch-pool' && (
          <div className="p-4 space-y-4">
            {approvedCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <span className="text-3xl">♡</span>
                <p className="text-sm font-semibold text-gray-500">No approved variants yet</p>
                <p className="text-xs text-gray-400">Approve variants from any tab to build your launch pool</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {approvedCount} variant{approvedCount !== 1 ? 's' : ''} approved for launch.
                  </p>
                  <button
                    onClick={handleSendToSimulation}
                    className="bg-dark text-white font-bold px-5 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    Watch live decisions →
                  </button>
                </div>
                {(() => {
                  const pool = applyFilters(
                    DISPLAY_VARIANTS.filter(v => resolutions[v.id] === 'approved')
                  );
                  if (pool.length === 0) return <FilterEmptyState />;
                  return (
                    <MasonryGrid items={pool} renderItem={v => (
                      <VariantCard
                        variant={mergeWithOverride(v, variantOverrides)}
                        showBucket={false}
                        selectedSignalTypes={selectedSignalTypes}
                      />
                    )} />
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* Loading states for locked tabs */}
        {tabsLocked && activeTab !== 'recommended' && activeTab !== 'launch-pool' && (
          <div className="flex items-center justify-center py-24">
            <p className="text-gray-400 text-sm">Available after judging completes.</p>
          </div>
        )}
      </div>


      {/* ── Launch overlay ── */}
      {showLaunchOverlay && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-dark fade-in">
          <div className="space-y-5 text-center max-w-xs">
            <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center mx-auto">
              <span className="text-white text-2xl font-black">LE</span>
            </div>
            <h2 className="text-white font-bold text-2xl">Building launch pool…</h2>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-brand rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
            <p className="text-white/40 text-sm">Packaging {approvedCount} approved variants for live serving</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ClusterAccordion ───────────────────────────────────────────────────────────

function ClusterAccordion({
  cluster, isOpen, isRegenerating, feedback, onFeedbackChange,
  selectedIds, onOpen, onClose,
  resolutions, variantOverrides,
  onResolveCard, onBulkApprove, onBulkBlock, onBulkArchive,
  onRegenAll, onRegenSelected, selectedSignalTypes,
}) {
  const rtype = REASON_TYPES[cluster.type];
  const isResolved = cluster.pending.length === 0;
  const isBlocking = rtype?.isBlocking ?? false;
  const selectedInThis = cluster.pending.filter(v => selectedIds.has(v.id));

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isResolved ? 'border-emerald-100 opacity-60' :
      isOpen ? 'border-dark' : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Accordion header */}
      <button
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
          isOpen && !isResolved ? 'bg-dark text-white' : 'bg-white'
        }`}
        onClick={() => isOpen ? onClose() : onOpen()}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${
          isResolved ? 'bg-emerald-400' :
          isRegenerating ? 'bg-brand animate-pulse' :
          isBlocking ? 'bg-red-400' : 'bg-amber-400'
        }`} />
        <span className={`text-sm font-semibold flex-1 ${isOpen && !isResolved ? 'text-white' : 'text-dark'}`}>
          {rtype?.label ?? cluster.type}
        </span>
        <span className={`text-xs font-medium tabular-nums shrink-0 ${
          isResolved ? 'text-emerald-600' :
          isOpen ? 'text-white/60' : 'text-gray-400'
        }`}>
          {isResolved ? 'Resolved ✓' :
           isRegenerating ? 'Regenerating…' :
           `${cluster.pending.length} pending`}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${isOpen ? 'text-white/60' : 'text-gray-400'}`}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Accordion body */}
      {isOpen && (
        <div className="border-t border-gray-100">
          {isRegenerating ? (
            <div className="px-4 py-10 flex flex-col items-center gap-3 bg-dark/95">
              <div className="w-8 h-8 rounded-full border-3 border-brand border-t-transparent animate-spin" />
              <p className="text-white font-semibold text-sm">Regenerating {cluster.pending.length} variants…</p>
              <p className="text-white/40 text-xs text-center max-w-xs">Applying your feedback and re-running AI judges. About 4 seconds.</p>
            </div>
          ) : isResolved ? (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-emerald-700 font-medium">All variants in this cluster resolved ✓</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Suggested fix */}
              {rtype?.suggestedFix && (
                <div className="rounded-xl bg-brand/5 border border-brand/15 px-3 py-2.5 text-sm">
                  <span className="font-semibold text-dark">Suggested fix: </span>
                  <span className="text-gray-600">{rtype.suggestedFix}</span>
                </div>
              )}

              {/* Sample cards — up to 6, mixed-format mosaic */}
              <MasonryGrid items={cluster.pending.slice(0, 6)} renderItem={v => {
                const res = resolutions[v.id];
                const ov = variantOverrides[v.id];
                const display = ov ? { ...v, ...ov } : v;
                return (
                  <div className={`relative transition-opacity ${res && res !== 'pending' ? 'opacity-40' : ''}`}>
                    <VariantCard
                      variant={display}
                      showBucket={false}
                      resolutionState={res}
                      onResolve={(!res || res === 'pending') ? (action, prompt) => onResolveCard(v.id, action, prompt) : undefined}
                      resolveActions={['approve', 'block', 'regenerate']}
                      selectedSignalTypes={selectedSignalTypes}
                    />
                  </div>
                );
              }} />
              {cluster.pending.length > 6 && (
                <p className="text-xs text-gray-400 text-center">+ {cluster.pending.length - 6} more in this cluster</p>
              )}

              {/* Feedback + actions */}
              <div className="rounded-xl border border-gray-200 p-3 space-y-3">
                <textarea
                  value={feedback}
                  onChange={e => onFeedbackChange(e.target.value)}
                  rows={2}
                  placeholder={rtype?.suggestedFix ?? 'Describe what should change across these variants…'}
                  className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 placeholder-gray-300 text-dark"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={onRegenAll}
                    disabled={!feedback.trim()}
                    className="flex items-center gap-1 text-xs font-semibold bg-dark text-white px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    ↺ Regenerate all
                  </button>
                  {selectedInThis.length > 0 && (
                    <button
                      onClick={onRegenSelected}
                      disabled={!feedback.trim()}
                      className="flex items-center gap-1 text-xs font-semibold bg-dark/80 text-white px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      ↺ Regen selected ({selectedInThis.length})
                    </button>
                  )}
                  <div className="h-3.5 w-px bg-gray-200" />
                  <button onClick={onBulkApprove}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                    ✓ Approve all
                  </button>
                  <button onClick={onBulkBlock}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
                    ✕ Block all
                  </button>
                  <button onClick={onBulkArchive}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors">
                    ⊘ Archive all
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
