import { useState, useEffect, useRef } from 'react';
import { AD_OVERLAYS, ASPECT_RATIOS, ctaFontSize } from '../data/adFormats';
import AdLightbox from './AdLightbox';

// Maps short signal type names → badge descriptor(s) for a variant
const SIGNAL_BADGE_MAP = {
  'Audience':        { color: 'bg-indigo-50 text-indigo-700', icon: '👥', get: v => [v.signalData?.audience] },
  'User journey':    { color: 'bg-amber-50  text-amber-700',  icon: '🗺', get: v => [v.signalData?.journeyStage?.label] },
  'Geo / location':  { color: 'bg-emerald-50 text-emerald-700', icon: '📍', get: v => [v.signalData?.geoLocation] },
  'Time / calendar': { color: 'bg-blue-50  text-blue-700',    icon: '🕐', get: v => [v.signalData?.timeCalendar] },
  'Weather':         { color: 'bg-sky-50   text-sky-700',     icon: '🌤', get: v => [v.signalData?.weather] },
  'Device':          { color: 'bg-slate-100 text-slate-600',  icon: '💻', get: v => [v.signalData?.device?.type, v.signalData?.device?.os].filter(Boolean) },
  'Product / catalog': { color: 'bg-teal-50 text-teal-700',  icon: '🛍', get: v => [v.signalData?.productCatalog] },
  'External data':   { color: 'bg-rose-50  text-rose-700',    icon: '⚡', get: v => [v.signalData?.externalData] },
  // 'Contextual' intentionally omitted — Topic badge already serves this role
};

// Per-reason regeneration prompt suggestions
const REGEN_SUGGESTIONS = {
  'brand-voice':       ['Make the tone more energetic and direct', 'Reduce tagline ambiguity', 'Align copy with brand voice guidelines'],
  'palette-conflict':  ['Replace background with approved secondary palette', 'Adjust colors to match brand guidelines', 'Try a high-contrast version'],
  'logo-placement':    ['Reposition logo with minimum 8% margin', 'Move logo to upper-left with safe zone', 'Try centered logo placement'],
  'model-obstruction': ['Adjust model position to clear tagline', 'Reduce model size to reveal full CTA', 'Move model to opposite side'],
  'cta-contrast':      ['Increase CTA contrast to ≥4.5:1', 'Use white text on dark CTA button', 'Try a high-visibility CTA color'],
  'logo-visibility':   ['Increase contrast or reposition logo', 'Use white logo on dark background', 'Add subtle background behind logo'],
  'claim-risk':        ['Remove performance claims, keep product benefit', 'Soften claim language for compliance', 'Replace with approved brand messaging'],
  'similarity':        ['Use a completely different visual concept', 'Change hero image and headline direction', 'Try a fresh layout with different color story'],
};
const DEFAULT_REGEN_SUGGESTIONS = [
  'Make the visual more dynamic and engaging',
  'Try a different headline angle',
  'Explore an alternate color palette',
  'Add more brand personality to the copy',
];

const VARIANT_SUGGESTIONS = [
  { label: 'Direct headline',  prompt: 'Make the headline more direct and conversion-focused' },
  { label: 'Bolder CTA',       prompt: 'Make the CTA more prominent' },
  { label: 'Cleaner layout',   prompt: 'Use a cleaner layout with less visual clutter' },
  { label: 'Product focus',    prompt: 'Make the product more visually dominant' },
  { label: 'Premium feel',     prompt: 'Make the design feel more premium' },
  { label: 'Younger audience', prompt: 'Adapt this variant for a younger audience' },
  { label: 'Vibrant colors',   prompt: 'Make the colors more vibrant' },
  { label: 'Bolder branding',  prompt: 'Make the branding more noticeable' },
  { label: 'Swap background',  prompt: 'Try a different background while keeping the product unchanged' },
];


export default function VariantCard({ variant, selectedSignalTypes, showCheckbox, checked, onCheck, showJudge, showBucket, dimmed, feedbackMode, existingFeedback, onFeedback, onRefine, isRefining, refineError, onClearRefineError, onRefineOpen, onRefineClose, wasRefined, onResolve, resolutionState }) {
  const ov = AD_OVERLAYS[variant.axis];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [refineOpen, setRefineOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [refineDraft, setRefineDraft] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reasonsExpanded, setReasonsExpanded] = useState(false);
  const prevRefiningRef = useRef(false);


  const openRefinePanel = () => { setRefineOpen(true); onRefineOpen?.(); };
  const closeRefinePanel = () => { setRefineOpen(false); setRefineDraft(''); onClearRefineError?.(); onRefineClose?.(); };

  // Auto-close refine panel on successful generation
  useEffect(() => {
    if (prevRefiningRef.current && !isRefining && !refineError) {
      setRefineOpen(false);
      setRefineDraft('');
      onRefineClose?.();
    }
    prevRefiningRef.current = isRefining;
  }, [isRefining, refineError]);

  return (
    <>
    <div
      className={`glass-card rounded-b-xl overflow-hidden transition-all duration-200 card-pop group cursor-pointer relative`}
      style={{ breakInside: 'avoid', display: 'inline-block', width: '100%', opacity: dimmed ? 0.5 : 1 }}
      role="button"
      tabIndex={0}
      onClick={() => onCheck && onCheck(!checked)}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && onCheck) { e.preventDefault(); onCheck(!checked); } }}
    >
      {showCheckbox && (
        <div
          className="absolute top-2 left-2 z-10"
          onClick={e => { e.stopPropagation(); onCheck && onCheck(!checked); }}
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            checked ? 'bg-brand border-brand' : 'bg-white/80 border-gray-300'
          }`}>
            {checked && <span className="text-dark text-xs font-bold">✓</span>}
          </div>
        </div>
      )}

      {wasRefined ? (
        <div className="absolute top-2 right-2 z-10 bg-brand/90 text-dark text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          ↺ refined
        </div>
      ) : variant.isNew && (
        <div className="absolute top-2 right-2 z-10 w-2 h-2 rounded-full bg-brand shadow-sm" title="New variant" />
      )}

      {/* Ad creative — enforces exact IAB aspect ratio, logo + CTA at production HTML positions */}
      <div
        className="relative overflow-hidden cursor-pointer group/creative"
        style={{ aspectRatio: ASPECT_RATIOS[variant.axis], backgroundColor: '#e4f222', containerType: 'inline-size' }}
        onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
      >
        <img
          src={variant.imageUrl}
          alt=""
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {ov && (
          <>
            {/* White Ramp wordmark — production SVG, no filter needed */}
            <img
              src="/ramp/ramp-wordmark.svg"
              alt="Ramp"
              style={{
                position: 'absolute',
                left:   ov.logo.left,
                top:    ov.logo.top,
                width:  ov.logo.width,
                height: ov.logo.height,
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />

            {/* CTA — #e4f222 pill, Inter 500, dark text — production colors */}
            <div
              style={{
                position: 'absolute',
                left:            ov.cta.left,
                top:             ov.cta.top,
                width:           ov.cta.width,
                height:          ov.cta.height,
                backgroundColor: '#e4f222',
                borderRadius:    '6.88px',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                overflow:        'hidden',
                pointerEvents:   'none',
              }}
            >
              <span style={{
                fontFamily: '"Inter", system-ui, sans-serif',
                fontWeight: 500,
                color:      '#1a1919',
                fontSize:   ctaFontSize(variant.axis),
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}>
                {variant.cta}
              </span>
            </div>
          </>
        )}

        {/* Regenerating overlay */}
        {variant.regenerating && (
          <div className="absolute inset-0 bg-dark/75 flex flex-col items-center justify-center gap-2 z-10 pointer-events-none">
            <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <p className="text-white text-[10px] font-semibold tracking-wide">Generating…</p>
          </div>
        )}

        {/* Hover-to-expand overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover/creative:bg-black/20 transition-colors duration-150 flex items-center justify-center pointer-events-none">
          <span className="opacity-0 group-hover/creative:opacity-100 transition-opacity duration-150 bg-black/70 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            View full size
          </span>
        </div>
      </div>

      {/* ── Bucket badge + reason expand (badge hidden when showBucket=false) ── */}
      {showBucket && variant.bucket && (
        <div className="border-t border-gray-100 fade-in" onClick={e => e.stopPropagation()}>
          <div className={`px-3 pt-2 pb-1 flex items-center gap-1.5 ${variant.bucket === 'recommended' ? '' : 'cursor-pointer'}`}
            onClick={() => variant.bucket !== 'recommended' && variant.reasons?.length > 0 && setReasonsExpanded(x => !x)}>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              variant.bucket === 'recommended' ? 'bg-emerald-100 text-emerald-700' :
              variant.bucket === 'needs-review' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {variant.bucket === 'recommended' ? '✓ Recommended' :
               variant.bucket === 'needs-review' ? '⚠ Needs Review' : '✕ Blocked'}
            </span>
            {variant.bucket !== 'recommended' && variant.reasons?.length > 0 && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                className={`text-gray-400 transition-transform duration-150 ${reasonsExpanded ? 'rotate-180' : ''}`}>
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {resolutionState && resolutionState !== 'pending' && (
              <span className={`ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                resolutionState === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                resolutionState === 'blocked'  ? 'bg-red-50 text-red-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {resolutionState === 'approved' ? '✓ approved' :
                 resolutionState === 'blocked'  ? '✕ blocked' : 'archived'}
              </span>
            )}
          </div>

          {reasonsExpanded && variant.reasons?.length > 0 && (
            <div className="px-3 pb-1.5 space-y-1">
              {variant.reasons.map((r, ri) => (
                <div key={ri} className={`rounded-lg p-2 text-[9px] leading-relaxed ${r.isBlocking ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                  <p className={`font-semibold mb-0.5 ${r.isBlocking ? 'text-red-700' : 'text-amber-700'}`}>{r.label}</p>
                  <p className="text-gray-500 capitalize">
                    {r.metric.name}: <span className="font-semibold text-gray-700">{r.metric.value}{r.metric.unit}</span>
                  </p>
                  <p className="text-gray-400 mt-0.5">Fix: {r.suggestedFix}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Quick action icons ── */}
      {onResolve && (!resolutionState || resolutionState === 'pending') && !variant.regenerating && (
        <div onClick={e => e.stopPropagation()}>
          <div className="border-t border-gray-100 px-2.5 py-1 flex items-center gap-1">
            {/* Approve — heart */}
            <div className="relative group/tip">
              <button
                onClick={() => onResolve('approve')}
                aria-label="Approve variant"
                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 11S1 7.5 1 4a2.5 2.5 0 014.5-1.5L6.5 3.5 7.5 2.5A2.5 2.5 0 0112 4c0 3.5-5.5 7-5.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-gray-900 text-white text-[9px] font-medium rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-30">Approve</div>
            </div>

            {/* Decline — X */}
            <div className="relative group/tip">
              <button
                onClick={() => onResolve('block')}
                aria-label="Decline variant"
                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-gray-900 text-white text-[9px] font-medium rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-30">Decline</div>
            </div>

            {/* Regenerate — sparkle wand */}
            <div className="relative group/tip">
              <button
                onClick={() => setRegenOpen(o => !o)}
                aria-label="Improve variant"
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${regenOpen ? 'text-brand-text bg-brand/10' : 'text-gray-400 hover:text-brand-text hover:bg-brand/10'}`}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 11L8 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M8 5l1.5-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M10.5 1.5v2M9.5 2.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <circle cx="5" cy="2.5" r="0.7" fill="currentColor"/>
                  <circle cx="11" cy="8" r="0.7" fill="currentColor"/>
                </svg>
              </button>
              {!regenOpen && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-gray-900 text-white text-[9px] font-medium rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-30">Improve</div>}
            </div>
          </div>

          {/* Regen prompt panel */}
          {regenOpen && (() => {
            const primaryType = variant.reasons?.[0]?.type;
            const suggestions = REGEN_SUGGESTIONS[primaryType] ?? DEFAULT_REGEN_SUGGESTIONS;
            return (
              <div className="border-t border-brand/20 bg-brand/5 p-2 space-y-1.5">
                <div className="flex flex-wrap gap-1">
                  {suggestions.map(s => (
                    <button key={s} onClick={() => setRegenPrompt(regenPrompt === s ? '' : s)}
                      className={`text-[9px] px-1.5 py-0.5 rounded-full border transition-colors text-left ${
                        regenPrompt === s
                          ? 'bg-brand text-dark border-brand'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand/40 hover:text-brand-text'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    value={regenPrompt}
                    onChange={e => setRegenPrompt(e.target.value)}
                    placeholder="Or describe the change…"
                    className="flex-1 text-[10px] px-2 py-1 border border-gray-200 rounded-lg outline-none focus:border-brand/50 bg-white min-w-0"
                    onClick={e => e.stopPropagation()}
                  />
                  <button
                    onClick={() => { onResolve('regenerate', regenPrompt); setRegenOpen(false); setRegenPrompt(''); }}
                    disabled={!regenPrompt.trim()}
                    className="shrink-0 text-[9px] font-bold px-2 py-1 rounded-lg bg-dark text-white disabled:opacity-30 hover:opacity-80 transition-opacity"
                  >
                    ↺
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Resolved badge */}
      {resolutionState && resolutionState !== 'pending' && (
        <div className="border-t border-gray-100 px-3 py-px" onClick={e => e.stopPropagation()}>
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
            resolutionState === 'approved' ? 'bg-emerald-50 text-emerald-600' :
            resolutionState === 'blocked'  ? 'bg-red-50 text-red-600' :
            'bg-gray-100 text-gray-500'
          }`}>
            {resolutionState === 'approved' ? '✓ approved' :
             resolutionState === 'blocked'  ? '✕ declined' : '⊘ archived'}
          </span>
        </div>
      )}

      <div className="px-3 py-px">
        {(() => {
          const judgeBadge = showJudge ? (
            <span key="judge" className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              variant.status === 'approved' ? 'bg-green-100 text-green-700' :
              variant.status === 'review'   ? 'bg-amber-100 text-amber-700' :
                                             'bg-red-100 text-red-700'
            }`}>
              {variant.status === 'approved' ? 'Auto-Approved' :
               variant.status === 'review'   ? 'Needs Review' : 'Rejected'}
            </span>
          ) : null;

          const signalBadges = selectedSignalTypes?.length > 0
            ? selectedSignalTypes.filter(st => st !== 'Contextual').flatMap(st => {
                const cfg = SIGNAL_BADGE_MAP[st];
                if (!cfg) return [];
                return cfg.get(variant).filter(Boolean).map((label, j) => ({
                  key: `${st}-${j}`, color: cfg.color, icon: j === 0 ? cfg.icon : null, label,
                }));
              })
            : [];

          const topicBadge = variant.topic ? (
            <span key="topic" className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-0.5">
              <span>🏷️</span>
              <span className="font-semibold text-gray-700">{variant.topic}</span>
            </span>
          ) : null;

          if (variant.axis === '728×90') {
            // All metadata on one line for the wide leaderboard format
            return (
              <div className="flex items-center gap-2 flex-wrap">
                {topicBadge}
                {judgeBadge}
                {signalBadges.map(b => (
                  <span key={b.key} className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${b.color}`}>
                    <span>{b.icon}</span>
                    <span className="font-medium">{b.label}</span>
                  </span>
                ))}
              </div>
            );
          }

          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              {topicBadge}
              {judgeBadge}
              {signalBadges.map(b => (
                <span key={b.key} className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${b.color}`}>
                  <span>{b.icon}</span>
                  <span className="font-medium">{b.label}</span>
                </span>
              ))}
            </div>
          );
        })()}

        {showJudge && (
          <p className="text-[11px] text-gray-500 italic leading-snug">{variant.judgeText}</p>
        )}

        {/* Refine panel (variant-level feedback → regeneration) */}
        {feedbackMode && onRefine && (
          <div className="pt-1.5 border-t border-gray-100" onClick={e => e.stopPropagation()}>
            {!refineOpen && !isRefining ? (
              <button
                onClick={openRefinePanel}
                className="flex items-center gap-1 text-[10px] font-semibold bg-dark text-white px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity"
              >
                <span>↺</span> Refine
              </button>
            ) : (
              <div className="space-y-1.5 pt-0.5">
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Refine this variant</p>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-1">
                  {VARIANT_SUGGESTIONS.map(s => (
                    <button
                      key={s.label}
                      onClick={() => setRefineDraft(s.prompt)}
                      disabled={isRefining}
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-colors disabled:opacity-40 ${
                        refineDraft === s.prompt
                          ? 'bg-brand text-dark'
                          : 'bg-brand/10 text-brand-text hover:bg-brand/20'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  autoFocus={!isRefining}
                  value={refineDraft}
                  onChange={e => setRefineDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape' && !isRefining) closeRefinePanel();
                  }}
                  disabled={isRefining}
                  rows={2}
                  placeholder="Describe the change you want..."
                  className="w-full text-[10px] bg-white border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-brand/40 placeholder-gray-300 text-dark disabled:opacity-50"
                />

                {/* Error */}
                {refineError && (
                  <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
                    <span className="text-red-500 text-[9px] mt-0.5 shrink-0">✕</span>
                    <p className="text-[9px] text-red-600 leading-snug flex-1">{refineError}</p>
                    <button
                      onClick={onClearRefineError}
                      className="text-[9px] text-red-500 hover:underline shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-1.5 justify-end items-center">
                  {!isRefining && (
                    <button
                      onClick={closeRefinePanel}
                      className="text-[9px] text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => { if (refineDraft.trim()) onRefine(refineDraft.trim()); }}
                    disabled={!refineDraft.trim() || isRefining}
                    className="text-[9px] font-semibold text-white bg-dark px-2.5 py-1 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1"
                  >
                    {isRefining ? (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full border border-white border-t-transparent animate-spin" />
                        <span>Generating…</span>
                      </>
                    ) : (
                      'Regenerate →'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legacy add-note UI (used when onRefine is not provided) */}
        {feedbackMode && !onRefine && !editing && (
          <div
            className="flex items-center gap-2 pt-1 border-t border-gray-100"
            onClick={e => e.stopPropagation()}
          >
            {existingFeedback ? (
              <>
                <span className="text-[10px] text-gray-500 italic flex-1 leading-snug">✎ {existingFeedback}</span>
                <button
                  onClick={() => { setDraft(existingFeedback); setEditing(true); }}
                  className="text-[9px] text-brand-text font-semibold hover:underline shrink-0"
                >
                  Edit
                </button>
              </>
            ) : (
              <button
                onClick={() => { setDraft(''); setEditing(true); }}
                className="text-[10px] text-gray-400 hover:text-brand-text transition-colors font-medium flex items-center gap-1"
              >
                <span>＋</span> Add note
              </button>
            )}
          </div>
        )}

        {feedbackMode && !onRefine && editing && (
          <div
            className="pt-1 border-t border-gray-100 space-y-1.5"
            onClick={e => e.stopPropagation()}
          >
            <textarea
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onFeedback && onFeedback(draft.trim()); setEditing(false); }
                if (e.key === 'Escape') setEditing(false);
              }}
              rows={2}
              placeholder="What's wrong or what should change..."
              className="w-full text-[10px] bg-white border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-brand/40 placeholder-gray-300 text-dark"
            />
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="text-[9px] text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { onFeedback && onFeedback(draft.trim()); setEditing(false); }}
                disabled={!draft.trim()}
                className="text-[9px] font-semibold text-white bg-brand px-2 py-1 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {lightboxOpen && (
      <AdLightbox
        imageUrl={variant.imageUrl}
        axis={variant.axis}
        cta={variant.cta}
        onClose={() => setLightboxOpen(false)}
      />
    )}
    </>
  );
}
