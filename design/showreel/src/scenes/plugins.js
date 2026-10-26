import { prog, ease, mix } from '../ease.js';
import { el, put, text } from '../dom.js';
import { appWindow, pane, sheet, setCursor, RIGHT_X } from '../chrome.js';
import { icon } from '../icons.js';
import { LEFT } from '../data.js';
import { PHOTOS, MODULES } from '../data-roadmap.js';
import { active, modal, sheetSlide } from './common.js';

const T = { open: 0.7, install: 3.6, col: 4.0, settings: 5.95, toggle: 7.9 };
const PERMS = [
  ['ok', 'check', 'Read the files you select and the folder you are in', 'fs.read = ${selection}, ${pane}'],
  ['no', 'ban', 'No changes to files', 'fs.write = []'],
  ['no', 'ban', 'No network', 'network = []'],
  ['no', 'ban', 'No programs', 'process = []'],
];
const CATS = [['palette', 'Appearance'], ['dir', 'Files'], ['cmd', 'Keys'], ['copy', 'Copy and move'], ['eye', 'Viewer'], ['terminal', 'Terminal'], ['puzzle', 'Modules'], ['sliders', 'Experimental']];

export default {
  id: 'plugins',
  dur: 11,
  captions: [[0.8, 5.4, 'Plugins run sandboxed, with permissions you approve.', 'Planned · 2.0'], [6.2, 10.4, 'Modules turn off without a restart.', 'Planned · beta']],
  keys: [[3.55, 'Enter'], [5.9, 'Ctrl ,'], [7.9, 'Space']],
  build() {
    const node = el('<div class="scene-root"></div>');
    const win = appWindow();
    const left = pane(LEFT, { x: 12 });
    const right = pane({ ...PHOTOS, extra: 'Dimensions' }, { x: RIGHT_X });
    const scrim = el('<div class="scrim"></div>');
    const dlg = el(`<div class="dialog install" style="left:450px;top:110px">
      <div class="ih"><div class="ptile">${icon('puzzle')}</div><div><h2>Install Image columns?</h2><p class="mono">dev.example.image-columns · 0.3.1 · from a folder</p></div></div>
      <p class="idesc">Adds a Dimensions column for JPG, PNG, HEIC and WebP files.</p>
      <div class="ptitle">It asks to</div>
      ${PERMS.map(([k, ic, label, code]) => `<div class="perm ${k}">${icon(ic)}<span>${label}</span><span class="pc mono">${code}</span></div>`).join('')}
      <div class="sandbox">${icon('shield')}<span>Runs in its own sandbox with a 64 MB memory limit. Nothing runs until you approve.</span></div>
      <div class="btns"><div class="btn">Cancel <span class="kbd">Esc</span></div><div class="btn primary">Install <span class="kbd">Enter</span></div></div></div>`);
    const mods = MODULES.map((m, i) => `<div class="mod ${i === 0 ? 'cur' : ''}"><span class="mi">${icon(m.icon)}</span><div><div class="mn">${m.name}${m.fresh ? '<span class="newbadge">new</span>' : ''}</div><div class="mnote">${m.note}</div></div><span class="tog ${m.on ? 'on' : ''}"><i></i></span></div>`).join('');
    const st = sheet('settings', { x: 12, w: 782 }, `
      <div class="sh-head"><div class="sh-icon">${icon('sliders')}</div><div class="sh-name">Settings</div><div class="sfind">${icon('search')}Find a setting<span class="kbd">Ctrl+F</span></div><span class="sh-close kbd">Esc</span></div>
      <div class="sbody"><nav>${CATS.map(([ic, n]) => `<div class="cat ${n === 'Modules' ? 'on' : ''}">${icon(ic)}${n}</div>`).join('')}</nav>
        <div class="mods"><h3><span>Modules</span><span>6 installed</span></h3>${mods}<div class="offnote">${icon('check')}Git status is off. It uses no memory and starts nothing.</div></div></div>`);
    win.append(left.node, right.node, st, scrim, dlg);
    node.append(win);
    return { node, left, right, scrim, dlg, st, perms: [...dlg.querySelectorAll('.perm')], tog: st.querySelector('.mod.cur .tog'), offnote: st.querySelector('.offnote'), mods: [...st.querySelectorAll('.mod')] };
  },
  render(r, t) {
    active(r.left, r.right, 'right');
    setCursor(r.left, 2, 0.4); setCursor(r.right, 1, 1);
    modal(r.dlg, t, T.open, T.install, r.scrim);
    r.perms.forEach((p, i) => put(p, prog(t, T.open + 0.2 + i * 0.07, 0.35), `translateY(${(1 - prog(t, T.open + 0.2 + i * 0.07, 0.35)) * 6}px)`));
    const c = prog(t, T.col, 0.6, ease.inOut);
    r.right.node.style.setProperty('--x-w', `${(132 * c).toFixed(1)}px`);
    r.right.node.style.setProperty('--x-o', prog(t, T.col + 0.3, 0.4).toFixed(3));
    sheetSlide(r.st, t, T.settings, undefined, -830);
    r.mods.forEach((m, i) => put(m, prog(t, T.settings + 0.25 + i * 0.05, 0.35), ''));
    r.tog.classList.toggle('on', t < T.toggle);
    r.tog.style.setProperty('--k', (1 - prog(t, T.toggle, 0.2, ease.inOut)).toFixed(3));
    put(r.offnote, prog(t, T.toggle + 0.2, 0.3), '');
  },
};
