import { useState, useRef, useEffect } from 'react';
import { CHAT_SCRIPTS, SCENE_SUGGESTIONS, FALLBACK_RESPONSE } from '../data/chat';
import { CNN_EVENTS, UNDERPERFORMING } from '../data/simulation';
import AdLightbox from './AdLightbox';

function matchScript(input) {
  const lower = input.toLowerCase();
  return CHAT_SCRIPTS.find(s => s.keywords.every(k => lower.includes(k))) || null;
}

/** Data card rendered inline under a bot message. */
function PanelCard({ panel, onImageClick }) {
  if (panel === 'cnn-table') return (
    <div className="glass-card rounded-xl overflow-hidden fade-in">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-line-soft">
            <th className="text-left px-2.5 py-2 text-low-em font-semibold">Cohort</th>
            <th className="text-left px-2.5 py-2 text-low-em font-semibold">Variant</th>
            <th className="text-left px-2.5 py-2 text-low-em font-semibold">Conf.</th>
          </tr>
        </thead>
        <tbody>
          {CNN_EVENTS.map(e => (
            <tr key={e.id} className="border-b border-gray-50 row-fade-in">
              <td className="px-2.5 py-2 font-medium text-dark">{e.cohort}</td>
              <td className="px-2.5 py-2 text-med-em">
                <div className="flex items-center gap-1.5">
                  <img src={e.img} className="w-9 h-6 rounded object-cover cursor-pointer hover:opacity-80 shrink-0" alt="" onClick={() => onImageClick(e)} />
                  <span className="leading-snug">{e.variant}</span>
                </div>
              </td>
              <td className="px-2.5 py-2"><span className="font-bold text-brand-text">{e.confidence}%</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (panel === 'underperforming') return (
    <div className="space-y-2 fade-in">
      {UNDERPERFORMING.map(v => (
        <div key={v.id} className="glass-card rounded-xl p-3 flex gap-3 items-start">
          <img src={v.img} className="w-14 h-10 rounded-lg object-cover shrink-0 cursor-pointer hover:opacity-80" alt="" onClick={() => onImageClick(v)} />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-dark text-xs leading-snug">{v.variant}</span>
              <span className="text-[10px] bg-red-100 text-fail font-bold px-1.5 py-0.5 rounded-full shrink-0">CTR {v.ctr}</span>
            </div>
            <p className="text-[10px] text-med-em leading-snug">{v.reason}</p>
          </div>
        </div>
      ))}
    </div>
  );

  if (panel === 'rule-created') return (
    <div className="glass-card rounded-xl p-4 space-y-3 fade-in">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center font-bold text-sm shrink-0">✓</div>
        <div>
          <p className="font-bold text-dark text-sm">Rule created</p>
          <p className="text-[10px] text-low-em">Active immediately · ~12% of daily impressions</p>
        </div>
      </div>
      <div className="bg-info-bg border border-brand/20 rounded-lg px-3 py-2.5">
        <p className="text-xs font-semibold text-dark leading-snug">On sports content → serve lifestyle variants only</p>
      </div>
    </div>
  );

  if (panel === 'pool-stats') return (
    <div className="space-y-2 fade-in">
      {[
        { label: 'Auto-approved',          count: 89,  pct: 36, color: 'bg-success' },
        { label: 'Pending human review',   count: 42,  pct: 17, color: 'bg-amber-400' },
        { label: 'Serving live',           count: 116, pct: 47, color: 'bg-brand' },
      ].map(s => (
        <div key={s.label} className="glass-card rounded-xl p-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-semibold text-dark text-xs">{s.label}</span>
            <span className="font-bold text-dark text-sm tabular-nums">{s.count}</span>
          </div>
          <div className="h-1.5 bg-line-soft rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );

  return null;
}

export default function GlobalChat({ scene = 0 }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const bottomRef = useRef(null);

  const suggestions = SCENE_SUGGESTIONS[scene] ?? SCENE_SUGGESTIONS[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape' && !lightbox) setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, lightbox]);

  const send = (text) => {
    const q = (text || input).trim();
    if (!q || typing) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: q }]);
    setTyping(true);

    const script = matchScript(q);
    setTimeout(() => {
      setMessages(m => [...m, {
        role: 'bot',
        text: script ? script.response : FALLBACK_RESPONSE,
        panel: script?.panel ?? null,
      }]);
      setTyping(false);
    }, 1100);
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[900] w-12 h-12 rounded-full bg-dark text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
          title="LoudEcho Assistant"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 10a7 7 0 1 1 3.2 5.88L3 17l1.12-3.2A6.97 6.97 0 0 1 3 10z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-brand border-2 border-white" />
        </button>
      )}

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-y-0 right-0 z-[950] w-[440px] max-w-full bg-white border-l border-line shadow-2xl flex flex-col slide-in-right">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-line shrink-0">
            <div className="w-8 h-8 rounded-md bg-brand flex items-center justify-center shrink-0">
              <span className="font-black text-white text-[10px]">LE</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-dark text-sm">LoudEcho Assistant</p>
              <p className="text-[10px] text-success font-semibold">● Online · operating 247 live variants</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-med-em hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <div className="text-3xl">💬</div>
                <p className="text-xs text-low-em max-w-[260px] mx-auto">
                  Ask about your live campaign — performance, decisions, or create a serving rule in plain English.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className="space-y-2">
                <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-dark text-white rounded-br-md'
                      : 'bg-gray-100 text-dark rounded-bl-md'
                  }`}>
                    {m.text}
                  </div>
                </div>
                {m.panel && <PanelCard panel={m.panel} onImageClick={setLightbox} />}
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-low-em animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions + input */}
          <div className="border-t border-line p-3 space-y-2 shrink-0">
            <div className="flex gap-1.5 flex-wrap">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[10px] font-medium text-brand-text border border-brand/30 bg-info-bg/50 px-2.5 py-1 rounded-full hover:bg-info-bg transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="Ask the assistant…"
                className="flex-1 text-xs border border-line rounded-lg px-3 py-2.5 outline-none focus:border-brand transition-colors"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || typing}
                className="bg-brand text-white text-xs font-semibold px-4 rounded-lg hover:bg-brand-text transition-colors disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <AdLightbox
          imageUrl={lightbox.img}
          axis={lightbox.axis}
          cta={lightbox.cta}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
