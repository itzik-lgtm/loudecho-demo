# LoudEcho Demo — Redesign Recommendation

_Prepared 2026-06-11. Status: awaiting approval before implementation._

---

## 1. Current app assessment

A 5-scene linear SPA (Vite + React 19 + Tailwind): Brief → Generate/Judge/Review → Decision Replay → User Journey → Go Live, with a global chat sidebar. ~2,700 lines of scene code, ~1,700 of components, a thoughtful seeded data layer, and real infrastructure: Claude vision for image analysis, Gemini for regeneration, Postgres for advertisers — all proxied through Vite middleware so no keys reach the browser. 77 real Ramp production creatives are vendored locally.

**Genuinely strong:** data realism (seeded PRNG, log-normal latency, power-law serving), animation polish, the closed ecosystem of variants ↔ articles ↔ decisions ↔ journey, presenter keyboard shortcuts, graceful API fallbacks.

**Genuinely weak:** Scene 2's grid violates the project's own mosaic layout spec (CLAUDE.md); Scene 2 carries 20+ interdependent state hooks; Scene 1 takes too long to reach the magic; Scene 3's abstract 25-event feed duplicates what Scene 4 shows better with narrative; there is no closing ROI moment; the chat is keyword-brittle.

## 2. Biggest UX problems

1. **Slow ramp to the aha.** Scene 1 requires upload → analysis → multi-select config before anything magical happens. A live presenter burns 2+ minutes on setup.
2. **Two scenes tell one story.** Replay (Scene 3) and Journey (Scene 4) both demonstrate decisioning explainability. Replay does it abstractly (25 anonymous events); Journey does it memorably (one person, three contexts). Viewers retain the second and forget the first.
3. **No payoff screen.** The demo ends on "Campaign live." — the buyer's actual question ("did it work?") is never answered.
4. **Scene 2 undersells the aha.** The variant grid is a uniform CSS grid: same-height rows, clustered sizes, whitespace. It reads as a thumbnail gallery, not 247 distinct IAB creatives materializing.

## 3. Biggest product-story problems

1. The value proposition ("one seed → hundreds of judged, on-brand variants") peaks at Scene 2 and the demo coasts downhill for three more scenes.
2. ROI is never quantified. Buyers (the chosen primary audience) need a number to repeat internally.
3. Live API calls are a stall/failure risk mid-pitch with no demo-mode toggle.
4. Decisioning credibility is diluted across two scenes rather than concentrated in one.

## 4. Highest-impact improvement opportunities

| Impact | Effort | Change |
|---|---|---|
| ★★★ | M | Day-7 Results scene — closes the ROI loop |
| ★★★ | L | Scene 2 masonry rebuild + generation spectacle — amplifies the aha |
| ★★★ | S | Compress Scene 1 to a 30-second setup |
| ★★ | M | Merge Replay into Journey (live-serving interlude → one user) |
| ★★ | S | Demo-mode flag for all live APIs |
| ★ | S | Visual consistency pass (CTAs done; typography/density next) |

## 5. Recommended demo narrative

**"One ad in. A campaign out. Proof in seven days."**

1. _Setup (30s)_ — "Here's Ramp's seed ad. The system already read it — voice, palette, weak spots. We pick what can change and what signals to target."
2. _The aha (2 min)_ — "Watch. 247 variants across four IAB formats, every one judged for brand safety before a human sees it. We approve the launch pool in one click, override anything we want."
3. _Proof of intelligence (90s)_ — "It's serving. [burst of live decisions] Now follow one person — Jordan — through their day. Three contexts, three different creatives, every choice explained."
4. _Launch (20s)_ — "We go live."
5. _Payoff (60s)_ — "Seven days later: +38% CTR vs the static baseline, here are the winning creatives the system discovered, here's the reach, and here's the funnel down to demos booked."

Total: ~5 minutes presenter-led, with natural pause points for questions.

## 6. Recommended app structure

Keep: Vite + React + Tailwind, App.jsx scene-index state machine, campaignConfig threading, Vite middleware APIs, global chat sidebar, keyboard shortcuts.

Add:
- `src/lib/demoMode.js` — `VITE_DEMO_MODE` (default `true`): scripted instant responses for analyze-image and generate-variant; live APIs opt-in.
- `src/data/report.js` — deterministic Day-7 results derived from `launchPool` via the existing seeded simulator, extended with CTR-by-topic/format and a static-creative baseline.
- `useReducer`-based state for Scene 2 (resolutions, clusters, overrides in one reducer).

## 7. Recommended page/scene flow

| # | Stepper label | Content | Source |
|---|---|---|---|
| 1 | Campaign Brief | Pre-filled Ramp brief, analysis pre-run, smart defaults selected; presenter tweaks one thing and generates | Compressed Scene 1 |
| 2 | Generate & Review | Masonry mosaic, streaming counter, judge verdicts landing live, buckets, one-click launch-pool approval | Rebuilt Scene 2 |
| 3 | Live Decisions | 5–10s live-serving burst (reuses decision stream) → focus on Jordan's 3-touchpoint journey with expandable traces | Merged Scenes 3+4 |
| 4 | Go Live | Advertiser hero, pool stats, launch animation → "Campaign live." → CTA "Jump to Day 7 →" | Current Scene 5 |
| 5 | Results | Day-7 report: uplift vs baseline, variant leaderboard, coverage, journey funnel | New |

Replay's vertical/volume selectors are dropped (defaults baked in); projected stats move to the Results scene where they belong.

## 8. Recommended visual direction

**Premium enterprise SaaS** — evolve the existing light design language (Inter, glass cards, #0090FF brand, #110c22 dark) rather than restart. Specific moves:
- Tighter scene headers (current ones are airy); denser stat cards.
- One accent moment per scene (e.g., the streaming variant counter), everything else sober.
- Consistent CTA system (already unified to `bg-dark rounded-lg` this session) + the outline-button secondary tier.
- No dark mode in this pass.

## 9. Recommended interaction model

Presenter-led. Manual advance everywhere (no auto-play past a scene boundary), pause-on-hover preserved in streams, Alt+←/→ and Shift+R kept. No tooltips/onboarding copy — the presenter is the narration. Every animated sequence must be skippable with a click for pacing control.

## 10. Recommended data/model changes

- **report.js**: `buildReport(launchPool, config)` → `{ uplift, baselineCtr, ctrByTopic, ctrByFormat, leaderboard[12], coverage, journeyFunnel }` — seeded, deterministic, derived from the same simulator math.
- **Scene 2 reducer**: one `variantsReducer` owning `resolutions`, `overrides`, `clusterFeedback`; derived selectors for buckets/counts.
- **demoMode.js**: scripted analysis response (the current DEFAULT_ANALYSIS), scripted regeneration (existing mock path), both instant or near-instant.
- **journey.js**: add `INTERLUDE_EVENT_COUNT` config; interlude reuses `generateDecisionStream` — no new generator.
- No TypeScript migration in this pass (worthwhile, but orthogonal to demo quality).

## 11. Recommended asset/content changes

- Ramp only, deeper: tighten brief/voice/journey copy to Ramp's actual challenger tone ("Slay the receipt monster").
- Variant leaderboard in Results reuses vendored creatives — no new assets needed.
- Other advertisers remain picker decoration (no second brand track).

## 12. What to preserve

App.jsx state machine and threading; Stepper; SceneHeader; DecisionFunnel; PublisherPageMock; AdCreative; AdLightbox; AdvertiserLogo; the entire data/lib layer (variants, decisions, simulator, articles, adFormats); Vite middleware; chat sidebar behavior; Scene 4's touchpoint design (it becomes the heart of Scene 3); Scene 5's launch animation.

## 13. What to redesign

- Scene 1: compress to single-screen setup with pre-run analysis.
- Scene 3 (new): journey-first with serving interlude.
- Scene headers/density: tighter typography pass.

## 14. What to rebuild

- Scene 2 grid → absolute-position masonry per CLAUDE.md (ResizeObserver, greedy shortest-column, format spans 1/2/2/5, heights from aspect-ratio).
- Scene 2 state → useReducer.
- VariantCard → split into CardImage / SignalBadges / ReasonsPanel / RefinePanel (563 LOC today).

## 15. What to simplify

- Cut the standalone Replay scene (its trace UI lives on in journey touchpoints).
- Cut Replay's vertical/volume config strip.
- Delete dead code: PageBackground.jsx, unused Toast usage.
- Chat: keep keyword matching (it's demo-scripted anyway) but extract the panel if-cascade into a lookup table.

## 16. Implementation plan

1. **demoMode** flag + scripted responses (de-risks everything after).
2. **Scene 1 compression** (small, independent).
3. **Scene 2 rebuild**: masonry first (validated against all 4 formats at 3 viewport widths), then reducer refactor, then spectacle layer (counter, verdict animations).
4. **Scene 3 merge**: build interlude, port journey in, wire traces, delete old Scene 3.
5. **Results scene**: report.js + UI.
6. **Go Live touch-up**: add "Jump to Day 7 →" handoff.
7. **Polish pass**: headers, density, copy, stepper labels.
8. **Full dry run** end-to-end at presentation pacing.

## 17. Phased roadmap

- **Phase 1 (foundation, ~1 day):** demoMode, Scene 1 compression, dead-code cleanup. _Demo improved even if we stop here._
- **Phase 2 (the aha, ~2–3 days):** Scene 2 masonry + reducer + spectacle. _Highest risk, highest payoff._
- **Phase 3 (the story, ~1–2 days):** merged Live Decisions scene, Results scene, Go Live handoff.
- **Phase 4 (polish, ~1 day):** visual pass, copy, dry run, pacing fixes.

Each phase lands in a working state; the demo is presentable between phases.

## 18. Files likely to change

| File | Change |
|---|---|
| `src/scenes/Scene1Brief.jsx` | Major compression |
| `src/scenes/Scene2GenerateJudgeReview.jsx` | Rebuild (grid, reducer, spectacle) |
| `src/scenes/Scene3Replay.jsx` | Deleted (parts moved) |
| `src/scenes/Scene4Journey.jsx` | Becomes Scene 3 "Live Decisions" + interlude |
| `src/scenes/Scene5GoLive.jsx` | Minor (Day-7 handoff) |
| `src/scenes/Scene6Results.jsx` | New |
| `src/components/VariantCard.jsx` | Split into 4 components |
| `src/components/MasonryGrid.jsx` | New |
| `src/data/report.js`, `src/lib/demoMode.js` | New |
| `src/App.jsx`, `src/components/Stepper.jsx` | Scene list update |
| `src/data/chat.js` | Scene-index remap, new Results suggestions |

## 19. Risks and trade-offs

- **Masonry rebuild** is the big one (est. 40% regression risk): VariantCard rendering, lightbox positioning, filter-driven re-layout all touch it. Mitigation: build `MasonryGrid` standalone, validate with all formats before wiring judging/filtering.
- **Scene 2 reducer refactor** can break cluster auto-advance and regeneration retry. Mitigation: do it as a separate commit from the layout change.
- **Losing Replay** loses the "scale of decisions" feel — mitigated by the interlude burst, but if it underwhelms we can lengthen it.
- **Day-7 numbers are fictional**: they must be plainly framed as projections/simulations to keep buyer trust. Copy matters.
- **Scene-index remap** touches chat suggestions, stepper, keyboard nav — easy but easy to miss a spot.

## 20. Open questions

1. Results scene: is "+38% CTR vs static baseline" the right headline magnitude, or do you have a real benchmark figure you'd rather anchor to?
2. Interlude length: 5s vs 10s burst before zooming into Jordan — preference, or tune in dry-run?
3. Should the stepper allow jumping ahead to Results before launching (presenter flexibility) or lock until Go Live completes?
4. Keep `RECOMMENDATION.md` in the repo after implementation, or delete once shipped?
