import { prog, ease } from '../ease.js';
import { el, put, text, clamp01 } from '../dom.js';
import { appWindow, pane, RIGHT_X, setCursor } from '../chrome.js';
import { jobStrip } from '../parts.js';
import { icon } from '../icons.js';
import { LEFT, RIGHT } from '../data.js';
import { ROW } from '../script.js';
import { cursorIndex, active, modal } from './common.js';

const T = { dialogOpen: 2.48, dialogClose: 3.75, stripIn: 3.9, copyStart: 4.1, copyEnd: 6.5, stripOut: 7.7, marksClear: 6.6 };
const MARKS = { 6: 1.0, 7: 1.35, 8: 1.7 };

export default {
  id: 'copy',
  dur: 8.6,
  captions: [[2.3, 7.6, 'Every copy is planned, then journaled.']],
  keys: [[0.2, 'Down'], [0.32, 'Down'], [0.44, 'Down'], [0.56, 'Down'], [1.0, 'Insert'], [1.35, 'Insert'], [1.7, 'Insert'], [2.4, 'F5'], [3.7, 'Enter']],
  build() {
    const node = el('<div class="scene-root"></div>');
    const win = appWindow();
    const left = pane(LEFT, { x: 12 });
    const right = pane(RIGHT, { x: RIGHT_X });
    const strip = jobStrip('Copying 3 files to E:\\Archive\\releases', 'Copied 3 files to E:\\Archive\\releases · verified');
    const scrim = el('<div class="scrim"></div>');
    const dialog = el(`<div class="dialog" style="left:500px;top:220px">
      <h2>Copy 3 files</h2>
      <dl><dt>From</dt><dd class="mono">D:\\Work\\aurora</dd><dt>To</dt><dd class="mono">E:\\Archive\\releases</dd>
        <dt>Mode</dt><dd><span class="chip on">Auto</span><span class="chip">Verify: fast hash</span><span class="chip">Conflicts: ask</span></dd></dl>
      <div class="plan">${icon('check')}<span>Plan: 3 files, 10.3 MB, no conflicts. Journaled, so a crash can be undone.</span></div>
      <div class="btns"><div class="btn">Cancel <span class="kbd">Esc</span></div><div class="btn primary">Copy <span class="kbd">Enter</span></div></div>
    </div>`);
    win.append(left.node, right.node, strip.node, scrim, dialog);
    node.append(win);
    return { node, left, right, strip, scrim, dialog };
  },
  render(r, t) {
    active(r.left, r.right, 'left');
    setCursor(r.left, cursorIndex(t, [[0.2, 3], [0.32, 4], [0.44, 5], [0.56, 6], [1.0, 7], [1.35, 8], [1.7, 9]], 2));
    setCursor(r.right, 0, 0.4);
    r.left.rows.forEach((row, i) => row.el.classList.toggle('marked', MARKS[i] !== undefined && t >= MARKS[i] && t < T.marksClear));
    const span = T.copyEnd - T.copyStart;
    let y = 0;
    r.right.rows.forEach((row) => {
      const appear = row.data.copy ? prog(t, T.copyStart + row.data.copy * span, 0.3) : 1;
      put(row.el, appear, `translateY(${y + (row.data.copy ? (1 - appear) * -6 : 0)}px)`);
      y += ROW * appear;
    });
    const marked = Object.values(MARKS).filter((at) => t >= at && t < T.marksClear).length;
    text(r.left.foot, ['10 files, 5 folders · 71.2 MB', '1 of 10 marked · 2.4 MB', '2 of 10 marked · 3.5 MB', '3 of 10 marked · 10.3 MB'][marked]);
    const cp = clamp01((t - T.copyStart) / span);
    const copied = [0.23, 0.34, 1].filter((c) => cp >= c).length;
    text(r.right.foot, ['3 files, 2 folders · 2.6 MB', '4 files, 2 folders · 5.0 MB', '5 files, 2 folders · 6.1 MB', '6 files, 2 folders · 12.9 MB'][copied]);

    modal(r.dialog, t, T.dialogOpen, T.dialogClose, r.scrim);
    const st = r.strip;
    const inn = prog(t, T.stripIn, 0.45, ease.drawer);
    const out = prog(t, T.stripOut, 0.35);
    put(st.node, inn > 0.001 ? 1 - out : 0, `translateY(${(1 - inn) * 72 + out * 24}px)`);
    st.fill.style.transform = `scaleX(${cp.toFixed(4)})`;
    text(st.nums, `${(cp * 10.3).toFixed(1)} of 10.3 MB · ${Math.round(cp * 100)}%`);
    put(st.done, prog(t, T.copyEnd + 0.05, 0.25), '');
  },
};
