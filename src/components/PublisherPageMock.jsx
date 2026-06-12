import AdCreative from './AdCreative';

/**
 * A simulated publisher article page inside a mini browser frame,
 * with the winning ad rendered in its real slot. Three generic
 * templates (news / sports / finance) — no real mastheads.
 */
const TEMPLATES = {
  news:    { masthead: 'The Daily Wire Report', accent: '#b91c1c', tag: 'MARKETS' },
  sports:  { masthead: 'The Sports Desk',       accent: '#15803d', tag: 'NFL' },
  finance: { masthead: 'Capital Journal',       accent: '#1d4ed8', tag: 'FINANCE' },
};

function TextBlock({ lines = 3, short = false }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-2 rounded bg-gray-200/80"
          style={{ width: short && i === lines - 1 ? '55%' : `${88 + ((i * 7) % 12)}%` }}
        />
      ))}
    </div>
  );
}

export default function PublisherPageMock({ template, article, creative, onAdClick }) {
  const t = TEMPLATES[template] ?? TEMPLATES.news;
  const isLeaderboard = creative.axis === '728×90';
  const adEl = (
    <AdCreative
      imageUrl={creative.imageUrl}
      axis={creative.axis}
      cta={creative.cta}
      onClick={onAdClick}
      className="rounded-sm ring-2 ring-brand ring-offset-2 cursor-zoom-in shadow-lg"
    />
  );

  return (
    <div className="rounded-xl border border-line overflow-hidden bg-white shadow-sm">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-line">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-low-em font-mono truncate border border-line-soft">
          {article.url}
        </div>
      </div>

      {/* Page */}
      <div className="px-5 py-4 space-y-3 bg-white">
        {/* Masthead */}
        <div className="flex items-center justify-between border-b-2 pb-2" style={{ borderColor: t.accent }}>
          <span className="font-black text-sm tracking-tight" style={{ color: t.accent }}>{t.masthead}</span>
          <span className="text-[9px] font-bold tracking-widest text-low-em">{t.tag}</span>
        </div>

        {/* Leaderboard slot above the headline */}
        {isLeaderboard && <div className="py-1">{adEl}</div>}

        {/* Headline + byline */}
        <div>
          <h3 className="font-bold text-dark text-base leading-snug">{article.title}</h3>
          <p className="text-[10px] text-low-em mt-1">{article.byline}</p>
        </div>

        {/* Body + right-rail ad slot */}
        {isLeaderboard ? (
          <div className="space-y-3">
            <TextBlock lines={4} />
            <TextBlock lines={3} short />
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="flex-1 space-y-3 min-w-0">
              <TextBlock lines={4} />
              <TextBlock lines={4} />
              <TextBlock lines={3} short />
              {creative.axis === '300×600' && <TextBlock lines={4} />}
            </div>
            <div className={creative.axis === '300×600' ? 'w-[38%] shrink-0' : 'w-[42%] shrink-0'}>
              {adEl}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
