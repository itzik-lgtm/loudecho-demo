export default function SceneHeader({ title, subtitle, badge, cta, children }) {
  return (
    <div className="glass-card-solid px-6 py-4 border-b border-line shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-dark text-xl leading-tight">{title}</h2>
            {badge && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-success-bg text-success shrink-0">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-low-em mt-0.5">{subtitle}</p>}
        </div>
        {cta && (
          <button
            onClick={cta.onClick}
            className="bg-dark text-white font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm shrink-0"
          >
            {cta.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
