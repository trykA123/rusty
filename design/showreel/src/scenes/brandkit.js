import { prog, mix } from '../ease.js';
import { el, put, clamp01 } from '../dom.js';
import { logo, wordmark } from '../icons.js';

export function buildBrand(prefix, tag, small) {
  const node = el(`<div class="brand"><div class="lockup">${logo("logo-tile", prefix)}${wordmark(`wm-${prefix}`)}</div>
    <div class="tag">${tag}</div><div class="small">${small}</div></div>`);
  const q = (s) => node.querySelector(s);
  return {
    node, tile: q(`#${prefix}-tile`), f: q(`#${prefix}-f`), e: q(`#${prefix}-e`), cursor: q(`#${prefix}-cursor`),
    letters: [...node.querySelectorAll(`[id^="wm-${prefix}-l"]`)], bar: q(`#wm-${prefix}-bar`),
    tag: q('.tag'), small: q('.small'), lockup: q('.lockup'),
  };
}

export function brandIn(b, t, start) {
  const tile = prog(t, start, 0.9);
  put(b.tile, tile, `scale(${mix(0.94, 1, tile)})`);
  [b.f, b.e].forEach((g, i) => {
    const p = prog(t, start + 0.3 + i * 0.12, 0.7);
    put(g, p, `translateY(${(1 - p) * 14}px)`);
  });
  const c = prog(t, start + 0.75, 0.6);
  put(b.cursor, c, `translateX(${(1 - c) * -24}px) scaleX(${mix(0.4, 1, c)})`);
  b.letters.forEach((l, i) => {
    const p = prog(t, start + 1.0 + i * 0.05, 0.7);
    put(l, p, `translateY(${(1 - p) * 10}px)`);
  });
  const bar = prog(t, start + 1.45, 0.6);
  put(b.bar, bar, `scaleX(${mix(0.3, 1, bar)})`);
  const tag = prog(t, start + 1.8, 0.8);
  put(b.tag, tag, `translateY(${(1 - tag) * 12}px)`);
  const small = prog(t, start + 2.3, 0.8);
  put(b.small, small, `translateY(${(1 - small) * 12}px)`);
  b.lockup.style.transform = `scale(${mix(1, 1.025, clamp01((t - start) / 6))})`;
}
