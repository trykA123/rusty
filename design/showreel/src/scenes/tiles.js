import { prog, mix, ease } from '../ease.js';
import { el, put, camera, clamp01, text } from '../dom.js';
import { appWindow, pane, setRect, setCursor, RIGHT_X, PANE_TOP, PANE_H } from '../chrome.js';
import { LEFT, RIGHT } from '../data.js';
import { LOGS, PHOTOS } from '../data-roadmap.js';

const BOTTOM = PANE_TOP + PANE_H;

export function buildQuad(win) {
  const a = pane(LEFT, { x: 12 });
  const b = pane({ ...RIGHT, rows: RIGHT.rows.filter((row) => !row.copy) }, { x: RIGHT_X });
  const c = pane(LOGS, { x: 1600, w: 0 });
  const d = pane({ ...PHOTOS, compact: true, drive: null, tabs: ['2026-10'] }, { x: 1600, w: 0 });
  const ring = el('<div class="focusring"></div>');
  [a, b, c, d].forEach((p) => { p.ring.style.opacity = '0'; win.append(p.node); });
  win.append(ring);
  text(a.foot, '10 files, 5 folders · 71.2 MB');
  text(b.foot, '3 files, 2 folders · 2.6 MB');
  return { a, b, c, d, ring };
}

export function quadRects(s1, s2) {
  const a = { x: 12, y: PANE_TOP, w: 782, h: PANE_H };
  const b = { x: RIGHT_X, y: PANE_TOP, w: mix(782, 385, s1), h: PANE_H };
  const cx = RIGHT_X + b.w + 12;
  const c = { x: cx, y: PANE_TOP, w: Math.max(0, 1588 - cx), h: mix(PANE_H, 371, s2) };
  const dy = PANE_TOP + c.h + 12;
  const d = { x: cx, y: dy, w: c.w, h: Math.max(0, BOTTOM - dy) };
  return { a, b, c, d };
}

export function layoutQuad(q, s1, s2) {
  const rects = quadRects(s1, s2);
  ['a', 'b', 'c', 'd'].forEach((k) => setRect(q[k], rects[k]));
  q.b.node.style.setProperty('--date-w', `${(164 * clamp01((rects.b.w - 560) / 220)).toFixed(1)}px`);
  put(q.c.node, clamp01(s1 * 3), '');
  put(q.d.node, clamp01(s2 * 3), '');
  return rects;
}

export function ringTo(ring, rects, focus, t) {
  let prev = focus[0][1], cur = focus[0][1], at = -1;
  for (const [time, k] of focus) {
    if (t < time) break;
    prev = cur; cur = k; at = time;
  }
  const p = at < 0 ? 1 : prog(t, at, 0.32, ease.inOut);
  const A = rects[prev], B = rects[cur];
  const r = { x: mix(A.x, B.x, p), y: mix(A.y, B.y, p), w: mix(A.w, B.w, p), h: mix(A.h, B.h, p) };
  Object.assign(ring.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
  return cur;
}

const FOCUS = [[0, 'b'], [1.55, 'c'], [3.35, 'd'], [5.2, 'c'], [5.8, 'b'], [6.4, 'a']];
const CAM = [{ t: 0, s: 1, fx: 960, fy: 540 }, { t: 4.6, s: 1.03, fx: 1010, fy: 540 }, { t: 8.4, s: 1, fx: 960, fy: 540 }];

export default {
  id: 'tiles',
  dur: 9.6,
  captions: [[0.9, 5.4, 'Split into as many panes as you need.', 'Planned'], [5.8, 9.0, 'Move between them from the keyboard.', 'Planned']],
  keys: [[1.4, 'Ctrl \\'], [3.2, 'Ctrl -'], [5.2, 'Alt Up'], [5.8, 'Alt Left'], [6.4, 'Alt Left']],
  build() {
    const node = el('<div class="scene-root"><div class="world"></div></div>');
    const win = appWindow();
    const q = buildQuad(win);
    node.firstChild.append(win);
    return { node, world: node.firstChild, q };
  },
  render(r, t) {
    camera(r.world, CAM, t);
    const s1 = prog(t, 1.5, 0.9, ease.inOut);
    const s2 = prog(t, 3.3, 0.9, ease.inOut);
    const rects = layoutQuad(r.q, s1, s2);
    const cur = ringTo(r.q.ring, rects, FOCUS, t);
    const cin = prog(t, 1.8, 0.5), din = prog(t, 3.6, 0.5);
    r.q.c.rows.forEach((row, i) => put(row.el, prog(t, 1.85 + i * 0.03, 0.4) * cin, `translateY(${i * 30}px)`));
    r.q.d.rows.forEach((row, i) => put(row.el, prog(t, 3.65 + i * 0.03, 0.4) * din, `translateY(${i * 30}px)`));
    ['a', 'b', 'c', 'd'].forEach((k, i) => setCursor(r.q[k], [2, 0, 3, 4][i], k === cur ? 1 : 0.4));
  },
};
