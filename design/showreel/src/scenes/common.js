import { prog, mix, ease } from '../ease.js';
import { put } from '../dom.js';
import { ROW } from '../script.js';

export function cursorIndex(t, events, initial = 0) {
  let prev = initial, cur = initial, at = -1;
  for (const [time, idx] of events) {
    if (t < time) break;
    prev = cur; cur = idx; at = time;
  }
  return at < 0 ? initial : mix(prev, cur, prog(t, at, 0.09));
}

export function introRows(p, t, start, step = 0.035) {
  p.rows.forEach((row, i) => {
    const v = prog(t, start + i * step, 0.5);
    put(row.el, v, `translateY(${i * ROW + (1 - v) * 8}px)`);
  });
}

export function paneIn(p, t, start) {
  const v = prog(t, start, 0.7);
  put(p.node, v, `translateY(${(1 - v) * 16}px)`);
}

export function sheetSlide(node, t, open, close, dist = 830) {
  const o = prog(t, open, 0.5, ease.drawer);
  const c = close === undefined ? 0 : prog(t, close, 0.36);
  const shown = o * (1 - c);
  put(node, shown > 0.001 ? 1 : 0, `translateX(${(1 - shown) * dist}px)`);
  return shown;
}

export function modal(node, t, open, close, scrim) {
  const o = prog(t, open, 0.22) * (1 - prog(t, close ?? Infinity, 0.18));
  put(node, o, `translateY(${(1 - o) * 10}px) scale(${mix(0.97, 1, o)})`);
  if (scrim) put(scrim, o, '');
  return o;
}

export function marks(p, set) {
  p.rows.forEach((row, i) => row.el.classList.toggle('marked', set.has(i)));
}

export function active(left, right, side) {
  left.ring.style.opacity = side === 'left' ? '1' : '0';
  right.ring.style.opacity = side === 'right' ? '1' : '0';
}
