/**
 * Candidate-narrowing funnel — the explainability core shared by
 * the decision replay and journey scenes.
 * Renders steps as chips with counts: 158 → 42 → 18 → 6 → 1.
 */
export default function DecisionFunnel({ funnel, compact = false }) {
  const noFill = funnel[funnel.length - 1]?.count === 0;
  return (
    <div className={`flex items-center flex-wrap ${compact ? 'gap-1' : 'gap-1.5'}`}>
      {funnel.map((f, i) => {
        const last = i === funnel.length - 1;
        const isWinner = last && !noFill;
        const isZero = last && noFill;
        return (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1 ${
              isWinner ? 'bg-success-bg border-success/30' :
              isZero   ? 'bg-red-50 border-red-200' :
              i === 0  ? 'bg-gray-50 border-line' :
                         'bg-white border-line'
            }`}>
              <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-medium ${
                isWinner ? 'text-success' : isZero ? 'text-fail' : 'text-med-em'
              }`}>
                {f.step}
              </span>
              <span className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-bold tabular-nums ${
                isWinner ? 'text-success' : isZero ? 'text-fail' : 'text-dark'
              }`}>
                {f.count}
              </span>
            </div>
            {!last && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-low-em shrink-0">
                <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
