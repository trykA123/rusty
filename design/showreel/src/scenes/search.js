import { prog, steps } from '../ease.js';
import { el, put, camera, text } from '../dom.js';
import { appWindow, pane, RIGHT_X, setCursor } from '../chrome.js';
import { palette } from '../parts.js';
import { LEFT, RIGHT, PALETTE } from '../data.js';
import { cursorIndex, active } from './common.js';

const T = { open: 0.68, close: 5.08, files: 2.9 };
const TYPING = [
  [1.1, 'c'], [1.25, 'co'], [1.4, 'cop'],
  [2.6, ''],
  [2.9, 'n'], [3.03, 'no'], [3.16, 'not'], [3.29, 'note'], [3.42, 'notes'],
];
const CAM = [
  { t: 0, s: 1, fx: 960, fy: 540 },
  { t: 0.7, s: 1, fx: 960, fy: 540 },
  { t: 2.3, s: 1.2, fx: 960, fy: 494 },
  { t: 4.9, s: 1.22, fx: 960, fy: 490 },
  { t: 6.3, s: 1, fx: 960, fy: 540 },
];

function highlight(label, q) {
  const at = q ? label.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at < 0) return label;
  return `${label.slice(0, at)}<em>${label.slice(at, at + q.length)}</em>${label.slice(at + q.length)}`;
}

export default {
  id: 'search',
  dur: 7.4,
  captions: [[1.2, 5.4, 'One box for commands, folders and files.']],
  keys: [[0.6, 'Ctrl K'], [5.0, 'Shift Enter']],
  build() {
    const node = el('<div class="scene-root"><div class="world"></div></div>');
    const win = appWindow();
    const left = pane(LEFT, { x: 12 });
    const right = pane({ ...RIGHT, rows: RIGHT.rows.filter((row) => !row.copy) }, { x: RIGHT_X });
    const scrim = el('<div class="scrim"></div>');
    const pal = palette();
    win.append(left.node, right.node, scrim, pal.node);
    node.firstChild.append(win);
    return { node, world: node.firstChild, left, right, scrim, pal, last: null };
  },
  render(r, t) {
    camera(r.world, CAM, t);
    const side = t >= 5.1 ? 'right' : 'left';
    active(r.left, r.right, side);
    setCursor(r.left, 2, side === 'left' ? 1 : 0.4);
    setCursor(r.right, cursorIndex(t, [[5.1, 5]]), side === 'right' ? 1 : 0.4);
    text(r.left.foot, '10 files, 5 folders · 71.2 MB');
    text(r.right.foot, '3 files, 2 folders · 2.6 MB');

    const p = r.pal;
    const o = prog(t, T.open, 0.1) * (1 - prog(t, T.close, 0.1));
    put(p.node, o, '');
    put(r.scrim, 0.8 * prog(t, T.open, 0.25) * (1 - prog(t, T.close, 0.25)), '');
    const q = steps(t, TYPING, '');
    const filesPhase = t >= T.files;
    put(p.commands, filesPhase ? 0 : 1, '');
    put(p.files, filesPhase ? 1 : 0, '');
    if (q !== r.last) {
      r.last = q;
      p.typed.textContent = q;
      p.ph.style.display = q ? 'none' : '';
      p.labels.forEach((l) => { l.innerHTML = highlight(l.dataset.label, q); });
      const set = filesPhase ? PALETTE.files : PALETTE.commands;
      p.count.textContent = q ? set.counts[Math.min(q.length, set.counts.length) - 1] : 'Recent commands';
    }
  },
};
