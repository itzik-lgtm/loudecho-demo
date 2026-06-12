import { useState, useEffect } from 'react';
import Stepper from './components/Stepper';
import GlobalChat from './components/GlobalChat';
import Scene1Brief from './scenes/Scene1Brief';
import Scene2GenerateJudgeReview from './scenes/Scene2GenerateJudgeReview';
import Scene3LiveDecisions from './scenes/Scene3LiveDecisions';
import Scene4GoLive from './scenes/Scene4GoLive';
import Scene5Results from './scenes/Scene5Results';

const SCENES = [
  Scene1Brief,
  Scene2GenerateJudgeReview,
  Scene3LiveDecisions,
  Scene4GoLive,
  Scene5Results,
];
const RESULTS_INDEX = SCENES.length - 1;

const NAV_ICONS = [
  <svg key="campaigns" width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
  <svg key="analytics" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14L6 9L9 12L13 6L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg key="creative" width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 13v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  <svg key="audiences" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 15c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  <svg key="settings" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.37 13.37l1.41 1.41M3.22 14.78l1.41-1.41M13.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
];

export default function App() {
  const [scene, setScene] = useState(0);
  const [maxScene, setMaxScene] = useState(0);
  const [launched, setLaunched] = useState(false);
  const [campaignConfig, setCampaignConfig] = useState({
    selectedSignalTypes: [],
    selectedChangeTypes: [],
  });
  const next = (config) => {
    if (config) setCampaignConfig(config);
    setScene(s => {
      const n = Math.min(s + 1, SCENES.length - 1);
      setMaxScene(m => Math.max(m, n));
      return n;
    });
  };
  const goTo  = (i) => {
    const clamped = Math.max(0, Math.min(i, SCENES.length - 1));
    if (clamped === RESULTS_INDEX && !launched) return;   // Results locked until launch
    setMaxScene(m => Math.max(m, clamped));
    setScene(clamped);
  };
  const reset = () => {
    setCampaignConfig({ selectedSignalTypes: [], selectedChangeTypes: [] });
    setLaunched(false);
    setMaxScene(0);
    setScene(0);
  };

  // Presenter shortcuts: ←/→ scene nav, Shift+R reset. Ignored while typing.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'ArrowRight' && e.altKey) { e.preventDefault(); goTo(scene + 1); }
      else if (e.key === 'ArrowLeft' && e.altKey) { e.preventDefault(); goTo(scene - 1); }
      else if (e.key === 'R' && e.shiftKey) { e.preventDefault(); reset(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const SceneComponent = SCENES[scene];

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <aside className="w-12 shrink-0 bg-dark flex flex-col items-center py-3 gap-1 z-10">
        <div className="w-7 h-7 rounded-md bg-brand flex items-center justify-center mb-3">
          <span className="font-black text-white text-[9px] leading-none">LE</span>
        </div>
        {NAV_ICONS.map((icon, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              i === 0 ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60 cursor-pointer'
            }`}
          >
            {icon}
          </div>
        ))}
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Stepper current={scene} max={maxScene} onGoTo={goTo} lockedSteps={launched ? [] : [RESULTS_INDEX]} />
        <main key={scene} className="flex-1 overflow-hidden">
          {scene === SCENES.length - 1
            ? <SceneComponent onReset={reset} campaignConfig={campaignConfig} />
            : <SceneComponent onNext={next} onLaunched={() => setLaunched(true)} campaignConfig={campaignConfig} />
          }
        </main>
      </div>

      <GlobalChat scene={scene} />
    </div>
  );
}
