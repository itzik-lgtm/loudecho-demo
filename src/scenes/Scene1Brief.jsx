import { useState, useRef, useEffect } from 'react';
import { analyzeImage, validateFile, CHANGE_TYPES, SIGNAL_TYPES } from '../lib/analyzeImage';
import { ADVERTISERS } from '../data/advertisers';
import AdvertiserLogo from '../components/AdvertiserLogo';

// The seed analysis "runs" once per session — revisiting the scene skips the beat.
let hasPrerunAnalysis = false;

const SIGNAL_TYPE_ICONS = {
  'Contextual':      '📄',
  'Audience':        '👥',
  'User journey':    '🗺',
  'Geo / location':  '📍',
  'Time / calendar': '🕐',
  'Weather':         '🌤',
  'Device':          '💻',
  'Product / catalog': '🛍',
  'External data':   '⚡',
};

const CHANGE_TYPE_ICONS = {
  'Background swap':    '🖼',
  'Tagline':            '✏️',
  'Product':            '📦',
  'Character':          '🧑',
  'Composition/layout': '⊞',
  'Color palette':      '🎨',
  'CTA':                '👆',
};

const CONTEXTUAL = 'Contextual';

const TOPIC_OPTIONS = ['All Topics', 'Trending Topics', 'Brand Specific', 'Custom Topics'];

const DEFAULT_IMAGE = '/ramp/ramp-seed-blob.png';
const DEFAULT_META  = { name: 's-blob-v1-IMAGE-QP8ehblLM6M.png', size: '575 KB' };

const DEFAULT_ANALYSIS = {
  summary: 'Bold abstract blob-style creative with a vibrant lime-green accent against a near-black background. Features the Ramp wordmark and a short punchy tagline. Strong visual contrast with a modern, challenger-brand aesthetic.',
  objects: ['abstract shape', 'wordmark', 'gradient background'],
  text: ['Slay the receipt monster', 'Get started'],
  backgroundType: 'gradient',
  mood: 'bold, energetic',
  dominantColors: ['#0a0a0a', '#C8FF00', '#ffffff'],
  compositionQuality: 'High contrast with centered focal point; wordmark clearly visible. Strong brand recall.',
  logoPresent: true,
  logoSize: 'medium',
  logoPlacement: 'center',
  characters: null,
  copySentiment: 'bold',
  copyLength: 'short',
  copyReadingLevel: 'accessible',
  weakSpots: ['No human character — limits emotional connection for lifestyle and aspiration segments'],
  recommendedSignalTypes: [
    { type: 'Contextual', reason: 'Adapts creative to the surrounding page content — always relevant for display advertising.' },
    { type: 'Audience',   reason: 'Finance decision-makers and startup founders respond differently to challenger messaging.' },
  ],
  recommendedChangeTypes: ['Background swap', 'Tagline'],
};

const DEFAULT_AUTO_SIGNALS = ['Contextual', 'Audience'];
const DEFAULT_AUTO_CHANGES = ['Background swap', 'Tagline'];

function fmt(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Multi-select chip with optional tooltip on hover. */
function SelectionChip({ label, icon, isSelected, isRecommended, tooltip, onClick }) {
  let cls = 'relative group px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none ';
  if (isSelected) {
    cls += 'bg-dark text-white border-dark';
  } else {
    cls += 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-dark';
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {icon && <span className="mr-1.5">{icon}</span>}{label}
      {isRecommended && (
        <span className={`ml-1 ${isSelected ? 'opacity-60' : 'text-brand-text'}`}>✦</span>
      )}
      {tooltip && (
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-dark text-white text-[11px] leading-snug px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg text-left">
          {tooltip}
        </span>
      )}
    </button>
  );
}

const IAB_FORMATS = [
  { size: '728×90',   name: 'Leaderboard' },
  { size: '300×250',  name: 'Medium Rectangle' },
  { size: '300×600',  name: 'Half Page' },
  { size: '160×600',  name: 'Wide Skyscraper' },
  { size: '970×250',  name: 'Billboard' },
  { size: '970×90',   name: 'Super Leaderboard' },
  { size: '336×280',  name: 'Large Rectangle' },
  { size: '320×50',   name: 'Mobile Banner' },
  { size: '320×100',  name: 'Large Mobile Banner' },
  { size: '468×60',   name: 'Full Banner' },
  { size: '120×600',  name: 'Skyscraper' },
  { size: '250×250',  name: 'Square' },
];

const OBJECTIVES = [
  {
    label: 'Awareness',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10a7 7 0 1114 0A7 7 0 013 10z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M13.5 6.5L15 5M6.5 13.5L5 15M13.5 13.5L15 15M6.5 6.5L5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Traffic',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7 4l9 6-9 6V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'Engagement',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 4h12a1 1 0 011 1v7a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'Leads',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 4h12l-3 5H7L4 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 9l1 7h4l1-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'App promotion',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="8" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="13" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 16c0-2.5 2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M15 12c1.5.5 2 1.5 2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Sales',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M6 2h8l1 5H5L6 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M5 7v9a1 1 0 001 1h8a1 1 0 001-1V7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function Scene1Brief({ onNext }) {
  const [advertisers, setAdvertisers] = useState(ADVERTISERS);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(ADVERTISERS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [selectedObjective, setSelectedObjective] = useState(OBJECTIVES[0].label);
  const [objectiveOpen, setObjectiveOpen] = useState(false);
  const objectiveRef = useRef(null);

  const [flightStart, setFlightStart] = useState('2026-06-15');
  const [flightEnd, setFlightEnd]     = useState('2026-09-15');
  const [flightOpen, setFlightOpen]   = useState(false);
  const flightRef = useRef(null);

  const [budgetTotal, setBudgetTotal] = useState('250000');
  const [budgetDaily, setBudgetDaily] = useState('2800');
  const [budgetOpen, setBudgetOpen]   = useState(false);
  const [budgetTotalFocused, setBudgetTotalFocused] = useState(false);
  const [budgetDailyFocused, setBudgetDailyFocused] = useState(false);
  const budgetRef = useRef(null);

  const [selectedFormats, setSelectedFormats] = useState(['728×90', '300×250', '300×600', '160×600']);
  const [formatsOpen, setFormatsOpen]         = useState(false);
  const formatsRef = useRef(null);

  // Pre-run analysis beat: the system visibly "reads" the seed ad on first visit
  const [preAnalyzing, setPreAnalyzing] = useState(!hasPrerunAnalysis);
  useEffect(() => {
    if (!preAnalyzing) return;
    const t = setTimeout(() => {
      hasPrerunAnalysis = true;
      setPreAnalyzing(false);
    }, 900);
    return () => clearTimeout(t);
  }, [preAnalyzing]);

  // Fetch live advertisers from Postgres via Vite middleware (supplies logo
  // URLs; falls back silently to the hardcoded list if unavailable)
  useEffect(() => {
    fetch('/api/advertisers')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.advertisers?.length) {
          // Merge with local defaults for brand brief/voice fields
          const merged = data.advertisers.map(a => ({
            ...ADVERTISERS.find(x => x.name === a.name) || {},
            ...a,
          }));
          setAdvertisers(merged);
          const ramp = merged.find(a => a.name === 'Ramp') ?? merged[0];
          setSelectedAdvertiser(ramp);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!objectiveOpen) return;
    const handler = (e) => { if (objectiveRef.current && !objectiveRef.current.contains(e.target)) setObjectiveOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [objectiveOpen]);

  useEffect(() => {
    if (!flightOpen) return;
    const handler = (e) => { if (flightRef.current && !flightRef.current.contains(e.target)) setFlightOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [flightOpen]);

  useEffect(() => {
    if (!budgetOpen) return;
    const handler = (e) => { if (budgetRef.current && !budgetRef.current.contains(e.target)) setBudgetOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [budgetOpen]);

  useEffect(() => {
    if (!formatsOpen) return;
    const handler = (e) => { if (formatsRef.current && !formatsRef.current.contains(e.target)) setFormatsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [formatsOpen]);

  const fmtBudget = n => {
    const v = parseInt(n, 10);
    if (isNaN(v)) return '—';
    return v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `$${v}`;
  };

  const fmtDate = (iso, short = false) => {
    const [y, m, d] = iso.split('-');
    return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', short
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Upload state
  const [previewUrl, setPreviewUrl]   = useState(null);
  const [fileMeta, setFileMeta]       = useState(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const [analysisResult, setAnalysis] = useState(DEFAULT_ANALYSIS);
  const [analysisError, setError]     = useState(null);

  // Selection state
  const [selectedSignalTypes, setSelectedSignals] = useState(DEFAULT_AUTO_SIGNALS);
  const [selectedChangeTypes, setSelectedChanges] = useState(DEFAULT_AUTO_CHANGES);
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [customTopic, setCustomTopic] = useState('');
  // Tracks which values were auto-selected by the system (used to show ✦ marker)
  const [autoSignals, setAutoSignals] = useState(DEFAULT_AUTO_SIGNALS);
  const [autoChanges, setAutoChanges] = useState(DEFAULT_AUTO_CHANGES);

  const fileInputRef  = useRef(null);
  const abortRef      = useRef(null);
  const leftCardRef   = useRef(null);
  const showDetailsRef = useRef(false);
  const [leftCardHeight, setLeftCardHeight] = useState(null);

  // Revoke stale blob URLs
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Mirror left card height → right card min-height (only while details are collapsed)
  useEffect(() => {
    const el = leftCardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (!showDetailsRef.current) setLeftCardHeight(el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toggleSignal = (type) =>
    setSelectedSignals(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );

  const toggleChange = (type) =>
    setSelectedChanges(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );


  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      validateFile(file);
    } catch (err) {
      setError(err.message);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);

    setPreviewUrl(URL.createObjectURL(file));
    setFileMeta({ name: file.name, size: fmt(file.size) });
    setAnalysis(null);
    setSelectedSignals([]);
    setSelectedChanges([]);
    setAutoSignals([]);
    setAutoChanges([]);
    setError(null);
    setAnalyzing(true);

    try {
      const result = await analyzeImage(file, selectedAdvertiser.brief, controller.signal);
      if (!controller.signal.aborted) {
        const aiSignals = result.recommendedSignalTypes?.map(s => s.type) ?? [];
        const others = aiSignals.filter(t => t !== CONTEXTUAL).slice(0, 1);
        const signals = [CONTEXTUAL, ...others];
        const changes = (result.recommendedChangeTypes ?? []).slice(0, 1);
        setAnalysis(result);
        setSelectedSignals(signals);
        setSelectedChanges(changes);
        setAutoSignals(signals);
        setAutoChanges(changes);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error('[analyzeImage]', err);
      setError(err.message);
    } finally {
      if (!controller.signal.aborted) setAnalyzing(false);
    }
  };

  // Build a lookup of signal type → reason from AI recommendations
  const signalRationale = Object.fromEntries(
    (analysisResult?.recommendedSignalTypes ?? []).map(s => [s.type, s.reason])
  );

  const currentImage = previewUrl ?? DEFAULT_IMAGE;
  const currentMeta  = fileMeta ?? DEFAULT_META;

  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  useEffect(() => { showDetailsRef.current = showAnalysisDetails; }, [showAnalysisDetails]);

  const canProceed = selectedSignalTypes.length >= 1 && selectedChangeTypes.length >= 1 &&
    (selectedTopic !== 'Custom Topics' || customTopic.trim().length > 0);

  return (
    <div className="h-full overflow-y-auto fade-in-up">
    <div className="px-6 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold text-dark leading-tight">Start a new campaign.</h1>
          <p className="text-gray-500 mt-0.5 text-xs">LoudEcho has read your seed creative and pre-filled the brief — adjust anything, then generate.</p>
        </div>
        <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-draft-bg text-draft mt-1">Draft</span>
      </div>

      {/* Campaign config strip — advertiser first, then static fields */}
      <div className="glass-card rounded-xl flex items-stretch divide-x divide-line-soft">
        {/* Advertiser cell — dropdown trigger */}
        <div ref={dropdownRef} className="relative px-4 py-3 flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-low-em uppercase tracking-wider mb-1">Advertiser</p>
          <button
            type="button"
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {selectedAdvertiser && <AdvertiserLogo adv={selectedAdvertiser} size={5} />}
            <span className="text-xs font-semibold text-dark truncate">{selectedAdvertiser?.name ?? 'Select…'}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 transition-transform text-gray-400 ${dropdownOpen ? 'rotate-180' : ''}`}>
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute z-30 top-full left-0 mt-1.5 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {advertisers.map(adv => {
                const isSel = selectedAdvertiser?.id === adv.id;
                return (
                  <button
                    key={adv.id}
                    type="button"
                    onClick={() => { setSelectedAdvertiser(adv); setDropdownOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${isSel ? 'bg-brand/5' : ''}`}
                  >
                    <AdvertiserLogo adv={adv} size={7} />
                    <span className={`text-sm truncate ${isSel ? 'font-semibold text-dark' : 'font-medium text-dark'}`}>{adv.name}</span>
                    {isSel && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 ml-auto text-brand-text">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {/* Objective cell — radio picker */}
        <div ref={objectiveRef} className="relative px-4 py-3 flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-low-em uppercase tracking-wider mb-1">Objective</p>
          <button
            type="button"
            onClick={() => setObjectiveOpen(v => !v)}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <span className="text-xs font-semibold text-dark truncate">{selectedObjective}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 transition-transform text-gray-400 ${objectiveOpen ? 'rotate-180' : ''}`}>
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {objectiveOpen && (
            <div className="absolute z-30 top-full left-0 mt-1.5 w-64 bg-white border border-line rounded-xl shadow-lg overflow-hidden py-1">
              {OBJECTIVES.map(obj => {
                const sel = obj.label === selectedObjective;
                return (
                  <button
                    key={obj.label}
                    type="button"
                    onClick={() => { setSelectedObjective(obj.label); setObjectiveOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${sel ? 'bg-info-bg' : 'hover:bg-gray-50'}`}
                  >
                    {/* Icon tile */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${sel ? 'bg-brand text-white' : 'bg-line-soft text-med-em'}`}>
                      {obj.icon}
                    </div>
                    {/* Label */}
                    <span className={`text-sm flex-1 ${sel ? 'font-semibold text-dark' : 'font-medium text-dark'}`}>{obj.label}</span>
                    {/* Check */}
                    {sel && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-brand">
                        <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {/* Flight cell — date range picker */}
        <div ref={flightRef} className="relative px-4 py-3 flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-low-em uppercase tracking-wider mb-1">Flight</p>
          <button
            type="button"
            onClick={() => setFlightOpen(v => !v)}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <span className="text-xs font-semibold text-dark truncate">{fmtDate(flightStart, true)} – {fmtDate(flightEnd, true)}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 transition-transform text-gray-400 ${flightOpen ? 'rotate-180' : ''}`}>
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {flightOpen && (
            <div className="absolute z-30 top-full left-0 mt-1.5 w-72 bg-white border border-line rounded-xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="px-4 pt-4 pb-3 border-b border-line-soft">
                <p className="text-xs font-bold text-dark">Campaign flight</p>
                <p className="text-[11px] text-low-em mt-0.5">{fmtDate(flightStart)} → {fmtDate(flightEnd)}</p>
              </div>
              {/* Date inputs */}
              <div className="px-4 py-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                    <label className="text-[10px] font-bold text-low-em uppercase tracking-wider">Start</label>
                  </div>
                  <input
                    type="date"
                    value={flightStart}
                    max={flightEnd}
                    onChange={e => setFlightStart(e.target.value)}
                    className="w-full text-sm font-semibold text-dark bg-line-soft border border-transparent rounded-lg px-3 py-2 focus:outline-none focus:border-brand focus:bg-info-bg transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    <label className="text-[10px] font-bold text-low-em uppercase tracking-wider">End</label>
                  </div>
                  <input
                    type="date"
                    value={flightEnd}
                    min={flightStart}
                    onChange={e => setFlightEnd(e.target.value)}
                    className="w-full text-sm font-semibold text-dark bg-line-soft border border-transparent rounded-lg px-3 py-2 focus:outline-none focus:border-brand focus:bg-info-bg transition-colors"
                  />
                </div>
              </div>
              {/* Footer */}
              <div className="px-4 pb-4 pt-1">
                <button
                  type="button"
                  onClick={() => setFlightOpen(false)}
                  className="w-full text-sm font-semibold text-white bg-brand rounded-lg py-2 hover:opacity-90 transition-opacity"
                >
                  Apply dates
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Budget cell */}
        <div ref={budgetRef} className="relative px-4 py-3 flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-low-em uppercase tracking-wider mb-1">Budget</p>
          <button
            type="button"
            onClick={() => setBudgetOpen(v => !v)}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <span className="text-xs font-semibold text-dark whitespace-nowrap">{fmtBudget(budgetTotal)} total · {fmtBudget(budgetDaily)}/day</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 transition-transform text-gray-400 ${budgetOpen ? 'rotate-180' : ''}`}>
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {budgetOpen && (
            <div className="absolute z-30 top-full left-0 mt-1.5 w-64 bg-white border border-line rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-line-soft">
                <p className="text-xs font-bold text-dark">Campaign budget</p>
                <p className="text-[11px] text-low-em mt-0.5">{fmtBudget(budgetTotal)} total · {fmtBudget(budgetDaily)}/day cap</p>
              </div>
              <div className="px-4 py-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                    <label className="text-[10px] font-bold text-low-em uppercase tracking-wider">Total budget</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-low-em">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={budgetTotalFocused ? budgetTotal : (budgetTotal ? parseInt(budgetTotal, 10).toLocaleString('en-US') : '')}
                      onChange={e => { const raw = e.target.value.replace(/,/g, ''); if (/^\d*$/.test(raw)) setBudgetTotal(raw); }}
                      onFocus={() => setBudgetTotalFocused(true)}
                      onBlur={() => setBudgetTotalFocused(false)}
                      className="w-full text-sm font-semibold text-dark bg-line-soft border border-transparent rounded-lg pl-6 pr-3 py-2 focus:outline-none focus:border-brand focus:bg-info-bg transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    <label className="text-[10px] font-bold text-low-em uppercase tracking-wider">Daily cap</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-low-em">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={budgetDailyFocused ? budgetDaily : (budgetDaily ? parseInt(budgetDaily, 10).toLocaleString('en-US') : '')}
                      onChange={e => { const raw = e.target.value.replace(/,/g, ''); if (/^\d*$/.test(raw)) setBudgetDaily(raw); }}
                      onFocus={() => setBudgetDailyFocused(true)}
                      onBlur={() => setBudgetDailyFocused(false)}
                      className="w-full text-sm font-semibold text-dark bg-line-soft border border-transparent rounded-lg pl-6 pr-3 py-2 focus:outline-none focus:border-brand focus:bg-info-bg transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 pb-4 pt-1">
                <button
                  type="button"
                  onClick={() => setBudgetOpen(false)}
                  className="w-full text-sm font-semibold text-white bg-brand rounded-lg py-2 hover:opacity-90 transition-opacity"
                >
                  Apply budget
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Formats cell — multi-select */}
        <div ref={formatsRef} className="relative px-4 py-3 flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-low-em uppercase tracking-wider mb-1">Formats</p>
          <button
            type="button"
            onClick={() => setFormatsOpen(v => !v)}
            className="flex items-center gap-1.5 w-full hover:opacity-80 transition-opacity"
          >
            <span className="text-xs font-semibold text-dark truncate">
              {selectedFormats.length === 0 ? 'None selected' : selectedFormats.join(' · ')}
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 transition-transform text-gray-400 ml-auto ${formatsOpen ? 'rotate-180' : ''}`}>
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {formatsOpen && (
            <div className="absolute z-30 top-full right-0 mt-1.5 w-72 bg-white border border-line rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 pt-3 pb-2 border-b border-line-soft flex items-center justify-between">
                <p className="text-xs font-bold text-dark">Ad formats</p>
                <span className="text-[10px] font-semibold text-low-em">{selectedFormats.length} selected</span>
              </div>
              <div className="py-1 max-h-72 overflow-y-auto">
                {IAB_FORMATS.map(f => {
                  const sel = selectedFormats.includes(f.size);
                  return (
                    <button
                      key={f.size}
                      type="button"
                      onClick={() => setSelectedFormats(prev =>
                        sel ? prev.filter(s => s !== f.size) : [...prev, f.size]
                      )}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${sel ? 'bg-info-bg' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${sel ? 'bg-brand border-brand' : 'border-gray-300 bg-white'}`}>
                        {sel && (
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-mono font-semibold text-dark w-16 shrink-0">{f.size}</span>
                      <span className="text-xs text-med-em">{f.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setFormatsOpen(false)}
                  className="w-full text-sm font-semibold text-white bg-brand rounded-lg py-2 hover:opacity-90 transition-opacity"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 items-stretch">
      {/* ── Left column: Seed Creative ── */}
      <div className="flex flex-col">

      {/* Seed Creative */}
      <div ref={leftCardRef} className="glass-card rounded-xl p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-dark uppercase tracking-wider">Seed Creative</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
            className="text-xs font-semibold text-dark border border-gray-300 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {previewUrl ? 'Replace' : 'Upload Image'}
          </button>
        </div>

        {/* Image preview with loading overlay */}
        <div className="relative rounded-xl overflow-hidden flex justify-center bg-gray-50">
          <img
            src={currentImage}
            alt="Seed creative"
            className="object-contain"
            style={{ maxHeight: 260, maxWidth: '100%' }}
          />
          {(analyzing || preAnalyzing) && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 fade-in">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-dark">{preAnalyzing ? 'Reading seed creative…' : 'Analyzing image...'}</p>
            </div>
          )}
        </div>

        {/* File metadata */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-mono truncate max-w-[260px]">{currentMeta.name}</span>
          <span>·</span>
          <span>{currentMeta.size}</span>
        </div>

        {/* Error */}
        {analysisError && !analyzing && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 fade-in">
            <span className="text-red-500 text-xs mt-0.5 shrink-0">✕</span>
            <p className="text-xs text-red-600 leading-snug">{analysisError}</p>
          </div>
        )}

        {/* AI summary — visible without expanding the full analysis */}
        {analysisResult && !analyzing && !preAnalyzing && (
          <div className="fade-in rounded-lg bg-info-bg/60 border border-brand/15 px-3 py-2.5">
            <p className="text-xs text-dark leading-relaxed">
              <span className="font-bold text-brand-text">Seed analysis: </span>{analysisResult.summary}
            </p>
          </div>
        )}

        {/* Analysis results */}
        {analysisResult && !analyzing && !preAnalyzing && (
          <div className="space-y-5 border-t border-gray-200 pt-4 fade-in">

            <button
              type="button"
              onClick={() => setShowAnalysisDetails(v => !v)}
              className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-dark transition-colors"
            >
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                className={`transition-transform ${showAnalysisDetails ? 'rotate-90' : ''}`}
              >
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {showAnalysisDetails ? 'Hide image analysis' : 'View image analysis'}
            </button>

            {showAnalysisDetails && (
              <div className="space-y-5">
                {/* Summary */}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-dark uppercase tracking-wider">Image Analysis</p>
                  <p className="text-sm text-dark leading-snug">{analysisResult.summary}</p>
                </div>

                {/* Objects & Text */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Key Objects</p>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.objects?.length
                        ? analysisResult.objects.map((o, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{o}</span>
                          ))
                        : <span className="text-xs text-gray-400">—</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Text in Image</p>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.text?.length
                        ? analysisResult.text.map((t, i) => (
                            <span key={i} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-mono">"{t}"</span>
                          ))
                        : <span className="text-xs text-gray-400">None detected</span>}
                    </div>
                  </div>
                </div>

                {/* Visual Properties */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-dark uppercase tracking-wider">Visual Properties</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Background</p>
                      <p className="text-sm font-medium text-dark capitalize">{analysisResult.backgroundType ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Mood</p>
                      <p className="text-sm font-medium text-dark capitalize">{analysisResult.mood ?? '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Dominant Colors</p>
                      <div className="flex flex-wrap gap-3 items-center">
                        {analysisResult.dominantColors?.length
                          ? analysisResult.dominantColors.map((c, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-200 shrink-0"
                                  style={{ background: /^#[0-9a-f]{3,6}$/i.test(c) ? c : undefined }}
                                />
                                <span className="text-xs font-mono text-gray-600">{c}</span>
                              </div>
                            ))
                          : <span className="text-xs text-gray-400">—</span>}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Composition</p>
                      <p className="text-sm text-dark leading-snug">{analysisResult.compositionQuality ?? '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Brand & Characters */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-dark uppercase tracking-wider">Brand & Characters</p>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Logo</p>
                      <p className="text-sm font-medium text-dark">{analysisResult.logoPresent ? 'Present' : 'Absent'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Logo Size</p>
                      <p className="text-sm font-medium text-dark capitalize">{analysisResult.logoSize ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Logo Placement</p>
                      <p className="text-sm font-medium text-dark capitalize">{analysisResult.logoPlacement ?? '—'}</p>
                    </div>
                    {analysisResult.characters && (
                      <div className="col-span-3">
                        <p className="text-xs text-gray-400 mb-0.5">Characters</p>
                        <p className="text-sm text-dark leading-snug">{analysisResult.characters}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Copy Analysis */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-dark uppercase tracking-wider">Copy Analysis</p>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Sentiment</p>
                      <p className="text-sm font-medium text-dark capitalize">{analysisResult.copySentiment ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Length</p>
                      <p className="text-sm font-medium text-dark capitalize">{analysisResult.copyLength ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Reading Level</p>
                      <p className="text-sm font-medium text-dark capitalize">{analysisResult.copyReadingLevel ?? '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Weak Spots */}
                {analysisResult.weakSpots?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-dark uppercase tracking-wider">Weak Spots</p>
                    <div className="flex flex-col gap-1.5">
                      {analysisResult.weakSpots.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <span className="text-amber-500 text-xs mt-0.5 shrink-0">⚠</span>
                          <p className="text-xs text-amber-800 leading-snug">{w}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      </div>{/* end left column */}

      {/* ── Right column: Selections + CTA ── */}
      <div className="flex flex-col self-start w-full">

      {/* Selections */}
      <div
        className={`glass-card rounded-xl p-6 flex flex-col justify-between transition-opacity duration-500 ${analysisResult && !analyzing && !preAnalyzing ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
        style={leftCardHeight ? { minHeight: leftCardHeight } : undefined}
      >

          {/* ── Topic ── */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-dark uppercase tracking-wider">Topic Selection</p>
              <p className="text-xs text-gray-400 mt-0.5">Which topics should variants be aligned to?</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TOPIC_OPTIONS.map(opt => (
                <SelectionChip
                  key={opt}
                  label={opt}
                  icon={null}
                  isSelected={selectedTopic === opt}
                  isRecommended={false}
                  tooltip={null}
                  onClick={() => setSelectedTopic(opt)}
                />
              ))}
            </div>
            {selectedTopic === 'Custom Topics' && (
              <input
                type="text"
                value={customTopic}
                onChange={e => setCustomTopic(e.target.value)}
                placeholder="Describe your topic…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-brand/40 placeholder-gray-400"
                autoFocus
              />
            )}
          </div>

          {/* ── Signal Types ── */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs font-bold text-dark uppercase tracking-wider">Signal Types</p>
              <p className="text-xs text-gray-400 mt-0.5">How should variants be segmented for targeting? ✦ = System recommended</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SIGNAL_TYPES.map(type => (
                <SelectionChip
                  key={type}
                  label={type}
                  icon={SIGNAL_TYPE_ICONS[type]}
                  isSelected={selectedSignalTypes.includes(type)}
                  isRecommended={autoSignals.includes(type)}
                  tooltip={autoSignals.includes(type) ? (signalRationale[type] ?? (type === CONTEXTUAL ? 'Adapts creative to the surrounding page content and context — always relevant for display advertising.' : null)) : null}
                  onClick={() => toggleSignal(type)}
                />
              ))}
            </div>
          </div>

          {/* ── Change Types ── */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs font-bold text-dark uppercase tracking-wider">Change Types</p>
              <p className="text-xs text-gray-400 mt-0.5">What should be varied in the seed creative? ✦ = System recommended</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CHANGE_TYPES.map(type => (
                <SelectionChip
                  key={type}
                  label={type}
                  icon={CHANGE_TYPE_ICONS[type]}
                  isSelected={selectedChangeTypes.includes(type)}
                  isRecommended={autoChanges.includes(type)}
                  tooltip={null}
                  onClick={() => toggleChange(type)}
                />
              ))}
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
            {analysisResult && !canProceed && (
              <p className="text-xs text-gray-400">Select at least one signal type and one change type to continue.</p>
            )}
            <button
              onClick={() => onNext({ selectedSignalTypes, selectedChangeTypes, topic: selectedTopic === 'Custom Topics' ? customTopic.trim() : selectedTopic, advertiser: selectedAdvertiser })}
              disabled={analysisResult ? !canProceed : false}
              className="bg-dark text-white font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Generate Variants →
            </button>
          </div>

        </div>

      </div>{/* end right column */}
      </div>{/* end grid */}

    </div>{/* end inner padding */}
    </div>
  );
}
