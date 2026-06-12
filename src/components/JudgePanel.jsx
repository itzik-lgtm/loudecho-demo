import { useMemo } from 'react';

/**
 * Named AI judges with staggered progress and live verdict counts,
 * shown while the judging phase runs. Each judge owns a subset of
 * the reason taxonomy; flagged counts trickle up with its progress.
 */
const JUDGES = [
  {
    key: 'brand-voice',
    name: 'Brand Voice',
    icon: '🗣',
    detail: 'Tone, messaging, brand alignment',
    reasonTypes: ['brand-voice'],
    window: [0, 70],   // [start%, end%] of the global judge progress
  },
  {
    key: 'visual-qa',
    name: 'Visual QA',
    icon: '👁',
    detail: 'Logo, palette, contrast, layout',
    reasonTypes: ['palette-conflict', 'logo-placement', 'model-obstruction', 'cta-contrast', 'logo-visibility'],
    window: [5, 82],
  },
  {
    key: 'compliance',
    name: 'Compliance',
    icon: '🛡',
    detail: 'Claims, policy, substantiation',
    reasonTypes: ['claim-risk'],
    window: [10, 92],
  },
  {
    key: 'performance',
    name: 'Predicted Performance',
    icon: '📈',
    detail: 'Similarity, fatigue, predicted CTR',
    reasonTypes: ['similarity'],
    window: [15, 100],
  },
];

export default function JudgePanel({ judgeProgress, variants }) {
  // Total flags per judge across the full variant set (computed once)
  const totals = useMemo(() => {
    const t = Object.fromEntries(JUDGES.map(j => [j.key, 0]));
    for (const v of variants) {
      for (const r of v.reasons ?? []) {
        const judge = JUDGES.find(j => j.reasonTypes.includes(r.type));
        if (judge) t[judge.key]++;
      }
    }
    return t;
  }, [variants]);

  return (
    <div className="fade-in rounded-xl border border-brand/20 bg-info-bg/40 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin shrink-0" />
        <span className="text-sm font-semibold text-dark">AI judges reviewing {variants.length} variants…</span>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {JUDGES.map(judge => {
          const [start, end] = judge.window;
          const pct = Math.max(0, Math.min(100, ((judgeProgress - start) / (end - start)) * 100));
          const done = pct >= 100;
          const flagged = Math.round(totals[judge.key] * (pct / 100));
          return (
            <div key={judge.key} className="rounded-lg bg-white border border-line p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{judge.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-dark truncate">{judge.name}</p>
                  <p className="text-[10px] text-low-em truncate">{judge.detail}</p>
                </div>
                {done
                  ? <span className="text-[10px] font-bold text-success shrink-0">✓ Done</span>
                  : <span className="text-[10px] font-semibold text-brand-text shrink-0">{Math.round(pct)}%</span>}
              </div>
              <div className="h-1 rounded-full bg-line-soft overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${done ? 'bg-success' : 'bg-brand'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-med-em tabular-nums">
                <span className={`font-bold ${flagged > 0 ? 'text-amber-600' : 'text-low-em'}`}>{flagged}</span> flagged
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
