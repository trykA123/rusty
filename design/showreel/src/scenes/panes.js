import { prog, mix, ease } from '../ease.js';
import { el, put, camera, text } from '../dom.js';
import { appWindow, pane, RIGHT_X, setCursor } from '../chrome.js';
import { folderSheet } from '../parts.js';
import { LEFT, RIGHT, SHEET } from '../data.js';
import { cursorIndex, introRows, paneIn, active } from './common.js';

const T = { sheetOpen: 5.35, sheetClose: 10.55 };
const CAM = [
  { t: 0, s: 1.16, fx: 860, fy: 470 },
  { t: 3.4, s: 1, fx: 960, fy: 540 },
  { t: 5.5, s: 1, fx: 960, fy: 540 },
  { t: 7.3, s: 1.2, fx: 1010, fy: 494 },
  { t: 9.8, s: 1.22, fx: 1016, fy: 490 },
  { t: 11.2, s: 1, fx: 960, fy: 540 },
];

export default {
  id: 'panes',
  dur: 12,
  captions: [[1.5, 5.6, 'Two panes. Every action on a key.'], [6.4, 10.4, 'A preview when you ask for one.']],
  keys: [[3.0, 'Down'], [3.3, 'Down'], [5.3, 'F3'], [10.5, 'Esc']],
  build() {
    const node = el('<div class="scene-root"><div class="world"></div></div>');
    const win = appWindow();
    const left = pane(LEFT, { x: 12 });
    const right = pane({ ...RIGHT, rows: RIGHT.rows.filter((row) => !row.copy) }, { x: RIGHT_X });
    const sheet = folderSheet();
    win.append(left.node, right.node, sheet.node);
    node.firstChild.append(win);
    return { node, world: node.firstChild, win, left, right, sheet };
  },
  render(r, t) {
    camera(r.world, CAM, t);
    const rise = prog(t, 0, 1.1);
    r.win.style.transform = `translateY(${(1 - rise) * 30}px) scale(${mix(0.985, 1, rise)})`;
    paneIn(r.left, t, 0.25);
    paneIn(r.right, t, 0.37);
    introRows(r.left, t, 0.55);
    introRows(r.right, t, 0.65);
    const rows = prog(t, 0.7, 0.4);
    setCursor(r.left, cursorIndex(t, [[3.0, 1], [3.3, 2]]), rows);
    setCursor(r.right, 0, rows * 0.4);
    active(r.left, r.right, 'left');
    text(r.left.foot, '10 files, 5 folders · 71.2 MB');
    text(r.right.foot, '3 files, 2 folders · 2.6 MB');

    const s = r.sheet;
    const open = prog(t, T.sheetOpen, 0.5, ease.drawer);
    const close = prog(t, T.sheetClose, 0.36);
    const shown = open * (1 - close);
    put(s.node, shown > 0.001 ? 1 : 0, `translateX(${(1 - shown) * 830}px)`);
    s.tree.forEach((n, i) => {
      const p = prog(t, T.sheetOpen + 0.2 + i * 0.04, 0.4);
      put(n, p, `translateY(${(1 - p) * 6}px)`);
    });
    s.tiles.forEach((n, i) => {
      const p = prog(t, T.sheetOpen + 0.4 + i * 0.06, 0.45);
      put(n, p, `translateY(${(1 - p) * 8}px)`);
    });
    const count = prog(t, T.sheetOpen + 0.45, 1.9);
    SHEET.stats.forEach((st, i) => text(s.values[i], st.fmt(st.to * count)));
    s.types.forEach((n, i) => {
      put(n, prog(t, T.sheetOpen + 0.6 + i * 0.08, 0.45), '');
      s.bars[i].style.transform = `scaleX(${prog(t, T.sheetOpen + 0.7 + i * 0.08, 0.9)})`;
    });
  },
};
