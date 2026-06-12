# LoudEcho Demo — Project Constraints

## Ad Mosaic Layout (non-negotiable)

These rules apply to every scene that renders ad variant cards. Evaluate every layout iteration against all five criteria before shipping.

### 1. Mosaic-style layout
The grid must feel like a dynamic mosaic. Not uniform rows, not size-based sections. Vary placement to create visual interest and maximize space utilization.

### 2. Preserve ad dimensions (±10% rule)
Each ad must maintain its original IAB aspect ratio. Scaling is allowed only within ±10% of the original pixel dimensions. Never distort an ad's shape to fit a grid cell.

### 3. Maximize page density
Minimize whitespace, gaps, and unused areas. Use `grid-auto-flow: dense` and optimize span assignments so the grid back-fills gaps.

### 4. Mix ad sizes throughout — no size grouping
Do not group ads by format. 728×90, 300×600, 300×250, and 160×600 must be interleaved across the layout. No section should contain only one size.

### 5. Layout quality criteria
- High space utilization
- Balanced visual weight across the page
- No obvious clusters of similarly sized ads
- No large empty regions unless absolutely unavoidable

---

## IAB Ad Formats (source of truth)

| Format   | Width (px) | Height (px) | Aspect ratio |
|----------|-----------|-------------|--------------|
| 728×90   | 728       | 90          | 8.09:1       |
| 300×250  | 300       | 250         | 1.2:1        |
| 300×600  | 300       | 600         | 0.5:1        |
| 160×600  | 160       | 600         | 0.267:1      |

---

## Grid Implementation (JS masonry, absolute positioning)

**Never use CSS Grid with fixed row heights or CSS `columns` for the variant mosaic.** Both force uniform row/column sizes that create whitespace.

Use a greedy absolute-position masonry:
1. Measure container width via `ResizeObserver` on the scrollable grid div.
2. Compute column count: `cols = Math.max(6, Math.floor(containerWidth / 150))`.
3. For each variant, find the column group (shortest-column-first) where it fits.
4. Place it with `position: absolute`, `top`, `left`, `width` computed from col spans.
5. Card height = `imageWidth × aspectRatio + METADATA_H` (no fixed row heights).

Column spans per format — keeps every format within ±10% of its IAB pixel width at ~150px/col:

| Format  | Span | Display width | Δ from actual |
|---------|------|---------------|---------------|
| 160×600 | 1    | ~150px        | ≤ 7%          |
| 300×250 | 2    | ~310px        | ≤ 4%          |
| 300×600 | 2    | ~310px        | ≤ 4%          |
| 728×90  | 5    | ~795px        | ≤ 9%          |

Heights are set automatically by `aspectRatio` on the image container — never hardcode them.
