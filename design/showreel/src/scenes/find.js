import { prog, steps, ease } from '../ease.js';
import { el, put, text } from '../dom.js';
import { appWindow, pane, sheet, setCursor, RIGHT_X } from '../chrome.js';
import { icon } from '../icons.js';
import { LEFT, RIGHT } from '../data.js';
import { FOUND, ZIP } from '../data-roadmap.js';
import { active, sheetSlide } from './common.js';

const T = { open: 0.75, find: 2.4, mark: [4.2, 4.5, 4.8], tab: 5.9, enter: 6.6 };
const TYPING = [[1.15, 'C'], [1.25, 'CAN'], [1.38, 'CAN_'], [1.5, 'CAN_TI'], [1.62, 'CAN_TIME'], [1.75, 'CAN_TIMEOU'], [1.85, 'CAN_TIMEOUT']];

export default {
  id: 'find',
  dur: 11,
  captions: [[0.8, 5.5, 'Find by content. The results become a pane.', 'Planned · 1.0'], [6.3, 10.4, 'Archives open like folders.', 'Planned · 1.0']],
  keys: [[0.7, 'Alt F7'], [2.35, 'Enter'], [4.2, 'Insert'], [4.5, 'Insert'], [4.8, 'Insert'], [5.9, 'Tab'], [6.6, 'Enter']],
  build() {
    const node = el('<div class="scene-root"></div>');
    const win = appWindow();
    const left = pane(LEFT, { x: 12 });
    const zip = pane({ ...ZIP, crumbIcon: 'archive' }, { x: 12 });
    const right = pane({ ...RIGHT, rows: RIGHT.rows.filter((row) => !row.copy) }, { x: RIGHT_X });
    const found = pane(FOUND, { x: RIGHT_X });
    const fs = sheet('findsheet', { x: RIGHT_X, w: 782 }, `
      <div class="sh-head"><div class="sh-icon">${icon('search')}</div><div><div class="sh-name">Find files</div><div class="sh-path">In D:\\Work\\aurora and every folder below</div></div><span class="sh-close kbd">Esc</span></div>
      <div class="field"><label>File names</label><div class="input mono">*.c *.h</div></div>
      <div class="field"><label>Containing text</label><div class="input mono on"><span class="typed"></span><span class="caret"></span></div></div>
      <div class="opts"><span class="chip on">${icon('check')}Match case</span><span class="chip">Whole word</span><span class="chip">Regex</span><span class="chip on">${icon('check')}Respect .gitignore</span></div>
      <div class="field two"><div><label>Size</label><div class="input">Any</div></div><div><label>Changed</label><div class="input">Any time</div></div></div>
      <div class="btns"><div class="btn">Save search</div><div class="btn primary">Find <span class="kbd">Enter</span></div></div>
      <h3><span>Saved searches</span><span>3</span></h3>
      <div class="saved"><div>${icon('search')}TODO in src</div><div>${icon('search')}Logs over 50 MB</div><div>${icon('search')}Changed today</div></div>`);
    win.append(left.node, zip.node, right.node, found.node, fs);
    node.append(win);
    return { node, left, zip, right, found, fs, typed: fs.querySelector('.typed') };
  },
  render(r, t) {
    sheetSlide(r.fs, t, T.open, T.find + 0.05);
    text(r.typed, steps(t, TYPING, ''));
    const sw = prog(t, T.find + 0.1, 0.3);
    put(r.right.node, 1 - sw, '');
    put(r.found.node, sw, '');
    let shown = 0;
    r.found.rows.forEach((row, i) => {
      const v = prog(t, T.find + 0.3 + i * 0.11, 0.35);
      if (v > 0.5) shown++;
      put(row.el, v, `translateY(${i * 30 + (1 - v) * 6}px)`);
      row.el.classList.toggle('marked', T.mark.some((m, k) => t >= m && i === k + 1));
    });
    const marked = T.mark.filter((m) => t >= m).length;
    text(r.found.foot, marked ? `${marked} of 9 marked · 12 hits` : shown < 9 ? `Searching… ${shown} files` : FOUND.foot);
    const side = t >= T.tab ? 'left' : sw > 0.5 ? 'right' : 'left';
    active(r.left, r.found, side);
    active(r.zip, r.right, side);
    r.right.ring.style.opacity = '0';
    setCursor(r.found, Math.min(4, 1 + marked), side === 'right' ? 1 : 0.4);
    setCursor(r.right, 0, 0.4);
    setCursor(r.left, 13, side === 'left' ? 1 : 0.4);
    setCursor(r.zip, 0, 1);
    text(r.left.foot, '10 files, 5 folders · 71.2 MB');
    const z = prog(t, T.enter + 0.05, 0.3);
    put(r.left.node, 1 - z, '');
    put(r.zip.node, z, '');
    r.zip.rows.forEach((row, i) => {
      const v = prog(t, T.enter + 0.1 + i * 0.035, 0.4);
      put(row.el, v, `translateY(${i * 30 + (1 - v) * 6}px)`);
    });
  },
};
