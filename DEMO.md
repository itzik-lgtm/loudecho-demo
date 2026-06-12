# LoudEcho Demo — Presenter Run-Sheet

Target runtime: **6–8 minutes**. Run `npm run dev`, open the printed URL, full-screen the browser.

## Shortcuts

| Key | Action |
|---|---|
| `Alt + →` / `Alt + ←` | Next / previous scene |
| `Shift + R` | Reset the whole demo |
| `Esc` | Close lightbox / chat |
| Stepper arrows (top-right) | Mouse alternative for scene nav |

## Offline mode

The demo runs fully offline except two optional live-AI beats. To force-mock them, set in `.env.local`:

```
VITE_USE_MOCK_ANALYZE=true        # Scene 1 image analysis (else live Claude)
VITE_USE_MOCK_NANO_BANANA=true    # Scene 2 regeneration (else live Gemini)
```

All 85 ad creatives are vendored in `public/ramp/creatives/` — no network needed for images.

## Act 1 — Campaign Brief (~60s)

**Line: "One creative and one brief is all we need."**

1. Point at the campaign config strip (objective, flight, budget) — "this is a real campaign setup."
2. Advertiser dropdown — show the brand roster, stay on **Ramp**.
3. Seed creative is pre-loaded with its AI analysis. *Optional live beat:* upload a fresh image → Claude analyzes it live (~5s).
4. Signal types & change types — note the ✦ marks are AI recommendations.
5. CTA → **Generate variants**.

## Act 2 — Generate · Judge · Approve (~2.5min) — THE AHA

**Line: "247 contextualized variants in seconds — and the AI polices itself."**

1. Let the grid stream (~10s). Talk over it: every variant is contextualized by topic, format, audience, journey stage.
2. Judging starts automatically: **four named judges** (Brand Voice, Visual QA, Compliance, Predicted Performance) run with live flag counts. Tab badges fill as verdicts land.
3. Tabs: Recommended / Needs Review / Blocked — "humans approve by exception, not by reviewing 247 ads."
4. Click **Approve recommended launch pool**, then open one Needs-Review cluster: show the reason, metric, suggested fix. *Optional live beat:* hit Regenerate with feedback → Gemini produces a new image live.
5. CTA → **Run pre-launch replay**.

## Act 3 — Decision Replay (~2min)

**Line: "Watch the engine choose — every impression explained."**

1. Leave Finance / 5M defaults. Press **▶ Start replay**.
2. Decision cards stream in (~30s). **Hover pauses the feed.** Click any card → full trace: signals → candidate funnel (158 → … → 1) → winner + reason + latency.
3. Point at a **NO FILL** card — "the engine also knows when *not* to serve, and says why."
4. Right rail accumulates: fill rate, p50/p95, distinct ads, topic mix.
5. Completion band extrapolates to full volume. CTA → **Follow one user's journey**.

## Act 4 — Journey (~2min) — THE CLIMAX

**Line: "One person, three contexts, three different decisions."**

1. Persona card: Jordan, VP Finance, Austin. Stage chips light up as you advance.
2. Touchpoint 1: Reuters economy article, **728×90** awareness creative, New Visitor. Walk the decision trace.
3. **Next touchpoint** → ESPN article, **300×250** sports-contextualized retargeting (he visited ramp.com). Same brand, totally different creative — point at the "Why this ad" box.
4. **Next touchpoint** → Bloomberg CFO article, **300×600**, "Book a demo" → **Demo booked**.
5. Recap strip shows all three ads side-by-side. Close on the line under "Demo booked."

## Anywhere — Global Assistant

Floating button, bottom-right. Best beat (during Act 3 or 4): click suggestion **"Only serve lifestyle variants on sports content"** → a serving rule is created in plain English. Other scripted queries: CNN breakdown, underperformers, pool stats.

## Recovery

- Stepper is always clickable — jump to any scene.
- Every scene is self-sufficient (Replay/Journey work even without a launch pool from Act 2).
- `Shift + R` resets everything.
