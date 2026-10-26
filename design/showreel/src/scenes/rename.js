import { prog, steps, ease } from '../ease.js';
import { el, put, text, html } from '../dom.js';
import { appWindow, pane, setCursor, RIGHT_X } from '../chrome.js';
import { noticeStrip } from '../parts.js';
import { icon } from '../icons.js';
import { PHOTOS, EXPORTS, RENAME } from '../data-roadmap.js';
import { active, modal } from './common.js';

const T = { markAll: 0.4, open: 1.05, phase1: 2.5, phase2: 4.0, enter: 4.9, undo: 7.0 };
const TYPING = [
  [1.4, 'h'], [1.5, 'harb'], [1.6, 'harbour'], [1.7, 'harbour_'], [1.85, 'harbour_[='], [1.95, 'harbour_[=exif'], [2.1, 'harbour_[=exif.da'], [2.25, 'harbour_[=exif.date'], [2.4, 'harbour_[=exif.date]'],
  [3.6, 'harbour_[=exif.date]_'], [3.7, 'harbour_[=exif.date]_[C'], [3.85, 'harbour_[=exif.date]_[C]'],
];
const DUP = new Set([0, 1, 2, 3, 4]);

const ext = (n) => n.slice(n.lastIndexOf('.'));
const newName = (row, phase) => (phase === 0 ? row[0] : phase === 1 ? `harbour_${row[1]}${ext(row[0])}` : `harbour_${row[1]}_${row[2]}${ext(row[0])}`);

export default {
  id: 'rename',
  dur: 10,
  captions: [[1.3, 5.3, 'Rename a batch. Problems show before anything changes.'], [6.7, 9.5, 'One Ctrl+Z puts every name back.']],
  keys: [[0.4, 'Ctrl A'], [1.0, 'Ctrl M'], [4.85, 'Enter'], [7.0, 'Ctrl Z']],
  build() {
    const node = el('<div class="scene-root"></div>');
    const win = appWindow();
    const left = pane(PHOTOS, { x: 12 });
    const right = pane(EXPORTS, { x: RIGHT_X });
    const strip = noticeStrip();
    const scrim = el('<div class="scrim"></div>');
    const rows = RENAME.map((r) => `<div class="rr"><span class="k-image">${icon('image')}</span><span class="old mono">${r[0]}</span><span class="arrow">${icon('Right')}</span><span class="new mono"></span><span class="st"></span></div>`).join('');
    const dlg = el(`<div class="dialog rename" style="left:230px;top:96px">
      <div class="dh"><h2>Rename 8 files</h2><span class="chip">Preset: Last used</span><span class="sp"></span><span class="kbd">Esc</span></div>
      <div class="rgrid">
        <div class="field wide"><label>Name pattern</label><div class="input mono on"><span class="typed"></span><span class="caret"></span></div></div>
        <div class="field"><label>Extension</label><div class="input mono">[E]</div></div>
        <div class="field"><label>Counter</label><div class="input mono">from 1 · step 1 · 3 digits</div></div>
      </div>
      <div class="opts"><span class="chip">Find and replace</span><span class="chip">Case: unchanged</span><span class="chip on">${icon('check')}Trim spaces</span><span class="chip">Spaces to _</span><span class="chip">Remove accents</span></div>
      <div class="rhead"><span></span><span>Old name</span><span></span><span>New name</span><span>Check</span></div>
      <div class="rrows">${rows}</div>
      <div class="rfoot"><span class="rstate"></span><span class="sp"></span><div class="btn">Cancel <span class="kbd">Esc</span></div><div class="btn primary">Rename <span class="kbd">Enter</span></div></div>
    </div>`);
    win.append(left.node, right.node, strip.node, scrim, dlg);
    node.append(win);
    return {
      node, left, right, strip, scrim, dlg, typed: dlg.querySelector('.typed'),
      rr: [...dlg.querySelectorAll('.rr')], news: [...dlg.querySelectorAll('.new')], sts: [...dlg.querySelectorAll('.st')], rstate: dlg.querySelector('.rstate'),
      names: left.rows.slice(1).map((row) => ({ nm: row.el.querySelector('.nm'), ext: row.el.querySelector('.ext') })),
    };
  },
  render(r, t) {
    active(r.left, r.right, 'left');
    setCursor(r.left, 1); setCursor(r.right, 0, 0.4);
    r.left.rows.forEach((row, i) => row.el.classList.toggle('marked', i > 0 && t >= T.markAll + i * 0.02 && t < T.enter + 0.4));
    text(r.left.foot, t >= T.markAll && t < T.enter + 0.4 ? '8 of 8 marked · 41.6 MB' : PHOTOS.foot);

    modal(r.dlg, t, T.open, T.enter, r.scrim);
    text(r.typed, steps(t, TYPING, '[N]'));
    const phase = t >= T.phase2 ? 2 : t >= T.phase1 ? 1 : 0;
    r.rr.forEach((row, i) => {
      const at = phase === 2 ? T.phase2 : T.phase1;
      const v = phase ? prog(t, at + i * 0.04, 0.3) : 1;
      text(r.news[i], newName(RENAME[i], phase));
      r.news[i].style.opacity = (0.35 + 0.65 * v).toFixed(3);
      const dup = phase === 1 && DUP.has(i);
      row.classList.toggle('bad', dup);
      html(r.sts[i], dup ? `${icon('alert')}Same name as row ${i < 3 ? (i === 0 ? 2 : 1) : i === 3 ? 5 : 4}` : phase === 2 ? `${icon('check')}OK` : '');
    });
    text(r.rstate, phase === 1 ? '5 problems: duplicate names · Enter jumps to the first' : phase === 2 ? '8 files ready · all or nothing · undo with Ctrl+Z' : '8 files · type a pattern');
    r.rstate.classList.toggle('bad', phase === 1);

    const renamed = (i) => t >= T.enter + 0.3 + i * 0.05 && t < T.undo + 0.15 + i * 0.05;
    r.names.forEach((n, i) => {
      const nn = renamed(i) ? newName(RENAME[i], 2) : RENAME[i][0];
      const dot = nn.lastIndexOf('.');
      text(n.nm, nn.slice(0, dot));
      text(n.ext, nn.slice(dot + 1));
      const at = t < T.undo ? T.enter + 0.3 + i * 0.05 : T.undo + 0.15 + i * 0.05;
      const v = prog(t, at, 0.3);
      n.nm.style.opacity = (0.4 + 0.6 * v).toFixed(3);
    });

    const s = r.strip;
    const on = prog(t, T.enter + 0.35, 0.4, ease.drawer) * (1 - prog(t, 9.4, 0.3));
    put(s.node, on > 0.001 ? 1 : 0, `translateY(${(1 - on) * 72}px)`);
    const undone = t >= T.undo + 0.1;
    html(s.icon, icon(undone ? 'undo' : 'check'));
    text(s.label, undone ? 'Put back 8 names' : 'Renamed 8 files in P:\\Photos\\2026-10');
    html(s.hint, undone ? 'Journal entry closed' : '<span class="kbd">Ctrl+Z</span> undo');
  },
};
