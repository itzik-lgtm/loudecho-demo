import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { IAB_DIMENSIONS } from '../data/adFormats';

/**
 * Absolute-position greedy masonry per the project mosaic spec (CLAUDE.md):
 *  - container width via ResizeObserver
 *  - cols = max(6, floor(width / 150))
 *  - per-format column spans keep every format within ±10% of its IAB width
 *  - shortest-column-first (skyline) placement → dense backfilling
 *  - card heights come from rendered content (aspect-ratio image + metadata),
 *    measured live so expanding panels reflow the layout
 */
const SPANS = { '160×600': 1, '300×250': 2, '300×600': 2, '728×90': 5 };
const GAP = 8;
const META_ESTIMATE = 36; // placeholder until the card's real height is measured

function MasonryItem({ itemKey, x, y, w, observe, unobserve, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    observe(el);
    return () => unobserve(el);
  }, [observe, unobserve]);
  return (
    <div
      ref={ref}
      data-mkey={itemKey}
      style={{ position: 'absolute', top: y, left: x, width: w, transition: 'top 0.25s ease, left 0.25s ease' }}
    >
      {children}
    </div>
  );
}

export default function MasonryGrid({ items, getKey = v => v.id, getAxis = v => v.axis, renderItem }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const heightsRef = useRef(new Map());
  const [measureTick, setMeasureTick] = useState(0);

  // One shared observer measures every card; a height change triggers relayout.
  const roRef = useRef(null);
  if (!roRef.current && typeof ResizeObserver !== 'undefined') {
    roRef.current = new ResizeObserver(entries => {
      let changed = false;
      for (const e of entries) {
        const key = e.target.dataset.mkey;
        const h = e.target.offsetHeight;
        if (Math.abs((heightsRef.current.get(key) ?? 0) - h) > 0.5) {
          heightsRef.current.set(key, h);
          changed = true;
        }
      }
      if (changed) setMeasureTick(t => t + 1);
    });
  }
  useEffect(() => () => roRef.current?.disconnect(), []);

  const observe   = useCallback(el => roRef.current?.observe(el), []);
  const unobserve = useCallback(el => roRef.current?.unobserve(el), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const { positions, totalHeight } = useMemo(() => {
    if (!width) return { positions: new Map(), totalHeight: 0 };
    const cols = Math.max(6, Math.floor(width / 150));
    const colW = (width - GAP * (cols - 1)) / cols;
    const colHeights = new Array(cols).fill(0);
    const positions = new Map();
    for (const item of items) {
      const axis = getAxis(item);
      const span = Math.min(SPANS[axis] ?? 2, cols);
      const w = span * colW + (span - 1) * GAP;
      const key = String(getKey(item));
      const [iw, ih] = IAB_DIMENSIONS[axis] ?? [300, 250];
      const h = heightsRef.current.get(key) ?? (w * ih / iw + META_ESTIMATE);
      // Skyline: leftmost start position whose span-window has the lowest top
      let best = 0, bestY = Infinity;
      for (let i = 0; i + span <= cols; i++) {
        let y = 0;
        for (let j = i; j < i + span; j++) if (colHeights[j] > y) y = colHeights[j];
        if (y < bestY - 0.5) { bestY = y; best = i; }
      }
      positions.set(key, { x: best * (colW + GAP), y: bestY, w });
      const newTop = bestY + h + GAP;
      for (let j = best; j < best + span; j++) colHeights[j] = newTop;
    }
    return { positions, totalHeight: Math.max(0, ...colHeights) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, width, measureTick]);

  return (
    <div ref={containerRef} style={{ position: 'relative', height: totalHeight }}>
      {width > 0 && items.map(item => {
        const key = String(getKey(item));
        const pos = positions.get(key);
        if (!pos) return null;
        return (
          <MasonryItem key={key} itemKey={key} x={pos.x} y={pos.y} w={pos.w} observe={observe} unobserve={unobserve}>
            {renderItem(item)}
          </MasonryItem>
        );
      })}
    </div>
  );
}
