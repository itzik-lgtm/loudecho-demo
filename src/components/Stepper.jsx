const SCENES = [
  'Campaign Brief',
  'Generate & Review',
  'Live Decisions',
  'Go Live',
  'Results',
];

export default function Stepper({ current, onGoTo, lockedSteps = [] }) {
  const locked = new Set(lockedSteps);
  const canBack    = current > 0;
  const canForward = current < SCENES.length - 1 && !locked.has(current + 1);

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-line px-4 py-0 flex items-stretch h-14">
      {/* Steps */}
      <div className="flex items-center gap-0.5 flex-1">
        {SCENES.map((name, i) => {
          const done      = i < current;
          const active    = i === current;
          const isLocked  = locked.has(i);
          const clickable = i !== current && !isLocked;
          return (
            <div key={i} className="flex items-center gap-0.5 flex-1">
              <div
                onClick={clickable ? () => onGoTo(i) : undefined}
                title={isLocked ? 'Launch the campaign to unlock' : undefined}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  active   ? 'bg-dark text-white' :
                  isLocked ? 'text-low-em/60 cursor-not-allowed' :
                  done     ? 'text-brand-text cursor-pointer hover:bg-info-bg' :
                             'text-low-em cursor-pointer hover:bg-gray-100 hover:text-med-em'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                  active ? 'bg-brand text-white' :
                  done   ? 'bg-info-bg text-brand-text' :
                           'bg-gray-100 text-low-em'
                }`}>
                  {isLocked ? '🔒' : done ? '✓' : i + 1}
                </span>
                <span className={active || done ? '' : 'hidden lg:inline'}>{name}</span>
              </div>
              {i < SCENES.length - 1 && (
                <div className={`h-px flex-1 mx-1 transition-all ${done ? 'bg-brand/40' : 'bg-line-soft'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Nav arrows + scene counter */}
      <div className="flex items-center gap-1 pl-4 border-l border-line shrink-0">
        <button
          onClick={() => onGoTo(current - 1)}
          disabled={!canBack}
          className="w-7 h-7 rounded-md flex items-center justify-center text-med-em hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous scene"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="text-xs text-low-em font-medium w-8 text-center tabular-nums">
          {current + 1} / {SCENES.length}
        </span>
        <button
          onClick={() => onGoTo(current + 1)}
          disabled={!canForward}
          className="w-7 h-7 rounded-md flex items-center justify-center text-med-em hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next scene"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}
